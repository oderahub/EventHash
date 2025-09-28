import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  Client,
  AccountId,
  PrivateKey,
  TopicMessageSubmitTransaction,
  TopicId,
  Hbar,
} from '@hashgraph/sdk'

export const runtime = 'nodejs'

// -------------------------
// Validation schema
// -------------------------
const CheckinSchema = z.object({
  eventId: z.string().min(3),
  tokenId: z.string().min(3),
  serialNumber: z.number().int().nonnegative(),
  ownerAccountId: z.string().optional(),
})

// -------------------------
// Config
// -------------------------
const MIRROR =
  process.env.HEDERA_MIRROR_URL || 'https://testnet.mirrornode.hedera.com'

// -------------------------
// Hedera client builder
// -------------------------
function buildClient() {
  const operatorId = process.env.HEDERA_ACCOUNT_ID
  const operatorKey = process.env.HEDERA_PRIVATE_KEY
  const network = (process.env.HEDERA_NETWORK || 'testnet').toLowerCase()

  if (!operatorId || !operatorKey) {
    throw new Error('Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in environment.')
  }

  const client =
    network === 'mainnet'
      ? Client.forMainnet()
      : network === 'previewnet'
      ? Client.forPreviewnet()
      : Client.forTestnet()

  client.setOperator(AccountId.fromString(operatorId), PrivateKey.fromString(operatorKey))
  return client
}

// -------------------------
// Mirror node fetch
// -------------------------
async function fetchNftOwner(tokenId: string, serialNumber: number) {
  const url = `${MIRROR}/api/v1/tokens/${encodeURIComponent(
    tokenId
  )}/nfts/${encodeURIComponent(String(serialNumber))}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Mirror owner lookup failed: ${res.status}`)
  const json = await res.json()
  const owner =
    json?.account_id || json?.owner_account_id || json?.accountId || null
  if (!owner) throw new Error('NFT not found or owner unknown')
  return owner
}

// -------------------------
// API Route
// -------------------------
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = CheckinSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { eventId, tokenId, serialNumber, ownerAccountId } = parsed.data

    // Validate NFT ownership via mirror node
    const currentOwner = await fetchNftOwner(tokenId, serialNumber)
    if (ownerAccountId && ownerAccountId !== currentOwner) {
      return NextResponse.json(
        {
          success: false,
          error: `Ownership mismatch: provided ${ownerAccountId} but current owner is ${currentOwner}`,
        },
        { status: 400 }
      )
    }

    // Build message
    const msg = JSON.stringify({
      type: 'TICKET_CHECKED_IN',
      data: {
        eventId,
        ticketTokenId: tokenId,
        serialNumber,
        owner: currentOwner,
        checkedInAt: Date.now(),
      },
      timestamp: Date.now(),
    })

    // Submit to Hedera
    const client = buildClient()
    const submit = new TopicMessageSubmitTransaction()
      .setTopicId(TopicId.fromString(eventId))
      .setMessage(msg)
      .setMaxTransactionFee(new Hbar(2))

    const res = await submit.execute(client)

    return NextResponse.json(
      {
        success: true,
        data: {
          transactionId: res.transactionId.toString(),
          eventId,
          tokenId,
          serialNumber,
          owner: currentOwner,
        },
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: unknown }).message)
        : 'Failed to check in ticket'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
