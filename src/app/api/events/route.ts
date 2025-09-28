import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// Paths
const dataFile = path.join(process.cwd(), 'src', 'shared', 'data', 'events.json');

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
  // Optional Hedera ticket token id if tickets have been created
  hederaTicketTokenId: z.string().optional(),
});

type EventSchema = z.infer<typeof EventCreateSchema> & {
  id: string;
  createdAt: number;
  hederaTicketTokenId?: string;
};

// Helpers
async function readEvents(): Promise<EventSchema[]> {
  try {
    const raw = await fs.readFile(dataFile, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as EventSchema[];
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      // Initialize file
      await fs.mkdir(path.dirname(dataFile), { recursive: true });
      await fs.writeFile(dataFile, '[]', 'utf-8');
      return [];
    }
    throw err;
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to read events';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
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
      hederaTicketTokenId: input.hederaTicketTokenId,
      createdAt: Date.now(),
    };

    const events = await readEvents();
    events.push(newEvent);
    await writeEvents(events);

    return NextResponse.json({ success: true, data: newEvent }, { status: 201 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create event';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
