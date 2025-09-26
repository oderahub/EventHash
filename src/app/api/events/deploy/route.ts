import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import path from 'path';
import { promises as fs } from 'fs';
import { HederaEventService } from '@/lib/hedera-event-service';

export const runtime = 'nodejs';

const dataFile = path.join(process.cwd(), 'src', 'shared', 'data', 'events.json');

// Add proper type definitions
interface Event {
  id: string;
  name: string;
  description: string;
  date: number;
  location: string;
  price: number;
  category: string;
  bannerUrl?: string;
  vendorAccountId?: string;
  hederaEventId: string;
  hederaTopicId: string;
  hederaTransactionId: string;
  createdAt: number;
}

interface FileSystemError extends Error {
  code?: string;
}

interface HederaEventResult {
  eventId: string;
  topicId: { toString(): string };
  transactionId: string;
}

const DeploySchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  date: z.string().or(z.number()), // ISO or timestamp
  location: z.string().min(2),
  ticketPrice: z.number().nonnegative(),
  maxTickets: z.number().int().positive(),
  eventAdmin: z.string().optional(), // defaults to env operator if omitted
  category: z.string().optional(),
  bannerUrl: z.string().url().optional(),
  vendorAccountId: z.string().optional(),
});

// Line 24: Replace any[] with Event[]
async function readEvents(): Promise<Event[]> {
  try {
    const raw = await fs.readFile(dataFile, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    // Line 29: Replace any with FileSystemError
    const error = err as FileSystemError;
    if (error.code === 'ENOENT') {
      await fs.mkdir(path.dirname(dataFile), { recursive: true });
      await fs.writeFile(dataFile, '[]', 'utf-8');
      return [];
    }
    throw error;
  }
}

// Line 39: Replace any[] with Event[]
async function writeEvents(events: Event[]): Promise<void> {
  const json = JSON.stringify(events, null, 2);
  await fs.writeFile(dataFile, json, 'utf-8');
}

function genId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(req: NextRequest) {
  try {
    // Validate env for Hedera operator (HederaEventService constructor requires these)
    if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in environment' },
        { status: 500 },
      );
    }

    const body = await req.json();
    const parsed = DeploySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 400 });
    }

    const input = parsed.data;

    // Build on-chain payload
    const timestamp = typeof input.date === 'string' ? new Date(input.date).getTime() : input.date;
    const eventAdmin = input.eventAdmin || process.env.HEDERA_ACCOUNT_ID!;

    const eventService = new HederaEventService();
    // Line 117: Replace any with HederaEventResult
    const result: HederaEventResult = await eventService.createEvent({
      name: input.name,
      description: input.description,
      date: timestamp,
      location: input.location,
      ticketPrice: input.ticketPrice,
      maxTickets: input.maxTickets,
      eventAdmin: eventAdmin,
    });

    // Persist locally to power marketplace list
    const newEvent: Event = {
      id: genId(),
      name: input.name,
      description: input.description,
      date: timestamp,
      location: input.location,
      price: input.ticketPrice,
      category: input.category ?? 'General',
      bannerUrl: input.bannerUrl,
      vendorAccountId: input.vendorAccountId,
      hederaEventId: result.eventId,
      hederaTopicId: result.topicId.toString(),
      hederaTransactionId: result.transactionId,
      createdAt: Date.now(),
    };

    const events = await readEvents();
    events.push(newEvent);
    await writeEvents(events);

    return NextResponse.json(
      {
        success: true,
        data: newEvent,
        onchain: {
          eventId: result.eventId,
          topicId: result.topicId.toString(),
          transactionId: result.transactionId,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    // Line 133: Replace any with unknown, then type guard
    const err = error as Error;
    return NextResponse.json(
      { success: false, error: err?.message ?? 'Failed to deploy event' },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    if (!process.env.HEDERA_ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
      return NextResponse.json(
        { ok: false, error: 'Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in environment' },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, message: 'Deploy API ready' });
  } catch (error) {
    // Fix the GET error handler as well
    const err = error as Error;
    return NextResponse.json(
      { ok: false, error: err?.message ?? 'Deploy API health-check failed' },
      { status: 500 },
    );
  }
}
