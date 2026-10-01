import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';
import { generateScreenshotBuffer } from './lib/mock-screens';

// Helper to load .env.local if present
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  console.error('Please configure your .env.local before running the seed script.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Check for --reset-demo flag
const isResetDemo = process.argv.includes('--reset-demo');

// 10 Fictional Users
const USERS = [
  {
    email: 'demo_seller@graveyard.dev',
    username: 'demo_seller',
    bio: 'Serial builder with 4 dead micro-SaaS startups. Salvaging battle-tested Next.js and Supabase codebases.',
    github_url: 'https://github.com/demo_seller',
    reputation_score: 180,
    created_at: '2025-06-10T10:00:00Z',
  },
  {
    email: 'demo_buyer@graveyard.dev',
    username: 'demo_buyer',
    bio: 'Indie acquisition scavenger looking for abandoned MVPs to resurrect, refactor, and scale.',
    github_url: 'https://github.com/demo_buyer',
    reputation_score: 140,
    created_at: '2025-06-15T12:00:00Z',
  },
  {
    email: 'arjun@graveyard.dev',
    username: 'arjun.dev',
    bio: 'Full-stack engineer crafting local-first tools and micro-SaaS in Next.js and Go.',
    github_url: 'https://github.com/arjun-dev',
    reputation_score: 125,
    created_at: '2025-07-01T09:30:00Z',
  },
  {
    email: 'priya@graveyard.dev',
    username: 'priya_builds',
    bio: 'Frontend architect and telemetry obsessive. Passionate about real-time web applications.',
    github_url: 'https://github.com/priya-builds',
    reputation_score: 160,
    created_at: '2025-07-18T14:15:00Z',
  },
  {
    email: 'meera@graveyard.dev',
    username: 'meera_codes',
    bio: 'Developer productivity enthusiast. I ship developer tools and write automated release bots.',
    github_url: 'https://github.com/meera-codes',
    reputation_score: 110,
    created_at: '2025-08-05T11:00:00Z',
  },
  {
    email: 'kabir@graveyard.dev',
    username: 'kabir_ships',
    bio: 'Backend distributed systems engineer. Go, Kafka, Docker, and Kubernetes.',
    github_url: 'https://github.com/kabir-ships',
    reputation_score: 155,
    created_at: '2025-08-22T16:45:00Z',
  },
  {
    email: 'nisha@graveyard.dev',
    username: 'nisha.rs',
    bio: 'Rust and systems performance researcher. Rewriting everything in memory-safe systems until burnout.',
    github_url: 'https://github.com/nisha-rs',
    reputation_score: 190,
    created_at: '2025-09-10T08:20:00Z',
  },
  {
    email: 'rohan@graveyard.dev',
    username: 'rohan_golang',
    bio: 'Cloud infra specialist. Building self-hosted identity engines and high-concurrency microservices.',
    github_url: 'https://github.com/rohan-golang',
    reputation_score: 145,
    created_at: '2025-10-02T13:30:00Z',
  },
  {
    email: 'ananya@graveyard.dev',
    username: 'ananya.ui',
    bio: 'Creative technologist & product designer who codes. Obsessed with elegant UX and typography.',
    github_url: 'https://github.com/ananya-ui',
    reputation_score: 135,
    created_at: '2025-10-25T15:00:00Z',
  },
  {
    email: 'vikram@graveyard.dev',
    username: 'vikram_indie',
    bio: 'Pragmatic builder salvaging abandoned side projects into community-owned tools.',
    github_url: 'https://github.com/vikram-indie',
    reputation_score: 115,
    created_at: '2025-11-12T17:10:00Z',
  },
];

interface DemoProjectDef {
  seed_key: string;
  seller_username: string;
  title: string;
  tagline: string;
  description: string;
  interaction_type: 'buy' | 'adopt' | 'collab';
  price_paise: number;
  tech_stack: string[];
  cause_of_death: string;
  abandoned_on: string;
  last_commit_at: string;
  completion_percent: number;
  lines_of_code: number;
  license: string;
  epitaph?: string;
  features: string[];
  todo_items: string[];
  setup_notes: string;
  file_tree: string[];
  collab_roles?: Array<{ role: string; commitment: string; description: string }>;
  collab_terms?: string;
  is_featured?: boolean;
  featured_rank?: number;
  is_flagship?: boolean;
  is_sold?: boolean;
  is_collab_filled?: boolean;
  revived_at?: string;
  views: number;
  created_at: string;
}

// 24 DEMO PROJECTS (8 Flagships + 10 Live + 6 Revived)
const DEMO_PROJECTS: DemoProjectDef[] = [
  // ==========================================
  // FLAGSHIP 1: InvoiceForge
  // ==========================================
  {
    seed_key: 'invoiceforge',
    seller_username: 'demo_seller',
    title: 'InvoiceForge',
    tagline: 'Multi-tenant invoicing SaaS with GST-ready PDFs.',
    description: `### What it is
InvoiceForge is a production-grade multi-tenant invoicing and client billing engine built with Next.js, Supabase, and Tailwind CSS. It is specifically tailored for Indian and international freelancers and agencies who need GST-compliant invoices with automatic CGST, SGST, and IGST breakdowns.

### Why it died
Built to scratch my own freelancing itch while running an agency. After transitioning into a full-time role, maintaining the integration pipelines and handling custom tax regimes became impossible to sustain alongside family commitments.

### What you get
Complete ownership of the verified codebase, including the serverless PDF generation pipeline, full database migration scripts with strict Row Level Security (RLS), custom payment link integrations, and client management portals.`,
    interaction_type: 'buy',
    price_paise: 499900,
    tech_stack: ['nextjs', 'typescript', 'supabase', 'tailwind'],
    cause_of_death: 'lost_interest',
    abandoned_on: '2025-03-12',
    last_commit_at: '2025-03-15T18:30:00Z',
    completion_percent: 85,
    lines_of_code: 14200,
    license: 'Proprietary (exclusive transfer)',
    epitaph: 'Sent 40 invoices. Got paid for none of them, including my own.',
    features: [
      'Multi-tenant workspaces with isolated PostgreSQL RLS policies',
      'GST-ready invoice PDFs with automatic CGST/SGST/IGST tax calculation',
      'Recurring scheduled invoice generation via edge cron handlers',
      'Client portal with passwordless magic-link authentication',
      'Instant payment link generator embedded in outbound PDFs',
      'Bulk client and invoice CSV export and telemetry tracking',
    ],
    todo_items: [
      'Credit notes and refund voucher workflows',
      'Multi-currency auto-conversion using live exchange rates',
      'Mobile-responsive layout polish for the visual invoice builder',
    ],
    setup_notes: `## Setup Guide (Estimated: ~20 minutes)
1. Ensure Node.js 20+ and pnpm are installed locally.
2. Clone or unpack the source repository.
3. Configure your environment variables in \`.env.local\`:
   \`\`\`bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   PAYMENT_KEY_ID=your-key-id
   PAYMENT_KEY_SECRET=your-key-secret
   \`\`\`
4. Run \`pnpm install\` and push migrations via \`pnpm supabase db push\`.
5. Start development server: \`pnpm dev\`.`,
    file_tree: [
      'app/(dashboard)/invoices/page.tsx',
      'app/(dashboard)/clients/page.tsx',
      'app/api/invoices/[id]/pdf/route.ts',
      'components/invoice/InvoiceEditor.tsx',
      'components/invoice/TaxBreakdown.tsx',
      'lib/gst.ts',
      'lib/pdf/template.tsx',
      'lib/supabase.ts',
      'supabase/migrations/0001_init.sql',
      'supabase/migrations/0002_rls.sql',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    is_featured: true,
    featured_rank: 1,
    is_flagship: true,
    views: 890,
    created_at: '2025-08-10T10:00:00Z',
  },

  // ==========================================
  // FLAGSHIP 2: TinyAuth
  // ==========================================
  {
    seed_key: 'tinyauth',
    seller_username: 'rohan_golang',
    title: 'TinyAuth',
    tagline: 'A tiny self-hosted auth service. Sessions, OAuth and API keys in one binary.',
    description: `### What it is
TinyAuth is a zero-dependency, ultra-lightweight authentication microservice compiled into a single binary. It provides modern Argon2id password hashing, GitHub and Google OAuth2 workflows, cryptographically opaque session token rotation, and scoped developer API keys.

### Why it died
I set out to build a lightweight alternative to bloated enterprise auth servers. The feature wishlist kept ballooning from WebAuthn to SAML 2.0 to tenant hierarchies, until the architectural complexity overwhelmed a hobby weekend project.

### What you get
A clean, battle-tested Rust codebase with multi-backend SQL support (SQLite and Postgres), complete automated test suites, and production Docker container configurations under 25 megabytes.`,
    interaction_type: 'adopt',
    price_paise: 0,
    tech_stack: ['rust', 'docker'],
    cause_of_death: 'scope_creep',
    abandoned_on: '2024-11-20',
    last_commit_at: '2024-11-25T14:10:00Z',
    completion_percent: 70,
    lines_of_code: 9800,
    license: 'MIT',
    epitaph: "Reinvented auth so you don't have to. Then remembered why nobody does.",
    features: [
      'Email and password authentication with tuned Argon2id hashing',
      'GitHub and Google OAuth2 social login redirects',
      'Cryptographically secure opaque session tokens with sliding rotation',
      'Granular API keys with scoped permission bitmaps',
      'Dual-driver persistence supporting embedded SQLite and PostgreSQL',
      'Minimalist multi-arch Docker image under 25 MB',
    ],
    todo_items: [
      'WebAuthn and hardware passkey registration pipeline',
      'Lightweight administrative dashboard for session revocation',
      'Production rate-limit tuning benchmarks and deployment documentation',
    ],
    setup_notes: `## Running TinyAuth
1. Install Rust (stable toolchain) via rustup: \`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh\`
2. Configure settings in \`config.toml\`:
   \`\`\`toml
   database_url = "sqlite://tinyauth.db"
   listen_addr = "127.0.0.1:8080"
   session_secret = "your-high-entropy-secret"
   \`\`\`
3. Run migrations and execute: \`cargo run --release\`.
4. Alternatively run via Docker: \`docker build -t tinyauth . && docker run -p 8080:8080 tinyauth\`.`,
    file_tree: [
      'src/main.rs',
      'src/routes/auth.rs',
      'src/routes/oauth.rs',
      'src/session.rs',
      'src/keys.rs',
      'src/db/sqlite.rs',
      'src/db/postgres.rs',
      'migrations/001_users.sql',
      'Dockerfile',
      'Cargo.toml',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    is_featured: true,
    featured_rank: 2,
    is_flagship: true,
    views: 740,
    created_at: '2025-08-15T11:00:00Z',
  },

  // ==========================================
  // FLAGSHIP 3: Lanternly
  // ==========================================
  {
    seed_key: 'lanternly',
    seller_username: 'demo_seller',
    title: 'Lanternly',
    tagline: 'AI meeting notes that turn calls into tasks. Needs a mobile dev and a designer.',
    description: `### What it is
Lanternly is an intelligent audio transcription and task extraction workspace. It ingests recorded calls or live browser audio streams, runs multi-speaker diarization, and automatically synthesizes structured action items with assignees and context snippets.

### Why it died
The web platform and AI summarization pipeline are completely functional and tested with live user calls. However, as an engineering founder working 60-hour weeks, I could not design and build the companion mobile audio recorder necessary for in-person meetings.

### What you get
The entire web client, audio processing workers, speaker diarization pipelines, Slack/Google Calendar integration endpoints, and a collaborative team workspace architecture ready for expansion.`,
    interaction_type: 'collab',
    price_paise: 0,
    tech_stack: ['react', 'typescript', 'nodejs'],
    cause_of_death: 'no_time',
    abandoned_on: '2026-01-14',
    last_commit_at: '2026-01-18T20:45:00Z',
    completion_percent: 60,
    lines_of_code: 6400,
    license: 'Proprietary',
    epitaph: 'The web app works. The phone app is a sketch on a napkin.',
    features: [
      'Audio transcription worker pipeline with speaker diarization tags',
      'Automatic action-item and deadline extraction engine',
      'Direct Slack notification and Google Calendar event sync hooks',
      'Collaborative team workspaces with searchable meeting transcript archive',
      'Interactive timestamp-linked audio player with waveform visualizer',
    ],
    todo_items: [
      'Native iOS and Android recording companion (React Native / Expo)',
      'Self-service user onboarding and interactive tutorial wizard',
      'Subscription billing tier enforcement via Stripe or Razorpay',
    ],
    setup_notes: `## Running Lanternly Locally
1. Node.js 20+ required.
2. Provide your API keys in \`.env\`:
   \`\`\`bash
   OPENAI_API_KEY=sk-...
   SLACK_CLIENT_ID=...
   SLACK_CLIENT_SECRET=...
   DATABASE_URL=postgres://...
   \`\`\`
3. Run \`npm install\` and start the web client with \`npm run dev\`.`,
    file_tree: [
      'src/app/meetings/page.tsx',
      'src/components/AudioWaveform.tsx',
      'src/components/ActionItemsList.tsx',
      'src/services/transcribe.ts',
      'src/services/diarize.ts',
      'src/integrations/slack.ts',
      'src/integrations/calendar.ts',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    collab_roles: [
      {
        role: 'Mobile developer (React Native / Expo)',
        commitment: '8–10 hrs/week',
        description: 'Build and package the offline recording and background synchronization experience on iOS and Android.',
      },
      {
        role: 'Product designer',
        commitment: '5–6 hrs/week',
        description: 'Own the design system, mobile wireframes, onboarding experience, and marketing illustrations.',
      },
    ],
    collab_terms: 'Equity split (10–15% each)',
    is_featured: true,
    featured_rank: 3,
    is_flagship: true,
    views: 680,
    created_at: '2025-09-01T09:00:00Z',
  },

  // ==========================================
  // FLAGSHIP 4: PulseBoard
  // ==========================================
  {
    seed_key: 'pulseboard',
    seller_username: 'priya_builds',
    title: 'PulseBoard',
    tagline: 'Real-time product analytics dashboard with live event streams.',
    description: `### What it is
PulseBoard is a high-frequency real-time event analytics dashboard designed to monitor SaaS funnels and customer journeys as they occur, using native WebSockets and lightweight time-series aggregates.

### Why it died
Originally built to monitor an e-commerce platform. When the primary company pivoted into B2B logistics, the telemetry requirements changed drastically and PulseBoard was shelved.

### What you get
The complete frontend dashboard built in React and Tailwind, the WebSocket ingest daemon, pre-built funnel calculators, and Docker Compose configurations for instant deployment.`,
    interaction_type: 'buy',
    price_paise: 249900,
    tech_stack: ['react', 'typescript', 'nodejs', 'docker'],
    cause_of_death: 'pivoted',
    abandoned_on: '2024-08-25',
    last_commit_at: '2024-08-28T16:00:00Z',
    completion_percent: 80,
    lines_of_code: 11300,
    license: 'MIT',
    epitaph: 'Streamed millions of events right into a void.',
    features: [
      'WebSocket event ingestion engine capable of 5,000 events/sec',
      'Interactive conversion funnel visualizer and customer retention cohorts',
      'Customizable dashboard tiles with drag-and-drop grid arrangements',
      'Organization team invites with role-based dashboard permissions',
      'Complete Docker Compose orchestration configuration',
    ],
    todo_items: [
      'Threshold-based webhook and email alerting rules',
      'Ad-hoc SQL query explorer interface for data scientists',
    ],
    setup_notes: `## Setup Instructions
1. Run \`docker-compose up -d\` to initialize Postgres and Redis.
2. In the \`server/\` folder run \`npm install && npm start\`.
3. In the \`client/\` folder run \`npm install && npm run dev\`.`,
    file_tree: [
      'client/src/components/FunnelChart.tsx',
      'client/src/components/LiveStream.tsx',
      'server/src/ingest.ts',
      'server/src/aggregates.ts',
      'docker-compose.yml',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    is_featured: false,
    is_flagship: true,
    views: 520,
    created_at: '2025-09-12T14:00:00Z',
  },

  // ==========================================
  // FLAGSHIP 5: QuietQueue
  // ==========================================
  {
    seed_key: 'quietqueue',
    seller_username: 'kabir_ships',
    title: 'QuietQueue',
    tagline: 'Self-hosted background job queue with retries, cron and a web UI.',
    description: `### What it is
QuietQueue is a reliable, zero-dependency background task execution engine written in Go. Backed by PostgreSQL with transactional \`SKIP LOCKED\` row semantics, it features exponential backoff retries, cron job schedules, a dead-letter quarantine queue, and an embedded web dashboard.

### Why it died
Originally developed for an enterprise microservice mesh. After the team migrated cloud workloads into AWS SQS and Temporal, the internal Go engine was retired from production usage.

### What you get
The entire Go source code, Prometheus metrics exporter, migration schemas, embedded frontend dashboard assets, and complete Kubernetes Helm charts.`,
    interaction_type: 'buy',
    price_paise: 799900,
    tech_stack: ['go', 'docker', 'aws'],
    cause_of_death: 'tech_outdated',
    abandoned_on: '2023-09-10',
    last_commit_at: '2023-09-15T10:30:00Z',
    completion_percent: 90,
    lines_of_code: 18600,
    license: 'Proprietary',
    epitaph: 'Handled 100M retries. Never failed until we turned it off.',
    features: [
      'ACID-compliant job scheduling using PostgreSQL FOR UPDATE SKIP LOCKED',
      'Exponential backoff retries with jitter and dead-letter quarantine',
      'Distributed cron schedule coordinator with sub-second resolution',
      'Embedded responsive web UI with real-time job inspector and retry controls',
      'Prometheus telemetry exporter with built-in latency histograms',
      'Production-ready Kubernetes Helm chart and Docker containers',
    ],
    todo_items: [
      'Multi-region active-active database replication failover test suite',
      'Migration playbook for systems upgrading from Celery or BullMQ',
    ],
    setup_notes: `## Building QuietQueue
1. Go 1.22+ required.
2. Initialize database: \`psql -f migrations/init.sql\`.
3. Build and execute binary: \`go build -o quietqueue ./cmd/server && ./quietqueue --config config.yaml\`.`,
    file_tree: [
      'cmd/server/main.go',
      'pkg/queue/worker.go',
      'pkg/queue/scheduler.go',
      'pkg/metrics/prometheus.go',
      'ui/dashboard.html',
      'migrations/init.sql',
      'helm/Chart.yaml',
      'Dockerfile',
      'go.mod',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    is_featured: false,
    is_flagship: true,
    views: 610,
    created_at: '2025-09-20T10:00:00Z',
  },

  // ==========================================
  // FLAGSHIP 6: ShipLog
  // ==========================================
  {
    seed_key: 'shiplog',
    seller_username: 'meera_codes',
    title: 'ShipLog',
    tagline: 'Turn merged pull requests into clean changelogs and release notes.',
    description: `### What it is
ShipLog is an automated release documentation platform that ingests GitHub webhook pull requests and formats them into categorized, audience-friendly public release notes and RSS feeds.

### Why it died
Built during a 30-day coding marathon. Once shipped and adopted by 12 open source repositories, maintaining GitHub App webhook limits and rate limitations on personal API keys became a chore.

### What you get
The complete Next.js 14 application with Prisma ORM schemas, GitHub webhook verifiers, Markdown publishing engines, and custom domain routing support.`,
    interaction_type: 'adopt',
    price_paise: 0,
    tech_stack: ['nextjs', 'typescript', 'prisma'],
    cause_of_death: 'lost_interest',
    abandoned_on: '2025-06-20',
    last_commit_at: '2025-06-24T12:00:00Z',
    completion_percent: 75,
    lines_of_code: 7900,
    license: 'MIT',
    epitaph: 'Changelogged everything we built. Forgot to build what users wanted.',
    features: [
      'GitHub webhook listener with HMAC SHA-256 signature verification',
      'Automated PR categorization (Features, Fixes, Breaking Changes, Telemetry)',
      'Public customer-facing changelog page with clean typography',
      'Built-in RSS/Atom feed generation and Markdown copy triggers',
    ],
    todo_items: [
      'Email subscriber notifications with Resend integration',
      'Automated custom domain DNS verification with CNAME records',
    ],
    setup_notes: `## Setup ShipLog
1. Run \`pnpm install\`.
2. Push database schema: \`npx prisma db push\`.
3. Set \`GITHUB_WEBHOOK_SECRET\` and \`DATABASE_URL\` in \`.env\`.
4. Run \`pnpm dev\`.`,
    file_tree: [
      'src/app/[slug]/page.tsx',
      'src/app/api/webhooks/github/route.ts',
      'src/lib/parser.ts',
      'prisma/schema.prisma',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    is_featured: false,
    is_flagship: true,
    views: 480,
    created_at: '2025-10-01T08:00:00Z',
  },

  // ==========================================
  // FLAGSHIP 7: Stackwise
  // ==========================================
  {
    seed_key: 'stackwise',
    seller_username: 'nisha.rs',
    title: 'Stackwise',
    tagline: 'A CLI that audits your dependencies and explains what to upgrade first.',
    description: `### What it is
Stackwise is an intelligent command-line utility for software engineers that audits lockfiles (\`package-lock.json\`, \`poetry.lock\`, \`Cargo.lock\`), cross-references vulnerability databases, and calculates a dependency upgrade priority matrix.

### Why it died
Created while conducting security research. When academic responsibilities intensified, tracking breaking changes across three different package manager ecosystems became unsustainable.

### What you get
The entire Python core engine, lockfile AST parsers, vulnerability caching layer, and terminal reporting suite.`,
    interaction_type: 'adopt',
    price_paise: 0,
    tech_stack: ['python', 'docker'],
    cause_of_death: 'no_time',
    abandoned_on: '2025-10-15',
    last_commit_at: '2025-10-18T19:00:00Z',
    completion_percent: 65,
    lines_of_code: 4200,
    license: 'Apache-2.0',
    features: [
      'Deterministic AST lockfile parsers for npm, pip, and cargo',
      'Local offline caching of OSV and GitHub Security Advisory databases',
      'Upgrade risk assessment algorithm measuring SemVer distance and dependents',
      'Terminal rich-text formatting and CI/CD-friendly Markdown export',
    ],
    todo_items: [
      'Monorepo workspace support (pnpm-workspace, Cargo workspaces)',
      'Official GitHub Action wrapper for automated PR commenting',
    ],
    setup_notes: `## Running Stackwise
1. Python 3.10+ required.
2. Install dependencies: \`pip install -r requirements.txt\`.
3. Run scan: \`python -m stackwise audit .\`.`,
    file_tree: [
      'stackwise/cli.py',
      'stackwise/parsers/npm.py',
      'stackwise/parsers/cargo.py',
      'stackwise/advisory/osv.py',
      'requirements.txt',
      'Dockerfile',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    is_featured: false,
    is_flagship: true,
    views: 410,
    created_at: '2025-10-15T11:30:00Z',
  },

  // ==========================================
  // FLAGSHIP 8: OpenShelf
  // ==========================================
  {
    seed_key: 'openshelf',
    seller_username: 'ananya.ui',
    title: 'OpenShelf',
    tagline: 'A community book-lending platform that needs a backend engineer and a community lead.',
    description: `### What it is
OpenShelf is a peer-to-peer neighborhood book sharing network designed to let book lovers discover, borrow, and return physical books within their local apartment complexes or neighborhoods.

### Why it died
The design system, frontend UI, and ISBN scanner components are fully built and visually striking. My technical co-founder left for an engineering position in California before we finished building the background notification worker and trust verification system.

### What you get
The entire frontend Next.js codebase, custom UI components, Google Books API integration pipelines, and geographic clustering mockups.`,
    interaction_type: 'collab',
    price_paise: 0,
    tech_stack: ['nextjs', 'supabase', 'typescript'],
    cause_of_death: 'cofounder_left',
    abandoned_on: '2025-12-05',
    last_commit_at: '2025-12-10T15:20:00Z',
    completion_percent: 55,
    lines_of_code: 5100,
    license: 'MIT',
    epitaph: 'Cofounder went to work at Google. The books stayed on the shelf.',
    features: [
      'Comprehensive book catalog with instant ISBN barcode scanner lookup',
      'Peer-to-peer lending request, approval, and reminder workflows',
      'Neighborhood radius clustering and private apartment group codes',
      'Polished and accessible responsive design system in Tailwind CSS',
    ],
    todo_items: [
      'Community trust and borrower reputation verification algorithms',
      'Scalable full-text search across titles and synopsis metadata',
      'Community moderator tools for duplicate entry resolution',
    ],
    setup_notes: `## Setup OpenShelf
1. \`npm install\`.
2. Connect Supabase database and execute \`schema.sql\`.
3. Run \`npm run dev\`.`,
    file_tree: [
      'src/app/catalog/page.tsx',
      'src/components/BookCard.tsx',
      'src/components/BarcodeScanner.tsx',
      'src/services/googleBooks.ts',
      'supabase/schema.sql',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    collab_roles: [
      {
        role: 'Backend engineer (Postgres / APIs)',
        commitment: '6–8 hrs/week',
        description: 'Harden the lending workflow, build reminder schedulers, and optimize Postgres full-text search.',
      },
      {
        role: 'Community lead',
        commitment: '4–5 hrs/week',
        description: 'Lead grassroots onboarding in the first 10 pilot apartment communities and run user testing.',
      },
    ],
    collab_terms: 'Revenue share (to be agreed)',
    is_featured: false,
    is_flagship: true,
    views: 590,
    created_at: '2025-11-01T10:00:00Z',
  },

  // ==========================================
  // REMAINING LIVE - FOR SALE (4)
  // ==========================================
  {
    seed_key: 'gymflow',
    seller_username: 'arjun.dev',
    title: 'GymFlow',
    tagline: 'Class booking and member management for boutique fitness studios.',
    description: `### What it is
GymFlow is a lightweight scheduling and membership management engine built for independent fitness studios, crossfit boxes, and yoga instructors who want to escape 20% aggregator commissions.

### Why it died
Built for a cousin who ran a boutique yoga studio. She closed the physical studio after a commercial lease dispute, leaving the software without its flagship client.

### What you get
The complete Next.js and Supabase codebase with calendar slot reservation, recurring membership status tracking, and automated WhatsApp reminder webhooks.`,
    interaction_type: 'buy',
    price_paise: 129900,
    tech_stack: ['nextjs', 'supabase', 'tailwind'],
    cause_of_death: 'no_time',
    abandoned_on: '2025-05-18',
    last_commit_at: '2025-05-22T14:00:00Z',
    completion_percent: 80,
    lines_of_code: 8200,
    license: 'Proprietary',
    epitaph: 'Studio closed. The code never missed a workout.',
    features: [
      'Member portal with instant calendar slot reservation',
      'Class capacity caps and automatic waitlist queueing',
      'Automated WhatsApp booking confirmation webhook integrations',
      'Studio trainer schedule management and attendance rosters',
    ],
    todo_items: [
      'Native mobile push notifications for class cancellations',
      'Stripe / Razorpay subscription autopay recurrence',
    ],
    setup_notes: `## Running GymFlow
1. \`pnpm install\`.
2. Set Supabase credentials in \`.env.local\`.
3. Run \`pnpm dev\`.`,
    file_tree: [
      'src/app/classes/page.tsx',
      'src/components/CalendarGrid.tsx',
      'src/lib/whatsapp.ts',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
      'supabase/migrations/01_gym.sql',
    ],
    views: 310,
    created_at: '2025-11-15T09:00:00Z',
  },
  {
    seed_key: 'docuspark',
    seller_username: 'vikram_indie',
    title: 'DocuSpark',
    tagline: 'High-throughput HTML-to-PDF generation microservice API.',
    description: `### What it is
DocuSpark is an isolated microservice container that converts parameterized HTML and CSS templates into pixel-perfect PDF documents using headless Chromium with caching and asset preloading.

### Why it died
Originally developed for an enterprise contract that pivoted into standard spreadsheet exports. The PDF worker cluster was decoupled and archived.

### What you get
Clean Node.js server code, Docker orchestration files, pre-tested invoice and certificate templates, and API token authentication handlers.`,
    interaction_type: 'buy',
    price_paise: 89900,
    tech_stack: ['nodejs', 'docker'],
    cause_of_death: 'pivoted',
    abandoned_on: '2024-10-12',
    last_commit_at: '2024-10-15T11:00:00Z',
    completion_percent: 85,
    lines_of_code: 5400,
    license: 'MIT',
    epitaph: 'Rendered 50,000 PDFs. Client wanted an Excel sheet.',
    features: [
      'Headless Chromium pool with connection reuse and memory guards',
      'HTML template rendering with Handlebars variable substitution',
      'Encrypted PDF output with custom permissions and passwords',
      'API token authorization with rate limiting per tenant',
    ],
    todo_items: [
      'S3 direct upload streaming to bypass buffer allocations',
      'Pre-compiled WebAssembly PDF generation fallback engine',
    ],
    setup_notes: `## Docker Quickstart
1. \`docker build -t docuspark .\`
2. \`docker run -p 3000:3000 -e API_SECRET=secret docuspark\`.`,
    file_tree: [
      'src/server.ts',
      'src/renderer.ts',
      'src/templates/invoice.hbs',
      'Dockerfile',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    views: 290,
    created_at: '2025-11-20T10:00:00Z',
  },
  {
    seed_key: 'croncat',
    seller_username: 'rohan_golang',
    title: 'CronCat',
    tagline: 'Visual cron scheduler and webhook dispatcher with execution history.',
    description: `### What it is
CronCat is a sleek developer tool for setting up recurring HTTP webhook triggers using a visual cron builder, complete with live ping logs, response headers, and retry policies.

### Why it died
Built over a holiday weekend to debug webhook endpoints. I solved my immediate need, got distracted by another project, and never published the landing page.

### What you get
The complete React frontend with visual cron expression builder, the background dispatch worker, and Prisma database schema.`,
    interaction_type: 'buy',
    price_paise: 49900,
    tech_stack: ['react', 'typescript', 'tailwind'],
    cause_of_death: 'lost_interest',
    abandoned_on: '2025-04-05',
    last_commit_at: '2025-04-08T17:00:00Z',
    completion_percent: 75,
    lines_of_code: 4800,
    license: 'MIT',
    epitaph: 'Scheduled for success. Postponed indefinitely.',
    features: [
      'Interactive visual cron expression generator with human explanations',
      'HTTP webhook dispatcher with customizable headers and payload templates',
      'Full HTTP response status code, header, and latency telemetry log',
      'Automatic exponential retry rules for 5xx server responses',
    ],
    todo_items: [
      'Discord and Telegram notification integrations for failed dispatches',
      'OAuth2 token refresh headers for authenticated webhook endpoints',
    ],
    setup_notes: `## Setup CronCat
1. \`npm install\`.
2. \`npm run build && npm start\`.`,
    file_tree: [
      'src/components/CronBuilder.tsx',
      'src/components/ExecutionLog.tsx',
      'src/lib/dispatcher.ts',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    views: 240,
    created_at: '2025-12-01T12:00:00Z',
  },
  {
    seed_key: 'trailmap',
    seller_username: 'kabir_ships',
    title: 'TrailMap',
    tagline: 'Hiking route planner with elevation profiles and offline vector tiles.',
    description: `### What it is
TrailMap is an offline-first hiking and trail route planning web application that computes elevation profiles, surface grade difficulty, and offline vector tile caching.

### Why it died
We ran out of funding trying to license commercial topographic map tiles before we reached our first 5,000 paid subscribers.

### What you get
The full frontend web client, Mapbox GL integration layers, GPX route export utilities, and elevation profile calculation algorithms.`,
    interaction_type: 'buy',
    price_paise: 349900,
    tech_stack: ['react', 'firebase', 'typescript'],
    cause_of_death: 'ran_out_of_funding',
    abandoned_on: '2024-07-15',
    last_commit_at: '2024-07-20T19:00:00Z',
    completion_percent: 70,
    lines_of_code: 9100,
    license: 'Proprietary',
    epitaph: 'Walked every trail. Ran out of money at the summit.',
    features: [
      'Interactive vector map interface with GPS waypoint plotting',
      'Instant topographic elevation profile calculation using SRTM data',
      'GPX and KML route file import and export parser',
      'Offline browser caching of route geometry using IndexedDB',
    ],
    todo_items: [
      'OpenStreetMap vector tile self-hosting documentation',
      'Turn-by-turn navigation voice prompt synthesis',
    ],
    setup_notes: `## Running TrailMap
1. Set \`VITE_MAPBOX_TOKEN\` and Firebase keys in \`.env\`.
2. Run \`npm install && npm run dev\`.`,
    file_tree: [
      'src/components/MapCanvas.tsx',
      'src/components/ElevationProfile.tsx',
      'src/utils/gpxParser.ts',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    views: 380,
    created_at: '2025-12-10T14:30:00Z',
  },

  // ==========================================
  // REMAINING LIVE - FREE FORK (4)
  // ==========================================
  {
    seed_key: 'notenest',
    seller_username: 'ananya.ui',
    title: 'NoteNest',
    tagline: 'Local-first markdown notes with bidirectional linking and instant search.',
    description: `### What it is
NoteNest is an ultra-fast, local-first personal knowledge base built with SvelteKit. All notes are saved in browser storage or local disk with bidirectional wiki-links and instant fuzzy search.

### Why it died
Built to organize my own research notes. Once Obsidian released its canvas feature, I migrated my notes and stopped developing NoteNest.

### What you get
The complete SvelteKit application, local IndexedDB synchronization engine, Markdown AST parsing modules, and keyboard shortcut navigation system.`,
    interaction_type: 'adopt',
    price_paise: 0,
    tech_stack: ['svelte', 'typescript', 'tailwind'],
    cause_of_death: 'lost_interest',
    abandoned_on: '2025-02-14',
    last_commit_at: '2025-02-18T10:00:00Z',
    completion_percent: 80,
    lines_of_code: 5800,
    license: 'MIT',
    epitaph: 'Connected every idea. Never finished the app.',
    features: [
      'Bidirectional wiki-links with automatic backlink extraction',
      'Zero-latency fuzzy full-text search across all saved notes',
      'Local-first storage with automatic JSON/Markdown file export',
      'Vim and standard keyboard navigation shortcuts',
    ],
    todo_items: [
      'End-to-end encrypted cloud synchronization using WebCrypto',
      'Visual interactive 2D graph visualizer for linked notes',
    ],
    setup_notes: `## Quickstart
1. \`npm install\`.
2. \`npm run dev\`.`,
    file_tree: [
      'src/routes/+page.svelte',
      'src/lib/editor/MarkdownEditor.svelte',
      'src/lib/search/fuzzy.ts',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    views: 340,
    created_at: '2025-12-18T11:00:00Z',
  },
  {
    seed_key: 'budgetbee',
    seller_username: 'priya_builds',
    title: 'BudgetBee',
    tagline: 'Household expense tracker with receipt parsing and monthly category limits.',
    description: `### What it is
BudgetBee is an intuitive family budget tracker that monitors household income, splits bills between partners, and computes category burn rates.

### Why it died
Built for my household during the pandemic. After switching to an automated bank sync tool, I no longer had time to maintain the OCR receipt extraction pipeline.

### What you get
The entire React and Firebase application with monthly category tracking, data visualizers, and CSV export tools.`,
    interaction_type: 'adopt',
    price_paise: 0,
    tech_stack: ['react', 'firebase', 'tailwind'],
    cause_of_death: 'no_time',
    abandoned_on: '2024-09-02',
    last_commit_at: '2024-09-05T15:30:00Z',
    completion_percent: 75,
    lines_of_code: 6200,
    license: 'MIT',
    features: [
      'Monthly budget allocation and category spending meters',
      'Split expense calculator between multiple family members',
      'Interactive monthly trends chart with spending predictions',
      'Comprehensive CSV and PDF expense report export',
    ],
    todo_items: [
      'Automatic bank SMS receipt parsing integration',
      'Multi-currency household sharing support',
    ],
    setup_notes: `## Setup BudgetBee
1. Add Firebase configuration to \`src/firebase.ts\`.
2. Run \`npm install && npm start\`.`,
    file_tree: [
      'src/components/BudgetSummary.tsx',
      'src/components/ExpenseForm.tsx',
      'src/firebase.ts',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    views: 260,
    created_at: '2025-12-25T13:00:00Z',
  },
  {
    seed_key: 'devcards',
    seller_username: 'meera_codes',
    title: 'DevCards',
    tagline: 'Developer portfolio card generator powered by GitHub and Dev.to stats.',
    description: `### What it is
DevCards creates dynamic, embeddable developer profile cards showcasing GitHub contributions, top programming languages, and recent technical articles.

### Why it died
Created before GitHub launched official profile README pins. As developer demand shifted to native Markdown README badges, DevCards became redundant.

### What you get
The complete Next.js edge-rendering application with SVG card generation, GitHub GraphQL API queries, and theme customization.`,
    interaction_type: 'adopt',
    price_paise: 0,
    tech_stack: ['nextjs', 'typescript'],
    cause_of_death: 'tech_outdated',
    abandoned_on: '2023-11-10',
    last_commit_at: '2023-11-14T11:00:00Z',
    completion_percent: 85,
    lines_of_code: 3900,
    license: 'MIT',
    epitaph: 'GitHub built it into the profile page. RIP.',
    features: [
      'Edge-rendered SVG developer summary cards',
      'Automated GitHub GraphQL contribution fetcher with token caching',
      'Custom color themes (Dark, Dracula, Nord, Cyberpunk)',
      'Direct copy-paste Markdown embed snippet generator',
    ],
    todo_items: [
      'GitLab and Bitbucket profile statistics integration',
      'Animated SVG progress bar options',
    ],
    setup_notes: `## Running DevCards
1. Provide \`GITHUB_TOKEN\` in \`.env.local\`.
2. Run \`npm install && npm run dev\`.`,
    file_tree: [
      'src/app/api/card/[username]/route.ts',
      'src/components/CardPreview.tsx',
      'src/lib/githubGql.ts',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    views: 310,
    created_at: '2026-01-05T10:00:00Z',
  },
  {
    seed_key: 'pingdeck',
    seller_username: 'nisha.rs',
    title: 'PingDeck',
    tagline: 'Minimalist uptime monitor with public status pages and latency graphs.',
    description: `### What it is
PingDeck is a lightweight Go microservice that polls HTTP endpoints, checks TLS certificate expirations, and generates static, fast status pages.

### Why it died
Originally designed to replace expensive commercial status page tools. As the feature wishlist grew to include multi-region workers and SMS alerting, I ran out of time to maintain it.

### What you get
The complete Go codebase with SQLite persistence, HTML status page generator, and Docker container setup.`,
    interaction_type: 'adopt',
    price_paise: 0,
    tech_stack: ['go', 'docker'],
    cause_of_death: 'scope_creep',
    abandoned_on: '2025-01-20',
    last_commit_at: '2025-01-24T18:00:00Z',
    completion_percent: 75,
    lines_of_code: 5600,
    license: 'MIT',
    epitaph: '100% uptime on the monitor. 0% time to run it.',
    features: [
      'High-throughput HTTP/HTTPS polling engine with custom headers',
      'Automated TLS certificate expiration tracking with alerts',
      'Public incident status page with uptime percentage badges',
      'Embedded SQLite database requiring zero external servers',
    ],
    todo_items: [
      'PagerDuty and OpsGenie webhook incident triggers',
      'Distributed worker polling from multiple geographical locations',
    ],
    setup_notes: `## Running PingDeck
1. \`go run main.go --config config.json\`.`,
    file_tree: [
      'main.go',
      'monitor/checker.go',
      'storage/db.go',
      'views/status.html',
      'Dockerfile',
      'go.mod',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    views: 280,
    created_at: '2026-01-10T12:00:00Z',
  },

  // ==========================================
  // REMAINING LIVE - SEEKING PARTNER (2)
  // ==========================================
  {
    seed_key: 'skillswap',
    seller_username: 'arjun.dev',
    title: 'SkillSwap',
    tagline: 'Peer skill-exchange marketplace seeking a growth and marketing partner.',
    description: `### What it is
SkillSwap is a barter marketplace where developers, designers, and creators swap skills directly without monetary transactions (e.g. 2 hours of React mentorship for 2 hours of UI design).

### Why it died
The web platform, search, and scheduling components are completed and tested. However, scaling a peer-to-peer barter network requires intensive community growth and user acquisition expertise that I lack as a backend engineer.

### What you get
The entire frontend and backend application built on Next.js and Supabase, with real-time matching and session booking.`,
    interaction_type: 'collab',
    price_paise: 0,
    tech_stack: ['nextjs', 'supabase', 'typescript'],
    cause_of_death: 'no_time',
    abandoned_on: '2025-11-28',
    last_commit_at: '2025-12-02T16:00:00Z',
    completion_percent: 70,
    lines_of_code: 7200,
    license: 'MIT',
    epitaph: 'I can build the app. I cannot build the hype.',
    features: [
      'Skill listing profile matrix with portfolio attachments',
      'Direct barter proposal engine with session credits',
      'Calendar availability coordination and session reminders',
      'Post-session review and reputation score calculation',
    ],
    todo_items: [
      'In-browser WebRTC video calling integration',
      'Community referral mechanism with bonus session credits',
    ],
    setup_notes: `## Running SkillSwap
1. \`npm install\`.
2. Connect Supabase database and run \`npm run dev\`.`,
    file_tree: [
      'src/app/skills/page.tsx',
      'src/components/BarterProposal.tsx',
      'src/lib/matching.ts',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    collab_roles: [
      {
        role: 'Growth & Community Marketer',
        commitment: '6–8 hrs/week',
        description: 'Lead organic creator outreach on X, LinkedIn, and Discord to onboard the first 250 active skill exchangers.',
      },
    ],
    collab_terms: 'Equity split (15%)',
    views: 450,
    created_at: '2026-01-15T15:00:00Z',
  },
  {
    seed_key: 'haikubot',
    seller_username: 'vikram_indie',
    title: 'Haikubot',
    tagline: 'A Discord poetry bot seeking a community manager and Discord bot expert.',
    description: `### What it is
Haikubot is a Discord server companion that analyzes conversation channels, detects unintentional 5-7-5 syllable haikus in real-time, and formats them into poetic embeds.

### Why it died
Built for fun and added to 40 friendly servers. When server verification demands and rate limits expanded, maintaining bot presence and answering support tickets became overwhelming alone.

### What you get
The complete Python asyncio bot, English syllable dictionary caching layer, and server configuration database.`,
    interaction_type: 'collab',
    price_paise: 0,
    tech_stack: ['python', 'docker'],
    cause_of_death: 'lost_interest',
    abandoned_on: '2025-08-30',
    last_commit_at: '2025-09-02T12:00:00Z',
    completion_percent: 60,
    lines_of_code: 3100,
    license: 'MIT',
    epitaph: 'Five syllables here / Seven syllables go there / Nobody cared much.',
    features: [
      'Real-time Discord channel message listener with tokenization',
      'Offline CMU pronouncing dictionary syllable lookup algorithm',
      'Custom Discord rich embed formatting with author credits',
      'Opt-out channel command decorators and configuration cache',
    ],
    todo_items: [
      'Support for multiple languages and slang phonetic rules',
      'Discord bot verification submission and sharding architecture',
    ],
    setup_notes: `## Setup Haikubot
1. Set \`DISCORD_BOT_TOKEN\` in \`.env\`.
2. Run \`pip install -r requirements.txt && python bot.py\`.`,
    file_tree: [
      'bot.py',
      'haiku/syllables.py',
      'haiku/detector.py',
      'requirements.txt',
      'Dockerfile',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    collab_roles: [
      {
        role: 'Community Manager & Discord Bot Lead',
        commitment: '4–5 hrs/week',
        description: 'Manage the official support server, handle bot verification with Discord, and expand distribution.',
      },
    ],
    collab_terms: 'To discuss',
    views: 320,
    created_at: '2026-01-20T10:00:00Z',
  },

  // ==========================================
  // REVIVED PROJECTS (6) - SHOWN IN RESURRECTED WALL
  // ==========================================
  {
    seed_key: 'markdownmint',
    seller_username: 'arjun.dev',
    title: 'MarkdownMint',
    tagline: 'Static documentation generator for REST and GraphQL APIs.',
    description: `### What it is
MarkdownMint transforms OpenAPI specifications and Markdown documents into fast, searchable documentation websites.

### Resurrected
Purchased on The Graveyard by @demo_buyer for ₹1,999. The buyer refactored the search indexing and integrated it into their internal tooling stack.`,
    interaction_type: 'buy',
    price_paise: 199900,
    tech_stack: ['react', 'typescript', 'tailwind'],
    cause_of_death: 'lost_interest',
    abandoned_on: '2024-06-10',
    last_commit_at: '2024-06-15T10:00:00Z',
    completion_percent: 90,
    lines_of_code: 8600,
    license: 'MIT',
    epitaph: 'Documented to perfection. Revived by an indie hacker.',
    features: [
      'OpenAPI 3.0 specification parser with interactive request builder',
      'Algolia DocSearch integration and offline Lunr.js search fallback',
      'Dark mode syntax highlighting with copyable code snippets',
    ],
    todo_items: ['GraphQL schema visualization widget'],
    setup_notes: `## Setup: npm install && npm run build`,
    file_tree: [
      'src/parser.ts',
      'src/components/DocsLayout.tsx',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    is_sold: true,
    revived_at: '2025-11-20T16:00:00Z',
    views: 780,
    created_at: '2025-07-10T10:00:00Z',
  },
  {
    seed_key: 'tasktide',
    seller_username: 'priya_builds',
    title: 'TaskTide',
    tagline: 'Kanban board with pomodoro timers and daily velocity analytics.',
    description: `### What it is
TaskTide combines visual Kanban columns with integrated Pomodoro sprint cycles and daily developer velocity tracking.

### Resurrected
Claimed as a Free Fork on The Graveyard by @demo_buyer and now maintained as an open-source productivity template.`,
    interaction_type: 'adopt',
    price_paise: 0,
    tech_stack: ['react', 'typescript', 'tailwind'],
    cause_of_death: 'no_time',
    abandoned_on: '2024-05-12',
    last_commit_at: '2024-05-15T14:00:00Z',
    completion_percent: 85,
    lines_of_code: 6700,
    license: 'MIT',
    epitaph: 'Timed every task. Out of time to ship.',
    features: [
      'Drag-and-drop Kanban workflow columns',
      'Integrated customizable 25-minute Pomodoro timer with audible chimes',
      'Local IndexedDB backup and CSV export',
    ],
    todo_items: ['Google Calendar two-way task synchronization'],
    setup_notes: `## Setup: npm install && npm run dev`,
    file_tree: [
      'src/components/Board.tsx',
      'src/components/Timer.tsx',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    is_sold: false,
    revived_at: '2025-12-05T11:00:00Z',
    views: 650,
    created_at: '2025-07-15T12:00:00Z',
  },
  {
    seed_key: 'formpilot',
    seller_username: 'meera_codes',
    title: 'FormPilot',
    tagline: 'Headless form backend with spam filtering and webhook relays.',
    description: `### What it is
FormPilot provides serverless form backend endpoints for static websites with reCAPTCHA v3 verification and webhook routing.

### Resurrected
Adopted by @vikram_indie who updated dependencies and integrated Telegram alert webhooks.`,
    interaction_type: 'adopt',
    price_paise: 0,
    tech_stack: ['nodejs', 'docker'],
    cause_of_death: 'scope_creep',
    abandoned_on: '2024-04-18',
    last_commit_at: '2024-04-20T17:00:00Z',
    completion_percent: 80,
    lines_of_code: 4300,
    license: 'MIT',
    features: [
      'Headless form submission ingest endpoint',
      'Automated honeypot and Akismet spam evaluation',
      'Slack, Discord, and Email notification dispatchers',
    ],
    todo_items: ['File attachment upload handling to S3'],
    setup_notes: `## Setup: npm install && node server.js`,
    file_tree: [
      'server.js',
      'handlers/submit.js',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    is_sold: false,
    revived_at: '2025-12-22T14:30:00Z',
    views: 520,
    created_at: '2025-07-20T14:00:00Z',
  },
  {
    seed_key: 'cartkit',
    seller_username: 'demo_seller',
    title: 'CartKit',
    tagline: 'Embeddable headless checkout widget for creator merchandise.',
    description: `### What it is
CartKit is a standalone React shopping cart and checkout drawer with localized currency support and Razorpay payment integration.

### Resurrected
Sold for ₹2,999 to @kabir_ships on The Graveyard. Integrated into a digital asset storefront.`,
    interaction_type: 'buy',
    price_paise: 299900,
    tech_stack: ['react', 'typescript', 'tailwind'],
    cause_of_death: 'pivoted',
    abandoned_on: '2024-03-01',
    last_commit_at: '2024-03-05T12:00:00Z',
    completion_percent: 90,
    lines_of_code: 7100,
    license: 'Proprietary',
    epitaph: 'Sold the software. Now it sells merchandise.',
    features: [
      'Slide-over shopping cart drawer with local storage persistence',
      'Razorpay and Stripe multi-provider payment handler',
      'Discount coupon and promotion validation rules',
    ],
    todo_items: ['Automated shipping address autocompletion'],
    setup_notes: `## Setup: npm install && npm run dev`,
    file_tree: [
      'src/components/CartDrawer.tsx',
      'src/components/Checkout.tsx',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    is_sold: true,
    revived_at: '2026-01-10T10:00:00Z',
    views: 820,
    created_at: '2025-08-01T10:00:00Z',
  },
  {
    seed_key: 'bytebazaar',
    seller_username: 'demo_seller',
    title: 'ByteBazaar',
    tagline: 'Digital download marketplace for fonts, icons, and 3D assets.',
    description: `### What it is
ByteBazaar is a multi-vendor digital download storefront providing secure signed asset delivery URLs upon verified payment.

### Resurrected
Sold for ₹3,499 on The Graveyard to @rohan_golang. Rebranded as a 3D asset marketplace.`,
    interaction_type: 'buy',
    price_paise: 349900,
    tech_stack: ['nextjs', 'supabase', 'typescript'],
    cause_of_death: 'ran_out_of_funding',
    abandoned_on: '2024-02-15',
    last_commit_at: '2024-02-18T16:00:00Z',
    completion_percent: 90,
    lines_of_code: 11800,
    license: 'Proprietary',
    epitaph: 'Too many bytes. Not enough buyers until now.',
    features: [
      'Instant digital download signed URL generator with 24h expiration',
      'Stripe Connect multi-vendor marketplace split payouts',
      'Asset preview carousel with watermarked image delivery',
    ],
    todo_items: ['Video course player with timestamp markers'],
    setup_notes: `## Setup: pnpm install && pnpm dev`,
    file_tree: [
      'app/store/page.tsx',
      'app/api/download/route.ts',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    is_sold: true,
    revived_at: '2026-01-25T15:00:00Z',
    views: 790,
    created_at: '2025-08-05T12:00:00Z',
  },
  {
    seed_key: 'retroradio',
    seller_username: 'ananya.ui',
    title: 'RetroRadio',
    tagline: 'Lofi web radio streaming station with generative pixel art visuals.',
    description: `### What it is
RetroRadio is an ambient lofi audio stream player with interactive visual effects and retro pixel art landscapes.

### Resurrected
Collaboration filled on The Graveyard! Partner found to compose music and expand audio playlists.`,
    interaction_type: 'collab',
    price_paise: 0,
    tech_stack: ['react', 'threejs', 'typescript'],
    cause_of_death: 'cofounder_left',
    abandoned_on: '2025-01-10',
    last_commit_at: '2025-01-15T11:00:00Z',
    completion_percent: 85,
    lines_of_code: 6100,
    license: 'MIT',
    epitaph: 'The music never stops.',
    features: [
      'WebAudio API synthesizer and continuous lofi audio streaming',
      'Three.js pixelated CRT monitor visualizer effects',
      'Sleep timer and custom binaural beats frequencies',
    ],
    todo_items: ['Spotify playlist import synchronization'],
    setup_notes: `## Setup: npm install && npm run dev`,
    file_tree: [
      'src/components/RadioPlayer.tsx',
      'src/components/CrtVisualizer.tsx',
      'package.json',
      'README.md',
      'SETUP.md',
      'LICENSE',
    ],
    is_collab_filled: true,
    revived_at: '2026-02-05T18:00:00Z',
    views: 670,
    created_at: '2025-08-20T16:00:00Z',
  },
];

async function seed() {
  console.log('=== STARTING THE GRAVEYARD V2.2 COMPLETE SEED ===');
  console.log(`Mode: ${isResetDemo ? 'RESET DEMO ONLY' : 'IDEMPOTENT UPSERT'}`);

  const defaultPass = 'GraveyardDemo2026!';
  const userMap: Record<string, string> = {};

  // 1. Ensure/Upsert Fictional Users
  console.log('Upserting 10 demo user accounts...');
  const { data: existingAuthUsers, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 100 });
  if (listErr) throw listErr;

  for (const u of USERS) {
    let authUser = existingAuthUsers.users.find((eu) => eu.email === u.email);
    if (!authUser) {
      console.log(`Creating auth user: ${u.email}...`);
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: u.email,
        password: defaultPass,
        email_confirm: true,
        user_metadata: { username: u.username },
      });
      if (createErr) throw createErr;
      authUser = created.user;
    }

    userMap[u.username] = authUser.id;

    // Upsert Profile
    const { error: profErr } = await supabase.from('profiles').upsert({
      id: authUser.id,
      username: u.username,
      bio: u.bio,
      github_url: u.github_url,
      avatar_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${u.username}`,
      reputation_score: u.reputation_score,
      created_at: u.created_at,
    });
    if (profErr) {
      console.error(`Failed to upsert profile for ${u.username} (${authUser.id}):`, profErr);
      throw profErr;
    }
  }

  // 2. Handle --reset-demo
  if (isResetDemo) {
    console.log('Resetting existing demo records (seed_key IS NOT NULL)...');
    // Fetch IDs of existing seeded projects
    const { data: existingSeedProjects } = await supabase
      .from('projects')
      .select('id, seed_key')
      .not('seed_key', 'is', null);

    const seedIds = (existingSeedProjects || []).map((p) => p.id);

    if (seedIds.length > 0) {
      await supabase.from('transactions').delete().in('project_id', seedIds);
      await supabase.from('collaboration_requests').delete().in('project_id', seedIds);
      await supabase.from('project_assets').delete().in('project_id', seedIds);
      await supabase.from('projects').delete().in('id', seedIds);
      console.log(`Purged ${seedIds.length} existing demo projects.`);
    }
  }

  // 3. Seed Projects & Real Downloadable ZIP Archives
  console.log(`Processing ${DEMO_PROJECTS.length} demo projects...`);

  for (const def of DEMO_PROJECTS) {
    const sellerId = userMap[def.seller_username];
    if (!sellerId) {
      throw new Error(`Seller username ${def.seller_username} not found in userMap`);
    }

    // Check if project exists by seed_key
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('seed_key', def.seed_key)
      .maybeSingle();

    let projectId = existing?.id;

    // Check optional DEMO_GITHUB_REPO
    const attachRepo = Boolean(process.env.DEMO_GITHUB_REPO && def.seed_key === 'invoiceforge');

    const projectPayload = {
      seller_id: sellerId,
      seed_key: def.seed_key,
      title: def.title,
      tagline: def.tagline,
      description: def.description,
      interaction_type: def.interaction_type,
      price_paise: def.price_paise,
      demo_url: `https://${def.seed_key}.example.com`,
      license: def.license,
      collab_terms: def.collab_terms || null,
      cause_of_death: def.cause_of_death,
      abandoned_on: def.abandoned_on,
      last_commit_at: def.last_commit_at,
      completion_percent: def.completion_percent,
      lines_of_code: def.lines_of_code,
      epitaph: def.epitaph || null,
      features: def.features,
      todo_items: def.todo_items,
      setup_notes: def.setup_notes,
      file_tree: def.file_tree,
      collab_roles: def.collab_roles || null,
      is_featured: def.is_featured || false,
      featured_rank: def.featured_rank || null,
      has_archive: true,
      has_repo: attachRepo,
      is_sold: def.is_sold || false,
      is_collab_filled: def.is_collab_filled || false,
      is_archived: false,
      revived_at: def.revived_at || null,
      views: def.views,
      created_at: def.created_at,
    };

    if (projectId) {
      await supabase.from('projects').update(projectPayload).eq('id', projectId);
    } else {
      const { data: createdProj, error: pErr } = await supabase
        .from('projects')
        .insert(projectPayload)
        .select()
        .single();
      if (pErr) throw pErr;
      projectId = createdProj.id;
    }

    console.log(`Project ready: ${def.title} (${def.seed_key}) -> ${projectId}`);

    // Build Real Downloadable Archive Matching file_tree EXACTLY
    const zip = new JSZip();

    for (const filePath of def.file_tree) {
      let content = `// Stub file for ${filePath}\n// Project: ${def.title}\n`;
      if (filePath.endsWith('README.md')) {
        content = `# ${def.title}\n\n${def.tagline}\n\n${def.description}\n`;
      } else if (filePath.endsWith('SETUP.md')) {
        content = def.setup_notes;
      } else if (filePath.endsWith('LICENSE')) {
        content = `${def.license}\n\nCopyright (c) 2026 ${def.seller_username}\n`;
      } else if (filePath.endsWith('package.json')) {
        content = JSON.stringify(
          {
            name: def.seed_key,
            version: '1.0.0',
            description: def.tagline,
            scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
          },
          null,
          2
        );
      } else if (filePath.endsWith('Cargo.toml')) {
        content = `[package]\nname = "${def.seed_key}"\nversion = "0.1.0"\nedition = "2021"\n`;
      } else if (filePath.endsWith('go.mod')) {
        content = `module github.com/${def.seller_username}/${def.seed_key}\n\ngo 1.22\n`;
      } else if (filePath.endsWith('requirements.txt')) {
        content = `requests>=2.31.0\nfastapi>=0.110.0\n`;
      }

      zip.file(filePath, content);
    }

    // STRICT ASSERTION: Verify all expected paths exist inside the zip
    for (const expectedPath of def.file_tree) {
      if (!zip.file(expectedPath)) {
        throw new Error(`File tree assertion failed for ${def.seed_key}: missing ${expectedPath}`);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const zipStoragePath = `${sellerId}/${projectId}.zip`;

    const { error: zipErr } = await supabase.storage
      .from('project-files')
      .upload(zipStoragePath, zipBuffer, { upsert: true, contentType: 'application/zip' });

    if (zipErr) {
      console.warn(`Warning uploading zip for ${def.seed_key}:`, zipErr.message);
    }

    // Upsert project_assets record
    await supabase.from('project_assets').upsert({
      project_id: projectId,
      file_path: zipStoragePath,
      file_size_bytes: zipBuffer.length,
      github_repo_full_name: attachRepo ? process.env.DEMO_GITHUB_REPO : null,
      is_private_repo: false,
    });

    // Generate Screenshots for Flagship projects
    if (def.is_flagship) {
      const mode = def.interaction_type;
      const screenshotUrls: string[] = [];

      for (let sIdx = 1; sIdx <= 3; sIdx++) {
        const shotBuffer = await generateScreenshotBuffer(mode, sIdx as 1 | 2 | 3);
        const shotStoragePath = `${sellerId}/${projectId}/shot-${sIdx}.webp`;

        await supabase.storage
          .from('project-covers')
          .upload(shotStoragePath, shotBuffer, { upsert: true, contentType: 'image/webp' });

        const { data: pubData } = supabase.storage
          .from('project-covers')
          .getPublicUrl(shotStoragePath);

        screenshotUrls.push(pubData.publicUrl);
      }

      // Update project with real screenshot covers
      await supabase
        .from('projects')
        .update({
          cover_url: screenshotUrls[0],
          screenshots: screenshotUrls,
        })
        .eq('id', projectId);
    }
  }

  // 4. Seed Activity Data: Transactions, Collab Requests, Messages, Notifications
  console.log('Seeding transactions, requests, messages, and notifications...');

  const buyerId = userMap['demo_buyer'];
  const sellerId = userMap['demo_seller'];

  // Project IDs mapping
  const { data: allSeedProjects } = await supabase
    .from('projects')
    .select('id, seed_key, price_paise, seller_id');

  const pMap = new Map((allSeedProjects || []).map((p) => [p.seed_key, p]));

  // Transactions
  // 1. CartKit sold for ₹2,999 (seller: demo_seller, buyer: kabir_ships)
  // 2. ByteBazaar sold for ₹3,499 (seller: demo_seller, buyer: rohan_golang)
  // Total demo_seller earnings: ₹6,498
  const cartKit = pMap.get('cartkit');
  const byteBazaar = pMap.get('bytebazaar');
  const markdownMint = pMap.get('markdownmint');
  const taskTide = pMap.get('tasktide');
  const formPilot = pMap.get('formpilot');
  const retroRadio = pMap.get('retroradio');

  if (cartKit) {
    await supabase.from('transactions').upsert({
      id: '00000000-0000-0000-0000-000000000001',
      project_id: cartKit.id,
      buyer_id: userMap['kabir_ships'],
      amount_paise: cartKit.price_paise,
      kind: 'buy',
      status: 'completed',
      payment_id: 'pay_seed_cartkit_001',
      razorpay_order_id: 'order_seed_cartkit_001',
      created_at: '2026-01-10T10:05:00Z',
    });
  }

  if (byteBazaar) {
    await supabase.from('transactions').upsert({
      id: '00000000-0000-0000-0000-000000000002',
      project_id: byteBazaar.id,
      buyer_id: userMap['rohan_golang'],
      amount_paise: byteBazaar.price_paise,
      kind: 'buy',
      status: 'completed',
      payment_id: 'pay_seed_bytebazaar_002',
      razorpay_order_id: 'order_seed_bytebazaar_002',
      created_at: '2026-01-25T15:05:00Z',
    });
  }

  // demo_buyer Vault: MarkdownMint (bought ₹1,999) and TaskTide (claimed free)
  if (markdownMint) {
    await supabase.from('transactions').upsert({
      id: '00000000-0000-0000-0000-000000000003',
      project_id: markdownMint.id,
      buyer_id: buyerId,
      amount_paise: markdownMint.price_paise,
      kind: 'buy',
      status: 'completed',
      payment_id: 'pay_seed_markdownmint_003',
      razorpay_order_id: 'order_seed_markdownmint_003',
      created_at: '2025-11-20T16:05:00Z',
    });
  }

  if (taskTide) {
    await supabase.from('transactions').upsert({
      id: '00000000-0000-0000-0000-000000000004',
      project_id: taskTide.id,
      buyer_id: buyerId,
      amount_paise: 0,
      kind: 'adopt',
      status: 'completed',
      payment_id: 'pay_seed_tasktide_004',
      razorpay_order_id: 'order_seed_tasktide_004',
      created_at: '2025-12-05T11:05:00Z',
    });
  }

  if (formPilot) {
    await supabase.from('transactions').upsert({
      id: '00000000-0000-0000-0000-000000000005',
      project_id: formPilot.id,
      buyer_id: userMap['vikram_indie'],
      amount_paise: 0,
      kind: 'adopt',
      status: 'completed',
      payment_id: 'pay_seed_formpilot_005',
      razorpay_order_id: 'order_seed_formpilot_005',
      created_at: '2025-12-22T14:35:00Z',
    });
  }

  // Collab Requests
  // 1. demo_buyer -> OpenShelf (pending)
  const openShelf = pMap.get('openshelf');
  if (openShelf) {
    await supabase.from('collab_requests').upsert({
      id: '00000000-0000-0000-0000-000000000010',
      project_id: openShelf.id,
      applicant_id: buyerId,
      pitch: 'I have 6 years experience with PostgreSQL performance tuning and GraphQL APIs. I would love to build out OpenShelf’s reservation queues and search system.',
      contact: 'buyer@graveyard.dev',
      status: 'pending',
      created_at: '2026-02-10T14:00:00Z',
    });
  }

  // 2. Lanternly (seller: demo_seller) has 3 requests:
  const lanternly = pMap.get('lanternly');
  if (lanternly) {
    await supabase.from('collab_requests').upsert([
      {
        id: '00000000-0000-0000-0000-000000000011',
        project_id: lanternly.id,
        applicant_id: userMap['meera_codes'],
        pitch: 'Hi! I specialize in React Native and have shipped 3 audio recorder apps on the iOS App Store. I reviewed Lanternly’s architecture and can have an offline recording build ready in 2 weeks.',
        contact: 'meera@graveyard.dev',
        status: 'accepted',
        created_at: '2026-02-01T09:00:00Z',
      },
      {
        id: '00000000-0000-0000-0000-000000000012',
        project_id: lanternly.id,
        applicant_id: userMap['priya_builds'],
        pitch: 'I love Lanternly’s typography and concept! Here is my portfolio with design system specs. I can dedicate 6 hours a week to onboarding flows.',
        contact: 'priya@graveyard.dev',
        status: 'pending',
        created_at: '2026-02-12T11:30:00Z',
      },
      {
        id: '00000000-0000-0000-0000-000000000013',
        project_id: lanternly.id,
        applicant_id: userMap['vikram_indie'],
        pitch: 'I am a novice junior developer looking to learn React Native on a real project.',
        contact: 'vikram@graveyard.dev',
        status: 'rejected',
        created_at: '2026-01-20T16:00:00Z',
      },
    ]);
  }

  // 3. RetroRadio has 1 accepted request
  if (retroRadio) {
    await supabase.from('collab_requests').upsert({
      id: '00000000-0000-0000-0000-000000000014',
      project_id: retroRadio.id,
      applicant_id: userMap['arjun.dev'],
      pitch: 'I produce lofi hip-hop and can supply 50 royalty-free original tracks for the stream.',
      contact: 'arjun@graveyard.dev',
      status: 'accepted',
      created_at: '2026-02-04T12:00:00Z',
    });
  }

  // Realistic Messages
  console.log('Seeding message threads...');
  const arjunId = userMap['arjun.dev'];
  const meeraId = userMap['meera_codes'];

  const messages = [
    // Thread 1: demo_buyer <-> arjun.dev (MarkdownMint)
    {
      sender_id: buyerId,
      recipient_id: arjunId,
      content: 'Hey Arjun, I just acquired MarkdownMint! The OpenAPI parser is brilliant. Quick question: which Lunr tokenizer version did you test with?',
      created_at: '2025-11-21T10:00:00Z',
      is_read: true,
    },
    {
      sender_id: arjunId,
      recipient_id: buyerId,
      content: 'Glad you like it! I used Lunr v2.3.9 with the multi-language stemmer pipeline. Let me know if you hit any index size bottlenecks.',
      created_at: '2025-11-21T11:15:00Z',
      is_read: true,
    },
    {
      sender_id: buyerId,
      recipient_id: arjunId,
      content: 'Awesome, worked like a charm after updating the stemmer. Thanks again!',
      created_at: '2025-11-21T14:30:00Z',
      is_read: true,
    },

    // Thread 2: demo_seller <-> meera_codes (Lanternly collaboration)
    {
      sender_id: meeraId,
      recipient_id: sellerId,
      content: 'Hi! So thrilled you accepted my application for the React Native mobile role on Lanternly.',
      created_at: '2026-02-02T10:00:00Z',
      is_read: true,
    },
    {
      sender_id: sellerId,
      recipient_id: meeraId,
      content: 'Welcome aboard Meera! Your background with audio stream buffers is exactly what Lanternly needed. I shared repo write access with your GitHub username.',
      created_at: '2026-02-02T12:20:00Z',
      is_read: true,
    },
    {
      sender_id: meeraId,
      recipient_id: sellerId,
      content: 'Received and cloned! I have already sketched the background audio service for iOS. Setting up our milestone board today.',
      created_at: '2026-02-02T15:00:00Z',
      is_read: false,
    },

    // Thread 3: demo_buyer <-> demo_seller (CartKit)
    {
      sender_id: buyerId,
      recipient_id: sellerId,
      content: 'Hey, saw CartKit was acquired last month. Do you plan on listing any other e-commerce or digital download tools soon?',
      created_at: '2026-02-14T09:00:00Z',
      is_read: true,
    },
    {
      sender_id: sellerId,
      recipient_id: buyerId,
      content: 'Hey! Yes, InvoiceForge is currently live on the marketplace if you need billing pipelines. Check it out!',
      created_at: '2026-02-14T11:00:00Z',
      is_read: false,
    },
  ];

  for (const m of messages) {
    await supabase.from('messages').insert(m);
  }

  // Realistic Notifications
  console.log('Seeding notifications...');
  const notifications = [
    // Notifications for demo_seller
    {
      user_id: sellerId,
      type: 'sale',
      title: 'Project Acquired',
      body: 'CartKit was purchased by @kabir_ships for ₹2,999.',
      link: '/dashboard?tab=sales',
      read_at: '2026-01-10T11:00:00Z',
      created_at: '2026-01-10T10:05:00Z',
    },
    {
      user_id: sellerId,
      type: 'sale',
      title: 'Project Acquired',
      body: 'ByteBazaar was purchased by @rohan_golang for ₹3,499.',
      link: '/dashboard?tab=sales',
      read_at: '2026-01-25T16:00:00Z',
      created_at: '2026-01-25T15:05:00Z',
    },
    {
      user_id: sellerId,
      type: 'collab_pitch',
      title: 'New Collaboration Pitch',
      body: '@priya_builds applied for the Product Designer role on Lanternly.',
      link: '/dashboard?tab=collabs',
      read_at: null,
      created_at: '2026-02-12T11:30:00Z',
    },
    {
      user_id: sellerId,
      type: 'new_message',
      title: 'New Message',
      body: 'You have an unread message from @meera_codes regarding Lanternly.',
      link: '/dashboard?tab=messages',
      read_at: null,
      created_at: '2026-02-02T15:00:00Z',
    },

    // Notifications for demo_buyer
    {
      user_id: buyerId,
      type: 'sale',
      title: 'Acquisition Successful',
      body: 'You acquired MarkdownMint. Full source code archive is ready in your Vault.',
      link: '/dashboard?tab=vault',
      read_at: '2025-11-20T17:00:00Z',
      created_at: '2025-11-20T16:05:00Z',
    },
    {
      user_id: buyerId,
      type: 'claim',
      title: 'Project Claimed',
      body: 'You successfully claimed TaskTide. Unlocked source archive.',
      link: '/dashboard?tab=vault',
      read_at: '2025-12-05T12:00:00Z',
      created_at: '2025-12-05T11:05:00Z',
    },
    {
      user_id: buyerId,
      type: 'collab_pitch',
      title: 'Application Submitted',
      body: 'Your collaboration application for OpenShelf was received by @ananya.ui.',
      link: '/dashboard?tab=collabs',
      read_at: null,
      created_at: '2026-02-10T14:00:00Z',
    },
    {
      user_id: buyerId,
      type: 'new_message',
      title: 'New Message',
      body: '@demo_seller replied to your message.',
      link: '/dashboard?tab=messages',
      read_at: null,
      created_at: '2026-02-14T11:00:00Z',
    },
  ];

  for (const n of notifications) {
    await supabase.from('notifications').insert(n);
  }

  console.log('=== V2.2 DEMO SEEDING COMPLETED SUCCESSFULLY ===');
  console.log('Total Demo Projects: 24 (18 Live + 6 Revived)');
  console.log('Demo Seller Earnings: ₹6,498 (CartKit + ByteBazaar)');
  console.log('Demo Buyer Vault: MarkdownMint (Bought) + TaskTide (Claimed)');
}

seed().catch((err) => {
  console.error('Fatal seed failure:', err);
  process.exit(1);
});
