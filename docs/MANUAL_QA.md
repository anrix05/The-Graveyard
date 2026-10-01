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

---

## 6. V2.4 Authentication & Auth Suite QA Checklist

### 6.1 Layout, Responsiveness & Shape Language
- [ ] **Desktop Split Layout (≥ 1024px):**
  - Verify full-viewport split screen with left panel 46% width and right panel 54% width.
  - Verify both panels start at the top edge of the viewport and extend to `min-h-dvh` with zero outer boxes or sharp borders.
  - Verify form column is horizontally and vertically centered with `max-w-[420px]`.
  - Verify `← Back to home` link sits inside the form column, not floating at viewport edge.
- [ ] **Mobile & Tablet (< 1024px):**
  - Verify brand panel collapses to a compact top bar (skull + wordmark + headline).
  - Verify at ≤ 480px width, only skull + wordmark are shown.
  - Verify natural vertical scrolling on short screens (e.g. mobile landscape) and at 200% browser zoom with zero clipped form controls.
  - Verify test at 320px width: zero horizontal scrolling.

### 6.2 Form States, Validation & Enumeration Protection
- [ ] **Sign In & Sign Up Tab Switching:**
  - Click between "Sign in" and "Create account" tabs: verify smooth sliding pill indicator (`layoutId="auth-tab-pill"`).
  - Verify URL syncs with `?mode=signin` / `?mode=signup` with `replace` and no scroll jump.
  - Verify typed email is preserved across tab switches while password and validation errors reset.
- [ ] **Validation & Keyboard Behavior:**
  - Leave fields blank and submit: verify first invalid field receives focus immediately.
  - Verify inline validation errors display below the field with red text, icon, and `aria-describedby`.
  - Type in password with Caps Lock on: verify amber "Caps Lock is on" alert appears dynamically under the input.
  - Click show/hide password toggle: verify input type switches between `password` and `text`, and `aria-pressed` reflects state.
  - On sign-up, type password: verify 4-segment strength meter updates dynamically with text label ("Weak", "Okay", "Strong").
- [ ] **Account Enumeration Safety:**
  - Attempt sign-in with non-existent email or wrong password: verify message reads "Email or password is incorrect."
  - Attempt forgot-password request: verify message reads "If an account exists for that email, we've sent a reset link."
- [ ] **Sign-up & Magic Link Success Views:**
  - Complete sign-up: verify form transitions to "Check your email" view with 30s resend cooldown timer and "Use a different email" link.
  - Request magic link: verify transition to magic link confirmation view with resend cooldown.
- [ ] **Autofill Styling:**
  - Use browser password autofill: verify inputs maintain dark surface background (`#17171a`) and readable text without bright white autofill backgrounds.

### 6.3 OAuth, Redirect Hardening & Intent Auto-Engagement
- [ ] **Open-Redirect Hardening Tests:**
  - Visit `/login?next=//evil.com`: verify post-login landing is `/dashboard`.
  - Visit `/login?next=https://evil.com`: verify post-login landing is `/dashboard`.
  - Visit `/login?next=/\evil.com`: verify post-login landing is `/dashboard`.
  - Visit `/login?next=%2f%2fevil.com`: verify post-login landing is `/dashboard`.
  - Visit `/login?next=/project/123`: verify post-login landing is `/project/123`.
- [ ] **Action Intent Whitelisting & Preservation:**
  - Visit `/login?next=/project/test-id&intent=buy`: log in and verify redirect to `/project/test-id?intent=buy` opening checkout.
  - Visit `/login?next=/project/test-id&intent=claim`: log in and verify redirect to `/project/test-id?intent=claim` opening claim modal.
  - Visit `/login?next=/project/test-id&intent=apply`: log in and verify redirect to `/project/test-id?intent=apply` opening pitch modal.
  - Visit `/login?next=/project/test-id&intent=malicious`: verify invalid intent is dropped.
- [ ] **OAuth Cancellation:**
  - Click "Continue with GitHub", cancel authorization on GitHub: verify redirect back to `/login` with friendly inline alert: "Sign-in was cancelled."

### 6.4 Onboarding & Companion Flows
- [ ] **First-Time User Onboarding:**
  - Sign in with a new user: verify redirection to `/onboarding`.
  - Type username: verify 400ms debounced live check against `profiles` table displays "checking", "available", or "taken".
  - Submit onboarding profile: verify profile is created and user is routed to `safeNext`.
