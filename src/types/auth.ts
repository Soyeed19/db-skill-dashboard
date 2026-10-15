export interface EmployeeUser {
  id: string;
  empId: string; // e.g. "DBS-EMP-8841"
  name: string;
  email: string; // Official Email ID
  phone: string;
  role: 'OSE' | 'Trainer' | 'PO' | 'Senior Manager' | 'GM' | 'CEO';
  photoUrl: string;
  passwordHash: string; // Default or updated password
  resetRequested?: boolean;
  resetRequestedAt?: string;
  assignedCenterId: string;
  assignedCenterName: string;
  assignedCenterIds?: string[]; // Array of center IDs for PO / Trainers
  assignedRegion?: string;     // Region name for SM (e.g., "North Region", "West Region")
  regionCenterIds?: string[];  // Hubs under SM's region jurisdiction
  status: 'Active' | 'On Leave' | 'Suspended';
}
