# The Graveyard: Changelog & V2 Migration Guide

## 0. Execution & Run Order

To get the full system running locally with seeded data, execute commands in this exact sequence:

1. **Environment Setup:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials, Razorpay test keys, and GitHub access token
   ```
2. **Apply Database Migration (Run manually in Supabase SQL Editor):**
   ```sql
   -- File: supabase/migrations/20261001000000_graveyard_v2.sql
   -- Execute the SQL in Supabase dashboard to create tables, functions, triggers, and RLS policies
   ```
3. **Run Database Seed:**
   ```bash
   npm run seed
   # Creates demo buyer (buyer@graveyard.dev) & demo seller (seller@graveyard.dev)
   # Seeds 14 realistic listings with SVG cover art, sample transactions, pitches, messages, and notifications
   ```
4. **Start Development Server:**
   ```bash
   npm run dev
   # Terminal accessible at http://localhost:3000
   ```

---

## 1. Assumptions Made

1. **Listing Modes & Monetization Model:**
   - `buy`: Strictly exclusive one-time sale. Stored with `price_paise > 0`. Upon completed purchase, the listing is permanently marked `is_sold = true` and cannot be bought again.
   - `adopt`: Free claim (`price_paise = 0`). Unlimited claims globally, but strictly 1 claim per user (enforced via unique index `(project_id, buyer_id)`).
   - `collab`: Pitch/collaboration matching (`price_paise = 0`). No price or valuation is displayed anywhere. Ends when the seller marks the role filled (`is_collab_filled = true`).
2. **Delivery Credentials Isolation:**
   - Sensitive delivery coordinates (`file_path`, `github_repo_full_name`, `is_private_repo`) are separated into `project_assets` with strict RLS. The public `projects` table only exposes boolean flags `has_archive` and `has_repo`.
3. **Route URLs & Compatibility:**
   - Both `/project/[id]` and `/projects/[id]` are supported (the latter automatically performs a Next.js redirect to `/project/[id]`).
4. **GitHub Collaborator Management:**
   - The platform PAT (`GITHUB_ACCESS_TOKEN`) can manage repositories administered by the configured account or demo organization. If a repo invite fails during purchase, the purchase remains completed and valid; the buyer can download the source archive directly and retry the GitHub invitation at any time from the Operative Vault.
5. **Linting in Next.js 16:**
   - Next.js 16 separates linting from the core CLI. `npm run lint` is configured to run `tsc --noEmit` (strict TypeScript compiler verification) alongside `eslint.config.mjs`.
6. **v2.3 Intro Animation Assumptions:**
   - **Session scope:** Default intro storage uses `sessionStorage` (`graveyard:intro:v1`) so it plays once per browser tab session.
   - **Home route only:** Intro is triggered only on full document load of `/` (`INTRO_ENABLED_ROUTES = ['/']`). Direct entry to other routes marks the session as seen and suppresses the intro.
   - **Skull assembled from 6 vertical slices:** The vector skull is clipped into 6 equal-width `<clipPath>` segments and assembled with alternating vertical offsets (±24px to ±60px) and a 70ms center-outward stagger.
   - **Green eye ignition:** Skull color transitions from dim grey to white, then ignites into brand red (`#ff2a2a`) while the eye sockets and nasal cavity flash neon green (`#39ff14`) with a pre-rendered radial glow aura before executing a FLIP flight to the navbar logo.

---

## 2. Workstream Breakdown

### Workstream A: Database and Security
- **File:** `supabase/migrations/20261001000000_graveyard_v2.sql` (Idempotent script).
- **A1. Anti-Double-Sale & Multi-Claim Prevention:**
  - Added `transactions.kind text CHECK (kind IN ('buy','adopt'))`.
  - Added unique partial index `transactions(project_id) WHERE status='completed' AND kind='buy'`.
  - Added unique partial index `transactions(project_id, buyer_id) WHERE status='completed' AND kind='adopt'`.
  - Extended `transactions.status` to `pending | completed | failed | refunded`.
  - Added `razorpay_order_id`, `expires_at` (10-minute soft hold), `invite_status`, `invite_error`.
- **A2. Integer Currency Model:**
  - Added `projects.price_paise integer NOT NULL DEFAULT 0` and migrated legacy floating-point prices.
  - CHECK constraints: `buy` requires `price_paise > 0`; `adopt` and `collab` require `price_paise = 0`.
- **A3. Delivery Data Isolation (`project_assets`):**
  - Created `project_assets(project_id uuid PK, file_path, github_repo_id, github_repo_full_name, is_private_repo, file_size_bytes)`.
  - Removed delivery coordinates from public `projects` table; added public booleans `has_archive` and `has_repo`.
  - RLS on `project_assets`: Accessible only to the seller or to buyers with a completed transaction.
- **A4. Public Attributes on `projects`:**
  - Added `cover_url`, `demo_url`, `license`, `collab_terms`.
- **A5. Column Protection Trigger & RPC:**
  - Added `BEFORE UPDATE` trigger on `projects` blocking non-service-role updates to `seller_id`, `is_sold`, `views`, `interaction_type`, `price_paise`, and `created_at`.
  - Created SECURITY DEFINER RPC `increment_project_view(p_id uuid)` that ignores seller self-views.
- **A6. Transactions Security:**
  - Restricted transaction writes strictly to the `service_role`. Removed client INSERT/UPDATE policies.
- **A7. Storage RLS:**
  - Locked down `project-files` bucket with prefix matching `(storage.foldername(name))[1] = auth.uid()::text`.
  - Created public bucket `project-covers` (max 2MB, images only) with owner-prefix write restrictions.
- **A8. Messaging Isolation:**
  - Added `thread_key text` and `project_id` reference with compound index.
  - Added immutable content trigger blocking modifications to message bodies after dispatch.
  - Enabled Realtime on `messages` and `notifications`.
- **A9. New Tables:**
  - Created `collab_requests` table with RLS and uniqueness constraint `(project_id, applicant_id)`.
  - Created `notifications` table with RLS.
