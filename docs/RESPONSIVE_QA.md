# THE GRAVEYARD: RESPONSIVE & CROSS-DEVICE QA SPECIFICATION (v2.5)

This document specifies the verification criteria and testing matrix for The Graveyard v2.5 across all screen sizes, aspect ratios, zoom levels, and input modalities.

---

## 1. Device & Viewport Support Matrix

| Viewport / Category | Width × Height (px) | DPR | Home (`/`) | Featured Bento | Marketplace Grid | Detail (`/project/[id]`) | Submit Wizard (`/submit`) | Login (`/login`) | Dashboard (`/dashboard`) | Messages | Checkout / Modals |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Phone (Narrow)** | 320 × 568 | 2.0 | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass |
| **Phone (Standard Android)** | 360 × 800 | 3.0 | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass |
| **Phone (Modern iPhone)** | 390 × 844 | 3.0 | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass |
| **Phone (Large iPhone Pro Max)** | 430 × 932 | 3.0 | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass |
| **Phone (Landscape Short)** | 568 × 320 | 2.0 | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass |
| **Phone (Landscape Standard)** | 667 × 375 | 2.0 | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass |
| **Phone (Landscape Modern)** | 844 × 390 | 3.0 | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass |
| **Narrow Split-Screen** | 340 × 700 | 1.0–2.0 | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass |
| **Tablet (Portrait)** | 768 × 1024 | 2.0 | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass |
| **Tablet (Landscape)** | 1024 × 768 | 2.0 | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass |
| **Laptop (HD)** | 1280 × 720 | 1.0 | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass |
| **Laptop (Standard)** | 1366 × 768 | 1.0 | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass |
| **Laptop (Retina 16:10)** | 1440 × 900 | 2.0 | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass |
| **Desktop (FHD)** | 1920 × 1080 | 1.0 | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass |
| **QHD / 2K** | 2560 × 1440 | 1.0 | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass |
| **Ultrawide (21:9)** | 3440 × 1440 | 1.0 | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass |
| **4K UHD** | 3840 × 2160 | 1.5–2.0 | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass |

---

## 2. Per-Page Verification Criteria ("What Must Be True")

### C1. Home Page (`/`)
- [x] **Hero Viewport:** `min-height: min(88svh, 900px)` with auto height on landscape short screens (`max-height: 500px`) so headline, status pill, and CTAs are never cut off.
- [x] **Headline Wrapping:** Balanced wrapping (`text-wrap: balance`, `overflow-wrap: anywhere`) cleanly fits 320px screens without overflowing or awkward breaks.
- [x] **Hero CTAs:** Full width stacked on mobile screens (<640px), inline pill row on larger screens.
- [x] **Stats Row:** Fluid columns: 2 columns on mobile (with the 5th item centered / spanning both columns), 3 columns on tablet, 5 columns on desktop.
- [x] **Marquee:** Duplicate tracks sized in `rem` with seamless animation, automatically pauses when `prefers-reduced-motion: reduce`.
- [x] **"How It Works":** Non-sticky vertical list on mobile and short heights; sticky layered card deck only on `md+` screens.
- [x] **Featured Bento:** 
  - `≥ lg`: 3-card bento with fixed height `clamp(280px, 21cqw, 380px)`.
  - `md`: 2-column grid (large card spans both columns, compact cards side-by-side).
  - `< md`: 1-column vertical stack with 16:10 aspect ratio cover art.
  - Container queries: Compact cards automatically switch from horizontal to vertical layout if their container drops below 420px. Zero dark gaps at any viewport.
- [x] **Marketplace Grid:** Fluid `grid-template-columns: repeat(auto-fill, minmax(clamp(260px, 22vw, 340px), 1fr))` capped at 1600px max width. Cards never render narrower than 260px.
- [x] **Sticky Filter Bar:**
  - Mobile: compact single-row bar with search input + "Filters" button + active count chip.
  - "Filters" button opens a bottom sheet modal with grab handle, `max-h-[90dvh]`, internal scroll, and sticky apply button.
  - Mode tabs: horizontally scrollable segmented control with snap and subtle edge fades. Never wraps to two lines.
- [x] **Resurrected Wall Rail:** Fluid card widths `clamp(240px, 70vw, 340px)` with touch swipe, CSS scroll-snap, keyboard arrow navigation (`ArrowLeft` / `ArrowRight`), and desktop scroll arrow buttons.
- [x] **Footer:** 3-column link grid cleanly stacks (`1 col` on `<380px`, `2 cols` on `xs`, `3 cols` on `sm+`). Giant wordmark scales fluidly with `clamp()` and never wraps. Safe-area bottom padding applied.

