-- BD administrative hierarchy lookup tables + listings address columns

-- =========================================================================
-- 1. Enums for listings address
-- =========================================================================
DO $$ BEGIN
  CREATE TYPE public.city_corp AS ENUM ('none', 'DNCC', 'DSCC');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.building_type AS ENUM ('residential_flat', 'standalone_house', 'commercial_studio', 'sublet_mess');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =========================================================================
-- 2. Location lookup tables
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.divisions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  name_bn TEXT
);

CREATE TABLE IF NOT EXISTS public.districts (
  id SERIAL PRIMARY KEY,
  division_id INT NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_bn TEXT,
  UNIQUE (division_id, name)
);

CREATE TABLE IF NOT EXISTS public.thanas (
  id SERIAL PRIMARY KEY,
  district_id INT NOT NULL REFERENCES public.districts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_bn TEXT,
  UNIQUE (district_id, name)
);

ALTER TABLE public.divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thanas    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "divisions readable by all" ON public.divisions;
DROP POLICY IF EXISTS "districts readable by all" ON public.districts;
DROP POLICY IF EXISTS "thanas readable by all" ON public.thanas;

CREATE POLICY "divisions readable by all" ON public.divisions FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "districts readable by all" ON public.districts FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "thanas readable by all" ON public.thanas FOR SELECT TO authenticated, anon USING (true);

-- =========================================================================
-- 3. Add address columns to listings (idempotent)
-- =========================================================================
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS division        TEXT,
  ADD COLUMN IF NOT EXISTS district        TEXT,
  ADD COLUMN IF NOT EXISTS city_corporation public.city_corp NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS thana           TEXT,
  ADD COLUMN IF NOT EXISTS ward_number     INT,
  ADD COLUMN IF NOT EXISTS zone            TEXT,
  ADD COLUMN IF NOT EXISTS area_moholla    TEXT,
  ADD COLUMN IF NOT EXISTS block_sector    TEXT,
  ADD COLUMN IF NOT EXISTS road_no         TEXT,
  ADD COLUMN IF NOT EXISTS avenue_lane     TEXT,
  ADD COLUMN IF NOT EXISTS holding_number  TEXT,
  ADD COLUMN IF NOT EXISTS house_name      TEXT,
  ADD COLUMN IF NOT EXISTS floor_unit      TEXT,
  ADD COLUMN IF NOT EXISTS landmarks       TEXT,
  ADD COLUMN IF NOT EXISTS geo_location    TEXT,
  ADD COLUMN IF NOT EXISTS building_type   public.building_type NOT NULL DEFAULT 'residential_flat',
  ADD COLUMN IF NOT EXISTS latitude        DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude       DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS listings_division_idx ON public.listings(division);
CREATE INDEX IF NOT EXISTS listings_district_idx ON public.listings(district);
CREATE INDEX IF NOT EXISTS listings_thana_idx    ON public.listings(thana);

-- =========================================================================
-- 4. Seed BD location data (8 divisions, 64 districts, 200+ thanas)
-- =========================================================================
TRUNCATE public.thanas, public.districts, public.divisions RESTART IDENTITY CASCADE;

INSERT INTO public.divisions (name, name_bn) VALUES
  ('Dhaka','ঢাকা'),('Chattogram','চট্টগ্রাম'),('Rajshahi','রাজশাহী'),('Khulna','খুলনা'),
  ('Barishal','বরিশাল'),('Sylhet','সিলেট'),('Rangpur','রংপুর'),('Mymensingh','ময়মনসিংহ');

-- Dhaka division (13)
INSERT INTO public.districts (division_id, name) SELECT id, n FROM public.divisions, unnest(ARRAY[
 'Dhaka','Faridpur','Gazipur','Gopalganj','Kishoreganj','Madaripur','Manikganj','Munshiganj',
 'Narayanganj','Narsingdi','Rajbari','Shariatpur','Tangail']) AS n WHERE name='Dhaka';

-- Chattogram (11)
INSERT INTO public.districts (division_id, name) SELECT id, n FROM public.divisions, unnest(ARRAY[
 'Bandarban','Brahmanbaria','Chandpur','Chattogram','Cumilla','Cox''s Bazar','Feni',
 'Khagrachhari','Lakshmipur','Noakhali','Rangamati']) AS n WHERE name='Chattogram';

-- Rajshahi (8)
INSERT INTO public.districts (division_id, name) SELECT id, n FROM public.divisions, unnest(ARRAY[
 'Bogura','Joypurhat','Naogaon','Natore','Chapainawabganj','Pabna','Rajshahi','Sirajganj']) AS n WHERE name='Rajshahi';

-- Khulna (10)
INSERT INTO public.districts (division_id, name) SELECT id, n FROM public.divisions, unnest(ARRAY[
 'Bagerhat','Chuadanga','Jashore','Jhenaidah','Khulna','Kushtia','Magura','Meherpur','Narail','Satkhira']) AS n WHERE name='Khulna';

