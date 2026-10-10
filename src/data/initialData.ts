import {
  Center,
  UserPersona,
  Candidate,
  Batch,
  ConsumableItem,
  StockTransaction,
  Employee,
  LeaveRecord,
  TourRequest,
  ExpenseClaim,
  AttendancePunch,
  CenterIssueTicket
} from '../types';

export const INITIAL_CENTERS: Center[] = [
  {
    id: 'ctr-jodhpur',
    code: 'RJ-01',
    name: 'Jodhpur Transport Skill Hub',
    city: 'Jodhpur',
    state: 'Rajasthan',
    address: 'Plot 44, Heavy Industrial Area, Basni Phase II, Jodhpur 342005',
    latitude: 26.2389,
    longitude: 73.0243,
    geofenceRadiusMeters: 300,
    poName: 'Pooja Verma',
    apmName: 'Siddharth Nair',
    region: 'North'
  },
  {
    id: 'ctr-jaipur',
    code: 'RJ-02',
    name: 'Jaipur Logistics Training Hub',
    city: 'Jaipur',
    state: 'Rajasthan',
    address: 'RIICO Industrial Area, Mansarovar, Jaipur 302020',
    latitude: 26.8530,
    longitude: 75.7600,
    geofenceRadiusMeters: 300,
    poName: 'Pooja Verma',
    apmName: 'Siddharth Nair',
    region: 'North'
  },
  {
    id: 'ctr-kota',
    code: 'RJ-03',
    name: 'Kota Driver Development Institute',
    city: 'Kota',
    state: 'Rajasthan',
    address: 'Indraprastha Industrial Area, Kota 324005',
    latitude: 25.1800,
    longitude: 75.8300,
    geofenceRadiusMeters: 300,
    poName: 'Pooja Verma',
    apmName: 'Siddharth Nair',
    region: 'North'
  },
  {
    id: 'ctr-udaipur',
    code: 'RJ-04',
    name: 'Udaipur Transport Skill Center',
    city: 'Udaipur',
    state: 'Rajasthan',
    address: 'Mewar Industrial Area, Madri, Udaipur 313003',
    latitude: 24.5854,
    longitude: 73.7125,
    geofenceRadiusMeters: 300,
    poName: 'Pooja Verma',
    apmName: 'Siddharth Nair',
    region: 'North'
  },
  {
    id: 'ctr-delhi',
    code: 'DL-02',
    name: 'Delhi South Fleet Training Center',
    city: 'New Delhi',
    state: 'Delhi',
    address: 'B-12/A, Okhla Industrial Area Phase-I, New Delhi 110020',
    latitude: 28.5355,
    longitude: 77.2731,
    geofenceRadiusMeters: 250,
    poName: 'Pooja Verma',
    apmName: 'Siddharth Nair',
    region: 'North'
  },
  {
    id: 'ctr-delhi-north',
    code: 'DL-01',
    name: 'Delhi North Commercial Academy',
    city: 'Delhi',
    state: 'Delhi',
    address: 'GT Karnal Road Industrial Area, Delhi 110033',
    latitude: 28.7180,
    longitude: 77.1650,
    geofenceRadiusMeters: 300,
    poName: 'Pooja Verma',
    apmName: 'Siddharth Nair',
    region: 'North'
  },
  {
    id: 'ctr-gurugram',
    code: 'DL-03',
    name: 'Gurugram Fleet Skill Depot',
    city: 'Gurugram',
    state: 'Delhi',
    address: 'Sector 37, Pace City II, Gurugram 122001',
    latitude: 28.4350,
    longitude: 76.9950,
    geofenceRadiusMeters: 300,
    poName: 'Pooja Verma',
    apmName: 'Siddharth Nair',
    region: 'North'
  },
  {
    id: 'ctr-mumbai',
    code: 'MH-03',
    name: 'Mumbai Central Logistics Hub',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Warehouse Complex 3, MIDC Industrial Area, Turbhe, Navi Mumbai 400705',
    latitude: 19.0760,
    longitude: 72.8777,
    geofenceRadiusMeters: 350,
    poName: 'Anil Deshmukh',
    apmName: 'Siddharth Nair',
    region: 'West'
  },
  {
    id: 'ctr-pune',
    code: 'MH-01',
    name: 'Pune Commercial Transport Academy',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Bhosari MIDC, Pimpri-Chinchwad, Pune 411026',
    latitude: 18.6270,
    longitude: 73.8450,
    geofenceRadiusMeters: 300,
    poName: 'Anil Deshmukh',
    apmName: 'Siddharth Nair',
    region: 'West'
  },
  {
    id: 'ctr-nagpur',
    code: 'MH-02',
    name: 'Nagpur Heavy Vehicle Training Hub',
    city: 'Nagpur',
    state: 'Maharashtra',
    address: 'MIHAN SEZ Logistics Park, Nagpur 441108',
    latitude: 21.0500,
    longitude: 79.0500,
    geofenceRadiusMeters: 350,
    poName: 'Anil Deshmukh',
    apmName: 'Siddharth Nair',
    region: 'West'
  },
  {
    id: 'ctr-nashik',
    code: 'MH-04',
    name: 'Nashik Logistics Driver Center',
    city: 'Nashik',
    state: 'Maharashtra',
    address: 'Ambad MIDC, Nashik 422010',
    latitude: 19.9500,
    longitude: 73.7400,
    geofenceRadiusMeters: 300,
    poName: 'Anil Deshmukh',
    apmName: 'Siddharth Nair',
    region: 'West'
  },
  {
    id: 'ctr-bengaluru',
    code: 'KA-04',
    name: 'Bengaluru Commercial Driver Academy',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: 'Survey 88, Near Toll Plaza, Electronic City Phase 2, Bengaluru 560100',
    latitude: 12.9716,
    longitude: 77.5946,
    geofenceRadiusMeters: 300,
    poName: 'Kavitha Reddy',
    apmName: 'Siddharth Nair',
    region: 'South'
  },
  {
    id: 'ctr-mysuru',
    code: 'KA-01',
    name: 'Mysuru Road Safety Institute',
    city: 'Mysuru',
    state: 'Karnataka',
    address: 'Hebbal Industrial Area, Mysuru 570016',
    latitude: 12.3550,
    longitude: 76.6150,
    geofenceRadiusMeters: 300,
    poName: 'Kavitha Reddy',
    apmName: 'Siddharth Nair',
    region: 'South'
  },
  {
    id: 'ctr-hubballi',
    code: 'KA-02',
    name: 'Hubballi Commercial Vehicle Academy',
    city: 'Hubballi',
    state: 'Karnataka',
    address: 'Tarihal Industrial Estate, Hubballi 580026',
    latitude: 15.3647,
    longitude: 75.1240,
    geofenceRadiusMeters: 300,
    poName: 'Kavitha Reddy',
    apmName: 'Siddharth Nair',
    region: 'South'
  }
];

