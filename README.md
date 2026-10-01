# The Graveyard ⚰️⚡
## V2.8: Motion-Forward Developer Marketplace & Resurrected Codebase Vault

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

### Performance Governor & Motion Tiers (`data-perf`) (v2.7)
The application automatically assesses hardware and network capabilities to ensure a rock-solid experience across all devices:
- **`high` Tier**: Desktop with high hardware concurrency (>4 cores, >4GB RAM). Full experience — hero canvas (55 particles @ 30fps), dynamic legibility mask, pointer repulsion, custom cursor ring, view transitions, Lenis smooth scroll, magnetic controls.
- **`mid` Tier**: Mobile, touch devices (`pointer: coarse`), or modest desktop hardware (<=4 cores or <=4GB RAM). Lightweight mobile canvas (20–26 particles @ 24fps cap, DPR 1.0, scroll velocity response, touch ripple), dynamic legibility mask, native cursor, Lenis smooth scroll active.
- **`low` Tier / Reduced Motion**: Battery saver (<20% battery & not charging), `connection.saveData`, `prefers-reduced-motion`, or low hardware (<=2 cores or <=2GB RAM). Pure CSS fallback (drifting ambient glow + 10 floating glyphs in safe zones) or static gradient. Zero JS frame loops, native scrolling, no magnetic effects.
- **Manual Overrides**:
  - `NEXT_PUBLIC_PERF_FORCE=high|mid|low`: Overrides device detection.
  - `NEXT_PUBLIC_HERO_FX=canvas|css|static`: Enforces specific hero motion mode.
  - URL Query `?fx=canvas|css|static`: Live override for testing share cards and rendering states.
  - Live switcher on `/design-system` (supports live preview of canvas-desktop, canvas-mobile, css, static, and auto).

### 🌌 Hero FX Modes (v2.7)

| Mode | Target Devices / Conditions | Rendering & Performance |
|---|---|---|
| **`canvas-desktop`** | Desktop, fine pointer, `high` tier | 55 particles @ 30fps, DPR up to 1.25, pointer repulsion, dynamic text mask, offscreen sprite atlas. |
| **`canvas-mobile`** | Mobile, tablets, touch (`pointer: coarse`), `mid`/`high` tier | Lightweight 20–26 particles @ 24fps cap, DPR 1.0, scroll velocity vertical nudge, touch ripple (~600ms), dynamic text mask, URL-bar-collapse debounced resizing (>120px threshold). |
| **`css`** | Low battery (<20% unplugged), `saveData`, `low` tier, or governor self-protection fallback | Pure CSS transforms and opacity only. Ambient red glow drift (18s) + 10 floating glyph spans in perimeter safe zones (outer 18% and top/bottom bands). Zero JavaScript frame loop. |
| **`static`** | `prefers-reduced-motion: reduce` or explicit static override | Completely static ambient red gradient. Zero glyph motion, zero canvas. |

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

