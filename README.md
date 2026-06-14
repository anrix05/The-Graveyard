# The Graveyard

A marketplace and collaboration platform built with **Next.js**, **Supabase**, and **Tailwind CSS**. It allows users to claim projects, verify payments via Razorpay, and download secure assets directly.

## Features

- **Next.js App Router**: Modern and fast React framework.
- **Supabase Integration**: Robust PostgreSQL database and authentication.
- **Razorpay Payments**: Secure payment gateway for claiming and purchasing projects.
- **Radix UI components**: Accessible, primitive, and clean UI components.
- **Tailwind CSS**: Utility-first CSS framework for rapid and responsive UI development.
- **Automated Keep-Alive Cron**: Built-in edge cron jobs via Vercel to prevent Supabase database auto-pausing.

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables. Copy `.env.example` to `.env.local` and configure:
   ```env
   # Supabase configuration
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key  # Keep secret! Never expose on client.

   # Razorpay configuration
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your-razorpay-key-id
   RAZORPAY_KEY_SECRET=your-razorpay-key-secret             # Keep secret! Never expose on client.

   # GitHub API Token (For repository invitations)
   GITHUB_ACCESS_TOKEN=your-github-personal-access-token
   ```
4. Initialize the database schema:
   - Run the initial schema setup using [init_db.sql](file:///d:/the-graveyard/init_db.sql) in your Supabase SQL editor.
   - Run the [reconciled_policies.sql](file:///d:/the-graveyard/reconciled_policies.sql) script to set up all strict RLS policies, storage private bucket parameters, and unique integrity constraints.
5. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Security & Server Secrets

- **SUPABASE_SERVICE_ROLE_KEY**: Used strictly on the server-side to bypass RLS for administrative actions (like inserting verified transactions and marking projects as sold). **Never** prefix with `NEXT_PUBLIC_` or expose to the frontend.
- **RAZORPAY_KEY_SECRET**: Used to verify payment signatures on the server. Do not expose client-side.
- **GITHUB_ACCESS_TOKEN**: Token with permission to invite collaborators to private GitHub repositories. Ensure it has scoped repository permissions.

## Security Features & Integrity Hardening

- **Idempotent Payment Verification**: The `/api/verify-payment` route checks for duplicate calls by querying existing transactions. If a previous request failed mid-way during post-payment activations (project status update or GitHub invitation), retrying the verification will resume the activation without duplicate charges or database inserts.
- **Integrity Validation**: The verification API fetches the order details from Razorpay to verify that the amount paid matches the database project price and that the transaction corresponds to the correct project ID.
- **Strict Row Level Security (RLS)**: Public access to storage is disabled. Project downloads are securely managed via the `/api/secure-download` endpoint, which performs authentication, transaction lookup, and returns short-lived signed URLs.

## Scripts

- `npm run dev` - Starts the development server.
- `npm run build` - Creates a production build.
- `npm run lint` - Runs ESLint.

## Tech Stack Overview
- **Framework:** Next.js
- **Styling:** Tailwind CSS, Framer Motion
- **Database:** Supabase
- **Payments:** Razorpay
- **Icons:** Lucide React
