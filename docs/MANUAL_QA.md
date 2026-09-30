# The Graveyard: Manual QA & Verification Checklist

Use this checklist to verify all features, user flows, database constraints, motion craft, and security boundaries.

---

## 1. V2 Core Verification Checklist

### 1.1 Zero NaN, Zero Undefined, Unified Formatter
- [ ] **formatINR Helper:**
  - Verify every price in the app (cards, detail, checkout modal, dashboard overview, sales ledger, vault) renders formatted INR (e.g. `₹2,499`) or `Free` for 0.
  - Verify null, undefined, or missing prices render `—` and **never** `₹NaN`.
- [ ] **Tombstone formatEpitaph Helper:**
  - Verify cards and detail page show clean strings like `Died Mar 2024 · Cause of death: Lost interest · Dead for 1y 7m`.
  - Verify projects with missing dates or causes omit the missing segment and **never** render `"undefined"`.

### 1.2 Single-Source Counts & Live Feed Separation
- [ ] **Count Synchronization:**
  - Open `/`. Check the Mode tab counts: All, For Sale, Free Fork, Seeking Partner.
  - Check the "Showing N projects" label above the card feed.
  - Check the stats strip in the hero (`get_marketplace_stats`).
  - Search for a keyword (e.g., `Rust`) or select a tech tag (e.g., `TypeScript`).
  - Verify that tab counts, "Showing N", and filtered cards **strictly agree** with each other.
- [ ] **Live-Only Default Feed:**
  - By default, confirm the main card grid contains **only live** listings (no sold out items, no filled partner requests).
- [ ] **Resurrected Wall:**
  - Confirm the horizontal snap rail below the feed displays revived projects with a green `REVIVED` dot, the revival date, and adopter note (e.g., "Adopted by @dev_vikram" / "Sold").
- [ ] **"Include Resurrected" Toggle:**
  - Enable the "Include resurrected" toggle in the filter bar.
  - Confirm revived projects blend into the feed with dimmed styling and `REVIVED` badges, and counts adjust consistently.

### 1.3 Editorial Typography & Aesthetic Craft
- [ ] **Font Family Verification:**
  - Headings & Hero: Bricolage Grotesque (500 / 600 / 700, sentence case, tight tracking).
  - Body & UI labels: Geist (400 / 500 / 600, high readability).
  - Telemetry & Prices: Geist Mono (400 / 500, uppercase only for tiny labels 11-12px).
  - Accent word & Epitaph pull quotes: Instrument Serif Italic.
  - Confirm no default serif fallback appears anywhere except intentional accent/display styles.
- [ ] **Surfaces & Radii:**
  - Cards: Borderless, 20px soft radius, edge-to-edge cover art on top.
  - Modals: 24px soft radius, no clipped focus rings.
  - Form Inputs: 12px radius, Geist typography.
  - Buttons & Badges: Strictly pills (`rounded-full`), no chamfered shapes.

### 1.4 Motion System & Interactions
- [ ] **Hero & SoulsCanvas:**
  - SoulsCanvas 2D canvas runs smooth ascending glyph loop (`0`, `1`, `{`, `}`, `<`, `/>`, `;`).
  - Fine pointer: particles gently repel from mouse position.
  - Scroll down: confirm canvas pauses rendering when out of viewport.
- [ ] **SplitText Reveal:**
  - On page load, hero headline masks and reveals staggered lines (`translateY(110%) → 0`).
  - Confirm text is completely visible immediately even before hydration.
- [ ] **Magnetic CTA & Custom Cursor:**
  - Primary hero button attracts towards cursor within ~12px radius on desktop.
  - Custom cursor displays smooth ring follower, showing "View" over cards and "Drag" over the resurrected rail.
  - Confirm custom cursor does not interfere with form inputs, buttons, or touch screens.
- [ ] **View Transitions (Card → Detail):**
  - Click a project card. In Chrome/Edge, verify cover image smoothly expands into the detail page hero (`view-transition-name: project-<id>`).
  - Verify graceful fade/slide fallback in Firefox and Safari.
- [ ] **Lenis Smooth Scroll:**
  - Momentum scroll feels silky and responsive.
  - Modals, popovers, and textareas scroll naturally (`data-lenis-prevent`).
  - Anchor links and browser Back button scroll to expected positions.

