# Conventions

## Naming
- Files: `kebab-case.ts(x)`. Components: `PascalCase`. Server functions: `verbNoun` (`createEquipment`, `listInvoices`), in `*.fn.ts`.
- Zod schemas: `equipmentCreateSchema`, `equipmentUpdateSchema`; infer types from them.
- Prisma enums are UPPER_SNAKE; reuse them via the generated types, never redefine.

## Query keys
Hierarchical, defined in each feature's `queries.ts`:
`['equipment', 'list', filters]`, `['equipment', 'detail', id]`, `['invoices', 'list', filters]`, `['availability', equipmentId, start, end]`, `['stats', 'revenue', range]`.
Invalidate by prefix after mutations.

## Errors
- Server functions throw typed errors (validation, not found, conflict such as insufficient stock). Map them to user-friendly messages in the UI.
- Never leak Prisma or Supabase error text to the client.

## Validation
- One Zod schema per input, shared between form and server function.
- Forms: validate client-side for UX, always re-validate on the server.

## Money and dates
- Money is `Int` IDR. Format only with `formatIDR`.
- Rental dates are date-only (`@db.Date`). Use the timezone `Asia/Jakarta` for "today" and display. Avoid `new Date()` comparisons that mix UTC with local dates.

## Language
- Code, comments and docs are in English.
- **UI copy is Indonesian**, but technical/business terms stay in English (e.g. Dashboard, Invoice, Stock, Outsource, DP, Login).
- Dates and numbers use the `id-ID` locale (`10 Okt 2026`, `Rp 150.000`).
- No i18n library. Keep UI labels in one place (`src/lib/labels.ts`) so wording is easy to change, especially enum labels.
- Proposed glossary (edit freely):

| Concept | UI text |
|---|---|
| Dashboard, Invoice, Stock, Outsource, Login, DP | kept in English |
| Category / Equipment | Kategori / Equipment |
| Customer / Phone | Pelanggan / No. HP |
| Rent start / end / days | Tanggal mulai / Tanggal selesai / Jumlah hari |
| Price per day | Harga per hari |
| Save / Edit / Delete / Cancel | Simpan / Edit / Hapus / Batal |
| Status: DRAFT, BOOKED, ACTIVE, RETURNED, CANCELLED | Draft, Booked, Active, Returned, Cancelled (OPEN: keep English or translate) |
| Payment: UNPAID, DP, PAID | Belum Bayar, DP, Lunas |

## Testing (minimum)
Unit-test the pure logic: rental days, line totals, payment status derivation, availability overlap, phone normalization, invoice number format.

## Git
Small commits, one feature per branch. Update `docs/progress.md` when a feature is completed.
