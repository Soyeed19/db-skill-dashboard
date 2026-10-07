export * from './candidate';

export type UserRole = 'OSE' | 'Trainer' | 'PO' | 'Senior Manager' | 'GM' | 'CEO';

export type UserLevel = 'Level 1' | 'Level 2' | 'Level 3' | 'Level 4';

export interface UserPersona {
  id: string;
  name: string;
  role: UserRole;
  level: UserLevel;
  title: string;
  centerId: string;
  centerName: string;
  email: string;
  phone: string;
  avatar: string;
  designation?: string;
  region?: string;
}

export type CandidateAuditStatus =
  | 'Draft'
  | 'Pending PO Review'
  | 'Returned for Correction'
  | 'Approved by PO';

export type CandidateStatus =
  | 'Draft'
  | 'Pending Scan'
  | 'Pending PO Review'
  | 'Query Raised'
  | 'Returned for Correction'
  | 'Green Signal (Video Call)'
  | 'Senior Manager QC Passed'
  | 'APM QC Passed'
  | 'Certified & Dispatched'
  | 'Approved by PO';

export type AttendanceStatus = 'Present' | 'Absent' | 'Late';

export interface AuditQuery {
  id: string;
  candidateId: string;
  raisedByRole: 'PO' | 'Senior Manager';
  raisedByName: string;
  field: 'ID Front' | 'ID Back' | 'DL Front' | 'DL Back' | 'Name Mismatch' | 'ABHA Mismatch' | 'Photo Blurry' | 'Other';
  comment: string;
  createdAt: string;
  status: 'Open' | 'Resolved';
  resolutionComment?: string;
  resolvedAt?: string;
}

export interface Candidate {
  id: string;
  registrationNumber: string;
  batchId: string;
  centerId: string;
  fullName: string;
  fatherName: string;
  dateOfBirth: string;
  motherName?: string;
  maritalStatus?: 'Single' | 'Married' | 'Widowed' | 'Divorced';
  familyIncome?: string;
  religion?: string;
  casteCategory?: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS';
  aadhaarIngestionMethod?: 'Manual Entry' | 'File Upload' | 'Live Camera Snapshot + Optical Extraction';
  gender: 'Male' | 'Female' | 'Other';
  mobileNumber: string; // 10 digits
  idCardNumber: string; // 12 digits (Aadhaar or Gov ID)
  abhaNumber: string; // 14 digits
  dlNumber: string; // Indian DL format (e.g. RJ19 20180012345)
  dlExpiryDate: string;
  vehicleClass: 'LMV-TR' | 'TRANS' | 'HMV' | 'HGMV' | '3W-CAB';
  address: string;
  city: string;
  state: string;
  pincode: string;
  enrolledAt: string;
  status: CandidateStatus;
  
  // Documents & Audit Proofs
  photoUrl: string;
  idFrontUrl: string;
  idBackUrl: string;
  dlFrontUrl: string;
  dlBackUrl: string;
  aadhaarProofUrl?: string; // Base64 audit proof
  dlProofUrl?: string; // Base64 audit proof
  verificationStatus?: 'Auto-Verified' | 'Pending Field PO QC';
  driverHoldingIdUrl?: string;

  // Training & Attendance
  attendanceStatus?: AttendanceStatus;
  trainingDate?: string;
  preTestScore?: number; // out of 100
  postTestScore?: number; // out of 100
  certificateNumber?: string;
  certificateIssuedDate?: string;
  kitIssued: boolean;
  tshirtSize?: 'M' | 'L' | 'XL' | 'XXL';

  // Audit Pipeline & Daily Batch Lifecycle
  isLocked?: boolean;
  certificateHoldingPhotoUrl?: string;
  certificateHandoverPhotoUrl?: string;
  poCorrectionRemarks?: string;
  poApprovalTimestamp?: string;
  queries: AuditQuery[];
  greenSignalBy?: string;
  greenSignalAt?: string;
  apmApprovedBy?: string;
  apmApprovedAt?: string;
  dispatchedAt?: string;
}

export interface CandidateRecord {
  id: string;
  centerId: string;
  name: string;
  fatherName: string;
  motherName: string;
  maritalStatus: string;
  annualIncome: string;
  religion: string;
  caste: string;
  contactNumber: string;
  drivingLicenceNumber: string;
  address: string;
  enrollmentDate: string;
  enrollmentTime: string;
  status: CandidateAuditStatus;
  isLocked: boolean;
  // End-of-day certificate photos (Required before PO submission)
  certificateHoldingPhotoUrl?: string;
  certificateHandoverPhotoUrl?: string;
  // PO review audit fields
  poCorrectionRemarks?: string;
  poApprovalTimestamp?: string;
}

