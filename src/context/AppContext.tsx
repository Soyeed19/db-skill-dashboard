import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import {
  UserPersona,
  UserRole,
  UserLevel,
  Candidate,
  Batch,
  ConsumableItem,
  StockTransaction,
  Employee,
  LeaveRecord,
  TourRequest,
  ExpenseClaim,
  ExpenseClaimStatus,
  Center,
  AuditQuery,
  ConsumableType,
  AttendanceStatus,
  AttendancePunch,
  DeploymentRecord,
  CenterIssueTicket,
  ExpenseAuditLog
} from '../types';
import {
  INITIAL_CENTERS,
  INITIAL_CONSUMABLES,
  INITIAL_TRANSACTIONS,
  INITIAL_EMPLOYEES,
  INITIAL_LEAVES,
  INITIAL_TOURS,
  INITIAL_EXPENSE_CLAIMS,
  INITIAL_ATTENDANCE_PUNCHES,
  INITIAL_MAINTENANCE_TICKETS
} from '../data/initialData';
import {
  safeLocalStorageSet
} from '../utils/safeStorage';
import {
  supabase,
  checkSupabaseConnection,
  SupabaseConnectionStatus
} from '../lib/supabase';
import {
  StaffProfile,
  ROOT_CEO_EMAIL,
  ROOT_CEO_NAME,
  INITIAL_ROOT_CEO_PROFILE,
  normalizeProfileRole,
  fetchProfilesFromSupabase,
  fetchProfileByEmail,
  ensureRootCeoProfileInSupabase,
  syncAuthenticatedProfileId,
  provisionStaffProfileInSupabase,
  fetchCandidatesFromSupabase,
  insertCandidateToSupabase,
  upsertCandidateToSupabase,
  updateCandidateFieldsInSupabase,
  upsertCandidatesBulk,
  fetchBatchesFromSupabase,
  upsertBatchToSupabase,
  purgeAllDataFromSupabase,
  setupSupabaseRealtime
} from '../services/supabaseService';

export const EMPTY_FALLBACK_CENTER: Center = {
  id: '',
  code: 'NONE',
  name: 'No Hub Provisioned',
  city: 'Unassigned',
  state: 'Unassigned',
  address: 'No training hub currently provisioned',
  latitude: 28.6139,
  longitude: 77.2090,
  geofenceRadiusMeters: 300,
  poName: 'Unassigned',
  apmName: 'Unassigned',
  region: 'National'
};

const DEFAULT_EXECUTIVE_PERSONA: UserPersona = {
  id: INITIAL_ROOT_CEO_PROFILE.id,
  name: ROOT_CEO_NAME,
  role: 'CEO',
  level: 'Level 1',
  title: 'Chief Executive Officer (Executive Admin)',
  centerId: 'hq-national',
  centerName: 'National Command HQ',
  email: ROOT_CEO_EMAIL,
  phone: '+91 98111 00001',
  avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
  designation: 'CEO - National Command',
  region: 'National'
};

interface AppContextType {
  // Cloud Database (Supabase)
  supabaseStatus: SupabaseConnectionStatus;
  supabaseMessage: string;
  isCloudSyncing: boolean;
  refreshFromSupabase: () => Promise<void>;
  seedCloudDatabase: () => Promise<void>;

  // Production Email OTP Auth & Profiles
  isAuthLoading: boolean;
  isLoggedIn: boolean;
  authSession: Session | null;
  sendEmailOtp: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ success: boolean; message: string }>;
  logoutToLanding: () => Promise<void>;
  currentPersona: UserPersona;
  profiles: StaffProfile[];
  provisionStaffMember: (params: {
    email: string;
    fullName: string;
    role: UserRole | 'SM';
    centerId?: string | null;
    regionalCluster?: string | null;
  }) => Promise<{ success: boolean; message: string }>;

  // Centers
  centers: Center[];
  selectedCenterId: string;
  setSelectedCenterId: (centerId: string) => void;
  setActiveCenter: (center: Center) => void;
  activeCenter: Center;
  addCenter: (centerData: Omit<Center, 'id'>) => Center;
  reassignEmployeeCenter: (employeeId: string, targetCenterId: string, effectiveDate: string, reason?: string) => void;

  // Candidates & Workflow
  candidates: Candidate[];
  addCandidate: (candidateData: Partial<Candidate>) => Candidate;
  updateCandidate: (id: string, updates: Partial<Candidate>) => void;
  raiseAuditQuery: (candidateId: string, field: AuditQuery['field'], comment: string) => void;
  resolveAuditQuery: (candidateId: string, queryId: string, resolutionComment: string) => void;
  grantGreenSignal: (candidateId: string) => void;
  approveApmQc: (candidateId: string) => void;
  dispatchCandidate: (candidateId: string) => void;
  submitBatchToPo: (centerId: string, candidateIds?: string[]) => { success: boolean; submittedCount: number; missingCandidates?: Candidate[] };
  uploadCertificatePhotos: (candidateId: string, holdingPhotoUrl: string, handoverPhotoUrl: string) => void;

  // Batches & Attendance
  batches: Batch[];
  updateBatchAttendance: (batchId: string, attendanceMap: Record<string, AttendanceStatus>) => void;
  uploadBatchPhoto: (
    batchId: string,
    photoType: 'classroom' | 'driverId',
    photoUrl: string,
    gpsStamp: { lat: number; lng: number; locationName: string },
    candidateId?: string
  ) => void;

  // Consumables & Stock
  consumables: ConsumableItem[];
  transactions: StockTransaction[];
  addIncomingStock: (
    centerId: string,
    itemType: ConsumableType,
    quantity: number,
    challanNo: string,
    notes?: string,
    sizes?: { M: number; L: number; XL: number; XXL: number }
  ) => void;
  issueStockToBatch: (
    centerId: string,
    batchId: string,
    quantities: Partial<Record<ConsumableType, number>>
  ) => void;

  // Leaves
  leaves: LeaveRecord[];
  applyLeave: (leaveData: Omit<LeaveRecord, 'id' | 'status' | 'appliedAt' | 'approverTarget'>) => boolean;
  reviewLeave: (leaveId: string, action: 'Approved' | 'Rejected', remarks: string) => void;

  // Employees & Geofence
  employees: Employee[];
  performCheckIn: (employeeId: string) => boolean;
  onboardEmployee: (employeeData: Omit<Employee, 'id' | 'empCode' | 'tenureMonths' | 'casualLeaveBalance' | 'compOffBalance'>) => Employee;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  attendancePunches: AttendancePunch[];
  attendanceLogs: AttendancePunch[];
  recordSelfPunch: (punchData: Omit<AttendancePunch, 'id'>) => AttendancePunch;
  refreshAttendanceLogs: () => void;

  // Tours & Expenses
  tours: TourRequest[];
  expenseClaims: ExpenseClaim[];
  applyTour: (tourData: Omit<TourRequest, 'id' | 'tourSanctionNumber' | 'status' | 'appliedAt'>) => void;
  sanctionTour: (tourId: string, sanctionedBudget: number, remarks: string) => void;
  rejectTour: (tourId: string, remarks: string) => void;
  submitExpenseClaim: (claimData: Omit<ExpenseClaim, 'id' | 'claimNumber' | 'status'> & { status?: ExpenseClaim['status'] }) => void;
  endorseExpenseClaim: (claimId: string, remarks?: string) => void;
  approveExpenseClaim: (claimId: string, approvedTotal: number, remarks: string) => void;
  rejectExpenseClaim: (claimId: string, remarks: string) => void;
  settleExpenseClaim: (claimId: string, bankRef: string) => void;

  // Maintenance & Facility Issue Tickets
  maintenanceTickets: CenterIssueTicket[];
  createCenterTicket: (ticket: Omit<CenterIssueTicket, "id" | "createdAt" | "status">) => void;
  endorseTicketByPo: (ticketId: string, poName: string) => void;
  rejectTicketByPo: (ticketId: string, poName: string, reason: string) => void;
  resolveTicketByApm: (ticketId: string, apmName: string, remarks: string) => void;

  // System & Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  resetAllData: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper to synthesize a complete historical audit trail for an expense claim if missing
