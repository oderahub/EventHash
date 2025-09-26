import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { env } from '@/server/env'
import { ChatGroq } from '@langchain/groq'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

export const runtime = 'nodejs'

// Draft schema for extraction
const DraftSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  date: z.string().describe('ISO 8601 date-time, e.g., 2025-10-15T19:00:00.000Z'),
  location: z.string().min(2),
  price: z.number().nonnegative().default(0),
  category: z.string().default('General'),
  bannerUrl: z.string().url().nullable().optional(),
})

const RequestSchema = z.object({
  prompt: z.string().min(5),
})

export async function POST(req: NextRequest) {
  try {
    // Ensure env (GROQ_API_KEY) is loaded via env.ts
    if (!env.GROQ_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Missing GROQ_API_KEY in environment' },
        { status: 500 },
      )
    }

    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { prompt } = parsed.data

    const model = new ChatGroq({
      apiKey: env.GROQ_API_KEY,
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
    })

    const system = `You extract structured event details from a vendor's description.
Return STRICT JSON that matches this TypeScript type:
{
  "name": string,
  "description": string,
  "date": string, // ISO 8601
  "location": string,
  "price": number, // in HBAR (estimate if not given)
  "category": string,
  "bannerUrl"?: string
}
Rules:
- Always output ONLY JSON (no markdown, no commentary)
- If date is vague (e.g., "next Friday"), resolve to an ISO date in the future.
- If price absent, estimate a reasonable non-negative number.
- Do not invent a bannerUrl.
- Keep descriptions concise (<= 280 chars).`

    const user = `Vendor prompt: ${prompt}`

    const resp = await model.invoke([
      new SystemMessage(system),
      new HumanMessage(user),
    ])

    const content = resp?.content
    const text = typeof content === 'string'
      ? content
      : Array.isArray(content)
        ? content.map((c: any) => (typeof c === 'string' ? c : c?.text || '')).join('')
        : ''

    let json: unknown
    try {
      json = JSON.parse(text)
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'AI response was not valid JSON', raw: text },
        { status: 502 },
      )
    }

    const validated = DraftSchema.safeParse(json)
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.flatten(), raw: json },
        { status: 422 },
      )
    }

    return NextResponse.json({ success: true, data: validated.data })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? 'Failed to extract event fields' },
      { status: 500 },
    )
  }
}
