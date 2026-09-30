# The Graveyard: System Architecture Specification (v2.0)

## 1. System Overview & Technology Stack

The Graveyard is an industrial cyberpunk marketplace for resurrecting abandoned software. The application is built on:
- **Frontend / Fullstack Framework:** Next.js (App Router, React 19, TypeScript strict mode)
- **Styling & UI:** Tailwind CSS, Radix UI primitives, Lucide Icons, Sonner
- **Database & Auth:** Supabase (PostgreSQL 15, Row Level Security, Realtime WebSockets)
- **Storage:** Supabase Storage (Private `project-files`, Public `project-covers` max 2MB)
- **Payments:** Razorpay Standard Checkout (TEST MODE only, zero live currency, INR paise integers)
- **Source Management:** GitHub REST API (v3) with automated collaborator invitations
- **Automation:** Edge Cron jobs via Vercel (`0 3 * * *`)

---

## 2. Entity-Relationship Model (v2)

```mermaid
erDiagram
    PROFILES ||--o{ PROJECTS : "publishes (seller)"
    PROFILES ||--o{ TRANSACTIONS : "purchases / claims (buyer)"
    PROFILES ||--o{ COLLAB_REQUESTS : "pitches (applicant)"
    PROFILES ||--o{ NOTIFICATIONS : "receives"
    
    PROJECTS ||--|| PROJECT_ASSETS : "delivery credentials (1:1)"
    PROJECTS ||--o{ TRANSACTIONS : "monetizes"
    PROJECTS ||--o{ COLLAB_REQUESTS : "receives applications"
    PROJECTS ||--o{ MESSAGES : "discusses"

    PROFILES {
        uuid id PK "Matches auth.users(id)"
        text username "UNIQUE"
        text avatar_url
        text bio
        timestamp created_at
    }

    PROJECTS {
        uuid id PK
        uuid seller_id FK "References profiles(id)"
        text title
        text description
        text interaction_type "CHECK IN ('buy', 'adopt', 'collab')"
        int price_paise "Integer in paise. buy > 0, adopt/collab = 0"
        text[] tech_stack
        text license
        text cover_url "Public bucket asset or SVG data URL"
        text demo_url "Optional live preview"
        text collab_terms "For collab: e.g. Equity, Revenue share"
        boolean has_archive "Public boolean"
        boolean has_repo "Public boolean"
        boolean is_sold "Protected trigger"
        boolean is_archived "Archive toggle"
        boolean is_collab_filled "Collab position filled toggle"
        int views "Incremented via RPC increment_project_view"
        timestamp created_at
    }

    PROJECT_ASSETS {
        uuid project_id PK "References projects(id) ON DELETE CASCADE"
        text file_path "Private path in project-files bucket"
        bigint file_size_bytes
        text github_repo_id
        text github_repo_full_name "e.g. owner/repo"
        boolean is_private_repo
    }

    TRANSACTIONS {
        uuid id PK
        uuid project_id FK "References projects(id)"
        uuid seller_id FK "References profiles(id)"
        uuid buyer_id FK "References profiles(id)"
        int amount "INR amount in whole units"
        text kind "CHECK IN ('buy', 'adopt')"
        text status "CHECK IN ('pending', 'completed', 'failed', 'refunded')"
        text payment_id "Razorpay Payment ID / FREE_CLAIM_*"
        text razorpay_order_id "Razorpay Order ID (UNIQUE)"
        timestamp expires_at "10-minute hold for pending"
        text github_username "Provided during checkout"
        text invite_status "CHECK IN ('not_applicable', 'pending', 'sent', 'failed')"
        text invite_error
        timestamp created_at
    }

    COLLAB_REQUESTS {
        uuid id PK
        uuid project_id FK "References projects(id) ON DELETE CASCADE"
        uuid applicant_id FK "References profiles(id) ON DELETE CASCADE"
        text pitch "Min 50 chars"
        text background
        text contact
        text portfolio_url
        text status "CHECK IN ('pending', 'accepted', 'rejected', 'withdrawn')"
        timestamp created_at
    }

    MESSAGES {
        uuid id PK
        uuid sender_id FK "References profiles(id)"
        uuid receiver_id FK "References profiles(id)"
        uuid project_id FK "References projects(id) ON DELETE SET NULL"
        text thread_key "Indexed composite key: least(u1,u2):greatest(u1,u2):project_id"
        text content "Immutable content enforced via trigger"
        boolean is_read
        boolean deleted_by_sender
        boolean deleted_by_receiver
        timestamp created_at
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK "References profiles(id) ON DELETE CASCADE"
        text type "sale | claim | collab | message | system"
        text title
        text body
        text link
        timestamp read_at
        timestamp created_at
    }
```

---

## 3. Database Security & Integrity Rules