### 1.5 Tombstone Fields & Publish Wizard
- [ ] **Submit Wizard Tombstone Fields:**
  - Open `/submit`. Step 1 includes:
    - "When did it die?" date/month picker.
    - "Cause of death" dropdown.
    - "Epitaph" input with 140-character counter.
  - Step 3: Enter a GitHub repo. Confirm `last_commit_at` is fetched and `abandoned_on` auto-populates if left blank.
  - Step 4: Confirm "Buyer perspective preview" matches the new ProjectCard with tombstone line.
- [ ] **Edit Page Tombstone Support:**
  - Open `/edit/[id]`. Confirm cause of death, abandoned date, and epitaph can be updated by the owner.

### 1.6 Footer & Responsive Layout
- [ ] **Footer Wordmark & Links:**
  - Confirm "The Graveyard" giant wordmark spans full width and scales cleanly on mobile.
  - Confirm brand logo and "Design System" link do not wrap into an awkward broken row.
  - Test-mode notice renders as a single-line unboxed text strip.
- [ ] **Mobile Experience (320px+):**
  - 1-column responsive card feed.
  - Bottom sheet or drawer for filters.
  - Sticky action bar on mobile project detail page.
  - Custom cursor disabled on touch devices.

### 1.7 Accessibility & Calm Zone Rules
- [ ] **prefers-reduced-motion:**
  - Enable reduced motion in OS settings (or toggle in `/design-system`).
  - Confirm Lenis is disabled, SplitText renders final text instantly, canvas is replaced by static background, cursor follower is hidden, and marquee is static.
- [ ] **Calm Zone Verification:**
  - Verify checkout modal, publish wizard, dashboard, settings, and messaging maintain calm 150ms micro-transitions with zero canvas, parallax, or cursor effects.
- [ ] **Focus Rings:**
  - Tab through interactive items. Confirm 2px offset visible focus outlines follow element border radii.

---

## 2. Regression & Transaction Checklist

- [ ] **Buy Flow:** Checkout modal opens, test card (`4111 1111 1111 1111`) succeeds, transaction records in paise, item marks sold and moves to Resurrected Wall.
- [ ] **Free Fork Claim:** Instant claim without charge, records in Vault, unlocks GitHub invite.
- [ ] **Collab Pitch:** Pitch submission (min 50 chars), owner notification, accept/reject in dashboard opens messaging thread.
- [ ] **Vault Access:** Signed archive download generates valid zip URL; collaborator invite retry works.

---

## 3. The Graveyard v2.1 Verification Checklist

- [ ] **Typography & Fonts (DevTools Computed Check):**
  - Inspect nav links, buttons, body text, and card titles: computed font resolves to **Geist**.
  - Inspect hero display and section headlines: computed font resolves to **Bricolage Grotesque**.
  - Inspect prices, commit timestamps, and status tags: computed font resolves to **Geist Mono** with `tabular-nums`.
  - Inspect pull-quotes and hero accent word: computed font resolves to **Instrument Serif Italic**.
  - Confirm **no Times New Roman / default serif fallback** occurs anywhere in the interface.
- [ ] **Navbar & Pill Language:**
  - Nav track is a pill container holding "Browse" and "Submit project" with a sliding highlight pill on hover/active.
  - Controls share a single baseline at consistent 40px height.
  - "Sign in" is a ghost link with 40px hit area; "Get started" is a white primary pill.
  - Scrolled state switches to solid translucent background `rgba(10,10,11,0.88)` with hairline border and zero `backdrop-filter`.
  - Mobile hamburger opens full-screen solid menu with 36px display links, locks body scroll, and closes on Escape.
  - Zero chamfered shapes remain anywhere across the app. All buttons and badges are pills (`rounded-full`).
- [ ] **Hero Craft & Legibility:**
  - Headline fits in strictly **2 lines on desktop** with sentence case.
  - Code soul particles fade to 0 opacity over headline, subline, CTAs, and scroll cue via the elliptical legibility mask.
  - SoulsCanvas pre-renders to offscreen sprite atlas with 30fps cap and pauses loop when scrolled off-screen or tab hidden.
  - Centered `Scroll` cue with animated vertical line indicator.
