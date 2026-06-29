# Build Specification — Lamset Al-Malika Salon Platform

> A specification for an AI coding agent (OpenCode) to build a production-ready
> booking + e-commerce web platform for an Arabic beauty salon.
> Hand this file to the agent as the source of truth.

---

## 1. Project summary

Build a full-stack web platform for a Saudi beauty salon called **"Lamset Al-Malika"**
(Arabic: صالون لمسة الملكة). The platform lets customers browse services, book
appointments, shop salon products, and place orders. It also includes a private
admin dashboard for the salon owner to manage everything.

A working single-file HTML prototype already exists and defines the exact UX,
visual identity, and data shapes. Use it as the functional reference. This spec
turns that prototype into a real, deployable application with a backend, a
database, real payments, and authentication.

**Primary goal:** a customer can book a service or buy products end-to-end, and
the owner receives and manages those bookings/orders from a secure dashboard,
with real (Saudi) online payment.

---

## 2. Audience & language requirements

- **Primary language:** Arabic. The entire customer-facing UI is in Arabic.
- **Direction:** RTL (`dir="rtl"`, `lang="ar"`). Layout, alignment, and components
  must be fully right-to-left.
- **Locale:** Saudi Arabia (`ar-SA`). Currency is Saudi Riyal (SAR / ر.س).
  Phone numbers follow the `05XXXXXXXX` format. Dates use the local calendar
  display where reasonable.
- The admin dashboard may be Arabic as well (preferred) for consistency.
- All user-visible copy must be stored so it is easy to edit (config/constants
  or an i18n file) — the owner should be able to change service names, prices,
  and descriptions without touching component logic.

---

## 3. Tech stack (recommended)

Pick a modern, well-supported stack. Recommended default:

- **Framework:** Next.js (App Router) with TypeScript — handles frontend + API routes.
- **Styling:** Tailwind CSS with RTL support enabled.
- **Database:** PostgreSQL (managed, e.g. Supabase or Neon). Use Prisma as the ORM.
- **Authentication:** Auth for the admin only (e.g. NextAuth / Auth.js with
  credentials, or Supabase Auth). Customers do NOT need accounts to book or order
  (guest checkout), but capture name + phone on every booking/order.
- **Payments:** A Saudi payment gateway — **Moyasar** (preferred) or **Tap** or
  **Paymob**. Must support **mada**, **Apple Pay**, and credit cards. Use the
  gateway's hosted/embedded checkout and verify payment server-side via webhook.
- **Hosting:** Vercel (frontend + API) + managed Postgres. Document the deploy steps.
- **Notifications (optional but recommended):** send the owner a WhatsApp or email
  notification on each new booking/order (e.g. via a WhatsApp Business API provider
  or a transactional email service like Resend).

If you deviate from this stack, justify it briefly in the README and keep the same
capabilities.

---

## 4. Data model

Use these entities. Field names are a guide; adapt types to the ORM.

### Service
- `id` (string/uuid)
- `name` (string, Arabic)
- `description` (string, Arabic)
- `emoji` or `imageUrl` (visual)
- `priceSar` (integer, SAR)
- `durationMinutes` (integer) — display as "45 دقيقة" etc.
- `active` (boolean)

### Product
- `id`
- `name` (string, Arabic)
- `description` (string, Arabic)
- `emoji` or `imageUrl`
- `priceSar` (integer)
- `stock` (integer, optional — for inventory)
- `active` (boolean)

### Booking
- `id` (human-friendly, e.g. `BK<timestamp>`)
- `serviceId` / `serviceName` / `priceSar`
- `customerName`, `customerPhone`
- `date` (ISO date), `time` (slot string)
- `status` enum: `new | confirmed | done | cancelled`
- `paymentStatus` enum: `unpaid | paid | refunded` (if deposits are taken)
- `createdAt`

### Order
- `id` (e.g. `OR<timestamp>`)
- `items`: array of `{ productId, name, qty, priceSar }`
- `totalSar` (integer)
- `customerName`, `customerPhone`, `address`
- `paymentMethod` enum: `cod | bank_transfer | card`
- `paymentStatus` enum: `unpaid | paid | refunded`
- `status` enum: `new | processing | shipped | done | cancelled`
- `createdAt`

### Message (contact form)
- `id`, `name`, `phone`, `body`, `status` (`new | read`), `createdAt`

### Offer / Announcement (CMS content, editable by admin)
- `id`, `title`, `body`, `tag` (e.g. "-30%"), `type` (`offer | ad`), `active`

### AdminUser
- `id`, `email`/`username`, `passwordHash`, `role`

---

## 5. Customer-facing features

Mirror the existing prototype's UX. Build these sections as a single-page site
(with smooth scroll) or multi-page — your call, but keep the flow simple.

1. **Header** — sticky, with brand, nav (Services, Products, Offers, News,
   Contact), a **cart button with item count**, and a "Book now" CTA.
2. **Hero** — salon name, tagline, two CTAs (browse services / contact).
3. **Services grid** — each card shows name, description, price, duration, and a
   "Book" button that opens the booking flow.
4. **Booking flow** (modal or page):
   - Show selected service summary (name, duration, price).
   - Collect customer name + phone.
   - Date picker (no past dates).
   - Time-slot picker — show available slots; **disable slots already booked**
     for that date/service (real availability check against the DB).
   - Confirm → create Booking → if a deposit is required, route to payment →
     show confirmation screen with booking ID.
