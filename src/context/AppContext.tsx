import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserPersona,
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
  ExpenseAuditLog,
  EmployeeUser
} from '../types';
import {
  INITIAL_CENTERS,
  INITIAL_PERSONAS,
  INITIAL_BATCHES,
  INITIAL_CANDIDATES,
  INITIAL_CONSUMABLES,
  INITIAL_TRANSACTIONS,
  INITIAL_EMPLOYEES,
  INITIAL_LEAVES,
  INITIAL_TOURS,
  INITIAL_EXPENSE_CLAIMS,
  INITIAL_ATTENDANCE_PUNCHES,
  INITIAL_MAINTENANCE_TICKETS
} from '../data/initialData';
import { INITIAL_EMPLOYEE_USERS } from '../data/initialAuthData';

interface AppContextType {
  // Auth & Personas & Centers
  isLoggedIn: boolean;
  loginAsPersona: (persona: UserPersona) => void;
  loginWithCredentials: (credential: string, password: string) => { success: boolean; message: string };
  requestPasswordReset: (identifier: string) => { success: boolean; message: string };
  gmResetPassword: (userId: string, newPassword?: string) => { success: boolean; newPasswordGenerated: string };
  logoutToLanding: () => void;
  currentPersona: UserPersona;
  setCurrentPersona: (persona: UserPersona) => void;
  personas: UserPersona[];
  employeeUsers: EmployeeUser[];
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

  // System
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

  // 1. Submitted
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

  // 2. SM Verified (if passed initial pending state or reviewed)
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

  // 3. Returned by GM / SM
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

  // 4. GM Sanctioned
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

