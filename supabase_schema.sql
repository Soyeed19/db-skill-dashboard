-- ==============================================================================
-- DB Skills Commercial Driver Training & Operational Governance Portal
-- Production-Grade Supabase PostgreSQL Schema, Auth Seed & RLS Policies
-- Project ID: ojwrjvepkpjaumsdzgdm
-- ==============================================================================

-- 1. Profiles Table (Production RBAC & Downstream Staff Provisioning)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  center_id TEXT DEFAULT NULL,
  regional_cluster TEXT DEFAULT NULL,
  avatar_url TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure optional columns exist if table was created previously
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS regional_cluster TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Trigger to Map public.profiles.id <-> auth.users.id for Email OTP (shouldCreateUser: false)
CREATE OR REPLACE FUNCTION public.sync_profile_with_auth_users()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_auth_id UUID;
BEGIN
  NEW.email := LOWER(TRIM(NEW.email));

  SELECT id INTO v_auth_id
  FROM auth.users
  WHERE LOWER(email) = NEW.email
  LIMIT 1;

  IF v_auth_id IS NULL THEN
    v_auth_id := COALESCE(NEW.id, gen_random_uuid());
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_auth_id,
      'authenticated',
      'authenticated',
      NEW.email,
      '',
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', NEW.full_name, 'role', NEW.role, 'center_id', NEW.center_id),
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
  END IF;

  NEW.id := v_auth_id;
  NEW.updated_at := NOW();
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback gracefully if auth.users direct insert is restricted by host permissions
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_with_auth_users ON public.profiles;
CREATE TRIGGER trg_sync_profile_with_auth_users
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_with_auth_users();

-- 3. Seed Test Run Root Administrator (CEO: soyeed12@gmail.com)
DO $$
DECLARE
  v_ceo_id UUID;
BEGIN
  SELECT id INTO v_ceo_id
  FROM auth.users
  WHERE LOWER(email) = 'soyeed12@gmail.com'
  LIMIT 1;

  INSERT INTO public.profiles (id, email, full_name, role, center_id, regional_cluster, updated_at)
  VALUES (
    COALESCE(v_ceo_id, gen_random_uuid()),
    'soyeed12@gmail.com',
    'Soyeed Ahmed (Executive Admin)',
    'CEO',
    NULL,
    'National Command',
    NOW()
  )
  ON CONFLICT (email) DO UPDATE SET
    id = COALESCE(v_ceo_id, public.profiles.id),
    full_name = 'Soyeed Ahmed (Executive Admin)',
    role = 'CEO',
    center_id = NULL,
    updated_at = NOW();
END $$;