export const INITIAL_PERSONAS: UserPersona[] = [
  {
    id: 'usr-ceo-1',
    name: 'Gopal Mani',
    role: 'CEO',
    level: 'Level 1',
    title: 'Chief Executive Officer / Managing Director',
    centerId: 'ctr-delhi',
    centerName: 'National Command HQ',
    email: 'gopal.mani@dbskills.in',
    phone: '+91 98111 00001',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
    designation: 'CEO - National Command',
    region: 'National'
  },
  {
    id: 'usr-ose-1',
    name: 'Ramesh Sharma',
    role: 'OSE',
    level: 'Level 4',
    title: 'Operation Support Executive',
    centerId: 'ctr-jodhpur',
    centerName: 'Jodhpur Transport Skill Hub',
    email: 'ramesh.sharma@dbskills.in',
    phone: '+91 98290 11442',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    designation: 'Operation Support Executive',
    region: 'North'
  },
  {
    id: 'usr-trainer-1',
    name: 'Vikram Singh Rathore',
    role: 'Trainer',
    level: 'Level 4',
    title: 'Senior Master Road Safety Trainer',
    centerId: 'ctr-jodhpur',
    centerName: 'Jodhpur Transport Skill Hub',
    email: 'vikram.rathore@dbskills.in',
    phone: '+91 94141 88921',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    designation: 'Senior Master Road Safety Trainer',
    region: 'North'
  },
  {
    id: 'usr-po-1',
    name: 'Pooja Verma',
    role: 'PO',
    level: 'Level 3',
    title: 'Program Officer (North Region)',
    centerId: 'ctr-jodhpur',
    centerName: 'Jodhpur & Delhi South',
    email: 'pooja.verma@dbskills.in',
    phone: '+91 98112 33451',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    designation: 'Program Officer (North Region)',
    region: 'North'
  },
  {
    id: 'usr-apm-1',
    name: 'Siddharth Nair',
    role: 'Senior Manager',
    level: 'Level 3',
    title: 'Senior Manager (Quality & QC)',
    centerId: 'ctr-mumbai',
    centerName: 'National QC & Ops',
    email: 'siddharth.nair@dbskills.in',
    phone: '+91 99201 44552',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    designation: 'Senior Manager',
    region: 'North & West'
  },
  {
    id: 'usr-gm-1',
    name: 'Col. Rajesh Mehta (Retd.)',
    role: 'GM',
    level: 'Level 1',
    title: 'General Manager - National Operations',
    centerId: 'ctr-delhi',
    centerName: 'Corporate Headquarters',
    email: 'rajesh.mehta@dbskills.in',
    phone: '+91 98100 22334',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
    designation: 'General Manager - National Operations',
    region: 'National'
  }
];

