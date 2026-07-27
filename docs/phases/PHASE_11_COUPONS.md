# Phase 11: Coupons

## Completed: Built-in with initial project  
## Enhanced: 2026-07-24 (Automation)

## Overview

Coupon system with percentage and flat discounts, validation, and usage tracking.

## Features

- Percentage discounts
- Flat discounts
- Min order value constraint
- Max discount cap
- Expiration date
- Usage limit
- Usage tracking
- Admin CRUD

## Automation

| Event | Trigger | Actions |
|---|---|---|
| `coupon.created` | New coupon | Log activity |
| `coupon.usage_incremented` | Coupon applied | Log activity |
