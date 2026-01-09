# Replay — Senior Architect Audit Report

**Date**: January 7, 2026  
**Auditor**: Senior Architect Review  
**Project**: Replay — Atomic Pay-Per-Interaction Social Feed  
**Stack**: Next.js 15, React 19, Privy, x402 Protocol, Movement EVM Testnet

---

## Executive Summary

Replay is a consumer-facing social app implementing **atomic pay-per-reply** using the x402 payment protocol on Movement EVM. The architecture is sound for an MVP/hackathon demo, but has **critical gaps** that must be addressed before pilot or production deployment.

| Category | Status | Priority |
|----------|--------|----------|
| x402 Payment Flow | 🟡 Partially Implemented | **CRITICAL** |
| Privy Integration | 🟢 Well Structured | Medium |
| Data Persistence | 🔴 In-Memory Only | **CRITICAL** |
| Wallet Signing | 🔴 Not Implemented | **CRITICAL** |
| API Security | 🟡 Basic | High |
| Error Handling | 🟡 Minimal | Medium |
| Testing | 🔴 None | High |
| UI/UX | 🟢 Polished | Low |

---

## 1. CRITICAL: x402 Payment Flow is Simulated

### Current State

The x402 flow is **architecturally correct** but **functionally simulated**:

```
Client → POST /api/replies → 402 + Requirements ✅
Client → Sign Transaction → ??? 🔴 NOT IMPLEMENTED
Client → Retry with X-PAYMENT → Decode Header ✅
Server → Verify Payment → SIMULATED 🔴
Server → Return Reply ✅
```

### File: `src/app/api/replies/route.ts` (Lines 30-55)

```typescript
// For MVP: Simulate successful payment
// Generate a mock transaction hash
const txHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
return { valid: true, txHash };
```

**Problem**: No actual blockchain interaction. Anyone can post replies without paying.

### Required Implementation

1. **Transaction Signing (Client Side)**
   ```typescript
   // src/hooks/usePayment.ts — MISSING FILE
   
   async function signPaymentTransaction(requirements: PaymentRequirements) {
     const wallet = await getEmbeddedWallet(); // From Privy
     const provider = await wallet.getEthereumProvider();
     
     const tx = {
       to: requirements.payTo,
       value: requirements.amount,
       chainId: movementTestnet.id,
     };
     
     // Create and sign raw transaction
     const signedTx = await provider.request({
       method: 'eth_signTransaction',
       params: [tx],
     });
     
     return signedTx;
   }
   ```

2. **Real Payment Verification (Server Side)**
   ```typescript
   // Integration with x402 facilitator
   async function verifyPayment(paymentHeader: string) {
     const response = await fetch('https://facilitator.stableyard.fi/verify', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: paymentHeader,
     });
     
     if (!response.ok) throw new Error('Payment rejected');
     
     const { txHash, confirmed } = await response.json();
     return { valid: confirmed, txHash };
   }
   ```

3. **Fallback: Direct On-Chain Verification**
   ```typescript
   import { createPublicClient, http } from 'viem';
   
   async function verifyOnChain(txHash: string, expectedAmount: bigint) {
     const client = createPublicClient({
       chain: movementTestnet,
       transport: http(),
     });
     
     const receipt = await client.waitForTransactionReceipt({ hash: txHash });
     // Validate amount, recipient, etc.
   }
   ```

---

## 2. CRITICAL: Data Persistence is In-Memory

### Current State

All data is stored in JavaScript `Map` objects:

```typescript
// src/lib/store.ts
const users: Map<string, User> = new Map();
const posts: Map<string, Post> = new Map();
```

**Problem**: Data is lost on every server restart. Completely unacceptable for any real use.

### Required Implementation

**Recommended: Supabase or Vercel Postgres**

```typescript
// src/lib/db.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function addReply(postId: string, authorId: string, content: string, txHash: string) {
  const { data, error } = await supabase
    .from('replies')
    .insert({
      post_id: postId,
      author_id: authorId,
      content,
      payment_tx_hash: txHash,
      payment_amount: REPLY_COST_WEI,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
```

**Database Schema**:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id),
  author_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  payment_tx_hash TEXT NOT NULL,
  payment_amount TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. CRITICAL: Wallet Signing Not Connected

### Current State

The frontend **simulates** the payment flow:

```typescript
// src/components/ReplayApp.tsx (Lines 278-303)
const handleSubmitReply = async (content: string) => {
  setIsSubmitting(true);
  setShowPaymentConfirm(true);

  // Simulate x402 payment flow ❌
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // No actual API call, no actual signing
  // Just adds to local state
};
```

**Problem**: The `usePayment` hook was deleted but never replaced with real implementation.

### Required Implementation

Create `src/hooks/usePayment.ts`:

```typescript
'use client';

import { useState, useCallback } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { x402Fetch, PaymentRequirements, buildPaymentTransaction } from '@/lib/x402';
import { movementTestnet } from '@/lib/movement';

export function usePayment() {
  const { wallets } = useWallets();
  const [status, setStatus] = useState<'idle' | 'signing' | 'confirming' | 'success' | 'error'>('idle');

  const submitPaidReply = useCallback(async (postId: string, content: string) => {
    const wallet = wallets.find(w => w.walletClientType === 'privy') || wallets[0];
    if (!wallet) throw new Error('No wallet');

    setStatus('signing');

    const response = await x402Fetch(
      '/api/replies',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, content, walletAddress: wallet.address }),
      },
      async (requirements: PaymentRequirements) => {
        // This is where Privy shows its signing modal
        const provider = await wallet.getEthereumProvider();
        const tx = buildPaymentTransaction(requirements);
        
        try {
          const signedTx = await provider.request({
            method: 'eth_signTransaction',
            params: [{
              from: wallet.address,
              to: tx.to,
              value: `0x${tx.value.toString(16)}`,
              chainId: `0x${tx.chainId.toString(16)}`,
            }],
          });
          setStatus('confirming');
          return signedTx;
        } catch (e) {
          setStatus('error');
          return null;
        }
      }
    );

    if (response.ok) {
      setStatus('success');
      return await response.json();
    }
    
    setStatus('error');
    throw new Error('Payment failed');
  }, [wallets]);

  return { status, submitPaidReply };
}
```

