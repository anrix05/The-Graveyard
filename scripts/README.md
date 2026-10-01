# Development, Maintenance & Seeding Scripts

This directory contains standalone developer scripts, database seed harnesses, asset generators, and API verification tools for **The Graveyard**.

---

## Scripts Inventory

### 1. `seed.ts` — Comprehensive Marketplace Seed Harness
Populates the local or remote Supabase instance with a production-grade 24-project dataset across all canonical modes (`buy`, `adopt`, `collab`).

- **Usage:**
  ```bash
  # Idempotently upsert demo users and listings
  npm run seed

  # Purge only demo dataset rows and re-seed cleanly
  npm run seed -- --reset-demo
  ```
- **What it creates:**
  - **Demo Seller:** `seller@graveyard.dev` / `GraveyardDemo2026!` (@demo_seller) — owns 5 projects including `InvoiceForge` (Flagship #1), with ₹6,498 in test sales and received pitches.
  - **Demo Buyer:** `buyer@graveyard.dev` / `GraveyardDemo2026!` (@demo_buyer) — pre-seeded with acquired code in Vault (`MarkdownMint`, `TaskTide`) and submitted pitches.
  - **8 Community Developers:** `@arjun.dev`, `@priya_builds`, `@meera_codes`, `@kabir_ships`, etc.
  - **24 Realistic Listings:** 18 live codebases + 6 resurrected entries on the Resurrected Wall.
  - **Authentic Zip Archives:** Creates verified ZIP archives for demo listings in Supabase storage matching declared `file_tree` structures.

---

### 2. `generate-icons.ts` — Brand Favicon & PWA Asset Generator
Renders high-resolution brand icons from the canonical vector skull mark (`SkullMark` in `#ff2a2a`) using `sharp`.

- **Usage:**
  ```bash
  npx tsx scripts/generate-icons.ts
  ```
- **Generated Assets:**
  - `public/favicon.ico`: 32×32 ICO / PNG for desktop browser tabs.
  - `src/app/icon.svg` & `public/icon.svg`: Scalable vector favicon without background bounding box.
  - `src/app/apple-icon.png`: 180×180 Apple touch icon.
  - `public/icon-192.png`: 192×192 PWA web manifest icon.
  - `public/icon-512.png`: 512×512 high-res PWA icon.

---

### 3. `test_github_invite.ts` — GitHub Collaborator Automation Test
Tests the GitHub Collaborator invitation API integration (`inviteCollaborator`) against a live repository.

- **Prerequisites:** Ensure `.env.local` contains:
  ```env
  GITHUB_ACCESS_TOKEN=your_github_personal_access_token
  TEST_GITHUB_REPO=owner/repo_name
  TEST_GITHUB_USER=target_github_username
  ```
- **Running the test:**
  ```bash
  npx tsx scripts/test_github_invite.ts
  ```

---

### 4. `cleanup-test-listings.sql` — Database Maintenance Query
SQL script to clean up orphaned or transient test listings created during manual QA runs without disrupting active platform records.

- **Usage:**
  Execute directly in the Supabase SQL Editor as needed.
