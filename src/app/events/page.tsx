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
    const hasTickets = Boolean(evt.hederaTicketTokenId);

    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
        {/* Banner Image */}
        <div className="aspect-video w-full rounded-t-xl bg-gray-100 overflow-hidden">
          {evt.bannerUrl ? (
            <Image
              src={evt.bannerUrl}
              alt={evt.name}
              width={400}
              height={225}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-3xl mb-2">🎫</div>
                <div className="text-sm">No banner</div>
              </div>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-1">{evt.name}</h3>
              {evt.category && (
                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {evt.category}
                </span>
              )}
            </div>
            {isDraft && (
              <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full ml-2">
                Draft
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex items-center">
              <span className="w-4 h-4 mr-2">📅</span>
              {formatDate(evt.date)}
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 mr-2">📍</span>
              {evt.location}
            </div>
            <div className="flex items-center">
              <span className="w-4 h-4 mr-2">💰</span>
              <span className="font-medium text-gray-900">{evt.price} HBAR</span>
            </div>
          </div>

          {/* Blockchain Status */}
          {!isDraft && (
            <div className="mb-4 p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Blockchain Status:</span>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-green-700 font-medium">Deployed</span>
                </div>
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Topic:
                <a
                  href={topicUrl(eventId)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline ml-1"
                >
                  {eventId.slice(0, 10)}...
                </a>
              </div>
              {hasTickets && <div className="text-xs text-green-600 mt-1">✓ Tickets Available</div>}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Link
              href={`/events/${encodeURIComponent(eventId)}`}
              className="flex-1 text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              {isDraft ? 'View Details' : hasTickets ? 'View & Buy' : 'View Event'}
            </Link>

            {!isDraft && hasTickets && (
              <div className="text-xs text-center py-2 px-3 text-green-700 bg-green-50 rounded-lg font-medium">
                Tickets Ready
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Discover Events</h1>
        <p className="text-gray-600">
          Find and purchase tickets for events on the Hedera blockchain
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-2xl font-bold text-blue-600">{events.length}</div>
          <div className="text-gray-600">Total Events</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-2xl font-bold text-green-600">{deployedEvents.length}</div>
          <div className="text-gray-600">Live on Hedera</div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-2xl font-bold text-orange-600">
            {deployedEvents.filter((e) => e.hederaTicketTokenId).length}
          </div>
          <div className="text-gray-600">With Tickets Available</div>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
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
          {/* Live Events Section */}
          {deployedEvents.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Live Events</h2>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Deployed on Hedera
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {deployedEvents.map((evt) => (
                  <EventCard key={evt.id} evt={evt} />
                ))}
              </div>
            </div>
          )}

          {/* Draft Events Section */}
          {draftEvents.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">Draft Events</h2>
                <div className="flex items-center text-sm text-gray-600">
                  <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                  Not yet deployed
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {draftEvents.map((evt) => (
                  <EventCard key={evt.id} evt={evt} isDraft />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer CTA */}
      <div className="mt-16 text-center bg-white rounded-xl p-8 shadow-sm">
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
