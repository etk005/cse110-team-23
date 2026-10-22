<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Development Guide & Project Instructions

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI & Styling:** React 19, Tailwind CSS v4, shadcn/ui (`base-nova` preset, Lucide icons)
- **Backend & Auth:** Supabase (`@supabase/supabase-js`, `@supabase/ssr`, Supabase CLI)
- **Code Quality & Formatting:** TypeScript, ESLint, Prettier (`prettier-plugin-tailwindcss`)

---

## General Setup Instructions

### 1. Prerequisites

- **Node.js** (v20+ recommended) and `npm`
- **Docker Desktop** (must be running for local Supabase development)
- **Supabase CLI** (installed via Homebrew: `brew install supabase/tap/supabase` or npm)

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Code Quality & Verification

Always run these checks before submitting PRs or commits:

```bash
# Type check without emitting files
npx tsc --noEmit

# Lint check
npm run lint

# Format check / auto-format
npm run format:check
npm run format

# Production build check
npm run build
```

---

## UI Components (shadcn/ui)

This project is configured with the latest **shadcn/ui** with native **Tailwind CSS v4** support:

- Configuration: `components.json`
- UI Components: `components/ui/`
- Helper utilities: `lib/shadcn-ui.ts` (`cn`)

To add new shadcn components:

```bash
npx shadcn@latest add <component-name>
# Example:
npx shadcn@latest add dialog dropdown-menu input card
```

---

## Code Formatting (Prettier)

This project uses **Prettier** along with **`prettier-plugin-tailwindcss`** to enforce consistent formatting and automatically sort Tailwind utility classes:

- Configuration: `prettier.config.mjs`
- Ignored files: `.prettierignore`
- Commands:
  - `npm run format:check`: Verifies that all files conform to the Prettier code style without writing changes.
  - `npm run format`: Formats all files across the project in-place.

---

## Supabase Local Development

### 1. Architecture & Conventions

In this project, Supabase utilities are placed in `lib/supabase/` (not `utils/`):

- `lib/supabase/client.ts`: Supabase client for Client Components (`createBrowserClient`).
- `lib/supabase/server.ts`: Supabase client for Server Components, Server Actions, and Route Handlers (`createServerClient` with `await cookies()`).
- `lib/supabase/proxy.ts` and `proxy.ts`: Next.js 16 Proxy layer for automatic session token refreshing using `supabase.auth.getClaims()` and cookie forwarding. _(Note: Next.js 16 renamed `middleware.ts` to `proxy.ts`)_.

### 2. Starting Local Supabase

Ensure Docker Desktop is running, then run:

```bash
supabase start
```

This starts local Postgres, Auth, Storage, Studio, and Mailpit containers.

Local services:

- **Studio (Local Dashboard):** [http://127.0.0.1:54323](http://127.0.0.1:54323)
- **Mailpit (Email Testing):** [http://127.0.0.1:54324](http://127.0.0.1:54324)
- **REST API:** `http://127.0.0.1:54321`
- **Postgres Database:** `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

To view credentials and service status at any time:

```bash
supabase status
```

To stop local Supabase containers when done:

```bash
supabase stop
```

### 3. Environment Variables (`.env.local`)

Create or verify `.env.local` in the project root:

**For local Docker development:**

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<local-publishable-key-from-supabase-status>
```

**For hosted cloud project development:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<cloud-publishable-key>
```

_(Note: `.env*` is gitignored to prevent accidental credential commits.)_

### 4. Migrations & Cloud Synchronization

The project is configured to link to the team's cloud Supabase project (`mzpezwwwybwuqdngrgap`).

| Task                                           | Command                                                           |
| :--------------------------------------------- | :---------------------------------------------------------------- |
| **Pull schema from cloud**                     | `supabase db pull`                                                |
| **Apply migrations to local DB**               | `supabase db reset`                                               |
| **Create blank migration**                     | `supabase migration new <migration_name>`                         |
| **Generate migration from local Studio edits** | `supabase db diff -f <migration_name>`                            |
| **Push migrations to cloud**                   | `supabase db push`                                                |
| **Generate TypeScript types**                  | `supabase gen types typescript --local > types/database.types.ts` |

---

## Secrets, Permissions & Contacting Ethan

Reach out to **Ethan** if you need:

- **Cloud Project Access:** An invite to the team's Supabase organization for project `mzpezwwwybwuqdngrgap` so you can run `supabase link` and push/pull migrations.
- **Secrets & API Keys:** Supabase service role keys (`SUPABASE_SECRET_KEY`), database passwords, or third-party API credentials needed for staging or production.
- **Architectural & Schema Questions:** Database schema design decisions, permission/RLS policies, or questions about the overall infrastructure.
