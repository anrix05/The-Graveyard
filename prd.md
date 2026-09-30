# Product Requirements Document (PRD)
## The Graveyard — V2.2 Motion-Forward Developer Platform

---

### Document Information
- **Product Name:** The Graveyard
- **Document Version:** 2.2.0
- **Status:** Approved / Active
- **Target Platform:** Web (Desktop & Mobile Responsive)
- **Core Technology Stack:** Next.js 16 (App Router), Supabase (Auth, PostgreSQL, Storage), Tailwind CSS, Lenis, Framer Motion, Razorpay API, GitHub REST API, Sharp, JSZip
- **Last Updated:** October 2026

---

## 1. Executive Summary & Vision

### 1.1 The Problem
Developers, indie hackers, and software engineers abandon countless side projects, prototypes, and minimum viable products (MVPs) each year. These codebases end up buried in private GitHub repositories or forgotten hard drives—representing thousands of hours of skilled engineering that yield zero value, monetization, or impact.

### 1.2 The Solution
**The Graveyard V2.2** is a motion-forward, editorial developer marketplace that turns dead projects into a badge of honor. Through authentic tombstone telemetry, an even 624px/300px bento featured grid, comprehensive project detail dossiers (status stats, checklists, file trees, screenshot galleries), single-source feed counts, a dedicated Resurrected Wall, and high-craft typography, The Graveyard enables developers to monetize abandoned repositories, claim open foundations, or find co-founders to bring dead ideas to life.

---

## 2. Core Feature Sets

### 2.1 The Tombstone Concept
Every codebase records and displays its authentic burial telemetry:
- **`cause_of_death`**: `lost_interest`, `no_time`, `pivoted`, `ran_out_of_funding`, `tech_outdated`, `cofounder_left`, `scope_creep`, `other`.
- **`abandoned_on`**: User-entered or automatically populated from the verified GitHub repository's last git commit timestamp.
- **`last_commit_at`**: Immutable GitHub commit timestamp.
- **`epitaph`**: A witty or poignant 140-character developer tagline (e.g. *"Shipped the auth, forgot the product."*).
- **`revived_at`**: Timestamp set upon completed purchase, claim, or filled partnership.

### 2.2 Live-Only Feed Default & Resurrected Wall
- **Live Feed Default**: Default marketplace query excludes sold/filled projects (`is_sold: false` and `is_collab_filled: false`), redirecting all resurrected codebases to the **Resurrected Wall**.
- **Include Resurrected Toggle**: When toggled in the filter bar, revived projects blend back into the feed with dimmed styling and `REVIVED` badges.
- **Resurrected Wall**: Horizontally draggable, scroll-snapped rail highlighting successfully revived codebases, showing adopter handles and revival timestamps.

### 2.3 Single-Source Feed Engine & Featured Resurrections
- **Unified Query**: All counts (mode tabs, "Showing N", and stats row) are derived from the unified `get_marketplace_feed(...)` query.
- **Featured Bento (v2.2)**: Desktop `lg+` layout is a fixed-height bento: a 12-column grid with 300px row height and 24px gap.
  - Large card spans columns 1–7 and 2 rows (624px tall).
  - Two compact cards span columns 8–12, 1 row each (300px tall).
  - Equal 2-item fallback (side-by-side) and 1-item fallback (full-width).
  - Universal `CardFooter` with seller avatar + username, tabular price / collab terms pill, and 40px circular arrow button with hover nudge.

### 2.4 Full Project Details Data Model (v2.2)
- **`tagline`**: Max 120 character one-line pitch.
- **`completion_percent`**: Progress integer (0–100) displayed on covers and detail stats.
- **`lines_of_code`**: LOC integer rendered with `formatLOC(n)` (e.g. `14.2k`).
- **`features`**: String array of working capabilities ("What works").
- **`todo_items`**: String array of unfinished items ("What's left / Known gaps").
- **`setup_notes`**: Markdown instructions for running the project with copyable code blocks.
- **`screenshots`**: Up to 6 public image URLs displayed in a 16:10 preview with Radix Dialog lightbox.
- **`file_tree`**: Up to 300 relative file paths rendered in a collapsible hierarchical explorer.
- **`collab_roles`**: Array of `{ role, commitment, description }` for co-founder listings.
- **`is_featured` & `featured_rank`**: Service-role protected flags for editorial curation.
- **`seed_key`**: Service-role protected unique string for idempotent demo seeding.

### 2.5 Project Detail Dossier (v2.2)
1. **Hero**: Cover image with view transition, mode pill, title, tagline, tombstone line, epitaph pull-quote, and metadata strip.
2. **Screenshot Gallery**: 16:10 main preview, thumbnail strip, Radix modal lightbox with arrow-key/Esc navigation.
3. **Status at Death**: Unboxed stat row (`Completion 85%`, `Lines of code 14.2k`, `Last commit Mar 2025`, `Dead for 1y 6m`) with progress bar.
4. **About this Project**: Sanitized markdown renderer (headings, lists, code with copy buttons).
5. **What Works / What's Left**: Two-column checklist (✓ and ○).
6. **What's Inside**: Collapsible file tree with file icons and internal scroll.
7. **Setup Notes**: Markdown run instructions and env var hints.
8. **Collab Roles**: Dedicated cards detailing partner roles, weekly commitment, and terms.
9. **Recommendations**: Compact cards for "More from this seller" and "Similar projects".
10. **Sticky Action Panel**: Purchase/claim/apply CTA with "What you get" dynamic checklist.

### 2.6 Publish Wizard Enhancements (v2.2)
- Step 1: Collapsible "Add details (recommended)" editor for tagline, completion percent slider, LOC, features, todo items, setup notes, and multi-image screenshot uploader.
- Step 2: Collab roles builder for seeking partner listings.
- Step 3: Client-side zip inspection via `JSZip` extracting file tree and auto-excluding `.env*`, `node_modules/`, `.git/` with seller review.
- Step 4: High-fidelity "Preview as buyer" matching the real detail dossier.

### 2.7 Complete Demo Dataset & Seeding (v2.2)
- 24 realistic demo projects (18 live + 6 revived) across 10 developer personas.
- 8 flagship projects with procedurally generated SVG/PNG dark wireframes rendered via `sharp`.
- Guaranteed archive contents matching `file_tree` via strict seed assertion.
- Complete activity history (orders, vault assets, collab pitches, messages, notifications).