---

## 4. HIGH: API Security Issues

### Issues Identified

1. **No Rate Limiting**
   - Attackers can spam 402 requests without penalty
   
2. **No Request Signing**
   - No way to verify the request comes from the claimed wallet
   
3. **No Replay Protection**
   - Signed transactions could be replayed (though facilitator should handle this)

4. **No CORS Restriction**
   - API routes are open to any origin

### Required Implementation

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function middleware(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const entry = requestCounts.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };
  
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + RATE_LIMIT_WINDOW;
  }
  
  entry.count++;
  requestCounts.set(ip, entry);
  
  if (entry.count > MAX_REQUESTS) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## 5. HIGH: Missing Testing

### Current State

**Zero tests**. No unit tests, no integration tests, no E2E tests.

### Required Implementation

```typescript
// __tests__/api/replies.test.ts
import { POST } from '@/app/api/replies/route';
import { NextRequest } from 'next/server';

describe('POST /api/replies', () => {
  it('returns 402 without payment header', async () => {
    const request = new NextRequest('http://localhost/api/replies', {
      method: 'POST',
      body: JSON.stringify({ postId: '1', content: 'test', walletAddress: '0x...' }),
    });
    
    const response = await POST(request);
    expect(response.status).toBe(402);
    expect(response.headers.get('X-PAYMENT-REQUIREMENTS')).toBeTruthy();
  });

  it('creates reply with valid payment', async () => {
    const validPayment = Buffer.from(JSON.stringify({
      signedTransaction: '0x...',
      timestamp: Date.now(),
    })).toString('base64');
    
    const request = new NextRequest('http://localhost/api/replies', {
      method: 'POST',
      headers: { 'X-PAYMENT': validPayment },
      body: JSON.stringify({ postId: 'post-1', content: 'test', walletAddress: '0x...' }),
    });
    
    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
```

---

## 6. MEDIUM: Error Handling Gaps

### Issues

1. **No Error Boundaries**
   ```typescript
   // Missing top-level error boundary
   export default function Error({ error, reset }) {
     return <div>Something went wrong</div>;
   }
   ```

2. **Silent Failures in Payment Flow**
   - User sees loading state forever if API fails

3. **No Network Error Recovery**
   - No retry logic for transient failures

---

## 7. GOOD: What's Working Well

### ✅ UI/UX
- Polished, mobile-first design from Figma
- Dark theme with proper theming
- Animated components with Motion

### ✅ Architecture
- Clean separation of concerns
- Proper TypeScript types
- x402 protocol structure is correct

### ✅ Privy Integration
- Graceful fallback for development
- Correct embedded wallet configuration
- Movement EVM chain configured

---

## 8. Implementation Priority

### Phase 1: Make It Real (Day 1-2)

| Task | File | Effort |
|------|------|--------|
| Implement `usePayment` hook | `src/hooks/usePayment.ts` | 4h |
| Connect hook to ReplayApp | `src/components/ReplayApp.tsx` | 2h |
| Real facilitator verification | `src/app/api/replies/route.ts` | 4h |
| Add database (Supabase) | `src/lib/db.ts` | 4h |

### Phase 2: Make It Secure (Day 3)

| Task | File | Effort |
|------|------|--------|
| Add rate limiting | `src/middleware.ts` | 2h |
| Request validation | API routes | 2h |
| Error boundary | `src/app/error.tsx` | 1h |

### Phase 3: Make It Testable (Day 4)

| Task | File | Effort |
|------|------|--------|
| Unit tests for x402 | `__tests__/lib/x402.test.ts` | 3h |
| API integration tests | `__tests__/api/*.test.ts` | 4h |
| E2E payment flow | `e2e/payment.spec.ts` | 4h |

---

## 9. Files to Create

```
src/
├── hooks/
│   └── usePayment.ts           ← CRITICAL: Payment hook
├── lib/
│   └── db.ts                   ← CRITICAL: Database client
├── middleware.ts               ← HIGH: Rate limiting
├── app/
│   ├── error.tsx               ← MEDIUM: Error boundary
│   └── api/
│       └── health/
│           └── route.ts        ← LOW: Health check
__tests__/
├── lib/
│   └── x402.test.ts
└── api/
    └── replies.test.ts
```

---

## 10. Environment Variables Needed

```env
# Required for Production
NEXT_PUBLIC_PRIVY_APP_ID=xxx          # From Privy dashboard
X402_SELLER_ADDRESS=0x...             # Your wallet
X402_FACILITATOR_URL=https://...      # Payment verification

# Database
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx         # For server-side

# Optional
NEXT_PUBLIC_MOVEMENT_RPC_URL=https://mevm.testnet.imola.movementlabs.xyz/v1
```

---

## Summary

**The Replay architecture is solid, but the implementation is ~40% complete.**

The critical path to a working demo:
1. ✅ x402 API structure — Done
2. ✅ UI/UX — Done  
3. ✅ Privy setup — Done
4. 🔴 **Real signing** — Not implemented
5. 🔴 **Real verification** — Not implemented
6. 🔴 **Persistence** — Not implemented

**Estimated time to pilot-ready: 2-3 days of focused work.**
