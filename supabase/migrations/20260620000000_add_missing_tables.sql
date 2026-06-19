-- Add 'active' to agreement_status
ALTER TYPE public.agreement_status ADD VALUE IF NOT EXISTS 'active';

-- Invoice status enum
CREATE TYPE public.invoice_status AS ENUM ('paid', 'unpaid');

-- Rent invoices
CREATE TABLE public.rent_invoices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id  UUID NOT NULL REFERENCES public.agreements(id) ON DELETE CASCADE,
  tenant_id     UUID NOT NULL REFERENCES auth.users(id)        ON DELETE CASCADE,
  landlord_id   UUID NOT NULL REFERENCES auth.users(id)        ON DELETE CASCADE,
  listing_id    UUID NOT NULL REFERENCES public.listings(id)   ON DELETE CASCADE,
  amount_due    NUMERIC(12,2) NOT NULL,
  billing_month TEXT NOT NULL,
  due_date      DATE NOT NULL,
  status        invoice_status NOT NULL DEFAULT 'unpaid',
  type          TEXT NOT NULL DEFAULT 'rent',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rent_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view rent_invoices"
  ON public.rent_invoices FOR SELECT TO authenticated
  USING (auth.uid() = tenant_id OR auth.uid() = landlord_id);
CREATE POLICY "Tenant inserts rent_invoice"
  ON public.rent_invoices FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = tenant_id);

-- Payment extensions
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS invoice_id    UUID REFERENCES public.rent_invoices(id),
  ADD COLUMN IF NOT EXISTS tax_deducted  BOOLEAN NOT NULL DEFAULT false;

-- Ledger entries
CREATE TYPE public.entry_type AS ENUM ('debit', 'credit');
CREATE TABLE public.ledger_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id  UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,
  entry_type  entry_type NOT NULL,
  debit       NUMERIC(12,2) DEFAULT 0,
  credit      NUMERIC(12,2) DEFAULT 0,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own ledger entries"
  ON public.ledger_entries FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "System inserts ledger entries"
  ON public.ledger_entries FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Tax transactions
CREATE TABLE public.tax_transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id          UUID NOT NULL UNIQUE REFERENCES public.payments(id) ON DELETE CASCADE,
  landlord_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gross_rent          NUMERIC(12,2) NOT NULL,
  tds_amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  advance_tax_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  platform_fee        NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_to_landlord     NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_year            TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tax_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view tax_transactions"
  ON public.tax_transactions FOR SELECT TO authenticated
  USING (auth.uid() = landlord_id);
CREATE POLICY "System inserts tax_transactions"
  ON public.tax_transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = landlord_id);

-- KYC table
CREATE TYPE public.kyc_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TABLE public.kyc (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nid_number    TEXT,
  nid_front_url TEXT,
  nid_back_url  TEXT,
  selfie_url    TEXT,
  status        kyc_status NOT NULL DEFAULT 'pending',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kyc ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own KYC"
  ON public.kyc FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users upsert own KYC"
  ON public.kyc FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own KYC"
  ON public.kyc FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER kyc_updated_at BEFORE UPDATE ON public.kyc
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Payments realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
