# Lavisk — Event-Driven E-commerce Automation Platform

## Overview

Lavisk is a premium DTC (Direct-to-Consumer) gift e-commerce platform built as an Event-Driven E-commerce Automation Platform. Every business operation is automated through events, minimizing manual work while remaining modular, scalable, maintainable, secure, and production-ready.

## Current Scope (MVP)

- Guest checkout only (no customer login/registration)
- No AI/ML features
- Full admin panel for store management
- Event-driven automation for all business operations

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React Server Components) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui + Radix UI |
| Animation | Framer Motion |
| State | Zustand (cart, wishlist, UI) with localStorage persistence |
| Database | Supabase PostgreSQL (with mock fallback) |
| Images | Cloudinary |
| Payments | Razorpay (primary), Cashfree/Stripe stubbed |
| Email | Resend |
| Validation | Zod + React Hook Form |
| Automation | Custom EventBus + ActivityLog (Event-Driven Architecture) |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages + API routes
│   ├── (storefront)/       # Public pages (/, /shop, /product, /cart, /checkout, etc.)
│   ├── admin/              # Admin panel (login + route group)
│   └── api/                # Route Handlers (no Express/FastAPI)
├── components/             # React components
│   ├── ui/                 # shadcn-style primitives
│   ├── layout/             # Navbar, Footer, CartDrawer, MobileNav
│   ├── home/               # Hero, sections, marquee
│   ├── products/           # ProductCard, Grid, Filters, CartClient
│   ├── checkout/           # CheckoutClient, OrderSuccessClient
│   ├── admin/              # Sidebar, tables, managers
│   └── shared/             # JsonLd, Reveal, Magnetic, AmbientBackground
├── lib/                    # Business logic (never imported by components directly)
│   ├── services/           # Service layer (Supabase + mock fallback)
│   │   ├── payment/        # PaymentProvider interface + implementations
│   │   ├── email/          # Resend email templates
│   │   ├── cloudinary/     # Image upload helpers
│   │   └── automation/     # Event bus, activity log, automation registry
│   ├── supabase/           # Client, server, admin clients
│   ├── types/              # Shared domain types
│   ├── utils/              # Utilities, validation schemas, API helpers
│   ├── constants/          # Brand config, nav links, hero slides
│   └── data/               # Mock seed data
├── store/                  # Zustand stores
└── middleware.ts           # Admin auth gate

docs/                       # Project documentation
├── PROJECT_OVERVIEW.md
├── AUTOMATION_ARCHITECTURE.md
├── EVENT_FLOW.md
├── BUSINESS_RULES.md
├── SYSTEM_DESIGN.md
├── DATABASE_SCHEMA.md
├── API_REFERENCE.md
├── CHANGELOG.md
└── phases/                 # Per-phase documentation
```

## Architecture Principles

1. **Event-Driven**: Every business operation triggers events that automate downstream tasks
2. **Service Layer**: Components never touch the database directly
3. **Provider Pattern**: Payment, Email, Image providers are behind interfaces
4. **Graceful Fallback**: All services work with mock data when external services aren't configured
5. **Server-First**: React Server Components for data fetching, minimal client JavaScript

## Running Locally

```bash
npm install
cp .env.example .env.local
npm run dev          # → http://localhost:3000
```

The app runs immediately with mock data. No external services are required.
