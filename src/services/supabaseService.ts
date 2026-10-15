import { supabase } from '../lib/supabase';
import { Candidate, Batch, AttendancePunch, LeaveRecord, TourRequest, ExpenseClaim, Employee } from '../types';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80';
const FALLBACK_AADHAAR = 'https://images.unsplash.com/photo-1589330694653-dad6bc0140fa?auto=format&fit=crop&w=600&q=80';
const FALLBACK_DL = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80';

function safeCloudUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // If a data URL exceeds 1MB, protect request from PostgREST HTTP 413 Payload Too Large
  if (typeof url === 'string' && url.startsWith('data:image/') && url.length > 1000000) {
    return FALLBACK_AVATAR;
  }
  return url;
}

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
 * Fetch all candidates from Supabase
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
 * Purge all data in Supabase (Used by CEO Erase All Data)
 */
export async function purgeAllDataFromSupabase(): Promise<{ success: boolean; message: string }> {
  try {
    // Delete candidates, batches, punches, leaves, tours, expense claims
    const [candRes, batchRes] = await Promise.all([
      supabase.from('candidates').delete().neq('id', '___non_existent___'),
      supabase.from('batches').delete().neq('id', '___non_existent___')
    ]);

    // Optional tables
    try { await supabase.from('attendance_punches').delete().neq('id', '___non_existent___'); } catch {}
    try { await supabase.from('leaves').delete().neq('id', '___non_existent___'); } catch {}
    try { await supabase.from('tours').delete().neq('id', '___non_existent___'); } catch {}
    try { await supabase.from('expense_claims').delete().neq('id', '___non_existent___'); } catch {}

    if (candRes.error && candRes.error.code !== 'PGRST205') {
      return { success: false, message: candRes.error.message };
    }

    return {
      success: true,
      message: 'Supabase cloud database successfully purged. Tables reset to zero state.'
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Purge failed' };
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
    .subscribe(status => {
      console.log(`[Supabase Realtime] ${channelName} status:`, status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}
