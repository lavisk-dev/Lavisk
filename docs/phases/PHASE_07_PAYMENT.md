# Phase 07: Payment

## Completed: Built-in with initial project

## Overview

Payment provider abstraction with Razorpay implementation. Cashfree and Stripe adapters are stubbed.

## Architecture

```
PaymentProvider (interface)
  ├── RazorpayService   ✅ Live
  ├── CashfreeService   🔧 Stubbed
  └── StripeService     🔧 Stubbed
```

## Provider Interface

- `createOrder(input)` → Provider order ID
- `verifyPayment(input)` → boolean
- `verifyWebhookSignature(rawBody, signature)` → boolean

## Switch Provider

Set `PAYMENT_PROVIDER=razorpay|cashfree|stripe` in `.env.local`

## Mock Mode

When Razorpay keys are not configured, the checkout flow returns a mock order and auto-completes so the full flow is demoable.
