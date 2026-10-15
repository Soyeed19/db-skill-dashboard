-- ==============================================================================
-- DB Skills Commercial Driver Training & Operational Governance Portal
-- Supabase PostgreSQL Schema & Realtime Setup
-- Project ID: ojwrjvepkpjaumsdzgdm
-- ==============================================================================

-- 1. Candidates Table
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

-- 2. Batches Table
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

-- 3. Attendance Punches Table
CREATE TABLE IF NOT EXISTS public.attendance_punches (
  id TEXT PRIMARY KEY,
  candidate_id TEXT,
  employee_id TEXT,
  center_id TEXT NOT NULL,
  punch_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'VERIFIED',
  photo_url TEXT,
  gps_lat NUMERIC,
  gps_lng NUMERIC,
  watermark_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Leaves Table
CREATE TABLE IF NOT EXISTS public.leaves (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  employee_role TEXT,
  center_id TEXT,
  center_name TEXT,
  leave_type TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  days_count INTEGER DEFAULT 1,
  reason TEXT,
  status TEXT DEFAULT 'Pending',
  approver_target TEXT DEFAULT 'PO',
  reviewed_by TEXT,
  review_remarks TEXT,
  reviewed_at TEXT,
  applied_at TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tours Table
CREATE TABLE IF NOT EXISTS public.tours (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  tour_sanction_number TEXT,
  destination_city TEXT,
  start_date TEXT,
  end_date TEXT,
  purpose TEXT,
  sanctioned_budget NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Submitted',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Expense Claims Table
CREATE TABLE IF NOT EXISTS public.expense_claims (
  id TEXT PRIMARY KEY,
  tour_id TEXT,
  claim_number TEXT,
  employee_id TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  total_claimed NUMERIC DEFAULT 0,
  total_approved NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'Submitted',
  items JSONB DEFAULT '[]'::jsonb,
  audit_trail JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Employees Table
CREATE TABLE IF NOT EXISTS public.employees (
  id TEXT PRIMARY KEY,
  emp_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  level TEXT DEFAULT 'Level 4',
  designation TEXT,
  center_id TEXT,
  center_name TEXT,
  assigned_center_ids JSONB DEFAULT '[]'::jsonb,
  assigned_region TEXT,
  region_center_ids JSONB DEFAULT '[]'::jsonb,
  reporting_officer TEXT,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Row Level Security (RLS) Configuration
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_punches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Public Full Access on candidates" ON public.candidates;
DROP POLICY IF EXISTS "Public Full Access on batches" ON public.batches;
DROP POLICY IF EXISTS "Public Full Access on attendance_punches" ON public.attendance_punches;
DROP POLICY IF EXISTS "Public Full Access on leaves" ON public.leaves;
DROP POLICY IF EXISTS "Public Full Access on tours" ON public.tours;
DROP POLICY IF EXISTS "Public Full Access on expense_claims" ON public.expense_claims;
DROP POLICY IF EXISTS "Public Full Access on employees" ON public.employees;

-- Create open RLS policies for application access via publishable/anon key
CREATE POLICY "Public Full Access on candidates" ON public.candidates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access on batches" ON public.batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access on attendance_punches" ON public.attendance_punches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access on leaves" ON public.leaves FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access on tours" ON public.tours FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access on expense_claims" ON public.expense_claims FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Full Access on employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);

-- 9. Realtime Publication Setup
-- Enables WebSocket push notifications for instantaneous multi-device synchronization
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.batches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_punches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaves;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tours;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expense_claims;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
