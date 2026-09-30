# Design System & UI/UX Specification
## The Graveyard — V2.2 Motion-Forward Editorial Interface System

---

### Document Information
- **Design System Name:** Graveyard Motion System & Craft
- **Version:** 2.2.0
- **Status:** Production Standard
- **Primary Design Paradigm:** Editorial Dark Site / Awwwards-Level Motion / Subtle Cyberpunk Telemetry
- **Target Formats:** Web (Desktop, Tablet, Mobile)
- **Last Updated:** October 2026

---

## 1. Design Philosophy & Brand Identity

The Graveyard V2.2 marries the craft and motion of award-winning digital experiences (Linear, Raycast, Resend, Basement Studio) with developer culture, cyberpunk telemetry, and rigorous layout alignment.

### 1.1 Core Tenets
1. **Space and Tone over Borders:** Depth is communicated through subtle surface tonal shifts (`#0a0a0b` -> `#111113` -> `#17171a` -> `#1e1e22`) and hairline dividers (`rgba(255,255,255,0.08)`), eliminating rigid, heavy box borders on every element.
2. **Confident Typography:** Fluid scale typography with distinct functional roles:
   - **Bricolage Grotesque** for confident, sentence-case headlines with tight letter-spacing.
   - **Geist** for balanced, highly legible body copy and UI labels.
   - **Geist Mono** strictly for prices, commit timestamps, hash IDs, and micro-labels 12px and under.
   - **Instrument Serif Italic** as a poetic pull-quote accent for tombstone epitaphs.
3. **Pill Brand Signature:** All buttons and badges are soft pills (`rounded-full`). All cards, media, modals, inputs, and popovers use soft modern radii (12px to 24px). Chamfers have been completely retired.
4. **Cinematic Motion with Strict Effects Budget:** Expressive motion (2D particle canvas, magnetic buttons, custom cursor, SplitText reveals) is reserved for the landing hero and detail page, while high-utility screens (publish wizard, checkout, dashboard, messages) remain calm and instant (150–200ms micro-transitions).

---

## 2. Color Palette & Token System

### 2.1 Core Dark Surfaces & Lines

| Token Name | Value | Role & Application |
|:---|:---|:---|
| `--bg` | `#0a0a0b` | Root background void |
| `--surface` | `#111113` | Primary cards, panels, containers |
| `--surface-2` | `#17171a` | Elevated chips, secondary buttons, inputs |
| `--surface-3` | `#1e1e22` | Popovers, active states |
| `--line` | `rgba(255,255,255,0.08)` | Hairline dividers and subtle separation |
| `--fg` | `#ededed` | High-contrast copy |
| `--muted` | `#9ca3af` | Secondary text (WCAG AA compliant ≥4.5:1) |

### 2.2 Mode Accents

| Mode | Accent Color | Accent Value | UI Role |
|:---|:---|:---|:---|
| **For Sale** | Neon Green | `#39ff14` | Exclusive sale, buy CTA |
| **Free Fork** | Amber | `#fbbf24` | Open-source adoption, claim CTA |
| **Seeking Partner** | Electric Blue | `#3b82f6` | Co-founder match, apply CTA |
| **Brand Danger** | Laser Red | `#dc2626` | Destructive actions & brand highlights |

---

## 3. Bento Grid & Card Evenness (v2.2)

### 3.1 Featured Resurrections Bento
- **Grid Specification**: Fixed desktop grid (`lg+`) with a **300px row height** and **24px gap**.
  - **Large Card**: Spans columns 1–7 and 2 rows (total height: 624px).
    - Top ~55%: Cover area (`CoverArt` or screenshot) with mode pill top-left and `completion_percent` chip top-right.
    - Content area (28px padding): Title (Geist 600, 28px), 2–3 line tagline/description, tech pills, tombstone telemetry line, and Instrument Serif pull-quote with gradient scrim.
  - **Compact Cards**: Two cards spanning columns 8–12, 1 row each (total height: 300px).
    - Horizontal layout: 42% cover column stretching full height, 58% content column with pinned footer.
    - Distributed vertical elements: Top row (mode + completion chip), Title (20px, 1-line clamp, animated underline on hover only), Tagline (3-line clamp), Tech pills, Tombstone line, Pinned `CardFooter`.
- **Fallbacks**: 2 items render as equal side-by-side vertical cards; 1 item renders as a full-width curated card.

### 3.2 Universal `CardFooter`
Standardized across all card variants:
- **Left**: Seller gradient avatar (28px) + `@username` (Geist 500, 14px, truncates with ellipsis).
- **Right**: Price/terms pill + 40px circular arrow button.
  - Tabular numerals: `₹4,999` (buy), `Free` (adopt), or collab terms pill (e.g. `Equity split`).
  - Circular button: white-on-dark hover fill, arrow nudging 3px on hover.
  - No standalone mono "Collab" text, no "View project" pill, no "Inspect →" link.

### 3.3 Regular Grid Evenness
- All cards render with `items-stretch`, `h-full flex flex-col`, and `mt-auto` on footers.
- 16:10 fixed aspect ratio for covers.
- Fixed 2-line min-height (`min-h-[2.5rem]`) for descriptions.
- Single-row tech pills with `+N` overflow chip.
- `completion_percent` chip mounted on the top-right of covers.

---

## 4. Full-Detail Project Dossier (v2.2)

1. **Cover Hero**: View Transitions target (`view-transition-name: project-<id>`), mode pill, display title, tagline, tombstone line, epitaph pull-quote, and live demo button.
2. **Screenshot Gallery**: 16:10 primary preview with thumbnail strip; opens Radix Dialog lightbox with arrow-key and Esc navigation.
3. **Status at Death**: Unboxed stat row (`Completion 85%`, `Lines of code 14.2k`, `Last commit Mar 2025`, `Dead for 1y 6m`) with progress bar.
4. **Markdown Content**: Headings, lists, links, and code blocks with one-click copy buttons.
5. **What Works / What's Left**: Two-column checklist with accent checkmarks (✓) and open circles (○).
6. **What's Inside**: Collapsible hierarchical file tree with file icons and internal scroll.
7. **Collab Roles**: Dedicated cards detailing partner roles, weekly commitment, and terms.
8. **Sticky Action Panel**: Purchase/claim/apply CTA with "What you get" dynamic checklist.
