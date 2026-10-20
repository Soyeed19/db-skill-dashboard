import { supabase } from '../lib/supabase';
import { Candidate, Batch, Center, UserRole } from '../types';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80';

export const ROOT_CEO_EMAIL = 'soyeed12@gmail.com';
export const ROOT_CEO_NAME = 'Soyeed Ahmed (Executive Admin)';

export interface StaffProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole | 'SM';
  center_id: string | null;
  regional_cluster?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const INITIAL_ROOT_CEO_PROFILE: StaffProfile = {
  id: '00000000-0000-4000-8000-000000000001',
  email: ROOT_CEO_EMAIL,
  full_name: ROOT_CEO_NAME,
  role: 'CEO',
  center_id: null,
  regional_cluster: 'National Command'
};

export function normalizeProfileRole(role: string): UserRole {
  const upper = (role || '').trim().toUpperCase();
  if (upper === 'CEO') return 'CEO';
  if (upper === 'GM') return 'GM';
  if (upper === 'SM' || upper === 'SENIOR MANAGER') return 'Senior Manager';
  if (upper === 'PO') return 'PO';
  if (upper === 'TRAINER') return 'Trainer';
  return 'OSE';
}

function safeCloudUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // If a data URL exceeds 1MB, protect request from PostgREST HTTP 413 Payload Too Large
  if (typeof url === 'string' && url.startsWith('data:image/') && url.length > 1000000) {
    return FALLBACK_AVATAR;
  }
  return url;
}

// ============================================================================
// PROFILES & RBAC PROVISIONING (public.profiles)
// ============================================================================

/**
 * Ensure the single initial testing administrator (CEO: soyeed12@gmail.com) exists in public.profiles
 */
export async function ensureRootCeoProfileInSupabase(authUserId?: string): Promise<StaffProfile> {
  const targetId = authUserId || INITIAL_ROOT_CEO_PROFILE.id;
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', ROOT_CEO_EMAIL)
      .maybeSingle();

    if (fetchErr && fetchErr.code === 'PGRST205') {
      // Table not yet created in Supabase SQL editor
      return { ...INITIAL_ROOT_CEO_PROFILE, id: targetId };
    }

    if (existing) {
      // Update if authUserId is now known and differs, or if role/full_name needs enforcement
      if ((authUserId && existing.id !== authUserId) || existing.role !== 'CEO') {
        const { data: updated } = await supabase
          .from('profiles')
          .update({
            id: authUserId || existing.id,
            full_name: ROOT_CEO_NAME,
            role: 'CEO',
            center_id: null
          })
          .ilike('email', ROOT_CEO_EMAIL)
          .select()
          .maybeSingle();
        if (updated) return updated as StaffProfile;
      }
      return existing as StaffProfile;
    }

    // Insert root CEO seed into public.profiles
    const payload: Record<string, any> = {
      id: targetId,
      email: ROOT_CEO_EMAIL,
      full_name: ROOT_CEO_NAME,
      role: 'CEO',
      center_id: null
    };

    const { data: inserted, error: insertErr } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'email' })
      .select()
      .maybeSingle();

    if (!insertErr && inserted) {
      return inserted as StaffProfile;
    }
  } catch (err) {
    console.warn('[Supabase] ensureRootCeoProfileInSupabase notice:', err);
  }
  return { ...INITIAL_ROOT_CEO_PROFILE, id: targetId };
}

/**
 * Fetch all authorized staff profiles from public.profiles
 */
export async function fetchProfilesFromSupabase(): Promise<StaffProfile[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code !== 'PGRST205') {
        console.warn('[Supabase] Profiles fetch error:', error.message);
      }
      return [INITIAL_ROOT_CEO_PROFILE];
    }

    const list: StaffProfile[] = (data || []).map((row: any) => ({
      id: row.id,
      email: (row.email || '').toLowerCase(),
      full_name: row.full_name || 'Authorized Staff',
      role: row.role || 'OSE',
      center_id: row.center_id ?? null,
      regional_cluster: row.regional_cluster ?? null,
      avatar_url: row.avatar_url ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));

    const hasRoot = list.some(p => p.email.toLowerCase() === ROOT_CEO_EMAIL);
    if (!hasRoot) {
      // Automatically seed root CEO if table exists and is empty
      const seeded = await ensureRootCeoProfileInSupabase();
      return [seeded, ...list];
    }

    return list;
  } catch (err) {
    console.warn('[Supabase] Profiles fetch exception:', err);
    return [INITIAL_ROOT_CEO_PROFILE];
  }
}

