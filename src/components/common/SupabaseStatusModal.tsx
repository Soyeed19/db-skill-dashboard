import React, { useState } from 'react';
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  X,
  Code2,
  UploadCloud
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SUPABASE_PROJECT_ID, SUPABASE_DEFAULT_URL } from '../../lib/supabase';

interface SupabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseStatusModal: React.FC<SupabaseStatusModalProps> = ({ isOpen, onClose }) => {
  const {
    supabaseStatus,
    supabaseMessage,
    isCloudSyncing,
    refreshFromSupabase,
    seedCloudDatabase,
    candidates,
    profiles
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'sql'>('status');

  if (!isOpen) return null;

  const sqlCode = `-- ==============================================================================
-- DB Skills Commercial Driver Training & Operational Governance Portal
-- Production-Grade Supabase PostgreSQL Schema, Auth Seed & RLS Policies
-- Project ID: ${SUPABASE_PROJECT_ID}
-- ==============================================================================

-- 1. Profiles Table (Production RBAC & Downstream Staff Provisioning)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  center_id TEXT DEFAULT NULL,
  regional_cluster TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS regional_cluster TEXT DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Trigger to Map public.profiles.id <-> auth.users.id for Email OTP
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

-- 4. Candidates & Batches Tables
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

-- 5. Helper Function for Center Code <-> Center ID equivalence in RLS
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

-- 6. Row Level Security (RLS) on profiles, candidates & batches
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Profiles read access" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles authenticated insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Profiles authenticated update" ON public.profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Profiles authenticated delete" ON public.profiles FOR DELETE TO authenticated USING (true);
CREATE POLICY "Profiles anon insert" ON public.profiles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Profiles anon update" ON public.profiles FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Candidates center-scoped read" ON public.candidates FOR SELECT TO authenticated
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

CREATE POLICY "Candidates center-scoped insert" ON public.candidates FOR INSERT TO authenticated
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

CREATE POLICY "Candidates center-scoped update" ON public.candidates FOR UPDATE TO authenticated
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

CREATE POLICY "Candidates purge CEO only" ON public.candidates FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR LOWER(p.email) = LOWER(auth.jwt() ->> 'email'))
      AND p.role = 'CEO'
  )
);

CREATE POLICY "Batches authenticated read" ON public.batches FOR SELECT TO authenticated
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

CREATE POLICY "Batches authenticated write" ON public.batches FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR LOWER(p.email) = LOWER(auth.jwt() ->> 'email'))
      AND p.role IN ('CEO', 'GM', 'Senior Manager', 'SM', 'PO', 'OSE', 'Trainer')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR LOWER(p.email) = LOWER(auth.jwt() ->> 'email'))
      AND p.role IN ('CEO', 'GM', 'Senior Manager', 'SM', 'PO', 'OSE', 'Trainer')
  )
);

CREATE POLICY "Batches purge CEO only" ON public.batches FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE (p.id = auth.uid() OR LOWER(p.email) = LOWER(auth.jwt() ->> 'email'))
      AND p.role = 'CEO'
  )
);

-- Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';
`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Supabase Cloud Database & RLS</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  {SUPABASE_PROJECT_ID}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Centralized PostgreSQL storage, Email OTP Auth & Row Level Security
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'status'
                ? 'border-emerald-600 text-emerald-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            Connection & Live Status
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-700 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            SQL Schema & RLS Migration
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-xs">
          {activeTab === 'status' ? (
            <div className="space-y-4">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                  supabaseStatus === 'connected'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : supabaseStatus === 'tables_missing'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {supabaseStatus === 'connected' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h4 className="font-bold text-sm">
                    {supabaseStatus === 'connected'
                      ? 'Cloud Database Connected & Ready'
                      : supabaseStatus === 'tables_missing'
                      ? 'Supabase Connected (Profiles / RLS Pending Setup)'
                      : 'Connection Pending / Checking'}
                  </h4>
                  <p className="text-xs mt-1 leading-relaxed opacity-90">{supabaseMessage}</p>
                </div>
              </div>

              {/* Endpoint Details */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Supabase Project ID:</span>
                  <span className="font-mono font-bold text-slate-900">{SUPABASE_PROJECT_ID}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">API Endpoint:</span>
                  <span className="font-mono text-teal-800">{SUPABASE_DEFAULT_URL}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Provisioned Staff Profiles:</span>
                  <span className="font-mono font-bold text-emerald-700">{profiles?.length || 1} authorized profiles</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Cloud Candidate Dossiers:</span>
                  <span className="font-mono font-bold text-slate-900">{candidates.length} dossiers</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => refreshFromSupabase()}
                  disabled={isCloudSyncing}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                  <span>{isCloudSyncing ? 'Checking...' : 'Check Connection & Refresh'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'SQL Script Copied!' : 'Copy SQL Schema & RLS Script'}</span>
                </button>

                {supabaseStatus === 'connected' && (
                  <button
                    type="button"
                    onClick={() => seedCloudDatabase()}
                    disabled={isCloudSyncing}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-teal-700" />
                    <span>Upload Local Data to Cloud</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-600 text-xs">
                  Copy and paste this script directly into your{' '}
                  <a
                    href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-700 font-bold underline inline-flex items-center gap-1"
                  >
                    Supabase SQL Editor <ExternalLink className="w-3 h-3" />
                  </a>:
                </p>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>

              <pre className="bg-slate-900 text-emerald-300 font-mono text-[11px] p-4 rounded-2xl overflow-x-auto max-h-80 border border-slate-800 leading-relaxed select-all">
                {sqlCode}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-[11px] text-slate-500 font-mono">
            Status: <strong className="text-slate-800">{supabaseStatus}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
