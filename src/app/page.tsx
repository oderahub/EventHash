'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChatInterface, ChatInterfaceRef } from '@/components/chat-interface';
import { MessageCircle, Sparkles } from 'lucide-react';

interface EventItem {
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

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const chatInterfaceRef = useRef<ChatInterfaceRef>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/events', { cache: 'no-store' });
        const json = await res.json();
        if (res.ok && json?.success) setEvents(json.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleOpenChat = () => {
    chatInterfaceRef.current?.openChat();
  };

  const EventCard = ({ evt }: { evt: EventItem }) => {
    const eventId = evt.hederaEventId || evt.hederaTopicId || evt.id;
    const dateStr = new Date(evt.date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

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
              sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 33vw"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              🎫
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
            <div className="text-[10px] tracking-widest text-white/80 font-semibold uppercase mb-2">
              Highlighted Event
            </div>
            <div className="text-white font-semibold text-lg md:text-xl leading-tight line-clamp-2">
              {evt.name}
            </div>
            <div className="mt-1 text-white/90 text-sm">{dateStr}</div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&h=1080&fit=crop)',
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.55)_100%)]" />

        <div className="relative z-10 text-center max-w-3xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 leading-tight text-white">
            Create, Discover, and Attend Events with{' '}
            <span className="text-neon-accent">AI + Hedera</span>
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto">
            Find events and make memories that last a lifetime. Your next great experience is just a
            click away.
          </p>
          <div className="mt-8 flex items-center justify-center">
            <Link
              href="#discover"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-sm"
            >
              Discover events
            </Link>
          </div>
        </div>
      </section>

      {/* Discover */}
      <section id="discover" className="relative py-16">
        {/* Warm gradient background to match hero overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-orange-50 via-white to-white"
          aria-hidden
        />

        <div className="relative px-4 max-w-7xl mx-auto mb-6 text-center">
          <h2 className="text-2xl md:text-3xl font-semibold">Discover events</h2>
          <p className="text-gray-600 mt-1">Curated picks happening soon</p>
        </div>

        <div className="relative px-4 max-w-7xl mx-auto">
          {loading ? (
            <div className="text-center text-gray-600 py-12">Loading events…</div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-orange-100">
              <div className="text-gray-400 text-5xl mb-3">🎫</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Yet</h3>
              <p className="text-gray-600 mb-6">Be the first to create an event on our platform!</p>
              <Link
                href="/vendor"
                className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold"
              >
                Create Event
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.slice(0, 6).map((evt) => (
                <EventCard key={evt.id} evt={evt} />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              href="/events"
              className="inline-flex items-center justify-center px-5 py-2.5 border border-orange-300 text-orange-700 hover:border-orange-400 rounded-lg bg-white font-medium"
            >
              Browse all events
            </Link>
          </div>
        </div>
      </section>

      {/* HashBot AI Section */}
      <section className="py-16 bg-gradient-to-br from-orange-50 via-white to-orange-100">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-orange-400 rounded-full blur-xl opacity-30 animate-pulse" />
            <div className="relative bg-white p-4 rounded-full shadow-xl border border-orange-200">
              <MessageCircle className="w-12 h-12 text-orange-500" />
              <Sparkles className="w-4 h-4 text-orange-400 absolute -top-1 -right-1 animate-bounce" />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Meet <span className="text-orange-500">HashBot AI</span>
          </h2>

          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Your intelligent event assistant that understands natural language. Create events, buy
            tickets, and manage everything through simple conversations.
          </p>

          <button
            onClick={handleOpenChat}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Start Chatting with HashBot
          </button>
        </div>
      </section>

      {/* Chat Interface */}
      <ChatInterface ref={chatInterfaceRef} />
    </div>
  );
}
