# System Architecture & Technical Design Document
## The Graveyard — Where Dead Code Lives Again

> [!NOTE]
> This document mirrors [architecture.md](file:///d:/the-graveyard/architecture.md) for direct accessibility and reference under both standard and project-requested filenames.

---

### Document Information
- **System Name:** The Graveyard Architecture
- **Version:** 1.0.0
- **Status:** Production Standard
- **Runtime Environment:** Next.js (App Router / Node.js & Edge Serverless)
- **Primary Database & Auth:** Supabase (PostgreSQL with Row Level Security)
- **External Services:** Razorpay Payments API, GitHub REST API v3, Vercel Edge Cron
- **Last Updated:** October 2026

---

## 1. High-Level Architecture Overview

The Graveyard is structured as a full-stack, event-driven web application utilizing Next.js App Router for frontend UI and backend API routes, coupled with Supabase for relational data storage, authentication, real-time messaging, and secure object storage.

```mermaid
flowchart TB
    subgraph Client Tier ["Client Tier (Browser)"]
        UI["Cyberpunk UI (React 19 / Next.js)"]
        RazorpaySDK["Razorpay Checkout SDK"]
        SupaClient["Supabase Browser Client (Anon Key)"]
    end

    subgraph Edge Tier ["Vercel Edge & Serverless Runtime"]
        APIRoutes["Next.js Route Handlers (/api/*)"]
        EdgeCron["Edge Cron Worker (/api/cron)"]
        ZodValidator["Zod Schema Sanitizer"]
    end

    subgraph Cloud DB ["Supabase Cloud Platform"]
        SupaAuth["Supabase Auth (JWT)"]
        Postgres["PostgreSQL Database (RLS Enforced)"]
        SupaStorage["Private Storage Bucket (project-files)"]
    end

    subgraph External APIs ["Third-Party Integrations"]
        RazorpayAPI["Razorpay Payment Gateway"]
        GitHubAPI["GitHub Collaborator REST API"]
    end

    UI -->|"User Interacts"| SupaClient
    UI -->|"Dispatches Actions"| APIRoutes
    UI -->|"Opens Payment Modal"| RazorpaySDK

    RazorpaySDK -->|"Executes Payment"| RazorpayAPI
    EdgeCron -->|"Keeps DB Active"| Postgres

    APIRoutes -->|"Validate Request"| ZodValidator
    APIRoutes -->|"Admin Operations (Service Role)"| Postgres
    APIRoutes -->|"Generate Signed Download URLs"| SupaStorage
    APIRoutes -->|"Verify Order & Signature"| RazorpayAPI
    APIRoutes -->|"Add Collaborator (PUT /collaborators)"| GitHubAPI

    SupaClient -->|"Query Public Data & Messages"| Postgres
    SupaClient -->|"User Login / Session"| SupaAuth
```

---

## 2. Data Architecture & Database Schema

The database relies on PostgreSQL managed via Supabase, with **Row Level Security (RLS)** active across every table to prevent unauthorized data manipulation or reads.

### 2.1 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    PROFILES ||--o{ PROJECTS : "owns/sells"
    PROFILES ||--o{ TRANSACTIONS : "purchases (buyer)"
    PROJECTS ||--o{ TRANSACTIONS : "settled through"
    PROFILES ||--o{ MESSAGES : "sends (sender)"
    PROFILES ||--o{ MESSAGES : "receives (receiver)"

    PROFILES {
        uuid id PK "Matches auth.users(id)"
        text username
        text github_url
        int reputation_score
        text contact_info
        text phone_number
        text upi_id
        timestamp created_at
    }

    PROJECTS {
        uuid id PK
        uuid seller_id FK "References profiles(id)"
        text title
        text description
        text_array tech_stack
        text interaction_type "'buy' | 'adopt' | 'collab'"
        numeric price "INR currency (0 for adopt)"
        text repo_link
        text github_repo_id
        text github_repo_full_name "e.g. owner/repo"
        boolean is_private_repo
        text file_url "Storage object key in project-files"
        boolean is_sold
        boolean is_archived
        boolean is_collab_filled
        int views
        timestamp created_at
    }

    TRANSACTIONS {
        uuid id PK
        uuid project_id FK "References projects(id)"
        uuid buyer_id FK "References profiles(id)"
        numeric amount
        text status "'pending' | 'completed' | 'failed'"
        text payment_id "Razorpay Payment ID / FREE_CLAIM_*"
        text github_username "Provided during checkout"
        jsonb metadata "Raw payment / order metadata"
        timestamp created_at
    }

    MESSAGES {
        uuid id PK
        uuid sender_id FK "References profiles(id)"
        uuid receiver_id FK "References profiles(id)"
        text content
        boolean is_read
        boolean deleted_by_sender
        boolean deleted_by_receiver
        timestamp created_at
    }
```

---

### 2.2 Integrity Constraints & Indexes

1. **Unique Completed Purchase Constraint:**
   ```sql
   CREATE UNIQUE INDEX unique_completed_project_purchase 
   ON public.transactions (project_id) 
   WHERE (status = 'completed');
   ```
   *Guarantees a listed project cannot be double-sold or settled concurrently.*

2. **Unique Payment ID Index:**
   ```sql
   CREATE UNIQUE INDEX unique_payment_id_idx 
   ON public.transactions (payment_id) 
   WHERE (payment_id IS NOT NULL);
   ```
   *Prevents replay attacks using an existing Razorpay transaction identifier.*

---

## 3. Row Level Security (RLS) Policy Matrix

| Table | Policy Name | Command | Access Criteria / Rule |
|:---|:---|:---|:---|
| **profiles** | "Public profiles are viewable by everyone" | `SELECT` | `true` |
| **profiles** | "Users can insert their own profile" | `INSERT` | `auth.uid() = id` |
| **profiles** | "Users can update own profile" | `UPDATE` | `auth.uid() = id` |
| **projects** | "Projects are viewable by everyone" | `SELECT` | `true` |
| **projects** | "Users can insert their own projects" | `INSERT` | `auth.uid() = seller_id` |
| **projects** | "Sellers can update own projects" | `UPDATE` | `auth.uid() = seller_id` |
| **projects** | "Sellers can delete own projects" | `DELETE` | `auth.uid() = seller_id` |
| **transactions**| "Users can view transactions they are involved in" | `SELECT` | `auth.uid() = buyer_id OR projects.seller_id = auth.uid()` |
| **transactions**| "Users can insert pending transactions" | `INSERT` | `auth.uid() = buyer_id AND status = 'pending'` |
| **transactions**| "Sellers can update transactions for their projects" | `UPDATE` | `projects.seller_id = auth.uid()` |
| **messages** | "Users can read their own non-deleted messages" | `SELECT` | `(sender_id = auth.uid() AND !deleted_by_sender) OR (receiver_id = auth.uid() AND !deleted_by_receiver)` |
| **messages** | "Users can send messages" | `INSERT` | `auth.uid() = sender_id` |
| **messages** | "Senders can mark messages as deleted" | `UPDATE` | `auth.uid() = sender_id` |
| **messages** | "Receivers can update read and deleted status" | `UPDATE` | `auth.uid() = receiver_id` |
| **storage.objects**| "Authenticated users can upload project files" | `INSERT` | `bucket_id = 'project-files'` |
| **storage.objects**| "Users can manage own uploaded files" | `SELECT / UPDATE / DELETE` | `bucket_id = 'project-files' AND auth.uid() = owner` |

---

## 4. Core Backend Subsystems & Workflows

### 4.1 Payment Verification & Fulfillment Sequence (`/api/verify-payment`)

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Buyer Browser
    participant API as /api/verify-payment (Next.js)
    participant Razorpay as Razorpay API
    participant DB as Supabase DB (Service Role)
    participant GH as GitHub REST API

    Buyer->>API: POST { order_id, payment_id, signature, projectId, githubUsername }
    Note over API: 1. Validate payload with Zod Schema
    API->>API: 2. Verify HMAC SHA256 Signature
    alt Signature Invalid
        API-->>Buyer: 400 Bad Request (Invalid signature)
    end

    API->>DB: 3. Check for existing completed transaction (Idempotency)
    alt Already Processed
        API-->>Buyer: 200 OK (Already processed, resume fulfillment)
    end

    API->>Razorpay: 4. Fetch Order details from Razorpay
    Razorpay-->>API: Returns order entity (amount, status, notes)
    API->>DB: 5. Fetch project price & seller info
    DB-->>API: Returns project record
    Note over API: 6. Assert razorpayOrder.amount == project.price * 100

    API->>DB: 7. Insert completed transaction into transactions table
    API->>DB: 8. Call RPC mark_project_sold(p_id) (or set is_sold=true)

    opt Private GitHub Repo Linked
        API->>GH: 9. PUT /repos/{owner}/{repo}/collaborators/{githubUsername}
        GH-->>API: 201 Created / 204 No Content
    end

    API-->>Buyer: 200 OK { success: true, message: "Purchase verified & project delivered" }
```

---

### 4.2 Secure Download Gateway (`/api/secure-download`)

To safeguard digital assets, direct public access to Supabase storage is disabled. Download links are dynamically minted through this gateway:

```mermaid
sequenceDiagram
    autonumber
    actor User as Authenticated Client
    participant DL as /api/secure-download
    participant DB as Supabase DB (Service Role)
    participant Storage as Supabase Storage

    User->>DL: GET /api/secure-download?projectId={uuid} (Authorization: Bearer <token>)
    DL->>DL: Extract & verify JWT token via Supabase Auth
    alt Token Missing or Invalid
        DL-->>User: 401 Unauthorized
    end

    DL->>DB: Fetch project & check if caller is seller
    alt User is Project Seller
        Note over DL: Authorized as Owner
    else User is not Seller
        DL->>DB: Query completed transaction where project_id = id AND buyer_id = user.id
        alt No Completed Transaction Found
            DL-->>User: 403 Forbidden (Purchase required to download)
        end
    end

    DL->>Storage: createSignedUrl('project-files', filePath, expiresIn: 60)
    Storage-->>DL: Returns temporary download URL (60s expiry)
    DL-->>User: 200 OK { downloadUrl: "https://..." }
```

---

### 4.3 Database Keep-Alive Daemon (`/api/cron`)

Free-tier managed databases automatically pause after a period of dormancy. The Graveyard incorporates an automated Edge Cron ping:

```mermaid
flowchart LR
    Cron[Vercel Edge Cron Trigger] -->|"Every 10 mins (GET)"| Endpoint["/api/cron"]
    Endpoint -->|"CRON_SECRET Authentication"| Guard{Authorized?}
    Guard -->|No| Fail["401 Unauthorized"]
    Guard -->|Yes| Query["SELECT 1 FROM projects LIMIT 1"]
    Query --> Postgres[(Supabase PostgreSQL)]
    Postgres -->|"Activity Registered"| OK["200 OK (Keep-alive pulse acknowledged)"]
```

---

## 5. Security & Isolation Architecture

1. **Dual-Key Isolation Model:**
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Exposed to frontend. Governed strictly by PostgreSQL Row Level Security.
   - `SUPABASE_SERVICE_ROLE_KEY`: Guarded strictly on the server side. Used only inside API route handlers to perform administrative tasks (such as atomic transaction insertion, order settlements, and signed URL generation).
2. **Payment Tampering Defenses:**
   - Client-reported prices are never trusted. The server retrieves the registered project price directly from PostgreSQL and verifies that the Razorpay order price in paise matches `project.price * 100`.
   - Razorpay signatures are verified using `crypto.createHmac('sha256', secret)` before any database mutation occurs.
3. **Storage Access Lockdown:**
   - Bucket `project-files` has `public = false`.
   - Direct anonymous access to storage objects returns HTTP 403.
   - All downloads require verified buyer authentication and yield signed URLs with a maximum TTL of 60 seconds.

---

## 6. Deployment & Infrastructure Matrix

| Layer | Provider | Configuration / Specs |
|:---|:---|:---|
| **Frontend & API Routes** | Vercel | Next.js App Router, Node.js runtime, Edge middleware |
| **Relational Database** | Supabase Cloud | PostgreSQL 15, PgBouncer Connection Pooling (Port 6543) |
| **Storage & Assets** | Supabase Storage | S3-compatible private object store (`project-files` bucket) |
| **Payment Gateway** | Razorpay | Standard Checkout SDK, Webhook verification |
| **Repository Automation** | GitHub API | Personal Access Token (PAT) with repo scope permissions |
| **Scheduled Tasks** | Vercel Cron | Configured in `vercel.json` targeting `/api/cron` |

---

## 7. Configuration & Environment Variables

| Variable | Scope | Description |
|:---|:---|:---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Client | Supabase anonymous public API key |
| `SUPABASE_SERVICE_ROLE_KEY` | Private / Server | Supabase administrative key (Bypasses RLS) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public / Client | Razorpay public Key ID for checkout popup |
| `RAZORPAY_KEY_SECRET` | Private / Server | Razorpay Secret for HMAC verification |
| `GITHUB_ACCESS_TOKEN` | Private / Server | Scoped GitHub Personal Access Token for invitations |
| `CRON_SECRET` | Private / Server | Shared secret token validating Vercel cron triggers |
