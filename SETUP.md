# Bashabari — Setup & Deployment Guide

A complete guide to running the Bashabari house-rental platform locally and deploying it to production. This project uses **Lovable Cloud** (a managed Postgres + Auth + Realtime + Storage backend) so there is **no Docker required**.

---

## 1. Prerequisites

| Tool | Version | Why |
|------|---------|-----|
| **Node.js** | ≥ 20 | Vite dev server & build |
| **Bun** *(or npm)* | latest | Faster install + scripts |
| **Git** | any | Version control |

> Windows users without Bun can use `npm install` + `npm run dev` everywhere instead.

---

## 2. Clone & install

```bash
git clone <your-fork-url> bashabari
cd bashabari
bun install        # or: npm install
```

---

## 3. Environment variables (`.env`)

The project ships with a managed `.env` file already populated by Lovable Cloud. **Do not edit it manually** — it is regenerated on every Lovable build.

It defines:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...   # safe to expose, anon key
VITE_SUPABASE_PROJECT_ID=...
```

If you fork the repo and want to point at your **own** Supabase project, replace these values in your hosting provider's environment-variables panel (Vercel / Netlify / etc.). Never commit secrets.

---

## 4. Run locally

```bash
bun run dev          # starts Vite on http://localhost:5173
```

Open the printed URL — the app talks directly to the hosted backend, no further setup needed. Hot-reload works for everything in `src/`.

---

## 5. Database overview

All schema changes live in `supabase/migrations/*.sql` and are applied automatically by Lovable Cloud. The current schema includes:

| Table | What it stores |
|-------|----------------|
| `profiles` | Per-user name, phone, avatar, business_name, bio |
| `user_roles` | Separate table to avoid privilege-escalation (`tenant` / `landlord`) |
| `listings` | Properties with **full BD address hierarchy** (16 location columns) |
| `divisions`, `districts`, `thanas` | Public lookup tables — all 8 divisions, 64 districts, 200+ thanas |
| `favorites` | Tenant ↔ listing bookmarks |
| `conversations`, `messages` | Realtime tenant ↔ landlord chat |
| `agreements` | Deal lifecycle: `pending` → `accepted` / `rejected` |
| `payments` | Simulated rent payments (used for receipts **and** auto rental history) |
| `kyc` | NID number + uploaded NID front/back/selfie URLs |
| `feedback` | Peer-only reviews (landlord ↔ landlord, tenant ↔ tenant) |
| **view** `rental_history` | Auto-derived view of completed payments |
| **rpc** `get_tenant_rental_history(uuid)` | Security-definer fn so landlords can pull a tenant's full history by User ID |

Storage:

* `kyc-docs` — **private** bucket. Each user can only read/write inside `<user_id>/...` (enforced by RLS policies on `storage.objects`).

Realtime publication includes `messages` so the in-app + browser notification system works instantly.

---

## 6. Project structure

```
src/
├── assets/                 # Static images
├── components/
│   ├── auth/               # ProtectedRoute (role-gated)
│   ├── layout/             # Navbar (with unread badge), Footer, AppLayout
│   ├── listings/           # ListingCard
│   └── ui/                 # shadcn primitives
├── contexts/AuthContext    # Session + profile + role
├── hooks/
│   ├── useFavorites
│   └── useMessageNotifications  # Realtime unread counter + toast + browser push
├── integrations/supabase/  # Auto-generated client + types (do NOT edit)
├── lib/
│   ├── listings            # Types + `formatAddress` helper
│   └── bd-locations        # Division/district/thana fetchers + Haversine
└── pages/
    ├── Landing, Auth, Onboarding, Profile
    ├── TenantHome          # "Near me" + "By location" cascading filters
    ├── Favorites, ListingDetail
    ├── LandlordDashboard, MyListings, ListingForm  # 4-section BD schema
    ├── Messages            # Realtime chat + agreement strip
    ├── Payment, Receipt
    ├── Kyc, Feedback
    ├── RentalHistory       # /history (own) and /history/:userId (landlord lookup)
    └── TenantLookup        # Landlord-only search by tenant User ID
```

---

## 7. Feature walk-through

### Landlord side

1. **Register a property** (`/landlord/listings/new`) — four guided sections:
   1. **Administrative**: Division → District → Thana cascade, optional City Corp / Ward / Zone
   2. **Localized address**: Moholla, Block, Road, Avenue
   3. **Unique keys**: Holding number (mandatory for tax records), House name, Floor & Unit
   4. **Verification**: Landmarks, Plus Code/URL, Building type, **GPS capture button**
2. **Browse messages** (`/messages`) — sender's avatar, name, and role chip are always visible at the top of the active chat. Realtime + browser notifications on new incoming messages.
3. **Tenant lookup** (`/tenant-lookup`) — paste a tenant's User ID (they copy it from their Profile page) to view their auto-generated rental history at `/history/:userId`.
4. **Profile** (`/profile`) — edit name, phone, avatar, business name, bio. The full **User ID is shown and copyable** for peer feedback.
5. **KYC** (`/kyc`) — upload NID front/back + selfie to a private bucket.
6. **Peer feedback** (`/feedback`) — only other **landlords** can read your reviews of tenants (and vice-versa).

### Tenant side

1. **Browse** (`/tenant`) — two modes:
   - **Near me** (default if browser geolocation succeeds): listings sorted by Haversine distance from current GPS.
   - **By location**: cascading **Division → District → Thana** dropdowns drive the filter set.
2. **Listing detail** — every structured field the landlord entered (16 columns) is shown in a clean *Property details* card, plus a Google Maps link if coordinates were captured.
3. **Message landlord** — fixed: this now reliably opens or creates a conversation and lands you in `/messages?c=<id>`.
4. **Call landlord** — uses the native `tel:` dialer.
5. **Profile** — same edit options as landlord; User ID is visible & copyable so landlords can review you and look up your rental history.
6. **Rental history** (`/history`) — auto-populated as soon as a payment is completed; viewable to you and to any landlord who knows your User ID.

---

## 8. Notifications

* **In-app toast + unread badge** on the Messages icon — powered by `useMessageNotifications` (Supabase Realtime channel `user-messages:<uid>`).
* **Browser notifications** — on first load the app asks for `Notification` permission. If granted, a system notification fires for each new message while the tab is open.
* **Background push (closed-tab)** — *not implemented in the MVP*; would require a service worker + FCM/APNs and is intentionally out of scope (Lovable previews disable service workers by default).

---

## 9. Deployment

Because there is no Docker or self-hosted backend, deployment is just a static frontend:

### Recommended: Vercel

1. Push the repo to GitHub.
2. Go to https://vercel.com → **Add New Project** → import.
3. Framework preset: **Vite**. Build command: `bun run build` (or `npm run build`). Output dir: `dist`.
4. Add environment variables (copy from your local `.env`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
5. Deploy. Done.

### Alternative: Netlify

Same idea — drag-and-drop the `dist/` folder, or connect the repo and set the same three env vars.

### Backend

The Lovable Cloud backend is **already hosted**. No deploy step. To inspect it, open the Lovable editor → Connectors → Lovable Cloud.

---

## 10. Common operations

### Add a new schema change

Use Lovable's database migration tool inside the editor. Each migration is saved as a timestamped file in `supabase/migrations/`. Schema changes auto-regenerate `src/integrations/supabase/types.ts` — never edit that file by hand.

### Reset the local dev cache

```bash
rm -rf node_modules .vite
bun install
bun run dev
```

### Run tests

```bash
bun run test       # vitest
```

---

## 11. Troubleshooting

| Symptom | Fix |
|---------|-----|
| "Message landlord" does nothing | Make sure you're signed in with a **tenant** role (Onboarding sets this). The button is disabled for landlords by design. |
| Dropdowns empty | Check the network tab for `divisions` / `districts` / `thanas` 200 responses. The lookup tables are seeded for all 64 districts; if you self-host Supabase, re-run the migration that seeds them. |
| Browser notifications not appearing | Visit `chrome://settings/content/notifications` and ensure the site is allowed. Some browsers also require the page to be on HTTPS. |
| Geolocation never resolves | The browser denies it on `http://` (non-localhost). Use `localhost` or HTTPS. |
| "Cannot read images" on listing | Image URLs must be publicly reachable (Unsplash, your CDN). The `kyc-docs` bucket is **private** by design and is not used for listing photos. |

---

## 12. Security notes

* Roles live in a **separate `user_roles` table** with a `has_role()` security-definer function — this prevents the classic "set yourself to admin via profile.update" attack.
* Every table has Row-Level Security; tenants and landlords can only see their own data, except the public lookup tables (`divisions`, `districts`, `thanas`).
* The peer-feedback policy is strict: a landlord can never read what other landlords have written about *them* (only what they've written about tenants), and vice-versa.
* KYC images are stored in a private bucket; only the owner can read their own files.
* `.env` only contains the **publishable** anon key. The service-role key lives in Lovable Cloud secrets and is never shipped to the browser.

---

Built with ❤️ for the Bangladesh rental market.
