# Phase 17: Deployment

## Planned

## Overview

Deployment configuration for production hosting.

## Platform

Recommended: Vercel (optimized for Next.js)

## Environment Variables

Required variables for production (see .env.example):
- Supabase: URL, anon key, service role key
- Razorpay: Key ID, secret, webhook secret
- Resend: API key, from email, admin notification email
- Cloudinary: Cloud name, API key, secret
- Admin: Username, password, session secret
- Site URL

## Build

```bash
npm run build   # 46+ routes, static + dynamic
npm run start   # Production server
```

## CI/CD

### GitHub Actions Workflow

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run build
      - uses: amondnet/vercel-action@v25
```

## Monitoring

- Vercel Analytics for page views
- Sentry for error tracking (recommended)
- Uptime monitoring

## Database Migrations

Supabase migrations should be managed via the Supabase CLI for production schema changes.

## Rollback

Vercel provides instant rollback to previous deployments.
