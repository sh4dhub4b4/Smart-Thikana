
-- =========================================
-- ENUMS
-- =========================================
CREATE TYPE public.app_role AS ENUM ('tenant', 'landlord');
CREATE TYPE public.property_type AS ENUM ('apartment', 'house', 'studio', 'room', 'commercial');
CREATE TYPE public.agreement_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed');

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  business_name TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- =========================================
-- USER ROLES
-- =========================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own role at signup"
  ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- =========================================
-- AUTO PROFILE TRIGGER
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- updated_at helper
-- =========================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- LISTINGS
-- =========================================
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  location TEXT NOT NULL,
  property_type property_type NOT NULL DEFAULT 'apartment',
  bedrooms INT NOT NULL DEFAULT 1,
  bathrooms INT NOT NULL DEFAULT 1,
  area_sqft INT,
  images TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active listings"
  ON public.listings FOR SELECT TO authenticated
  USING (is_active = true OR landlord_id = auth.uid());
CREATE POLICY "Landlords can create listings"
  ON public.listings FOR INSERT TO authenticated
  WITH CHECK (landlord_id = auth.uid() AND public.has_role(auth.uid(), 'landlord'));
CREATE POLICY "Landlords can update own listings"
  ON public.listings FOR UPDATE TO authenticated USING (landlord_id = auth.uid());
CREATE POLICY "Landlords can delete own listings"
  ON public.listings FOR DELETE TO authenticated USING (landlord_id = auth.uid());

CREATE TRIGGER listings_updated_at BEFORE UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- FAVORITES
-- =========================================
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id)
);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own favorites"
  ON public.favorites FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users add own favorites"
  ON public.favorites FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users remove own favorites"
  ON public.favorites FOR DELETE TO authenticated USING (user_id = auth.uid());

-- =========================================
-- CONVERSATIONS
-- =========================================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (listing_id, tenant_id)
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view conversation"
  ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);
CREATE POLICY "Tenant starts conversation"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = tenant_id);

-- =========================================
-- MESSAGES
-- =========================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants read messages"
  ON public.messages FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND (c.tenant_id = auth.uid() OR c.landlord_id = auth.uid()))
  );
CREATE POLICY "Participants send messages"
  ON public.messages FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND (c.tenant_id = auth.uid() OR c.landlord_id = auth.uid())
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- =========================================
-- AGREEMENTS
-- =========================================
CREATE TABLE public.agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL UNIQUE REFERENCES public.conversations(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agreed_price NUMERIC(12,2) NOT NULL,
  status agreement_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view agreement"
  ON public.agreements FOR SELECT TO authenticated
  USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);
CREATE POLICY "Tenant creates agreement"
  ON public.agreements FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = tenant_id);
CREATE POLICY "Landlord updates agreement"
  ON public.agreements FOR UPDATE TO authenticated USING (auth.uid() = landlord_id);

CREATE TRIGGER agreements_updated_at BEFORE UPDATE ON public.agreements
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================
-- PAYMENTS
-- =========================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number TEXT NOT NULL UNIQUE DEFAULT 'RCPT-' || upper(substr(md5(random()::text),1,10)),
  agreement_id UUID NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  status payment_status NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view payment"
  ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);
CREATE POLICY "Tenant inserts payment"
  ON public.payments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = tenant_id);