- [ ] **Password Reset Flow:**
  - Visit `/forgot-password`: enter email, submit, verify cooldown.
  - Visit `/reset-password` without valid session: verify "Reset link expired" screen with CTA to request a new link.
  - Visit `/reset-password` with valid session: enter new password + confirm, verify strength meter and successful update.

### 6.5 Demo Mode Sandbox
- [ ] **Demo Mode Toggles:**
  - With `NEXT_PUBLIC_DEMO_MODE=true`: verify "Just exploring?" sandbox section appears with "Try as demo buyer" and "Try as demo seller".
  - Click "Try as demo buyer": verify instant login and dashboard redirect prefilled with purchases.
  - Click "Try as demo seller": verify instant login owning live listings and sales ledger.
  - With `NEXT_PUBLIC_DEMO_MODE=false`: verify demo block is completely hidden.

### 6.6 Accessibility & Motion
- [ ] **WCAG AA Contrast & Focus:**
  - Tab through all controls with keyboard: verify visible `2px` focus outline with offset on tabs, buttons, inputs, and links.
  - Verify all text colors pass WCAG AA contrast against dark surfaces.
  - Verify all touch targets are ≥ 44px height.
- [ ] **Motion & Performance:**
  - High tier: verify 8 subtle glyphs gently drift in brand panel (`transform: translateY`).
  - Mid/Low tier or `prefers-reduced-motion`: verify drifting is static and error shake is disabled.

---

## 7. v2.6 Launch Readiness QA Checklist

### 7.1 SEO, Metadata & Structured Data
- [ ] **Page Metadata & Canonicals:**
  - View source on `/`: verify title `The Graveyard: where dead code gets resurrected`, description (≤155 chars), canonical link to `/`, Open Graph and Twitter summary tags.
  - View source on a project page (`/project/[id]`): verify unique title `{title} · {For sale | Free fork | Seeking partner} · The Graveyard`, tagline description, canonical to `/project/[id]`, dynamic OG image URL.
  - View source on `/terms`, `/privacy`, `/contact`: verify unique indexable meta tags.
  - View source on private routes (`/login`, `/submit`, `/dashboard`, `/orders/[id]`, `/collab/sent`, `/design-system/responsive`): verify `<meta name="robots" content="noindex, nofollow" />`.
- [ ] **JSON-LD Structured Data:**
  - View source on `/`: verify `<script type="application/ld+json">` includes valid `WebSite` with `SearchAction` (`/?q={search_term_string}`) and `Organization` markup with social links from env vars.
  - Verify JSON is escaped safely against XSS without `<` or `>` injections.

### 7.2 Social Share Previews
- [ ] **Default OG Card (`/opengraph-image`):**
  - Open `/opengraph-image` in browser: verify 1200×630 canvas, red radial glow, vector skull mark, "The Graveyard" wordmark, and "Where dead code gets resurrected" tagline with safe 64px padding.
- [ ] **Dynamic Project OG Card (`/project/[id]/opengraph-image`):**
  - Open a project's OG image: verify mode badge pill (dot + text), price/terms, project title, tagline, tombstone line, seller attribution, and footer mark.
  - Verify text truncation: long titles or taglines truncate cleanly with ellipsis without visual overflow.
  - Open an invalid ID: verify fallback default Graveyard social card renders.

### 7.3 Favicons & Web Manifest
- [ ] **Favicon Suite:**
  - Browser tab displays red skull favicon on dark rounded square against both light and dark browser themes.
  - Verify `/apple-icon.png` (180×180), `/favicon.ico` (multi-size), `/icon-192.png`, and `/icon-512.png` respond with 200 OK.
  - Verify `/icon-maskable-512.png` keeps skull inside Android safe zone.
- [ ] **Web Manifest (`/manifest.webmanifest`):**
  - Verify response JSON contains `name: "The Graveyard"`, `short_name: "Graveyard"`, `theme_color: "#0a0a0b"`, and icon entries.

### 7.4 Robots.txt & Dynamic Sitemap
- [ ] **Robots Exclusion (`/robots.txt`):**
  - Verify `/` is allowed; `/api/`, `/dashboard`, `/orders/`, `/submit`, `/collab/`, `/auth/`, `/login`, `/design-system/responsive` are disallowed.
  - Verify `Sitemap:` points to `https://.../sitemap.xml`.