5. **Products grid** — cards with add-to-cart.
6. **Cart** (drawer) — quantity +/−, remove, live total, "Checkout".
7. **Checkout** (modal or page):
   - Collect name, phone, delivery address.
   - Choose payment method: Cash on delivery, Bank transfer, or Card/mada/Apple Pay.
   - If card → real payment via the gateway, verified server-side before the order
     is marked paid.
   - On success → create Order → confirmation screen with order ID.
8. **Offers** and **News/Announcements** sections — content pulled from DB (admin-editable).
9. **Contact form** — name, phone, message → saved as a Message + owner notified.
10. **Footer** — brand, quick links, contact info, social links.

### UX rules
- Validate inputs (required fields, phone format) with clear Arabic error messages.
- Toasts/feedback on every action (added to cart, booking confirmed, etc.).
- Fully responsive; mobile menu for narrow screens.
- Persist the cart locally so it survives a page refresh.
- Accessible: keyboard focus states, Escape closes modals, proper labels.

---

## 6. Admin dashboard (private)

Behind authentication. Owner logs in to manage the salon.

- **Login page** (email/username + password). Protect all admin routes.
- **Overview / stats:** total bookings, total orders, total messages, expected
  revenue (sum of non-cancelled bookings + orders).
- **Bookings table:** id, customer, phone, service, date, time, price, status.
  Actions: mark confirmed/done, cancel, delete. Filter by date and status.
- **Orders table:** id, customer, phone, items, address, payment method,
  payment status, total, status. Actions: advance status, cancel, delete.
- **Messages table:** view and mark read / delete.
- **Catalog management (CMS):** create/edit/delete Services and Products
  (name, price, description, image, active). Create/edit Offers and Announcements.
  This lets the owner update the site without code.
- All tables paginated and sorted newest-first.

---

## 7. Payments (critical, do it correctly)

- Integrate **one** Saudi gateway (Moyasar preferred). Support mada, Apple Pay, cards.
- **Never trust the client** for payment success. Flow:
  1. Client requests a payment session/intent from a server endpoint.
  2. Customer pays via the gateway's hosted/embedded form.
  3. Gateway calls your **webhook** (or you verify via the gateway API) server-side.
  4. Only then mark the Booking/Order `paymentStatus = paid` and finalize.
- Store the gateway transaction id on the order/booking.
- Keep all secret keys in environment variables — never commit them.
- Provide a test/sandbox mode toggle and document test cards.

---

## 8. Security & quality

- Validate and sanitize all input server-side (use a schema validator like Zod).
- Rate-limit public endpoints (booking, order, contact) to prevent spam/abuse.
- Hash admin passwords (bcrypt/argon2). No plaintext secrets anywhere.
- Use HTTPS in production; set secure cookies for admin sessions.
- Protect against the common web risks (injection, XSS, CSRF on admin actions).
- Handle errors gracefully with clear messages; never leak stack traces to users.

---

## 9. Visual identity

Match the existing prototype:

- **Palette:** deep navy background (`#0a1628` / `#0f1f38`), royal blue accent
  (`#2f7bff`), gold for premium accents (`#d4a437`), light text (`#eaf1ff`),
  muted text (`#9fb2d4`).
- **Style:** flat, modern, soft rounded corners (~14px), subtle borders, gentle
  hover lift. No heavy gradients or noise.
- **Fonts:** an Arabic web font (e.g. Tajawal) for body/UI; an optional decorative
  Arabic serif (e.g. Amiri) for the brand mark.
- **Logo:** a gem/diamond motif (💎) on a dark tile; keep the gold accent.
- Keep it elegant and feminine-premium, suited to a high-end salon.

---

## 10. Deliverables

1. Full source code in a clean repo with a clear folder structure.
2. `.env.example` listing every required environment variable (DB URL, gateway
   keys, auth secret, notification keys) with comments.
3. Database schema + migrations + a **seed script** that loads the sample
   services, products, offers, and announcements (use the prototype's data).
4. `README.md` with: local setup, how to run, how to seed, how to configure the
   payment gateway (sandbox + live), and step-by-step **deploy instructions**
   (Vercel + managed Postgres).
5. A short admin guide (in Arabic) explaining how the owner logs in and manages
   bookings, orders, and catalog.
6. Basic tests for the critical paths: create booking, create order, payment
   verification, admin auth.

---

## 11. Build order (suggested milestones)

1. Scaffold project, Tailwind + RTL, base layout, navy/gold theme.
2. Data model + migrations + seed.
3. Public site: services, products, offers, news, contact (read from DB).
4. Cart + checkout (without real payment yet) + booking flow with availability.
5. Admin auth + dashboard (tables, stats, status actions).
6. Catalog/CMS management in admin.
7. Real payment gateway integration + server-side verification (webhook).
8. Owner notifications (WhatsApp/email) on new booking/order.
9. Validation, rate limiting, security pass, tests.
10. Deploy, document, hand off.

---

## 12. Acceptance criteria (definition of done)

- A guest can book a service end-to-end and the booking appears in the admin
  dashboard, with already-booked slots blocked.
- A guest can add products to a cart and complete an order; card payment is
  verified server-side before the order is marked paid.
- The owner can log in, see stats, and change the status of bookings/orders.
- The owner can add/edit/remove a service or product and see it reflected on the
  public site without redeploying.
- The entire customer UI is Arabic, RTL, responsive, and matches the navy/gold
  identity.
- Secrets are in env vars; the repo runs locally from the README in one pass.