export const INITIAL_BATCHES: Batch[] = [];

export const INITIAL_CANDIDATES: Candidate[] = [];

export const INITIAL_CONSUMABLES: ConsumableItem[] = [
  // Jodhpur Center
  {
    id: 'csm-jod-1',
    centerId: 'ctr-jodhpur',
    itemType: 'Certificates',
    itemName: 'Official Security Border Certificate Sheets',
    quantityOnHand: 145,
    minimumThreshold: 50,
    unit: 'Sheets',
    lastUpdated: '2026-09-22'
  },
  {
    id: 'csm-jod-2',
    centerId: 'ctr-jodhpur',
    itemType: 'Bags',
    itemName: 'Heavy Duty Driver Kit Backpacks',
    quantityOnHand: 42,
    minimumThreshold: 30,
    unit: 'Bags',
    lastUpdated: '2026-09-22'
  },
  {
    id: 'csm-jod-3',
    centerId: 'ctr-jodhpur',
    itemType: 'Blankets',
    itemName: 'Cabin Sleeper Fleece Blankets',
    quantityOnHand: 18, // LOW STOCK ALERT (< 20)
    minimumThreshold: 25,
    unit: 'Units',
    lastUpdated: '2026-09-23'
  },
  {
    id: 'csm-jod-4',
    centerId: 'ctr-jodhpur',
    itemType: 'Caps',
    itemName: 'Embroidered DB Skills Road Safety Caps',
    quantityOnHand: 85,
    minimumThreshold: 40,
    unit: 'Units',
    lastUpdated: '2026-09-21'
  },
  {
    id: 'csm-jod-5',
    centerId: 'ctr-jodhpur',
    itemType: 'T-Shirts',
    itemName: 'High-Visibility Collar Polo T-Shirts',
    quantityOnHand: 68,
    minimumThreshold: 35,
    unit: 'Units',
    lastUpdated: '2026-09-23',
    sizeBreakdown: {
      M: 14,
      L: 26,
      XL: 20,
      XXL: 8
    }
  },

  // Delhi South Center
  {
    id: 'csm-del-1',
    centerId: 'ctr-delhi',
    itemType: 'Certificates',
    itemName: 'Official Security Border Certificate Sheets',
    quantityOnHand: 80,
    minimumThreshold: 50,
    unit: 'Sheets',
    lastUpdated: '2026-09-20'
  },
  {
    id: 'csm-del-2',
    centerId: 'ctr-delhi',
    itemType: 'Bags',
    itemName: 'Heavy Duty Driver Kit Backpacks',
    quantityOnHand: 15, // LOW STOCK ALERT
    minimumThreshold: 25,
    unit: 'Bags',
    lastUpdated: '2026-09-21'
  },
  {
    id: 'csm-del-3',
    centerId: 'ctr-delhi',
    itemType: 'Blankets',
    itemName: 'Cabin Sleeper Fleece Blankets',
    quantityOnHand: 34,
    minimumThreshold: 20,
    unit: 'Units',
    lastUpdated: '2026-09-20'
  },
  {
    id: 'csm-del-4',
    centerId: 'ctr-delhi',
    itemType: 'Caps',
    itemName: 'Embroidered DB Skills Road Safety Caps',
    quantityOnHand: 92,
    minimumThreshold: 30,
    unit: 'Units',
    lastUpdated: '2026-09-22'
  },
  {
    id: 'csm-del-5',
    centerId: 'ctr-delhi',
    itemType: 'T-Shirts',
    itemName: 'High-Visibility Collar Polo T-Shirts',
    quantityOnHand: 45,
    minimumThreshold: 30,
    unit: 'Units',
    lastUpdated: '2026-09-22',
    sizeBreakdown: {
      M: 10,
      L: 18,
      XL: 12,
      XXL: 5
    }
  },

  // Mumbai Central
  {
    id: 'csm-mum-1',
    centerId: 'ctr-mumbai',
    itemType: 'Certificates',
    itemName: 'Official Security Border Certificate Sheets',
    quantityOnHand: 320,
    minimumThreshold: 60,
    unit: 'Sheets',
    lastUpdated: '2026-09-21'
  },
  {
    id: 'csm-mum-2',
    centerId: 'ctr-mumbai',
    itemType: 'Bags',
    itemName: 'Heavy Duty Driver Kit Backpacks',
    quantityOnHand: 110,
    minimumThreshold: 40,
    unit: 'Bags',
    lastUpdated: '2026-09-21'
  },
  {
    id: 'csm-mum-3',
    centerId: 'ctr-mumbai',
    itemType: 'Blankets',
    itemName: 'Cabin Sleeper Fleece Blankets',
    quantityOnHand: 75,
    minimumThreshold: 30,
    unit: 'Units',
    lastUpdated: '2026-09-21'
  },
  {
    id: 'csm-mum-4',
    centerId: 'ctr-mumbai',
    itemType: 'Caps',
    itemName: 'Embroidered DB Skills Road Safety Caps',
    quantityOnHand: 130,
    minimumThreshold: 50,
    unit: 'Units',
    lastUpdated: '2026-09-21'
  },
  {
    id: 'csm-mum-5',
    centerId: 'ctr-mumbai',
    itemType: 'T-Shirts',
    itemName: 'High-Visibility Collar Polo T-Shirts',
    quantityOnHand: 115,
    minimumThreshold: 50,
    unit: 'Units',
    lastUpdated: '2026-09-21',
    sizeBreakdown: {
      M: 25,
      L: 45,
      XL: 30,
      XXL: 15
    }
  },

  // Bengaluru
  {
    id: 'csm-blr-1',
    centerId: 'ctr-bengaluru',
    itemType: 'Certificates',
    itemName: 'Official Security Border Certificate Sheets',
    quantityOnHand: 190,
    minimumThreshold: 50,
    unit: 'Sheets',
    lastUpdated: '2026-09-18'
  },
  {
    id: 'csm-blr-2',
    centerId: 'ctr-bengaluru',
    itemType: 'Bags',
    itemName: 'Heavy Duty Driver Kit Backpacks',
    quantityOnHand: 65,
    minimumThreshold: 30,
    unit: 'Bags',
    lastUpdated: '2026-09-18'
  },
  {
    id: 'csm-blr-3',
    centerId: 'ctr-bengaluru',
    itemType: 'Blankets',
    itemName: 'Cabin Sleeper Fleece Blankets',
    quantityOnHand: 48,
    minimumThreshold: 25,
    unit: 'Units',
    lastUpdated: '2026-09-18'
  },
  {
    id: 'csm-blr-4',
    centerId: 'ctr-bengaluru',
    itemType: 'Caps',
    itemName: 'Embroidered DB Skills Road Safety Caps',
    quantityOnHand: 80,
    minimumThreshold: 35,
    unit: 'Units',
    lastUpdated: '2026-09-18'
  },
  {
    id: 'csm-blr-5',
    centerId: 'ctr-bengaluru',
    itemType: 'T-Shirts',
    itemName: 'High-Visibility Collar Polo T-Shirts',
    quantityOnHand: 72,
    minimumThreshold: 35,
    unit: 'Units',
    lastUpdated: '2026-09-18',
    sizeBreakdown: {
      M: 18,
      L: 28,
      XL: 18,
      XXL: 8
    }
  }
];

