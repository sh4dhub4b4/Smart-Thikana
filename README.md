# Bashabari — House Rental Platform

A modern, responsive house rental web app where **tenants** find verified homes and **landlords** list properties, message tenants, and receive simulated payments with branded digital receipts.

Built on **React 18 + TypeScript + Vite + Tailwind CSS**, with **Lovable Cloud** (Postgres + Auth + Realtime) as the backend.

## Features

**Shared**
- Role-based onboarding (Tenant / Landlord) on the homepage
- Email + password and Google sign-in
- User profiles (name, phone, avatar, bio)
- Real-time chat between tenant & landlord
- Digital agreement flow (propose → accept/reject → pay)
- Branded digital payment receipt (printable)
- Fully responsive (mobile / tablet / desktop)

**Tenant**
- Browse and filter listings (price, location, type)
- Save favorites
- View detailed property pages with landlord info
- Message and "call" landlord
- Secure payment simulation + receipt history

**Landlord**
- Dashboard with earnings & deal stats
- Create / edit / delete / hide listings
- Accept or reject rental deals
- Receive simulated payments

## Design

Theme inspired by [mygov.bd](https://www.mygov.bd):
- **Primary:** Bangladesh green `#006A4E`
- **Accent:** vermillion red `#F42A41`
- Plus Jakarta Sans (display) + Inter / Hind Siliguri (body)
- Government-style accent stripe in headers and footers

All design tokens live in `src/index.css` and `tailwind.config.ts`.

## Project Structure

```
src/
├── assets/                 # Images
├── components/
│   ├── auth/               # ProtectedRoute
│   ├── layout/             # Navbar, Footer, AppLayout
│   ├── listings/           # ListingCard
│   └── ui/                 # shadcn primitives
├── contexts/AuthContext    # Session + profile + role
├── hooks/useFavorites
├── integrations/           # Auto-generated Cloud client
├── lib/listings            # Types & helpers
└── pages/
    ├── Landing, Auth, Onboarding, Profile
    ├── TenantHome, Favorites, ListingDetail
    ├── LandlordDashboard, MyListings, ListingForm
    ├── Messages, Payment, Receipt
    └── NotFound
supabase/                   # Auto-generated config
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | Per-user profile data |
| `user_roles` | `tenant` / `landlord` (separate table for security) |
| `listings` | Property listings owned by landlords |
| `favorites` | Tenant-saved listings |
| `conversations` | One per (listing, tenant, landlord) |
| `messages` | Chat messages (realtime enabled) |
| `agreements` | Deal status: pending / accepted / rejected |
| `payments` | Simulated payments with unique receipt numbers |

All tables use Row-Level Security so users only see what they should.

## Running locally

```bash
bun install
bun run dev
```

Then open the preview URL printed in the terminal. The Lovable Cloud
backend is connected automatically — no extra setup needed.

## Notes

- Payments are **simulated** for the UI flow; no real money moves.
- Listing images are pasted as URLs (Unsplash / your CDN). A storage
  bucket can be added later if direct upload is needed.
