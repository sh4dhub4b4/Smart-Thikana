
## Bugs found from code + DB review

> Note: external Supabase project (`cmhafyhcvopeqlsewdpp...`) isn't reachable from this sandbox. The app is on Lovable Cloud (`yhxfdmcbydfilezoruux`). All fixes below apply to the connected backend; if you want to switch to your own Supabase, that's a separate migration.

### Critical

1. **Tenant browse shows nothing & dropdowns feel broken**
   - DB has **0 listings** but **570 thanas / 64 districts / 8 divisions** seeded. The page is functioning — there's just no data.
   - Default tab is `Near me`, which is **disabled until geolocation resolves**, leaving the user looking at a non-interactive tab. If the browser blocks location, the user is stuck on a tab they can't use.
   - Fix: when geolocation denied/unavailable, auto-switch `mode` to `by_location` and show a hint banner. Always keep the location filter visible (don't hide it behind the tab).

2. **`useMessageNotifications` is mounted twice** (Navbar + Messages page) — every incoming message triggers two toasts and double-increments the unread badge.
   - Fix: move the subscription side-effect into a single mount point (Navbar only) and have the Messages page only call `clearUnread()`.

3. **Google OAuth users land without a role** → `requireRole` redirects bounce them to `/tenant`/`/landlord` they don't have access to. `Onboarding` reads `sessionStorage("bashabari:intendedRole")` but never enforces a fallback if the key is missing.
   - Fix: `ProtectedRoute` should send role-less users to `/onboarding` instead of looping. Verify `Onboarding.tsx` writes `user_roles` row reliably.

4. **"Message Landlord" can silently fail when conversation already exists with a different listing.** The lookup uses `(listing_id, tenant_id)` — fine — but the `.maybeSingle()` will throw on duplicates if the tenant ever messaged the same landlord on multiple listings under one row (not the schema, but worth a `.limit(1)` guard).

### Medium

5. `ListingForm` cascading dropdowns: when editing an existing listing, the Division loads but District/Thana selects render `disabled` for one tick before lookup completes — causes the saved value to appear blank. Fix: keep selects enabled while value is non-empty.
6. `TenantHome` search box filters on title/area/thana/district but **not on division** — minor UX gap.
7. `RentalHistory` for landlord viewing another tenant returns rows because of `has_role(auth.uid(),'landlord')` in the RPC — but the RPC doesn't restrict to landlords who actually had a deal with that tenant. As-designed (broad lookup) per earlier decision, but document this clearly.
8. `Profile` "phone not provided" path on `Call` button uses `tel:` — works on mobile, no-op on desktop. Add a tooltip.
9. `Messages` page: agreement strip only renders for tenants. Landlords have no in-chat Accept / Reject buttons — they have to go to a dashboard. Add inline Accept/Reject for landlords when an agreement is pending.

### Minor

10. `Navbar` mobile view: nav links hidden behind `md:flex` with no hamburger — mobile users can only reach pages via the avatar dropdown.
11. `Onboarding` page: confirm both role buttons write to `user_roles` and route immediately. Add a loading state.
12. README is the original generic Lovable template — does not describe the BD schema, KYC, peer feedback, rental history, or notifications.
13. Several files (`Onboarding`, `Payment`, `Receipt`, `Feedback`, `Kyc`, `MyListings`, `LandlordDashboard`, `Favorites`) have thin or missing top-of-file doc comments.

---

## Plan

### Step 1 — Code fixes
- `src/pages/TenantHome.tsx`: auto-switch to `by_location` when geo denied; always show cascading filter; include division in search.
- `src/hooks/useMessageNotifications.ts`: split into a singleton subscriber (called once in Navbar) + lightweight reader hook for unread/clearUnread.
- `src/components/auth/ProtectedRoute.tsx`: redirect role-less authenticated users to `/onboarding` regardless of `requireRole`.
- `src/pages/Onboarding.tsx`: ensure role insert is idempotent (`upsert`) and route immediately.
- `src/pages/ListingForm.tsx`: keep District/Thana selects enabled while their value is set (fixes edit-mode flash).
- `src/pages/Messages.tsx`: add inline Accept / Reject buttons for landlord when `agreement.status === "pending"`; only call `clearUnread`.
- `src/pages/ListingDetail.tsx`: guard duplicate-conversation lookup with `.limit(1)`.
- `src/components/layout/Navbar.tsx`: add a mobile hamburger sheet listing the same nav items.

### Step 2 — Documentation
- Rewrite `README.md`: project overview, BD-specific schema, all routes, env vars, local dev, deployment to Vercel/Netlify, RLS overview, peer feedback model, KYC, rental-history derivation, notification behavior, screenshots placeholder.
- Add/extend top-of-file JSDoc on: `Onboarding.tsx`, `Payment.tsx`, `Receipt.tsx`, `Kyc.tsx`, `Feedback.tsx`, `MyListings.tsx`, `LandlordDashboard.tsx`, `Favorites.tsx`, `Index.tsx`, `Landing.tsx`.
- Inline comments on tricky logic: realtime subscription lifecycle, RPC peer-only check, geolocation fallback, agreement state machine.

### Step 3 — Verification
- Use the in-preview browser tool to:
  - Sign up a tenant + landlord (test accounts).
  - Create a listing as landlord (verify cascading dropdowns + edit mode).
  - Browse + filter as tenant; verify near-me fallback when geo denied.
  - Start a conversation, send messages both ways, confirm a single toast + single badge increment.
  - Propose → accept → pay flow; confirm rental history row appears.
- Report any remaining issues; iterate.

### Out of scope (call out, don't do)
- Migrating to your external Supabase project — would require changing the auto-managed `.env`/`client.ts`, which Lovable regenerates. If you want this, we'd need to either disable Lovable Cloud or run two separate projects. Confirm if you want me to proceed.
- True background push (closed-tab notifications) needs a service worker + FCM. Currently only in-app + open-tab browser notifications work.