- **A10. Profiles:**
  - Added `username text UNIQUE`, `avatar_url`, and `bio`.
- **A11. Stats RPC:**
  - Created `get_marketplace_stats()` returning single-source counts: `live_total`, `for_sale`, `free_forks`, `open_collabs`, `resurrected`, and `operatives`.

### Workstream B: API and Backend Logic
- **B1. `/api/create-order`:** Zod validation, JWT buyer resolution, project state checks (`is_sold`, `is_archived`), 10-minute soft-hold check, live GitHub username validation (`GET /users/:user`), order creation in paise, pending transaction insertion.
- **B2. `lib/fulfillment.ts` (`fulfillPurchase`):** Idempotent shared engine for payment verification and webhooks. Verifies Razorpay capture status, executes atomic DB transaction marking project sold, dispatches GitHub collaborator invite, updates `invite_status`, and creates in-app notifications.
- **B3. `/api/verify-payment`:** Constant-time HMAC-SHA256 signature verification (`crypto.timingSafeEqual`), JWT buyer confirmation, fulfillment invocation.
- **B4. `/api/razorpay-webhook`:** Webhook signature verification over raw body using `RAZORPAY_WEBHOOK_SECRET`. Handles `payment.captured` for users who closed checkout tabs prematurely.
- **B5. `/api/claim` & `/api/claim-project`:** Free Fork adoption endpoint. Idempotent claim recording (`FREE_CLAIM_*`), GitHub invite dispatch, and owner notifications.
- **B6. `/api/retry-invite`:** Entitlement-checked collaborator invite retry endpoint for buyers and claimers.
- **B7. `/api/secure-download`:** Generates 60-second presigned S3 download URLs without exposing bucket keys.
- **B8. `/api/collab`:** Pitch submission (Zod validated, 50-character minimum), accept/reject handlers (owner-only), and position filled toggles.
- **B9. `/api/project-access`:** Returns delivery entitlement status, repo URL, invite status, and download availability for authorized users.
- **B10. `/api/validate-repo`:** Server-side GitHub repository admin permission check (`permissions.admin === true`).
- **B11. `/api/cron` & `/api/cron/ping`:** Daily cron job (`0 3 * * *` in `vercel.json`) with `CRON_SECRET` protection to keep Supabase database active.
- **B12. `/api/demo-login`:** Server-side one-click demo authentication for buyer and seller roles when `NEXT_PUBLIC_DEMO_MODE=true`.

### Workstream C: Design System v2
- **C1. Color Tokens & Contrast (WCAG AA):** Defined `--bg`, `--surface`, `--surface-2`, `--border`, `--fg`, and high-contrast `--muted` (`#9ca3af`, replacing illegible `#6b7280`). Established mode accents: buy (`#39ff14`), adopt (`#fbbf24`), collab (`#3b82f6`).
- **C2. 3-Layer `CyberFrame`:** Solved the `clip-path` drop-shadow clipping bug by decoupling the outer drop-shadow glow layer, the chamfered border layer, and the chamfered inner surface.
- **C3. Global Focus & Motion:** Consistent white `:focus-visible` outlines, disabled glitch/stagger animations under `prefers-reduced-motion`.
- **C4. Role-Based Buttons:** Primary (mode accent), Secondary (neutral surface), Ghost (outlined), Danger (red).
- **C5. Typography:** Inter for high-readability body text, Chakra Petch for industrial headers, JetBrains Mono for telemetry, prices, and IDs.
- **C6. Atomic Components:** `CyberFrame`, `Button`, `Input`, `Textarea`, `Badge`, `TechBadge`, `ProjectCard`, `CoverImage`, `StatCard`, `Skeleton`, `EmptyState`, `Avatar`, `Stepper`, `ConfirmDialog`, `NotificationBell`, `Sonner`.
- **C7. Status Representation:** Every status indicator couples an icon with text (`[OK] LIVE`, `[SOLD]`, `[CLAIMED]`, `[FILLED]`, `[ERR] FAILED`).
- **C8. Strict Effects Budget:** Cyberpunk scanlines and subtle glitches restricted to hero and landing visual; calm styling enforced across checkout, publish wizard, dashboard, settings, and messaging.

### Workstream D: Screen-by-Screen Redesign
- **D1. Global Header & Footer:** Logo, Browse, Submit, unread notification bell, user avatar menu with direct routes to Console, Vault, Messages, Settings. Real `/terms` and `/privacy` legal pages.
- **D2. Home Marketplace (`/`):** Compact ~340px hero, single-source stats strip (`get_marketplace_stats`), sticky filter bar with search, mode tabs, sort dropdown, canonical tech chips, and equal-height `ProjectCard` grid.
- **D3. Login & Onboarding (`/login`):** Two-panel desktop layout, Sign in / Create account tabs, OAuth triggers, demo login buttons, and username/avatar onboarding step.
- **D4. Publish Wizard (`/submit`):** 4-step wizard (Basics -> Type & Pricing -> Delivery -> Review) with draft localStorage autosave, calm styling, and instant listing publication.
- **D5. Project Detail (`/project/[id]`):** Cover hero, seller reputation card, readable description, checklist of deliverables, and sticky mode-specific action panel with real-time view incrementing.
- **D6. Operative Console (`/dashboard`):** 6-tab terminal: Overview stats, My Listings table with `ConfirmDialog` typing verification, Vault with signed downloads and invite retry, Sales ledger, Collabs pitch manager, and Realtime messaging inbox.
- **D7. Notifications:** Realtime unread count bell dropdown with deep links to matching dashboard tabs.
- **D8. Live Design System (`/design-system`):** Interactive page rendering all tokens, components, buttons, badges, frames, and effects budget guidelines.

### Workstream E: Flows and States
- **E1. Return URL Auth Gate:** Unauthenticated clicks on Buy/Claim/Apply redirect to `/login?next=...&intent=...` and automatically restore the user's action upon login.
- **E2. One-Click Free Claim:** Optimistic button updates, duplicate claim handling, instant Vault addition.
- **E3. Calm Checkout Modal:** Visible TEST MODE strip with copyable test card and UPI IDs, GitHub username prefill, order lifecycle transitions, and clear error recovery.
- **E4. Collab Pitching:** Modal with minimum 50-character validation counter, background, contact info, and automatic notification dispatch to project owners.
- **E5. Resilience:** Skeletons, empty states with CTAs, and Sonner feedback across all mutations.