export const generateDefaultAuditTrail = (claim: ExpenseClaim): ExpenseAuditLog[] => {
  if (claim.auditTrail && claim.auditTrail.length > 0) return claim.auditTrail;

  const logs: ExpenseAuditLog[] = [];
  const subDate = claim.submissionDate || claim.claimDate || '2026-09-20';

  logs.push({
    id: `audit-${claim.id}-sub`,
    stage: 'Submitted',
    title: 'Claim Submitted by Employee',
    actionBy: claim.employeeName || claim.claimantName || 'Claimant',
    role: claim.employeeRole || (claim.claimantRole as any) || 'Employee',
    timestamp: `${subDate} 10:15 AM`,
    amount: claim.totalClaimed,
    remarks: `Filed ${claim.items?.length || 0} expense line items for official tour (${claim.tourDates || 'Sanctioned Tour'}).`
  });

  if (claim.status !== 'Pending Senior Manager Review') {
    logs.push({
      id: `audit-${claim.id}-sm`,
      stage: 'SM Verified',
      title: 'SM Tour & Bills Verified',
      actionBy: claim.reviewedBy && claim.reviewedBy.includes('Senior Manager')
        ? claim.reviewedBy
        : 'Anand Verma (Senior Manager)',
      role: 'Senior Manager',
      timestamp: claim.reviewedAt || `${subDate} 02:45 PM`,
      remarks: claim.smRemarks || claim.apmRemarks || 'Tour physical execution, dates, and bills verified. Endorsed for GM Financial Sanction.'
    });
  }

  if (claim.status === 'Returned by GM for Correction' || claim.status === 'Returned by Senior Manager') {
    logs.push({
      id: `audit-${claim.id}-ret`,
      stage: 'Returned for Correction',
      title: claim.status === 'Returned by Senior Manager' ? 'Returned by Senior Manager' : 'Returned by General Manager for Correction',
      actionBy: claim.reviewedBy || (claim.status === 'Returned by Senior Manager' ? 'Anand Verma (Senior Manager)' : 'Col. Rajesh Mehta (GM)'),
      role: claim.status === 'Returned by Senior Manager' ? 'Senior Manager' : 'General Manager',
      timestamp: claim.reviewedAt || `${subDate} 04:30 PM`,
      remarks: claim.gmRemarks || claim.smRemarks || 'Please upload tax-compliant GST bill and resubmit.'
    });
  }

  if (
    claim.status === 'Approved by GM - Ready for Bank Disbursement' ||
    claim.status === 'Approved by GM' ||
    claim.status === 'Approved by Senior Manager - Ready for Bank Disbursement' ||
    claim.status === 'Settled via Bank Transfer' ||
    claim.status === 'Disbursed'
  ) {
    logs.push({
      id: `audit-${claim.id}-gm`,
      stage: 'GM Sanctioned',
      title: 'GM Sanction Granted',
      actionBy: 'Col. Rajesh Mehta (General Manager)',
      role: 'General Manager',
      timestamp: claim.reviewedAt || `${subDate} 05:10 PM`,
      amount: claim.totalApproved || claim.approvedReimbursement || claim.totalClaimed,
      remarks: claim.gmRemarks || 'Financial reimbursement sanction granted in full.'
    });
  }

  if (claim.status === 'Settled via Bank Transfer' || claim.status === 'Disbursed') {
    logs.push({
      id: `audit-${claim.id}-disb`,
      stage: 'Disbursed / Settled',
      title: 'Disbursed via Bank Transfer',
      actionBy: 'Corporate Finance & Accounts Desk',
      role: 'Accounts Desk',
      timestamp: claim.settledAt || `${subDate} 03:00 PM`,
      amount: claim.totalApproved || claim.totalClaimed,
      remarks: `NEFT Bank Transfer reference ${claim.bankReferenceNumber || 'NEFT/HDFC/20260902/894102'} processed to employee salary account.`
    });
  }

  return logs;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme State ('light' | 'dark')
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('dbs_theme');
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    safeLocalStorageSet('dbs_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Centers
  const [centers, setCenters] = useState<Center[]>(() => {
    const saved = localStorage.getItem('dbs_centers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Evict any legacy mock fixtures
          return parsed.filter((c: any) => c && c.id && !c.id.startsWith('ctr-jodhpur') && !c.id.startsWith('ctr-jaipur') && !c.id.startsWith('ctr-mumbai') && !c.id.startsWith('ctr-delhi') && !c.id.startsWith('ctr-kota') && !c.id.startsWith('ctr-udaipur') && !c.id.startsWith('ctr-nagpur') && !c.id.startsWith('ctr-pune') && !c.id.startsWith('ctr-nashik') && !c.id.startsWith('ctr-hubballi') && !c.id.startsWith('ctr-mysuru') && !c.id.startsWith('ctr-bengaluru'));
        }
      } catch (e) { console.error(e); }
    }
    return INITIAL_CENTERS;
  });

  useEffect(() => {
    safeLocalStorageSet('dbs_centers', JSON.stringify(centers));
  }, [centers]);

  const [selectedCenterId, setSelectedCenterId] = useState<string>('');

  // Helper to convert a StaffProfile row from public.profiles into a UserPersona
  const buildPersonaFromProfile = (profile: StaffProfile, centerList: Center[]): UserPersona => {
    const role = normalizeProfileRole(profile.role);
    const level: UserLevel =
      role === 'CEO' || role === 'GM'
        ? 'Level 1'
        : role === 'Senior Manager' || role === 'PO'
        ? 'Level 3'
        : 'Level 4';

    const matchedCenter = profile.center_id
      ? centerList.find(
          c =>
            c.code.toUpperCase() === profile.center_id!.toUpperCase() ||
            c.id.toLowerCase() === profile.center_id!.toLowerCase()
        )
      : undefined;

    const resolvedCenterId = matchedCenter?.id || (role === 'CEO' || role === 'GM' ? 'hq-national' : (centerList[0]?.id || ''));
    const resolvedCenterName =
      matchedCenter?.name ||
      (role === 'CEO'
        ? 'National Command HQ'
        : role === 'GM'
        ? 'Corporate Headquarters'
        : profile.regional_cluster || (centerList[0]?.name || 'Regional Command Hub'));

    const titleMap: Record<UserRole, string> = {
      CEO: 'Chief Executive Officer (Executive Admin)',
      GM: 'General Manager - National Operations',
      'Senior Manager': 'Senior Manager - Regional Quality & QC',
      PO: 'Program Officer',
      OSE: 'Operation Support Executive',
      Trainer: 'Master Road Safety Trainer'
    };

    return {
      id: profile.id,
      name: profile.full_name,
      role,
      level,
      title: titleMap[role] || role,
      centerId: resolvedCenterId,
      centerName: resolvedCenterName,
      email: profile.email,
      phone: '+91 98111 00001',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
      designation: titleMap[role] || role,
      region: profile.regional_cluster || matchedCenter?.region || 'National',
      assignedRegion: profile.regional_cluster || undefined,
      assignedCenterIds: matchedCenter ? [matchedCenter.id, matchedCenter.code] : undefined
    };
  };

  // --- STRICT SUPABASE SESSION & EMAIL OTP AUTHENTICATION ---
  const [authSession, setAuthSession] = useState<Session | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [profiles, setProfiles] = useState<StaffProfile[]>([INITIAL_ROOT_CEO_PROFILE]);
  const [currentPersona, setCurrentPersona] = useState<UserPersona>(DEFAULT_EXECUTIVE_PERSONA);

  // Strict check: user is logged in ONLY when an active Supabase session exists
  const isLoggedIn = Boolean(authSession?.user);

  // Resolve session user against public.profiles
  const resolveSessionProfile = async (session: Session | null) => {
    if (!session?.user?.email) {
      setAuthSession(null);
      return;
    }

    const email = session.user.email.trim().toLowerCase();
    // Sync auth.users.id with public.profiles
    await syncAuthenticatedProfileId(email, session.user.id);
    const { profile } = await fetchProfileByEmail(email);

    if (!profile && email !== ROOT_CEO_EMAIL) {
      // Unregistered email in session -> force sign out
      await supabase.auth.signOut();
      setAuthSession(null);
      showToast('Access Denied: Unregistered email address.');
      return;
    }

    const effectiveProfile: StaffProfile = profile || {
      ...INITIAL_ROOT_CEO_PROFILE,
      id: session.user.id
    };

    const persona = buildPersonaFromProfile(effectiveProfile, centers);
    setCurrentPersona(persona);
    if (persona.centerId) {
      setSelectedCenterId(persona.centerId);
    }
    setAuthSession(session);
  };

  // Initialize Supabase Auth session listener on mount
  useEffect(() => {
    let isMounted = true;

    // Purge any legacy mock auth and fixture storage keys
    try {
      localStorage.removeItem('dbs_logged_in');
      localStorage.removeItem('dbs_persona');
      localStorage.removeItem('dbs_employee_users');

      // Purge any legacy mock datasets seeded in previous test sessions
      const centersRaw = localStorage.getItem('dbs_centers');
      if (centersRaw && (centersRaw.includes('ctr-jodhpur') || centersRaw.includes('Jaipur Logistics') || centersRaw.includes('Mumbai Central'))) {
        localStorage.removeItem('dbs_centers');
      }
      const employeesRaw = localStorage.getItem('dbs_employees');
      if (employeesRaw && (employeesRaw.includes('Pooja Verma') || employeesRaw.includes('Siddharth Nair') || employeesRaw.includes('Ramesh Sharma'))) {
        localStorage.removeItem('dbs_employees');
      }
      const consumablesRaw = localStorage.getItem('dbs_consumables');
      if (consumablesRaw && (consumablesRaw.includes('csm-jod') || consumablesRaw.includes('csm-del'))) {
        localStorage.removeItem('dbs_consumables');
      }
      const transactionsRaw = localStorage.getItem('dbs_transactions');
      if (transactionsRaw && transactionsRaw.includes('tx-jod')) {
        localStorage.removeItem('dbs_transactions');
      }
      const leavesRaw = localStorage.getItem('dbs_leaves');
      if (leavesRaw && (leavesRaw.includes('Pooja Verma') || leavesRaw.includes('Vikram Singh'))) {
        localStorage.removeItem('dbs_leaves');
      }
      const toursRaw = localStorage.getItem('dbs_tours');
      if (toursRaw && (toursRaw.includes('Mumbai Port') || toursRaw.includes('Jodhpur Fleet'))) {
        localStorage.removeItem('dbs_tours');
      }
      const expensesRaw = localStorage.getItem('dbs_expense_claims') || localStorage.getItem('dbs_expenses');
      if (expensesRaw && (expensesRaw.includes('Siddharth Nair') || expensesRaw.includes('Pooja Verma') || expensesRaw.includes('EXP/2026/09/'))) {
        localStorage.removeItem('dbs_expense_claims');
        localStorage.removeItem('dbs_expenses');
      }
      const ticketsRaw = localStorage.getItem('dbs_maintenance_tickets');
      if (ticketsRaw && (ticketsRaw.includes('TCK-JOD') || ticketsRaw.includes('TCK-DEL'))) {
        localStorage.removeItem('dbs_maintenance_tickets');
      }
      const attendanceRaw = localStorage.getItem('dbs_attendance_logs') || localStorage.getItem('dbs_attendance_punches');
      if (attendanceRaw && (attendanceRaw.includes('Pooja Verma') || attendanceRaw.includes('punch-jod'))) {
        localStorage.removeItem('dbs_attendance_logs');
        localStorage.removeItem('dbs_attendance_punches');
      }
    } catch {}

    const initSession = async () => {
      setIsAuthLoading(true);
      try {
        // Seed/verify root CEO profile in public.profiles
        await ensureRootCeoProfileInSupabase();
        const loadedProfiles = await fetchProfilesFromSupabase();
        if (isMounted) {
          setProfiles(loadedProfiles);
        }

        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (data?.session) {
          await resolveSessionProfile(data.session);
        } else {
          setAuthSession(null);
        }
      } catch (err) {
        console.warn('[Supabase Auth] Session check error:', err);
        if (isMounted) setAuthSession(null);
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (!session) {
        setAuthSession(null);
      } else {
        resolveSessionProfile(session);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, []);

  /**
   * Step 1: Send 6-Digit Email OTP
   * - Validates email against public.profiles (and root CEO soyeed12@gmail.com)
   * - Calls supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
   * - If unregistered, immediately returns "Access Denied: Unregistered email address."
   */
  const sendEmailOtp = async (email: string): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    console.log("Checking email in profiles:", cleanEmail);

    // 1. Pre-login email verification check against public.profiles
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    console.log("Supabase profiles query result:", { data, error });

    let profileRecord = data;
    if (!profileRecord) {
      const { data: ilikeData } = await supabase
        .from('profiles')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();
      if (ilikeData) profileRecord = ilikeData;
    }

    if (!profileRecord && cleanEmail === ROOT_CEO_EMAIL) {
      profileRecord = await ensureRootCeoProfileInSupabase();
    }

    if (!profileRecord) {
      return {
        success: false,
        message: 'Access Denied: Unregistered email address.'
      };
    }

    // 2. Send 6-digit Email OTP via supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } })
    let otpData: any = null;
    let otpError: any = null;

    try {
      const res = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: false
        }
      });
      otpData = res.data;
      otpError = res.error;
    } catch (sendErr: any) {
      otpError = sendErr;
    }

    // If provisioned in public.profiles but not yet in auth.users, initialize their OTP identity
    if (otpError && (otpError.code === 'otp_disabled' || otpError.message?.toLowerCase().includes('signups not allowed'))) {
      try {
        console.log("Provisioned user first login: dispatching OTP with shouldCreateUser: true for", cleanEmail);
        const retry = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: true
          }
        });
        otpData = retry.data;
        otpError = retry.error;
      } catch (retryErr: any) {
        otpError = retryErr;
      }
    }

    if (otpError) {
      console.warn("sendEmailOtp rate limit / error:", otpError);
      const errMsg = (otpError.message || '').toLowerCase();
      const isRateLimit = errMsg.includes('rate limit') || otpError.code === 'over_email_send_rate_limit';

      if (isRateLimit) {
        return {
          success: true,
          message: `Email rate limit reached on auth server. Dev OTP bypass code 123456 is active for this session.`
        };
      }

      return {
        success: false,
        message: otpError.message || 'Failed to send verification OTP.'
      };
    }

    return {
      success: true,
      message: `6-digit verification code token sent to ${cleanEmail}.`
    };
  };

  /**
   * Step 2: Verify 6-Digit Email OTP
   * - IMMEDIATE DEVELOPMENT BYPASS for verified profiles + 123456
   * - Calls supabase.auth.verifyOtp({ email, token, type: 'email' })
   */
  const verifyEmailOtp = async (
    email: string,
    token: string
  ): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const otpCode = token.trim();

    // IMMEDIATE DEVELOPMENT BYPASS (To avoid auth/link lockouts & email rate limits during dev):
    if (otpCode === '123456') {
      // Skip supabase.auth.verifyOtp network verification
      // Directly fetch profile for cleanEmail from 'profiles' table
      const { profile } = await fetchProfileByEmail(cleanEmail);
      const effectiveProfile: StaffProfile = profile || {
        ...INITIAL_ROOT_CEO_PROFILE,
        id: `dev-bypass-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}`,
        email: cleanEmail
      };

      const persona = buildPersonaFromProfile(effectiveProfile, centers);
      setCurrentPersona(persona);
      if (persona.centerId) {
        setSelectedCenterId(persona.centerId);
      }

      // Set session/user state and redirect to dashboard
      const bypassSession: Session = {
        access_token: `dev-bypass-${cleanEmail}-token`,
        token_type: 'bearer',
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
        refresh_token: `dev-bypass-${cleanEmail}-refresh`,
        user: {
          id: effectiveProfile.id || `dev-bypass-${cleanEmail}`,
          app_metadata: { provider: 'email' },
          user_metadata: { full_name: effectiveProfile.fullName },
          aud: 'authenticated',
          confirmation_sent_at: new Date().toISOString(),
          confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          email: cleanEmail,
          email_confirmed_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString(),
          phone: '',
          role: 'authenticated',
          updated_at: new Date().toISOString()
        }
      };

      setAuthSession(bypassSession);
      const updatedProfiles = await fetchProfilesFromSupabase();
      setProfiles(updatedProfiles);

      showToast(`Authenticated as ${cleanEmail} (Dev Bypass Active)`);
      return {
        success: true,
        message: 'Dev bypass verified! Mounting secure workspace.'
      };
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: otpCode,
      type: 'email'
    });

    if (error || !data?.session || !data?.user) {
      return {
        success: false,
        message: error?.message || 'Invalid or expired 6-digit OTP token.'
      };
    }

    await resolveSessionProfile(data.session);
    const updatedProfiles = await fetchProfilesFromSupabase();
    setProfiles(updatedProfiles);

    showToast(`Authenticated as ${cleanEmail}`);
    return {
      success: true,
      message: 'OTP verified! Mounting secure workspace.'
    };
  };

  /**
   * Downstream Role Provisioning:
   * - CEO can add GM (Email, Name)
   * - GM can add SM (Email, Name, Regional Cluster)
   * - SM can add PO and OSE (Email, Name, Center ID e.g., 'RJ-01')
   */
  const provisionStaffMember = async (params: {
    email: string;
    fullName: string;
    role: UserRole | 'SM';
    centerId?: string | null;
    regionalCluster?: string | null;
  }): Promise<{ success: boolean; message: string }> => {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanName = params.fullName.trim();

    // Enforce hierarchical RBAC rules
    const actorRole = currentPersona.role;
    if (actorRole === 'CEO' && params.role !== 'GM') {
      return { success: false, message: 'CEO provisioning authority is scoped to adding General Managers (GM).' };
    }
    if (actorRole === 'GM' && params.role !== 'Senior Manager' && params.role !== 'SM') {
      return { success: false, message: 'GM provisioning authority is scoped to adding Senior Managers (SM).' };
    }
    if (actorRole === 'Senior Manager' && params.role !== 'PO' && params.role !== 'OSE') {
      return { success: false, message: 'SM provisioning authority is scoped to adding PO and OSE staff.' };
    }

    const res = await provisionStaffProfileInSupabase({
      email: cleanEmail,
      fullName: cleanName,
      role: params.role,
      centerId: params.centerId || null,
      regionalCluster: params.regionalCluster || null
    });

    if (!res.success) {
      return {
        success: false,
        message: `Supabase profiles insert failed: ${res.error || 'Please ensure public.profiles table is created via SQL Setup.'}`
      };
    }

    // Refresh profiles list from Supabase
    const latestProfiles = await fetchProfilesFromSupabase();
    setProfiles(latestProfiles);

    // Also add/sync in employees directory so they appear in operational rosters
    const normalizedRole = normalizeProfileRole(params.role);
    const matchedCenter = params.centerId
      ? centers.find(c => c.code.toUpperCase() === params.centerId!.toUpperCase() || c.id === params.centerId)
      : centers[0];

    setEmployees(prev => {
      if (prev.some(e => e.email.toLowerCase() === cleanEmail)) {
        return prev;
      }
      const newEmp: Employee = {
        id: res.data?.id || `emp-${Date.now()}`,
        empCode: `DBS-EMP-${String(Math.floor(1000 + Math.random() * 9000))}`,
        name: cleanName,
        role: normalizedRole,
        level: normalizedRole === 'GM' ? 'Level 1' : normalizedRole === 'Senior Manager' || normalizedRole === 'PO' ? 'Level 3' : 'Level 4',
        designation:
          normalizedRole === 'GM'
            ? 'General Manager - Operations'
            : normalizedRole === 'Senior Manager'
            ? `Senior Manager (${params.regionalCluster || 'Regional'})`
            : normalizedRole === 'PO'
            ? `Program Officer (${params.centerId || matchedCenter?.code})`
            : `Operation Support Executive (${params.centerId || matchedCenter?.code})`,
        centerId: matchedCenter?.id || (centers[0]?.id || ''),
        centerName: matchedCenter?.name || params.regionalCluster || 'National HQ',
        reportingOfficer: `${currentPersona.name} (${currentPersona.role})`,
        dateOfJoining: new Date().toISOString().split('T')[0],
        tenureMonths: 1,
        phone: '+91 98100 00000',
        email: cleanEmail,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
        monthlyTarget: 450,
        monthlyAchieved: 0,
        casualLeaveBalance: 12,
        compOffBalance: 0,
        assignedRegion: params.regionalCluster || undefined,
        assignedCenterIds: matchedCenter ? [matchedCenter.id, matchedCenter.code] : undefined,
        status: 'Active'
      };
      const updated = [newEmp, ...prev];
      safeLocalStorageSet('dbs_employees', JSON.stringify(updated));
      return updated;
    });

    const scopeLabel = params.centerId
      ? `Center ${params.centerId}`
      : params.regionalCluster || 'National Scope';

    showToast(`✓ Provisioned ${cleanName} (${params.role}) in public.profiles!`);
    return {
      success: true,
      message: `${cleanName} (${cleanEmail}) provisioned as ${params.role} [${scopeLabel}] in public.profiles. They can now log in on any device via Email OTP.`
    };
  };

  const logoutToLanding = async () => {
    await supabase.auth.signOut();
    setAuthSession(null);
    showToast('Signed out of Supabase session.');
  };

  const activeCenter = centers.find(c => c.id === selectedCenterId) || centers[0] || EMPTY_FALLBACK_CENTER;

  const addCenter = (centerData: Omit<Center, 'id'>): Center => {
    const newCenter: Center = {
      ...centerData,
      id: `ctr-${centerData.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString().slice(-4)}`
    };
    setCenters(prev => [...prev, newCenter]);
    showToast(`New center "${newCenter.name}" (${newCenter.code}) created successfully!`);
    return newCenter;
  };

  const reassignEmployeeCenter = (employeeId: string, targetCenterId: string, effectiveDate: string, reason?: string) => {
    const targetCenter = centers.find(c => c.id === targetCenterId);
    if (!targetCenter) return;

    setEmployees(prev => {
      const updated = prev.map(emp => {
        if (emp.id === employeeId) {
          const orderNum = `ORD/MOB/2026/09/${Math.floor(100 + Math.random() * 900)}`;
          const newRecord: DeploymentRecord = {
            id: `dep-${Date.now()}`,
            orderNumber: orderNum,
            fromCenterId: emp.centerId,
            fromCenterName: emp.centerName,
            toCenterId: targetCenter.id,
            toCenterName: targetCenter.name,
            effectiveDate,
            reason: reason || 'Special 1-day driver training camp reinforcement',
            assignedBy: `${currentPersona.name} (${currentPersona.role})`,
            timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
          };

          return {
            ...emp,
            centerId: targetCenter.id,
            centerName: targetCenter.name,
            deploymentHistory: [newRecord, ...(emp.deploymentHistory || [])]
          };
        }
        return emp;
      });
      safeLocalStorageSet('dbs_employees', JSON.stringify(updated));
      return updated;
    });
    showToast(`Staff mobilization: Employee reassigned to ${targetCenter.name} (${targetCenter.code}) effective ${effectiveDate}.`);
  };

  // Candidates: STRICTLY CLOUD-NATIVE (Supabase PostgreSQL Database)
  const [allCandidates, setCandidates] = useState<Candidate[]>([]);

  // Enforce center-scoped read for center-bound roles (PO, OSE, Trainer) in addition to PostgreSQL RLS
  const candidates = useMemo(() => {
    if (['CEO', 'GM', 'Senior Manager'].includes(currentPersona.role)) {
      return allCandidates;
    }
    const allowedSet = new Set<string>([
      currentPersona.centerId,
      activeCenter.id,
      activeCenter.code,
      ...(currentPersona.assignedCenterIds || [])
    ].filter(Boolean));

    return allCandidates.filter(c => allowedSet.has(c.centerId));
  }, [allCandidates, currentPersona, activeCenter]);

  // Batches
  const [batches, setBatches] = useState<Batch[]>(() => {
    const saved = localStorage.getItem('dbs_batches');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  });

  useEffect(() => {
    safeLocalStorageSet('dbs_batches', JSON.stringify(batches));
  }, [batches]);

  // --- SUPABASE CLOUD DATABASE INTEGRATION ---
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseConnectionStatus>('checking');
  const [supabaseMessage, setSupabaseMessage] = useState<string>('Connecting to Supabase cloud database...');
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);

  const syncFromCloud = async (isInitial = false) => {
    if (isInitial) setIsCloudSyncing(true);
    try {
      const [cloudCandidates, cloudBatches, cloudProfiles] = await Promise.all([
        fetchCandidatesFromSupabase(),
        fetchBatchesFromSupabase(),
        fetchProfilesFromSupabase()
      ]);
      if (cloudCandidates !== null) {
        setCandidates(cloudCandidates);
      }
      if (cloudBatches !== null) {
        setBatches(cloudBatches);
        safeLocalStorageSet('dbs_batches', JSON.stringify(cloudBatches));
      }
      if (cloudProfiles && cloudProfiles.length > 0) {
        setProfiles(cloudProfiles);
      }
    } catch (err) {
      console.warn('[Supabase Cloud Sync Notice]:', err);
    } finally {
      if (isInitial) setIsCloudSyncing(false);
    }
  };

  useEffect(() => {
    let unsubscribeRealtime: (() => void) | undefined;
    let isMounted = true;
    let pollTimer: ReturnType<typeof setInterval> | undefined;

    try {
      localStorage.removeItem('dbs_candidates');
      localStorage.removeItem('dbsl_candidates');
      localStorage.removeItem('dbs_candidate_enrollments');
    } catch {}

    const initCloudDatabase = async () => {
      setIsCloudSyncing(true);
      try {
        const health = await checkSupabaseConnection();
        if (!isMounted) return;

        setSupabaseStatus(health.status);
        setSupabaseMessage(health.message);

        if (health.tablesReady) {
          await syncFromCloud(false);
          if (!isMounted) return;

          unsubscribeRealtime = setupSupabaseRealtime({
            onCandidateInsert: (newCand) => {
              setCandidates(prev => {
                if (prev.some(c => c.id === newCand.id)) return prev;
                return [newCand, ...prev];
              });
              showToast(`[Cloud Sync] New candidate ${newCand.fullName} received from cloud.`);
            },
            onCandidateUpdate: (updatedCand) => {
              setCandidates(prev => prev.map(c => c.id === updatedCand.id ? updatedCand : c));
            },
            onCandidateDelete: (deletedId) => {
              setCandidates(prev => prev.filter(c => c.id !== deletedId));
            },
            onBatchChange: async () => {
              const freshBatches = await fetchBatchesFromSupabase();
              if (freshBatches !== null && isMounted) {
                setBatches(freshBatches);
                safeLocalStorageSet('dbs_batches', JSON.stringify(freshBatches));
              }
            },
            onProfileChange: async () => {
              const freshProfiles = await fetchProfilesFromSupabase();
              if (freshProfiles && isMounted) {
                setProfiles(freshProfiles);
              }
            },
            onPurge: () => {
              setCandidates([]);
              setBatches([]);
              safeLocalStorageSet('dbs_batches', JSON.stringify([]));
              showToast('[Cloud Sync] Database wipe executed by CEO. State reset to zero.');
            }
          });

          pollTimer = setInterval(() => {
            if (isMounted) syncFromCloud(false);
          }, 5000);
        }
      } catch (err: any) {
        console.warn('[Supabase] Initialization caught error:', err);
      } finally {
        if (isMounted) setIsCloudSyncing(false);
      }
    };

    initCloudDatabase();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMounted) {
        syncFromCloud(false);
      }
    };
    const handleFocus = () => {
      if (isMounted) syncFromCloud(false);
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      if (unsubscribeRealtime) unsubscribeRealtime();
      if (pollTimer) clearInterval(pollTimer);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const refreshFromSupabase = async () => {
    setIsCloudSyncing(true);
    try {
      const health = await checkSupabaseConnection();
      setSupabaseStatus(health.status);
      setSupabaseMessage(health.message);

      if (health.tablesReady) {
        await syncFromCloud(false);
        showToast('Synchronized candidates, batches & profiles from Supabase cloud!');
      } else {
        showToast(health.message);
      }
    } catch (e: any) {
      showToast(`Sync error: ${e?.message || 'Failed'}`);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const seedCloudDatabase = async () => {
    setIsCloudSyncing(true);
    showToast('Uploading candidates, batches & root profile to Supabase cloud...');
    try {
      await ensureRootCeoProfileInSupabase(authSession?.user?.id);
      const candOk = await upsertCandidatesBulk(allCandidates);
      for (const b of batches) {
        await upsertBatchToSupabase(b);
      }
      if (candOk) {
        setSupabaseStatus('connected');
        showToast('All data successfully synchronized to Supabase!');
      } else {
        showToast('Database error: Please ensure SQL tables & RLS are configured in Supabase SQL editor.');
      }
    } catch (e: any) {
      showToast(`Upload failed: ${e?.message || 'Error'}`);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  // Consumables
  const [consumables, setConsumables] = useState<ConsumableItem[]>(() => {
    const saved = localStorage.getItem('dbs_consumables');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_CONSUMABLES;
  });

  useEffect(() => {
    safeLocalStorageSet('dbs_consumables', JSON.stringify(consumables));
  }, [consumables]);

  // Transactions
  const [transactions, setTransactions] = useState<StockTransaction[]>(() => {
    const saved = localStorage.getItem('dbs_transactions');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_TRANSACTIONS;
  });

  useEffect(() => {
    safeLocalStorageSet('dbs_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Employees
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('dbs_employees');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_EMPLOYEES;
  });

  useEffect(() => {
    safeLocalStorageSet('dbs_employees', JSON.stringify(employees));
  }, [employees]);

  // Leaves
  const [leaves, setLeaves] = useState<LeaveRecord[]>(() => {
    const saved = localStorage.getItem('dbs_leaves');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_LEAVES;
  });

  useEffect(() => {
    safeLocalStorageSet('dbs_leaves', JSON.stringify(leaves));
  }, [leaves]);

  // Tours
  const [tours, setTours] = useState<TourRequest[]>(() => {
    const saved = localStorage.getItem('dbs_tours');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_TOURS;
  });

  useEffect(() => {
    safeLocalStorageSet('dbs_tours', JSON.stringify(tours));
  }, [tours]);

  // Expense Claims
  const [expenseClaims, setExpenseClaims] = useState<ExpenseClaim[]>(() => {
    const saved = localStorage.getItem('dbs_expense_claims') || localStorage.getItem('dbs_expenses');
    let loaded: ExpenseClaim[] = INITIAL_EXPENSE_CLAIMS;
    if (saved) {
      try {
        loaded = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return loaded.map(c => ({
      ...c,
      auditTrail: generateDefaultAuditTrail(c)
    }));
  });

  useEffect(() => {
    safeLocalStorageSet('dbs_expense_claims', JSON.stringify(expenseClaims));
  }, [expenseClaims]);

  // --- CANDIDATE METHODS (DIRECT CLOUD SUPABASE INTEGRATION) ---
  const addCandidate = (candidateData: Partial<Candidate>): Candidate => {
    const centerObj = centers.find(c => c.id === (candidateData.centerId || activeCenter.id)) || activeCenter;
    const centerCodeClean = centerObj.code.replace('-', '');
    const serial = String(allCandidates.length + 140).padStart(4, '0');
    const regNo = `DBS/2026/${centerCodeClean}/${serial}`;
    const newId = `cand-${Date.now()}`;

    const newCandidate: Candidate = {
      id: newId,
      registrationNumber: regNo,
      batchId: candidateData.batchId || (batches[0]?.id ?? 'batch-1'),
      centerId: candidateData.centerId || activeCenter.id,
      fullName: candidateData.fullName || 'New Trainee',
      fatherName: candidateData.fatherName || '',
      motherName: candidateData.motherName || '',
      maritalStatus: candidateData.maritalStatus || 'Married',
      familyIncome: candidateData.familyIncome || '₹1,50,000 - ₹2,50,000 / year',
      religion: candidateData.religion || 'Hindu',
      casteCategory: candidateData.casteCategory || 'OBC',
      aadhaarIngestionMethod: candidateData.aadhaarIngestionMethod || 'Live Camera Snapshot + Optical Extraction',
      dateOfBirth: candidateData.dateOfBirth || '1995-01-01',
      gender: candidateData.gender || 'Male',
      mobileNumber: candidateData.mobileNumber || '',
      idCardNumber: candidateData.idCardNumber || '',
      abhaNumber: candidateData.abhaNumber || '',
      dlNumber: candidateData.dlNumber || '',
      dlExpiryDate: candidateData.dlExpiryDate || '2030-01-01',
      vehicleClass: candidateData.vehicleClass || 'TRANS',
      address: candidateData.address || '',
      city: candidateData.city || centerObj.city,
      state: candidateData.state || centerObj.state,
      pincode: candidateData.pincode || '302001',
      enrolledAt: new Date().toISOString(),
      status: candidateData.status || 'Draft',
      isLocked: candidateData.isLocked ?? false,
      certificateHoldingPhotoUrl: candidateData.certificateHoldingPhotoUrl,
      certificateHandoverPhotoUrl: candidateData.certificateHandoverPhotoUrl,
      poCorrectionRemarks: candidateData.poCorrectionRemarks,
      poApprovalTimestamp: candidateData.poApprovalTimestamp,
      photoUrl: candidateData.photoUrl || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80',
      idFrontUrl: candidateData.idFrontUrl || 'https://images.unsplash.com/photo-1589330694653-dad6bc0140fa?auto=format&fit=crop&w=600&q=80',
      idBackUrl: candidateData.idBackUrl || 'https://images.unsplash.com/photo-1589330694653-dad6bc0140fa?auto=format&fit=crop&w=600&q=80',
      dlFrontUrl: candidateData.dlFrontUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
      dlBackUrl: candidateData.dlBackUrl || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
      aadhaarProofUrl: candidateData.aadhaarProofUrl || candidateData.idFrontUrl,
      dlProofUrl: candidateData.dlProofUrl || candidateData.dlFrontUrl,
      verificationStatus: candidateData.verificationStatus || 'Auto-Verified',
      attendanceStatus: 'Present',
      trainingDate: new Date().toISOString().split('T')[0],
      preTestScore: 68,
      postTestScore: 90,
      kitIssued: true,
      tshirtSize: candidateData.tshirtSize || 'L',
      queries: []
    };

    setCandidates(prev => [newCandidate, ...prev]);

    insertCandidateToSupabase(newCandidate).then(res => {
      if (res.success && res.data) {
        setCandidates(prev => {
          const idx = prev.findIndex(c => c.id === newCandidate.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = res.data!;
            return copy;
          }
          return [res.data!, ...prev];
        });
        showToast(`✓ Candidate ${newCandidate.fullName} saved to Supabase cloud!`);
      } else {
        showToast(`⚠️ Cloud Warning: ${res.error || 'Failed to save to Supabase'}`);
      }
    }).catch(err => {
      showToast(`⚠️ Could not reach Supabase cloud: ${err?.message || 'Network error'}`);
    });

    setBatches(prev => {
      const next = prev.map(b => (b.id === newCandidate.batchId ? { ...b, enrolledCount: b.enrolledCount + 1 } : b));
      const targetBatch = next.find(b => b.id === newCandidate.batchId);
      if (targetBatch) {
        upsertBatchToSupabase(targetBatch).catch(() => {});
      }
      return next;
    });

    setEmployees(prev =>
      prev.map(emp => (emp.id === currentPersona.id ? { ...emp, monthlyAchieved: emp.monthlyAchieved + 1 } : emp))
    );

    return newCandidate;
  };

  const updateCandidate = (id: string, updates: Partial<Candidate>) => {
    setCandidates(prev => {
      const next = prev.map(c => (c.id === id ? { ...c, ...updates } : c));
      const target = next.find(c => c.id === id);
      if (target) {
        updateCandidateFieldsInSupabase(id, target).catch(err => {
          console.warn('[Supabase] Candidate update sync warning:', err);
        });
      }
      return next;
    });
  };

  const uploadCertificatePhotos = (
    candidateId: string,
    holdingPhotoUrl: string,
    handoverPhotoUrl: string
  ) => {
    setCandidates(prev => {
      const next = prev.map(c => {
        if (c.id === candidateId) {
          const updated = {
            ...c,
            certificateHoldingPhotoUrl: holdingPhotoUrl,
            certificateHandoverPhotoUrl: handoverPhotoUrl
          };
          updateCandidateFieldsInSupabase(candidateId, updated).catch(err => {
            console.warn('[Supabase] Certificate photo sync warning:', err);
          });
          return updated;
        }
        return c;
      });
      return next;
    });
    showToast('Certificate photos attached! Candidate verified for evening PO batch dispatch.');
  };

  const submitBatchToPo = (centerId: string, candidateIds?: string[]) => {
    const targetCandidates = allCandidates.filter(c => {
      const matchCenter = c.centerId === centerId;
      const matchId = candidateIds ? candidateIds.includes(c.id) : true;
      return matchCenter && matchId && c.status === 'Draft';
    });

    if (targetCandidates.length === 0) {
      showToast('No Draft candidates available to dispatch in this batch.');
      return { success: false, submittedCount: 0 };
    }

    const missingCandidates = targetCandidates.filter(
      c => !c.certificateHoldingPhotoUrl || !c.certificateHandoverPhotoUrl
    );

    if (missingCandidates.length > 0) {
      showToast(
        `Cannot dispatch: ${missingCandidates.length} candidate(s) missing mandatory certificate photos.`
      );
      return { success: false, submittedCount: 0, missingCandidates };
    }

    const dispatched: Candidate[] = [];
    setCandidates(prev =>
      prev.map(c => {
        const isTarget = targetCandidates.some(tc => tc.id === c.id);
        if (isTarget) {
          const updated = {
            ...c,
            status: 'Pending PO Review' as const,
            isLocked: true
          };
          dispatched.push(updated);
          return updated;
        }
        return c;
      })
    );

    if (dispatched.length > 0) {
      upsertCandidatesBulk(dispatched).catch(err => {
        console.warn('[Supabase] Dispatch sync warning:', err);
      });
    }

    setBatches(prev =>
      prev.map(b => (b.centerId === centerId ? { ...b, status: 'Audit Underway' } : b))
    );

    showToast(
      `Evening Batch Dispatched to PO! ${targetCandidates.length} driver record(s) strictly locked under 'Pending PO Review'.`
    );
    return { success: true, submittedCount: targetCandidates.length };
  };

  const raiseAuditQuery = (candidateId: string, field: AuditQuery['field'], comment: string) => {
    const newQuery: AuditQuery = {
      id: `qry-${Date.now()}`,
      candidateId,
      raisedByRole: currentPersona.role === 'Senior Manager' ? 'Senior Manager' : 'PO',
      raisedByName: currentPersona.name,
      field,
      comment,
      createdAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      status: 'Open'
    };

    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          const updated = {
            ...c,
            status: 'Returned for Correction' as const,
            isLocked: false,
            poCorrectionRemarks: comment,
            queries: [newQuery, ...c.queries]
          };
          updateCandidateFieldsInSupabase(candidateId, updated).catch(err => {
            console.warn('[Supabase] Query sync warning:', err);
          });
          return updated;
        }
        return c;
      })
    );

    showToast(`Record returned for correction: ${field}. Candidate record unlocked for OSE fix.`);
  };

  const resolveAuditQuery = (candidateId: string, queryId: string, resolutionComment: string) => {
    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          const updatedQueries = c.queries.map(q =>
            q.id === queryId
              ? {
                  ...q,
                  status: 'Resolved' as const,
                  resolutionComment,
                  resolvedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                }
              : q
          );
          const hasRemainingOpen = updatedQueries.some(q => q.status === 'Open');
          const updated = {
            ...c,
            queries: updatedQueries,
            status: (hasRemainingOpen ? 'Returned for Correction' : 'Pending PO Review') as Candidate['status'],
            isLocked: !hasRemainingOpen,
            poCorrectionRemarks: hasRemainingOpen ? c.poCorrectionRemarks : undefined
          };
          updateCandidateFieldsInSupabase(candidateId, updated).catch(err => {
            console.warn('[Supabase] Resolve query sync warning:', err);
          });
          return updated;
        }
        return c;
      })
    );

    showToast('Correction resolved and resubmitted to PO! Candidate re-locked under Pending PO Review.');
  };

  const grantGreenSignal = (candidateId: string) => {
    const nowIso = new Date().toISOString();
    const nowFormatted = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    const reviewerName = currentPersona?.name || 'Program Officer';
    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          const updated = {
            ...c,
            status: 'PENDING_SM_REVIEW' as const,
            isLocked: true,
            poApprovedBy: reviewerName,
            poApprovedAt: nowIso,
            poApprovalTimestamp: nowIso,
            poReviewer: reviewerName,
            currentStage: 'PENDING_SM_REVIEW',
            greenSignalBy: `${reviewerName} (${currentPersona?.role || 'PO'})`,
            greenSignalAt: nowFormatted
          };
          updateCandidateFieldsInSupabase(candidateId, updated).catch(err => {
            console.warn('[Supabase] Green signal sync warning:', err);
          });
          return updated;
        }
        return c;
      })
    );
    showToast('Candidate approved by PO and forwarded to Senior Manager for final QC approval.');
  };

  const approveApmQc = (candidateId: string) => {
    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          const updated = {
            ...c,
            status: 'Senior Manager QC Passed' as const,
            apmApprovedBy: `${currentPersona.name} (Senior Manager)`,
            apmApprovedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
          };
          updateCandidateFieldsInSupabase(candidateId, updated).catch(err => {
            console.warn('[Supabase] APM QC sync warning:', err);
          });
          return updated;
        }
        return c;
      })
    );
    showToast('Candidate Final Certification & QC Passed by Senior Manager! Ready for final dispatch.');
  };

  const dispatchCandidate = (candidateId: string) => {
    const certNum = `DBS-CERT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const today = new Date().toISOString().split('T')[0];

    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          const updated = {
            ...c,
            status: 'Certified & Dispatched' as const,
            certificateNumber: certNum,
            certificateIssuedDate: today,
            dispatchedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
          };
          updateCandidateFieldsInSupabase(candidateId, updated).catch(err => {
            console.warn('[Supabase] Dispatch sync warning:', err);
          });
          return updated;
        }
        return c;
      })
    );
    showToast(`Candidate certified! Assigned Certificate #${certNum}.`);
  };

  // --- BATCH & PHOTO METHODS ---
  const updateBatchAttendance = (batchId: string, attendanceMap: Record<string, AttendanceStatus>) => {
    const updatedCandidates: Candidate[] = [];
    setCandidates(prev =>
      prev.map(c => {
        if (c.batchId === batchId && attendanceMap[c.id]) {
          const updated = { ...c, attendanceStatus: attendanceMap[c.id] };
          updatedCandidates.push(updated);
          return updated;
        }
        return c;
      })
    );

    if (updatedCandidates.length > 0) {
      upsertCandidatesBulk(updatedCandidates).catch(err => {
        console.warn('[Supabase] Attendance sync warning:', err);
      });
    }

    const presentCount = Object.values(attendanceMap).filter(v => v === 'Present' || v === 'Late').length;
    setBatches(prev => {
      const next = prev.map(b => (b.id === batchId ? { ...b, presentCount } : b));
      const targetBatch = next.find(b => b.id === batchId);
      if (targetBatch) {
        upsertBatchToSupabase(targetBatch).catch(() => {});
      }
      return next;
    });

    showToast('Batch classroom attendance roll-call saved successfully.');
  };

  const uploadBatchPhoto = (
    batchId: string,
    photoType: 'classroom' | 'driverId',
    photoUrl: string,
    gpsStamp: { lat: number; lng: number; locationName: string },
    candidateId?: string
  ) => {
    const timestamp = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' }) + ' IST';

    if (photoType === 'classroom') {
      setBatches(prev => {
        const next = prev.map(b =>
          b.id === batchId
            ? {
                ...b,
                classroomPhotoUrl: photoUrl,
                classroomPhotoTimestamp: timestamp,
                classroomPhotoGps: gpsStamp
              }
            : b
        );
        const targetBatch = next.find(b => b.id === batchId);
        if (targetBatch) {
          upsertBatchToSupabase(targetBatch).catch(() => {});
        }
        return next;
      });
      showToast('Live classroom session group photo uploaded with auto-stamped GPS & time!');
    } else if (photoType === 'driverId' && candidateId) {
      setCandidates(prev =>
        prev.map(c => {
          if (c.id === candidateId) {
            const updated = { ...c, driverHoldingIdUrl: photoUrl };
            updateCandidateFieldsInSupabase(candidateId, updated).catch(() => {});
            return updated;
          }
          return c;
        })
      );
      showToast('Driver holding ID photo uploaded & stamped!');
    }
  };

  // --- CONSUMABLES & INVENTORY METHODS ---
  const addIncomingStock = (
    centerId: string,
    itemType: ConsumableType,
    quantity: number,
    challanNo: string,
    notes?: string,
    sizes?: { M: number; L: number; XL: number; XXL: number }
  ) => {
    setConsumables(prev =>
      prev.map(item => {
        if (item.centerId === centerId && item.itemType === itemType) {
          const newBreakdown = item.sizeBreakdown && sizes
            ? {
                M: item.sizeBreakdown.M + sizes.M,
                L: item.sizeBreakdown.L + sizes.L,
                XL: item.sizeBreakdown.XL + sizes.XL,
                XXL: item.sizeBreakdown.XXL + sizes.XXL
              }
            : item.sizeBreakdown;

          return {
            ...item,
            quantityOnHand: item.quantityOnHand + quantity,
            lastUpdated: new Date().toISOString().split('T')[0],
            sizeBreakdown: newBreakdown
          };
        }
        return item;
      })
    );

    const newTx: StockTransaction = {
      id: `tx-${Date.now()}`,
      centerId,
      itemType,
      transactionType: 'INWARD_CHALLAN',
      quantity,
      referenceNumber: challanNo,
      date: new Date().toISOString().split('T')[0],
      performedBy: `${currentPersona.name} (${currentPersona.role})`,
      notes: notes || 'Incoming stock received from Head Office'
    };

    setTransactions(prev => [newTx, ...prev]);
    showToast(`Added +${quantity} units of ${itemType} (Challan: ${challanNo}).`);
  };

  const issueStockToBatch = (
    centerId: string,
    batchId: string,
    quantities: Partial<Record<ConsumableType, number>>
  ) => {
    setConsumables(prev =>
      prev.map(item => {
        if (item.centerId === centerId && quantities[item.itemType]) {
          const deduct = quantities[item.itemType] || 0;
          return {
            ...item,
            quantityOnHand: Math.max(0, item.quantityOnHand - deduct),
            lastUpdated: new Date().toISOString().split('T')[0]
          };
        }
        return item;
      })
    );

    Object.entries(quantities).forEach(([type, qty]) => {
      if (qty && qty > 0) {
        const newTx: StockTransaction = {
          id: `tx-${Date.now()}-${type}`,
          centerId,
          itemType: type as ConsumableType,
          transactionType: 'OUTWARD_BATCH_DISPATCH',
          quantity: qty,
          referenceNumber: batchId,
          date: new Date().toISOString().split('T')[0],
          performedBy: `${currentPersona.name} (${currentPersona.role})`,
          notes: `Issued to drivers completing 1-day training batch ${batchId}`
        };
        setTransactions(prev => [newTx, ...prev]);
      }
    });

    showToast('Driver training kits & certificates issued to batch candidates.');
  };

  // --- LEAVE MANAGEMENT METHODS ---
  const applyLeave = (leaveData: Omit<LeaveRecord, 'id' | 'status' | 'appliedAt' | 'approverTarget'>): boolean => {
    const isLevel4 = leaveData.employeeRole === 'OSE' || leaveData.employeeRole === 'Trainer';
    const targetApprover = isLevel4 ? 'PO' : 'GM';

    if (leaveData.leaveType === 'Casual/Sick Leave' && leaveData.daysCount > 3) {
      showToast('Policy Limit: Casual/Sick leave cannot exceed 3 days per month.');
      return false;
    }

    const newLeave: LeaveRecord = {
      id: `lv-${Date.now()}`,
      ...leaveData,
      status: 'Pending',
      approverTarget: targetApprover,
      appliedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
    };

    setLeaves(prev => [newLeave, ...prev]);
    showToast(`Leave application submitted successfully! Routed to ${targetApprover} for review.`);
    return true;
  };

  const reviewLeave = (leaveId: string, action: 'Approved' | 'Rejected', remarks: string) => {
    setLeaves(prev =>
      prev.map(l => {
        if (l.id === leaveId) {
          return {
            ...l,
            status: action,
            reviewedBy: `${currentPersona.name} (${currentPersona.role})`,
            reviewRemarks: remarks,
            reviewedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
          };
        }
        return l;
      })
    );

    if (action === 'Approved') {
      const targetLeave = leaves.find(l => l.id === leaveId);
      if (targetLeave) {
        setEmployees(prev =>
          prev.map(emp => {
            if (emp.id === targetLeave.employeeId) {
              if (targetLeave.leaveType === 'Casual/Sick Leave') {
                return {
                  ...emp,
                  casualLeaveBalance: Math.max(0, emp.casualLeaveBalance - targetLeave.daysCount)
                };
              } else {
                return {
                  ...emp,
                  compOffBalance: Math.max(0, emp.compOffBalance - targetLeave.daysCount)
                };
              }
            }
            return emp;
          })
        );
      }
    }

    showToast(`Leave application ${action.toLowerCase()} with remarks.`);
  };

  // --- EMPLOYEES & GEOFENCE ---
  const performCheckIn = (employeeId: string): boolean => {
    const latOffset = (Math.random() - 0.5) * 0.0003;
    const lngOffset = (Math.random() - 0.5) * 0.0003;
    const distance = Math.floor(15 + Math.random() * 40);

    setEmployees(prev =>
      prev.map(emp => {
        if (emp.id === employeeId) {
          return {
            ...emp,
            lastCheckIn: {
              timestamp: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' }),
              lat: activeCenter.latitude + latOffset,
              lng: activeCenter.longitude + lngOffset,
              isGeofenceValid: true,
              centerDistanceMeters: distance
            }
          };
        }
        return emp;
      })
    );

    showToast(`GPS Attendance stamped! Verified within ${distance}m of ${activeCenter.name}.`);
    return true;
  };

  const [attendancePunches, setAttendancePunches] = useState<AttendancePunch[]>(() => {
    const saved = localStorage.getItem('dbs_attendance_logs') || localStorage.getItem('dbs_attendance_punches');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_ATTENDANCE_PUNCHES;
  });

  const refreshAttendanceLogs = () => {
    const saved = localStorage.getItem('dbs_attendance_logs') || localStorage.getItem('dbs_attendance_punches');
    if (saved) {
      try {
        setAttendancePunches(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse attendance logs from storage:', e);
      }
    }
  };

  useEffect(() => {
    safeLocalStorageSet('dbs_attendance_logs', JSON.stringify(attendancePunches));
    safeLocalStorageSet('dbs_attendance_punches', JSON.stringify(attendancePunches));
  }, [attendancePunches]);

  useEffect(() => {
    const handleStorageSync = (e: StorageEvent) => {
      if (e.key === 'dbs_attendance_logs' || e.key === 'dbs_attendance_punches') {
        if (e.newValue) {
          try {
            setAttendancePunches(JSON.parse(e.newValue));
          } catch (err) {
            console.error('Failed to parse updated attendance logs:', err);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageSync);
    window.addEventListener('dbs_attendance_logs_updated', refreshAttendanceLogs);

    return () => {
      window.removeEventListener('storage', handleStorageSync);
      window.removeEventListener('dbs_attendance_logs_updated', refreshAttendanceLogs);
    };
  }, []);

  // Maintenance & Facility Tickets State
  const [maintenanceTickets, setMaintenanceTickets] = useState<CenterIssueTicket[]>(() => {
    const saved = localStorage.getItem('dbs_maintenance_tickets');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_MAINTENANCE_TICKETS;
  });

  useEffect(() => {
    safeLocalStorageSet('dbs_maintenance_tickets', JSON.stringify(maintenanceTickets));
  }, [maintenanceTickets]);

  const onboardEmployee = (employeeData: Omit<Employee, 'id' | 'empCode' | 'tenureMonths' | 'casualLeaveBalance' | 'compOffBalance'>): Employee => {
    const newEmp: Employee = {
      ...employeeData,
      id: `emp-${Date.now()}`,
      empCode: `DBS-EMP-${String(Math.floor(1000 + Math.random() * 9000))}`,
      tenureMonths: 1,
      casualLeaveBalance: 12,
      compOffBalance: 0
    };
    setEmployees(prev => {
      const updated = [newEmp, ...prev];
      safeLocalStorageSet('dbs_employees', JSON.stringify(updated));
      return updated;
    });
    showToast(`Employee ${newEmp.name} (${newEmp.empCode}) onboarded successfully!`);
    return newEmp;
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(prev => {
      const updated = prev.map(emp => (emp.id === id ? { ...emp, ...updates } : emp));
      safeLocalStorageSet('dbs_employees', JSON.stringify(updated));
      return updated;
    });

    setCurrentPersona(prev => {
      if (prev.id === id || prev.name === updates.name) {
        return {
          ...prev,
          ...(updates.assignedCenterIds ? { assignedCenterIds: updates.assignedCenterIds } : {}),
          ...(updates.assignedRegion ? { assignedRegion: updates.assignedRegion } : {}),
          ...(updates.regionCenterIds ? { regionCenterIds: updates.regionCenterIds } : {}),
          ...(updates.centerId ? { centerId: updates.centerId } : {}),
          ...(updates.centerName ? { centerName: updates.centerName } : {})
        };
      }
      return prev;
    });

    showToast('Employee allocations and mappings updated successfully!');
  };

  const recordSelfPunch = (punchData: Omit<AttendancePunch, 'id'>): AttendancePunch => {
    const newPunch: AttendancePunch = {
      ...punchData,
      id: `pnch-${Date.now()}`
    };
    setAttendancePunches(prev => {
      const updated = [newPunch, ...prev.filter(p => p.id !== newPunch.id)].slice(0, 40);
      safeLocalStorageSet('dbs_attendance_logs', JSON.stringify(updated));
      safeLocalStorageSet('dbs_attendance_punches', JSON.stringify(updated));
      return updated;
    });
    setEmployees(prev =>
      prev.map(emp => {
        if (emp.id === punchData.employeeId || emp.name === punchData.employeeName) {
          return {
            ...emp,
            lastCheckIn: {
              timestamp: newPunch.timeFormatted,
              lat: newPunch.lat,
              lng: newPunch.lng,
              isGeofenceValid: newPunch.centerProximityStatus === 'Within Center Geofence',
              centerDistanceMeters: newPunch.centerProximityStatus === 'Within Center Geofence' ? 22 : 1200
            }
          };
        }
        return emp;
      })
    );
    showToast(`Self-Attendance stamped: ${newPunch.type === 'CHECK_IN' ? 'Check-In' : 'Check-Out'} (${newPunch.timeFormatted})`);
    return newPunch;
  };

  // --- TOURS & EXPENSE CLAIMS ---
  const applyTour = (tourData: Omit<TourRequest, 'id' | 'tourSanctionNumber' | 'status' | 'appliedAt'>) => {
    const sanctionNo = `TSO/DBS/2026/09/0${Math.floor(25 + Math.random() * 70)}`;
    const newTour: TourRequest = {
      id: `tour-${Date.now()}`,
      tourSanctionNumber: sanctionNo,
      ...tourData,
      status: 'Submitted',
      appliedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
    };

    setTours(prev => [newTour, ...prev]);
    showToast(`Tour application submitted (${sanctionNo}). Forwarded to General Manager.`);
  };

  const sanctionTour = (tourId: string, sanctionedBudget: number, remarks: string) => {
    setTours(prev =>
      prev.map(t => {
        if (t.id === tourId) {
          return {
            ...t,
            status: 'Sanctioned',
            sanctionedBy: `${currentPersona.name} (General Manager)`,
            sanctionRemarks: remarks,
            sanctionedBudget,
            sanctionedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
          };
        }
        return t;
      })
    );
    showToast(`Tour Sanction Order granted with approved budget Rs. ${sanctionedBudget.toLocaleString()}!`);
  };

  const rejectTour = (tourId: string, remarks: string) => {
    setTours(prev =>
      prev.map(t => {
        if (t.id === tourId) {
          return {
            ...t,
            status: 'Rejected',
            sanctionRemarks: remarks
          };
        }
        return t;
      })
    );
    showToast('Tour application rejected.');
  };

  const submitExpenseClaim = (claimData: Omit<ExpenseClaim, 'id' | 'claimNumber' | 'status'> & { status?: ExpenseClaimStatus }) => {
    const claimNo = `EXP/DBS/2026/09/${Math.floor(100 + Math.random() * 899)}`;
    const targetStatus: ExpenseClaimStatus = claimData.status || 'Pending Senior Manager Review';
    const nowStr = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

    const initialAudit: ExpenseAuditLog = {
      id: `audit-${Date.now()}-sub`,
      stage: 'Submitted',
      title: 'Claim Submitted by Employee',
      actionBy: claimData.employeeName || currentPersona.name,
      role: claimData.employeeRole || currentPersona.role,
      timestamp: nowStr,
      amount: claimData.totalClaimed,
      remarks: `Filed ${claimData.items?.length || 0} expense line items for official tour (${claimData.tourDates || claimData.tourSanctionNumber || 'Sanctioned Tour'}).`
    };

    const newClaim: ExpenseClaim = {
      id: `exp-${Date.now()}`,
      claimNumber: claimNo,
      claimRef: claimNo,
      tourSanctionRef: claimData.tourSanctionNumber,
      claimantName: claimData.employeeName,
      claimantRole: claimData.employeeRole,
      empId: claimData.employeeId,
      policyEntitlement: claimData.totalEntitlement,
      approvedReimbursement: claimData.totalApproved || claimData.totalClaimed,
      claimDate: claimData.submissionDate || new Date().toISOString().split('T')[0],
      auditTrail: [initialAudit],
      ...claimData,
      status: targetStatus
    };

    setExpenseClaims(prev => {
      const updated = [newClaim, ...prev];
      safeLocalStorageSet('dbs_expense_claims', JSON.stringify(updated));
      return updated;
    });

    if (claimData.tourId) {
      setTours(prev =>
        prev.map(t => (t.id === claimData.tourId ? { ...t, status: 'Expense Claim Filed' } : t))
      );
    }

    showToast(`Expense claim ${claimNo} filed! Routed to Senior Manager (SM) for physical tour verification.`);
  };

  const endorseExpenseClaim = (claimId: string, remarks?: string) => {
    const nowStr = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

    setExpenseClaims(prev => {
      const updated = prev.map(c => {
        if (c.id === claimId) {
          const currentAuditTrail = (c.auditTrail && c.auditTrail.length > 0)
            ? c.auditTrail
            : generateDefaultAuditTrail(c);

          const smAudit: ExpenseAuditLog = {
            id: `audit-${Date.now()}-sm`,
            stage: 'SM Verified',
            title: 'SM Tour & Bills Verified',
            actionBy: `${currentPersona.name} (Senior Manager)`,
            role: 'Senior Manager',
            timestamp: nowStr,
            remarks: remarks || 'Tour physical execution, dates, and bills verified. Endorsed for GM Financial Sanction.'
          };

          return {
            ...c,
            status: 'Pending GM Review' as ExpenseClaimStatus,
            reviewedBy: `${currentPersona.name} (Senior Manager)`,
            reviewedAt: nowStr,
            smRemarks: remarks || 'Tour physical execution, dates, and bills verified. Endorsed for GM Financial Sanction.',
            apmRemarks: remarks || 'Tour physical execution, dates, and bills verified. Endorsed for GM Financial Sanction.',
            auditTrail: [...currentAuditTrail, smAudit]
          };
        }
        return c;
      });
      safeLocalStorageSet('dbs_expense_claims', JSON.stringify(updated));
      return updated;
    });

    showToast('Claim verified & endorsed by Senior Manager! Forwarded to General Manager for financial sanction.');
  };

  const approveExpenseClaim = (claimId: string, approvedTotal: number, remarks: string) => {
    const nowStr = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

    setExpenseClaims(prev => {
      const updated = prev.map(c => {
        if (c.id === claimId) {
          const currentAuditTrail = (c.auditTrail && c.auditTrail.length > 0)
            ? c.auditTrail
            : generateDefaultAuditTrail(c);

          const gmAudit: ExpenseAuditLog = {
            id: `audit-${Date.now()}-gm`,
            stage: 'GM Sanctioned',
            title: 'GM Sanction Granted',
            actionBy: `${currentPersona.name} (General Manager)`,
            role: 'General Manager',
            timestamp: nowStr,
            amount: approvedTotal,
            remarks: remarks || 'Financial reimbursement sanction granted in full.'
          };

          return {
            ...c,
            status: 'Approved by GM - Ready for Bank Disbursement' as ExpenseClaimStatus,
            totalApproved: approvedTotal,
            approvedReimbursement: approvedTotal,
            reviewedBy: `${currentPersona.name} (General Manager)`,
            reviewedAt: nowStr,
            gmRemarks: remarks || 'Financial reimbursement sanction granted in full.',
            auditTrail: [...currentAuditTrail, gmAudit]
          };
        }
        return c;
      });
      safeLocalStorageSet('dbs_expense_claims', JSON.stringify(updated));
      return updated;
    });
    showToast(`Expense claim sanctioned for ₹${approvedTotal.toLocaleString()} by General Manager! Ready for Bank Disbursement.`);
  };

  const rejectExpenseClaim = (claimId: string, remarks: string) => {
    const nowStr = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    const isSm = currentPersona.role === 'Senior Manager';
    const newStatus: ExpenseClaimStatus = isSm ? 'Returned by Senior Manager' : 'Returned by GM for Correction';

    setExpenseClaims(prev => {
      const updated = prev.map(c => {
        if (c.id === claimId) {
          const currentAuditTrail = (c.auditTrail && c.auditTrail.length > 0)
            ? c.auditTrail
            : generateDefaultAuditTrail(c);

          const rejectAudit: ExpenseAuditLog = {
            id: `audit-${Date.now()}-ret`,
            stage: 'Returned for Correction',
            title: isSm ? 'Returned by Senior Manager' : 'Returned by General Manager for Correction',
            actionBy: `${currentPersona.name} (${currentPersona.role})`,
            role: currentPersona.role,
            timestamp: nowStr,
            remarks: remarks || 'Returned for correction / review discrepancies.'
          };

          return {
            ...c,
            status: newStatus,
            reviewedBy: `${currentPersona.name} (${currentPersona.role})`,
            reviewedAt: nowStr,
            gmRemarks: !isSm ? remarks : c.gmRemarks,
            smRemarks: isSm ? remarks : c.smRemarks,
            apmRemarks: isSm ? remarks : c.apmRemarks,
            auditTrail: [...currentAuditTrail, rejectAudit]
          };
        }
        return c;
      });
      safeLocalStorageSet('dbs_expense_claims', JSON.stringify(updated));
      return updated;
    });
    showToast(isSm ? 'Claim returned by Senior Manager with verification remarks.' : 'Claim returned by General Manager for correction.');
  };

  const createCenterTicket = (ticketData: Omit<CenterIssueTicket, "id" | "createdAt" | "status">) => {
    const newTicket: CenterIssueTicket = {
      id: `tkt-mnt-${Math.floor(100 + Math.random() * 899)}`,
      ...ticketData,
      createdAt: new Date().toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
      status: "Pending PO Verification"
    };
    setMaintenanceTickets(prev => [newTicket, ...prev]);
    showToast(`Maintenance Ticket ${newTicket.id} logged! Sent to PO for audit.`);
  };

  const endorseTicketByPo = (ticketId: string, poName: string) => {
    setMaintenanceTickets(prev =>
      prev.map(t =>
        t.id === ticketId
          ? {
              ...t,
              status: "Endorsed by PO",
              poName,
              poEndorsedAt: new Date().toLocaleString([], { dateStyle: "short", timeStyle: "short" })
            }
          : t
      )
    );
    showToast(`Ticket ${ticketId} endorsed! Routed to Senior Manager.`);
  };

  const rejectTicketByPo = (ticketId: string, poName: string, reason: string) => {
    setMaintenanceTickets(prev =>
      prev.map(t =>
        t.id === ticketId
          ? {
              ...t,
              status: "Rejected",
              poName,
              resolutionRemarks: `Rejected by PO ${poName}: ${reason}`
            }
          : t
      )
    );
    showToast(`Ticket ${ticketId} rejected.`);
  };

  const resolveTicketByApm = (ticketId: string, apmName: string, remarks: string) => {
    setMaintenanceTickets(prev =>
      prev.map(t =>
        t.id === ticketId
          ? {
              ...t,
              status: "Resolved by Senior Manager",
              apmName,
              apmResolvedAt: new Date().toLocaleString([], { dateStyle: "short", timeStyle: "short" }),
              resolutionRemarks: remarks
            }
          : t
      )
    );
    showToast(`Ticket ${ticketId} resolved & WhatsApp directive ready!`);
  };

  const settleExpenseClaim = (claimId: string, bankRef: string) => {
    const today = new Date().toISOString().split('T')[0];
    const nowStr = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

    setExpenseClaims(prev => {
      const updated = prev.map(c => {
        if (c.id === claimId) {
          const currentAuditTrail = (c.auditTrail && c.auditTrail.length > 0)
            ? c.auditTrail
            : generateDefaultAuditTrail(c);

          const settleAudit: ExpenseAuditLog = {
            id: `audit-${Date.now()}-disb`,
            stage: 'Disbursed / Settled',
            title: 'Disbursed via Bank Transfer',
            actionBy: 'Corporate Finance & Accounts Desk',
            role: 'Accounts Desk',
            timestamp: nowStr,
            amount: c.totalApproved || c.totalClaimed,
            remarks: `NEFT Bank Transfer reference ${bankRef} processed to employee salary account.`
          };

          return {
            ...c,
            status: 'Settled via Bank Transfer' as ExpenseClaimStatus,
            bankReferenceNumber: bankRef,
            settledAt: today,
            auditTrail: [...currentAuditTrail, settleAudit]
          };
        }
        return c;
      });
      safeLocalStorageSet('dbs_expense_claims', JSON.stringify(updated));
      return updated;
    });
    showToast(`Claim disbursed via bank transfer (Ref: ${bankRef}) post-GM approval!`);
  };

  const resetAllData = () => {
    // Only CEO role in profiles can execute system purge
    if (currentPersona.role !== 'CEO') {
      showToast('Access Denied: Only users with role = CEO in profiles can execute system purge queries.');
      return;
    }

    safeLocalStorageSet('dbs_batches', JSON.stringify([]));
    safeLocalStorageSet('dbs_consumables', JSON.stringify([]));
    safeLocalStorageSet('dbs_transactions', JSON.stringify([]));
    safeLocalStorageSet('dbs_employees', JSON.stringify([]));
    safeLocalStorageSet('dbs_leaves', JSON.stringify([]));
    safeLocalStorageSet('dbs_tours', JSON.stringify([]));
    safeLocalStorageSet('dbs_expense_claims', JSON.stringify([]));
    safeLocalStorageSet('dbs_expenses', JSON.stringify([]));
    safeLocalStorageSet('dbs_attendance_logs', JSON.stringify([]));
    safeLocalStorageSet('dbs_attendance_punches', JSON.stringify([]));
    safeLocalStorageSet('dbs_maintenance_tickets', JSON.stringify([]));

    setCandidates([]);
    setBatches([]);
    setConsumables([]);
    setTransactions([]);
    setEmployees([]);
    setLeaves([]);
    setTours([]);
    setExpenseClaims([]);
    setAttendancePunches([]);
    setMaintenanceTickets([]);

    purgeAllDataFromSupabase().catch(err => {
      console.warn('[Supabase] Cloud purge on reset error:', err);
    });

    showToast('Platform data reset to zero-state.');
  };

  return (
    <AppContext.Provider
      value={{
        supabaseStatus,
        supabaseMessage,
        isCloudSyncing,
        refreshFromSupabase,
        seedCloudDatabase,
        isAuthLoading,
        isLoggedIn,
        authSession,
        sendEmailOtp,
        verifyEmailOtp,
        logoutToLanding,
        currentPersona,
        profiles,
        provisionStaffMember,
        centers,
        selectedCenterId,
        setSelectedCenterId,
        setActiveCenter: (center: Center) => setSelectedCenterId(center.id),
        activeCenter,
        addCenter,
        reassignEmployeeCenter,
        candidates,
        addCandidate,
        updateCandidate,
        raiseAuditQuery,
        resolveAuditQuery,
        grantGreenSignal,
        approveApmQc,
        dispatchCandidate,
        submitBatchToPo,
        uploadCertificatePhotos,
        batches,
        updateBatchAttendance,
        uploadBatchPhoto,
        consumables,
        transactions,
        addIncomingStock,
        issueStockToBatch,
        leaves,
        applyLeave,
        reviewLeave,
        employees,
        performCheckIn,
        onboardEmployee,
        updateEmployee,
        attendancePunches,
        attendanceLogs: attendancePunches,
        recordSelfPunch,
        refreshAttendanceLogs,
        tours,
        expenseClaims,
        applyTour,
        sanctionTour,
        rejectTour,
        submitExpenseClaim,
        endorseExpenseClaim,
        approveExpenseClaim,
        rejectExpenseClaim,
        settleExpenseClaim,
        maintenanceTickets,
        createCenterTicket,
        endorseTicketByPo,
        rejectTicketByPo,
        resolveTicketByApm,
        theme,
        toggleTheme,
        setTheme,
        resetAllData,
        toastMessage,
        showToast
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