- [ ] **Custom Cursor:**
  - Single ring centered on pointer via `translate3d(x,y,0) translate(-50%, -50%)`. Zero offset or second dot.
  - Driven by RAF loop reading mutable refs (no React state updates on mouse move).
  - System cursor remains visible.
  - Hidden on coarse pointers (touch devices) and on `mid`/`low` tiers.
- [ ] **Featured Bento & CoverArt:**
  - 12-column bento (7 cols large, 5 cols compact).
  - Compact card cover fills 40% width and stretches to 100% card height. Zero empty grey panels with 1, 2, or 3 items.
  - Rich CoverArt with 2-3 mode gradient blobs (25-35% alpha), dot grid, and code glyphs.
  - Titles have no default underline; animated underline appears on hover/focus only.
  - Tombstone line never renders "Natural causes" or "undefined".
- [ ] **Performance Governor & Production Benchmarking (`npm run perf`):**
  - Run `npm run perf` and open in Chrome: scrolling on `/` is smooth 60fps with zero frame freezing on navigation.
  - Visit `/design-system` and test the live Perf Tier Switcher (`high`, `mid`, `low`).
  - In `low` tier: confirm canvas is disabled, Lenis destroyed, cursor hidden, reveals opacity-only, and marquee static.
- [ ] **Regressions:**
  - Verify purchase, claim, collab, dashboard, and settings flows operate smoothly.

---

## 4. The Graveyard v2.2 Verification Checklist

### 4.1 Even Featured Section & Bento Alignment
- [ ] **Desktop Bento Dimensions (3 Items):**
  - Verify desktop (`lg+`) 12-column grid row height is strictly **300px** with a **24px gap**.
  - Left large card spans columns 1–7 and 2 rows (total height: **624px**).
  - Right two compact cards span columns 8–12, 1 row each (total height: **300px**).
  - Verify heights align perfectly with zero jagged edges and zero empty dark void areas.
- [ ] **Compact Card Layout:**
  - 42% cover width stretching full card height (`next/image fill` or `CoverArt absolute inset-0`).
  - Content column (20px padding) distributes elements with `CardFooter` pinned to `mt-auto`.
  - Title uses 1-line clamp without default underline (animated underline on hover only).
- [ ] **Featured Fallbacks:**
  - 2 items: renders two equal vertical cards side by side (same height and alignment).
  - 1 item: renders one full-width curated card.
  - 0 items: section cleanly unmounts.
- [ ] **Universal CardFooter:**
  - Standardized across large, compact, regular, and resurrected cards.
  - Left: seller avatar (28px) + `@username` (Geist 500, truncates with ellipsis).
  - Right: price/collab pill + 40px circular arrow button with hover nudge.
  - Confirm **no remaining standalone mono "Collab" labels, "View project" pills, or "Inspect →" links**.

### 4.2 Regular Grid Evenness & Completion Chips
- [ ] **Even Grid Heights:**
  - Regular project cards use `h-full flex flex-col` with `items-stretch` and pinned `CardFooter`.
  - Cover aspect ratio is identical across all cards (`aspect-[16/10]`).
  - Description area uses fixed 2-line height (`min-h-[2.5rem]`).
  - Tech pills render in a single row with `+N` overflow chip.
- [ ] **Completion Percent Chips:**
  - Appears in top-right corner of card covers (e.g. `85% built`).
  - Hides cleanly when `completion_percent` is null.

### 4.3 Full-Detail Project Pages (`/project/[id]`)
- [ ] **Cover Hero:**
  - Shared-element view transition from card cover (`view-transition-name: project-<id>`).
  - Displays mode pill, title, tagline, tombstone telemetry, Instrument Serif pull-quote, and live demo link.
- [ ] **Screenshot Gallery & Lightbox:**
  - Main 16:10 image with thumbnail strip below.
  - Click opens Radix Dialog lightbox with image counter, prev/next controls, and keyboard navigation (ArrowLeft, ArrowRight, Escape).
- [ ] **Status at Death Stat Row:**
  - Unboxed row showing large numbers: `Completion 85%`, `Lines of code 14.2k`, `Last commit Mar 2025`, `Dead for 1y 6m`.
  - Progress bar below reflecting completion percentage.
  - Missing stats omit cleanly without placeholders.
