# Phase 09: Emails

## Completed: Built-in with initial project

## Overview

Transactional email via Resend with HTML templates.

## Email Types

| Type | Recipient | Trigger |
|---|---|---|
| Order confirmation | Customer | Payment verified |
| Admin notification | Admin | New order placed |
| Contact acknowledgement | Customer | Contact form submitted |
| Shipping notification | Customer | Order status → shipped |
| Delivery confirmation | Customer | Order status → delivered |

## Templates

All emails use a branded HTML template with:
- Gradient header (brand pink)
- Order details table
- Brand footer

## Configuration

Set `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL` in `.env.local`
