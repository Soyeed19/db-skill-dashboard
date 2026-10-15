import { supabase } from '../lib/supabase';
import { Candidate, Batch, AttendancePunch, LeaveRecord, TourRequest, ExpenseClaim, Employee } from '../types';

// Map Candidate domain object to Supabase row format
export function mapCandidateToRow(c: Candidate): Record<string, any> {
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
    photo_url: c.photoUrl || null,
    id_front_url: c.idFrontUrl || null,
    id_back_url: c.idBackUrl || null,
    dl_front_url: c.dlFrontUrl || null,
    dl_back_url: c.dlBackUrl || null,
    aadhaar_proof_url: c.aadhaarProofUrl || null,
    dl_proof_url: c.dlProofUrl || null,
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
    raw_data: c,
    updated_at: new Date().toISOString()
  };
}

// Map Supabase row back to Candidate domain object
export function mapRowToCandidate(row: Record<string, any>): Candidate {
  if (row.raw_data && typeof row.raw_data === 'object') {
    return {
      ...row.raw_data,
      id: row.id,
      registrationNumber: row.registration_number || row.raw_data.registrationNumber,
      batchId: row.batch_id || row.raw_data.batchId,
      centerId: row.center_id || row.raw_data.centerId,
      fullName: row.full_name || row.raw_data.fullName,
      status: row.status || row.raw_data.status,
      queries: row.queries || row.raw_data.queries || []
    };
  }

  return {
    id: row.id,
    registrationNumber: row.registration_number || `DBS/2026/REG/${row.id.slice(-4)}`,
    batchId: row.batch_id || 'batch-1',
    centerId: row.center_id || 'ctr-jodhpur',
    fullName: row.full_name || 'Commercial Driver Candidate',
    fatherName: row.father_name || '',
    motherName: row.mother_name || '',
    dateOfBirth: row.date_of_birth || '1995-01-01',
    gender: row.gender || 'Male',
    mobileNumber: row.mobile_number || '',
    idCardNumber: row.id_card_number || '',
    abhaNumber: row.abha_number || '',
    dlNumber: row.dl_number || '',
    dlExpiryDate: row.dl_expiry_date || '',
    vehicleClass: row.vehicle_class || 'TRANS',
    status: row.status || 'Pending PO Review',
    address: row.address || '',
    city: row.city || '',
    state: row.state || '',
    pincode: row.pincode || '',
    enrolledAt: row.created_at || new Date().toISOString(),
    photoUrl: row.photo_url || '',
    idFrontUrl: row.id_front_url || '',
    idBackUrl: row.id_back_url || '',
    dlFrontUrl: row.dl_front_url || '',
    dlBackUrl: row.dl_back_url || '',
    aadhaarProofUrl: row.aadhaar_proof_url,
    dlProofUrl: row.dl_proof_url,
    verificationStatus: row.verification_status,
    attendanceStatus: row.attendance_status,
    preTestScore: Number(row.pre_test_score || 0),
    postTestScore: Number(row.post_test_score || 0),
    certificateNumber: row.certificate_number,
    certificateHoldingPhotoUrl: row.certificate_holding_photo_url,
    certificateHandoverPhotoUrl: row.certificate_handover_photo_url,
    poReviewer: row.po_reviewer,
    poApprovedBy: row.po_approved_by,
    poApprovedAt: row.po_approved_at,
    greenSignalBy: row.green_signal_by,
    greenSignalAt: row.green_signal_at,
    smApprovedBy: row.sm_approved_by,
    smApprovalTimestamp: row.sm_approval_timestamp,
    rejectionReason: row.rejection_reason,
    returnedBy: row.returned_by,
    returnedAt: row.returned_at,
    queries: Array.isArray(row.queries) ? row.queries : [],
    kitIssued: true,
    tshirtSize: 'L'
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
 * Upsert candidate into Supabase
 */
export async function upsertCandidateToSupabase(candidate: Candidate): Promise<boolean> {
  try {
    const row = mapCandidateToRow(candidate);
    const { error } = await supabase
      .from('candidates')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Upsert candidate failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] Upsert candidate exception:', err);
    return false;
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
  const channel = supabase
    .channel('db-skills-cloud-sync')
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
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
