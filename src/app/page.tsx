'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChatInterface } from '@/components/chat-interface'

interface EventItem {
  id: string
  name: string
  date: number
  location: string
  price: number
  category?: string
  bannerUrl?: string
  hederaEventId?: string
  hederaTopicId?: string
  hederaTicketTokenId?: string
}

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/events', { cache: 'no-store' })
        const json = await res.json()
        if (res.ok && json?.success) setEvents(json.data || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const EventCard = ({ evt }: { evt: EventItem }) => {
    const eventId = evt.hederaEventId || evt.hederaTopicId || evt.id
    const dateStr = new Date(evt.date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

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
            <div className="mt-1 text-white/90 text-sm">{dateStr}</div>
          </div>
        </div>
      </Link>
    )
  }

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
        <div className="absolute inset-0 bg-gradient-to-b from-orange-50 via-white to-white" aria-hidden />

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

      {/* Chat */}
      <div className="max-w-7xl mx-auto px-4">
        <ChatInterface />
      </div>
    </div>
  )
}