- [ ] **About & Checklists:**
  - Markdown content rendered in Geist with ~68ch max line length and one-click code copy buttons.
  - Two-column checklist: "What works" (✓ in mode accent) and "What's left" (○ in amber).
- [ ] **Collapsible File Tree:**
  - Hierarchical explorer with folder expand/collapse and file extension icons.
  - Capped at 360px height with internal scroll and `data-lenis-prevent`.
  - Displays notice: "File names only. Contents are delivered after purchase or claim."
- [ ] **Collab Roles & Recommendations:**
  - For collab listings: role cards with role name, commitment mono chip, and description.
  - Bottom sections: "More from this seller" and "Similar projects" rendered via compact cards.
- [ ] **Sticky Action Panel:**
  - Dynamic "What you get" checklist based on project assets (source archive, GitHub repo, license, demo link, setup notes).

### 4.4 Publish Wizard Enhancements (`/submit`)
- [ ] **Collapsible "Add details (recommended)":**
  - Tagline with 120-char counter.
  - Completion percent slider (0–100%) with numeric input.
  - Lines of code integer input.
  - Features and Todo items chip-style list editors (up to 10 each).
  - Setup notes markdown textarea.
  - Screenshot uploader: up to 6 images, 2MB limit each, drag to reorder.
- [ ] **Collab Roles Builder:**
  - For seeking partner listings: add/remove role rows with role name, commitment, and description.
- [ ] **Client-Side Zip Inspection (JSZip):**
  - Uploading `.zip` automatically extracts file tree client-side.
  - Auto-excludes `.env*`, `node_modules/`, `.git/` with seller review checklist.
  - Capped at 300 entries.
- [ ] **Upgraded "Preview as buyer":**
  - Matches the real detail page layout and sections using draft data.

### 4.5 Demo Dataset & Activity QA
- [ ] **Seed Script Execution:**
  - Run `npm run seed`: verify idempotent execution without creating duplicates.
  - Run `npm run seed -- --reset-demo`: verify only `seed_key IS NOT NULL` demo rows are recreated.
  - Verify 18 live projects + 6 revived projects on the Resurrected Wall.
  - Verify `get_marketplace_stats()` agrees with feed counts.
- [ ] **Zip Archive Delivery:**
  - Download zip archive for each flagship from `/api/secure-download`.
  - Verify archive contents match the declared `file_tree` on the project page.
- [ ] **Demo Accounts & Activity:**
  - Log in as `demo_seller`: verify earnings show ₹6,498 (CartKit + ByteBazaar), 3 collab requests on Lanternly, unread messages, and notifications.
  - Log in as `demo_buyer`: verify Vault contains MarkdownMint and TaskTide with working downloads, pending collab on OpenShelf, and messages.

### 4.6 Security & RLS Spot Checks
- [ ] **Protected Columns Trigger:**
  - Attempting to update `is_featured`, `featured_rank`, or `seed_key` via authenticated user client fails with trigger exception.
  - Updating `tagline`, `features`, `todo_items`, `setup_notes`, `file_tree`, `screenshots`, `collab_roles` succeeds for the project owner.
- [ ] **Storage RLS:**
  - Uploads to `project-covers` restricted to `auth.uid()` path prefix and 2MB max size.

---

## 5. V2.3 Intro Animation Verification Checklist

### 5.1 First-Run Playback & Visual Craft
- [ ] **Open in a Fresh Browser Tab (`/`):**
  - Verify full black fixed cover (`#050505`) appears instantly without flash of unstyled content or page flickering.
  - Verify skull assembles smoothly from 6 distinct vertical slices via `<clipPath>` with alternating vertical offsets (±24px to ±60px) and a 70ms center-outward stagger.
  - Verify slice color transitions from dim grey (`#4a4a4a`) to bright white (`#f2f2f2`).
  - Verify settlement phase: slice seams close cleanly and skull scales 0.96 → 1.00.
  - Verify ignition moment: skull transitions to brand red (`#ff2a2a`) and eye sockets + nasal cavity flash vibrant neon green (`#39ff14`).
  - Verify hold pulse: subtle 2% scale pulse hold.
  - Verify FLIP exit flight: skull flies smoothly into the navbar logo (`[data-intro-target="logo"]`) over 700ms `easeInOut`.
  - Verify the header logo reveals synchronously the instant the flying skull lands with **no transition, no jump, and no double logo**.
  - Verify hero entrance (`SplitText`, `SoulsCanvas`, status pill) triggers seamlessly after intro completion.

