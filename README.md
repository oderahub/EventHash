# Event Hash

A sophisticated proof-of-concept demonstrating how AI agents can simplify complex blockchain operations while maintaining security and transparency through Hedera's enterprise-grade infrastructure.

This full-stack Next.js dApp combines natural language AI interactions with blockchain event management, featuring on-chain event creation, NFT ticket minting on Hedera, off-chain HBAR payment verification, and automated check-in with Hedera Consensus Service (HCS) audit logs.

## 🚀 Key Innovation

**HashBot AI Agent** - Interact with the Hedera blockchain using natural language commands. Create events, mint tickets, and manage blockchain operations through conversational AI powered by Groq LLM and the Hedera Agent Kit.

## ✨ Features

- **🤖 AI-Powered Blockchain Operations** - Natural language interface for complex Hedera transactions
- **🎨 Clean, Modern UI** with Tailwind CSS and responsive design
- **🔍 Transparent HashScan Integration** for all on-chain activities
- **📊 Mirror Node Verification** for payments and ownership validation
- **🏢 Vendor Dashboard** - Create events, deploy on-chain, mint NFT tickets
- **🎪 Public Events Marketplace** - Browse and discover events
- **💳 Secure Ticket Purchase API** with Mirror Node payment verification
- **✅ Smart Check-In System** with HCS logging and ownership validation
- **⚡ Hedera SDK Integration** - Enterprise-grade blockchain infrastructure

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Blockchain**: Hedera JS SDK (@hashgraph/sdk), HCS Topics, NFT Collections
- **AI**: LangChain, Groq LLM (llama-3.1-8b-instant), Hedera Agent Kit
- **Data**: Hedera Mirror Node REST API, File-based storage (demo)
- **State Management**: React Query, Zod validation

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
# or
yarn install
```

### Configure Environment

Copy `.env.example` to `.env` and configure your Hedera credentials:

```bash
# Backend (server-only) - Never expose these!
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=302e02...
HEDERA_MIRROR_URL=https://testnet.mirrornode.hedera.com

# Frontend (client-available)
NEXT_PUBLIC_WALLET_CONNECT_ID=
NEXT_PUBLIC_RPC_URL=
NEXT_PUBLIC_HEDERA_NETWORK=testnet
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# AI Integration
GROQ_API_KEY=
```

### Run Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) and start creating events with AI assistance!

## 📁 Architecture Overview

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts                 # AI agent endpoint
│   │   └── events/
│   │       ├── route.ts                  # Event CRUD operations
│   │       ├── purchase/route.ts         # Payment verification + ticket minting
│   │       ├── checkin/route.ts          # Ownership validation + HCS logging
│   │       ├── deploy/route.ts           # Deploy event to HCS topic
│   │       ├── tickets/route.ts          # Create NFT ticket collections
│   │       └── extract/route.ts          # AI-powered event detail extraction
│   ├── events/
│   │   ├── page.tsx                      # Events marketplace
│   │   └── [id]/page.tsx                 # Event details + purchase flow
│   ├── checkin/page.tsx                  # Ticket validation interface
│   ├── vendor/page.tsx                   # Event creation dashboard
│   └── page.tsx                          # Landing page with AI chat
├── components/
│   └── chat-interface.tsx                # HashBot AI chat component
├── server/
│   ├── initialize-agent.ts               # AI agent configuration
│   └── event-service-tools.ts            # Custom Hedera tools for AI
└── lib/
    └── hedera-event-service.ts           # Core Hedera operations wrapper
```

## 🤖 AI Agent Workflows

### Natural Language Event Creation

```
User: "Create a tech conference on December 15th in San Francisco, $50 tickets, max 200 people"
HashBot: ✅ Created event with HCS topic 0.0.12345 and deployed NFT collection!
```

### Intelligent Ticket Management

```
User: "Create 100 tickets for my event"
HashBot: ✅ Minted NFT collection with 100 tickets, ready for purchase!
```

### Conversational Check-ins

```
User: "Check in ticket #42 for event 0.0.12345"
HashBot: ✅ Verified ownership and logged check-in to HCS audit trail!
```

## 🔐 Security Architecture

### Environment Variables

**Server-only (never exposed to client)**

- `HEDERA_ACCOUNT_ID` - Your operator account
- `HEDERA_PRIVATE_KEY` - Private key for blockchain operations
- `HEDERA_MIRROR_URL` - Mirror node endpoint
- `GROQ_API_KEY` - AI model access