### Workstream F: Seed Data & Testing Harness
- **Script:** `scripts/seed.ts` (runnable via `npm run seed`).
- Creates idempotent demo seller (`seller@graveyard.dev`) and demo buyer (`buyer@graveyard.dev`).
- Seeds 14 realistic listings (5 For Sale, 5 Free Fork, 4 Seeking Partner) with procedural SVG cover art, transactions, pitches, messages, and notifications.

### Workstream G: Accessibility & Performance
- WCAG AA contrast compliance across all text and buttons.
- Fully keyboard-navigable dialogs and menus.
- Configured `next.config.ts` image domains for Supabase and Dicebear avatars.

### Workstream H: Documentation
- Rewrote `README.md` with interface showcases, Mermaid architecture diagrams, setup guide, test mode instructions, and production roadmap.
- Updated `docs/prd.md`, `docs/design.md`, and `docs/architecture.md`.

---

## 3. Environment Variables Added / Updated

| Variable | Description | Client/Server |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase privileged key for fulfillment & admin | **Server only** |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay public test key | Public |
| `RAZORPAY_KEY_SECRET` | Razorpay secret test key | **Server only** |
| `RAZORPAY_WEBHOOK_SECRET` | Secret key for verifying `/api/razorpay-webhook` | **Server only** |
| `GITHUB_ACCESS_TOKEN` | Platform PAT with repository admin privileges | **Server only** |
| `CRON_SECRET` | Secret bearer token for `/api/cron` | **Server only** |
| `NEXT_PUBLIC_DEMO_MODE` | Set to `true` to enable one-click demo login buttons | Public |
| `DEMO_SELLER_EMAIL` | Email for demo seller (`seller@graveyard.dev`) | Server / Seed |
| `DEMO_SELLER_PASSWORD` | Password for demo seller | Server / Seed |
| `DEMO_BUYER_EMAIL` | Email for demo buyer (`buyer@graveyard.dev`) | Server / Seed |
| `DEMO_BUYER_PASSWORD` | Password for demo buyer | Server / Seed |

---

## 4. Files Added, Modified & Renamed

### Added Files
- `supabase/migrations/20261001000000_graveyard_v2.sql`: Comprehensive idempotent migration script.
- `scripts/seed.ts`: Database seed script with 14 listings and mock cyberware accounts.
- `src/lib/fulfillment.ts`: Idempotent fulfillment engine.
- `src/lib/format.ts`: Currency and paise formatting helpers.
- `src/app/api/create-order/route.ts`: Soft-hold and order initiation endpoint.
- `src/app/api/verify-payment/route.ts`: Timing-safe payment verification endpoint.
- `src/app/api/razorpay-webhook/route.ts`: Webhook backup fulfillment endpoint.
- `src/app/api/claim/route.ts`: Free fork adoption endpoint.
- `src/app/api/retry-invite/route.ts`: GitHub collaborator invitation retry endpoint.
- `src/app/api/secure-download/route.ts`: Presigned download URL generator.
- `src/app/api/collab/route.ts`: Collaboration pitch and status endpoint.
- `src/app/api/project-access/route.ts`: Entitlement status verification endpoint.
- `src/app/api/validate-repo/route.ts`: GitHub repository admin verification endpoint.
- `src/app/api/cron/route.ts`: Vercel daily cron endpoint.
- `src/app/api/cron/ping/route.ts`: Cron health ping alias.
- `src/app/api/demo-login/route.ts`: One-click demo sign-in endpoint.
- `src/components/ui/CyberFrame.tsx`: 3-layer chamfered container solving drop-shadow clipping.
- `src/components/ui/Button.tsx`: Role-based button component.
- `src/components/ui/CoverImage.tsx`: Deterministic SVG pattern fallback cover component.
- `src/components/ui/StatCard.tsx`: Chamfered stat display component.
- `src/components/ui/EmptyState.tsx`: Cyberpunk empty state placeholder.
- `src/components/ui/Skeleton.tsx`: Content loading skeleton.
- `src/components/ui/Avatar.tsx`: Operative avatar with initials fallback.
- `src/components/ui/Stepper.tsx`: Form wizard progress tracker.
- `src/components/ui/ConfirmDialog.tsx`: Action confirmation dialog with typing check.
- `src/components/ui/NotificationBell.tsx`: Realtime unread notification bell.
- `src/components/PaymentModal.tsx`: Calm checkout modal with test credentials.
- `src/components/CollabRequestModal.tsx`: Collaboration pitch submission modal.
- `src/components/ChatInterface.tsx`: Realtime messaging two-pane console.
- `src/app/projects/[id]/page.tsx`: Redirect page pointing to `/project/[id]`.
- `src/app/design-system/page.tsx`: Live design system showcase.
- `src/app/terms/page.tsx`: Terms of Service page.
- `src/app/privacy/page.tsx`: Privacy Policy page.
- `src/app/not-found.tsx`: Styled 404 screen.
- `src/app/error.tsx`: Styled error boundary.
- `src/app/loading.tsx`: Styled loading indicator.
- `docs/MANUAL_QA.md`: Complete verification and security test checklist.
- `CHANGELOG.md`: This comprehensive migration and architectural changelog.

