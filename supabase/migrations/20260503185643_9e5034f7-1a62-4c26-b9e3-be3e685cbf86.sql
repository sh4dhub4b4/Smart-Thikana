-- 1) BD administrative hierarchy lookup tables
CREATE TABLE public.divisions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_bn TEXT
);
CREATE TABLE public.districts (
  id SERIAL PRIMARY KEY,
  division_id INT NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_bn TEXT,
  UNIQUE (division_id, name)
);
CREATE TABLE public.thanas (
  id SERIAL PRIMARY KEY,
  district_id INT NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_bn TEXT,
  UNIQUE (district_id, name)
);
ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thanas    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "divisions readable by all" ON public.divisions FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "districts readable by all" ON public.districts FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "thanas readable by all"    ON public.thanas    FOR SELECT TO authenticated, anon USING (true);

INSERT INTO public.divisions (name, name_bn) VALUES
  ('Dhaka', 'ঢাকা'),
  ('Rajshahi', 'রাজশাহী');

INSERT INTO public.districts (division_id, name, name_bn) VALUES
  ((SELECT id FROM public.divisions WHERE name='Dhaka'), 'Dhaka', 'ঢাকা'),
  ((SELECT id FROM public.divisions WHERE name='Dhaka'), 'Gazipur', 'গাজীপুর'),
  ((SELECT id FROM public.divisions WHERE name='Dhaka'), 'Narayanganj', 'নারায়ণগঞ্জ'),
  ((SELECT id FROM public.divisions WHERE name='Rajshahi'), 'Rajshahi', 'রাজশাহী'),
  ((SELECT id FROM public.divisions WHERE name='Rajshahi'), 'Bogura', 'বগুড়া'),
  ((SELECT id FROM public.divisions WHERE name='Rajshahi'), 'Pabna', 'পাবনা');

INSERT INTO public.thanas (district_id, name) VALUES
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Dhaka' AND v.name='Dhaka'), 'Gulshan'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Dhaka' AND v.name='Dhaka'), 'Banani'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Dhaka' AND v.name='Dhaka'), 'Badda'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Dhaka' AND v.name='Dhaka'), 'Uttara'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Dhaka' AND v.name='Dhaka'), 'Dhanmondi'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Dhaka' AND v.name='Dhaka'), 'Mirpur'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Dhaka' AND v.name='Dhaka'), 'Mohammadpur'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Dhaka' AND v.name='Dhaka'), 'Tejgaon'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Dhaka' AND v.name='Dhaka'), 'Ramna'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Dhaka' AND v.name='Dhaka'), 'Motijheel'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Dhaka' AND v.name='Dhaka'), 'Khilgaon'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Dhaka' AND v.name='Dhaka'), 'Bashundhara'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Gazipur' AND v.name='Dhaka'), 'Gazipur Sadar'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Gazipur' AND v.name='Dhaka'), 'Tongi'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Narayanganj' AND v.name='Dhaka'), 'Narayanganj Sadar'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Narayanganj' AND v.name='Dhaka'), 'Fatullah'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Rajshahi' AND v.name='Rajshahi'), 'Boalia'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Rajshahi' AND v.name='Rajshahi'), 'Rajpara'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Rajshahi' AND v.name='Rajshahi'), 'Motihar'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Rajshahi' AND v.name='Rajshahi'), 'Shah Makhdum'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Bogura' AND v.name='Rajshahi'), 'Bogura Sadar'),
  ((SELECT d.id FROM public.districts d JOIN public.divisions v ON v.id=d.division_id WHERE d.name='Pabna' AND v.name='Rajshahi'), 'Pabna Sadar');

-- 2) Listings — add BD address columns
CREATE TYPE public.city_corp AS ENUM ('none', 'DNCC', 'DSCC');
CREATE TYPE public.building_type AS ENUM ('residential_flat', 'standalone_house', 'commercial_studio', 'sublet_mess');

ALTER TABLE public.listings
  ADD COLUMN division        TEXT,
  ADD COLUMN district        TEXT,
  ADD COLUMN city_corporation public.city_corp NOT NULL DEFAULT 'none',
  ADD COLUMN thana           TEXT,
  ADD COLUMN ward_number     INT,
  ADD COLUMN zone            TEXT,
  ADD COLUMN area_moholla    TEXT,
  ADD COLUMN block_sector    TEXT,
  ADD COLUMN road_no         TEXT,
  ADD COLUMN avenue_lane     TEXT,
  ADD COLUMN holding_number  TEXT,
  ADD COLUMN house_name      TEXT,
  ADD COLUMN floor_unit      TEXT,
  ADD COLUMN landmarks       TEXT,
  ADD COLUMN geo_location    TEXT,
  ADD COLUMN building_type   public.building_type NOT NULL DEFAULT 'residential_flat',
  ADD COLUMN latitude        DOUBLE PRECISION,
  ADD COLUMN longitude       DOUBLE PRECISION;

CREATE INDEX listings_division_idx ON public.listings(division);
CREATE INDEX listings_district_idx ON public.listings(district);
CREATE INDEX listings_thana_idx    ON public.listings(thana);

-- 3) KYC table
CREATE TYPE public.kyc_status AS ENUM ('pending', 'verified', 'rejected');

CREATE TABLE public.kyc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  nid_number TEXT,
  nid_front_url TEXT,
  nid_back_url TEXT,
  selfie_url TEXT,
  status public.kyc_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kyc ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users view own kyc"   ON public.kyc FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own kyc" ON public.kyc FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own kyc" ON public.kyc FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER kyc_set_updated_at BEFORE UPDATE ON public.kyc FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) Private storage bucket for KYC docs (folder = user_id)
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-docs', 'kyc-docs', false);

CREATE POLICY "kyc upload own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'kyc-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "kyc read own folder"   ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'kyc-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "kyc update own folder" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'kyc-docs' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "kyc delete own folder" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'kyc-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5) Peer feedback
CREATE TABLE public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL,
  subject_id UUID NOT NULL,
  author_role public.app_role NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_review CHECK (author_id <> subject_id)
);
CREATE INDEX feedback_subject_idx ON public.feedback(subject_id);
CREATE INDEX feedback_author_idx  ON public.feedback(author_id);
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "author reads own feedback" ON public.feedback FOR SELECT TO authenticated
  USING (auth.uid() = author_id);
CREATE POLICY "peers read same-role feedback" ON public.feedback FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), author_role) AND auth.uid() <> subject_id);
CREATE POLICY "author inserts feedback in own role" ON public.feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND public.has_role(auth.uid(), author_role));

-- 6) Realtime for messages (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
END $$;