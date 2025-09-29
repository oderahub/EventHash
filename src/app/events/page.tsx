'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

const NETWORK = (process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet').toLowerCase();
const hashscanBase = `https://hashscan.io/${NETWORK}`;

interface Event {
  id: string;
  name: string;
  date: number;
  location: string;
  price: number;
  category?: string;
  bannerUrl?: string;
  hederaEventId?: string;
  hederaTopicId?: string;
  hederaTicketTokenId?: string;
}

async function getEvents(): Promise<Event[]> {
  const res = await fetch('/api/events', { cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || !json?.success) return [];
  return (json.data as Event[]) || [];
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const eventsData = await getEvents();
        setEvents(eventsData);
      } finally {
        setLoading(false);
      }
    };
    loadEvents();
  }, []);

  const deployedEvents = events.filter((evt) => evt.hederaEventId || evt.hederaTopicId);
  const draftEvents = events.filter((evt) => !evt.hederaEventId && !evt.hederaTopicId);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const EventCard = ({ evt, isDraft = false }: { evt: Event; isDraft?: boolean }) => {
    const eventId = evt.hederaEventId || evt.hederaTopicId || evt.id;
    const topicUrl = `${hashscanBase}/topic/${evt.hederaTopicId || evt.hederaEventId}`;

    const handleHashScanClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      window.open(topicUrl, '_blank', 'noreferrer');
    };

    return (
      <Link
        href={`/events/${encodeURIComponent(eventId)}`}
        className="block rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:ring-1 hover:ring-orange-300 transition-all bg-black"
      >
        <div className="relative w-full aspect-[4/3]">
          {evt.bannerUrl ? (
            <Image
              src={evt.bannerUrl}
              alt={evt.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              🎫
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
            <div className="inline-flex items-center px-2 py-1 rounded-full bg-white/10 backdrop-blur text-[10px] tracking-widest text-white/90 font-semibold uppercase mb-2">
              {isDraft ? 'Draft Event' : 'Live Event'}
            </div>
            <div className="text-white font-semibold text-lg md:text-xl leading-tight line-clamp-2">
              {evt.name}
            </div>
            <div className="mt-1 text-white/90 text-sm">{formatDate(evt.date)}</div>
            {!isDraft && evt.hederaTopicId && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleHashScanClick}
                  className="text-xs text-white/80 hover:text-white underline bg-transparent border-none cursor-pointer p-0"
                >
                  View on HashScan
                </button>
              </div>
            )}
          </div>
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="relative bg-gradient-to-b from-orange-50 to-white min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-24">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="mx-auto h-10 w-10 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
            <div className="text-gray-600 text-sm">Loading events…</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-gradient-to-b from-orange-50 via-white to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
            Discover Events
          </h1>
          <p className="text-gray-600">
            Find and purchase tickets for events on the Hedera blockchain
          </p>
        </div>

        {/* Filter pills */}
        <div className="mb-10 flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-full border border-orange-200 text-orange-700 bg-orange-50 px-4 py-2 text-sm font-medium hover:border-orange-300">
            All Events
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-orange-200 text-orange-700 px-4 py-2 text-sm font-medium hover:border-orange-300">
            Price
          </button>
          <button className="inline-flex items-center gap-2 rounded-full border border-orange-200 text-orange-700 px-4 py-2 text-sm font-medium hover:border-orange-300">
            Date
          </button>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-orange-100">
            <div className="text-gray-400 text-5xl mb-4">🎫</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Yet</h3>
            <p className="text-gray-600 mb-6">Be the first to create an event on our platform!</p>
            <Link
              href="/vendor"
              className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
            >
              Create Event
            </Link>
          </div>
        ) : (
          <>
            {/* Live Events */}
            {deployedEvents.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Live Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {deployedEvents.map((evt) => (
                    <EventCard key={evt.id} evt={evt} />
                  ))}
                </div>
              </div>
            )}

            {/* Draft Events */}
            {draftEvents.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Draft Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {draftEvents.map((evt) => (
                    <EventCard key={evt.id} evt={evt} isDraft />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer CTA */}
        <div className="mt-16 text-center bg-gradient-to-b from-orange-50 to-white rounded-2xl p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Ready to host your own event?
          </h3>
          <p className="text-gray-600 mb-6">
            Create events, deploy them on Hedera, and sell NFT tickets seamlessly.
          </p>
          <Link
            href="/vendor"
            className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
          >
            Become a Vendor
          </Link>
        </div>
      </div>
    </div>
  );
}