### Modified Files
- `package.json`: Added seed script and strict TypeScript lint command.
- `next.config.ts`: Added image domains and SVG security configuration.
- `vercel.json`: Changed cron frequency to daily (`0 3 * * *`).
- `tailwind.config.ts`: Integrated Design System v2 tokens and chamfers.
- `src/index.css`: Rebuilt with WCAG AA compliant variables and motion budgets.
- `src/app/layout.tsx`: Configured fonts and Sonner notification toaster.
- `src/app/page.tsx`: Rewrote marketplace homepage.
- `src/app/login/page.tsx`: Redesigned auth screen with demo login and onboarding.
- `src/app/submit/page.tsx`: Rebuilt as a 4-step wizard with draft autosave.
- `src/app/project/[id]/page.tsx`: Redesigned detail view with sticky action panels.
- `src/app/dashboard/page.tsx`: Rebuilt Operative Console with 6 functional tabs.
- `src/app/edit/[id]/page.tsx`: Updated project editing form with protected field guards.
- `src/components/ProjectCard.tsx`: Equal-height card with mode badges.
- `src/components/Header.tsx`: Rebuilt navigation with auth menu and notification bell.
- `src/components/Footer.tsx`: Updated legal links and test mode notice.
- `src/components/FilterBar.tsx`: Sticky toolbar with URL synchronization.
- `src/types/project.ts`: Added v2 types, integer pricing, and canonical constants.
- `src/lib/supabase.ts`: Added helper utilities for authenticated user extraction.
- `src/lib/github.ts`: Added repository validation and collaborator invitation routines.
- `README.md`: Completely updated documentation suite.
- `docs/architecture.md`: Updated schema, ERD, and fulfillment sequence.

---

# THE GRAVEYARD V2.0: MOTION-FORWARD EDITORIAL REDESIGN

## 0. V2 Execution & Run Order

To migrate from V1 to V2 and start the motion site locally:

1. **Apply V3 Tombstone Database Migration (Supabase SQL Editor):**
   ```sql
   -- File: supabase/migrations/20261001010000_graveyard_v3_tombstones.sql
   -- Adds cause_of_death, abandoned_on, last_commit_at, epitaph, revived_at
   -- Creates get_marketplace_feed(...) RPC with synchronized count telemetry
   ```
2. **Prune Test Listings (Optional):**
   ```sql
   -- File: scripts/cleanup-test-listings.sql
   -- Review preview query and execute DELETE template if junk test data exists
   ```
3. **Run V2 Seed Script:**
   ```bash
   npm run seed
   # Creates 8 distinct developer profiles, 14 live listings, and 8 revived listings with tombstones
   ```
4. **Start Development Server:**
   ```bash
   npm run dev
   # Site live at http://localhost:3000
   ```

---

## 1. V2 Assumptions Made

1. **Font Loading & Delivery (Font TODO):**
   - Clash Display (500, 600) and Satoshi (400, 500, 700) are loaded via the official Fontshare stylesheet with `preconnect` links in `app/layout.tsx`.
   - Instrument Serif Italic and JetBrains Mono are loaded via `next/font/google`.
   - **TODO for Production:** Self-host Clash Display and Satoshi local woff2 files in `app/fonts/` with `next/font/local` when binary font files are deployed.
2. **Single-Source Counts & Live Feed Default:**
   - The marketplace feed defaults to **live listings only** (`is_sold: false` and `is_collab_filled: false`).
   - Sold and claimed projects are directed to the **Resurrected Wall** horizontal snap rail.
   - When the user toggles "Include resurrected", revived projects blend back in with dimmed styling.
   - Mode tab counts, "Showing N", and stats row query the same filtered dataset via `get_marketplace_feed` RPC to ensure counts never conflict.
3. **Paise Pricing & NaN Elimination:**
   - All prices across cards, detail, checkout, sales ledger, and dashboard use `formatINR(paise: number | null | undefined)`.
   - Zero returns `Free`, null/undefined returns `—`, and `NaN` is strictly impossible.
4. **Chamfer Signature Boundary:**
   - As instructed, the cyberpunk chamfer cut (`chamfer-primary` and `chamfer-badge`) is preserved **only** on the primary CTA button and the mode badge as a brand signature.
   - `CyberFrame` was removed from cards, inputs, modals, and panels to eliminate boxiness and prevent clipped focus outlines. Soft 12px to 24px radii are used everywhere else.
5. **Deterministic CoverArt:**
   - When a listing has no custom cover upload (`cover_url: null`), `CoverArt` generates inline SVG with layered gradients and code runes based on a deterministic string hash of `project.id` and title. Zero network requests, zero canvas overhead.

---

## 2. Workstream Breakdown (V2 Master Prompt)

### Workstream A: Tombstone Concept & Data Model
- **Migration:** `supabase/migrations/20261001010000_graveyard_v3_tombstones.sql`.
- Added `projects.cause_of_death` with enum check: `'lost_interest'`, `'no_time'`, `'pivoted'`, `'ran_out_of_funding'`, `'tech_outdated'`, `'cofounder_left'`, `'scope_creep'`, `'other'`.
- Added `projects.abandoned_on date` and `projects.last_commit_at timestamptz`.
- Added `projects.epitaph text` (max 140 chars) and `projects.revived_at timestamptz`.
- Updated column protection trigger so `last_commit_at` is server-immutable.
- Created `get_marketplace_feed(...)` RPC returning items, total count, and per-mode counts under current search and tech filters.
- Created `src/lib/epitaph.ts` with `formatEpitaph(project)` handling missing data safely.

### Workstream B: Editorial Typography System
- Integrated **Clash Display** for headings (sentence case, tight letter-spacing).
- Integrated **Satoshi** for body and interface text.
- Integrated **JetBrains Mono** for prices, dates, IDs, and micro-labels.
- Integrated **Instrument Serif Italic** for pull-quote epitaphs.
- Fluid type scale via CSS `clamp()` (`text-hero-display: clamp(3rem, 9vw, 8rem)`).
- Eliminated all-caps headings, all-caps buttons, and all-caps nav.

### Workstream C: Visual Language v2 (Tokens & Primitives)
- Surfaces: `--bg #0a0a0b`, `--surface #111113`, `--surface-2 #17171a`, `--surface-3 #1e1e22`, hairline `--line rgba(255,255,255,0.08)`.
- Radii: 20px cards, 24px modals, 12px inputs, 16px popovers, fully rounded pills.
- Film grain: Static SVG noise overlay at 0.035 opacity (`body::after`).
- Button variants: Primary chamfered with mode accent, secondary rounded pill, ghost with animated underline, danger.
- Removed `CyberFrame` from cards, inputs, and modals.
- Deterministic gradient avatars with initials in `src/components/ui/Avatar.tsx`.

