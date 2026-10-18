# Progress

## Decisions made
- Stack: TanStack Start, TS, Tailwind v4, shadcn/Base UI, Prisma, Supabase, TanStack Query, Zustand
- Single admin, Supabase Auth
- Derived availability, STOCK vs OUTSOURCE per invoice line (catalog items only)
- Future bookings supported
- Statuses: Draft, Booked, Active, Returned, Cancelled. Payment: Unpaid, DP, Paid
- PDF export + WhatsApp share via public token link
- End date is inclusive (10th to 12th = 3 days)
- Monochrome black/white brand for now (logo in `docs/assets/`)
- UI in Indonesian, technical terms in English (see `05-conventions.md`)
- No security deposit, only DP

## Open questions
- [ ] PDF generation approach
- [ ] Status labels in UI: keep English or translate (Booked, Active, ...)

## Build order (suggested)
1. [x] Project setup, theme.css, shadcn init
2. [x] Prisma schema + Supabase connection, migrations
3. [x] Auth: login, route guard, server auth middleware
4. [x] Categories CRUD
5. [x] Equipment CRUD + image upload
6. [x] Availability lib + tests
7. [x] Invoice builder + create/edit + status/payment
8. [x] Invoice PDF + WhatsApp share + public view
9. [x] Dashboard
10. [x] Statistics