/**
 * Look up a single authorized profile by email in public.profiles
 */
export async function fetchProfileByEmail(email: string): Promise<{
  profile: StaffProfile | null;
  tableMissing: boolean;
}> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        if (cleanEmail === ROOT_CEO_EMAIL) {
          return { profile: INITIAL_ROOT_CEO_PROFILE, tableMissing: true };
        }
        return { profile: null, tableMissing: true };
      }
      if (cleanEmail === ROOT_CEO_EMAIL) {
        return { profile: INITIAL_ROOT_CEO_PROFILE, tableMissing: false };
      }
      return { profile: null, tableMissing: false };
    }

    if (data) {
      return {
        profile: {
          id: data.id,
          email: (data.email || cleanEmail).toLowerCase(),
          full_name: data.full_name || 'Authorized Staff',
          role: data.role || 'OSE',
          center_id: data.center_id ?? null,
          regional_cluster: data.regional_cluster ?? null,
          avatar_url: data.avatar_url ?? null,
          created_at: data.created_at,
          updated_at: data.updated_at
        },
        tableMissing: false
      };
    }

    // If root CEO logs in when public.profiles was just created, seed it automatically
    if (cleanEmail === ROOT_CEO_EMAIL) {
      const seeded = await ensureRootCeoProfileInSupabase();
      return { profile: seeded, tableMissing: false };
    }

    return { profile: null, tableMissing: false };
  } catch (err) {
    if (cleanEmail === ROOT_CEO_EMAIL) {
      return { profile: INITIAL_ROOT_CEO_PROFILE, tableMissing: false };
    }
    return { profile: null, tableMissing: false };
  }
}

/**
 * Sync public.profiles.id with auth.users.id after OTP verification
 */
export async function syncAuthenticatedProfileId(
  email: string,
  authUserId: string
): Promise<StaffProfile | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail === ROOT_CEO_EMAIL) {
    return ensureRootCeoProfileInSupabase(authUserId);
  }

  try {
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (!existing) return null;

    if (existing.id !== authUserId) {
      const { data: updated } = await supabase
        .from('profiles')
        .update({ id: authUserId })
        .ilike('email', cleanEmail)
        .select()
        .maybeSingle();
      if (updated) return updated as StaffProfile;
    }

    return existing as StaffProfile;
  } catch {
    return null;
  }
}

/**
 * Provision a downstream staff member into public.profiles
 * - CEO can add GM (Email, Name)
 * - GM can add SM (Email, Name, Regional Cluster)
 * - SM can add PO and OSE (Email, Name, Center ID e.g., 'RJ-01')
 */
