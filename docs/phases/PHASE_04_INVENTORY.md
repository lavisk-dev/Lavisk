# Phase 04: Inventory

## Completed: Built-in with initial project  
## Enhanced: 2026-07-24 (Automation)

## Overview

Stock tracking integrated into the Product service. Inventory is decremented on paid orders and restored on cancellations.

## Features

- Stock field on products
- Decrement on payment confirmation
- Restoration on cancellation
- Low-stock detection via automation
- Oversell prevention (max 0 stock floor)
- Max 20 units per line item

## Automation

| Event | Trigger | Action |
|---|---|---|
| `inventory.decremented` | Order paid | Log activity |
| `inventory.restored` | Order cancelled | Log activity |
| `inventory.low_stock` | Stock ≤ 5 | Admin notification |

## Business Rules

- Stock cannot go below 0
- Full quantity restored on cancellation
- Low stock threshold: 5 units (configurable)