### Workstream D: Motion System
- Motion tokens (`lib/motion.ts`): `easeOutExpo`, durations, `useMotionAllowed()`, `useFinePointer()`.
- Smooth scroll: `<SmoothScroll>` provider using Lenis in root layout with `data-lenis-prevent` on modals and sheets.
- Text reveals: `<SplitText>` staggered translateY masked animation.
- Generative cover art: `CoverArt.tsx` inline SVG with layered mesh gradients and code glyphs.
- Hero canvas: `SoulsCanvas.tsx` 2D canvas with ~140 ascending runes, pointer repulsion, DPR capping (1.5), and IntersectionObserver auto-pause.
- Micro-interactions: `<Magnetic>` primary button, `<CustomCursor>` with "View"/"Drag" modes, sliding mode pill indicator via Framer `layoutId`, infinite CSS `<TechMarquee>`.
- Card to detail transition: `<TransitionLink>` with View Transitions API (`view-transition-name: project-<id>`).
- Sticky storytelling: `<HowItWorksStack>` 3-step scroll stack (List, Discover, Resurrect).

### Workstream E: Home Page Rebuild (`/`)
- Tall hero (~84svh) with `SoulsCanvas` background and SplitText headline.
- Unboxed live stats row with large Clash Display numerals and count-up animation.
- Sticky `<FilterBar>` with mode pill slider, tech popover, sort popover, and "Include resurrected" toggle.
- 12-column `<FeaturedResurrections>` bento grid.
- Live-only marketplace card grid with 20px borderless ProjectCard.
- Horizontal draggable `<ResurrectedWall>` for revived codebases.
- Giant wordmark footer (`Footer.tsx`) with 3-column layout and unboxed test notice.

### Workstream F: Restyled Screens
- **Project Detail (`/project/[id]`):** Full-bleed cover hero, tombstone pull quote, seller card, 20px radius sticky action panel.
- **Login (`/login`):** Split layout with ambient glow and calm 24px auth card.
- **Publish Wizard (`/submit`):** Calm styling, tombstone inputs in Step 1, thin progress line with labeled dots, buyer perspective preview.
- **Checkout Modal (`PaymentModal.tsx`):** 24px radius, slim amber TEST MODE pill, calm transitions.
- **Dashboard (`/dashboard`):** Soft sidebar pills, unboxed telemetry numbers, hairline table dividers.
- **Chat (`ChatInterface.tsx`):** Soft 20px container, rounded-xl chat bubbles, Satoshi input.
- **Notifications (`NotificationBell.tsx`):** 16px radius popover with hairline dividers.
- **404 & Empty States (`not-found.tsx`, `EmptyState.tsx`):** Tasteful inline SVG tombstone illustration and editorial copy ("This page is dead. Nobody resurrected it.").

### Workstream G: Seed & Demo Data Updates
- Rewrote `scripts/seed.ts` with 8 distinct fictional developers.
- Seeded 14 live listings and 8 revived listings with authentic tombstone metadata (`cause_of_death`, `abandoned_on`, `epitaph`).
- Integer paise pricing throughout (`price_paise`).

### Workstream H: Accessibility, Performance & Responsiveness
- `prefers-reduced-motion`: Disables Lenis, SplitText, SoulsCanvas (replaced with static gradient), cursor, and marquee.
- Server-rendered content readable before JS hydration.
- WCAG AA contrast compliance across all text and buttons.
- Capped DPR on canvas, lazy loading, and dynamic client imports.
- Responsive breakpoints from 320px to ultrawide desktop.

### Workstream I: Design System Page & Documentation
- Rebuilt `/design-system` showcasing typography scales, soft surface tokens, button/badge matrix, CoverArt gallery (12 samples), motion demos, and an interactive "reduce motion" simulator toggle.
- Updated `README.md`, `docs/prd.md`, `docs/design.md`, and `docs/architecture.md`.

### Workstream J: Dependency Housekeeping
- Added `lenis` for smooth scrolling.
- Cleaned unused CSS styles and verified TypeScript types.

### Workstream K: Verification
- Type-check passed with zero errors (`npx tsc --noEmit`).
- Production build passed with zero errors (`npm run build`).
- Created `scripts/cleanup-test-listings.sql`.
- Updated `docs/MANUAL_QA.md` with complete V2 verification checklist.

---

# THE GRAVEYARD — CHANGELOG v2.1 (Performance, Typography, Shapes & Craft)

## 0. Assumptions Log
1. **Font Strategy**: Replaced third-party external Fontshare stylesheets with `next/font/google` self-hosted font loader (`Bricolage_Grotesque`, `Geist`, `Geist_Mono`, `Instrument_Serif`). This eliminates font-rendering failures caused by blocked or slow third-party CDNs and ensures zero layout shifts with fallback stacks.
2. **Display Switcher**: Defaulted `DISPLAY_STYLE` to `'grotesk'` (Bricolage Grotesque) in `src/lib/fonts.ts`. A one-line change to `'serif'` sets `data-display="serif"` and re-routes `--font-display` to Instrument Serif.
3. **Shape Language**: Completely retired the cyberpunk chamfer and `CyberFrame` component across all components, badges, buttons, panels, and modals. All buttons are now standard pills (`rounded-full`), and all badges are rounded pills with colored indicator dots.
4. **Performance Governance**: Implemented three tiers (`high`, `mid`, `low`). Benchmarking measures frame delta times over 90 frames (~1.5s) during idle callback and downgrades if median frame time exceeds 24ms or 34ms. Automatic FPS downgrade is disabled in development mode (`NODE_ENV === 'development'`) to prevent false-positives caused by hot-reloading tooling.
5. **No Database or API Modifications**: Maintained backward-compatibility across all client queries (`select('*')` and in-memory normalizers) without modifying Supabase schemas, API contracts, or payment fulfillment logic.

