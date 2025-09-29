import Link from 'next/link';

export default function AboutPage() {
  const values = [
    {
      title: 'Innovation',
      description:
        'Pioneering the intersection of AI and blockchain technology for seamless event management.',
      icon: '🚀',
    },
    {
      title: 'Transparency',
      description:
        'Every transaction is recorded on Hedera blockchain with full audit trails and HashScan verification.',
      icon: '🔍',
    },
    {
      title: 'Security',
      description:
        "Enterprise-grade security through Hedera's proof-of-stake consensus and cryptographic verification.",
      icon: '🛡️',
    },
    {
      title: 'Simplicity',
      description:
        'Complex blockchain operations made simple through natural language AI interactions.',
      icon: '✨',
    },
  ];

  const stats = [
    { number: '100%', label: 'Transparent Operations' },
    { number: '0.001s', label: 'Transaction Finality' },
    { number: '24/7', label: 'AI Assistant Available' },
    { number: '∞', label: 'Scalability Potential' },
  ];

  return (
    <div className="relative bg-gradient-to-b from-orange-50 via-white to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
            About <span className="text-neon-accent">EventHash</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We&apos;re revolutionizing event management by combining the power of artificial
            intelligence with Hedera&apos;s enterprise-grade blockchain infrastructure to create
            transparent, secure, and user-friendly event experiences.
          </p>
        </div>

        {/* Mission Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8 md:p-12 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-gray-600 text-lg mb-6">
                To democratize blockchain technology and make it accessible to everyone through
                intuitive AI interfaces. We believe that complex blockchain operations should be as
                simple as having a conversation.
              </p>
              <p className="text-gray-600 text-lg">
                EventHash represents a new paradigm where event organizers can leverage the security
                and transparency of blockchain without needing technical expertise, while attendees
                enjoy verifiable, fraud-proof ticketing experiences.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Vision 2025</h3>
              <p className="text-gray-700">
                Become the leading platform for AI-powered blockchain event management globally
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value) => (
              <div
                key={value.title}
                className="bg-white rounded-xl shadow-sm border border-orange-100 p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{value.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Technology Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Built on <span className="text-neon-accent">Cutting-Edge Technology</span>
            </h2>
            <p className="text-white/80 text-lg max-w-3xl mx-auto">
              EventHash leverages the most advanced technologies to deliver unparalleled
              performance, security, and user experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Hedera Hashgraph</h3>
              <p className="text-white/70 text-sm">
                Enterprise-grade DLT with fast finality, low fees, and carbon-negative operations
              </p>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI Integration</h3>
              <p className="text-white/70 text-sm">
                Groq LLM and LangChain for natural language blockchain interactions
              </p>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔗</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Full Stack</h3>
              <p className="text-white/70 text-sm">
                Next.js 15, TypeScript, and modern web technologies for optimal performance
              </p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">By the Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="text-center bg-white rounded-xl shadow-sm border border-orange-100 p-6"
              >
                <div className="text-3xl font-bold text-neon-accent mb-2">{stat.number}</div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Future Section */}
        <div className="bg-gradient-to-b from-orange-50 to-white rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">The Future is Here</h2>
          <p className="text-gray-600 text-lg mb-8 max-w-3xl mx-auto">
            EventHash is more than just an event platform—it&apos;s a glimpse into the future where
            blockchain technology seamlessly integrates into everyday experiences, powered by
            intelligent AI that understands and anticipates user needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/how-it-works"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
            >
              Learn How It Works
            </Link>
            <Link
              href="/vendor"
              className="px-6 py-3 border border-orange-300 text-orange-700 hover:bg-orange-50 rounded-lg font-semibold transition-colors"
            >
              Start Creating
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