export const INITIAL_TRANSACTIONS: StockTransaction[] = [];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    empCode: 'DBS-EMP-1042',
    name: 'Ramesh Sharma',
    role: 'OSE',
    level: 'Level 4',
    designation: 'Operations Support Executive',
    centerId: 'ctr-jodhpur',
    centerName: 'Jodhpur Transport Skill Hub',
    reportingOfficer: 'Pooja Verma (PO)',
    dateOfJoining: '2024-03-15',
    tenureMonths: 30,
    phone: '+91 98290 11442',
    email: 'ramesh.sharma@dbskills.in',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    monthlyTarget: 600,
    monthlyAchieved: 0,
    casualLeaveBalance: 7,
    compOffBalance: 2,
    deploymentStatus: 'On-Site',
    totalPresentDays: 0,
    deploymentHistory: [],
    lastCheckIn: undefined
  },
  {
    id: 'emp-2',
    empCode: 'DBS-EMP-0881',
    name: 'Vikram Singh Rathore',
    role: 'Trainer',
    level: 'Level 4',
    designation: 'Senior Master Road Safety Trainer',
    centerId: 'ctr-jodhpur',
    centerName: 'Jodhpur Transport Skill Hub',
    reportingOfficer: 'Pooja Verma (PO)',
    dateOfJoining: '2023-01-10',
    tenureMonths: 44,
    phone: '+91 94141 88921',
    email: 'vikram.rathore@dbskills.in',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    monthlyTarget: 600,
    monthlyAchieved: 0,
    casualLeaveBalance: 5,
    compOffBalance: 3,
    deploymentStatus: 'On Tour',
    totalPresentDays: 0,
    deploymentHistory: [],
    lastCheckIn: undefined
  },
  {
    id: 'emp-3',
    empCode: 'DBS-EMP-0612',
    name: 'Pooja Verma',
    role: 'PO',
    level: 'Level 3',
    designation: 'Program Officer (North Region)',
    centerId: 'ctr-jodhpur',
    centerName: 'Jodhpur Transport Skill Hub',
    reportingOfficer: 'Col. Rajesh Mehta (GM)',
    dateOfJoining: '2022-06-01',
    tenureMonths: 51,
    phone: '+91 98112 33451',
    email: 'pooja.verma@dbskills.in',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    monthlyTarget: 1200,
    monthlyAchieved: 0,
    casualLeaveBalance: 9,
    compOffBalance: 1,
    deploymentStatus: 'On-Site',
    totalPresentDays: 0,
    lastCheckIn: undefined
  },
  {
    id: 'emp-4',
    empCode: 'DBS-EMP-0420',
    name: 'Siddharth Nair',
    role: 'Senior Manager',
    level: 'Level 3',
    designation: 'Senior Manager',
    centerId: 'ctr-mumbai',
    centerName: 'Mumbai Central Logistics Hub',
    reportingOfficer: 'Col. Rajesh Mehta (GM)',
    dateOfJoining: '2021-11-15',
    tenureMonths: 58,
    phone: '+91 99201 44552',
    email: 'siddharth.nair@dbskills.in',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    monthlyTarget: 1800,
    monthlyAchieved: 0,
    casualLeaveBalance: 8,
    compOffBalance: 4,
    deploymentStatus: 'On-Site',
    totalPresentDays: 0,
    lastCheckIn: undefined
  },
  {
    id: 'emp-5',
    empCode: 'DBS-EMP-0010',
    name: 'Col. Rajesh Mehta (Retd.)',
    role: 'GM',
    level: 'Level 1',
    designation: 'General Manager - Operations & Audit',
    centerId: 'ctr-delhi',
    centerName: 'Delhi South Driver Institute',
    reportingOfficer: 'Board of Directors / Gopal Mani (CEO)',
    dateOfJoining: '2020-01-05',
    tenureMonths: 80,
    phone: '+91 98100 22334',
    email: 'rajesh.mehta@dbskills.in',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
    monthlyTarget: 5000,
    monthlyAchieved: 0,
    casualLeaveBalance: 11,
    compOffBalance: 0,
    deploymentStatus: 'On-Site',
    totalPresentDays: 0
  },
  {
    id: 'emp-6',
    empCode: 'DBS-EMP-1102',
    name: 'Amit Saxena',
    role: 'OSE',
    level: 'Level 4',
    designation: 'Operations Support Executive',
    centerId: 'ctr-delhi',
    centerName: 'Delhi South Driver Institute',
    reportingOfficer: 'Pooja Verma (PO)',
    dateOfJoining: '2024-08-01',
    tenureMonths: 26,
    phone: '+91 98711 55662',
    email: 'amit.saxena@dbskills.in',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80',
    monthlyTarget: 600,
    monthlyAchieved: 0,
    casualLeaveBalance: 9,
    compOffBalance: 1,
    deploymentStatus: 'On-Site',
    totalPresentDays: 0,
    lastCheckIn: undefined
  },
  {
    id: 'emp-7',
    empCode: 'DBS-EMP-0925',
    name: 'Manish Kumar',
    role: 'Trainer',
    level: 'Level 4',
    designation: 'Commercial Fleet Safety Trainer',
    centerId: 'ctr-delhi',
    centerName: 'Delhi South Driver Institute',
    reportingOfficer: 'Pooja Verma (PO)',
    dateOfJoining: '2023-05-12',
    tenureMonths: 40,
    phone: '+91 98104 77812',
    email: 'manish.kumar@dbskills.in',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=256&q=80',
    monthlyTarget: 600,
    monthlyAchieved: 0,
    casualLeaveBalance: 6,
    compOffBalance: 2,
    deploymentStatus: 'On Leave',
    totalPresentDays: 0
  },
  {
    id: 'emp-8',
    empCode: 'DBS-EMP-1215',
    name: 'Sneha Patil',
    role: 'OSE',
    level: 'Level 4',
    designation: 'Operations Support Executive',
    centerId: 'ctr-mumbai',
    centerName: 'Mumbai Central Logistics Hub',
    reportingOfficer: 'Siddharth Nair (Senior Manager)',
    dateOfJoining: '2025-01-10',
    tenureMonths: 20,
    phone: '+91 98202 33145',
    email: 'sneha.patil@dbskills.in',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80',
    monthlyTarget: 600,
    monthlyAchieved: 0,
    casualLeaveBalance: 10,
    compOffBalance: 1,
    deploymentStatus: 'On-Site',
    totalPresentDays: 0,
    lastCheckIn: undefined
  },
  {
    id: 'emp-9',
    empCode: 'DBS-EMP-0790',
    name: 'Suresh Hegde',
    role: 'Trainer',
    level: 'Level 4',
    designation: 'Heavy Vehicle Simulator Trainer',
    centerId: 'ctr-bengaluru',
    centerName: 'Bengaluru Tech Driver Center',
    reportingOfficer: 'Siddharth Nair (Senior Manager)',
    dateOfJoining: '2022-10-18',
    tenureMonths: 47,
    phone: '+91 98450 66712',
    email: 'suresh.hegde@dbskills.in',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    monthlyTarget: 600,
    monthlyAchieved: 0,
    casualLeaveBalance: 8,
    compOffBalance: 3,
    deploymentStatus: 'On-Site',
    totalPresentDays: 0,
    lastCheckIn: undefined
  }
];

export const INITIAL_LEAVES: LeaveRecord[] = [];

export const INITIAL_TOURS: TourRequest[] = [];

export const INITIAL_EXPENSE_CLAIMS: ExpenseClaim[] = [];

export const INITIAL_ATTENDANCE_PUNCHES: AttendancePunch[] = [];

export const INITIAL_MAINTENANCE_TICKETS: CenterIssueTicket[] = [];


