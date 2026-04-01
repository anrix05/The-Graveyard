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
3. Copy `.env.example` to `.env.local` and add your Supabase and Razorpay keys (ensure you have these set up).
4. Run the development server:
   ```bash
   npm run dev
   ```

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
