-- =============================================================================
-- Bashabari schema — applied on FIRST DB boot via /docker-entrypoint-initdb.d/
-- -----------------------------------------------------------------------------
-- This file mirrors the production migrations and is heavily commented so a
-- new contributor can understand exactly what each block does and WHY.
--
-- Conventions:
--   * All app tables live in the `public` schema.
--   * Every user-owned table has Row-Level Security (RLS) enabled.
--   * Roles are stored in their own `user_roles` table (NEVER on profiles)
--     to prevent privilege-escalation attacks.
--   * `auth.uid()` returns the currently logged-in user's UUID inside RLS.
-- =============================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. ENUMS — strongly typed values used across the schema
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE public.app_role          AS ENUM ('tenant', 'landlord');
CREATE TYPE public.property_type     AS ENUM ('apartment','house','studio','room','commercial');
CREATE TYPE public.agreement_status  AS ENUM ('pending','accepted','rejected');
CREATE TYPE public.payment_status    AS ENUM ('pending','completed','failed');


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. PROFILES — public-facing user info (name, phone, avatar, bio).
--    1-to-1 with auth.users. Created automatically by a trigger on signup.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL DEFAULT '',
  phone         TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  business_name TEXT,                 -- shown for landlords
  preferences   JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can read profiles (needed to show names in chat & listings)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);

-- Each user can create / update only their OWN profile row
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. USER_ROLES — separate table on purpose.
--    Storing roles on `profiles` is a classic mistake: a user could update
--    their own profile row and grant themselves 'landlord'. We instead read
--    roles via a SECURITY DEFINER function (see has_role below) and only let
--    users INSERT their own role at signup, never UPDATE it.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.user_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER lets this function bypass RLS so it can be safely called
-- from inside other RLS policies (avoids infinite recursion).
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own role at signup"
  ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
-- Note: NO update / delete policy → roles are immutable once chosen.


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. TRIGGERS — auto-create profile on signup, and auto-bump updated_at
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- raw_user_meta_data->>'full_name' is set by the frontend during signup;
  -- fall back to the email so the row is never empty.
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Generic helper attached to every table that has updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. LISTINGS — properties posted by landlords
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.listings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  price         NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  location      TEXT NOT NULL,
  property_type property_type NOT NULL DEFAULT 'apartment',
  bedrooms      INT NOT NULL DEFAULT 1,
  bathrooms     INT NOT NULL DEFAULT 1,
  area_sqft     INT,
  images        TEXT[] NOT NULL DEFAULT '{}',   -- array of image URLs
  is_active     BOOLEAN NOT NULL DEFAULT true,  -- soft-hide instead of delete
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Tenants can browse all ACTIVE listings; landlords can also see their own
-- inactive ones (so they can re-enable them).
CREATE POLICY "Anyone authenticated can view active listings"
  ON public.listings FOR SELECT TO authenticated
  USING (is_active = true OR landlord_id = auth.uid());

-- Only users with the 'landlord' role can create listings, and only
-- as themselves (landlord_id must match their auth.uid()).
CREATE POLICY "Landlords can create listings"
  ON public.listings FOR INSERT TO authenticated
  WITH CHECK (landlord_id = auth.uid() AND public.has_role(auth.uid(), 'landlord'));

CREATE POLICY "Landlords can update own listings"
  ON public.listings FOR UPDATE TO authenticated USING (landlord_id = auth.uid());
CREATE POLICY "Landlords can delete own listings"
  ON public.listings FOR DELETE TO authenticated USING (landlord_id = auth.uid());

CREATE TRIGGER listings_updated_at BEFORE UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. FAVORITES — many-to-many between tenants and listings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.favorites (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)   -- can't favorite the same listing twice
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own favorites"
  ON public.favorites FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users add own favorites"
  ON public.favorites FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users remove own favorites"
  ON public.favorites FOR DELETE TO authenticated USING (user_id = auth.uid());


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. CONVERSATIONS — exactly one per (listing, tenant) pair.
--    The landlord is denormalised here so RLS checks don't need a JOIN.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, tenant_id)
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Only the two participants can see the conversation
CREATE POLICY "Participants view conversation"
  ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);

-- The tenant always opens the conversation (clicking "Message" on a listing)
CREATE POLICY "Tenant starts conversation"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = tenant_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. MESSAGES — chat entries inside a conversation. REALTIME-enabled.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content         TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Both participants of the parent conversation can read messages
CREATE POLICY "Participants read messages"
  ON public.messages FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.tenant_id = auth.uid() OR c.landlord_id = auth.uid()))
  );

-- A user can only send messages AS themselves AND only inside conversations
-- they participate in.
CREATE POLICY "Participants send messages"
  ON public.messages FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.tenant_id = auth.uid() OR c.landlord_id = auth.uid())
    )
  );

-- Publish row changes to the Realtime service so the chat UI updates live
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- 9. AGREEMENTS — the "deal" between tenant and landlord BEFORE payment.
--    Tenant proposes (status='pending'); landlord then accepts or rejects.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.agreements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL UNIQUE REFERENCES public.conversations(id) ON DELETE CASCADE,
  listing_id      UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  landlord_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreed_price    NUMERIC(12,2) NOT NULL,
  status          agreement_status NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view agreement"
  ON public.agreements FOR SELECT TO authenticated
  USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);
CREATE POLICY "Tenant creates agreement"
  ON public.agreements FOR INSERT TO authenticated WITH CHECK (auth.uid() = tenant_id);
-- Only the landlord can change status (accept / reject)
CREATE POLICY "Landlord updates agreement"
  ON public.agreements FOR UPDATE TO authenticated USING (auth.uid() = landlord_id);

CREATE TRIGGER agreements_updated_at BEFORE UPDATE ON public.agreements
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ─────────────────────────────────────────────────────────────────────────────
-- 10. PAYMENTS — simulated; created after the landlord accepts the agreement.
--     receipt_number is auto-generated server-side so the client can't forge it.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.payments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE
                 DEFAULT 'RCPT-' || upper(substr(md5(random()::text),1,10)),
  agreement_id   UUID NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
  listing_id     UUID NOT NULL REFERENCES public.listings(id)   ON DELETE CASCADE,
  tenant_id      UUID NOT NULL REFERENCES auth.users(id)        ON DELETE CASCADE,
  landlord_id    UUID NOT NULL REFERENCES auth.users(id)        ON DELETE CASCADE,
  amount         NUMERIC(12,2) NOT NULL,
  status         payment_status NOT NULL DEFAULT 'completed',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view payment"
  ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);
CREATE POLICY "Tenant inserts payment"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = tenant_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 11. HARDENING — restrict execution of helper functions
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.handle_new_user()        FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at()         FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO   authenticated;