export async function provisionStaffProfileInSupabase(params: {
  email: string;
  fullName: string;
  role: UserRole | 'SM';
  centerId: string | null;
  regionalCluster?: string | null;
}): Promise<{ success: boolean; data?: StaffProfile; error?: string }> {
  const cleanEmail = params.email.trim().toLowerCase();
  const cleanName = params.fullName.trim();
  const generatedId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `00000000-0000-4000-8000-${Date.now().toString().slice(-12).padStart(12, '0')}`;

  try {
    // Try full insert including regional_cluster
    const fullRow: Record<string, any> = {
      id: generatedId,
      email: cleanEmail,
      full_name: cleanName,
      role: params.role,
      center_id: params.centerId || null,
      regional_cluster: params.regionalCluster || null
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(fullRow, { onConflict: 'email' })
      .select()
      .single();

    if (error) {
      // Fallback if regional_cluster column is not present on custom profiles table
      const coreRow: Record<string, any> = {
        id: generatedId,
        email: cleanEmail,
        full_name: cleanName,
        role: params.role,
        center_id: params.centerId || null
      };

      const { data: fallbackData, error: fallbackErr } = await supabase
        .from('profiles')
        .upsert(coreRow, { onConflict: 'email' })
        .select()
        .single();

      if (fallbackErr) {
        return { success: false, error: fallbackErr.message };
      }

      return {
        success: true,
        data: {
          id: fallbackData.id,
          email: fallbackData.email,
          full_name: fallbackData.full_name,
          role: fallbackData.role,
          center_id: fallbackData.center_id,
          regional_cluster: params.regionalCluster || null
        }
      };
    }

    return {
      success: true,
      data: {
        id: data.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        center_id: data.center_id,
        regional_cluster: data.regional_cluster ?? params.regionalCluster ?? null
      }
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to insert row into public.profiles' };
  }
}

// ============================================================================
// CANDIDATES & BATCHES MAPPING & CRUD
// ============================================================================

// Map Candidate domain object to Supabase row format
export function mapCandidateToRow(c: Candidate): Record<string, any> {
  // Strip large base64 strings from raw_data JSONB to prevent exceeding request size limits
  const {
    photoUrl,
    idFrontUrl,
    idBackUrl,
    dlFrontUrl,
    dlBackUrl,
    aadhaarProofUrl,
    dlProofUrl,
    driverHoldingIdUrl,
    ...cleanRawData
  } = c;

  return {
    id: c.id,
    registration_number: c.registrationNumber,
    batch_id: c.batchId,
    center_id: c.centerId,
    full_name: c.fullName,
    father_name: c.fatherName || null,
    mother_name: c.motherName || null,
    date_of_birth: c.dateOfBirth || null,
    gender: c.gender || 'Male',
    mobile_number: c.mobileNumber || null,
    id_card_number: c.idCardNumber || null,
    abha_number: c.abhaNumber || null,
    dl_number: c.dlNumber || null,
    dl_expiry_date: c.dlExpiryDate || null,
    vehicle_class: c.vehicleClass || 'TRANS',
    status: c.status || 'Pending PO Review',
    address: c.address || null,
    city: c.city || null,
    state: c.state || null,
    pincode: c.pincode || null,
    photo_url: safeCloudUrl(c.photoUrl),
    id_front_url: safeCloudUrl(c.idFrontUrl),
    id_back_url: safeCloudUrl(c.idBackUrl),
    dl_front_url: safeCloudUrl(c.dlFrontUrl),
    dl_back_url: safeCloudUrl(c.dlBackUrl),
    aadhaar_proof_url: safeCloudUrl(c.aadhaarProofUrl),
    dl_proof_url: safeCloudUrl(c.dlProofUrl),
    verification_status: c.verificationStatus || 'Auto-Verified',
    attendance_status: c.attendanceStatus || 'Present',
    pre_test_score: c.preTestScore ?? 0,
    post_test_score: c.postTestScore ?? 0,
    certificate_number: c.certificateNumber || null,
    certificate_holding_photo_url: c.certificateHoldingPhotoUrl || null,
    certificate_handover_photo_url: c.certificateHandoverPhotoUrl || null,
    po_reviewer: c.poReviewer || null,
    po_approved_by: c.poApprovedBy || null,
    po_approved_at: c.poApprovedAt || null,
    green_signal_by: c.greenSignalBy || null,
    green_signal_at: c.greenSignalAt || null,
    sm_approved_by: c.smApprovedBy || null,
    sm_approval_timestamp: c.smApprovalTimestamp || null,
    rejection_reason: c.rejectionReason || null,
    returned_by: c.returnedBy || null,
    returned_at: c.returnedAt || null,
    queries: c.queries || [],
    raw_data: cleanRawData,
    updated_at: new Date().toISOString()
  };
}

// Map Supabase row back to Candidate domain object
export function mapRowToCandidate(row: Record<string, any>): Candidate {
  const base = row.raw_data && typeof row.raw_data === 'object' ? row.raw_data : {};
  return {
    ...base,
    id: row.id,
    registrationNumber: row.registration_number || base.registrationNumber || `DBS/2026/REG/${row.id.slice(-4)}`,
    batchId: row.batch_id || base.batchId || 'batch-1',
    centerId: row.center_id || base.centerId || 'ctr-jodhpur',
    fullName: row.full_name || base.fullName || 'Commercial Driver Candidate',
    fatherName: row.father_name ?? base.fatherName ?? '',
    motherName: row.mother_name ?? base.motherName ?? '',
    dateOfBirth: row.date_of_birth || base.dateOfBirth || '1995-01-01',
    gender: row.gender || base.gender || 'Male',
    maritalStatus: base.maritalStatus || 'Married',
    familyIncome: base.familyIncome || '',
    religion: base.religion || '',
    casteCategory: base.casteCategory || '',
    aadhaarIngestionMethod: base.aadhaarIngestionMethod || 'Manual Entry',
    mobileNumber: row.mobile_number || base.mobileNumber || '',
    idCardNumber: row.id_card_number || base.idCardNumber || '',
    abhaNumber: row.abha_number || base.abhaNumber || '',
    dlNumber: row.dl_number || base.dlNumber || '',
    dlExpiryDate: row.dl_expiry_date || base.dlExpiryDate || '',
    vehicleClass: row.vehicle_class || base.vehicleClass || 'TRANS',
    status: row.status || base.status || 'Pending PO Review',
    address: row.address || base.address || '',
    city: row.city || base.city || '',
    state: row.state || base.state || '',
    pincode: row.pincode || base.pincode || '',
    photoUrl: row.photo_url || base.photoUrl || '',
    idFrontUrl: row.id_front_url || base.idFrontUrl || '',
    idBackUrl: row.id_back_url || base.idBackUrl || '',
    dlFrontUrl: row.dl_front_url || base.dlFrontUrl || '',
    dlBackUrl: row.dl_back_url || base.dlBackUrl || '',
    aadhaarProofUrl: row.aadhaar_proof_url || base.aadhaarProofUrl,
    dlProofUrl: row.dl_proof_url || base.dlProofUrl,
    verificationStatus: row.verification_status || base.verificationStatus || 'Auto-Verified',
    attendanceStatus: row.attendance_status || base.attendanceStatus || 'Present',
    preTestScore: Number(row.pre_test_score ?? base.preTestScore ?? 0),
    postTestScore: Number(row.post_test_score ?? base.postTestScore ?? 0),
    certificateNumber: row.certificate_number || base.certificateNumber,
    certificateHoldingPhotoUrl: row.certificate_holding_photo_url || base.certificateHoldingPhotoUrl,
    certificateHandoverPhotoUrl: row.certificate_handover_photo_url || base.certificateHandoverPhotoUrl,
    poReviewer: row.po_reviewer || base.poReviewer,
    poApprovedBy: row.po_approved_by || base.poApprovedBy,
    poApprovedAt: row.po_approved_at || base.poApprovedAt,
    greenSignalBy: row.green_signal_by || base.greenSignalBy,
    greenSignalAt: row.green_signal_at || base.greenSignalAt,
    smApprovedBy: row.sm_approved_by || base.smApprovedBy,
    smApprovalTimestamp: row.sm_approval_timestamp || base.smApprovalTimestamp,
    rejectionReason: row.rejection_reason || base.rejectionReason,
    returnedBy: row.returned_by || base.returnedBy,
    returnedAt: row.returned_at || base.returnedAt,
    queries: Array.isArray(row.queries) ? row.queries : (base.queries || []),
    enrolledAt: row.created_at || base.enrolledAt || new Date().toISOString(),
    kitIssued: base.kitIssued ?? true,
    tshirtSize: base.tshirtSize || 'L',
    isLocked: base.isLocked ?? false,
    poCorrectionRemarks: base.poCorrectionRemarks,
    poApprovalTimestamp: base.poApprovalTimestamp
  };
}

// Map Batch domain object
export function mapBatchToRow(b: Batch): Record<string, any> {
  return {
    id: b.id,
    batch_code: b.batchCode,
    center_id: b.centerId,
    date: b.date,
    trainer_id: b.trainerId,
    trainer_name: b.trainerName,
    target_count: b.targetCount,
    enrolled_count: b.enrolledCount,
    present_count: b.presentCount,
    status: b.status,
    classroom_photo_url: b.classroomPhotoUrl || null,
    notes: b.notes || null,
    updated_at: new Date().toISOString()
  };
}

export function mapRowToBatch(row: Record<string, any>): Batch {
  return {
    id: row.id,
    batchCode: row.batch_code,
    centerId: row.center_id,
    date: row.date,
    trainerId: row.trainer_id || '',
    trainerName: row.trainer_name || '',
    targetCount: Number(row.target_count || 30),
    enrolledCount: Number(row.enrolled_count || 0),
    presentCount: Number(row.present_count || 0),
    status: row.status || 'Training Active',
    classroomPhotoUrl: row.classroom_photo_url || undefined,
    notes: row.notes || undefined
  };
}

/**
 * Fetch candidates from Supabase
 */
export async function fetchCandidatesFromSupabase(): Promise<Candidate[] | null> {
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] Candidates fetch error:', error.message);
      return null;
    }
    return (data || []).map(mapRowToCandidate);
  } catch (err) {
    console.warn('[Supabase] Candidates fetch exception:', err);
    return null;
  }
}

