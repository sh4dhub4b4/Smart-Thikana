
## Goal
- Deploy the Smart Thikana web app on Render (Level 1) and fix all logical/technical/UI-UX bugs across the codebase.

## Constraints & Preferences
- Level 1 deployment: static site on Render, free tier, stateless
- Mobile workspace removed from root workspaces to avoid Expo dependency failures during build
- Supabase email confirmation disabled for instant signup
- Changed `bashabari` references → `Smart Thikana` branding

## Progress
### Done
- Created `public/_redirects` for SPA routing
- Created `render.yaml` with static site config
- Removed `routes` from `render.yaml` (was blocking CSS/JS asset delivery)
- Removed `mobile` from root `package.json` workspace (blocked build with unresolvable `expo-local-authentication`)
- Regenerated corrupted `src/integrations/supabase/types.ts` from live Supabase project
- Fixed brand text in `Auth.tsx` (2 locations)
- Renamed `bashabari:intendedRole` → `smartthikana:intendedRole`
- **Auth.tsx**: Session check after signup, try/catch/finally, error handling on DB writes, deep-link redirect support, `setSubmitting(false)` on early return, OAuth `intendedRole` uses `localStorage` (survives cross-tab redirects), input validated against enum
- **Onboarding.tsx**: try/catch/finally; `localStorage` instead of `sessionStorage`; error code matching (`code !== '23505'`) instead of string match
- **RentalHistory.tsx**: Removed non-existent `kyc_status` column; fetches from `kyc` table instead; removed `as any` cast on kycData
- **Receipt.tsx**: Fixed broken links `/LandlordDashboard` → `/landlord`; fixed inverted error/data logic; added `toFixed(2)` to prevent NaN propagation on formatted amounts; NaN guard on amount
- **TenantLifeCycle.tsx**: Removed non-existent `start_date`/`end_date` columns; uses `created_at`; added toast.error on DB error
- **Favorites.tsx**: Added `.eq("is_active", true)`; added cancelled guard + try/catch to async IIFE
- **LandlordDashboard.tsx**: Switched `Promise.all` → `Promise.allSettled`; guard against `landlord_id=eq.undefined` in Realtime filter
- **useFavorites.ts**: True optimistic updates; full DB re-fetch on error (handles rapid toggle clicks)
- **Payment.tsx**: `billing_month` stores `YYYY-MM`; `calculateTaxAutoCut` called once instead of 5×; cancelled guard + try/catch on async IIFE; error handling on agreement update & message insert; card validation tolerates spaces
- **Messages.tsx**: Conversations query filtered by user + limited to 50; try/finally in send(); cancelled guard on conversation/message load; `clearUnread` only on page mount
- **Feedback.tsx**: `.eq("author_role", role)` filter + role dep; UUID regex validation on subject_id
- **AuthContext.tsx**: `loadProfileAndRole` in try/catch; `onAuthStateChange` `.catch(console.error)`; timeout cleanup on unmount; deferred profile load gated on `SIGNED_IN`/`TOKEN_REFRESHED` only
- **App.tsx**: `/history/:userId` requires `landlord` role; removed duplicate `<Toaster />` (was rendering both shadcn + sonner)
- **Kyc.tsx**: Saves public URL not storage path; MIME type validation on document upload; cancelled guard on async IIFE
- **bd-locations.ts**: All 3 fetch functions log errors to console
- **useMessageNotifications.ts**: Function updater `n => n + 1` for unread counter; unread reset on user change; notification permission error logged
- **AdminDashboard.tsx**: User-facing error message on query failure
- **ListingForm.tsx**: `landlord_id` guard on edit; MIME type validation on image upload; price now clearable type `number | ""`; Zod validates `property_type`; cancelled guard on load
- **supabase/client.ts**: Validates env vars at init, throws early if missing
- **use-toast.ts**: Fixed `[state]` → `[]` in useEffect deps (prevents listener churn)
- **Tax-engine.ts**: `net_to_landlord` clamped to `Math.max(0, ...)` to prevent negative values
- **ListingDetail.tsx**: `lat=0` falsy → explicit null check; `Link to="#"` replaced with `<div>` to avoid hash navigation; cancelled guard on async IIFE
- **HomeServices.tsx**: Incorrect `.eq('listings.thana', userArea)` filter restructured to client-side filter after fetch; full error handling + toast on DB failure; `!inner` join for cross-table filter
- **MyListings.tsx**: Silent fetch failure now shows toast; `user?.id` dependency added to useEffect
- **TenantHome.tsx**: Error state with message on query failure; cancelled guard + try/catch on listing load
- **Profile.tsx**: Error state + retry button instead of infinite spinner when profile load fails
- **use-mobile.tsx**: Initialized with correct value instead of `undefined` (prevents layout flash)
- **ServiceBookingFlow.tsx**: `Provider` interface uses `Pick<ServiceProvider, ...>` from `services-api.ts` instead of standalone local type; unused `company_name` variable removed
- **ServicesDashboard.tsx**: `any` types replaced with `ServiceProvider` on provider state and handler param; unused `mapPinIcon` variable removed
- **services-api.ts**: `ServiceProvider` interface now includes `thana`, `district`, `service_categories` fields
- **TenantRentHistory.tsx**: Timezone-safe `billing_month` parsing; null `payment_id` link hidden; cancelled guard on load
- **ListingCard.tsx**: Image `onError` handler with fallback (avoids broken image icon); respects `dataset.fallback` to prevent infinite loop
- **Schema & types migration**: Added `rent_invoices`, `kyc`, `ledger_entries`, `tax_transactions` tables + `invoice_status`, `entry_type`, `kyc_status` enums + `"active"` to `agreement_status` + `invoice_id`/`tax_deducted` columns on `payments` + RLS policies + realtime
- Created new migration file: `supabase/migrations/20260620000000_add_missing_tables.sql`
- Updated `src/integrations/supabase/types.ts` with all missing table types and enums
- Pushed all fixes to GitHub (Render auto-deploys)

