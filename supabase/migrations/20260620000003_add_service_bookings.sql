-- Create service_bookings table for provider service requests

-- =========================================================================
-- 1. Create service_bookings table
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================================================
-- 2. RLS policies
-- =========================================================================
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read bookings (providers see their own, tenants see theirs)
CREATE POLICY "Authenticated users can read service_bookings"
  ON public.service_bookings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Any authenticated user can insert a booking
CREATE POLICY "Authenticated users can insert service_bookings"
  ON public.service_bookings
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Providers can update bookings (accept/reject)
CREATE POLICY "Providers can update their bookings"
  ON public.service_bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.service_providers
      WHERE id = service_bookings.provider_id AND user_id = auth.uid()
    )
  );

-- =========================================================================
-- 3. Enable realtime
-- =========================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_bookings;