For detailed instructions, see [supabase/README.md](file:///d:/the-graveyard/supabase/README.md).

**Option A (Fastest):** Run `supabase/RUN_IN_SUPABASE_SQL_EDITOR.sql` in your Supabase SQL Editor. This one-click script applies all tables, RLS security policies, storage buckets, and functions.

**Option B (Sequential Migrations):** Run migrations in order:
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

## 🔐 Authentication (v2.4)

The Graveyard uses **Supabase Auth** with a unified split-screen authentication architecture:

### Supported Providers
1. **GitHub OAuth**: Fast developer authentication. Stores the user's GitHub username in `profiles.github_url` for repo collaborator automation.
2. **Google OAuth**: One-click social sign-in.
3. **Email + Password**: Full form validation with Zod, live password strength meter on sign-up, and accessible Caps Lock detection.
4. **Magic Link (Passwordless OTP)**: Direct passwordless sign-in via `supabase.auth.signInWithOtp()`.

### Supabase Redirect URL Configuration
In your Supabase Dashboard under **Authentication → URL Configuration → Redirect URLs**, add:
- `http://localhost:3000/auth/callback`
- `https://graveyard.anrix.me/auth/callback`
- `https://your-production-domain.com/auth/callback`

### Safe Redirect & Intent Protection (`lib/safe-redirect.ts`)
- **Open-Redirect Hardening**: All post-authentication redirects pass through `getSafeNext()`. It strictly allows only relative same-origin paths starting with a single `/`. Protocol-relative URLs (`//evil.com`), backslashes (`/\evil.com`), URI schemes (`https:`, `javascript:`), and encoded variations (`%2f`, `%5c`) are rejected and safely defaulted to `/dashboard`.
- **Action Intent Preservation**: Action intents (`buy`, `claim`, `apply`, `message`) are whitelisted via `getSafeIntent()`. Upon completing authentication, users are redirected back to the exact project card with their intended modal automatically engaged.

### Demo Mode Sandbox
When `NEXT_PUBLIC_DEMO_MODE=true`, the auth screen exposes quick-login sandbox pills:
- **Try as demo buyer**: Instant login prefilled with purchased assets in the vault.
- **Try as demo seller**: Instant login owning live listings with simulated earnings.

---

## 📱 Responsive Design (v2.5)

The Graveyard is engineered for fluid responsiveness across phones, tablets, laptops, desktops, and 4K ultrawide monitors (320px to 3840px+), supporting any browser zoom and input modality.

### Breakpoint Matrix
- `xs`: `380px` (compact mobile phones)
- `sm`: `640px` (large phones / phablets)
- `md`: `768px` (tablets / iPad portrait)
- `lg`: `1024px` (tablets landscape / compact laptops)
- `xl`: `1280px` (standard laptops)
- `2xl`: `1536px` (desktop monitors)
- `3xl`: `1920px` (Full HD displays)
- `4xl`: `2560px` (2K QHD & 4K UHD ultrawide displays)

### Container & Layout Rules
- **Fluid Gutters**: `clamp(16px, 4vw, 48px)` outer padding.
- **Max Content Widths**: Capped at `1280px` up to `2xl`, expanding to `1440px` at `3xl`, and `1600px` at `4xl`+, centered with full-bleed atmospheric backgrounds.
- **No Fixed Heights**: All text containers use `min-height` with `overflow-wrap: anywhere` and `hyphens: auto`. Flex/grid items include `min-w-0` to prevent horizontal blowouts.
- **Dynamic Viewport Units**: Uses `100dvh` and `svh` throughout to eliminate mobile browser navigation bar jumps.
- **Safe Area Insets**: Native `env(safe-area-inset-*)` utilities (`safe-pt`, `safe-pb`, `safe-pl`, `safe-pr`, `safe-p`) applied across navigation headers, sticky bottom action bars, modals, sheets, and the intro overlay.

### Container Queries (`@tailwindcss/container-queries`)
- Components adapt based on their own element width rather than only global viewport width:
  - **`ProjectCard`**: Fluid metadata badges and seller attribution.
  - **`FeaturedResurrections`**: Compact bento cards switch dynamically from horizontal to vertical layout when their container width drops below 420px.
  - **`CardFooter`**: Seller username truncates first while price/label and circular arrow action remain fixed on a single line with zero wrap.

### Mobile Bottom Sheets & Sticky Bars
- **Bottom Sheets**: Below `sm` (640px), dialogs (`PaymentModal`, `CollabRequestModal`, `ConfirmDialog`, `FilterBar` filter drawer) convert into touch-friendly bottom sheets featuring top grab handles, `max-height: 90-92dvh`, internal scrolling, body scroll locking, and sticky action buttons.
- **Sticky Bottom Action Bars**:
  - Detail page (`/project/[id]`): Converts the right-hand action card into a bottom-pinned bar on `< lg` with price/label and instant purchase button.
  - Submit wizard (`/submit`): Pinned next/prev navigation bar with safe-area padding.
  - Dashboard (`/dashboard`): 5-item mobile tab bar with a "More" drawer sheet for secondary tabs.
  - Messages (`ChatInterface`): Full-screen message view with back button on `< lg`, anchored scroll, and keyboard-aware sticky composer (`visualViewport`).

### Developer Tools
- **Viewport Badge (`components/dev/ViewportBadge.tsx`)**: Fixed bottom-left badge displaying current dimensions (`width×height`), active breakpoint name, DPR, and performance governor tier. Active in development, with `?debug=viewport`, or toggled via <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>D</kbd>.
- **Responsive Simulator (`/design-system/responsive`)**: In-browser device-frame preview tool featuring 13 viewport presets (320×568 up to 3440×1440), custom width/height inputs, orientation rotation, scale-to-fit toggle, and route selector. Protected with same-origin framing (`SAMEORIGIN`).

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

---

## 🚀 Launch Checklist (v2.6)

| # | Item | Status | Implementation Details |
|---|---|---|---|
| 1 | Custom 404 | Completed | `src/app/not-found.tsx` with search input (`/?q=`), dual CTAs, and `noindex`. |
| 2 | CTA above the fold | Completed | Home, Project Detail, Wizard, Login, Dashboard, Contact, 404, Orders. |
| 3 | Meta title per page | Completed | `title.template: %s · The Graveyard` in root layout, unique titles across all pages. |
| 4 | Meta description per page | Completed | Curated descriptions (≤155 chars) on all routes. |
| 5 | Open Graph & Twitter image | Completed | Default dynamic OG (`src/app/opengraph-image.tsx`) + project-specific card (`src/app/project/[id]/opengraph-image.tsx`). |
| 6 | Favicon set & Manifest | Completed | Vector SVG (`icon.svg`), Apple touch icon (180×180), multi-size ICO (`favicon.ico`), 192/512 PNGs, maskable icon, web manifest (`src/app/manifest.ts`). |
| 7 | robots.txt | Completed | `src/app/robots.ts` disallowing private routes (`/api/`, `/dashboard`, `/orders/`, `/submit`, `/collab/`, `/auth/`, `/login`, etc.). |
| 8 | sitemap.xml | Completed | Dynamic sitemap (`src/app/sitemap.ts`) querying non-archived projects with anon client, capped at 5,000 URLs, priority scores. |
| 9 | Alt text on every image | Completed | `src/components/ui/Img.tsx` enforcing non-empty `alt` or `decorative: true`. `eslint-plugin-jsx-a11y/alt-text` enforced as error. |
| 10 | Mobile breakpoints | Completed in v2.5 | Fluid typography, container queries, and support from 320px to 4K displays. |
| 11 | Sticky mobile CTA | Completed in v2.5 | Project detail sticky bar (`src/app/project/[id]/page.tsx`) and submit wizard bar. |
| 12 | Loading states | Completed | Dedicated `loading.tsx` across async routes (`/orders/[id]`, `/submit/success`, `/collab/sent`, `/contact`). |
| 13 | Form error states | Completed | Consistent inline error display with `AlertTriangle`, `aria-describedby`, `aria-live="polite"`, and `role="alert"`. |
| 14 | Thank-you pages | Completed | Auth-gated confirmation routes: `/orders/[transactionId]`, `/submit/success`, `/collab/sent`. |
| 15 | Privacy policy page | Completed | Comprehensive plain-language disclosure (`src/app/privacy/page.tsx`) with demonstration notice and TOC. |
| 16 | Terms of Use page | Completed | Detailed terms (`src/app/terms/page.tsx`) covering test-mode payments, code licenses, and takedowns. |
| 17 | Cookie banner | Completed | Non-blocking bottom consent notice (`src/components/legal/ConsentNotice.tsx`) with analytics opt-out switch. |
| 18 | Cookieless analytics | Completed | `@vercel/analytics` + `@vercel/speed-insights` integration with typed event wrapper (`src/lib/analytics.ts`), respecting DNT/GPC. |
| 19 | Real contact address | Completed | `/contact` route with mailto copy card, GitHub repo issues link, prefilled listing takedown intent, and footer links. |
| 20 | Compressed images | Completed | Client-side compression pipeline (`src/lib/image-compression.ts`), WebP conversions (≤300KB), Next config AVIF/WebP, WebP seeds. |

### Environment Variables
Configure the following in `.env.local` / deployment settings:
- `NEXT_PUBLIC_SITE_URL`: Full origin URL (`https://the-graveyard.vercel.app` or custom domain) used for `metadataBase`, sitemaps, and canonical links.
- `NEXT_PUBLIC_CONTACT_EMAIL`: Public contact address shown on Contact, Privacy, and Terms pages.
- `NEXT_PUBLIC_GITHUB_URL`: Project repository or profile URL.
- `NEXT_PUBLIC_LINKEDIN_URL`: Optional company LinkedIn profile URL.
- `NEXT_PUBLIC_ANALYTICS_ENABLED`: Set to `false` to disable tracking entirely (always disabled in development).

### Social Share Previews
To validate Open Graph cards and Twitter previews:
- **Facebook Sharing Debugger**: `https://developers.facebook.com/tools/debug/`
- **LinkedIn Post Inspector**: `https://www.linkedin.com/post-inspector/`
- **X / Twitter Card Validator**: `https://cards-dev.twitter.com/validator`
*(Note: Social platforms cache fetched previews aggressively; use platform scraper tools to refresh cache after deployments).*

### Content Security Policy (CSP)
In production, a `Content-Security-Policy-Report-Only` header is delivered allowing Razorpay checkout, Supabase realtime webhooks, and Vercel analytics while reporting any non-compliant assets.
> **Note**: Tighten and switch this header to enforcing mode (`Content-Security-Policy`) after verifying live production report endpoints.

### Lighthouse Target Benchmarks (Production Build)
- **SEO**: ≥ 95
- **Accessibility**: ≥ 95
- **Best Practices**: ≥ 95
- **Performance (Mobile)**: ≥ 85

---

## 🎛️ Operative Console / Dashboard (v2.8)

The Console (`/dashboard`) provides a calm, productive workspace for developers managing published listings, acquired code, collaborative pitches, and conversations:

1. **Unified Shell (`DashboardShell`):**
   - **Desktop (≥ 1024px):** Fixed 264px left sidebar (`ConsoleSidebar`) and main column with a sticky 64px topbar (`ConsoleTopbar`). Global marketing header and footer are omitted.
   - **Mobile (< 1024px):** Sticky compact topbar + fixed bottom navigation bar (`ConsoleBottomNav`) with safe-area insets and "More" action sheet.
   - **Consistent Width:** Identical maximum content container width (1200px / 1280px at 3xl) and gutters across all console views.

2. **Navigation & Route Synced Parameters:**
   - `?tab=overview`: Metrics grid (6 cards), profile completion checklist, and recent activity.
   - `?tab=listings`: Filterable repository table with live/sold/filled badges and quick action menus.
   - `?tab=vault`: Acquired codebases, secure ZIP downloads, and automated GitHub collaborator status retries.
   - `?tab=sales`: Real-time order log with rupee formatting (`formatINR`) and test-mode settlement pills.
   - `?tab=collabs`: Pitch management with URL-synced subtabs (`?subtab=received|sent`).
   - `?tab=messages`: Two-pane real-time communication system with auto-scroll and offline reconnecting badges.
   - `?mode=collab|adopt|buy`: Supported on `/submit` (preselects listing mode) and `/` (filters marketplace).

3. **Single CTA Contract:**
   - Exactly one primary CTA on each console page: **`New listing`** (white pill in the topbar).

4. **Self-Service Account Deletion (`/api/account/delete`):**
   - Requires confirming by re-typing the user's handle.
   - Validates user session via server-side Bearer token (never trusts client ID).
   - Anonymizes profile (`username = deleted_<shortid>`, clears bio/avatar/contact/UPI/phone).
   - Archives all user listings (`is_archived = true`).
   - Preserves historical purchase transactions so previous buyers retain download access.
   - Permanently disables authentication via Supabase Admin API ban duration (`876000h`).

5. **Brand Skull Favicon:**
   - Vector favicon (`/icon.svg`) and desktop icon (`/favicon.ico`) directly render the transparent brand red skull mark (`#ff2a2a`, stroke width 2).

---

## 📚 Complete Documentation Suite

| Document | Path | Purpose |
|---|---|---|
| **Product Requirements (PRD)** | [docs/prd.md](file:///d:/the-graveyard/docs/prd.md) | Business problem, interaction models, functional specs, roadmap |
| **Design System & UI Spec** | [docs/design.md](file:///d:/the-graveyard/docs/design.md) | Typography, color tokens, micro-interactions, components |
| **System Architecture** | [docs/architecture.md](file:///d:/the-graveyard/docs/architecture.md) | Database ERD, RLS matrix, API flows, edge cron jobs |
| **Manual QA Checklist** | [docs/MANUAL_QA.md](file:///d:/the-graveyard/docs/MANUAL_QA.md) | Comprehensive 9-section verification suite including v2.8 console |
| **Responsive QA Matrix** | [docs/RESPONSIVE_QA.md](file:///d:/the-graveyard/docs/RESPONSIVE_QA.md) | Device viewports, landscape phones, safe area insets |
| **Database & Migrations Guide** | [supabase/README.md](file:///d:/the-graveyard/supabase/README.md) | One-click setup SQL, migration files, storage bucket rules |
| **Scripts & Seeding Guide** | [scripts/README.md](file:///d:/the-graveyard/scripts/README.md) | 24-project seed harness, icon generators, collaborator test |