## 1. Workstream Breakdown

### Workstream A: Self-Hosted Fonts & Safe Fallbacks
- Created `src/lib/fonts.ts` importing `Bricolage_Grotesque`, `Geist`, `Geist_Mono`, and `Instrument_Serif` from `next/font/google`.
- Applied all 4 `.variable` font classes to `<html>` in `src/app/layout.tsx`.
- Updated `tailwind.config.ts` font families to map to CSS variables with explicit system fallback stacks (`ui-sans-serif`, `system-ui`, `-apple-system`, `Segoe UI`, `Roboto`, `ui-monospace`, `Georgia`, `serif`).
- Added `[data-display="serif"]` support for single-token theme switching.
- Standardized typography scale: Bricolage 600 for display and headings, Geist 500/600 for card titles and nav, Geist Mono for telemetry and micro-labels, and Instrument Serif Italic for pull-quotes.

### Workstream B: Navbar Rebuild & Shape Language Standardization
- Deleted `src/components/ui/CyberFrame.tsx` and removed all references to `.chamfer-primary`, `.chamfer-badge`, `.chamfer-6`, `.chamfer-8`, and `.chamfer-12`.
- Standardized `Button.tsx` on pill shape language (`rounded-full`) across 40px (sm), 48px (md), and 56px (lg) heights. Primary buttons feature white fill and near-black text with a 3px micro-nudge arrow on hover; listing contexts adopt mode accent fills.
- Rebuilt `Header.tsx`:
  - Fixed 68px (desktop) / 60px (mobile) height, always visible (removed jumpy hide-on-scroll-down behavior).
  - Pill-shaped sliding highlight nav track (`bg-white/[0.04]` border with Framer `layoutId` pill sliding between "Browse" and "Submit project").
  - Solid translucent scrolled background `rgba(10,10,11,0.88)` with hairline border and zero `backdrop-filter`.
  - Scrolled state detected via an `IntersectionObserver` sentinel at page top rather than React state scroll handlers.
  - Full-screen solid-background mobile menu with 36px display links, staggered entry, scroll lock, and escape key listener.

### Workstream C: Performance Overhaul & Motion Tiers
- **C1 (Performance Governor):** Created `src/lib/perf.ts` and `src/hooks/usePerfTier.ts` supporting `high`, `mid`, and `low` tiers, static hardware detection, idle RAF benchmarking, and `NEXT_PUBLIC_PERF_FORCE` override.
- **C2 (SoulsCanvas Rewrite):** Pre-rendered glyphs to an offscreen 512x128 sprite atlas and rendered with `drawImage`. Removed `fillText`, `shadowBlur`, and per-particle gradients. Enforced 30fps cap, capped DPR (1.25), and added an elliptical legibility mask so particles fade to 0 over the headline, subline, CTAs, and scroll cue.
- **C3 (Custom Cursor Rewrite):** Capped to `high` tier only. Replaced dual-element offset followers with a single ring centered on pointer via `translate3d(x,y,0) translate(-50%, -50%)`. Driven with mutable refs in a single RAF loop (no state updates on mousemove). System cursor remains visible.
- **C4 (Expensive Effects Elimination):** Removed global fixed film grain overlay and `mix-blend-mode` from `body::after`. Removed `backdrop-filter` from header, filter bar, and cards. Added `content-visibility: auto` to below-the-fold sections.
- **C5 (Lenis Smooth Scroll):** Configured with `lerp: 0.1`, `autoRaf: true`, imported base `lenis.css`, wrapped root in `overflow-x: clip`, and provided pause/resume events during modal displays. Destroyed on low tier and reduced motion.
- **C6 (Scroll Reveals):** Replaced per-card Framer `whileInView` with a single shared `IntersectionObserver` adding an `.is-in` class with 500ms CSS transitions. Capped stagger delays to 300ms.
- **C7 (Navigation Speed):** Ensured zero `mode="wait"` exit animations blocking route changes. Wrapped view transitions in a 350ms safety timeout that never blocks `router.push`.
- **C8 (React Hygiene):** Wrapped `ProjectCard` in `React.memo`. Debounced search query (250ms) and applied `useDeferredValue`. Paginated feed in batches of 12 with a "Load more" button. Dynamic-imported (`ssr: false`) `SoulsCanvas`, `CustomCursor`, `TechMarquee`, and `ResurrectedWall`.
- **C9 (Production Benchmarking):** Added `"perf": "next build && next start"` to `package.json`.

### Workstream D: Hero Polish
- Engineered headline to fit strictly in 2 lines on desktop: "Where dead code" / "gets *resurrected*" (accent word in Instrument Serif Italic brand red).
- Formatted subline in Geist 18–20px at 75% opacity, max-width 58ch.
- Added two 52px pill CTAs: "Browse projects" (white primary) and "List a dead project" (secondary).
- Replaced old bouncing scroll cue with centered label `Scroll` and a thin animated vertical indicator line.
- Set hero container to `min-h-[88svh]`.

### Workstream E: Featured Section, Cards & CoverArt
- **E1 (CoverArt):** Configured `absolute inset-0 w-full h-full` inside relative overflow-hidden containers, eliminating the compact card empty grey panel. Enhanced visual richness with 2-3 mode gradient blobs (25-35% alpha), dot grid, and code glyphs.
- **E2 (Featured Bento):** 12-column layout (7 cols large card, 5 cols compact cards). Compact card cover stretches to 100% card height. Eliminated default browser underlines from titles. Handled 1, 2, and 3-item counts without empty panels.
- **E3 (Tombstone Rules):** Updated `formatEpitaph()` and `CAUSE_OF_DEATH_LABELS` to permanently omit "Natural causes" and default placeholders. Omitted cause when empty or `other`.
- **E4 (ProjectCard):** Pill mode badge with dot, container-filling cover, Geist 600 title without default underline, and aligned footer row.

### Workstream F: Restyled Design System Page
- Rebuilt `/design-system` with specimens for all four new fonts, the pill button system, pill badges, and bento cards.
- Integrated an interactive live Perf Tier Switcher (`high`, `mid`, `low`) that updates `data-perf` on `<html>` in real time.

