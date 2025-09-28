import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import path from 'path';
import { promises as fs } from 'fs';
import { HederaEventService } from '@/lib/hedera-event-service';

export const runtime = 'nodejs';

const dataFile = path.join(process.cwd(), 'src', 'shared', 'data', 'events.json');
const MIRROR = process.env.HEDERA_MIRROR_URL || 'https://testnet.mirrornode.hedera.com';

const PurchaseSchema = z.object({
  eventId: z.string().min(3),
  buyerAccountId: z.string().min(3),
  paymentTxId: z.string().min(10),
  ticketTokenId: z.string().optional(),
  ticketPrice: z.number().nonnegative().optional(),
});

interface Event {
  hederaEventId?: string;
  hederaTopicId?: string;
  hederaTicketTokenId?: string;
  price?: number;
}

interface Transfer {
  account: string;
  amount: number;
}

async function readEvents(): Promise<Event[]> {
  try {
    const raw = await fs.readFile(dataFile, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.mkdir(path.dirname(dataFile), { recursive: true });
      await fs.writeFile(dataFile, '[]', 'utf-8');
      return [];
    }
    throw err;
  }
}

async function verifyPayment(
  paymentTxId: string,
  buyer: string,
  operator: string,
  minHbar: number,
) {
  const url = `${MIRROR}/api/v1/transactions/${encodeURIComponent(paymentTxId)}?details=true`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Mirror query failed: ${res.status}`);
  const json = await res.json();

  // Mirror response can be either { transactions: [...] } or a direct object
  const tx = (json.transactions && json.transactions[0]) || json;
  const transfers = tx?.transfers || [];
  if (!Array.isArray(transfers)) throw new Error('Mirror payload missing transfers');

  const tinybar = (hbar: number) => Math.floor(hbar * 100_000_000);

  const sent = transfers.find((t: Transfer) => t.account === buyer)?.amount || 0;
  const received = transfers.find((t: Transfer) => t.account === operator)?.amount || 0;

  // sent should be negative (buyer sends), received should be positive (operator receives)
  if (sent >= 0 || received <= 0) throw new Error('Payment transfer direction invalid');

  if (Math.abs(sent) < tinybar(minHbar) || received < tinybar(minHbar)) {
    throw new Error('Payment amount below required price');
  }

  return true;
}

export async function POST(req: NextRequest) {
  try {
    const operator = process.env.HEDERA_ACCOUNT_ID;
    if (!operator || !process.env.HEDERA_PRIVATE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in environment' },
        { status: 500 },
      );
    }

    const body = await req.json();
    const parsed = PurchaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const { eventId, buyerAccountId, paymentTxId } = parsed.data;
    let { ticketTokenId, ticketPrice } = parsed.data;

    // Look up defaults from events.json if not provided
    if (!ticketTokenId || ticketPrice === undefined) {
      const events = await readEvents();
      const evt = events.find((e) => e.hederaEventId === eventId || e.hederaTopicId === eventId);
      if (!evt) {
        return NextResponse.json(
          { success: false, error: 'Event not found or not deployed' },
          { status: 404 },
        );
      }
      ticketTokenId = ticketTokenId ?? evt.hederaTicketTokenId;
      ticketPrice = ticketPrice ?? evt.price;
    }

    if (!ticketTokenId) {
      return NextResponse.json(
        { success: false, error: 'Tickets not created for this event yet' },
        { status: 400 },
      );
    }

    // Ensure ticketPrice is present and a valid number
    if (ticketPrice === undefined || Number.isNaN(Number(ticketPrice))) {
      return NextResponse.json(
        { success: false, error: 'Ticket price is missing or invalid' },
        { status: 400 },
      );
    }

    // 1) Verify payment on-chain via Mirror Node
    await verifyPayment(paymentTxId, buyerAccountId, operator, Number(ticketPrice));

    // 2) Mint + transfer assuming buyer already associated (front-end must associate via wallet)
    const service = new HederaEventService();
    const result = await service.mintAndTransferTicketAssumingAssociation(
      eventId,
      ticketTokenId,
      buyerAccountId,
      Number(ticketPrice),
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          ticketSerialNumber: result.ticketSerialNumber,
          transactionId: result.transactionId,
          ticketTokenId,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to purchase ticket';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}