'use client';

import { useState } from 'react';
import { Search, Calendar, MapPin, Ticket } from 'lucide-react';
import { useDAppConnector } from '@/components/client-providers';
import { WalletButton } from '@/components/wallet-button';
import { ChatInterface } from '@/components/chat-interface';

// Mock event data - replace with real data from your backend
const mockEvents = [
  {
    id: '1',
    name: 'Neon Nights Festival',
    date: '2024-12-25',
    location: 'Madison Square Garden',
    price: 50,
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop',
    category: 'Music'
  },
  {
    id: '2',
    name: 'Tech Conference 2024',
    date: '2024-11-15',
    location: 'Convention Center',
    price: 25,
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
    category: 'Technology'
  },
  {
    id: '3',
    name: 'Art Gallery Opening',
    date: '2024-10-30',
    location: 'Downtown Gallery',
    price: 15,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
    category: 'Art'
  }
];

export default function Home() {
  const [showEventExplorer, setShowEventExplorer] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const dAppConnectorContext = useDAppConnector();

  const handleExploreEvents = () => {
    setShowEventExplorer(true);
  };

  const handleViewDetails = (eventId: string) => {
    setSelectedEvent(eventId);
    setShowEventExplorer(true);
  };

  if (showEventExplorer) {
    return <EventExplorer onBack={() => setShowEventExplorer(false)} selectedEventId={selectedEvent} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-neon-accent">EventHash</h1>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#discover" className="text-foreground hover:text-neon-accent transition-colors">
                Discover events
              </a>
              <a href="#how-it-works" className="text-foreground hover:text-neon-accent transition-colors">
                How It Works
              </a>
              <a href="#pricing" className="text-foreground hover:text-neon-accent transition-colors">
                Pricing
              </a>
              <a href="#about" className="text-foreground hover:text-neon-accent transition-colors">
                About
              </a>
              <a href="#blog" className="text-foreground hover:text-neon-accent transition-colors">
                Blog
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <button className="text-foreground hover:text-neon-accent transition-colors">
                Login
              </button>
              <WalletButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1920&h=1080&fit=crop)',
          }}
        />
        <div className="absolute inset-0" style={{ background: 'var(--hero-gradient)' }} />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4 animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Create, Discover, and Attend Events with{' '}
            <span className="text-neon-accent">AI + Hedera Blockchain</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-secondary max-w-2xl mx-auto">
            Find events and make memories that last a lifetime. Your next great experience is just a click away.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleExploreEvents}
              className="px-8 py-4 bg-warm-accent hover:bg-opacity-90 text-white font-semibold rounded-full text-lg transition-all duration-300 hover-scale glow-primary min-w-[200px]"
            >
              Explore Events
            </button>
            
            <WalletButton />
          </div>
        </div>
      </section>

      {/* Event Grid Section */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Featured Events</h2>
          <p className="text-secondary text-lg">Discover amazing events happening near you</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onViewDetails={() => handleViewDetails(event.id)}
            />
          ))}
        </div>
      </section>

      {/* Tagline */}
      <footer className="text-center py-8 border-t border-gray-800">
        <p className="text-secondary">
          Create, discover, and attend events with AI and Hedera blockchain
        </p>
      </footer>

      {/* AI Chat Interface */}
      <ChatInterface />
    </div>
  );
}

// Event Card Component
function EventCard({ event, onViewDetails }: { 
  event: typeof mockEvents[0]; 
  onViewDetails: () => void; 
}) {
  return (
    <div className="glass rounded-2xl overflow-hidden hover-scale transition-all duration-300">
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.image}
          alt={event.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 text-foreground">{event.name}</h3>
        
        <div className="flex items-center gap-2 mb-2 text-neon-accent">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{new Date(event.date).toLocaleDateString()}</span>
        </div>
        
        <div className="flex items-center gap-2 mb-2 text-secondary">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{event.location}</span>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-neon-accent" />
            <span className="text-neon-accent font-bold">{event.price} HBAR</span>
          </div>
          
          <button
            onClick={onViewDetails}
            className="px-4 py-2 bg-primary hover:bg-opacity-90 text-white font-semibold rounded-lg transition-all duration-300"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

// Event Explorer Component
function EventExplorer({ onBack, selectedEventId }: { 
  onBack: () => void; 
  selectedEventId: string | null; 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Music', 'Technology', 'Art', 'Sports', 'Food'];

  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background text-foreground pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="px-4 py-2 glass rounded-lg hover:bg-opacity-20 transition-all duration-300"
          >
            ← Back to Home
          </button>
          
          <h1 className="text-3xl font-bold">Event Explorer</h1>
          
          <div className="w-24" /> {/* Spacer */}
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary w-5 h-5" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 glass rounded-lg border-2 border-neon-accent/30 focus:border-neon-accent bg-transparent text-foreground placeholder-secondary"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-neon-accent text-black font-semibold'
                    : 'glass text-foreground hover:bg-opacity-20'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Event Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onViewDetails={() => {}}
            />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-secondary text-lg">No events found matching your criteria.</p>
          </div>
        )}
      </div>

      {/* AI Chat Interface */}
      <ChatInterface />
    </div>
  );
}
