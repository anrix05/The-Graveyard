# The Graveyard — Documentation Suite

Welcome to the technical and product documentation for **The Graveyard**.

---

## Documentation Index

| Document | File Link | Description |
|:---|:---|:---|
| **Product Requirements Document** | [prd.md](file:///d:/the-graveyard/docs/prd.md) | Business problem, user personas, interaction models (`buy`, `adopt`, `collab`), functional features, and roadmap. |
| **Design System & UI/UX Spec** | [design.md](file:///d:/the-graveyard/docs/design.md) | Editorial dark aesthetic tokens, typography (`Bricolage Grotesque`, `Geist`, `Geist Mono`), color palettes, component specifications, and micro-interactions. |
| **System Architecture & Tech Design** | [architecture.md](file:///d:/the-graveyard/docs/architecture.md) | High-level system topology, database ERD, Row Level Security (RLS) matrix, payment & collaborator sequence flows, and infrastructure specifications. |

---

## Key Technical Specifications at a Glance

- **Frontend & App Framework:** Next.js 16 (App Router), React 19, Tailwind CSS, Framer Motion
- **Database & Storage:** Supabase PostgreSQL with strict Row Level Security (RLS) & private object storage
- **Commercial & Settlement:** Razorpay Payment Gateway (INR) with idempotent HMAC-SHA256 signature verification
- **Automation:** GitHub REST API v3 for automated repository collaborator invitations upon verified checkout
- **Continuous Availability:** Vercel Edge Cron jobs for automated database keep-alive pulses
