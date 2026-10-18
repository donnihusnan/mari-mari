# Architecture

> TanStack Start APIs change. Before implementing any item below, run
> `npx @tanstack/cli search-docs "<topic>" --library start --json`
> (topics: "server functions", "middleware", "file-based routing", "route guards / beforeLoad", "environment variables").
> The structure below is the intent. Verify exact API names against the docs.

## Folder structure

```
src/
  routes/
    __root.tsx
    login.tsx                     # public
    invoice/$token.tsx            # public, read-only (WhatsApp link)
    _admin.tsx                    # layout + auth guard (beforeLoad)
    _admin/
      index.tsx                   # dashboard
      equipment/                  # list, new, $id edit
      categories.tsx
      invoices/                   # list, new, $id
      statistics.tsx
  features/
    equipment/
      components/                 # feature-specific UI
      server/                     # server functions (*.fn.ts)
      schemas.ts                  # Zod schemas shared client/server
      queries.ts                  # queryOptions + query keys
    categories/ invoices/ statistics/ auth/
  components/
    ui/                           # shadcn components (added via shadcn MCP only)
    shared/                       # app-wide composed components
  lib/
    prisma.ts                     # server-only Prisma client singleton
    supabase.server.ts            # server-only Supabase client
    supabase.client.ts            # browser client (auth session only)
    money.ts                      # formatIDR, helpers
    dates.ts                      # rental day calculation
    availability.ts               # availability query (server-only)
    invoice-number.ts
  stores/                         # Zustand stores (UI + invoice draft)
  styles/
    theme.css                     # design tokens, the single place for brand colors
    app.css
prisma/
  schema.prisma
```

## Layering rule
`route -> feature component -> query/mutation hook -> server function -> lib (prisma, supabase)`
- Components never import Prisma or server-only modules.
- Server-only files use a `.server.ts` suffix or live under `server/`.

## Auth flow
- Supabase Auth email/password. Public sign-up disabled in Supabase settings.
- `_admin.tsx` guard redirects to `/login` when there is no session.
- Server functions use an **auth middleware** that validates the Supabase session. Public registration is disabled in Supabase, so any authenticated user in the project's Supabase Auth is an authorized admin. Route guards are UX only. Middleware is the real security.
- `/login` and `/invoice/$token` are the only public routes.

## Server function pattern
1. Auth middleware
2. Zod `inputValidator`
3. Business logic (in a Prisma transaction when it writes multiple rows)
4. Return plain serializable data (no Prisma class instances, no BigInt/Date surprises)

Invoice create/update must, inside one transaction: re-check availability for STOCK lines, recompute days, line totals, subtotal and total, derive payment status, and generate the invoice number.

## Data fetching
- Reads: `queryOptions` per feature in `queries.ts`; prefetch in route loaders where it helps.
- Writes: `useMutation` calling server functions, then invalidate the relevant query keys.
- Zustand: only the invoice builder draft (items, custom prices, source flags), sidebar/UI state. Never cache server data in Zustand.

## Images
- Upload to Supabase Storage (bucket `equipment`). Store the path in `Equipment.imagePath`.
- Validate type (jpeg/png/webp) and size (e.g. max 2 MB) before upload. Prefer resizing client-side.

## PDF and WhatsApp
- PDF: generated from the invoice data. Library choice is OPEN (server-side vs. print-friendly HTML + browser print). Decide before building.
- WhatsApp: build `https://wa.me/<normalized phone>?text=<encoded message>`. Normalize Indonesian numbers (`08...` -> `628...`). Message includes the public link `/invoice/<publicToken>`.

## Environment variables
`DATABASE_URL` (pooled), `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
