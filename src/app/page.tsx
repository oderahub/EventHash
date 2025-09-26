'use client';

import { ChatInterface } from '@/components/chat-interface';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header is rendered globally via layout */}

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&h=1080&fit=crop)',
          }}
        />
        <div className="absolute inset-0" style={{ background: 'var(--hero-gradient)' }} />
        
        <div className="relative z-10 text-center max-w-3xl mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Create, Discover, and Attend Events with{' '}
            <span className="text-neon-accent">AI + Hedera</span>
          </h1>
          <p className="text-lg md:text-xl text-secondary">
            A fast MVP to showcase event creation, marketplace browsing, and ticket purchases.
          </p>
        </div>
      </section>

      {/* Placeholder Featured Section */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6">Featured Events</h2>
        <p className="text-secondary">Marketplace and filtering will be added in upcoming tasks.</p>
      </section>

      {/* AI Chat Interface */}
      <ChatInterface />
    </div>
  );
}
