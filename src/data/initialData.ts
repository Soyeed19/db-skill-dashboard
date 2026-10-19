import {
  Center,
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

/**
 * Production Handover: Blank Initial State
 * Zero mock fixtures. All entities strictly provisioned via Supabase or user creation.
 */

export const INITIAL_CENTERS: Center[] = [];
export const INITIAL_BATCHES: Batch[] = [];
export const INITIAL_CANDIDATES: Candidate[] = [];
export const INITIAL_CONSUMABLES: ConsumableItem[] = [];
export const INITIAL_TRANSACTIONS: StockTransaction[] = [];
export const INITIAL_EMPLOYEES: Employee[] = [];
export const INITIAL_LEAVES: LeaveRecord[] = [];
export const INITIAL_TOURS: TourRequest[] = [];
export const INITIAL_EXPENSE_CLAIMS: ExpenseClaim[] = [];
export const INITIAL_ATTENDANCE_PUNCHES: AttendancePunch[] = [];
export const INITIAL_MAINTENANCE_TICKETS: CenterIssueTicket[] = [];