### C2. Project Detail (`/project/[id]`)
- [x] **Layout Switch:** `≥ lg`: 2-column layout with sticky right action panel (`top-[84px]`). `< lg`: 1-column layout with full "What you get" checklist placed naturally in the page flow.
- [x] **Mobile Sticky Bottom Bar:** On `< lg`, primary action pins to the screen bottom (`sticky bottom-0`) with safe-area padding (`safe-pb`), price/label display, primary CTA, and quick action buttons.
- [x] **Page Padding:** Detail page main content has `pb-28 lg:pb-16` so sticky bottom bar never obscures content.
- [x] **Screenshot Gallery:** Aspect-ratio thumbnails scroll horizontally; lightbox supports touch swipe navigation (`onTouchStart`/`onTouchEnd`) and dismiss.
- [x] **File Tree & Code:** File tree and setup code blocks have internal horizontal scroll (`overflow-x-auto`) preventing document horizontal blowouts.

### C3. Publish Wizard (`/submit`)
- [x] **Stepper:** Compacts below `md` to "Step X of Y" with a smooth animated progress bar.
- [x] **Form Layout:** 1 column on mobile, 2 columns on `lg+` for dense field groups.
- [x] **Sticky Action Bar:** Pinned to bottom with safe-area padding (`safe-pb`) and `pb-28` body buffer.
- [x] **Input Touch Targets:** Minimum 44×44px hit areas on touch; form input fonts `text-base` (16px) on mobile to eliminate iOS Safari automatic zooming.

### C4. Dashboard (`/dashboard`)
- [x] **Navigation:** `≥ lg`: Left sidebar. `< lg`: 5-item bottom tab bar with "More" bottom sheet modal containing secondary tabs (`Collabs`, `Messages`, `Settings`).
- [x] **Data Tables:**
  - `≥ md`: Horizontally scrollable tables with `overflow-x-auto`.
  - `< md`: Rows transform into structured stacked cards displaying status pills, metrics, and actions.
- [x] **Stat Cards:** 2 columns on mobile, 3 on tablet, 5 on desktop.

### C5. Messages (`ChatInterface`)
- [x] **Two-Pane Split:** On `≥ lg`, side-by-side threads list (320px–384px) and active conversation pane.
- [x] **Mobile Full-Screen Navigation:** On `< lg`, threads list is displayed by default; clicking a conversation switches to a full-screen message stream with a prominent "← Back" button.
- [x] **Sticky Composer:** Sticks to bottom above safe areas with `safe-pb` and adjusts for on-screen keyboard via `visualViewport`.
- [x] **Anchored Scroll:** Message list maintains anchored scroll to the latest dispatch.

### C6. Modals & Sheets
- [x] **Checkout / Payment Modal:** Transforms into bottom sheet on `< sm` with grab handle, `max-h-[92dvh]`, internal scroll, sticky button footer, and body scroll lock.
- [x] **Collab Request Modal:** Transforms into bottom sheet on `< sm` with identical behavior.
- [x] **Confirm Dialog:** Bottom sheet on `< sm`, centered modal dialog on `sm+`.
- [x] **Notification Bell:** Full-screen bottom sheet on mobile, anchored floating popover on `sm+`.

### C7. Intro Animation (`IntroOverlay`)
- [x] **Viewport & Sizing:** Uses `100dvh` and safe-area margins. Vector skull scales with `clamp(140px, 18vmin, 240px)`.
- [x] **FLIP Flight Resilience:** Validates target bounding rect dimensions and position; if the target navbar logo is hidden or moved under a hamburger menu, gracefully falls back to a smooth fade-out and subtle scale-down.

---

## 3. Zoom, Scaling, and Accessibility Criteria

- [x] **200% Browser Zoom:** Effective viewport ~960×540. Header cleanly collapses to hamburger; modals scroll internally without clipping; sticky bars never exceed 25% of viewport height.
- [x] **Touch Targets:** Coarse pointer media query `@media (pointer: coarse)` ensures all buttons, tabs, links, and form controls have a minimum touch footprint of 44×44px.
- [x] **Hover Isolation:** All hover states are strictly isolated inside `@media (hover: hover) and (pointer: fine)`.
- [x] **High Contrast (`prefers-contrast: more`):** Increased border opacity, high-contrast text, clear outlines on focus and active elements.
- [x] **Forced Colors (`forced-colors: active`):** `CanvasText` fallbacks, explicit outlines, SVG icons using `currentColor`.
- [x] **Currency Formatting:** All prices use `formatINR` with standard `en-IN` formatting (`₹1,00,000`), with zero hand-rolled formatting.