-- 4. Candidates Table
CREATE TABLE IF NOT EXISTS public.candidates (
  id TEXT PRIMARY KEY,
  registration_number TEXT,
  batch_id TEXT,
  center_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  father_name TEXT,
  mother_name TEXT,
  date_of_birth TEXT,
  gender TEXT DEFAULT 'Male',
  mobile_number TEXT,
  id_card_number TEXT,
  abha_number TEXT,
  dl_number TEXT,
  dl_expiry_date TEXT,
  vehicle_class TEXT DEFAULT 'TRANS',
  status TEXT DEFAULT 'Pending PO Review',
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  photo_url TEXT,
  id_front_url TEXT,
  id_back_url TEXT,
  dl_front_url TEXT,
  dl_back_url TEXT,
  aadhaar_proof_url TEXT,
  dl_proof_url TEXT,
  verification_status TEXT DEFAULT 'Auto-Verified',
  attendance_status TEXT DEFAULT 'Present',
  pre_test_score NUMERIC DEFAULT 0,
  post_test_score NUMERIC DEFAULT 0,
  certificate_number TEXT,
  certificate_holding_photo_url TEXT,
  certificate_handover_photo_url TEXT,
  po_reviewer TEXT,
  po_approved_by TEXT,
  po_approved_at TEXT,
  green_signal_by TEXT,
  green_signal_at TEXT,
  sm_approved_by TEXT,
  sm_approval_timestamp TEXT,
  rejection_reason TEXT,
  returned_by TEXT,
  returned_at TEXT,
  queries JSONB DEFAULT '[]'::jsonb,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Batches Table
CREATE TABLE IF NOT EXISTS public.batches (
  id TEXT PRIMARY KEY,
  batch_code TEXT UNIQUE NOT NULL,
  center_id TEXT NOT NULL,
  date TEXT NOT NULL,
  trainer_id TEXT,
  trainer_name TEXT,
  target_count INTEGER DEFAULT 30,
  enrolled_count INTEGER DEFAULT 0,
  present_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Training Active',
  classroom_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Helper Function for Center Code <-> Center ID equivalence in RLS
CREATE OR REPLACE FUNCTION public.center_matches(profile_center TEXT, record_center TEXT)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    profile_center IS NULL
    OR LOWER(profile_center) = LOWER(record_center)
    OR (UPPER(profile_center) = 'RJ-01' AND record_center = 'ctr-jodhpur')
    OR (UPPER(profile_center) = 'RJ-02' AND record_center = 'ctr-jaipur')
    OR (UPPER(profile_center) = 'RJ-03' AND record_center = 'ctr-kota')
    OR (UPPER(profile_center) = 'RJ-04' AND record_center = 'ctr-udaipur')
    OR (UPPER(profile_center) = 'DL-01' AND record_center = 'ctr-delhi-north')
    OR (UPPER(profile_center) = 'DL-02' AND record_center = 'ctr-delhi')
    OR (UPPER(profile_center) = 'DL-03' AND record_center = 'ctr-gurugram')
    OR (UPPER(profile_center) = 'MH-01' AND record_center = 'ctr-pune')
    OR (UPPER(profile_center) = 'MH-02' AND record_center = 'ctr-nagpur')
    OR (UPPER(profile_center) = 'MH-03' AND record_center = 'ctr-mumbai')
    OR (UPPER(profile_center) = 'MH-04' AND record_center = 'ctr-nashik')
    OR (UPPER(profile_center) = 'KA-01' AND record_center = 'ctr-mysuru')
    OR (UPPER(profile_center) = 'KA-02' AND record_center = 'ctr-hubballi')
    OR (UPPER(profile_center) = 'KA-04' AND record_center = 'ctr-bengaluru');
$$;

-- 7. Row Level Security (RLS) Configuration on profiles, candidates & batches
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies
DROP POLICY IF EXISTS "Public Full Access on candidates" ON public.candidates;
DROP POLICY IF EXISTS "Public Full Access on batches" ON public.batches;
DROP POLICY IF EXISTS "Profiles read access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles write access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles delete CEO only" ON public.profiles;
DROP POLICY IF EXISTS "Candidates center-scoped read" ON public.candidates;
DROP POLICY IF EXISTS "Candidates center-scoped insert" ON public.candidates;
DROP POLICY IF EXISTS "Candidates center-scoped update" ON public.candidates;
DROP POLICY IF EXISTS "Candidates purge CEO only" ON public.candidates;
DROP POLICY IF EXISTS "Batches authenticated read" ON public.batches;
DROP POLICY IF EXISTS "Batches authenticated write" ON public.batches;
DROP POLICY IF EXISTS "Batches purge CEO only" ON public.batches;

-- 7A. Policies on public.profiles
-- Allow pre-login email checks, profile resolution, and full read/write for authenticated sessions
CREATE POLICY "Profiles read access"
ON public.profiles
FOR SELECT
USING (true);

CREATE POLICY "Profiles authenticated insert"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Profiles authenticated update"
ON public.profiles
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Profiles authenticated delete"
ON public.profiles
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Profiles anon insert"
ON public.profiles
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Profiles anon update"
ON public.profiles
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- 7B. Policies on public.candidates
-- Only authenticated users can read their assigned center's data (CEO/GM/SM read across their jurisdiction)
CREATE POLICY "Candidates center-scoped read"
ON public.candidates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR LOWER(p.email) = LOWER(auth.jwt() ->> 'email'))
      AND (
        p.role IN ('CEO', 'GM', 'Senior Manager', 'SM')
        OR public.center_matches(p.center_id, candidates.center_id)
      )
  )
);

CREATE POLICY "Candidates center-scoped insert"
ON public.candidates
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR LOWER(p.email) = LOWER(auth.jwt() ->> 'email'))
      AND (
        p.role IN ('CEO', 'GM', 'Senior Manager', 'SM')
        OR public.center_matches(p.center_id, candidates.center_id)
      )
  )
);

CREATE POLICY "Candidates center-scoped update"
ON public.candidates
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR LOWER(p.email) = LOWER(auth.jwt() ->> 'email'))
      AND (
        p.role IN ('CEO', 'GM', 'Senior Manager', 'SM')
        OR public.center_matches(p.center_id, candidates.center_id)
      )
  )
);

-- Only users with role = 'CEO' in profiles can execute system purge/wipe queries
CREATE POLICY "Candidates purge CEO only"
ON public.candidates
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR LOWER(p.email) = LOWER(auth.jwt() ->> 'email'))
      AND p.role = 'CEO'
  )
);

-- 7C. Policies on public.batches
CREATE POLICY "Batches authenticated read"
ON public.batches
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR LOWER(p.email) = LOWER(auth.jwt() ->> 'email'))
      AND (
        p.role IN ('CEO', 'GM', 'Senior Manager', 'SM')
        OR public.center_matches(p.center_id, batches.center_id)
      )
  )
);

CREATE POLICY "Batches authenticated write"
ON public.batches
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR LOWER(p.email) = LOWER(auth.jwt() ->> 'email'))
      AND (
        p.role IN ('CEO', 'GM', 'Senior Manager', 'SM', 'PO', 'OSE', 'Trainer')
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR LOWER(p.email) = LOWER(auth.jwt() ->> 'email'))
      AND (
        p.role IN ('CEO', 'GM', 'Senior Manager', 'SM', 'PO', 'OSE', 'Trainer')
      )
  )
);

CREATE POLICY "Batches purge CEO only"
ON public.batches
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR LOWER(p.email) = LOWER(auth.jwt() ->> 'email'))
      AND p.role = 'CEO'
  )
);

-- 8. Enable Realtime Sync for profiles, candidates, and batches
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.batches;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 9. Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
