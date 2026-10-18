# Product Overview

**Mari Mari Equipment** is the internal admin tool for Mari Mari, an outdoor gear rental service.

## Users
One admin (the owner). No customer accounts. Single admin means no roles table.

## Pages (all private except where noted)
1. **Login**: Supabase Auth email/password. Public sign-up disabled.
2. **Dashboard**: active rentals, upcoming bookings, unpaid/DP invoices, quick stats.
3. **Equipment**: create, edit, soft-delete; image upload; price per day; total stock; category.
4. **Categories**: create, edit, delete (tent, cooking, lamp, ...). Cannot delete a category that still has equipment.
5. **Invoices**: create, view, edit, change status, print PDF, share via WhatsApp.
6. **Statistics**: revenue over time, top equipment, revenue by category, outsource profit.
7. **Public invoice view** (token link, read-only, no auth): used for WhatsApp sharing.

## Invoice builder flow
1. Enter customer name and phone.
2. Pick rent start and end date. Days are derived from the dates (end date inclusive: 10th to 12th = 3 days), with manual override allowed.
3. Add equipment from the catalog. Each line has:
   - quantity
   - unit price per day (defaults to equipment price, editable)
   - **source** checkbox: from own stock, or outsourced
4. For STOCK lines the UI shows availability for the chosen dates. If quantity exceeds availability, warn and suggest splitting: some from stock, the rest outsourced.
5. OUTSOURCE lines take supplier name and cost price per day.
6. Line total = quantity x unit price x days. Optional invoice discount.
7. Save as Draft or Booked (future) or Active (picked up now).

## Invoice lifecycle
`DRAFT -> BOOKED -> ACTIVE -> RETURNED`, and `CANCELLED` from any non-returned state.
- BOOKED = reserved for future dates (counts against availability).
- ACTIVE = customer has the gear (counts against availability).
- DRAFT, RETURNED, CANCELLED do not count against availability.

## Payment status (independent of lifecycle)
`UNPAID`, `DP`, `PAID`. Store `amountPaid` so the remaining balance is shown.

## Output
- PDF invoice (printable).
- WhatsApp share: `https://wa.me/<phone>?text=...` with a message and the public invoice link.

## Non-goals (for now)
Customer accounts, online booking, online payment, multiple admins, inventory purchasing, maintenance tracking, security deposit (only DP is used).
