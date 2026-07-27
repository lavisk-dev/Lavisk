# Phase 05: Shipping

## Completed: Built-in with initial project

## Overview

Shipping fee calculation integrated into CartService. All pricing is done server-side.

## Rules

- Free shipping on orders ≥ ₹499
- Flat ₹99 shipping fee below threshold
- ₹0 shipping on empty carts

## Data Flow

```
CartService.price(items)
  → lookup products from database
  → calculate line totals
  → apply shipping rules
  → return PricedCart with subtotal, shipping, total
```