## 2. Removed Dependencies & Deprecated Assets
- Removed Fontshare `@import` from `src/index.css`.
- Removed Fontshare `<link rel="preconnect">` from `src/app/layout.tsx`.
- Deleted `src/components/ui/CyberFrame.tsx`.
- Removed `.chamfer-primary`, `.chamfer-badge`, `.chamfer-6`, `.chamfer-8`, `.chamfer-12` from `src/index.css`.
- Removed `body::after` film grain with `mix-blend-mode: overlay`.

## 3. Environment Variables
- `NEXT_PUBLIC_PERF_FORCE`: Optional override (`high` | `mid` | `low`) to lock the performance governor tier during testing or automated QA.

---

# Version 2.2: Even Featured Section, Full Project Dossiers & Complete Demo Dataset

## 0. Execution & Run Order
To deploy and verify v2.2 additions:
1. **Apply v4 Database Migration:**
   ```sql
   -- File: supabase/migrations/20261001020000_graveyard_v4_details.sql
   -- Execute in Supabase SQL editor to add project detail columns, storage policies, and column protections
   ```
2. **Seed Complete 24-Project Demo Dataset:**
   ```bash
   npm run seed
   # To purge and re-create only the demo rows: npm run seed -- --reset-demo
   ```
3. **Start Development / QA Server:**
   ```bash
   npm run dev
   ```

## 1. Assumptions Made
1. **Curated Bento Grid Dimensions:**
   - Desktop bento grid row height is strictly 300px with a 24px gap. The large card spans 2 rows (624px tall) and compact cards span 1 row (300px tall), completely eliminating uneven heights and dark empty voids.
2. **Universal CardFooter:**
   - Standalone "Collab" mono labels, "View project" pills, and "Inspect →" text links are completely eliminated. Every card variant (large, compact, regular, resurrected) shares the standardized `CardFooter` with seller avatar + username on the left, tabular price / collab pill + 40px circular arrow button on the right.
3. **Archive Delivery Guarantee:**
   - The seed script verifies via strict runtime assertion (`assertZipMatchesFileTree`) that every downloadable `.zip` contains exactly the paths declared in `file_tree`.
4. **Wireframe Screenshot Generation:**
   - Flagship screenshots are generated procedurally with `sharp` from dark SVG wireframe templates using skeleton shapes instead of system fonts, tinted with the project's mode accent.
5. **Client-Side File Tree Inspection:**
   - Uses `jszip` client-side in the publish wizard to extract archive entries, filtering out `.env*`, `node_modules/`, and `.git/` by default.

## 2. Workstream Breakdown

### Workstream A: Data Model for Full Project Details
- **Migration:** `supabase/migrations/20261001020000_graveyard_v4_details.sql`.
- Added columns to `projects`: `tagline`, `completion_percent`, `lines_of_code`, `features` (text[]), `todo_items` (text[]), `setup_notes` (text), `screenshots` (text[]), `file_tree` (jsonb), `collab_roles` (jsonb), `is_featured` (boolean), `featured_rank` (smallint), `seed_key` (text UNIQUE).
- Updated column protection trigger so only the service role may alter `is_featured`, `featured_rank`, and `seed_key`.
- Added storage policies for `project-covers` (max 2MB, png/jpeg/webp, `auth.uid()` path prefix).
- Updated shared types in `src/types/project.ts` with `CollabRole` and detail fields.
- Implemented `lib/featured.ts` (`getFeatured`, `extractFeaturedFromList`) returning up to 3 curated listings by `featured_rank`, with views fallback and mode diversity.
- Added `formatLOC(n)` and `formatDeadFor(date)` in `src/lib/format.ts`.

### Workstream B: Even Featured Section and Card Evenness
- **Universal `CardFooter`:** Created `src/components/CardFooter.tsx` with gradient avatar, truncated `@username`, tabular price / collab pill, and 40px circular arrow button with hover nudge.
- **Featured Bento Grid:** Rebuilt `src/components/FeaturedResurrections.tsx`:
  - 3 items: Large card spans columns 1–7 (624px tall) and two compact cards span columns 8–12 (300px each).
  - 2 items: Equal vertical side-by-side layout.
  - 1 item: Full-width card.
  - Large card: ~55% cover fill, mode pill + completion chip, Geist 600 title, Instrument Serif pull-quote with gradient scrim, `CardFooter`.
  - Compact cards: 42% full-height cover, top meta row, 1-line clamped title without default underline, 3-line tagline, tech pills, tombstone telemetry, pinned `CardFooter`.
- **Regular Card Evenness:** Updated `src/components/ProjectCard.tsx` with fixed 16:10 cover aspect ratio, completion chip on cover, 2-line min-height for descriptions, single-row tech pills with `+N` overflow, and pinned `CardFooter`.

### Workstream C: Full-Detail Project Pages
- Rebuilt `src/app/project/[id]/page.tsx` with full engineering dossier:
  - Hero with shared-element view transition, mode pill, title, tagline, tombstone line, epitaph pull-quote, and live demo link.
  - `ScreenshotGallery.tsx`: 16:10 primary preview, thumbnail strip, and Radix Dialog lightbox with arrow-key/Esc navigation.
  - Status at death unboxed stat row (`Completion 85%`, `Lines of code 14.2k`, `Last commit Mar 2025`, `Dead for 1y 6m`) with progress bar.
  - `MarkdownRenderer.tsx`: Sanitized markdown renderer with one-click code block copy button.
  - What works / What's left two-column checklist (✓ and ○).
  - `FileTreeViewer.tsx`: Collapsible hierarchical file tree with file icons, `data-lenis-prevent`, and 360px internal scroll.
  - Collab roles cards detailing role name, commitment chip, and description.
  - "More from this seller" and "Similar projects" compact cards.
  - Sticky action panel with "What you get" dynamic checklist.