  // 5. Disbursed / Settled
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
  // Authentication & Landing Flow
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('dbs_logged_in') === 'true';
  });

  // Current Persona
  const [currentPersona, setCurrentPersona] = useState<UserPersona>(() => {
    const saved = localStorage.getItem('dbs_persona');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_PERSONAS[0]; // Ramesh Sharma (OSE)
  });

  const loginAsPersona = (persona: UserPersona) => {
    setCurrentPersona(persona);
    setIsLoggedIn(true);
    localStorage.setItem('dbs_logged_in', 'true');
    localStorage.setItem('dbs_persona', JSON.stringify(persona));
    if (persona.centerId) {
      setSelectedCenterId(persona.centerId);
    }
    showToast(`Logged in as: ${persona.role} - ${persona.name}`);
  };

  // Employee Users for Dual-Credential Auth & Password Reset
  const [employeeUsers, setEmployeeUsers] = useState<EmployeeUser[]>(() => {
    const saved = localStorage.getItem('dbs_employee_users');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_EMPLOYEE_USERS;
  });

  useEffect(() => {
    localStorage.setItem('dbs_employee_users', JSON.stringify(employeeUsers));
  }, [employeeUsers]);

  const loginWithCredentials = (credential: string, password: string): { success: boolean; message: string } => {
    const cleanCred = credential.trim().toLowerCase();
    const user = employeeUsers.find(u => 
      u.email.toLowerCase() === cleanCred || u.empId.toLowerCase() === cleanCred
    );

    if (!user) {
      return { success: false, message: 'Invalid Employee ID or Official Email address.' };
    }

    if (user.status === 'Suspended') {
      return { success: false, message: 'Your account is suspended. Contact General Manager (GM).' };
    }

    if (user.passwordHash !== password) {
      return { success: false, message: 'Incorrect password. Check credentials or request a GM reset.' };
    }

    // Match or create persona for logged in user
    const matchedPersona = INITIAL_PERSONAS.find(p => p.role === user.role) || {
      id: user.id,
      name: user.name,
      role: user.role,
      level: user.role === 'CEO' || user.role === 'GM' ? 'Level 1' : user.role === 'PO' || user.role === 'Senior Manager' ? 'Level 3' : 'Level 4',
      title: user.role,
      centerId: user.assignedCenterId,
      centerName: user.assignedCenterName,
      email: user.email,
      phone: user.phone,
      avatar: user.photoUrl
    };

    loginAsPersona(matchedPersona);
    return { success: true, message: `Welcome back, ${user.name}` };
  };

  const requestPasswordReset = (identifier: string): { success: boolean; message: string } => {
    const clean = identifier.trim().toLowerCase();
    const user = employeeUsers.find(u => 
      u.email.toLowerCase() === clean || u.empId.toLowerCase() === clean
    );

    if (!user) {
      return { success: false, message: 'No registered personnel found matching this Employee ID or Email.' };
    }

    const now = new Date().toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    setEmployeeUsers(prev => prev.map(u => {
      if (u.id === user.id) {
        return {
          ...u,
          resetRequested: true,
          resetRequestedAt: now
        };
      }
      return u;
    }));

    showToast(`Password reset ticket created for ${user.name}. Routed to GM Command.`);
    return {
      success: true,
      message: `Reset request submitted. The General Manager (Col. Rajesh Mehta) has been notified to generate a secure recovery token.`
    };
  };

  const gmResetPassword = (userId: string, newPassword?: string): { success: boolean; newPasswordGenerated: string } => {
    const genPassword = newPassword || `DBS@${Math.floor(1000 + Math.random() * 9000)}`;
    
    let targetName = '';
    setEmployeeUsers(prev => prev.map(u => {
      if (u.id === userId) {
        targetName = u.name;
        return {
          ...u,
          passwordHash: genPassword,
          resetRequested: false,
          resetRequestedAt: undefined
        };
      }
      return u;
    }));

    showToast(`Temporary password for ${targetName} reset to: ${genPassword}`);
    return { success: true, newPasswordGenerated: genPassword };
  };

  const logoutToLanding = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('dbs_logged_in');
    showToast('Logged out to DB Skills Enterprise Homepage');
  };

  // Centers
  const [centers, setCenters] = useState<Center[]>(() => {
    const saved = localStorage.getItem('dbs_centers');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_CENTERS;
  });

  useEffect(() => {
    localStorage.setItem('dbs_centers', JSON.stringify(centers));
  }, [centers]);

  const [selectedCenterId, setSelectedCenterId] = useState<string>(() => {
    return currentPersona.centerId || 'ctr-jodhpur';
  });

  // Keep center aligned when persona changes if not 'all'
  useEffect(() => {
    localStorage.setItem('dbs_persona', JSON.stringify(currentPersona));
    if (currentPersona.centerId && selectedCenterId !== 'all') {
      setSelectedCenterId(currentPersona.centerId);
    }
  }, [currentPersona]);

  const activeCenter = centers.find(c => c.id === selectedCenterId) || centers[0];

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
      localStorage.setItem('dbs_employees', JSON.stringify(updated));
      return updated;
    });
    showToast(`Staff mobilization: Employee reassigned to ${targetCenter.name} (${targetCenter.code}) effective ${effectiveDate}.`);
  };

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Candidates
  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('dbs_candidates');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_CANDIDATES;
  });

  useEffect(() => {
    localStorage.setItem('dbs_candidates', JSON.stringify(candidates));
  }, [candidates]);

  // Batches
  const [batches, setBatches] = useState<Batch[]>(() => {
    const saved = localStorage.getItem('dbs_batches');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_BATCHES;
  });

  useEffect(() => {
    localStorage.setItem('dbs_batches', JSON.stringify(batches));
  }, [batches]);

  // Consumables
  const [consumables, setConsumables] = useState<ConsumableItem[]>(() => {
    const saved = localStorage.getItem('dbs_consumables');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_CONSUMABLES;
  });

  useEffect(() => {
    localStorage.setItem('dbs_consumables', JSON.stringify(consumables));
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
    localStorage.setItem('dbs_transactions', JSON.stringify(transactions));
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
    localStorage.setItem('dbs_employees', JSON.stringify(employees));
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
    localStorage.setItem('dbs_leaves', JSON.stringify(leaves));
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
    localStorage.setItem('dbs_tours', JSON.stringify(tours));
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
    localStorage.setItem('dbs_expenses', JSON.stringify(expenseClaims));
    localStorage.setItem('dbs_expense_claims', JSON.stringify(expenseClaims));
  }, [expenseClaims]);

  // --- CANDIDATE METHODS ---
  const addCandidate = (candidateData: Partial<Candidate>): Candidate => {
    const centerObj = centers.find(c => c.id === (candidateData.centerId || activeCenter.id)) || activeCenter;
    const centerCodeClean = centerObj.code.replace('-', '');
    const serial = String(candidates.length + 140).padStart(4, '0');
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
      enrolledAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
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

    // Update batch enrolled count
    setBatches(prev =>
      prev.map(b => (b.id === newCandidate.batchId ? { ...b, enrolledCount: b.enrolledCount + 1 } : b))
    );

    // Update employee achievement for current persona if OSE
    setEmployees(prev =>
      prev.map(emp => (emp.id === currentPersona.id ? { ...emp, monthlyAchieved: emp.monthlyAchieved + 1 } : emp))
    );

    showToast(`Candidate ${newCandidate.fullName} registered successfully! Dossier initialized.`);
    return newCandidate;
  };

  const updateCandidate = (id: string, updates: Partial<Candidate>) => {
    setCandidates(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const uploadCertificatePhotos = (
    candidateId: string,
    holdingPhotoUrl: string,
    handoverPhotoUrl: string
  ) => {
    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          return {
            ...c,
            certificateHoldingPhotoUrl: holdingPhotoUrl,
            certificateHandoverPhotoUrl: handoverPhotoUrl
          };
        }
        return c;
      })
    );
    showToast('Certificate photos attached! Candidate verified for evening PO batch dispatch.');
  };

  const submitBatchToPo = (centerId: string, candidateIds?: string[]) => {
    const targetCandidates = candidates.filter(c => {
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

    setCandidates(prev =>
      prev.map(c => {
        const isTarget = targetCandidates.some(tc => tc.id === c.id);
        if (isTarget) {
          return {
            ...c,
            status: 'Pending PO Review',
            isLocked: true
          };
        }
        return c;
      })
    );

    // Update batch status to Audit Underway
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
          return {
            ...c,
            status: 'Returned for Correction',
            isLocked: false,
            poCorrectionRemarks: comment,
            queries: [newQuery, ...c.queries]
          };
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
          return {
            ...c,
            queries: updatedQueries,
            status: hasRemainingOpen ? 'Returned for Correction' : 'Pending PO Review',
            isLocked: !hasRemainingOpen,
            poCorrectionRemarks: hasRemainingOpen ? c.poCorrectionRemarks : undefined
          };
        }
        return c;
      })
    );

    showToast('Correction resolved and resubmitted to PO! Candidate re-locked under Pending PO Review.');
  };

  const grantGreenSignal = (candidateId: string) => {
    const now = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          return {
            ...c,
            status: 'Approved by PO',
            isLocked: true,
            poApprovalTimestamp: now,
            greenSignalBy: `${currentPersona.name} (${currentPersona.role})`,
            greenSignalAt: now
          };
        }
        return c;
      })
    );
    showToast('Candidate approved by PO and advance logged!');
  };

  const approveApmQc = (candidateId: string) => {
    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          return {
            ...c,
            status: 'Senior Manager QC Passed',
            apmApprovedBy: `${currentPersona.name} (Senior Manager)`,
            apmApprovedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
          };
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
          return {
            ...c,
            status: 'Certified & Dispatched',
            certificateNumber: certNum,
            certificateIssuedDate: today,
            dispatchedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
          };
        }
        return c;
      })
    );
    showToast(`Candidate certified! Assigned Certificate #${certNum}.`);
  };

  // --- BATCH & PHOTO METHODS ---
  const updateBatchAttendance = (batchId: string, attendanceMap: Record<string, AttendanceStatus>) => {
    setCandidates(prev =>
      prev.map(c => {
        if (c.batchId === batchId && attendanceMap[c.id]) {
          return { ...c, attendanceStatus: attendanceMap[c.id] };
        }
        return c;
      })
    );

    const presentCount = Object.values(attendanceMap).filter(v => v === 'Present' || v === 'Late').length;
    setBatches(prev =>
      prev.map(b => (b.id === batchId ? { ...b, presentCount } : b))
    );

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
      setBatches(prev =>
        prev.map(b =>
          b.id === batchId
            ? {
                ...b,
                classroomPhotoUrl: photoUrl,
                classroomPhotoTimestamp: timestamp,
                classroomPhotoGps: gpsStamp
              }
            : b
        )
      );
      showToast('Live classroom session group photo uploaded with auto-stamped GPS & time!');
    } else if (photoType === 'driverId' && candidateId) {
      setCandidates(prev =>
        prev.map(c => (c.id === candidateId ? { ...c, driverHoldingIdUrl: photoUrl } : c))
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
    // Check DB Skills Policy:
    // OSE / Trainer -> routed to PO
    // PO / RMT / Senior Manager -> routed to GM
    const isLevel4 = leaveData.employeeRole === 'OSE' || leaveData.employeeRole === 'Trainer';
    const targetApprover = isLevel4 ? 'PO' : 'GM';

    // Rule check: max 3 days per month for Casual/Sick
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

    // If approved, deduct leave balance
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
    // Generate simulated coordinates near center (within 35 meters)
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
    localStorage.setItem('dbs_attendance_logs', JSON.stringify(attendancePunches));
    localStorage.setItem('dbs_attendance_punches', JSON.stringify(attendancePunches));
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
    localStorage.setItem('dbs_maintenance_tickets', JSON.stringify(maintenanceTickets));
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
      localStorage.setItem('dbs_employees', JSON.stringify(updated));
      return updated;
    });
    showToast(`Employee ${newEmp.name} (${newEmp.empCode}) onboarded successfully!`);
    return newEmp;
  };

  const recordSelfPunch = (punchData: Omit<AttendancePunch, 'id'>): AttendancePunch => {
    const newPunch: AttendancePunch = {
      ...punchData,
      id: `pnch-${Date.now()}`
    };
    setAttendancePunches(prev => {
      const updated = [newPunch, ...prev.filter(p => p.id !== newPunch.id)];
      localStorage.setItem('dbs_attendance_logs', JSON.stringify(updated));
      localStorage.setItem('dbs_attendance_punches', JSON.stringify(updated));
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
    // Step A: Employee Submits Claim -> Initial Status: Pending Senior Manager Review
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
      localStorage.setItem('dbs_expense_claims', JSON.stringify(updated));
      localStorage.setItem('dbs_expenses', JSON.stringify(updated));
      return updated;
    });

    // Update tour status
    if (claimData.tourId) {
      setTours(prev =>
        prev.map(t => (t.id === claimData.tourId ? { ...t, status: 'Expense Claim Filed' } : t))
      );
    }

    showToast(`Expense claim ${claimNo} filed! Routed to Senior Manager (SM) for physical tour verification.`);
  };

  // Step B: Senior Manager (SM) Action -> Verify & Endorse Claim -> Pending GM Review
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
      localStorage.setItem('dbs_expense_claims', JSON.stringify(updated));
      localStorage.setItem('dbs_expenses', JSON.stringify(updated));
      return updated;
    });

    showToast('Claim verified & endorsed by Senior Manager! Forwarded to General Manager for financial sanction.');
  };

  // Step C: General Manager (GM) Action -> Sanction & Grant Reimbursement
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
      localStorage.setItem('dbs_expense_claims', JSON.stringify(updated));
      localStorage.setItem('dbs_expenses', JSON.stringify(updated));
      return updated;
    });
    showToast(`Expense claim sanctioned for ₹${approvedTotal.toLocaleString()} by General Manager! Ready for Bank Disbursement.`);
  };

  const rejectExpenseClaim = (claimId: string, remarks: string) => {
    const nowStr = new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    const isSm = currentPersona.role === 'Senior Manager';
    // If SM rejects -> Status updates to 'Returned by Senior Manager'. If GM -> 'Returned by GM for Correction'
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
      localStorage.setItem('dbs_expense_claims', JSON.stringify(updated));
      localStorage.setItem('dbs_expenses', JSON.stringify(updated));
      return updated;
    });
    showToast(isSm ? 'Claim returned by Senior Manager with verification remarks.' : 'Claim returned by General Manager for correction.');
  };

  // Maintenance Tickets Handlers
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
      localStorage.setItem('dbs_expense_claims', JSON.stringify(updated));
      localStorage.setItem('dbs_expenses', JSON.stringify(updated));
      return updated;
    });
    showToast(`Claim disbursed via bank transfer (Ref: ${bankRef}) post-GM approval!`);
  };

  const resetAllData = () => {
    localStorage.removeItem('dbs_persona');
    localStorage.removeItem('dbs_candidates');
    localStorage.removeItem('dbs_batches');
    localStorage.removeItem('dbs_consumables');
    localStorage.removeItem('dbs_transactions');
    localStorage.removeItem('dbs_employees');
    localStorage.removeItem('dbs_leaves');
    localStorage.removeItem('dbs_tours');
    localStorage.removeItem('dbs_expenses');
    localStorage.removeItem('dbs_expense_claims');

    setCurrentPersona(INITIAL_PERSONAS[0]);
    setCandidates(INITIAL_CANDIDATES);
    setBatches(INITIAL_BATCHES);
    setConsumables(INITIAL_CONSUMABLES);
    setTransactions(INITIAL_TRANSACTIONS);
    setEmployees(INITIAL_EMPLOYEES);
    setLeaves(INITIAL_LEAVES);
    setTours(INITIAL_TOURS);
    setExpenseClaims(INITIAL_EXPENSE_CLAIMS);

    showToast('System data reset to initial demo configuration.');
  };

  return (
    <AppContext.Provider
      value={{
        isLoggedIn,
        loginAsPersona,
        loginWithCredentials,
        requestPasswordReset,
        gmResetPassword,
        logoutToLanding,
        currentPersona,
        setCurrentPersona,
        personas: INITIAL_PERSONAS,
        employeeUsers,
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
