/**
 * Production Handover: Hubs and Centers Mapping
 * Defines dynamic center bindings for regional quality consoles.
 * Empty default state for client production handover.
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

export const SM_ASSIGNED_HUBS: HubMapping[] = [];

// Dynamic center ID variants assigned to SM
export const smAssignedCenterIds: string[] = [];

/**
 * Checks whether a candidate's centerId or center code matches SM's assigned centers.
 */
export function isCenterAssignedToSM(centerIdOrCode?: string): boolean {
  if (!centerIdOrCode) return false;
  const normalized = centerIdOrCode.trim().toLowerCase();
  return smAssignedCenterIds.some(id => id.toLowerCase() === normalized);
}
