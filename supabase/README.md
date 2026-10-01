# Supabase Database Schemas & Migrations

This directory contains the database structure, Row Level Security (RLS) policies, storage bucket configurations, and incremental migrations for **The Graveyard** (v2.8).

---

## Directory Organization

```
supabase/
├── RUN_IN_SUPABASE_SQL_EDITOR.sql      # ⭐ Primary consolidated one-click setup script
│
├── migrations/                         # Authoritative chronological migrations
│   ├── 20261001000000_graveyard_v2.sql           # Base tables, RLS, transactions, paise pricing
│   ├── 20261001010000_graveyard_v3_tombstones.sql   # Tombstone telemetry & synchronized feed RPC
│   ├── 20261001020000_graveyard_v4_details.sql      # Project details, file trees, roles, completion %
│   └── [legacy incremental migrations]           # Historical schema patches
│
└── schemas/                            # Modular reference schemas
    ├── init_db.sql                     # Base tables & enums
    ├── reconciled_policies.sql         # Consolidated RLS policies & storage rules
    └── security_hardening.sql          # Additional integrity checks
```

---

## Recommended Setup (Fresh Project)

For a fresh Supabase project:

### Option A: One-Click SQL Setup (Recommended)
1. Open the [Supabase Dashboard](https://app.supabase.com) → **SQL Editor**.
2. Copy and paste the entire contents of **`RUN_IN_SUPABASE_SQL_EDITOR.sql`**.
3. Click **Run**. This establishes:
   - All tables (`profiles`, `projects`, `transactions`, `collaborations`, `messages`, `notifications`, `project_assets`).
   - RLS policies ensuring buyer transaction privacy, private messaging, and delivery asset security.
   - Synchronized count RPCs (`get_marketplace_stats`, `get_marketplace_feed_v3`).
   - Storage buckets: `project-files` (private archives) and `project-assets` (public covers/screenshots).

### Option B: Chronological Migrations
If using the Supabase CLI (`supabase db push`) or executing migrations sequentially:
1. `migrations/20261001000000_graveyard_v2.sql`
2. `migrations/20261001010000_graveyard_v3_tombstones.sql`
3. `migrations/20261001020000_graveyard_v4_details.sql`

---

## Data Seeding & Verification

After database initialization, populate the 24-project demo marketplace using the automated seed harness:

```bash
npm run seed
```

This creates the demo seller (`seller@graveyard.dev`), demo buyer (`buyer@graveyard.dev`), 8 community developers, and 24 fully populated listings with real downloadable archives.

---

## Key Schema & Security Principles

1. **Paise Pricing:** Monetary values are strictly stored as integers in paise (`price_paise`) to prevent floating-point calculation errors. UI displays formatted Indian Rupees (`formatINR`).
2. **Delivery Asset Isolation:** The public `projects` table only exposes boolean indicators (`has_archive`, `has_repo`). Sensitive access coordinates reside in `project_assets` with strict RLS restricted to verified buyers and project owners.
3. **Account Deletion Protocol:** Self-service deletion (`/api/account/delete`) anonymizes the profile (`deleted_<shortid>`), archives owner listings, and permanently bans the auth account, while strictly preserving transaction records so prior purchasers retain download access.
