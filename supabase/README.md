# Supabase Database Schemas & Migrations

This directory contains the database structure, security policies, storage buckets, and incremental migrations for **The Graveyard**.

---

## Directory Organization

```
supabase/
├── schemas/                # Authoritative base schemas & consolidated security scripts
│   ├── init_db.sql         # Base tables, triggers, and functions
│   ├── reconciled_policies.sql # Consolidated RLS policies, unique constraints & storage setup
│   ├── security_hardening.sql  # Additional integrity checks & hardening rules
│   ├── setup_database.sql  # Alternative consolidated database setup
│   ├── setup_payment_db.sql # Razorpay transaction table setup
│   └── setup_storage.sql   # Storage bucket initialization
│
└── migrations/             # Incremental schema migrations, patches & fixes
    ├── add_analytics_and_reviews.sql
    ├── add_archived_column.sql
    ├── add_collab_filled_to_projects.sql
    ├── add_contact_info_to_profiles.sql
    ├── add_delete_flags_to_messages.sql
    ├── add_github_repo_columns.sql
    ├── add_github_username_to_transactions.sql
    ├── add_metadata_to_transactions.sql
    ├── add_phone_number_to_profiles.sql
    ├── add_repo_link_column.sql
    ├── allow_buyer_view_transactions.sql
    ├── allow_seller_delete_project.sql
    ├── allow_seller_project_update.sql
    ├── allow_seller_update_transactions.sql
    ├── allow_seller_view_transactions.sql
    ├── create_messages_table.sql
    ├── create_transactions_table.sql
    ├── fix_cascade_delete.sql
    ├── fix_collaboration_schema.sql
    ├── fix_database.sql
    ├── fix_seller_transaction_visibility.sql
    ├── fix_sold_rpc.sql
    ├── fix_storage.sql
    ├── fix_transactions_rls.sql
    └── secure_messages_rls.sql
```

---

## Quick Setup Instructions

For a fresh database instance in the [Supabase SQL Editor](https://app.supabase.com):

1. **Step 1: Execute Base Schema**
   - Run `schemas/init_db.sql` to generate core tables (`profiles`, `projects`, `transactions`, `messages`), enums, and foreign keys.

2. **Step 2: Execute Authoritative Security & Policies**
   - Run `schemas/reconciled_policies.sql`.
   - This script establishes:
     - Strict Row Level Security (RLS) on all tables.
     - Unique indexes preventing duplicate completed transactions and duplicate payment IDs.
     - Private `project-files` storage bucket setup with authenticated upload/download policies.