/**
 * Direct Cloud Write: Insert candidate directly into Supabase table
 */
export async function insertCandidateToSupabase(
  candidate: Candidate
): Promise<{ success: boolean; data?: Candidate; error?: string }> {
  try {
    const row = mapCandidateToRow(candidate);
    const { data, error } = await supabase
      .from('candidates')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.warn('[Supabase] Insert candidate failed, attempting upsert fallback:', error.message);
      const { data: upsertData, error: upsertErr } = await supabase
        .from('candidates')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();

      if (upsertErr) {
        console.error('[Supabase] Upsert candidate fallback also failed:', upsertErr.message);
        return { success: false, error: upsertErr.message };
      }
      return { success: true, data: upsertData ? mapRowToCandidate(upsertData) : candidate };
    }

    return { success: true, data: data ? mapRowToCandidate(data) : candidate };
  } catch (err: any) {
    console.error('[Supabase] Insert candidate exception:', err);
    return { success: false, error: err?.message || 'Failed to insert candidate to Supabase cloud' };
  }
}

/**
 * Upsert candidate into Supabase
 */
export async function upsertCandidateToSupabase(
  candidate: Candidate
): Promise<{ success: boolean; data?: Candidate; error?: string }> {
  try {
    const row = mapCandidateToRow(candidate);
    const { data, error } = await supabase
      .from('candidates')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn('[Supabase] Upsert candidate failed:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data: data ? mapRowToCandidate(data) : candidate };
  } catch (err: any) {
    console.warn('[Supabase] Upsert candidate exception:', err);
    return { success: false, error: err?.message || 'Exception during upsert' };
  }
}

/**
 * Direct Cloud Update: Execute .update() on Supabase candidates table
 */
export async function updateCandidateFieldsInSupabase(
  candidateId: string,
  candidateSnapshot: Candidate
): Promise<{ success: boolean; data?: Candidate; error?: string }> {
  try {
    const row = mapCandidateToRow(candidateSnapshot);
    const { data, error } = await supabase
      .from('candidates')
      .update(row)
      .eq('id', candidateId)
      .select()
      .maybeSingle();

    if (error) {
      return upsertCandidateToSupabase(candidateSnapshot);
    }
    return { success: true, data: data ? mapRowToCandidate(data) : candidateSnapshot };
  } catch {
    return upsertCandidateToSupabase(candidateSnapshot);
  }
}

/**
 * Upsert multiple candidates (for bulk seeding or sync)
 */
export async function upsertCandidatesBulk(candidates: Candidate[]): Promise<boolean> {
  try {
    if (!candidates || candidates.length === 0) return true;
    const rows = candidates.map(mapCandidateToRow);
    const { error } = await supabase
      .from('candidates')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Bulk upsert candidates failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Bulk upsert exception:', err);
    return false;
  }
}

/**
 * Delete a candidate from Supabase
 */
export async function deleteCandidateFromSupabase(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[Supabase] Delete candidate failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Delete candidate exception:', err);
    return false;
  }
}

