# Developer & Agent Setup Guide

## Stack Overview

- **Frontend:** [Vite](https://vite.dev/) (Vanilla TypeScript)
- **Canvas:** [Konva.js](https://konvajs.org/)
- **Backend / Database:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime, Storage)

---

## Prerequisites

- **Node.js:** `v20+`
- **Docker:** Must be running locally (for Supabase containers)
- **Supabase CLI:** `supabase` (`npx supabase` or `brew install supabase/tap/supabase`)

---

## Setup Instructions

```bash
# 1. Install dependencies
npm install

# 2. Copy environment configuration
cp .env.example .env.local

# 3. Start local Supabase stack
npm run supabase:start

# 4. Start Vite dev server
npm run dev
```

> **Note:** The local database uses modern Supabase publishable keys (`VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`). Local keys are pre-configured in `.env.example`.

---

## Key Commands

| Command                   | Action                                                  |
| :------------------------ | :------------------------------------------------------ |
| `npm run dev`             | Start Vite development server (`http://localhost:5173`) |
| `npm run build`           | Run TypeScript checks and production build              |
| `npm run preview`         | Preview production build                                |
| `npm run supabase:start`  | Start local Supabase Docker containers                  |
| `npm run supabase:stop`   | Stop local Supabase containers                          |
| `npm run supabase:status` | Show local endpoints, Studio URL, and API keys          |
| `npm run format`          | Format code with Prettier                               |
| `npm run format:check`    | Check code formatting without writing changes           |

---

## Local Services

- **Supabase Studio (Dashboard):** `http://127.0.0.1:54323`
- **REST API:** `http://127.0.0.1:54321/rest/v1`
- **Auth Service:** `http://127.0.0.1:54321/auth/v1`
- **Mailpit (Local Auth Emails):** `http://127.0.0.1:54324`

---

## Project Structure

```
├── .env.example         # Environment template
├── .env.local           # Local secrets (git-ignored)
├── index.html           # Main HTML entry point
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── supabase/
│   ├── config.toml      # Local Supabase configuration
│   └── migrations/      # SQL database migrations
└── src/
    ├── main.ts          # Entry point
    ├── supabase.ts      # Shared Supabase client (`supabase`)
    ├── vite-env.d.ts    # Env variable types
    └── style.css        # Styles
```
