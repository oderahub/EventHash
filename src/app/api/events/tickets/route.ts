import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import path from 'path';
import { promises as fs } from 'fs';
import { HederaEventService } from '@/lib/hedera-event-service';

export const runtime = 'nodejs';

const dataFile = path.join(process.cwd(), 'src', 'shared', 'data', 'events.json');

const TicketsSchema = z.object({
  eventId: z.string().min(3), // topic id string (same as hederaEventId)
  maxTickets: z.number().int().positive(),
  ticketPrice: z.number().nonnegative(),
});

// Define proper types for events data
type EventItem = {
  id?: string;
  hederaEventId?: string;
  hederaTopicId?: string;
  hederaTicketTokenId?: string;
  name?: string;
  description?: string;
  date?: number | string;
  location?: string;
  price?: number;
  category?: string;
  bannerUrl?: string;
};

type NodeError = Error & {
  code?: string;
};

async function readEvents(): Promise<EventItem[]> {
  try {
    const raw = await fs.readFile(dataFile, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err: unknown) {
    const nodeError = err as NodeError;
    if (nodeError.code === 'ENOENT') {
      await fs.mkdir(path.dirname(dataFile), { recursive: true });
      await fs.writeFile(dataFile, '[]', 'utf-8');
      return [];
    }
    throw err;
  }
}

async function writeEvents(events: EventItem[]): Promise<void> {
  const json = JSON.stringify(events, null, 2);
  await fs.writeFile(dataFile, json, 'utf-8');
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in environment' },
        { status: 500 },
      );
    }

    const body = await req.json();
    const parsed = TicketsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const { eventId, maxTickets, ticketPrice } = parsed.data;

    const eventService = new HederaEventService();
    const result = await eventService.createEventTickets(eventId, maxTickets, ticketPrice);

    // Update local event entry with the ticket token id
    const events = await readEvents();
    const idx = events.findIndex((e) => e.hederaEventId === eventId || e.hederaTopicId === eventId);
    if (idx !== -1) {
      events[idx].hederaTicketTokenId = result.ticketTokenId.toString();
      await writeEvents(events);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ticketTokenId: result.ticketTokenId.toString(),
          transactionId: result.transactionId,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create tickets';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