/**
 * Fetch batches from Supabase
 */
export async function fetchBatchesFromSupabase(): Promise<Batch[] | null> {
  try {
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] Batches fetch error:', error.message);
      return null;
    }
    return (data || []).map(mapRowToBatch);
  } catch (err) {
    console.warn('[Supabase] Batches fetch exception:', err);
    return null;
  }
}

/**
 * Upsert batch into Supabase
 */
export async function upsertBatchToSupabase(batch: Batch): Promise<boolean> {
  try {
    const row = mapBatchToRow(batch);
    const { error } = await supabase
      .from('batches')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Upsert batch failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Upsert batch exception:', err);
    return false;
  }
}

/**
 * Purge all data in Supabase (Strictly restricted to authenticated CEO role in public.profiles)
 */
export async function purgeAllDataFromSupabase(): Promise<{ success: boolean; message: string }> {
  try {
    // Verify active Supabase session and CEO role in profiles
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionEmail = sessionData?.session?.user?.email?.toLowerCase();

    if (!sessionEmail) {
      return {
        success: false,
        message: 'Access Denied: Active Supabase session required to execute system purge.'
      };
    }

    const { profile } = await fetchProfileByEmail(sessionEmail);
    const isCeo = (profile && normalizeProfileRole(profile.role) === 'CEO') || sessionEmail === ROOT_CEO_EMAIL;

    if (!isCeo) {
      return {
        success: false,
        message: 'Access Denied: Only users with role = CEO in public.profiles can execute system purge queries.'
      };
    }

    // Execute SQL wipe across candidates and batches in Supabase
    const [candRes, batchRes] = await Promise.all([
      supabase.from('candidates').delete().neq('id', '___non_existent___'),
      supabase.from('batches').delete().neq('id', '___non_existent___')
    ]);

    try { await supabase.from('attendance_punches').delete().neq('id', '___non_existent___'); } catch {}
    try { await supabase.from('leaves').delete().neq('id', '___non_existent___'); } catch {}
    try { await supabase.from('tours').delete().neq('id', '___non_existent___'); } catch {}
    try { await supabase.from('expense_claims').delete().neq('id', '___non_existent___'); } catch {}

    if (candRes.error && candRes.error.code !== 'PGRST205') {
      return { success: false, message: candRes.error.message };
    }
    if (batchRes.error && batchRes.error.code !== 'PGRST205') {
      return { success: false, message: batchRes.error.message };
    }

    return {
      success: true,
      message: 'Supabase cloud database successfully purged across candidates and batches.'
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Purge failed' };
  }
}

/**
 * ============================================================================
 * HUBS / CENTERS CRUD (public.hubs)
 * ============================================================================
 */
export function mapRowToCenter(row: any): Center {
  const code = String(row.code || row.hub_code || 'HUB').toUpperCase();
  const city = String(row.city || '');
  const state = String(row.state || row.region || '');
  const targetCap = Number(row.target_capacity ?? row.target_drivers ?? row.capacity ?? 400);

  return {
    id: String(row.id || `ctr-${code.toLowerCase().replace(/[^a-z0-9]/g, '-')}`),
    code,
    name: String(row.name || row.center_name || code),
    city,
    state,
    region: String(row.region || row.state || 'Regional Command'),
    address: String(row.address || `${city}${state ? `, ${state}` : ''}`),
    latitude: Number(row.latitude) || 26.9124,
    longitude: Number(row.longitude) || 75.7873,
    geofenceRadiusMeters: Number(row.geofence_radius_meters ?? row.geofenceRadiusMeters) || 150,
    poName: String(row.po_name || row.in_charge_name || row.poName || 'Designated PO'),
    apmName: String(row.apm_name || row.apmName || 'Designated Manager'),
    contactNumber: row.contact_number || row.contactNumber || '',
    email: row.email || '',
    capacity: Number(row.capacity ?? targetCap) || 40,
    targetDrivers: targetCap || 400,
    inChargeName: row.in_charge_name || row.inChargeName || '',
    status: String(row.status || 'ACTIVE').toUpperCase(),
    createdAt: row.created_at || row.createdAt || new Date().toISOString()
  };
}

/**
 * Fetch all active hubs from public.hubs (excludes status = 'INACTIVE')
 */
export async function fetchHubsFromSupabase(): Promise<Center[] | null> {
  try {
    const { data, error } = await supabase
      .from('hubs')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code !== 'PGRST205') {
        console.warn('[Supabase] Hubs fetch notice:', error.message);
      }
      return null;
    }

    const activeHubs = (data || [])
      .map(mapRowToCenter)
      .filter(h => (h.status || 'ACTIVE').toUpperCase() !== 'INACTIVE');

    return activeHubs;
  } catch (err) {
    console.warn('[Supabase] fetchHubsFromSupabase exception:', err);
    return null;
  }
}

