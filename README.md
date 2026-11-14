# Tupa app

Finnish household contract tracker (`app.tupa.fi`). React + TypeScript + Vite + Tailwind v4, Supabase (EU) for auth, Postgres and storage, deployed on Vercel.

v1 scope so far: magic-link sign-in, document upload, manual contract entry, contract list sorted by next deadline. AI extraction and reminder emails come later.

## Local setup

Requirements: Node 22+, Docker (for local Supabase), [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).

```bash
npm install
supabase start          # starts local Postgres/Auth/Storage and applies supabase/migrations
supabase status         # prints API URL and anon key
cp .env.example .env.local   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from `supabase status`
npm run dev             # http://localhost:5173
```

Sign in with any email. Locally, magic-link emails are not sent; open the Mailpit/Inbucket URL shown by `supabase status` (usually http://127.0.0.1:54324) and click the link there.

After changing a migration: `supabase db reset` (recreates the local DB from `supabase/migrations`).

Other scripts: `npm run build` (typecheck + build), `npm run lint`.

## Hosted Supabase (EU) + Vercel

1. Create the Supabase project in an EU region (Frankfurt or Stockholm).
2. `supabase link --project-ref <ref>` then `supabase db push` to apply migrations (this also creates the private `contracts` storage bucket).
3. Supabase → Authentication → URL Configuration: Site URL `https://app.tupa.fi`; add `http://localhost:5173` to redirect URLs if you test against the hosted project locally.
4. Vercel: set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. `vercel.json` rewrites all routes to the SPA.

## Structure

```
supabase/migrations/   schema, RLS policies, storage bucket + policies
src/i18n/              fi.ts (default) and en.ts — en.ts defines the shape, fi.ts is type-checked against it
src/auth/              session provider, RequireAuth route guard
src/lib/               supabase client, types, file checks, deadline sorting, config
src/pages/             Login, Contracts (list), Upload, NewContract (manual form)
```

## Data rules worth knowing

- **RLS on every table**: rows are visible only to `user_id = auth.uid()`. `reminders` is read-only for clients (service role writes it later). A contract can only reference the user's own document.
- **Storage**: private bucket `contracts`, objects at `{user_id}/{document_id}`; the first path segment must equal `auth.uid()`. Bucket limits: 10 MB, PDF/JPG/PNG/HEIC.
- **Dedupe**: the client hashes the file (SHA-256) and checks `documents` first; `unique (user_id, sha256)` is the backstop.
- **`notice_deadline`** is computed by a database trigger on insert/update: `end_date − notice_period_days` for fixed-term and auto-renewing contracts, `null` for open-ended. The client never writes it.
- **Next deadline** in the list: `notice_deadline`, else `end_date` for fixed-term contracts; contracts without one sort last.
- **Free tier**: `FREE_CONTRACT_LIMIT` (5, in `src/lib/config.ts`) active contracts. Enforced in the UI only (upload/new-contract forms are replaced by an upgrade message); there is no database limit yet.
