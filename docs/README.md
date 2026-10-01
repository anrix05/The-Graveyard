# The Graveyard — Documentation Suite

Welcome to the technical, architectural, and quality assurance documentation for **The Graveyard** (v2.8).

---

## Documentation Index

| Document | File Link | Description |
|:---|:---|:---|
| **Product Requirements Document** | [prd.md](file:///d:/the-graveyard/docs/prd.md) | Business problem, user personas, interaction models (`buy`, `adopt`, `collab`), functional features, and roadmap. |
| **Design System & UI/UX Spec** | [design.md](file:///d:/the-graveyard/docs/design.md) | Editorial dark aesthetic tokens, typography (`Bricolage Grotesque`, `Geist`, `Geist Mono`), color palettes, component specifications, and micro-interactions. |
| **System Architecture & Tech Design** | [architecture.md](file:///d:/the-graveyard/docs/architecture.md) | High-level system topology, database ERD, Row Level Security (RLS) matrix, payment & collaborator sequence flows, and infrastructure specifications. |
| **Manual QA & Verification Suite** | [MANUAL_QA.md](file:///d:/the-graveyard/docs/MANUAL_QA.md) | Exhaustive test checklist across 9 sections: core flows, auth, responsive viewports, accessibility, and v2.8 console redesign. |
| **Responsive QA Test Guide** | [RESPONSIVE_QA.md](file:///d:/the-graveyard/docs/RESPONSIVE_QA.md) | Viewport-by-viewport responsive matrix (320px to 4K ultra-wide, landscape mobile, 200% zoom, touch-targets). |

---

## Related Guides & Directories

- **Root Guide:** [README.md](file:///d:/the-graveyard/README.md) — Main product overview, setup instructions, and architecture summary.
- **Database & Schemas:** [supabase/README.md](file:///d:/the-graveyard/supabase/README.md) — Supabase migrations, RLS policies, and SQL setup scripts.
- **Developer Scripts:** [scripts/README.md](file:///d:/the-graveyard/scripts/README.md) — Database seed harness, GitHub invite tester, and asset generators.

---

## Key Technical Specifications at a Glance

- **Frontend & App Framework:** Next.js 16 (App Router), React 19, Tailwind CSS v3.4, Framer Motion
- **Database & Storage:** Supabase PostgreSQL 15 with strict Row Level Security (RLS) & private object storage buckets
- **Commercial & Settlement:** Razorpay Payment Gateway (INR paise pricing) with idempotent HMAC-SHA256 signature verification (**TEST MODE** only)
- **GitHub Collaborator Automation:** GitHub REST API v3 for automated repository collaborator invitations upon verified checkout
- **Continuous Availability:** Vercel Edge Cron jobs for automated database keep-alive pulses
- **Console Workspace (v2.8):** Calm, distraction-free developer dashboard (`/dashboard`) with unified desktop sidebar/sticky topbar, mobile bottom navigation, and self-service account deletion
