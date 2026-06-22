-- Extend conversations table for service booking chats

-- =========================================================================
-- 1. Make listing_id nullable, add provider/service_booking columns
-- =========================================================================
ALTER TABLE public.conversations ALTER COLUMN listing_id DROP NOT NULL;

ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES auth.users(id);
ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS service_booking_id UUID REFERENCES public.service_bookings(id);

-- Drop old UNIQUE constraint (listing_id, tenant_id) since listing_id is now nullable
ALTER TABLE public.conversations DROP CONSTRAINT IF EXISTS conversations_listing_id_tenant_id_key;

-- Partial unique indexes to replace the dropped constraint
CREATE UNIQUE INDEX IF NOT EXISTS conversations_listing_tenant_unique
  ON public.conversations (listing_id, tenant_id) WHERE listing_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS conversations_service_booking_unique
  ON public.conversations (service_booking_id) WHERE service_booking_id IS NOT NULL;

-- =========================================================================
-- 2. Update RLS policies to include provider_id
-- =========================================================================
DROP POLICY IF EXISTS "Participants view conversation" ON public.conversations;
CREATE POLICY "Participants view conversation"
  ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = tenant_id OR auth.uid() = landlord_id OR auth.uid() = provider_id);

DROP POLICY IF EXISTS "Tenant starts conversation" ON public.conversations;
CREATE POLICY "Participants insert conversation"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = tenant_id);

-- =========================================================================
-- 3. Update message RLS policies to include provider_id
-- =========================================================================
DROP POLICY IF EXISTS "Participants read messages" ON public.messages;
CREATE POLICY "Participants read messages"
  ON public.messages FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.tenant_id = auth.uid() OR c.landlord_id = auth.uid() OR c.provider_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Participants send messages" ON public.messages;
CREATE POLICY "Participants send messages"
  ON public.messages FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.tenant_id = auth.uid() OR c.landlord_id = auth.uid() OR c.provider_id = auth.uid())
    )
  );