**Client-available (prefixed with `NEXT_PUBLIC_`)**

- `NEXT_PUBLIC_HEDERA_NETWORK` - Network identifier
- `NEXT_PUBLIC_BASE_URL` - Application base URL

⚠️ **Critical**: Ensure network alignment across server and client configurations.

## 🎯 Core Workflows

### 1. AI-Assisted Event Creation

1. Open HashBot chat or visit `/vendor`
2. Describe your event in natural language
3. AI extracts structured data and creates blockchain resources
4. Get HCS Topic ID and HashScan links automatically

### 2. Blockchain Event Deployment

1. AI agent creates HCS Topic for event audit trail
2. Stores event metadata on-chain
3. Returns Topic ID with HashScan verification link

### 3. NFT Ticket Collection Creation

1. AI agent mints NFT collection for tickets
2. Configures supply, metadata, and pricing
3. Returns Token ID with HashScan verification

### 4. Secure Purchase Flow

1. Buyer sends HBAR to vendor (off-chain)
2. Submits payment transaction ID through UI
3. Backend verifies payment via Mirror Node
4. AI agent mints and transfers NFT ticket to buyer
5. Logs purchase to event's HCS topic

### 5. Smart Check-in System

1. Scan QR code or enter ticket details
2. AI agent validates current ownership via Mirror Node
3. Logs check-in event to HCS audit trail
4. Returns verification with HashScan links

## 🔗 API Endpoints

### AI Agent Interface

```typescript
POST /api/chat
{
  "userAccountId": "0.0.buyer",
  "input": "Create a music festival next month",
  "history": [...] // Chat context
}
```

### Event Management

```typescript
POST /api/events/purchase
{
  "eventId": "0.0.topicId",
  "buyerAccountId": "0.0.buyer",
  "paymentTxId": "0.0.from@timestamp",
  "ticketTokenId": "0.0.tokenId"
}
```

### Check-in Validation

```typescript
POST /api/events/checkin
{
  "eventId": "0.0.topicId",
  "tokenId": "0.0.tokenId",
  "serialNumber": 1,
  "ownerAccountId": "0.0.owner" // Optional strict validation
}
```

## 🌐 HashScan Integration

All blockchain operations include transparent HashScan links:

- **Topics**: `https://hashscan.io/{network}/topic/{topicId}`
- **Tokens**: `https://hashscan.io/{network}/token/{tokenId}`
- **Transactions**: `https://hashscan.io/{network}/transaction/{txId}`

## 🚀 Deployment

```bash
# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 🔧 Troubleshooting

### AI Agent Issues

- Verify `GROQ_API_KEY` is set correctly
- Check Hedera network alignment in environment variables
- Restart development server after `.env` changes

### Blockchain Operations

- Ensure sufficient HBAR balance in operator account
- Verify payment transaction IDs are valid and confirmed
- Check Mirror Node connectivity for payment verification

### Network Configuration

- `HEDERA_NETWORK` and `NEXT_PUBLIC_HEDERA_NETWORK` must match
- Use correct Mirror Node URL for your network (testnet/mainnet)

## 🛡️ Security Best Practices

- ❌ **Never expose private keys to client-side code**
- ✅ **All privileged operations happen server-side**
- ✅ **Payment verification through Mirror Node**
- ✅ **Ownership validation before check-ins**

### Production Recommendations

- Replace file-based storage with enterprise database
- Implement role-based access control (RBAC)
- Add comprehensive rate limiting and monitoring
- Set up proper audit logging and alerting
- Use hardware security modules (HSM) for key management

## 🗺️ Roadmap

- [ ] **Enhanced Wallet Integration** - Seamless association and signing UX
- [ ] **QR Code Check-ins** - Mobile-first ticket validation
- [ ] **Database Migration** - PostgreSQL/MongoDB backend
- [ ] **Advanced RBAC** - Multi-tenant vendor management
- [ ] **Ticket Marketplace** - Secondary sales with royalties
- [ ] **Mobile App** - React Native companion app
- [ ] **Analytics Dashboard** - Event performance metrics
- [ ] **Multi-language Support** - Global accessibility

## 🤝 Contributing

This proof-of-concept demonstrates the potential of AI-blockchain integration. Contributions welcome for:

- Enhanced AI agent capabilities
- Additional Hedera service integrations
- UI/UX improvements
- Security enhancements

## 📄 License

## MIT License

**Built with ❤️ using Hedera's enterprise blockchain infrastructure and cutting-edge AI technology.**