/**
 * Insert a new hub into public.hubs
 */
export async function insertHubToSupabase(hub: Center): Promise<{
  success: boolean;
  data?: Center;
  error?: string;
}> {
  try {
    const payload: Record<string, any> = {
      id: hub.id,
      code: hub.code.trim().toUpperCase(),
      name: hub.name.trim(),
      city: hub.city.trim(),
      state: hub.state.trim(),
      region: (hub.region || hub.state || 'Regional Command').trim(),
      target_capacity: Number(hub.targetDrivers ?? hub.capacity ?? 400),
      status: 'ACTIVE'
    };

    const { data, error } = await supabase
      .from('hubs')
      .insert([payload])
      .select()
      .maybeSingle();

    if (!error && data) {
      return { success: true, data: mapRowToCenter(data) };
    }

    // Retry with core columns if optional columns are not in user's table
    if (error && (error.code === 'PGRST204' || error.message?.includes('column'))) {
      const minimalPayload: Record<string, any> = {
        code: hub.code.trim().toUpperCase(),
        name: hub.name.trim(),
        city: hub.city.trim(),
        state: hub.state.trim(),
        status: 'ACTIVE'
      };
      const retry = await supabase
        .from('hubs')
        .insert([minimalPayload])
        .select()
        .maybeSingle();
      if (!retry.error && retry.data) {
        return { success: true, data: mapRowToCenter(retry.data) };
      }
    }

    if (error) {
      console.warn('[Supabase] insertHubToSupabase notice:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data: hub };
  } catch (err: any) {
    console.warn('[Supabase] insertHubToSupabase exception:', err);
    return { success: false, error: err?.message || 'Insert failed' };
  }
}

/**
 * Update an existing hub in public.hubs (Name, City, State/Region, or Monthly Candidate Target)
 */
export async function updateHubInSupabase(
  hubId: string,
  hubCode: string,
  updates: {
    name?: string;
    city?: string;
    state?: string;
    region?: string;
    targetDrivers?: number;
    capacity?: number;
    status?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.city !== undefined) payload.city = updates.city.trim();
    if (updates.state !== undefined) payload.state = updates.state.trim();
    if (updates.region !== undefined) payload.region = updates.region.trim();
    if (updates.targetDrivers !== undefined) {
      payload.target_capacity = Number(updates.targetDrivers);
    } else if (updates.capacity !== undefined) {
      payload.target_capacity = Number(updates.capacity);
    }
    if (updates.status !== undefined) payload.status = updates.status;

    // Update by id first, fallback to code
    const { error } = await supabase
      .from('hubs')
      .update(payload)
      .eq('id', hubId);

    if (error && (error.code === 'PGRST204' || error.message?.includes('column'))) {
      const minimalPayload: Record<string, any> = {};
      if (updates.name !== undefined) minimalPayload.name = updates.name.trim();
      if (updates.city !== undefined) minimalPayload.city = updates.city.trim();
      if (updates.state !== undefined) minimalPayload.state = updates.state.trim();
      if (updates.status !== undefined) minimalPayload.status = updates.status;

      await supabase.from('hubs').update(minimalPayload).eq('id', hubId);
    }

    // Also ensure match by code if id differed in DB
    if (hubCode) {
      await supabase
        .from('hubs')
        .update(payload)
        .eq('code', hubCode);
    }

    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase] updateHubInSupabase exception:', err);
    return { success: false, error: err?.message || 'Update failed' };
  }
}