-- Barishal (6)
INSERT INTO public.districts (division_id, name) SELECT id, n FROM public.divisions, unnest(ARRAY[
 'Barguna','Barishal','Bhola','Jhalokati','Patuakhali','Pirojpur']) AS n WHERE name='Barishal';

-- Sylhet (4)
INSERT INTO public.districts (division_id, name) SELECT id, n FROM public.divisions, unnest(ARRAY[
 'Habiganj','Moulvibazar','Sunamganj','Sylhet']) AS n WHERE name='Sylhet';

-- Rangpur (8)
INSERT INTO public.districts (division_id, name) SELECT id, n FROM public.divisions, unnest(ARRAY[
 'Dinajpur','Gaibandha','Kurigram','Lalmonirhat','Nilphamari','Panchagarh','Rangpur','Thakurgaon']) AS n WHERE name='Rangpur';

-- Mymensingh (4)
INSERT INTO public.districts (division_id, name) SELECT id, n FROM public.divisions, unnest(ARRAY[
 'Jamalpur','Mymensingh','Netrokona','Sherpur']) AS n WHERE name='Mymensingh';

-- Thanas — Dhaka district
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Adabar','Badda','Banani','Cantonment','Demra','Dhanmondi','Gulshan','Hazaribagh','Jatrabari',
 'Kafrul','Kalabagan','Kamrangirchar','Khilgaon','Khilkhet','Kotwali','Lalbagh','Mirpur Model',
 'Mohammadpur','Motijheel','New Market','Pallabi','Paltan','Ramna','Rampura','Sabujbagh',
 'Shahbagh','Sher-e-Bangla Nagar','Shyampur','Sutrapur','Tejgaon','Turag','Uttara','Uttar Khan',
 'Wari','Bangshal','Chawkbazar','Dakshinkhan','Darus Salam','Gendaria','Hatirjheel','Bhashantek',
 'Vatara','Shah Ali','Rupnagar','Bimanbandar']) AS n WHERE name='Dhaka';

INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Gazipur Sadar','Kaliakair','Kaliganj','Kapasia','Sreepur','Tongi']) AS n WHERE name='Gazipur';

INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Narayanganj Sadar','Araihazar','Bandar','Rupganj','Sonargaon','Siddhirganj','Fatullah']) AS n WHERE name='Narayanganj';

INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Faridpur Sadar','Boalmari','Alfadanga','Bhanga','Charbhadrasan','Madhukhali','Nagarkanda','Sadarpur','Saltha']) AS n WHERE name='Faridpur';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Gopalganj Sadar','Kashiani','Kotalipara','Muksudpur','Tungipara']) AS n WHERE name='Gopalganj';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Kishoreganj Sadar','Bajitpur','Bhairab','Hossainpur','Itna','Karimganj','Katiadi','Kuliarchar','Mithamain','Nikli','Pakundia','Tarail','Austagram']) AS n WHERE name='Kishoreganj';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Madaripur Sadar','Kalkini','Rajoir','Shibchar']) AS n WHERE name='Madaripur';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Manikganj Sadar','Daulatpur','Ghior','Harirampur','Saturia','Shibalaya','Singair']) AS n WHERE name='Manikganj';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Munshiganj Sadar','Gazaria','Lohajang','Sirajdikhan','Sreenagar','Tongibari']) AS n WHERE name='Munshiganj';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Narsingdi Sadar','Belabo','Monohardi','Palash','Raipura','Shibpur']) AS n WHERE name='Narsingdi';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Rajbari Sadar','Baliakandi','Goalandaghat','Kalukhali','Pangsha']) AS n WHERE name='Rajbari';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Shariatpur Sadar','Bhedarganj','Damudya','Gosairhat','Naria','Zajira']) AS n WHERE name='Shariatpur';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Tangail Sadar','Basail','Bhuapur','Delduar','Dhanbari','Ghatail','Gopalpur','Kalihati','Madhupur','Mirzapur','Nagarpur','Sakhipur']) AS n WHERE name='Tangail';

-- Chattogram district
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Kotwali','Pahartali','Panchlaish','Bayazid','Chandgaon','Halishahar','Khulshi','Patenga',
 'Bandar','EPZ','Karnaphuli','Akbarshah','Sadarghat','Double Mooring','Boalkhali','Anwara',
 'Banshkhali','Chandanaish','Fatikchhari','Hathazari','Lohagara','Mirsharai','Patiya','Rangunia',
 'Raozan','Sandwip','Satkania','Sitakunda']) AS n WHERE name='Chattogram';

INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Cox''s Bazar Sadar','Chakaria','Kutubdia','Maheshkhali','Pekua','Ramu','Teknaf','Ukhia']) AS n WHERE name='Cox''s Bazar';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Cumilla Sadar','Barura','Brahmanpara','Burichang','Chandina','Chauddagram','Daudkandi','Debidwar',
 'Homna','Laksam','Manoharganj','Meghna','Muradnagar','Nangalkot','Titas','Lalmai']) AS n WHERE name='Cumilla';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Brahmanbaria Sadar','Akhaura','Ashuganj','Bancharampur','Bijoynagar','Kasba','Nabinagar','Nasirnagar','Sarail']) AS n WHERE name='Brahmanbaria';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Chandpur Sadar','Faridganj','Haimchar','Haziganj','Kachua','Matlab Dakshin','Matlab Uttar','Shahrasti']) AS n WHERE name='Chandpur';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Feni Sadar','Chhagalnaiya','Daganbhuiyan','Fulgazi','Parshuram','Sonagazi']) AS n WHERE name='Feni';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Bandarban Sadar','Alikadam','Lama','Naikhongchhari','Rowangchhari','Ruma','Thanchi']) AS n WHERE name='Bandarban';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Khagrachhari Sadar','Dighinala','Lakshmichhari','Mahalchhari','Manikchhari','Matiranga','Panchhari','Ramgarh']) AS n WHERE name='Khagrachhari';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Lakshmipur Sadar','Komol Nagar','Raipur','Ramganj','Ramgati']) AS n WHERE name='Lakshmipur';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Noakhali Sadar','Begumganj','Chatkhil','Companiganj','Hatiya','Kabirhat','Senbagh','Sonaimuri','Subarnachar']) AS n WHERE name='Noakhali';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Rangamati Sadar','Baghaichhari','Barkal','Belaichhari','Juraichhari','Kaptai','Kawkhali','Langadu','Naniarchar','Rajasthali']) AS n WHERE name='Rangamati';

-- Rajshahi
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Boalia','Motihar','Rajpara','Shah Makhdum','Bagha','Bagmara','Charghat','Durgapur','Godagari','Mohanpur','Paba','Puthia','Tanore']) AS n WHERE name='Rajshahi';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Bogura Sadar','Adamdighi','Dhunat','Dhupchanchia','Gabtali','Kahaloo','Nandigram','Sariakandi','Shajahanpur','Sherpur','Shibganj','Sonatala']) AS n WHERE name='Bogura';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Joypurhat Sadar','Akkelpur','Kalai','Khetlal','Panchbibi']) AS n WHERE name='Joypurhat';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Naogaon Sadar','Atrai','Badalgachhi','Dhamoirhat','Manda','Mahadebpur','Niamatpur','Patnitala','Porsha','Raninagar','Sapahar']) AS n WHERE name='Naogaon';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Natore Sadar','Bagatipara','Baraigram','Gurudaspur','Lalpur','Singra','Naldanga']) AS n WHERE name='Natore';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Chapainawabganj Sadar','Bholahat','Gomastapur','Nachole','Shibganj']) AS n WHERE name='Chapainawabganj';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Pabna Sadar','Atgharia','Bera','Bhangura','Chatmohar','Faridpur','Ishwardi','Santhia','Sujanagar']) AS n WHERE name='Pabna';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Sirajganj Sadar','Belkuchi','Chauhali','Kamarkhanda','Kazipur','Raiganj','Shahjadpur','Tarash','Ullapara']) AS n WHERE name='Sirajganj';

-- Khulna
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Khalishpur','Khan Jahan Ali','Kotwali','Sonadanga','Daulatpur','Harintana','Labanchara',
 'Batiaghata','Dacope','Dighalia','Dumuria','Koyra','Paikgachha','Phultala','Rupsa','Terokhada']) AS n WHERE name='Khulna';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Bagerhat Sadar','Chitalmari','Fakirhat','Kachua','Mollahat','Mongla','Morrelganj','Rampal','Sarankhola']) AS n WHERE name='Bagerhat';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Chuadanga Sadar','Alamdanga','Damurhuda','Jibannagar']) AS n WHERE name='Chuadanga';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Jashore Sadar','Abhaynagar','Bagherpara','Chaugachha','Jhikargachha','Keshabpur','Manirampur','Sharsha']) AS n WHERE name='Jashore';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Jhenaidah Sadar','Harinakunda','Kaliganj','Kotchandpur','Maheshpur','Shailkupa']) AS n WHERE name='Jhenaidah';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Kushtia Sadar','Bheramara','Daulatpur','Khoksa','Kumarkhali','Mirpur']) AS n WHERE name='Kushtia';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Magura Sadar','Mohammadpur','Shalikha','Sreepur']) AS n WHERE name='Magura';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Meherpur Sadar','Gangni','Mujibnagar']) AS n WHERE name='Meherpur';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Narail Sadar','Kalia','Lohagara']) AS n WHERE name='Narail';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Satkhira Sadar','Assasuni','Debhata','Kalaroa','Kaliganj','Shyamnagar','Tala']) AS n WHERE name='Satkhira';

