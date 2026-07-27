# Phase 06: Checkout

## Completed: Built-in with initial project

## Overview

Full guest checkout flow with address form, coupon application, gift note, and payment integration.

## Features

- Address form with Zod validation
- Coupon code entry with validation
- Gift note (optional, max 300 chars)
- Server-side cart re-pricing
- Order summary display
- Razorpay payment integration
- Mock mode for development

## Flow

1. User fills shipping details + gift note
2. Applies coupon (optional)
3. Submits → creates payment order + pending order
4. Razorpay checkout opens (or mock mode auto-completes)
5. Payment verification
6. Stock decremented
7. Emails sent
8. Redirect to order success page

## Components

- `checkout-client.tsx` — Full checkout form with payment integration
- `order-success-client.tsx` — Success page with order summary

## Automation

- `order.created` → log activity
- `order.paid` → inventory decrement, email confirmation, coupon usage