### Workstream D: Publish Wizard Additions
- Created `src/lib/validations/project.ts` with Zod schema validation for all detail fields.
- Updated `src/app/submit/page.tsx`:
  - Step 1: Collapsible "Add details (recommended)" section for tagline, completion percent slider, LOC, features chip editor, todo items chip editor, setup notes markdown textarea, and multi-image screenshot uploader with 2MB limit.
  - Step 2: Collab roles builder for seeking partner listings.
  - Step 3: Client-side zip inspection with `JSZip`, automatically filtering out `.env*`, `node_modules/`, `.git/` and rendering a reviewable file tree. Server GitHub tree fetch via `fetchRepositoryFileTree` in `src/lib/github.ts`.
  - Step 4: High-fidelity "Preview as buyer" matching the real detail dossier.

### Workstream E: Complete Demo Dataset (Seed Script Rewrite)
- Rebuilt `scripts/seed.ts` with idempotent upsert by `seed_key` and `--reset-demo` support.
- 10 developer personas (`demo_seller`, `demo_buyer`, and 8 fictional community engineers).
- 24 projects total:
  - 8 flagships with 3 procedurally rendered `sharp` dark wireframe screenshots (`scripts/lib/mock-screens.ts`).
  - 10 live projects across Buy, Adopt, and Collab modes.
  - 6 revived projects on the Resurrected Wall with historical `revived_at` timestamps.
- Downloadable zip archives uploaded to `project-files/<sellerId>/<projectId>.zip` strictly matching declared `file_tree`.
- Seeded realistic activity: ₹6,498 in `demo_seller` earnings, MarkdownMint & TaskTide in `demo_buyer` Vault, collab applications, messaging threads, and notifications.
- Created `scripts/cleanup-test-listings.sql` for purging ad-hoc test rows.

### Workstream F: Docs and Design System Page
- Rebuilt `src/app/design-system/page.tsx` with FeaturedSection 3/2/1 item states, universal `CardFooter` showcase, completion percent chips, and a full detail dossier preview block.
- Updated `README.md`, `prd.md`, `architecture.md`, `design.md`, and `CHANGELOG.md`.

## 3. New Dependencies
- `jszip` & `@types/jszip`: Client-side and script archive building & file tree extraction.

---

## 4. Version 2.3 — One-Time Skull Intro Animation

### Workstream A: Decision Logic With No Flash
- Created `src/lib/intro.ts`:
  - Storage keys: `graveyard:intro:v1` (session), `graveyard:intro:ts` (local timestamp).
  - Scope configuration: `INTRO_SCOPE: 'session' | 'local' | 'always'`.
  - Helpers: `shouldPlayIntro()`, `markIntroSeen()`, `replayIntro()`, `getIntroHeadScript()`, and `useIntroDone()` hook.
  - Evaluation of bypass criteria: `prefers-reduced-motion: reduce`, `low` perf tier, `navigator.webdriver`, `connection.saveData`, `?intro=0`, and non-home route entry.
- Updated `src/app/layout.tsx`:
  - Added synchronous inline script in `<head>` executing `getIntroHeadScript()` before first paint.
  - Added `suppressHydrationWarning` to `<html>`.
  - Added `<noscript>` fallback style that immediately hides `#intro-root`.
  - Wrapped children in `<div id="app-root">` to enforce `inert` isolation during playback.
- Updated `src/index.css`:
  - `#intro-root`: hidden by default, displayed as centered grid when `html[data-intro="play"]`.
  - Added 4-second linear CSS animation failsafe unblocking and hiding `#intro-root`.
  - Added header logo target hiding rule: `html[data-intro="play"] [data-intro-target="logo"] { opacity: 0 !important; }`.
  - Added 13-dot drift keyframes for high performance tier.

### Workstream B: Overlay Component & Brand Vector
- Created `src/components/brand/SkullMark.tsx`:
  - Clean inline vector SVG matching standard navbar proportions and viewBox `0 0 24 24`.
  - Distinct sub-paths for cranium/jaw, eye sockets, and nasal cavity.
  - Pre-rendered radial gradient for neon green ignition aura.
- Created `src/components/intro/IntroOverlay.tsx`:
  - 6 equal-width vertical `<clipPath>` slices with alternating vertical offsets (±24px to ±60px, ±3.5°).
  - Assembly timeline: dim grey `#4a4a4a` to white `#f2f2f2` with 70ms outward stagger.
  - Settle phase: seams close, scale 0.96 → 1.00.
  - Ignite phase: skull shifts to brand red `#ff2a2a`; eye sockets and nose flash neon green `#39ff14`.
  - Hold phase: 2% scale pulse hold.
  - Exit phase: FLIP translation & scale into `[data-intro-target="logo"]` over 700ms `easeInOut`, with seamless synchronous swap to header logo.
  - Skip interactions: click/tap, Esc, or any keydown triggers 250ms fade; skip hint appears after 600ms.
  - Lenis and body scroll locked during intro and released on completion.
  - Dispatches `graveyard:intro-done` custom event.

### Workstream C: Integration Across App
- Updated `src/components/Header.tsx`:
  - Replaced Lucide skull with `SkullMark`.
  - Marked logo container with `data-intro-target="logo"`.
- Updated `src/components/motion/SplitText.tsx`:
  - Gated text reveal animation on `useIntroDone()`.
- Updated `src/components/hero/SoulsCanvas.tsx`:
  - Particle animation initialization waits for `useIntroDone()`.
- Updated `src/app/page.tsx`:
  - Status pill and headline accent reveal wait for `useIntroDone()`.
- Updated `src/lib/perf.ts`:
  - Defer runtime FPS measurement until after `graveyard:intro-done` event if intro is playing.
- Updated `src/components/Footer.tsx`:
  - Added "Replay intro ↺" link.
- Updated `src/app/design-system/page.tsx`:
  - Added "One-Time Skull Intro Animation" section with live "Replay Intro" button, full timeline table, and execution rule grid.

### New Files Created in v2.3:
- `src/lib/intro.ts`
- `src/components/brand/SkullMark.tsx`
- `src/components/intro/IntroOverlay.tsx`




