# The Graveyard ⚰️⚡
## V2.0: Motion-Forward Developer Marketplace & Resurrected Codebase Vault

> **Where dead code gets resurrected.**  
> A premium, editorial, motion-forward dark site for developers. Large confident typography, generous space, soft surfaces, cinematic scroll and hover motion, with developer cyberpunk identity in the telemetry details.

---

## 📸 Interface Showcase

```
+-----------------------------------------------------------------------------------+
|  [SCREENSHOT PLACEHOLDER: TALL HERO & SOULSCANVAS]                                 |
|  - SoulsCanvas 2D particle canvas, SplitText mask reveal, Instrument Serif accent |
|  - Unboxed live stats strip, magnetic CTA, paused canvas off-screen                |
+-----------------------------------------------------------------------------------+
```

```
+-----------------------------------------------------------------------------------+
|  [SCREENSHOT PLACEHOLDER: FEATURED BENTO & RESURRECTED SNAP RAIL]                 |
|  - 12-column bento grid for high-visibility listings with overlaid epitaphs       |
|  - Horizontally draggable snap rail of revived projects with REVIVED tags         |
+-----------------------------------------------------------------------------------+
```

```
+-----------------------------------------------------------------------------------+
|  [SCREENSHOT PLACEHOLDER: PROJECT DETAIL & BORDERLESS CARD]                       |
|  - Full-bleed cover hero with View Transitions API expanding from card            |
|  - Tombstone pull quote, deterministic gradient avatar, edge-to-edge CoverArt     |
+-----------------------------------------------------------------------------------+
```

---

## 🪦 The Tombstone Concept

In The Graveyard V2, dead projects don't hide their demise—they celebrate it. Every codebase records its authentic burial telemetry:

- **`cause_of_death`**: Why the project stopped (`lost_interest`, `no_time`, `pivoted`, `ran_out_of_funding`, `tech_outdated`, `cofounder_left`, `scope_creep`, `other`).
- **`abandoned_on`**: The date the project was laid to rest (defaults to the verified repository's last git commit date).
- **`last_commit_at`**: Immutable server-verified timestamp from GitHub API.
- **`epitaph`**: Witty or poignant 140-character developer tagline (e.g., *"Shipped the auth, forgot the product."*).
- **`revived_at`**: Timestamp marked when a project is purchased, claimed, or co-founder match confirmed, ordering the **Resurrected Wall**.
- **`formatEpitaph()`**: Safe formatting helper outputting strings like `Died Mar 2024 · Cause of death: Lost interest · Dead for 1y 7m` without ever rendering `undefined`.

---

## 🎨 Design & Motion System (v2.1)

### Typography (Self-Hosted via `next/font`)
1. **Display & Headings: Bricolage Grotesque** (500 / 600 / 700, sentence case, fluid clamp scale up to 6.75rem, letter-spacing -0.035em, max 2 lines on desktop hero).
2. **Body & Interface: Geist** (400 / 500 / 600, 15–17px, line-height 1.6, crisp micro-details on nav, forms, cards, and buttons).
3. **Telemetry & Code: Geist Mono** (400 / 500, prices with `tabular-nums`, commit dates, IDs, micro labels 11–12px uppercase with 0.12em tracking).
4. **Editorial Accent: Instrument Serif Italic** (Reserved for pull-quote tombstone epitaphs and hero punchlines).

> **One-Line Display Style Switcher:** In `src/lib/fonts.ts`, change `DISPLAY_STYLE: 'grotesk' | 'serif'`. When set to `'serif'`, `--font-display` resolves to Instrument Serif (weight 400, letter-spacing -0.02em, font-size +8%). Default is `'grotesk'`.

### Pill Shape Language & Buttons
- **Buttons (40 / 48 / 56px heights)**: All buttons are pills (`rounded-full`).
  - `primary`: White fill, near-black text, arrow icon nudging 3px on hover. Inside listing contexts (detail page action panel), primary adopts the mode accent fill.
  - `secondary`: `--surface-2` fill, hairline border, pill.
  - `ghost`: Text only with animated underline (15px/500, min 40px hit area).
  - `danger`: `#dc2626` fill, white text.
- **Badges**: All badges are pills (`rounded-full`) with a colored status dot.
- **No Chamfers**: `CyberFrame` and chamfered clip-paths have been completely retired.

### Performance Governor & Motion Tiers (`data-perf`)
The application automatically assesses hardware and network capabilities to ensure a rock-solid 60fps experience:
- **`high` Tier**: Full experience — hero canvas (60 particles @ 30fps), centered custom cursor ring, view transitions, Lenis smooth scroll, magnetic controls.
- **`mid` Tier**: Hero canvas (35 particles @ 30fps), native cursor, no magnetic controls, no view transitions, Lenis smooth scroll active.
- **`low` Tier / Reduced Motion**: No canvas (static radial glow), native scroll (Lenis destroyed), no cursor, no magnetic, CSS opacity-only reveals, static marquee.
- **Manual Override**: Set `NEXT_PUBLIC_PERF_FORCE=high|mid|low` in your `.env.local` or switch live on `/design-system`.

> **Note on Performance Testing:** Motion performance must be evaluated on a production build (`npm run perf`), not `next dev`. Next.js development overhead and hot-reloading tooling introduce artificial frame drops that are absent in production.

### 💀 One-Time Skull Intro Animation (v2.3)

Inspired by modern cinematic opening animations (e.g., [Third Door](https://www.thirddoor.online/)), The Graveyard features an authentic vector skull logo assembly on first visit:

1. **Playback Behavior:**
   - Plays **once per browser session** on a full document load of the homepage (`/`).
   - Persisted via `sessionStorage` key `graveyard:intro:v1`.
   - Marked as seen **at the start of playback** to prevent reload loops if refreshed mid-animation.
   - If the first page of a session is not `/` (e.g., direct project link), the intro is skipped and marked as seen immediately.
   - Client-side navigation never triggers the intro.

2. **Choreographed Timeline (≈3.0s Desktop / ≈2.4s Mobile):**
   - **0–150ms (Vignette):** Full black fixed cover (`#050505`) with a 6% subtle center red ambient glow. On `high` tier, 13 tiny dim dots drift using CSS transforms.
   - **150–1100ms (Assemble):** The vector skull (`SkullMark`) assembles from **6 equal-width vertical slices** via `<clipPath>`. Each slice starts with alternating vertical offsets (±24px to ±60px, ±3.5° tilt) and dim grey tone (`#4a4a4a`), moving inward with a 70ms center-outward stagger to bright white (`#f2f2f2`).
   - **1100–1500ms (Settle):** Slice seams close cleanly and the skull scales 0.96 → 1.00.
   - **1500–1900ms (Ignite):** Skull turns brand red (`#ff2a2a`); eye sockets and nasal cavity flash vibrant neon green (`#39ff14`) with a pre-rendered radial glow.
   - **1900–2200ms (Hold):** A 2% scale pulse hold.
   - **2200–3000ms (FLIP Flight):** Skull executes a smooth FLIP flight to `[data-intro-target="logo"]` in the navbar (`getBoundingClientRect()`), while overlay background fades to transparent. The navbar logo becomes visible the instant the flying skull lands.

3. **User Control & Bypasses:**
   - **Skip:** Click, tap, `Esc` or any key immediately triggers a fast 250ms fade out. A `Skip [Esc]` hint appears bottom-right after 600ms.
   - **Auto-Skipped On:** `prefers-reduced-motion: reduce`, `low` performance tier, `navigator.webdriver`, `connection.saveData`, or URL parameter `?intro=0`.
   - **Failsafes:** 4-second CSS animation unconditionally hides and unblocks `#intro-root`. `<noscript>` rule guarantees immediate content visibility without JavaScript.

4. **How to Replay:**
   - Append `?intro=1` to the URL (forces playback regardless of previous session flag).
   - Click "Replay intro ↺" in the footer.
   - Click "Replay Intro" on the `/design-system` page.
   - Programmatically invoke `replayIntro()` from `src/lib/intro.ts`.

5. **Configuration (`src/lib/intro.ts`):**
   - `INTRO_SCOPE`: `'session'` (default), `'local'` (7-day expiry), or `'always'`.
   - `INTRO_ENABLED_ROUTES`: Routes where intro playback is permitted (default `['/']`).
   - `INTRO_DESKTOP_DURATION_MS` & `INTRO_MOBILE_DURATION_MS`: Timeline durations.

6. **Accessibility & Coordination:**
   - Entire app root (`#app-root`) is marked `inert` during playback so screen readers and keyboard focus cannot access hidden content.
   - Lenis smooth scroll and body scroll are locked during playback and restored on completion.
   - Dispatches `graveyard:intro-done` event on `window`. `useIntroDone()` hook coordinates hero entrance effects (`SplitText`, `SoulsCanvas`, status pill) and defers the performance governor benchmark until after intro playback.
   - Strictly adheres to the Effects Budget: **zero** `filter: blur`, `backdrop-filter`, or `mix-blend-mode`.

---

## ⚡ Canonical Listing Modes

| Mode | DB Enum | UI Label | Accent Color | Behavior | Action |
|---|---|---|---|---|---|
| **Buy** | `buy` | **For Sale** | Neon Green (`#39ff14`) | Exclusive sale. When paid, moves to Resurrected Wall. | Buy |
| **Adopt** | `adopt` | **Free Fork** | Amber (`#fbbf24`) | Unlimited free claims. Instant access to archive & repo. | Claim |
| **Collab** | `collab` | **Seeking Partner** | Blue (`#3b82f6`) | Pitch to collaborate (equity/rev-share/milestone). | Apply |

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, Serverless Edge & Node.js routes)
- **Database & Auth**: Supabase (PostgreSQL 15, Auth, Storage buckets, Realtime channels)
- **Styling**: Tailwind CSS v3.4 + Custom theme tokens
- **Typography**: Bricolage Grotesque, Geist, Geist Mono, Instrument Serif (`next/font/google`)
- **Motion & Scroll**: Framer Motion, Lenis Smooth Scroll, Custom RAF-driven Canvas with Offscreen Sprite Atlas
- **Payments**: Razorpay Standard Checkout (**TEST MODE** only, zero live currency)
- **APIs**: GitHub REST API (v3) for collaborator management
- **Validation**: Strict TypeScript (no `any`), Zod schema validation across all endpoints
- **Toasts**: Sonner

---

## 🚀 Setup & Local Installation

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/the-graveyard.git
cd the-graveyard
npm install
```

### 2. Environment Variables

Create `.env.local` based on `.env.example`:

```bash
cp .env.example .env.local
```

Fill in your secrets:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # NEVER expose to client!

# Razorpay (TEST MODE ONLY)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-key-secret     # NEVER expose to client!
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret     # For /api/razorpay-webhook

# GitHub API
GITHUB_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx    # Personal Access Token with repo admin permissions

# Cron & Demo
CRON_SECRET=your-random-cron-secret
NEXT_PUBLIC_DEMO_MODE=true
```

### 3. Run Database Migrations

Run migrations in order in your Supabase SQL Editor:
1. 📄 `supabase/migrations/20261001000000_graveyard_v2.sql` (Security, RLS, transactions, paise pricing)
2. 📄 `supabase/migrations/20261001010000_graveyard_v3_tombstones.sql` (Tombstone fields, feed RPC with synchronized counts)
3. 📄 `supabase/migrations/20261001020000_graveyard_v4_details.sql` (v2.2 project details: features, todo_items, setup_notes, file_tree, collab_roles, screenshots, completion_percent, lines_of_code, is_featured, featured_rank, seed_key, and storage policies)

### 4. Seed Demo Data

Run the automated V2.2 seed script:

```bash
npm run seed
```

To purge and re-create only the demo dataset without affecting any user-created listings:

```bash
npm run seed -- --reset-demo
```

### 5. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to explore the motion site.

---

## 💾 Demo Data & Test Accounts (v2.2)

The Graveyard ships with a complete, production-grade 24-project dataset designed for portfolio showcasing and manual QA:

### Dataset Composition (24 Projects Total)
- **18 Live Listings**:
  - **8 Flagship Projects**: InvoiceForge (Featured #1, ₹4,999), TinyAuth (Featured #2, Free Fork), Lanternly (Featured #3, Collab Equity split), PulseBoard (₹2,499), QuietQueue (₹7,999), ShipLog (Free Fork), Stackwise (Free Fork), OpenShelf (Collab Rev Share).
    - Flagships feature 3 procedurally rendered high-resolution UI wireframe screenshots (PNG 1280×800) generated with `sharp`.
    - Fully populated details: `completion_percent`, `lines_of_code`, `features`, `todo_items`, `setup_notes`, and `file_tree`.
  - **10 Additional Live Listings**: GymFlow, DocuSpark, CronCat, TrailMap, NoteNest, BudgetBee, DevCards, PingDeck, SkillSwap, Haikubot.
- **6 Revived Listings (Resurrected Wall)**:
  - MarkdownMint (sold to demo_buyer), TaskTide (claimed by demo_buyer), FormPilot (claimed), CartKit (sold by demo_seller), ByteBazaar (sold by demo_seller), RetroRadio (collab filled).
  - All revived listings include authentic `revived_at` timestamps spread over the last 4 months.

### Real Downloadable Zip Archives
Every single demo project includes a real downloadable `.zip` archive stored in `project-files/<sellerId>/<projectId>.zip`. The seed script asserts that archive contents **strictly match** the declared `file_tree` paths (including README, LICENSE, SETUP, package manifests, and stub source files).

### Demo Accounts
- **Demo Seller**: `seller@graveyard.dev` / `GraveyardDemo2026!` (@demo_seller)
  - Pre-seeded with earnings of ₹6,498 from CartKit and ByteBazaar sales.
  - Owns InvoiceForge, Lanternly, CartKit, ByteBazaar, and GymFlow.
  - Incoming collab applications on Lanternly (1 pending with detailed pitch, 1 accepted, 1 rejected).
  - Unread notifications and messaging threads with buyers and co-founders.
- **Demo Buyer**: `buyer@graveyard.dev` / `GraveyardDemo2026!` (@demo_buyer)
  - Pre-seeded Vault containing downloadable assets for MarkdownMint and TaskTide.
  - Pending collab application submitted to OpenShelf.
  - Active messaging threads with sellers.
- **8 Fictional Community Developers**: `@arjun.dev`, `@priya_builds`, `@meera_codes`, `@kabir_ships`, `@nisha.rs`, `@rohan_golang`, `@ananya.ui`, `@vikram_indie`.

### Seed Script Flags & Options
- `npm run seed`: Idempotently upserts users and listings by `seed_key`. Does not touch real user listings.
- `npm run seed -- --reset-demo`: Deletes only rows where `seed_key IS NOT NULL` (and their associated transactions, collab requests, messages, and storage assets) then re-seeds cleanly.
- `DEMO_GITHUB_REPO`: Optional env var (e.g. `owner/repo`) administered by `GITHUB_ACCESS_TOKEN`. When provided, attached to InvoiceForge for testing live GitHub collaborator invitation workflows. Otherwise `has_repo = false`.
- **Demo URLs**: Links such as `https://invoiceforge.example.com` are placeholder domains.
- **Cleaning Test Listings**: If you have manually created junk rows without `seed_key`, execute `scripts/cleanup-test-listings.sql` in the Supabase SQL editor to clear them.

---

## 🛣️ Known Limitations / Production Roadmap

1. **Automated Seller Payouts (Razorpay Route)**: Splitting marketplace commissions and transferring net seller funds automatically to connected bank accounts.
2. **Taxation & Compliance (GST / TDS)**: Dynamic GST calculation, generation of tax invoices for digital goods, and Indian e-commerce operator TDS deductions.
3. **Escrow & Dispute Resolution**: 7-day milestone escrow holding funds until the buyer verifies repository buildability.
4. **Code Health & Vulnerability Audits**: Automated containerized static analysis (Semgrep, Trivy) on source code archives.
5. **Malware & Virus Scanning**: S3 bucket triggers running ClamAV against all uploaded zip/tar archives before releasing signed download URLs.
6. **GitHub App / OAuth Authorization**: Replacing the platform PAT with an official GitHub App where sellers install the integration to authorize granular repo access.
7. **DMCA & Takedown Protocol**: Structured copyright claim intake and counter-notice workflows.
8. **Transactional Email**: Integration with Resend / Postmark for purchase receipts, collab status emails, and password resets.

---

## ⚖️ Legal & Policy

- [Terms of Service](/terms)
- [Privacy Policy](/privacy)
- [Design System](/design-system)
- *Notice: All payments occur in Razorpay Test Mode. No real financial transactions are executed.*