- [ ] **Sitemap (`/sitemap.xml`):**
  - Verify static routes (`/`, `/terms`, `/privacy`, `/contact`, `/design-system`) are listed.
  - Verify live, non-archived projects (`/projects/{id}`) are listed with accurate `lastModified` and priority scores.
  - Verify archived or deleted projects are excluded.

### 7.5 Alt Text & Image Accessibility
- [ ] **Alt Text Audit:**
  - Inspect project cards, bento features, screenshot gallery, and avatar elements in DevTools: verify every `Img` has a descriptive `alt` attribute or `decorative: true` (`alt=""` + `aria-hidden="true"`).
  - Verify `npm run lint` passes with `jsx-a11y/alt-text` set to error.

### 7.6 Order Confirmation & Thank-You Flows
- [ ] **Paid Purchase (`/orders/[transactionId]`):**
  - Complete test mode acquisition: verify instant redirect to `/orders/[transactionId]`.
  - Verify `TEST MODE` pill, project details, copyable transaction ID, and delivery card (source ZIP download + GitHub invite status).
  - Verify "Print / Save as PDF" button triggers print stylesheet cleanly formatted as a receipt.
  - Attempt accessing order with unauthenticated or non-buyer account: verify `404 Not Found`.
- [ ] **Free Fork Claim:**
  - Click "Claim Free" on an adopt project: verify success toast and redirect to `/orders/[transactionId]`.
- [ ] **Publish Confirmation (`/submit/success?id=...`):**
  - Publish a listing from wizard: verify redirect to `/submit/success?id=...`.
  - Verify listing preview card, copyable link button, and share intent buttons (X, LinkedIn, WhatsApp).
  - Verify unauthenticated or non-owner access yields `404 Not Found`.
- [ ] **Collab Pitch Confirmation (`/collab/sent?project=...`):**
  - Submit collaboration pitch: verify redirect to `/collab/sent?project=...` with next steps and link to Collabs Console.

### 7.7 Analytics & Minimal Consent Notice
- [ ] **Consent Notice & Persistence:**
  - Visit `/` on a fresh session after intro completes: verify non-blocking bottom consent card appears without obscuring navigation or CTAs.
  - Click "Got it": verify banner dismisses and sets 12-month preference in `localStorage`.
  - Click "Cookie settings" in footer: verify settings modal opens with analytics toggle.
- [ ] **Opt-Out & Privacy Controls:**
  - Select "Opt out of analytics" or enable Do Not Track (`navigator.doNotTrack === '1'`) or Global Privacy Control: verify `@vercel/analytics` drops all outgoing beacons (`beforeSend` returns null).
  - Verify analytics is disabled in local development.
  - Verify zero PII is emitted across all `track()` event payloads.

### 7.8 Legal & Contact Pages
- [ ] **Privacy Policy (`/privacy`) & Terms of Use (`/terms`):**
  - Verify visible portfolio demonstration disclaimer banner at top.
  - Verify Table of Contents with smooth anchor links.
  - Verify 68ch maximum reading measure and print styles.
  - Verify contact email is populated from `NEXT_PUBLIC_CONTACT_EMAIL`.
- [ ] **Contact Page (`/contact`):**
  - Verify Email card with copy button, GitHub card with link to repository issues, and Report a Listing card.
  - Click "Report this listing" from a project detail page: verify `/contact?listing=[id]` prefills takedown email subject and body.

### 7.9 Image Optimization & Upload Compression
- [ ] **Client-Side Compression:**
  - In Submit wizard or Edit listing, upload a 4MB photo as cover: verify toast logs optimization (e.g., `Optimized 4.20MB → 210KB WebP`).
  - Verify uploaded file stored in Supabase storage has `.webp` extension with random cache-busting suffix.
- [ ] **Next.js Image Delivery:**
  - Inspect network responses for project covers and gallery: verify `content-type: image/webp` or `image/avif` with `Cache-Control: max-age=2678400`.

### 7.10 Security Headers
- [ ] **Header Verification:**
  - Run `curl -I http://localhost:3000/` or inspect network headers in DevTools:
    - `X-Content-Type-Options: nosniff`
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `X-Frame-Options: SAMEORIGIN`
    - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
    - In production: verify `Content-Security-Policy-Report-Only` is present without console blocking errors.

