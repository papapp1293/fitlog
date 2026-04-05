# Gym Tracker

A full-stack progressive web app for logging and tracking gym workouts. Built with a modern production-ready stack — server-side rendering, real-time optimistic updates, offline support, and data visualizations.

**[Live Demo](https://your-app.vercel.app)** <!-- update after deploy -->

![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed_on_Vercel-black?style=flat&logo=vercel)

---

## Features

- **Workout logging** — start a session from a template, log sets with weight/reps, end workout
- **Exercise library** — create and manage custom exercises with muscle group tagging
- **Workout templates** — build reusable workout plans and customize exercises per session
- **Workout history** — browse all past sessions with full exercise/set breakdowns
- **Exercise progress charts** — visualize volume and best weight over time with Recharts
- **Bodyweight tracking** — log bodyweight with trend line and sparkline on home screen
- **Rest timer** — configurable countdown after each set with calculator-style picker
- **Unilateral support** — L/R set pairing for single-limb exercises
- **Offline support** — PWA with service worker, works without internet
- **Auth** — credentials, GitHub OAuth, and Google OAuth via NextAuth.js v5

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, Server Actions, RSC) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 7 |
| Auth | NextAuth.js v5 |
| Server state | TanStack Query v5 |
| Client state | Zustand |
| Charts | Recharts |
| Animations | Framer Motion |
| Testing | Playwright (e2e) |
| Deployment | Vercel |

## Architecture Highlights

- **Server Actions** for all mutations — no separate API layer needed
- **Optimistic updates** with TanStack Query `onMutate` + rollback on error
- **Edge-compatible auth middleware** — cookie-based session check without Prisma
- **Prisma adapter pattern** — `@prisma/adapter-pg` for direct PostgreSQL connection
- **PWA service worker** — cache-first for static assets, stale-while-revalidate for pages, skips POST requests
- **Timer resilience** — `Date.now()` delta instead of `setInterval` so workout timer survives app backgrounding

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase recommended)

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in DATABASE_URL, AUTH_SECRET, and OAuth credentials

# Run database migrations
npx prisma migrate dev

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

```
DATABASE_URL=     # PostgreSQL connection string
AUTH_SECRET=      # Random secret (generate: openssl rand -base64 32)
```

GitHub and Google OAuth are optional — the app also supports email/password auth.

### Commands

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run lint         # ESLint
npx tsc --noEmit     # Type check
npm run test:e2e     # Playwright e2e tests
npx prisma studio    # Database GUI
```

## Project Structure

```
src/
├── actions/          # Server Actions (all mutations)
├── app/              # Next.js App Router pages
│   └── (app)/        # Authenticated route group
├── components/       # React components
│   ├── ui/           # shadcn/ui primitives
│   ├── layout/       # Shell components (nav, page container)
│   └── ...           # Feature components
├── hooks/            # Custom React hooks
├── stores/           # Zustand client state
├── schemas/          # Zod validation schemas
└── lib/              # DB client, auth config, utilities
```

## Screenshots

<!-- Add screenshots after deploy -->
