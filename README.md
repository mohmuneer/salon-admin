# Glamour — Database Layer

PostgreSQL 16 schema for the **Glamour** beauty & barber platform, built from the project specification. Targets a local Postgres instance or **Supabase**.

## What's here

```
glamour-db/
├── migrations/
│   ├── 001_core.sql        extensions, ENUM types, users, salons
│   ├── 002_staff.sql       staff, working_hours, staff_leaves
│   ├── 003_catalog.sql     products, categories, services, service_products
│   ├── 004_bookings.sql    appointments, appointment_products, reviews
│   ├── 005_store.sql       cart, orders, order_items, payments, notifications
│   ├── 006_triggers.sql    functions & triggers (system logic, spec §7)
│   └── 007_rls.sql         Row Level Security policies (spec §10)
├── seed/seed.sql           realistic sample data (salon, staff, services…)
├── run.sh                  apply migrations (+ optional --seed)
├── verify.sql              post-install sanity checks
└── README.md
```

All 15 tables from the spec are present, grouped exactly as the document defines: users/salons, staff, catalog, bookings, and store/payments/notifications.

## Design choices (beyond the spec's raw SQL)

- **Native ENUM types** instead of `VARCHAR + CHECK` — stronger typing, reusable, and matches the spec's intent (`role`, `status`, `payment_method`, etc.).
- **Generated columns**: `appointments.total` and `order_items.subtotal` are `GENERATED ALWAYS AS … STORED`, so totals can never drift.
- **Foreign-key delete behaviour**: `CASCADE` where a child has no meaning without its parent (working_hours → staff), `RESTRICT` where deletion should be blocked (can't delete a service that has appointments).
- **Partial unique index** `uniq_staff_slot` prevents double-booking a staff member at the same date/time (ignoring cancelled/no-show).
- **`store_products` view** hides the `cost` column from customers.

## The four pieces of system logic (spec §7) — all implemented as triggers/functions

1. `set_appointment_end_time()` — auto-computes `end_time = start_time + service.duration_min`.
2. `decrement_stock_on_complete()` — on status → `completed`, decrements `products.stock_qty` for every session product, raises a `stock_alert` notification at/under the threshold, and blocks negative stock.
3. `refresh_staff_rating()` — recomputes `staff.rating` / `reviews_count` whenever reviews change.
4. `get_available_slots(staff, date, service)` — server-side slot generation honouring working hours, day-off, leaves, existing bookings, and past-time filtering for today.

## Run it locally

```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/glamour"
createdb glamour                 # if it doesn't exist
./run.sh --seed                  # apply migrations + sample data
psql "$DATABASE_URL" -f verify.sql
```

## Run it on Supabase

1. Create a project; copy the connection string from **Project Settings → Database**.
2. `export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[ref].supabase.co:5432/postgres"`
3. `./run.sh --seed`

> RLS policies assume `auth.uid()` equals `public.users.id` (standard Supabase pattern where the `public.users` row shares the `auth.users` id). When wiring auth, insert the `public.users` row with the same id Supabase Auth assigns.

## Verify (expected results)

`verify.sql` checks the triggers end-to-end: the seeded appointment shows `end_time = 12:00` and `total = 150.00`; available slots for tomorrow exclude the booked 11:00; completing the appointment drops serum stock 8 → 7; adding a 5★ review sets the stylist's rating to `5.00 / 1`.

## Next steps

This is the data layer. Natural follow-ups: the API endpoints from spec §9.1, the Next.js admin dashboard (§6), or the Expo customer app (§5.1). Say which and I'll build it on top of this schema.
