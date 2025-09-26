import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// Paths
const dataFile = path.join(process.cwd(), 'src', 'shared', 'data', 'events.json');

// Add proper interface definitions
interface FileSystemError extends Error {
  code?: string;
}

interface ApiError extends Error {
  message: string;
}

// Schemas
const EventCreateSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  date: z.string().or(z.number()), // ISO string or timestamp
  location: z.string().min(2),
  price: z.number().nonnegative(),
  category: z.string().default('General'),
  bannerUrl: z.string().url().optional(),
  vendorAccountId: z.string().optional(),
  // Optional Hedera fields if created/deployed on-chain
  hederaEventId: z.string().optional(), // same as topicId string
  hederaTopicId: z.string().optional(),
  hederaTransactionId: z.string().optional(),
});

// Fix line 27: Use type instead of value assignment since EventSchema is only used as a type
type EventSchema = z.infer<typeof EventCreateSchema> & {
  id: string;
  createdAt: number;
};

// Helpers
async function readEvents(): Promise<EventSchema[]> {
  try {
    const raw = await fs.readFile(dataFile, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as EventSchema[];
  } catch (err) {
    // Fix line 39: Replace any with FileSystemError
    const error = err as FileSystemError;
    if (error.code === 'ENOENT') {
      // Initialize file
      await fs.mkdir(path.dirname(dataFile), { recursive: true });
      await fs.writeFile(dataFile, '[]', 'utf-8');
      return [];
    }
    throw error;
  }
}

async function writeEvents(events: EventSchema[]): Promise<void> {
  const json = JSON.stringify(events, null, 2);
  await fs.writeFile(dataFile, json, 'utf-8');
}

function genId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// GET /api/events
export async function GET() {
  try {
    const events = await readEvents();
    // newest first
    events.sort((a, b) => b.createdAt - a.createdAt);
    return NextResponse.json({ success: true, data: events });
  } catch (error) {
    // Fix line 66: Replace any with unknown and use type guard
    const err = error as ApiError;
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Failed to read events' },
      { status: 500 },
    );
  }
}

// POST /api/events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = EventCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const input = parsed.data;

    // Normalize date -> timestamp
    const timestamp = typeof input.date === 'string' ? new Date(input.date).getTime() : input.date;

    const newEvent: EventSchema = {
      id: genId(),
      name: input.name,
      description: input.description,
      date: timestamp,
      location: input.location,
      price: input.price,
      category: input.category ?? 'General',
      bannerUrl: input.bannerUrl,
      vendorAccountId: input.vendorAccountId,
      hederaEventId: input.hederaEventId,
      hederaTopicId: input.hederaTopicId,
      hederaTransactionId: input.hederaTransactionId,
      createdAt: Date.now(),
    };

    const events = await readEvents();
    events.push(newEvent);
    await writeEvents(events);

    return NextResponse.json({ success: true, data: newEvent }, { status: 201 });
  } catch (error) {
    // Fix line 109: Replace any with unknown and use type guard
    const err = error as ApiError;
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Failed to create event' },
      { status: 500 },
    );
  }
}

// import { NextRequest, NextResponse } from 'next/server';
// import { z } from 'zod';
// import { env } from '@/server/env';
// import { ChatGroq } from '@langchain/groq';
// import { HumanMessage, SystemMessage } from '@langchain/core/messages';
// import type { MessageContentComplex } from '@langchain/core/messages';

// export const runtime = 'nodejs';

// // Add proper interface definitions
// interface ApiError extends Error {
//   message: string;
// }

// // Draft schema for extraction
// const DraftSchema = z.object({
//   name: z.string().min(3),
//   description: z.string().min(10),
//   date: z.string().describe('ISO 8601 date-time, e.g., 2025-10-15T19:00:00.000Z'),
//   location: z.string().min(2),
//   price: z.number().nonnegative().default(0),
//   category: z.string().default('General'),
//   bannerUrl: z.string().url().nullable().optional(),
// });

// const RequestSchema = z.object({
//   prompt: z.string().min(5),
// });

// export async function POST(req: NextRequest) {
//   try {
//     // Ensure env (GROQ_API_KEY) is loaded via env.ts
//     if (!env.GROQ_API_KEY) {
//       return NextResponse.json(
//         { success: false, error: 'Missing GROQ_API_KEY in environment' },
//         { status: 500 },
//       );
//     }

//     const body = await req.json();
//     const parsed = RequestSchema.safeParse(body);
//     if (!parsed.success) {
//       return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
//     }

//     const { prompt } = parsed.data;

//     const model = new ChatGroq({
//       apiKey: env.GROQ_API_KEY,
//       model: 'llama-3.1-8b-instant',
//       temperature: 0.2,
//     });

//     const system = `You extract structured event details from a vendor's description.
// Return STRICT JSON that matches this TypeScript type:
// {
//   "name": string,
//   "description": string,
//   "date": string, // ISO 8601
//   "location": string,
//   "price": number, // in HBAR (estimate if not given)
//   "category": string,
//   "bannerUrl"?: string
// }
// Rules:
// - Always output ONLY JSON (no markdown, no commentary)
// - If date is vague (e.g., "next Friday"), resolve to an ISO date in the future.
// - If price absent, estimate a reasonable non-negative number.
// - Do not invent a bannerUrl.
// - Keep descriptions concise (<= 280 chars).`;

//     const user = `Vendor prompt: ${prompt}`;

//     const resp = await model.invoke([new SystemMessage(system), new HumanMessage(user)]);

//     const content = resp?.content;
//     // Fix: Use proper LangChain types for MessageContentComplex
//     const text =
//       typeof content === 'string'
//         ? content
//         : Array.isArray(content)
//           ? content
//               .map((c: MessageContentComplex) => {
//                 if (typeof c === 'string') return c;
//                 if ('text' in c) return c.text || '';
//                 return '';
//               })
//               .join('')
//           : '';

//     let json: unknown;
//     try {
//       json = JSON.parse(text);
//     } catch {
//       // Fix: Remove unused variable 'e'
//       return NextResponse.json(
//         { success: false, error: 'AI response was not valid JSON', raw: text },
//         { status: 502 },
//       );
//     }

//     const validated = DraftSchema.safeParse(json);
//     if (!validated.success) {
//       return NextResponse.json(
//         { success: false, error: validated.error.flatten(), raw: json },
//         { status: 422 },
//       );
//     }

//     return NextResponse.json({ success: true, data: validated.data });
//   } catch (error) {
//     // Fix: Replace any with proper error handling
//     const err = error as ApiError;
//     return NextResponse.json(
//       { success: false, error: err?.message ?? 'Failed to extract event fields' },
//       { status: 500 },
//     );
//   }
// }
