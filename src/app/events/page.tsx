import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

const NETWORK = (process.env.NEXT_PUBLIC_HEDERA_NETWORK || 'testnet').toLowerCase();
const hashscanBase = `https://hashscan.io/${NETWORK}`;
const topicUrl = (id: string) => `${hashscanBase}/topic/${id}`;

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
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || 'http';
  const baseUrl = `${proto}://${host}`;
  const res = await fetch(`${baseUrl}/api/events`, { cache: 'no-store' });
  const json = await res.json();
  if (!res.ok || !json?.success) return [];
  return (json.data as Event[]) || [];
}

export default async function EventsPage() {
  const events = await getEvents();

  // Separate deployed and draft events
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

    return (
      <Link
        href={`/events/${encodeURIComponent(eventId)}`}
        className="block rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow bg-black"
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
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">🎫</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
            <div className="text-[10px] tracking-widest text-white/80 font-semibold uppercase mb-2">
              Highlighted Event
            </div>
            <div className="text-white font-semibold text-lg md:text-xl leading-tight line-clamp-2">
              {evt.name}
            </div>
            <div className="mt-1 text-white/90 text-sm">{formatDate(evt.date)}</div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-white min-h-screen">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Events</h1>
        <p className="text-gray-600">Find and purchase tickets for events on the Hedera blockchain</p>
      </div>

      {/* Simple filter pills for the feel */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <button className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:border-gray-400">
          All Events
        </button>
        <button className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:border-gray-400">
          Price
        </button>
        <button className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium hover:border-gray-400">
          Date
        </button>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <div className="text-gray-400 text-5xl mb-4">🎫</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Yet</h3>
          <p className="text-gray-600 mb-6">Be the first to create an event on our platform!</p>
          <Link
            href="/vendor"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Create Event
          </Link>
        </div>
      ) : (
        <>
          {/* Live Events */}
          {deployedEvents.length > 0 && (
            <div className="mb-12">
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
      <div className="mt-16 text-center bg-gray-50 rounded-2xl p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to host your own event?</h3>
        <p className="text-gray-600 mb-6">
          Create events, deploy them on Hedera, and sell NFT tickets seamlessly.
        </p>
        <Link
          href="/vendor"
          className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          Become a Vendor
        </Link>
      </div>
    </div>
  );
}