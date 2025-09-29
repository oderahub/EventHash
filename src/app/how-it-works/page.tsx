import Link from 'next/link';

export default function HowItWorksPage() {
  const steps = [
    {
      number: '01',
      title: 'Connect Your Wallet',
      description: 'Connect your Hedera wallet to interact with the blockchain securely.',
      icon: '🔗',
    },
    {
      number: '02',
      title: 'Create or Discover Events',
      description:
        'Use our AI assistant HashBot to create events with natural language, or browse existing events.',
      icon: '🎪',
    },
    {
      number: '03',
      title: 'Deploy to Hedera',
      description: 'Events are deployed as HCS topics with complete audit trails and transparency.',
      icon: '⚡',
    },
    {
      number: '04',
      title: 'Mint NFT Tickets',
      description:
        'Create unique NFT tickets for your events with built-in ownership verification.',
      icon: '🎫',
    },
    {
      number: '05',
      title: 'Secure Check-ins',
      description: 'Validate ticket ownership and log check-ins to the Hedera Consensus Service.',
      icon: '✅',
    },
  ];

  const features = [
    {
      title: 'AI-Powered Creation',
      description: 'Create events using natural language with HashBot AI assistant',
      icon: '🤖',
    },
    {
      title: 'Hedera Blockchain',
      description: 'Enterprise-grade security and transparency with HCS topics',
      icon: '🔐',
    },
    {
      title: 'NFT Tickets',
      description: 'Unique, verifiable tickets as NFTs with ownership validation',
      icon: '🎨',
    },
    {
      title: 'Mirror Node Verification',
      description: 'Real-time payment verification through Hedera Mirror Node',
      icon: '🔍',
    },
  ];

  return (
    <div className="relative bg-gradient-to-b from-orange-50 via-white to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
            How <span className="text-neon-accent">EventHash</span> Works
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Experience the future of event management with AI-powered blockchain technology. Create,
            discover, and attend events with unprecedented security and transparency.
          </p>
        </div>

        {/* Steps Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Simple Steps to Get Started
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="text-3xl mr-3">{step.icon}</div>
                    <div className="text-sm font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full">
                      Step {step.number}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-orange-200 transform -translate-y-1/2" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Powered by Advanced Technology
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl shadow-sm border border-orange-100 p-6 text-center hover:shadow-md transition-shadow"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* HashBot Demo Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">
            Meet <span className="text-neon-accent">HashBot</span>
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Our AI assistant makes blockchain operations as simple as having a conversation. Create
            events, mint tickets, and manage everything with natural language commands.
          </p>
          <div className="bg-black/20 rounded-lg p-4 text-left max-w-md mx-auto mb-8">
            <div className="text-neon-accent text-sm mb-2">You:</div>
            <div className="text-white/90 mb-4">
              &ldquo;Create a tech conference on December 15th in San Francisco, $50 tickets, max
              200 people&rdquo;
            </div>
            <div className="text-neon-accent text-sm mb-2">HashBot:</div>
            <div className="text-white/90">
              ✅ Created event with HCS topic 0.0.12345 and deployed NFT collection!
            </div>
          </div>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-neon-accent hover:bg-neon-accent/90 text-black font-semibold rounded-lg transition-colors"
          >
            Try HashBot Now
          </Link>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-b from-orange-50 to-white rounded-2xl p-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            Ready to revolutionize your events?
          </h3>
          <p className="text-gray-600 mb-6">
            Join the future of event management with blockchain security and AI simplicity.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/vendor"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
            >
              Create Event
            </Link>
            <Link
              href="/events"
              className="px-6 py-3 border border-orange-300 text-orange-700 hover:bg-orange-50 rounded-lg font-semibold transition-colors"
            >
              Discover Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
