export interface CandidateEnrollment {
  id: string;
  enrollmentNo: string;
  fullName: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  aadhaarNumber: string;
  aadhaarProofUrl: string; // Base64 data URL stored as audit proof
  dlNumber: string;
  dlExpiryDate: string;
  dlProofUrl: string; // Base64 data URL stored as audit proof
  phone: string;
  assignedCenterId: string;
  registrationDate: string;
  verificationStatus: 'Auto-Verified' | 'Pending Field PO QC';
}