### In Progress
- *(none)*

### Blocked
- *(none)*

## Key Decisions
- **Frontend-only on Render**: Using existing cloud Supabase instead of self-hosting backend, since `.env` already pointed to Supabase cloud
- **`_redirects` over `render.yaml` routes**: `_redirects` only rewrites non-file paths; `render.yaml` routes with `/*` blocked CSS/JS assets
- **New Supabase project**: Old project non-existent (deleted/paused). New project: `lhezrcwbijxuzsonxqqk`
- **Email confirmation OFF**: Users sign in immediately without clicking confirmation link
- **Schema gaps fixed systematically**: Rather than removing code that referenced non-existent DB objects, the correct fix was to add the missing tables/columns/enums to the SQL schema + create a migration + update types.ts
- **`localStorage` for `intendedRole`**: `sessionStorage` is cleared by browser tab context on OAuth redirect; `localStorage` survives the cross-origin redirect flow
- **`!inner` join for cross-table filters**: Supabase doesn't support `.eq('listings.thana', ...)` on a regular join; `!inner` forces an INNER JOIN so the parent table's column is filterable
- **`Math.max(0, ...)` for net_to_landlord**: Prevents negative values when deductions exceed gross rent (e.g. advance tax + TDS + platform fee > rent amount)

## Next Steps
- *(none)*

## Critical Context
- Build command: `npm run build` (Render runs `bun install` automatically, then the build command)
- Publish directory: `dist`
- Supabase project ID: `lhezrcwbijxuzsonxqqk`
- Supabase URL: `https://lhezrcwbijxuzsonxqqk.supabase.co`
- App live at `https://smart-thikana.onrender.com`
- `.env` is tracked by git (contains new Supabase credentials)
- `render.yaml` env vars set to `sync: false` (values set manually in Render dashboard)
- The `30_day_payment_for_landlords` view exists but `agreements.rent_due_day` may be null for existing rows
- Build passes with zero errors (1823+ modules transformed, 0 warnings)

## Relevant Files
- `public/_redirects`: SPA routing — `/* /index.html 200`
- `render.yaml`: Static site config with env vars
- `src/integrations/supabase/types.ts`: Updated with all missing table types + enums
- `src/integrations/supabase/client.ts`: Env var validation at init
- `src/pages/Auth.tsx`: Sign in/up with localStorage intendedRole, deep-link redirect, error handling
- `src/pages/Payment.tsx`: Fixed billing_month, redundant tax calls, cancelled guard, error handling, card space-tolerant validation
- `src/pages/Messages.tsx`: Filtered conversations, try/finally send, cancelled guard, clearUnread on mount
- `src/pages/Feedback.tsx`: Role filter + UUID validation
- `src/pages/Kyc.tsx`: Public URL storage, MIME validation
- `src/pages/ListingForm.tsx`: landlord_id guard, price clearable, property_type Zod validation, MIME validation
- `src/pages/Receipt.tsx`: Fixed error/data logic, NaN prevention with toFixed(2) and guard
- `src/pages/TenantLifeCycle.tsx`: Added toast.error on DB error
- `src/pages/MyListings.tsx`: Toast on fetch failure, user?.id dep
- `src/pages/HomeServices.tsx`: !inner join, client-side filter fix, error handling
- `src/pages/ListingDetail.tsx`: lat/lng null check, removed invalid Link, cancelled guard
- `src/pages/TenantHome.tsx`: Error state display, cancelled guard
- `src/pages/Profile.tsx`: Error state with retry button
- `src/pages/TenantRentHistory.tsx`: Timezone-safe billing_month, null payment_id guard, cancelled guard
- `src/pages/AdminDashboard.tsx`: User-facing error message
- `src/pages/RentalHistory.tsx`: Removed non-existent kyc_status column, fetches from kyc table
- `src/contexts/AuthContext.tsx`: Timeout cleanup, event-gated defer, try/catch profile load
- `src/hooks/useFavorites.ts`: Full re-fetch rollback on error
- `src/hooks/useMessageNotifications.ts`: Function updater, unread reset, notification error logging
- `src/hooks/use-toast.ts`: Fixed `[state]` → `[]` deps
- `src/hooks/use-mobile.tsx`: Initialized with window width, not undefined
- `src/lib/bd-locations.ts`: Error logging on all fetchers
- `src/lib/tax-engine.ts`: Clamped net_to_landlord to 0
- `src/components/listings/ListingCard.tsx`: Image onError handler with dataset guard
- `src/components/auth/ProtectedRoute.tsx`: Role guard on children
- `src/features/services/services-api.ts`: ServiceProvider interface with thana, district, service_categories
- `src/features/services/ServicesDashboard.tsx`: any→ServiceProvider types
- `src/features/services/ServiceBookingFlow.tsx`: Pick<ServiceProvider> instead of local type
- `backend/volumes/db/01-schema.sql`: Full DB schema — added rent_invoices, kyc, ledger_entries, tax_transactions, payment extensions, plan types
- `supabase/migrations/20260620000000_add_missing_tables.sql`: Migration for all missing tables + enums + columns
