# Replay

**Atomic pay-per-interaction social feed on Movement EVM**

Every reply costs 0.001 MOVE. No spam. Pure signal.

## What is Replay?

Replay is a consumer-facing social app where **replies don't exist until payment clears**. Using the x402 protocol and Privy embedded wallets, users can:

1. Sign in with email/SMS (no seed phrases, no wallet connect)
2. Read the feed freely
3. Pay 0.001 MOVE to post a reply
4. See replies appear atomically after payment

## Tech Stack

- **Frontend**: Next.js 15 (App Router)
- **Authentication**: Privy embedded wallets
- **Payments**: x402 protocol (HTTP 402)
- **Chain**: Movement EVM Testnet

## How x402 Works

```
1. User taps "Reply"
2. POST /api/replies → 402 Payment Required
3. Client receives payment requirements
4. Privy modal appears (one signing moment)
5. User confirms payment
6. Retry with X-PAYMENT header
7. Payment verified → Reply created
8. Reply appears in feed
```

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add:
- `NEXT_PUBLIC_PRIVY_APP_ID` - Get from [Privy Dashboard](https://dashboard.privy.io)
- `X402_SELLER_ADDRESS` - Your wallet address to receive payments

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── posts/          # GET/POST posts (free)
│   │   │   └── [id]/       # GET single post
│   │   └── replies/        # POST reply (x402 payment required)
│   ├── globals.css         # Design system
│   ├── layout.tsx          # Root layout with Privy
│   └── page.tsx            # Main feed page
├── components/
│   ├── providers.tsx       # Privy provider config
│   ├── Header.tsx          # App header with auth
│   ├── Feed.tsx            # Post feed container
│   ├── PostCard.tsx        # Individual post display
│   ├── ReplyCard.tsx       # Individual reply display
│   └── ReplyForm.tsx       # Pay-to-reply form
├── hooks/
│   └── usePayment.ts       # x402 payment flow hook
└── lib/
    ├── movement.ts         # Chain config
    ├── x402.ts             # x402 protocol implementation
    └── store.ts            # In-memory data store
```

## Key Files

### `/src/lib/x402.ts`
The x402 protocol implementation. Handles:
- Payment requirements parsing
- Signed transaction encoding
- 402 response creation

### `/src/hooks/usePayment.ts`
React hook for the payment flow:
- Integrates with Privy embedded wallets
- Manages payment state (idle → signing → confirming → success/error)
- Handles the full 402 → sign → retry pattern

### `/src/app/api/replies/route.ts`
Payment-gated API route:
- Returns 402 with requirements on first request
- Verifies X-PAYMENT header on retry
- Creates reply after payment verification

## Design Principles

1. **Invisible wallets**: Users never see addresses or connect buttons
2. **Single signing moment**: Only one Privy modal per payment
3. **Atomic actions**: Reply either exists (paid) or doesn't
4. **No spam**: Economic skin in the game for every interaction

## Movement EVM Testnet

- **Chain ID**: 30732
- **RPC**: https://mevm.testnet.imola.movementlabs.xyz/v1
- **Explorer**: https://explorer.testnet.imola.movementlabs.xyz

## License

MIT