-- Barishal
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Barishal Sadar (Kotwali)','Bakerganj','Babuganj','Banaripara','Gaurnadi','Hizla','Mehendiganj','Muladi','Wazirpur','Airport','Kawnia','Bandar Police Station']) AS n WHERE name='Barishal';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Barguna Sadar','Amtali','Bamna','Betagi','Patharghata','Taltali']) AS n WHERE name='Barguna';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Bhola Sadar','Burhanuddin','Char Fasson','Daulatkhan','Lalmohan','Manpura','Tazumuddin']) AS n WHERE name='Bhola';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Jhalokati Sadar','Kathalia','Nalchity','Rajapur']) AS n WHERE name='Jhalokati';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Patuakhali Sadar','Bauphal','Dashmina','Dumki','Galachipa','Kalapara','Mirzaganj','Rangabali']) AS n WHERE name='Patuakhali';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Pirojpur Sadar','Bhandaria','Kawkhali','Mathbaria','Nazirpur','Nesarabad','Zianagar']) AS n WHERE name='Pirojpur';

-- Sylhet
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Kotwali','Jalalabad','South Surma','Airport','Shah Paran','Moglabazar','Beanibazar','Bishwanath','Companiganj','Fenchuganj','Golapganj','Gowainghat','Jaintiapur','Kanaighat','Sylhet Sadar','Zakiganj','Osmani Nagar','Balaganj']) AS n WHERE name='Sylhet';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Habiganj Sadar','Ajmiriganj','Bahubal','Baniachong','Chunarughat','Lakhai','Madhabpur','Nabiganj','Shaistaganj']) AS n WHERE name='Habiganj';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Moulvibazar Sadar','Barlekha','Juri','Kamalganj','Kulaura','Rajnagar','Sreemangal']) AS n WHERE name='Moulvibazar';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Sunamganj Sadar','Bishwambarpur','Chhatak','Derai','Dharmapasha','Dowarabazar','Jagannathpur','Jamalganj','Sullah','Tahirpur','South Sunamganj','Madhyanagar','Shantiganj']) AS n WHERE name='Sunamganj';

-- Rangpur
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Kotwali','Tajhat','Mahiganj','Rangpur Sadar','Badarganj','Gangachara','Kaunia','Mithapukur','Pirgachha','Pirganj','Taraganj']) AS n WHERE name='Rangpur';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Dinajpur Sadar','Birampur','Birganj','Birol','Bochaganj','Chirirbandar','Phulbari','Ghoraghat','Hakimpur','Kaharole','Khansama','Nawabganj','Parbatipur']) AS n WHERE name='Dinajpur';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Gaibandha Sadar','Phulchhari','Sadullapur','Saghata','Gobindaganj','Palashbari','Sundarganj']) AS n WHERE name='Gaibandha';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Kurigram Sadar','Bhurungamari','Char Rajibpur','Chilmari','Phulbari','Nageshwari','Rajarhat','Raomari','Ulipur']) AS n WHERE name='Kurigram';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Lalmonirhat Sadar','Aditmari','Hatibandha','Kaliganj','Patgram']) AS n WHERE name='Lalmonirhat';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Nilphamari Sadar','Dimla','Domar','Jaldhaka','Kishoreganj','Saidpur']) AS n WHERE name='Nilphamari';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Panchagarh Sadar','Atwari','Boda','Debiganj','Tetulia']) AS n WHERE name='Panchagarh';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Thakurgaon Sadar','Baliadangi','Haripur','Pirganj','Ranisankail']) AS n WHERE name='Thakurgaon';

-- Mymensingh
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Kotwali','Mymensingh Sadar','Bhaluka','Dhobaura','Phulbaria','Phulpur','Gaffargaon','Gauripur','Haluaghat','Ishwarganj','Muktagachha','Nandail','Trishal','Tarakanda']) AS n WHERE name='Mymensingh';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Jamalpur Sadar','Bakshiganj','Dewanganj','Islampur','Madarganj','Melandaha','Sarishabari']) AS n WHERE name='Jamalpur';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Netrokona Sadar','Atpara','Barhatta','Durgapur','Kalmakanda','Kendua','Khaliajuri','Madan','Mohanganj','Purbadhala']) AS n WHERE name='Netrokona';
INSERT INTO public.thanas (district_id, name) SELECT id, n FROM public.districts, unnest(ARRAY[
 'Sherpur Sadar','Jhenaigati','Nakla','Nalitabari','Sreebardi']) AS n WHERE name='Sherpur';

-- =========================================================================
-- 5. Realtime: enable for messages (idempotent)
-- =========================================================================
ALTER TABLE public.messages REPLICA IDENTITY FULL;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
END $$;
