-- Add service_provider role + service_categories + service_providers tables

-- =========================================================================
-- 1. Extend app_role enum
-- =========================================================================
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'service_provider';
END $$;

-- =========================================================================
-- 2. service_categories lookup table
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_categories DISABLE ROW LEVEL SECURITY;

-- Everyone can read categories
CREATE POLICY "Anyone can read service_categories"
  ON public.service_categories
  FOR SELECT
  USING (true);

-- =========================================================================
-- 3. service_providers profile table
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  company_name TEXT,
  phone TEXT,
  hourly_rate INTEGER NOT NULL DEFAULT 0,
  experience_years INTEGER NOT NULL DEFAULT 0,
  division TEXT,
  thana TEXT,
  district TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;

-- Add division column if the table already exists from a partial run
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS division TEXT;

-- Owners can read/write their own profile
CREATE POLICY "Users can read own provider profile"
  ON public.service_providers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own provider profile"
  ON public.service_providers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own provider profile"
  ON public.service_providers
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Anyone can read approved/verified providers
CREATE POLICY "Anyone can read approved providers"
  ON public.service_providers
  FOR SELECT
  USING (is_approved = true AND is_verified = true);

-- =========================================================================
-- 4. Seed common service categories
-- =========================================================================
INSERT INTO public.service_categories (name, icon) VALUES
  ('Plumbing', 'wrench'),
  ('Electrical', 'zap'),
  ('Cleaning', 'spray-can'),
  ('Painting', 'paintbrush'),
  ('Moving & Packing', 'truck'),
  ('Appliance Repair', 'refrigerator'),
  ('Carpentry', 'hammer'),
  ('AC Service', 'fan'),
  ('Pest Control', 'bug'),
  ('Home Renovation', 'building')
ON CONFLICT (name) DO NOTHING;
