# Phase 02: Database

## Completed: Built-in with initial project

## Overview

The database schema is defined in the service layer through Supabase queries. The schema is documented in DATABASE_SCHEMA.md.

## Tables

8 core tables: products, categories, orders, reviews, coupons, banners, contacts, blog_posts

## Key Decisions

- Snake_case column names for Supabase/PostgreSQL convention
- JSONB for complex objects (addresses, items, images, FAQs)
- TEXT primary keys for mock data compatibility
- All timestamps use TIMESTAMPTZ