### 7.11 404 & Above-The-Fold CTAs
- [ ] **Branded 404:**
  - Visit `/non-existent-route`: verify branded 404 page, search input submitting to `/?q=`, dual CTAs (`Back to home` + `Browse projects`), and `noindex` header.
- [ ] **Above-the-fold CTA Visibility:**
  - Verify clear primary action is visible without scrolling at 1366×768 (desktop) and 390×844 (mobile) across Home, Project Detail, Wizard, Login, Dashboard, Contact, Orders, and 404.

---

## 8. V2.7 MANUAL QA: HERO BACKGROUND MOTION ON MOBILE

### 8.1 Mobile Viewport & Margin Drift Emulation
- [ ] **DevTools Mobile Emulation (440×956, 390×844, 360×800, 320×568):**
  - Verify glyphs drift smoothly in the hero perimeter and margins.
  - Verify no glyphs cross over or overlap the status pill, main headline, subline, or primary CTA buttons.
  - Verify smooth 60fps scrolling without stutter or frame drops.
- [ ] **Mobile Text Wrap Polish:**
  - Verify "co-founder" in the subline never breaks across two lines at the hyphen ("co-" / "founder").

### 8.2 Real Phone & Touch Interaction Testing
- [ ] **Real Phone (iOS Safari & Android Chrome):**
  - Test on a real device using a production build (`npm run perf` / `npm run build && npm run start`).
  - Verify subtle motion is visible in the background.
  - Verify scrolling is buttery smooth, with zero touch lag and no battery drain or heat buildup over 60 seconds of use.
- [ ] **Touch Ripple Interaction:**
  - Tap or drag a finger inside the hero area: verify subtle ripple nudges nearby 4–6 particles outward without blocking or interfering with vertical scrolling (`touch-action: pan-y`).
  - Tap CTA buttons ("Browse projects", "List a dead project"): verify button taps register immediately without being intercepted by the canvas layer.

### 8.3 Screen Rotation & Address Bar Collapse
- [ ] **Phone Rotation (Portrait ↔ Landscape):**
  - Rotate device to landscape: verify canvas and dynamic legibility mask resize correctly without stuck particles.
  - Scroll up and down on a real phone: verify that mobile browser address bar collapsing/expanding does not cause canvas re-allocation or layout shift (debounced 120px threshold).

### 8.4 Hero FX Mode Overrides & Reduced Motion
- [ ] **Query Parameter Overrides (`?fx=`):**
  - `/?fx=canvas`: forces canvas mode (desktop or mobile according to viewport).
  - `/?fx=css`: forces pure CSS fallback (drifting ambient red glow + 10 perimeter glyphs).
  - `/?fx=static`: forces static gradient (zero particle loops, zero CSS animations).
- [ ] **Accessibility / Reduced Motion:**
  - Enable OS "Reduce motion" preference: verify hero background immediately locks to the static gradient.
- [ ] **Background Tab & Off-Screen Pausing:**
  - Scroll past the hero: verify `IntersectionObserver` pauses canvas rendering and CSS animations.
  - Switch browser tabs: verify `visibilitychange` pauses loops, and resumes cleanly without time jumps.

### 8.5 Governor Self-Protection Fallback
- [ ] **CPU 6x Throttling:**
  - In Chrome DevTools Performance panel, set CPU to "6x slowdown".
  - Reload page: verify that if median frame time exceeds ~42ms during the first 2 seconds, the hero automatically downgrades to `css` mode and remembers it in `sessionStorage`.

### 8.6 Design System & Viewport Badge Verification
- [ ] **Design System (`/design-system`):**
  - Visit `/design-system`, open the "Motion & Governor" tab:
    - Verify updated v2.7 performance tier rules table (High = Desktop, Mid = Mobile/Touch, Low = Fallback/Battery).
    - Test the Hero FX Mode Switcher buttons (`Auto`, `Desktop`, `Mobile`, `CSS`, `Static`).
    - Verify the interactive Hero Motion Sandbox renders and updates live with the active mode and dynamic legibility mask.
- [ ] **Viewport Badge (Dev Mode / `?debug=viewport`):**
  - Verify the badge displays the active Hero FX mode (e.g., `MD | 440×956 | 2x | MID | canvas-mobile`).