/**
 * Soft-delete / Deactivate a hub by setting status = 'INACTIVE' in Supabase `hubs` table
 */
export async function deactivateHubInSupabase(
  hubId: string,
  hubCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('hubs')
      .update({ status: 'INACTIVE' })
      .eq('id', hubId);

    if (hubCode) {
      await supabase
        .from('hubs')
        .update({ status: 'INACTIVE' })
        .eq('code', hubCode);
    }

    if (error && error.code !== 'PGRST205') {
      console.warn('[Supabase] deactivateHubInSupabase notice:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase] deactivateHubInSupabase exception:', err);
    return { success: false, error: err?.message || 'Deactivation failed' };
  }
}

/**
 * Setup Realtime synchronization across all devices
 */
export function setupSupabaseRealtime(handlers: {
  onCandidateInsert?: (candidate: Candidate) => void;
  onCandidateUpdate?: (candidate: Candidate) => void;
  onCandidateDelete?: (id: string) => void;
  onBatchChange?: () => void;
  onProfileChange?: () => void;
  onHubChange?: () => void;
  onPurge?: () => void;
}) {
  const channelName = `dbs-realtime-channel-${Math.random().toString(36).slice(2, 7)}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'candidates' },
      payload => {
        if (payload.eventType === 'INSERT' && payload.new) {
          handlers.onCandidateInsert?.(mapRowToCandidate(payload.new));
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          handlers.onCandidateUpdate?.(mapRowToCandidate(payload.new));
        } else if (payload.eventType === 'DELETE' && payload.old) {
          handlers.onCandidateDelete?.(payload.old.id);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'batches' },
      () => {
        handlers.onBatchChange?.();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles' },
      () => {
        handlers.onProfileChange?.();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'hubs' },
      () => {
        handlers.onHubChange?.();
      }
    )
    .subscribe(status => {
      console.log(`[Supabase Realtime] ${channelName} status:`, status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}

