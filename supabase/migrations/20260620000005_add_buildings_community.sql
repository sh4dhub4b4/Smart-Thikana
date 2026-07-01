-- Buildings + Community ecosystem for multi-unit properties

-- =========================================================================
-- 1. buildings table
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  building_type public.building_type NOT NULL DEFAULT 'residential_flat',
  division TEXT,
  district TEXT,
  thana TEXT,
  city_corporation public.city_corp DEFAULT 'none',
  block_sector TEXT,
  road_no TEXT,
  holding_number TEXT,
  zone TEXT,
  ward_number INT,
  total_floors INT DEFAULT 1,
  amenities JSONB DEFAULT '[]',
  has_security BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.buildings ENABLE ROW LEVEL SECURITY;

-- Owner has full access
CREATE POLICY "Owner full access on buildings"
  ON public.buildings FOR ALL TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Any authenticated user can read buildings (needed for tenants in the building)
CREATE POLICY "Anyone can read buildings"
  ON public.buildings FOR SELECT TO authenticated
  USING (true);

-- =========================================================================
-- 2. Link listings to buildings
-- =========================================================================
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS building_id UUID REFERENCES public.buildings(id) ON DELETE SET NULL;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS floor TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS unit_number TEXT;

-- =========================================================================
-- 3. community_posts — notice board / building feed
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  post_type TEXT NOT NULL DEFAULT 'notice',
  is_pinned BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read community_posts"
  ON public.community_posts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Building members can insert community_posts"
  ON public.community_posts FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.buildings WHERE id = building_id)
    AND author_id = auth.uid()
  );

CREATE POLICY "Authors can update own posts"
  ON public.community_posts FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- =========================================================================
-- 4. maintenance_requests
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read maintenance_requests"
  ON public.maintenance_requests FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Tenants can insert maintenance_requests"
  ON public.maintenance_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = tenant_id);

-- =========================================================================
-- 5. emergency_contacts
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES public.buildings(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read emergency_contacts"
  ON public.emergency_contacts FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Owner can manage emergency_contacts"
  ON public.emergency_contacts FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.buildings WHERE id = building_id AND owner_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.buildings WHERE id = building_id AND owner_id = auth.uid())
  );
