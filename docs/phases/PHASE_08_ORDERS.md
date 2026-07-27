# Phase 08: Orders

## Completed: Built-in with initial project  
## Enhanced: 2026-07-24 (Automation)

## Overview

Order management with status tracking, payment attachment, and automation.

## Features

- Order creation with auto-generated order number
- Status management (pending → paid → processing → shipped → delivered → cancelled → refunded)
- Payment attachment with stock decrement
- Order lookup by number (for success page)
- Admin order list with status filtering
- Admin status updates

## Automation

| Event | Trigger | Actions |
|---|---|---|
| `order.created` | Order creation | Log activity |
| `order.paid` | Payment verification | Decrement stock, send confirmation email, increment coupon usage, admin notification |
| `order.status_changed` | Admin status update | Email notifications, stock restoration (if cancelled) |

## Business Rules

- Order number format: `GFT-{ts_base36}-{random}`
- Status can be changed to any value by admin
- Cancellation restores full stock quantity
- Payment attachment automatically decrements stock