// Edit permission guard:
export const canEditCandidate = (c: Candidate | { status: string; isLocked?: boolean }): boolean => {
  return c.status === 'Draft' || (c.status === 'Returned for Correction' && !c.isLocked);
};

// Batch submission readiness guard:
export const isCandidateReadyForPo = (c: Candidate | { certificateHoldingPhotoUrl?: string; certificateHandoverPhotoUrl?: string }): boolean => {
  return Boolean(c.certificateHoldingPhotoUrl && c.certificateHandoverPhotoUrl);
};

export interface Batch {
  id: string;
  batchCode: string;
  centerId: string;
  date: string;
  trainerId: string;
  trainerName: string;
  targetCount: number;
  enrolledCount: number;
  presentCount: number;
  status: 'Enrolling' | 'Training Active' | 'Audit Underway' | 'Completed' | 'Dispatched';
  classroomPhotoUrl?: string;
  classroomPhotoTimestamp?: string;
  classroomPhotoGps?: {
    lat: number;
    lng: number;
    locationName: string;
  };
  notes?: string;
}

export type ConsumableType = 'Certificates' | 'Bags' | 'Blankets' | 'Caps' | 'T-Shirts';

export interface ConsumableItem {
  id: string;
  centerId: string;
  itemType: ConsumableType;
  itemName: string;
  quantityOnHand: number;
  minimumThreshold: number;
  unit: string;
  lastUpdated: string;
  sizeBreakdown?: {
    M: number;
    L: number;
    XL: number;
    XXL: number;
  };
}

export interface StockTransaction {
  id: string;
  centerId: string;
  itemType: ConsumableType;
  transactionType: 'INWARD_CHALLAN' | 'OUTWARD_BATCH_DISPATCH' | 'MANUAL_ADJUSTMENT';
  quantity: number;
  referenceNumber: string; // e.g. Challan # or Batch ID
  date: string;
  performedBy: string;
  notes?: string;
}

export type LeaveType = 'Casual/Sick Leave' | 'Compensatory Off (Comp Off)';

export interface LeaveRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: UserRole;
  employeeLevel: UserLevel;
  centerId: string;
  centerName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  compOffWorkDate?: string; // If comp-off, which duty date generated it
  status: 'Pending' | 'Approved' | 'Rejected';
  approverTarget: 'PO' | 'GM';
  reviewedBy?: string;
  reviewRemarks?: string;
  reviewedAt?: string;
  appliedAt: string;
  applicantId?: string;
  applicantName?: string;
  applicantRole?: string;
  routingTarget?: string;
  region?: string;
}

export interface DeploymentRecord {
  id: string;
  orderNumber: string;
  fromCenterId: string;
  fromCenterName: string;
  toCenterId: string;
  toCenterName: string;
  effectiveDate: string;
  reason: string;
  assignedBy: string;
  timestamp: string;
}

export interface Employee {
  id: string;
  empCode: string;
  name: string;
  role: UserRole;
  level: UserLevel;
  designation: string;
  centerId: string;
  centerName: string;
  reportingOfficer: string;
  dateOfJoining: string;
  tenureMonths: number;
  phone: string;
  email: string;
  avatar: string;
  monthlyTarget: number;
  monthlyAchieved: number;
  casualLeaveBalance: number; // Max 12 per year
  compOffBalance: number;
  region?: string;
  deploymentStatus?: 'On-Site' | 'On Tour' | 'On Leave';
  totalPresentDays?: number;
  deploymentHistory?: DeploymentRecord[];
  lastCheckIn?: {
    timestamp: string;
    lat: number;
    lng: number;
    isGeofenceValid: boolean;
    centerDistanceMeters: number;
  };
}

export type { EmployeeProfile } from './employee';
export type { EmployeeUser } from './auth';

export interface AttendancePunch {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  type: 'CHECK_IN' | 'CHECK_OUT';
  timestamp: string;
  timeFormatted: string;
  lat: number;
  lng: number;
  locationAddress: string;
  centerProximityStatus: 'Within Center Geofence' | 'Remote / Outstation Tour' | 'Approved Field';
  photoWithWatermark: string; // Base64 data URL
}

