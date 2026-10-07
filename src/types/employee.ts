export interface EmployeeProfile {
  id: string;
  empId: string;
  name: string;
  email: string;
  phone: string;
  role: 'OSE' | 'Trainer' | 'PO' | 'Senior Manager';
  photoUrl: string; // Base64 data URL or uploaded image URL
  assignedCenterId: string;
  assignedCenterName: string;
  status: 'Active' | 'On Leave' | 'Suspended';
  joiningDate: string;
}