### 3.1 Unique Constraints & Anti-Double-Sale
- **Single Buyer for For Sale (`buy`):**
  ```sql
  CREATE UNIQUE INDEX unique_completed_project_purchase 
  ON public.transactions (project_id) 
  WHERE (status = 'completed' AND kind = 'buy');
  ```
- **Single Claim Per User for Free Fork (`adopt`):**
  ```sql
  CREATE UNIQUE INDEX unique_user_adopt_claim 
  ON public.transactions (project_id, buyer_id) 
  WHERE (status = 'completed' AND kind = 'adopt');
  ```
- **Unique Collab Application Per Operative:**
  ```sql
  CONSTRAINT unique_project_applicant UNIQUE (project_id, applicant_id)
  ```

### 3.2 Delivery Isolation (`project_assets`)
Delivery coordinates (`file_path`, `github_repo_full_name`, `is_private_repo`) are strictly separated from `projects`.
- **Public `projects` table:** Only exposes `has_archive: boolean` and `has_repo: boolean`.
- **`project_assets` table:** Secured via RLS:
  - Seller can `SELECT`, `INSERT`, `UPDATE`, `DELETE`.
  - Entitled buyer (with `status = 'completed'` transaction) can `SELECT`.
  - Strangers receive zero records.

### 3.3 Column Protection Triggers
A `BEFORE UPDATE` trigger on `projects` protects sensitive operational fields from client tampering unless `auth.role() = 'service_role'`:
- Cannot alter: `seller_id`, `is_sold`, `views`, `interaction_type`, `price_paise`, `created_at`.
- Seller can update: `title`, `description`, `tech_stack`, `cover_url`, `demo_url`, `is_collab_filled`, `is_archived`.
- Views are incremented exclusively through the `increment_project_view(p_id)` RPC (ignoring seller self-views).

---

## 4. Fulfillment & Payment Engine

```mermaid
sequenceDiagram
    autonumber
    actor Operative as Operative (Buyer)
    participant Client as Next.js Client
    participant CreateOrder as /api/create-order
    participant Razorpay as Razorpay API (Test Mode)
    participant VerifyAPI as /api/verify-payment
    participant WebhookAPI as /api/razorpay-webhook
    participant Fulfill as lib/fulfillment.ts
    participant DB as Supabase PostgreSQL
    participant GitHub as GitHub REST API

    Operative->>Client: Click "Buy Now"
    Client->>CreateOrder: POST { projectId, githubUsername }
    CreateOrder->>GitHub: Validate GitHub user exists (GET /users/:user)
    CreateOrder->>DB: Check soft hold (expires_at > now())
    CreateOrder->>Razorpay: orders.create({ amount: price_paise, currency: "INR" })
    CreateOrder->>DB: Insert pending transaction (10-min expires_at)
    CreateOrder-->>Client: { orderId, amount, currency }

    Client->>Razorpay: Open Standard Checkout (Test Card / Test UPI)
    Operative->>Razorpay: Submit Payment
    Razorpay-->>Client: { razorpay_payment_id, razorpay_order_id, razorpay_signature }

    par Direct Verification
        Client->>VerifyAPI: POST { razorpay_order_id, razorpay_payment_id, razorpay_signature }
        VerifyAPI->>VerifyAPI: crypto.timingSafeEqual(HMAC_SHA256)
        VerifyAPI->>Fulfill: fulfillPurchase(orderId)
    and Webhook Backup (Tab Closed Fallback)
        Razorpay->>WebhookAPI: POST payment.captured [X-Razorpay-Signature]
        WebhookAPI->>Fulfill: fulfillPurchase(orderId)
    end

    critical Idempotent Fulfillment
        Fulfill->>DB: Load transaction by razorpay_order_id
        alt Already completed
            Fulfill-->>Client: Return cached completion state
        else Needs fulfillment
            Fulfill->>Razorpay: Assert status == 'captured' & amount == price_paise
            Fulfill->>DB: Atomic update: status='completed', is_sold=true
            Fulfill->>GitHub: Invite buyer to repo (PUT /repos/:owner/:repo/collaborators/:user)
            Fulfill->>DB: Update invite_status ('sent' or 'failed')
            Fulfill->>DB: Insert notifications (Seller & Buyer)
        end
    end
```

---

## 5. Cron & Keep-Alive Automation
To ensure Supabase free-tier PostgreSQL databases remain active, Vercel Cron executes:
- **Frequency:** Daily at 03:00 UTC (`0 3 * * *` in `vercel.json`)
- **Route:** `/api/cron` (and alias `/api/cron/ping`)
- **Authorization:** `Authorization: Bearer <CRON_SECRET>`
- **Action:** Issues lightweight query `SELECT count(*) FROM projects` and prunes expired pending checkout holds older than 24 hours.
