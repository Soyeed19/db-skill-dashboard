/**
 * Safe LocalStorage Utilities with Self-Healing Quota Management
 * Prevents QuotaExceededError crashes when persisting base64 images or dense operational ledgers.
 */

import { Candidate } from '../types';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80';
const FALLBACK_AADHAAR = 'https://images.unsplash.com/photo-1589330694653-dad6bc0140fa?auto=format&fit=crop&w=600&q=80';
const FALLBACK_DL = 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80';

// Maximum length of any single data URL allowed to be stored in localStorage (approx 35KB)
const MAX_DATA_URL_CHAR_LENGTH = 35000;

/**
 * Sanitizes candidate object by checking image and document proof fields.
 * If any data URL is excessively bloated (> 35KB), it replaces it with a clean fallback
 * so that candidate state will never exceed the browser storage quota.
 */
export function sanitizeCandidateForStorage(cand: Candidate): Candidate {
  if (!cand || typeof cand !== 'object') return cand;

  const sanitized = { ...cand };

  const checkAndSanitize = (val: string | undefined, fallback: string): string => {
    if (!val) return fallback;
    if (typeof val === 'string' && val.startsWith('data:image/') && val.length > MAX_DATA_URL_CHAR_LENGTH) {
      return fallback;
    }
    return val;
  };

  sanitized.photoUrl = checkAndSanitize(sanitized.photoUrl, FALLBACK_AVATAR);
  sanitized.idFrontUrl = checkAndSanitize(sanitized.idFrontUrl, FALLBACK_AADHAAR);
  sanitized.idBackUrl = checkAndSanitize(sanitized.idBackUrl, FALLBACK_AADHAAR);
  sanitized.dlFrontUrl = checkAndSanitize(sanitized.dlFrontUrl, FALLBACK_DL);
  sanitized.dlBackUrl = checkAndSanitize(sanitized.dlBackUrl, FALLBACK_DL);
  sanitized.aadhaarProofUrl = checkAndSanitize(sanitized.aadhaarProofUrl, sanitized.idFrontUrl || FALLBACK_AADHAAR);
  sanitized.dlProofUrl = checkAndSanitize(sanitized.dlProofUrl, sanitized.dlFrontUrl || FALLBACK_DL);

  if (sanitized.driverHoldingIdUrl) {
    sanitized.driverHoldingIdUrl = checkAndSanitize(sanitized.driverHoldingIdUrl, FALLBACK_AVATAR);
  }
  if (sanitized.certificateHoldingPhotoUrl) {
    sanitized.certificateHoldingPhotoUrl = checkAndSanitize(sanitized.certificateHoldingPhotoUrl, FALLBACK_AVATAR);
  }
  if (sanitized.certificateHandoverPhotoUrl) {
    sanitized.certificateHandoverPhotoUrl = checkAndSanitize(sanitized.certificateHandoverPhotoUrl, FALLBACK_AVATAR);
  }

  return sanitized;
}

/**
 * Sanitizes candidate list and limits array length to retain most recent records.
 */
export function sanitizeCandidateListForStorage(list: Candidate[]): Candidate[] {
  if (!Array.isArray(list)) return [];
  // Keep up to 60 most recent candidates to ensure storage safety
  const trimmed = list.slice(0, 60);
  return trimmed.map(sanitizeCandidateForStorage);
}

/**
 * Proactively evicts oversized or non-essential cache items to free up browser storage quota.
 */