export type TravelMode = 'Bus' | 'Train 3AC' | 'Train 2AC' | 'Flight (Special Permit)';

export interface TourRequest {
  id: string;
  tourSanctionNumber: string;
  employeeId: string;
  employeeName: string;
  employeeRole: UserRole;
  employeeLevel: UserLevel;
  originCenter: string;
  destinationCity: string;
  departureDate: string;
  returnDate: string;
  travelMode: TravelMode;
  purpose: string;
  estimatedBudget: number;
  status: 'Draft' | 'Submitted' | 'Sanctioned' | 'Rejected' | 'Expense Claim Filed' | 'Completed';
  sanctionedBy?: string;
  sanctionRemarks?: string;
  sanctionedBudget?: number;
  sanctionedAt?: string;
  appliedAt: string;
}

export interface ExpenseItem {
  id: string;
  category: 'Travel Ticket' | 'Hotel/Lodging' | 'Daily Food Allowance (DA)' | 'Local Conveyance';
  description: string;
  date: string;
  claimAmount: number;
  entitlementLimit: number;
  approvedAmount: number;
  receiptName?: string;
  receiptUrl?: string;
  invoiceNumber?: string;
  vendorName?: string;
  gstin?: string;
  isWithinPolicy: boolean;
}

export type ExpenseClaimStatus =
  | 'Pending Senior Manager Review'
  | 'Pending GM Review'
  | 'Returned by Senior Manager'
  | 'Returned by GM for Correction'
  | 'Approved by GM - Ready for Bank Disbursement'
  | 'Settled via Bank Transfer'
  | 'Disbursed'
  | 'Approved by GM'
  | 'Pending APM Review'
  | 'Approved by Senior Manager - Ready for Bank Disbursement'
  | 'Approved by APM - Ready for Bank Disbursement'
  | 'Returned / Rejected by Senior Manager'
  | 'Returned / Rejected by APM'
  | 'Rejected';

export interface ExpenseClaim {
  id: string;
  claimNumber: string;
  claimRef?: string;
  tourId: string;
  tourSanctionNumber: string;
  tourSanctionRef?: string;
  employeeId: string;
  empId?: string;
  employeeName: string;
  claimantName?: string;
  employeeRole: UserRole;
  claimantRole?: string;
  employeeLevel: UserLevel;
  designation?: string;
  submissionDate: string;
  claimDate?: string;
  cityType: 'Metro' | 'Non-Metro';
  items: ExpenseItem[];
  bills?: any[];
  totalClaimed: number;
  totalEntitlement: number;
  policyEntitlement?: number;
  totalApproved: number;
  approvedReimbursement?: number;
  status: ExpenseClaimStatus;
  bankReferenceNumber?: string;
  settledAt?: string;
  gmRemarks?: string;
  apmRemarks?: string;
  smRemarks?: string;
  apmApprovedBy?: string;
  apmApprovedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  projectName?: string;
  zone?: string;
  tourDates?: string;
  tourPurpose?: string;
  fareAmount?: number;
  lodgingBoardingAmount?: number;
  othersDaAmount?: number;
  conveyanceAmount?: number;
  auditTrail?: ExpenseAuditLog[];
}

export type ExpenseAuditStage =
  | 'Submitted'
  | 'SM Verified'
  | 'GM Sanctioned'
  | 'Returned for Correction'
  | 'Disbursed / Settled'
  | 'Rejected';

export interface ExpenseAuditLog {
  id: string;
  stage: ExpenseAuditStage;
  title: string;
  actionBy: string;
  role: string;
  timestamp: string;
  amount?: number;
  remarks?: string;
  metadata?: Record<string, string | number>;
}

export interface Center {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  address: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
  poName: string;
  apmName: string;
  region?: string;
  zone?: string;
}

export type MaintenanceStatus =
  | 'Pending PO Verification'
  | 'Endorsed by PO'
  | 'Resolved by Senior Manager'
  | 'Resolved by APM'
  | 'Rejected';

export interface CenterIssueTicket {
  id: string;
  centerId: string;
  centerName: string;
  reportedByTrainerId: string;
  reportedByTrainerName: string;
  category: string;
  title: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  photoUrl?: string;
  createdAt: string;
  status: MaintenanceStatus;
  poEndorsedAt?: string;
  poName?: string;
  apmResolvedAt?: string;
  apmName?: string;
  resolutionRemarks?: string;
}

