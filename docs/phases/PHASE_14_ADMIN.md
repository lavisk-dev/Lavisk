# Phase 14: Admin

## Completed: Built-in with initial project

## Overview

Full admin panel with sidebar navigation, topbar, and CRUD management for all entities.

## Pages

| Page | Route | Features |
|---|---|---|
| Dashboard | /admin | Stats cards, recent orders, top products |
| Products | /admin/products | Table, search, create, edit |
| Orders | /admin/orders | Table, status filter, status update |
| Categories | /admin/categories | Grid, create, delete |
| Coupons | /admin/coupons | Table, create, edit, delete |
| Reviews | /admin/reviews | Table, approve/reject |
| Banners | /admin/banners | Table, create, edit, delete |
| Customers | /admin/customers | Table, order count, total spent |
| Analytics | /admin/analytics | Revenue by category, order status funnel |
| Settings | /admin/settings | Integration status, store details |

## Auth

- Cookie-based HMAC-signed session
- Admin API routes verify session server-side
- Dev mode bypasses auth (NODE_ENV=development)
- Configurable via ADMIN_USERNAME, ADMIN_PASSWORD env vars
