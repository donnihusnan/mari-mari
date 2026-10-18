# Mari Mari Equipment

Admin-only web app for Mari Mari, an outdoor equipment rental service (Indonesia). Single admin. All routes private except the tokenized public invoice view.

## Stack

- TanStack Start + TypeScript
- Tailwind CSS (latest, v4, tokens via `@theme`)
- shadcn/ui (Base UI variant)
- Prisma + Supabase (Postgres, Auth, Storage)
- TanStack Query (server state) + Zustand (UI/draft state only)
- Zod for all validation

## Golden rules

1. **Never guess APIs. Use the MCPs first:**
   - shadcn MCP: look up and add components. Do not write them from memory.
   - Prisma MCP: schema and migrations.
   - Supabase MCP: auth, storage, DB inspection.
   - TanStack Start has no MCP. Run `npx @tanstack/cli search-docs "<topic>" --library start --json` before writing any Start code (routing, server functions, middleware).
   - If an MCP or the CLI is unavailable or fails, say so. Do not fall back to guessing.
2. **Colors and radius come only from design tokens** (see `docs/04-design-system.md`). No hardcoded hex/Tailwind palette colors in components.
3. **Server state in TanStack Query. Zustand only for UI state and the invoice builder draft.**
4. **All mutations go through server functions** with Zod validation and the auth middleware. Prisma bypasses RLS, so authorization lives in server functions.
5. **Money is `Int` in IDR.** Never float.
6. **Invoice items snapshot** equipment name and unit price. Past invoices must never change when the catalog changes.
7. **Equipment is soft-deleted** (`deletedAt`). Never hard-delete equipment that has invoice items.
8. **Stats are computed from queries.** Do not add stat tables.
9. **UI copy is Indonesian, technical terms stay English** (Invoice, Dashboard, Stock...). Labels live in `src/lib/labels.ts`. Format dates/money with `id-ID`.
10. **Rental days are inclusive**: `days = (end - start) + 1`.

## Supabase

- Project ref: msvpzdelaumndpekeaxa (mari-mari-equipment). Only operate on this project via the Supabase MCP.
- Never run write operations on any other project.

## Docs (read only what the task needs)

- `docs/01-product-overview.md`: scope, features, flows
- `docs/02-architecture.md`: folders, routing, server function patterns
- `docs/03-database.md`: schema and business rules
- `docs/04-design-system.md`: tokens and component rules
- `docs/05-conventions.md`: naming, errors, query keys
- `docs/progress.md`: done / next
