# Database

Postgres on Supabase, accessed via Prisma. Use the pooled URL for the app and `directUrl` for migrations.
Auth users come from Supabase Auth (single admin). No profile table needed.

## Conventions
- Money: `Int` in IDR.
- IDs: `String @id @default(cuid())` (or uuid).
- Equipment: soft delete via `deletedAt`.
- Image: store the Supabase Storage **path**, not the full URL.
- Invoice items snapshot name and price.

## Schema (draft)

```prisma
enum InvoiceStatus { DRAFT BOOKED ACTIVE RETURNED CANCELLED }
enum PaymentStatus { UNPAID DP PAID }
enum ItemSource    { STOCK OUTSOURCE }

model Category {
  id        String      @id @default(cuid())
  name      String      @unique
  slug      String      @unique
  equipment Equipment[]
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
}

model Equipment {
  id          String        @id @default(cuid())
  categoryId  String
  category    Category      @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  name        String
  description String?
  pricePerDay Int
  totalStock  Int           @default(0)   // 0 is valid for outsource-only catalog items
  imagePath   String?
  isActive    Boolean       @default(true)
  deletedAt   DateTime?
  items       InvoiceItem[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([categoryId])
  @@index([deletedAt])
}

model Invoice {
  id            String        @id @default(cuid())
  number        String        @unique          // MM-2026-0001
  publicToken   String        @unique @default(cuid()) // for WA share link, unguessable
  customerName  String
  customerPhone String
  rentStart     DateTime      @db.Date
  rentEnd       DateTime      @db.Date
  days          Int                              // derived, overridable
  status        InvoiceStatus @default(DRAFT)
  paymentStatus PaymentStatus @default(UNPAID)
  amountPaid    Int           @default(0)
  subtotal      Int
  discount      Int           @default(0)
  total         Int
  notes         String?
  items         InvoiceItem[]
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@index([status])
  @@index([rentStart, rentEnd])
}

model InvoiceItem {
  id            String     @id @default(cuid())
  invoiceId     String
  invoice       Invoice    @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  equipmentId   String
  equipment     Equipment  @relation(fields: [equipmentId], references: [id], onDelete: Restrict)
  equipmentName String                           // snapshot
  source        ItemSource @default(STOCK)
  supplierName  String?                          // OUTSOURCE only
  costPrice     Int?                             // OUTSOURCE only, per day
  quantity      Int
  unitPrice     Int                              // per day, snapshot, editable
  lineTotal     Int                              // quantity * unitPrice * invoice.days

  @@index([invoiceId])
  @@index([equipmentId, source])
}

model InvoiceSequence {
  year Int @id
  last Int @default(0)
}
```

## Business rules

**Rental days**: the end date is **inclusive**. `days = (rentEnd - rentStart) + 1`, so pickup on the 10th and return on the 12th = 3 days. Same-day = 1 day. Admin can override the derived value.

**Availability** (derived, never stored):
```
available(equipment, start, end) =
  equipment.totalStock
  - SUM(item.quantity)
    WHERE item.source = STOCK
      AND item.equipmentId = equipment.id
      AND invoice.status IN (BOOKED, ACTIVE)
      AND invoice.rentStart <= end
      AND invoice.rentEnd   >= start     -- inclusive overlap: a return on the 12th still blocks a new rental on the 12th
```
When editing an invoice, exclude that invoice from the sum. Re-check availability inside the save transaction to avoid double-booking.

**Outsourced items** never count against stock. Profit on a line = `(unitPrice - costPrice) * quantity * days`.

**Invoice number**: generated inside a transaction using `InvoiceSequence` (increment per year), format `MM-YYYY-NNNN`.

**Totals**: `subtotal = SUM(lineTotal)`, `total = subtotal - discount`. Compute on the server, never trust client totals.

**Payment**: `UNPAID` when amountPaid = 0, `DP` when 0 < amountPaid < total, `PAID` when amountPaid >= total. Derive on the server when payment is recorded.

**Deletes**
- Equipment: soft delete. Items keep the reference.
- Category: blocked if it has equipment.
- Invoice: prefer CANCELLED over deleting.

**Public access**: `publicToken` allows a read-only invoice view/PDF without auth. Return only customer-facing fields. Never expose `costPrice`, `supplierName`, or profit.

**Security**: Prisma bypasses RLS. Enforce auth in server function middleware. Disable public sign-ups in Supabase. Keep the Storage bucket policies restrictive (admin write, public read only if images must show on the public invoice).
