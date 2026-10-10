/**
 * Hubs and Centers Mapping for Senior Manager (Siddharth Nair)
 * Defines assigned regional hubs across North & West commands.
 */

export interface HubMapping {
  id: string;
  code: string;
  name: string;
  city: string;
  state: string;
  region: string;
  seniorManager: string;
}

export const SM_ASSIGNED_HUBS: HubMapping[] = [
  {
    id: 'ctr-jodhpur',
    code: 'RJ-01',
    name: 'Jodhpur Transport Skill Hub',
    city: 'Jodhpur',
    state: 'Rajasthan',
    region: 'North',
    seniorManager: 'Siddharth Nair'
  },
  {
    id: 'ctr-jaipur',
    code: 'RJ-02',
    name: 'Jaipur Logistics Training Hub',
    city: 'Jaipur',
    state: 'Rajasthan',
    region: 'North',
    seniorManager: 'Siddharth Nair'
  },
  {
    id: 'ctr-mumbai',
    code: 'MH-03',
    name: 'Mumbai Central Logistics Hub',
    city: 'Mumbai',
    state: 'Maharashtra',
    region: 'West',
    seniorManager: 'Siddharth Nair'
  },
  {
    id: 'ctr-pune',
    code: 'MH-01',
    name: 'Pune Commercial Transport Academy',
    city: 'Pune',
    state: 'Maharashtra',
    region: 'West',
    seniorManager: 'Siddharth Nair'
  },
  {
    id: 'ctr-nashik',
    code: 'MH-04',
    name: 'Nashik Logistics Driver Center',
    city: 'Nashik',
    state: 'Maharashtra',
    region: 'West',
    seniorManager: 'Siddharth Nair'
  },
  {
    id: 'ctr-kota',
    code: 'RJ-03',
    name: 'Kota Driver Development Institute',
    city: 'Kota',
    state: 'Rajasthan',
    region: 'North',
    seniorManager: 'Siddharth Nair'
  },
  {
    id: 'ctr-udaipur',
    code: 'RJ-04',
    name: 'Udaipur Transport Skill Center',
    city: 'Udaipur',
    state: 'Rajasthan',
    region: 'North',
    seniorManager: 'Siddharth Nair'
  },
  {
    id: 'ctr-delhi',
    code: 'DL-02',
    name: 'Delhi South Fleet Training Center',
    city: 'New Delhi',
    state: 'Delhi',
    region: 'North',
    seniorManager: 'Siddharth Nair'
  },
  {
    id: 'ctr-delhi-north',
    code: 'DL-01',
    name: 'Delhi North Commercial Academy',
    city: 'Delhi',
    state: 'Delhi',
    region: 'North',
    seniorManager: 'Siddharth Nair'
  },
  {
    id: 'ctr-nagpur',
    code: 'MH-02',
    name: 'Nagpur Heavy Vehicle Training Hub',
    city: 'Nagpur',
    state: 'Maharashtra',
    region: 'West',
    seniorManager: 'Siddharth Nair'
  }
];

// All center ID variants and code variants assigned to SM
export const smAssignedCenterIds: string[] = [
  'ctr-jodhpur', 'RJ-01', 'RJ01',
  'ctr-jaipur', 'RJ-02', 'RJ02',
  'ctr-mumbai', 'MH-03', 'MH03',
  'ctr-pune', 'MH-01', 'MH01',
  'ctr-nashik', 'MH-04', 'MH04',
  'ctr-kota', 'RJ-03', 'RJ03',
  'ctr-udaipur', 'RJ-04', 'RJ04',
  'ctr-delhi', 'DL-02', 'DL02',
  'ctr-delhi-north', 'DL-01', 'DL01',
  'ctr-nagpur', 'MH-02', 'MH02',
  'ctr-gurugram', 'DL-03', 'DL03'
];

/**
 * Checks whether a candidate's centerId or center code matches SM's assigned centers.
 */
export function isCenterAssignedToSM(centerIdOrCode?: string): boolean {
  if (!centerIdOrCode) return false;
  const normalized = centerIdOrCode.trim().toLowerCase();
  return smAssignedCenterIds.some(id => id.toLowerCase() === normalized);
}