### 5.2 Session Persistence & Route Rules
- [ ] **Refresh in Same Tab:**
  - Refresh the page: confirm intro does **not** replay.
- [ ] **Client-Side Navigation:**
  - Click any navigation link (e.g. "Browse", "Design system", or a project card) and then navigate back to `/`: verify intro does **not** replay.
- [ ] **Sub-Route First Visit:**
  - Open a project URL (e.g. `/project/cartkit-checkout-sdk`) as the very first page in a new browser tab: verify intro does **not** play.
  - Navigate to `/`: verify intro does **not** play (marked as seen).

### 5.3 Force Replay & Manual Controls
- [ ] **Replay Triggers:**
  - Navigate to `/?intro=1`: verify intro plays forcibly regardless of previous storage flags.
  - Click "Replay intro ↺" in the footer: verify it clears session storage and executes replay on `/?intro=1`.
  - Click "Replay Intro" button in the `/design-system` Motion tab: verify it clears storage and triggers replay.
- [ ] **Force Skip Parameter:**
  - Navigate to `/?intro=0`: verify intro is skipped immediately and homepage renders normally.

### 5.4 Skip Interactions & Accessibility
- [ ] **User Skip Triggers:**
  - Start intro (`/?intro=1`), then click anywhere on screen: verify immediate fast 250ms fade out.
  - Start intro, press `Esc` key: verify immediate fast 250ms fade out.
  - Start intro, press any keyboard key (e.g. Space, Enter): verify immediate fast 250ms fade out.
  - Verify `Skip [Esc]` hint appears at the bottom-right corner after 600ms.
- [ ] **Inert & Focus Containment:**
  - Inspect `#app-root` during intro playback: verify `inert` attribute is applied so tab navigation cannot reach page elements.
  - Verify `inert` is removed immediately upon intro completion.
- [ ] **Scroll Lock & Unlock:**
  - During intro playback, verify body scroll and Lenis smooth scroll are locked.
  - Upon intro completion, verify scrolling is fully restored without scroll jumps.

### 5.5 Accessibility & Performance Tiers
- [ ] **Reduced Motion:**
  - Enable OS "Reduce motion" preference (`prefers-reduced-motion: reduce`): verify intro is skipped entirely and home page appears instantly.
- [ ] **Low Tier / Save-Data / WebDriver:**
  - Test with `NEXT_PUBLIC_PERF_FORCE=low` or Chrome DevTools "Save-Data" active: verify intro is skipped entirely.
  - Verify `navigator.webdriver === true` automatically bypasses intro for synthetic automation.
- [ ] **High vs Mid Tier Visuals:**
  - On `high` tier desktop: verify 13 dim drifting dots (2-4px, CSS transform only) gently drift in the background.
  - On `mid` tier or mobile: verify dots are completely disabled.
- [ ] **Performance Governor Coordination:**
  - Verify runtime FPS benchmark (`startPerfBenchmark`) does **not** measure during intro playback and starts only after `graveyard:intro-done`.

### 5.6 Failsafe & Resiliency Checks
- [ ] **No-JS Failsafe:**
  - Disable JavaScript in browser settings: verify page content is fully visible immediately (failsafe `<noscript>` style hides `#intro-root`).
- [ ] **4-Second Failsafe:**
  - Throttle CPU 6x or simulate slow hydration: verify `#intro-root` CSS animation hides and unblocks overlay after 4 seconds unconditionally.
- [ ] **Mobile Viewport (375px):**
  - Resize to 375px width: verify skull uses `min(42vw, 180px)`, shorter timeline (≈2.4s), and cleanly flies to mobile navbar or triggers fallback.
- [ ] **Lighthouse Layout Shift:**
  - Run Lighthouse on mobile `/`: confirm CLS is 0.00 with no layout shift caused by intro or logo landing.