export function evictBloatedStorage(): void {
  try {
    // 1. Trim candidate enrollments
    const enrollmentsRaw = localStorage.getItem('dbs_candidate_enrollments');
    if (enrollmentsRaw && enrollmentsRaw.length > 50000) {
      try {
        const parsed = JSON.parse(enrollmentsRaw);
        if (Array.isArray(parsed)) {
          const trimmed = parsed.slice(0, 15).map(e => ({
            ...e,
            aadhaarProofUrl: typeof e.aadhaarProofUrl === 'string' && e.aadhaarProofUrl.length > MAX_DATA_URL_CHAR_LENGTH ? FALLBACK_AADHAAR : e.aadhaarProofUrl,
            dlProofUrl: typeof e.dlProofUrl === 'string' && e.dlProofUrl.length > MAX_DATA_URL_CHAR_LENGTH ? FALLBACK_DL : e.dlProofUrl
          }));
          try {
            localStorage.setItem('dbs_candidate_enrollments', JSON.stringify(trimmed));
          } catch {
            localStorage.removeItem('dbs_candidate_enrollments');
          }
        }
      } catch {
        localStorage.removeItem('dbs_candidate_enrollments');
      }
    }

    // 2. Trim attendance logs/punches
    const punchesRaw = localStorage.getItem('dbs_attendance_logs') || localStorage.getItem('dbs_attendance_punches');
    if (punchesRaw && punchesRaw.length > 80000) {
      try {
        const parsed = JSON.parse(punchesRaw);
        if (Array.isArray(parsed)) {
          const trimmed = parsed.slice(0, 30);
          try {
            localStorage.setItem('dbs_attendance_logs', JSON.stringify(trimmed));
            localStorage.setItem('dbs_attendance_punches', JSON.stringify(trimmed));
          } catch {
            localStorage.removeItem('dbs_attendance_logs');
            localStorage.removeItem('dbs_attendance_punches');
          }
        }
      } catch {
        localStorage.removeItem('dbs_attendance_logs');
        localStorage.removeItem('dbs_attendance_punches');
      }
    }

    // 3. Clean duplicate expense keys if both exist
    const hasExpenses = !!localStorage.getItem('dbs_expenses');
    const hasExpenseClaims = !!localStorage.getItem('dbs_expense_claims');
    if (hasExpenses && hasExpenseClaims) {
      localStorage.removeItem('dbs_expenses');
    }
  } catch (err) {
    console.warn('[SafeStorage] Non-fatal error during storage eviction:', err);
  }
}

/**
 * Safely writes to localStorage. Catches QuotaExceededError and initiates self-healing eviction.
 * Never throws uncaught exceptions.
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err: unknown) {
    console.warn(`[SafeStorage] Write failed for key "${key}". Running self-healing cleanup...`, err);
    evictBloatedStorage();

    // Secondary attempt
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (secondErr: unknown) {
      console.warn(`[SafeStorage] Secondary setItem for key "${key}" also failed. In-memory data preserved.`, secondErr);
      return false;
    }
  }
}

/**
 * Safely reads from localStorage with fallback.
 */
export function safeLocalStorageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[SafeStorage] Read error for key "${key}":`, err);
    return fallback;
  }
}

/**
 * Helper to safely save the candidate array with sanitization and quota protection.
 */
export function safeSaveCandidates(candidates: Candidate[]): boolean {
  try {
    const sanitized = sanitizeCandidateListForStorage(candidates);
    const serialized = JSON.stringify(sanitized);
    return safeLocalStorageSet('dbs_candidates', serialized);
  } catch (err) {
    console.warn('[SafeStorage] Failed to serialize and save candidates:', err);
    return false;
  }
}

const STORAGE_PURGE_VERSION_KEY = 'dbs_data_version_v10_prod_zero_state';

/**
 * Performs a one-time purge of legacy dummy/test state cached in localStorage.
 * Ensures the app starts at 0 candidates, 0 batches, 0 claims, 0 leaves, and 0 logs.
 */
export function purgeLegacyTestCache(): void {
  try {
    const currentVer = localStorage.getItem(STORAGE_PURGE_VERSION_KEY);
    if (currentVer !== 'v10_zero_state') {
      const keysToPurge = [
        'dbs_candidates',
        'dbs_candidate_enrollments',
        'dbsl_candidates',
        'dbs_batches',
        'dbs_transactions',
        'dbs_leaves',
        'dbs_tours',
        'dbs_expenses',
        'dbs_expense_claims',
        'dbs_attendance_logs',
        'dbs_attendance_punches',
        'dbs_maintenance_tickets'
      ];
      keysToPurge.forEach(k => localStorage.removeItem(k));
      localStorage.setItem(STORAGE_PURGE_VERSION_KEY, 'v10_zero_state');
    }
  } catch (err) {
    console.warn('[SafeStorage] Notice during zero-state cache purge:', err);
  }
}

/**
 * Self-healing routine executed immediately on module initialization.
 * Detects if existing localStorage contains bloated candidate data from previous turns,
 * and shrinks it before React's lifecycle hooks run.
 */
export function initSafeStorageSelfHealing(): void {
  purgeLegacyTestCache();
  try {
    const raw = localStorage.getItem('dbs_candidates');
    if (raw && raw.length > 80000) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const sanitized = sanitizeCandidateListForStorage(parsed);
          try {
            localStorage.setItem('dbs_candidates', JSON.stringify(sanitized));
          } catch {
            localStorage.removeItem('dbs_candidates');
          }
        }
      } catch {
        // If unparseable or severely corrupted, remove it
        localStorage.removeItem('dbs_candidates');
      }
    }
    evictBloatedStorage();
  } catch (err) {
    console.warn('[SafeStorage] Self-healing initial check completed with notice:', err);
  }
}

// Run self healing once on import
initSafeStorageSelfHealing();
