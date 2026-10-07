import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Building,
  Users,
  Calendar,
  Briefcase,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Download,
  Filter,
  Search,
  DollarSign,
  Receipt,
  UserCheck,
  Layers,
  Send,
  Eye,
  Check,
  X,
  FileCheck2,
  Navigation,
  FileText,
  BadgeCheck,
  RotateCcw,
  Camera,
  Plane,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  History,
  Info,
  Wrench,
  Copy,
  Share2,
  Lock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Candidate, Center, Employee, ExpenseClaim, ExpenseItem, LeaveRecord, DeploymentRecord, TravelMode, CenterIssueTicket } from '../../types';
import { exportCandidatesToExcel } from '../../utils/excelExporter';
import { EmployeeSelfAttendanceModal } from '../attendance/EmployeeSelfAttendanceModal';
import { ExpenseAuditTrailModal } from '../travel/ExpenseAuditTrailModal';

export const ApmDashboard: React.FC = () => {
  const {
    candidates,
    activeCenter,
    centers,
    currentPersona,
    employees,
    leaves,
    expenseClaims,
    tours,
    approveApmQc,
    dispatchCandidate,
    reviewLeave,
    approveExpenseClaim,
    rejectExpenseClaim,
    endorseExpenseClaim,
    reassignEmployeeCenter,
    applyTour,
    showToast,
    maintenanceTickets,
    resolveTicketByApm
  } = useApp();

  // Navigation Sub-Tabs Architecture as per Directive
  type ApmTab =
    | 'directory_deployment'
    | 'expense_claims_audit'
    | 'leave_authorisation'
    | 'staff_mobilisation'
    | 'qc_master_export'
    | 'facility_maintenance';

  const [activeTab, setActiveTab] = useState<ApmTab>('directory_deployment');

  // --- TAB 1: EMPLOYEE DIRECTORY & DEPLOYMENT BOARD STATE ---
  const [directoryCenterFilter, setDirectoryCenterFilter] = useState('all');
  const [directoryRoleFilter, setDirectoryRoleFilter] = useState('all');
  const [directorySearch, setDirectorySearch] = useState('');
  const [selectedDeploymentDate, setSelectedDeploymentDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedEmpForHistory, setSelectedEmpForHistory] = useState<Employee | null>(null);

  // --- TAB 2: EXPENSE CLAIMS & AUDIT GATEWAY STATE ---
  const [claimStatusFilter, setClaimStatusFilter] = useState<'all' | 'pending' | 'sanctioned' | 'settled' | 'returned'>('all');
  const [selectedClaimForAudit, setSelectedClaimForAudit] = useState<ExpenseClaim | null>(null);
  const [inspectReceiptItem, setInspectReceiptItem] = useState<ExpenseItem | null>(null);
  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
    amount: string;
    claimant: string;
  } | null>(null);
  const [auditApprovedAmount, setAuditApprovedAmount] = useState<number>(0);
  const [auditRemarks, setAuditRemarks] = useState('');
  const [auditDiscrepancyPreset, setAuditDiscrepancyPreset] = useState('');
  const [auditTrailClaim, setAuditTrailClaim] = useState<ExpenseClaim | null>(null);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState(false);

  // --- TAB 3: LEAVE AUTHORISATION DESK STATE ---
  const [leaveSubTab, setLeaveSubTab] = useState<'pending' | 'history'>('pending');
  const [selectedLeaveForAction, setSelectedLeaveForAction] = useState<LeaveRecord | null>(null);
  const [leaveReviewAction, setLeaveReviewAction] = useState<'Approved' | 'Rejected'>('Approved');
  const [leaveReviewRemarks, setLeaveReviewRemarks] = useState('');

  // --- TAB 4: STAFF MOBILISATION STATE ---
  const [selectedEmployeeForMob, setSelectedEmployeeForMob] = useState<Employee | null>(null);
  const [targetCenterId, setTargetCenterId] = useState<string>('');
  const [mobilisationEffectiveDate, setMobilisationEffectiveDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [mobilisationReason, setMobilisationReason] = useState('Special 1-day driver training camp reinforcement');

  // --- TAB 5: CANDIDATE QC STATE ---
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateCenterFilter, setCandidateCenterFilter] = useState('all');

  // --- PERSONAL APM SELF-ATTENDANCE & TOUR CLAIM MODAL STATE ---
  const [isSelfPunchOpen, setIsSelfPunchOpen] = useState(false);
  const [isPersonalTourModalOpen, setIsPersonalTourModalOpen] = useState(false);
  const [personalDestCity, setPersonalDestCity] = useState('Jaipur Fleet Academy');
  const [personalTravelMode, setPersonalTravelMode] = useState<TravelMode>('Train 2AC');
  const [personalDepDate, setPersonalDepDate] = useState('2026-10-05');
  const [personalRetDate, setPersonalRetDate] = useState('2026-10-07');
  const [personalPurpose, setPersonalPurpose] = useState('Regional Quality Audit and Simulator Recalibration Liaison');
  const [personalBudget, setPersonalBudget] = useState(12500);

  // --- TAB 6: REGIONAL FACILITY & MAINTENANCE DESK STATE ---
  const [facilityCenterFilter, setFacilityCenterFilter] = useState('all');
  const [facilityStatusFilter, setFacilityStatusFilter] = useState<'ALL' | 'ENDORSED' | 'RESOLVED'>('ALL');
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedTicketForApmResolve, setSelectedTicketForApmResolve] = useState<CenterIssueTicket | null>(null);
  const [apmActionNote, setApmActionNote] = useState('Technician visited. Please inspect the repaired facility and confirm operation.');
  const [generatedWhatsAppData, setGeneratedWhatsAppData] = useState<{
    ticket: CenterIssueTicket;
    message: string;
  } | null>(null);
  const [inspectFacilityPhoto, setInspectFacilityPhoto] = useState<string | null>(null);

  // ==========================================================
  // FILTERED DATASETS & METRICS
  // ==========================================================

  // Pending leaves across field staff (OSE, Trainer, PO)
  const pendingLeaves = useMemo(() => {
    return leaves.filter(l => l.status === 'Pending');
  }, [leaves]);

  const processedLeaves = useMemo(() => {
    return leaves.filter(l => l.status !== 'Pending');
  }, [leaves]);

  // Expense Claims pending Senior Manager gatekeeper sanction
  const pendingClaims = useMemo(() => {
    return expenseClaims.filter(
      c => c.status === 'Pending Senior Manager Review' || c.status === 'Pending APM Review' || c.status === 'Pending GM Review' || c.status.toLowerCase().includes('pending')
    );
  }, [expenseClaims]);

  const sanctionedClaims = useMemo(() => {
    return expenseClaims.filter(c => c.status === 'Approved by Senior Manager - Ready for Bank Disbursement' || c.status === 'Approved by APM - Ready for Bank Disbursement' || c.status === 'Approved by GM');
  }, [expenseClaims]);

  // Candidates awaiting Senior Manager QC Stamp
  const awaitingApmQc = useMemo(() => {
    return candidates.filter(c => c.status === 'Green Signal (Video Call)');
  }, [candidates]);

  const apmPassedCandidates = useMemo(() => {
    return candidates.filter(c => c.status === 'Senior Manager QC Passed' || c.status === 'APM QC Passed' || c.status === 'Certified & Dispatched');
  }, [candidates]);

  // Filtered Candidates for QC Tab
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      if (candidateCenterFilter !== 'all' && c.centerId !== candidateCenterFilter) return false;
      if (candidateSearch.trim()) {
        const q = candidateSearch.toLowerCase();
        const matchName = c.fullName.toLowerCase().includes(q);
        const matchReg = c.registrationNumber.toLowerCase().includes(q);
        const matchDl = c.dlNumber.toLowerCase().includes(q);
        if (!matchName && !matchReg && !matchDl) return false;
      }
      return true;
    });
  }, [candidates, candidateCenterFilter, candidateSearch]);

  // Filtered Employees for Directory & Deployment Board
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      if (directoryCenterFilter !== 'all' && emp.centerId !== directoryCenterFilter) return false;
      if (directoryRoleFilter !== 'all' && emp.role !== directoryRoleFilter) return false;
      if (directorySearch.trim()) {
        const q = directorySearch.toLowerCase();
        const matchName = emp.name.toLowerCase().includes(q);
        const matchCode = emp.empCode.toLowerCase().includes(q);
        const matchDesig = emp.designation.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchDesig) return false;
      }
      return true;
    });
  }, [employees, directoryCenterFilter, directoryRoleFilter, directorySearch]);

  // Deployment Summary Metrics
  const deploymentMetrics = useMemo(() => {
    const total = employees.length;
    const onSite = employees.filter(e => (e.deploymentStatus || 'On-Site') === 'On-Site').length;
    const onTour = employees.filter(e => e.deploymentStatus === 'On Tour').length;
    const onLeave = employees.filter(e => e.deploymentStatus === 'On Leave').length;
    const totalAchieved = employees.reduce((acc, e) => acc + (e.monthlyAchieved || 0), 0);
    const totalTarget = employees.reduce((acc, e) => acc + (e.monthlyTarget || 600), 0);
    const overallRate = totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;
    return { total, onSite, onTour, onLeave, overallRate, totalAchieved, totalTarget };
  }, [employees]);

  // All permanent deployment historical records across all employees
  const allDeploymentHistory = useMemo(() => {
    const records: Array<DeploymentRecord & { employeeName: string; empCode: string; role: string }> = [];
    employees.forEach(emp => {
      if (emp.deploymentHistory && emp.deploymentHistory.length > 0) {
        emp.deploymentHistory.forEach(hist => {
          records.push({
            ...hist,
            employeeName: emp.name,
            empCode: emp.empCode,
            role: emp.role
          });
        });
      }
    });
    return records.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
  }, [employees]);

  // Filtered Expense Claims for Tab 2
  const filteredExpenseClaims = useMemo(() => {
    return expenseClaims.filter(c => {
      if (claimStatusFilter === 'all') return true;
      if (claimStatusFilter === 'pending') {
        return c.status === 'Pending Senior Manager Review' || c.status === 'Pending APM Review' || c.status === 'Pending GM Review' || c.status.toLowerCase().includes('pending');
      }
      if (claimStatusFilter === 'sanctioned') {
        return c.status === 'Approved by Senior Manager - Ready for Bank Disbursement' || c.status === 'Approved by APM - Ready for Bank Disbursement' || c.status === 'Approved by GM';
      }
      if (claimStatusFilter === 'settled') {
        return c.status === 'Settled via Bank Transfer';
      }
      if (claimStatusFilter === 'returned') {
        return c.status === 'Returned / Rejected by Senior Manager' || c.status === 'Returned / Rejected by APM' || c.status === 'Rejected';
      }
      return true;
    });
  }, [expenseClaims, claimStatusFilter]);

  // Tab 6: Facility Tickets
  const regionalFacilityTickets = useMemo(() => {
    return maintenanceTickets.filter(t => {
      const matchCenter = facilityCenterFilter === 'all' || t.centerId === facilityCenterFilter;
      const matchStatus =
        facilityStatusFilter === 'ALL'
          ? true
          : facilityStatusFilter === 'ENDORSED'
          ? t.status === 'Endorsed by PO'
          : t.status === 'Resolved by Senior Manager' || t.status === 'Resolved by APM';
      return matchCenter && matchStatus;
    });
  }, [maintenanceTickets, facilityCenterFilter, facilityStatusFilter]);

  const endorsedFacilityTickets = useMemo(() => {
    return maintenanceTickets.filter(t => t.status === 'Endorsed by PO');
  }, [maintenanceTickets]);

  // ==========================================================
  // ACTION HANDLERS
  // ==========================================================

  // Master Excel Export
  const handleExportMasterExcel = () => {
    const verifiedCandidates = candidates.filter(
      c => c.status === 'Senior Manager QC Passed' || c.status === 'APM QC Passed' || c.status === 'Certified & Dispatched' || c.status === 'Green Signal (Video Call)'
    );

    exportCandidatesToExcel({
      candidates: verifiedCandidates.length > 0 ? verifiedCandidates : candidates,
      center: activeCenter,
      batchCode: 'Regional-Master-SM-QC',
      exportedBy: `${currentPersona.name} (Senior Manager - Level 3)`,
      filterLabel: 'Verified & Green Signal Regional Candidates'
    });

    showToast('Verified Master Excel Workbook generated and downloaded successfully!');
  };

  // Staff Mobilisation Confirmation
  const handleConfirmMobilisation = () => {
    if (!selectedEmployeeForMob || !targetCenterId) {
      showToast('Error: Please select a valid target center.');
      return;
    }

    reassignEmployeeCenter(
      selectedEmployeeForMob.id,
      targetCenterId,
      mobilisationEffectiveDate,
      mobilisationReason
    );
    setSelectedEmployeeForMob(null);
  };

  // Open Claim Audit Drawer
  const handleOpenClaimAudit = (claim: ExpenseClaim) => {
    setSelectedClaimForAudit(claim);
    setAuditApprovedAmount(claim.totalClaimed);
    setAuditRemarks(claim.apmRemarks || 'Audit verified against DB Skills regional travel policy and GST invoices.');
    setAuditDiscrepancyPreset('');
  };

  // Leave Review Action
  const handleOpenLeaveModal = (leave: LeaveRecord, action: 'Approved' | 'Rejected') => {
    setSelectedLeaveForAction(leave);
    setLeaveReviewAction(action);
    setLeaveReviewRemarks(
      action === 'Approved'
        ? `Formally approved by ${currentPersona.name} (Senior Manager). Duty days deducted from 12-day annual quota.`
        : 'Center training batch schedule conflicts with proposed absence period.'
    );
  };

  const handleConfirmLeaveDecision = () => {
    if (!selectedLeaveForAction) return;
    reviewLeave(selectedLeaveForAction.id, leaveReviewAction, leaveReviewRemarks);
    setSelectedLeaveForAction(null);
  };

  // Personal Tour Application Submit by APM
  const handlePersonalTourSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyTour({
      employeeId: currentPersona.id || 'emp-4',
      employeeName: currentPersona.name,
      employeeRole: currentPersona.role,
      employeeLevel: currentPersona.level,
      originCenter: activeCenter.name,
      destinationCity: personalDestCity,
      departureDate: personalDepDate,
      returnDate: personalRetDate,
      travelMode: personalTravelMode,
      purpose: personalPurpose,
      estimatedBudget: Number(personalBudget)
    });
    setIsPersonalTourModalOpen(false);
  };

  // Maintenance Tickets & WhatsApp Directive Actions
  const generateDirectiveText = (ticket: CenterIssueTicket, actionNote: string) => {
    const formattedDate = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    return `*DB SKILLS FACILITY ACTION DIRECTIVE*
Center: ${ticket.centerName}
Issue: ${ticket.title}
Ticket Ref: ${ticket.id}
Reported By: ${ticket.reportedByTrainerName} | Endorsed By: ${ticket.poName || 'PO Verified'}
Status: Approved for Repair / Resolved by APM

Action Required: ${actionNote}
Date: ${formattedDate}`;
  };

  const handleOpenApmResolveModal = (ticket: CenterIssueTicket) => {
    setSelectedTicketForApmResolve(ticket);
    setApmActionNote(
      ticket.category === 'Water Filter / RO'
        ? 'Technician visited and replaced the RO filter membrane & repaired leak. Please inspect water flow and confirm quality.'
        : ticket.category === 'CCTV & Security'
        ? 'Technician reconnected IP feed and aligned cameras. Please verify live monitoring feed on the local NVR monitor.'
        : ticket.category === 'Classroom Projector / Audio'
        ? 'HDMI cabling and projector bulb serviced. Please conduct test slide projection before next batch session.'
        : 'Maintenance technician dispatched and repairs completed. Please verify operational condition and sign vendor slip.'
    );
    setIsResolveModalOpen(true);
  };

  const handleConfirmApmResolve = () => {
    if (!selectedTicketForApmResolve) return;
    resolveTicketByApm(selectedTicketForApmResolve.id, currentPersona.name, apmActionNote);
    const msg = generateDirectiveText(selectedTicketForApmResolve, apmActionNote);
    setIsResolveModalOpen(false);
    setGeneratedWhatsAppData({
      ticket: {
        ...selectedTicketForApmResolve,
        status: 'Resolved by APM',
        apmName: currentPersona.name,
        resolutionRemarks: apmActionNote
      },
      message: msg
    });
  };

  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* TOP REGIONAL BANNER: APM OPERATIONAL & FINANCIAL DESK */}
      {/* ==================================================== */}
      <div className="bg-gradient-to-r from-[#0d5c63] via-teal-900 to-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Senior Manager (SM - Level 3) Regional Workspace / Console
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Senior Manager Console & Operations Workspace
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 max-w-2xl leading-relaxed">
              Designated regional operational authority: Authorize field staff leaves, track center-wise live staff deployment, execute inter-center staff mobilisation, monitor regional claims status (sanctioned by GM), and issue final batch quality certification.
            </p>
          </div>

          {/* Quick Action Buttons for APM */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Universal Selfie Attendance Punch Button */}
            <button
              type="button"
              onClick={() => setIsSelfPunchOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95"
              title="Record personal geotagged selfie check-in/out"
            >
              <Camera className="w-4 h-4 text-emerald-300" />
              <span>Self-Attendance Punch</span>
            </button>

            {/* Personal Tour Sanction Request */}
            <button
              type="button"
              onClick={() => setIsPersonalTourModalOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-teal-800/80 hover:bg-teal-700 border border-teal-600/50 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95"
              title="File personal official tour sanction application"
            >
              <Plane className="w-4 h-4 text-teal-300" />
              <span>Apply Tour Sanction</span>
            </button>

            {/* Master Excel Export */}
            <button
              type="button"
              onClick={handleExportMasterExcel}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-transform active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>Export Master Excel</span>
            </button>
          </div>
        </div>

        {/* Regional KPI Metric Strip */}
        <div className="mt-5 pt-4 border-t border-teal-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('directory_deployment')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              activeTab === 'directory_deployment'
                ? 'bg-teal-500/20 border-teal-400 text-white ring-2 ring-teal-400/30'
                : 'bg-white/5 border-white/10 text-teal-100 hover:bg-white/10'
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-200 block">
              Live Staff Deployment
            </span>
            <span className="text-xl font-extrabold">{deploymentMetrics.total} Staff</span>
            <span className="text-[10px] block opacity-80">
              {deploymentMetrics.onSite} On-Site • {deploymentMetrics.onTour} Tour • {deploymentMetrics.onLeave} Leave
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expense_claims_audit')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              activeTab === 'expense_claims_audit'
                ? 'bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-400/30'
                : 'bg-white/5 border-white/10 text-teal-100 hover:bg-white/10'
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 block">
              Expense Claims Audit
            </span>
            <span className="text-xl font-extrabold">{pendingClaims.length} Pending</span>
            <span className="text-[10px] block opacity-80">
              {sanctionedClaims.length} Sanctioned for Disbursement
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leave_authorisation')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              activeTab === 'leave_authorisation'
                ? 'bg-blue-500/20 border-blue-400 text-white ring-2 ring-blue-400/30'
                : 'bg-white/5 border-white/10 text-teal-100 hover:bg-white/10'
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-300 block">
              Leave Authorisation Desk
            </span>
            <span className="text-xl font-extrabold">{pendingLeaves.length} Applications</span>
            <span className="text-[10px] block opacity-80">Field Staff Pending Sanction</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qc_master_export')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              activeTab === 'qc_master_export'
                ? 'bg-emerald-500/20 border-emerald-400 text-white ring-2 ring-emerald-400/30'
                : 'bg-white/5 border-white/10 text-teal-100 hover:bg-white/10'
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block">
              Candidate Quality Check
            </span>
            <span className="text-xl font-extrabold">{awaitingApmQc.length} Awaiting QC</span>
            <span className="text-[10px] block opacity-80">{apmPassedCandidates.length} Certified / Passed</span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 5-SUBTAB WORKSPACE ARCHITECTURE (STRICT CHRONOLOGY)  */}
      {/* ==================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Sub-tab 1 */}
          <button
            type="button"
            onClick={() => setActiveTab('directory_deployment')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'directory_deployment'
                ? 'bg-[#0d5c63] text-white shadow-xs ring-2 ring-[#0d5c63]/20'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-teal-300" />
            <span>1. Staff Directory & Deployment</span>
            <span className="bg-teal-500/30 text-teal-100 px-1.5 py-0.5 rounded-full text-[10px] font-mono">
              {employees.length}
            </span>
          </button>

          {/* Sub-tab 2 */}
          <button
            type="button"
            onClick={() => setActiveTab('expense_claims_audit')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'expense_claims_audit'
                ? 'bg-[#0d5c63] text-white shadow-xs ring-2 ring-[#0d5c63]/20'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4 text-amber-300" />
            <span>2. Tour Expense Claims Audit</span>
            {pendingClaims.length > 0 && (
              <span className="bg-amber-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {pendingClaims.length}
              </span>
            )}
          </button>

          {/* Sub-tab 3 */}
          <button
            type="button"
            onClick={() => setActiveTab('leave_authorisation')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'leave_authorisation'
                ? 'bg-[#0d5c63] text-white shadow-xs ring-2 ring-[#0d5c63]/20'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4 text-blue-300" />
            <span>3. Staff Leave Authorisation Desk</span>
            {pendingLeaves.length > 0 && (
              <span className="bg-blue-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {pendingLeaves.length}
              </span>
            )}
          </button>

          {/* Sub-tab 4 */}
          <button
            type="button"
            onClick={() => setActiveTab('staff_mobilisation')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'staff_mobilisation'
                ? 'bg-[#0d5c63] text-white shadow-xs ring-2 ring-[#0d5c63]/20'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Navigation className="w-4 h-4 text-emerald-300" />
            <span>4. Staff Mobilisation Board</span>
          </button>

          {/* Sub-tab 5 */}
          <button
            type="button"
            onClick={() => setActiveTab('qc_master_export')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'qc_master_export'
                ? 'bg-[#0d5c63] text-white shadow-xs ring-2 ring-[#0d5c63]/20'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>5. Candidate QC & Master Export</span>
            {awaitingApmQc.length > 0 && (
              <span className="bg-emerald-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {awaitingApmQc.length}
              </span>
            )}
          </button>

          {/* Sub-tab 6: Regional Facility & Maintenance Desk */}
          <button
            type="button"
            onClick={() => setActiveTab('facility_maintenance')}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'facility_maintenance'
                ? 'bg-[#0d5c63] text-white shadow-xs ring-2 ring-[#0d5c63]/20'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-300" />
            <span>6. Regional Facility & Maintenance</span>
            {endorsedFacilityTickets.length > 0 && (
              <span className="bg-amber-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold animate-pulse">
                {endorsedFacilityTickets.length}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={handleExportMasterExcel}
          className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 flex items-center gap-1.5 shadow-2xs"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600" />
          <span>Excel Dossier</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* FEATURE 1 / TAB 1: ALL-EMPLOYEE DIRECTORY & DEPLOYMENT */}
      {/* ==================================================== */}
      {activeTab === 'directory_deployment' && (
        <div className="space-y-4">
          {/* Interactive Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-teal-700" />
                  Regional Employee Directory & Live Deployment Board
                </h2>
                <p className="text-xs text-slate-500">
                  Track regional field staff roster, active center deployment, attendance health, and daily driver training throughput.
                </p>
              </div>

              {/* Deployment Date Selector */}
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                <Calendar className="w-4 h-4 text-teal-700" />
                <span className="text-[11px] font-bold text-slate-600">Deployment Date:</span>
                <input
                  type="date"
                  value={selectedDeploymentDate}
                  onChange={(e) => setSelectedDeploymentDate(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>
            </div>

            {/* Filter Bar Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              {/* Filter by Center */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter by Center</label>
                <select
                  value={directoryCenterFilter}
                  onChange={(e) => setDirectoryCenterFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="all">All Regional Centers ({centers.length})</option>
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>

              {/* Filter by Designation */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Filter by Designation</label>
                <select
                  value={directoryRoleFilter}
                  onChange={(e) => setDirectoryRoleFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                >
                  <option value="all">All Designations / Roles</option>
                  <option value="OSE">Operations Support Executive (OSE)</option>
                  <option value="Trainer">Road Safety & Fleet Trainer</option>
                  <option value="PO">Program Officer (PO)</option>
                  <option value="Senior Manager">Senior Manager (SM)</option>
                </select>
              </div>

              {/* Search by Name/Code */}
              <div className="sm:col-span-1 md:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Search Staff</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, employee code, or designation..."
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Employee Deployment Table */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Staff Details</th>
                    <th className="py-3 px-4">Assigned Center</th>
                    <th className="py-3 px-4">Deployment Status</th>
                    <th className="py-3 px-4">Driver Enrollment Target</th>
                    <th className="py-3 px-4">Attendance & Leave Balance</th>
                    <th className="py-3 px-4 text-right">Operational Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        No employees found matching the selected center or designation filter.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map(emp => {
                      const centerObj = centers.find(c => c.id === emp.centerId);
                      const targetRate = emp.monthlyTarget > 0 ? Math.round((emp.monthlyAchieved / emp.monthlyTarget) * 100) : 0;
                      const statusVal = emp.deploymentStatus || 'On-Site';

                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Staff Details */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={emp.avatar}
                                alt={emp.name}
                                className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-900 block leading-tight">{emp.name}</span>
                                  <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                                    {emp.role}
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-500 font-mono block">{emp.empCode}</span>
                                <span className="text-[10px] text-slate-400 block font-mono">Ph: {emp.phone}</span>
                              </div>
                            </div>
                          </td>

                          {/* Assigned Center with Hub Code */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <Building className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                              <span className="truncate max-w-[180px]">{centerObj?.name || emp.centerName}</span>
                            </div>
                            <span className="text-[10px] font-mono text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200 mt-0.5 inline-block">
                              Hub Code: {centerObj?.code || 'HUB-01'}
                            </span>
                          </td>

                          {/* Deployment Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                                statusVal === 'On-Site'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : statusVal === 'On Tour'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-indigo-100 text-indigo-900 border border-indigo-300'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  statusVal === 'On-Site'
                                    ? 'bg-emerald-600'
                                    : statusVal === 'On Tour'
                                    ? 'bg-amber-600'
                                    : 'bg-indigo-600'
                                }`}
                              />
                              {statusVal}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                              On: {selectedDeploymentDate}
                            </span>
                          </td>

                          {/* Daily Driver Enrollment Target */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-1 w-36">
                              <div className="flex items-center justify-between text-[11px] font-mono">
                                <span className="font-bold text-slate-800">{emp.monthlyAchieved}</span>
                                <span className="text-slate-400">/ {emp.monthlyTarget} Drivers</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    targetRate >= 80 ? 'bg-emerald-500' : targetRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(targetRate, 100)}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-slate-500 font-bold block">
                                {targetRate}% Monthly Delivery
                              </span>
                            </div>
                          </td>

                          {/* Attendance Summary & Leave Quota */}
                          <td className="py-3.5 px-4">
                            <div className="text-[11px] space-y-0.5">
                              <span className="font-bold text-slate-800 block">
                                Total Present: <strong className="text-teal-900">{emp.totalPresentDays || 22} Days</strong>
                              </span>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                                <span>Casual: <strong className="text-slate-700">{emp.casualLeaveBalance}/12</strong></span>
                                <span>•</span>
                                <span>Comp-Off: <strong className="text-slate-700">{emp.compOffBalance}</strong></span>
                              </div>
                              {emp.lastCheckIn && (
                                <span className="text-[9px] text-emerald-700 font-mono block">
                                  ✓ Check-In: {emp.lastCheckIn.timestamp.split(' ')[1] || '08:30 AM'}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Operational Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Reassign / Mobilise Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedEmployeeForMob(emp);
                                  setTargetCenterId(centers.find(c => c.id !== emp.centerId)?.id || centers[0].id);
                                }}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#0d5c63] hover:bg-teal-900 text-white shadow-2xs inline-flex items-center gap-1 transition-all active:scale-95"
                                title="Transfer or reassign field employee across centers"
                              >
                                <Navigation className="w-3.5 h-3.5 text-emerald-300" />
                                <span>Mobilise</span>
                              </button>

                              {/* Deployment History Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedEmpForHistory(emp)}
                                className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                                title="View permanent transfer & deployment timeline"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* FEATURE 2 / TAB 2: TOUR REIMBURSEMENT & EXPENSE AUDIT */}
      {/* ==================================================== */}
      {activeTab === 'expense_claims_audit' && (
        <div className="space-y-4">
          {/* Header Controls & Status Filters */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Regional Claims Status Desk
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">Sanctioning Authority: GM (General Manager / Level 2) Only</span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                Tour Reimbursement & Expense Claims Tracking
              </h2>
              <p className="text-xs text-slate-500">
                Monitor status of expense claims submitted by regional staff. Financial bill auditing, discrepancy returns, and sanctioning are handled exclusively by the GM desk before accounts release funds.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setClaimStatusFilter('all')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  claimStatusFilter === 'all' ? 'bg-[#0d5c63] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Claims ({expenseClaims.length})
              </button>
              <button
                type="button"
                onClick={() => setClaimStatusFilter('pending')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  claimStatusFilter === 'pending' ? 'bg-[#0d5c63] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending Sanction ({pendingClaims.length})
              </button>
              <button
                type="button"
                onClick={() => setClaimStatusFilter('sanctioned')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  claimStatusFilter === 'sanctioned' ? 'bg-[#0d5c63] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sanctioned ({sanctionedClaims.length})
              </button>
            </div>
          </div>

          {/* Claims Queue Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredExpenseClaims.length === 0 ? (
              <div className="col-span-full bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400">
                No expense reimbursement claims matching the current filter.
              </div>
            ) : (
              filteredExpenseClaims.map(claim => {
                const isPending =
                  claim.status === 'Pending GM Review' ||
                  claim.status === 'Pending Senior Manager Review' ||
                  claim.status === 'Pending APM Review' ||
                  claim.status.toLowerCase().includes('pending');
                const isApprovedByGm = claim.status === 'Approved by GM - Ready for Bank Disbursement' || claim.status === 'Approved by GM';
                const isDisbursed = claim.status === 'Disbursed' || claim.status === 'Settled via Bank Transfer';
                const isReturned = claim.status === 'Returned by GM for Correction' || claim.status.toLowerCase().includes('returned') || claim.status.toLowerCase().includes('reject');

                // Calculate item categories if not explicitly set
                const fareTotal = claim.fareAmount ?? claim.items.filter(i => i.category === 'Travel Ticket').reduce((sum, i) => sum + i.claimAmount, 0);
                const lbTotal = claim.lodgingBoardingAmount ?? claim.items.filter(i => i.category === 'Hotel/Lodging').reduce((sum, i) => sum + i.claimAmount, 0);
                const othersTotal = claim.othersDaAmount ?? claim.items.filter(i => i.category !== 'Travel Ticket' && i.category !== 'Hotel/Lodging').reduce((sum, i) => sum + i.claimAmount, 0);

                return (
                  <div
                    key={claim.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      {/* Form Header Card */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                              {claim.claimNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Sanction: {claim.tourSanctionNumber}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-slate-900 text-sm mt-1">{claim.employeeName}</h3>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {claim.designation || claim.employeeRole} • Emp ID: {claim.employeeId}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-right ${
                            isDisbursed
                              ? 'bg-teal-100 text-teal-900 border border-teal-300'
                              : isApprovedByGm
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : isReturned
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {claim.status}
                        </span>
                      </div>

                      {/* Project, Zone & Tour Purpose Summary */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Project Name:</span>
                            <span className="font-bold text-slate-800">{claim.projectName || 'National Fleet Safety Mission'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Zone / Region:</span>
                            <span className="font-bold text-teal-900">{claim.zone || 'North-West Zone'}</span>
                          </div>
                        </div>

                        <div className="pt-1 border-t border-slate-200/60">
                          <span className="text-slate-400 block text-[10px]">Tour Dates & Purpose:</span>
                          <span className="font-bold text-slate-700 block font-mono text-[11px]">
                            {claim.tourDates || claim.submissionDate}
                          </span>
                          <p className="text-[11px] text-slate-600 italic mt-0.5 line-clamp-2">
                            "{claim.tourPurpose || 'Regional simulator instruction and fleet driver evaluation tour.'}"
                          </p>
                        </div>
                      </div>

                      {/* Itemized Breakdown Strip: Fare, L&B, Others/DA */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-blue-50/60 border border-blue-200/70 p-2.5 rounded-2xl">
                          <span className="text-[10px] uppercase font-bold text-blue-700 block">Fare Amount</span>
                          <span className="text-sm font-extrabold text-blue-950 font-mono">₹{fareTotal.toLocaleString()}</span>
                          <span className="text-[9px] text-blue-600 block">Bus / Train / Air</span>
                        </div>

                        <div className="bg-amber-50/60 border border-amber-200/70 p-2.5 rounded-2xl">
                          <span className="text-[10px] uppercase font-bold text-amber-700 block">Lodging & Boarding</span>
                          <span className="text-sm font-extrabold text-amber-950 font-mono">₹{lbTotal.toLocaleString()}</span>
                          <span className="text-[9px] text-amber-600 block">Hotel GST Bills</span>
                        </div>

                        <div className="bg-purple-50/60 border border-purple-200/70 p-2.5 rounded-2xl">
                          <span className="text-[10px] uppercase font-bold text-purple-700 block">Others / DA</span>
                          <span className="text-sm font-extrabold text-purple-950 font-mono">₹{othersTotal.toLocaleString()}</span>
                          <span className="text-[9px] text-purple-600 block">Food & Conveyance</span>
                        </div>
                      </div>

                      {/* Line Items with Quick Proof Inspector Trigger */}
                      <div className="space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Uploaded Bills & Proofs ({claim.items.length})
                        </span>
                        <div className="space-y-1">
                          {claim.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-[11px] bg-slate-50/70 px-2.5 py-1.5 rounded-xl border border-slate-100"
                            >
                              <div className="truncate max-w-[240px]">
                                <span className="font-bold text-slate-800">{item.category}:</span>{' '}
                                <span className="text-slate-600">{item.description}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono font-bold text-slate-900">₹{item.claimAmount.toLocaleString()}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const defaultUrl = item.category === 'Hotel/Lodging'
                                      ? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
                                      : item.category === 'Travel Ticket'
                                      ? 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80'
                                      : 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80';
                                    setPreviewDoc({
                                      isOpen: true,
                                      title: `${item.category}: ${item.receiptName || item.description}`,
                                      url: item.receiptUrl || defaultUrl,
                                      amount: `₹${item.claimAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                                      claimant: `${claim.employeeName} (${claim.employeeRole || 'Field Staff'})`
                                    });
                                  }}
                                  className="text-teal-700 hover:text-teal-900 p-0.5 rounded text-[10px] font-bold flex items-center gap-0.5"
                                  title="Inspect attached invoice/receipt"
                                >
                                  <Eye className="w-3 h-3 text-teal-600" />
                                  <span>View Bill</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total Claimed & Sanction Details */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600">Total Claimed Amount:</span>
                        <span className="text-lg font-extrabold text-teal-950 font-mono">
                          ₹{claim.totalClaimed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Reviewer Stamp if Processed */}
                      {claim.apmApprovedBy && (
                        <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl text-[11px] text-emerald-900 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1">
                              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Sanctioned by: {claim.apmApprovedBy}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-700">{claim.apmApprovedAt}</span>
                          </div>
                          {claim.apmRemarks && (
                            <p className="text-[10px] text-emerald-800 font-normal italic">
                              Remarks: {claim.apmRemarks}
                            </p>
                          )}
                        </div>
                      )}

                      {claim.status.includes('Returned') && claim.apmRemarks && (
                        <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-2xl text-[11px] text-rose-900">
                          <span className="font-bold block">Discrepancy Notes:</span>
                          <p className="text-[10px] text-rose-700">{claim.apmRemarks}</p>
                        </div>
                      )}
                    </div>

                    {/* Financial Decision Actions: SM Verification & GM Sanction View */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium">
                        {claim.status === 'Pending Senior Manager Review' ? (
                          <span className="text-amber-800 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-600" /> Stage 1: Senior Manager Verification Pending
                          </span>
                        ) : claim.status === 'Pending GM Review' ? (
                          <span className="text-sky-800 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> Stage 2: Forwarded to GM for Financial Grant
                          </span>
                        ) : (
                          <span>Sanction Authority: <strong>GM Level 2</strong></span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {currentPersona.role === 'Senior Manager' && claim.status === 'Pending Senior Manager Review' && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                endorseExpenseClaim(
                                  claim.id,
                                  'Tour physical execution and vouchers verified by Senior Manager. Endorsed for GM Financial Sanction.'
                                )
                              }
                              className="py-1.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-white" />
                              <span>Verify & Endorse</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                rejectExpenseClaim(
                                  claim.id,
                                  'Discrepancy in tour vouchers. Returned by Senior Manager.'
                                )
                              }
                              className="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                            >
                              Return
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setAuditTrailClaim(claim);
                            setIsAuditTrailOpen(true);
                          }}
                          className="py-1.5 px-3 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Inspect complete timestamped lifecycle audit trail (Submitted, SM Verified, GM Sanctioned, Disbursed)"
                        >
                          <History className="w-3.5 h-3.5 text-indigo-700" />
                          <span>Audit Trail</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenClaimAudit(claim)}
                          className="py-1.5 px-3.5 rounded-xl text-xs font-bold bg-[#0d5c63] hover:bg-teal-900 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Inspect Bills & Details</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* FEATURE 3 / TAB 3: REGIONAL STAFF LEAVE AUTHORISATION*/}
      {/* ==================================================== */}
      {activeTab === 'leave_authorisation' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                  Regional Workforce Administration
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">Full Leave Approval Authority</span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                Regional Staff Leave Authorisation Desk
              </h2>
              <p className="text-xs text-slate-500">
                Review, approve, or reject leave applications submitted by regional staff (OSEs, Trainers, POs). Approved leave formally deducts from the 12-day annual quota.
              </p>
            </div>

            {/* Sub-tab pills */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setLeaveSubTab('pending')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  leaveSubTab === 'pending' ? 'bg-[#0d5c63] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Incoming Queue ({pendingLeaves.length})
              </button>
              <button
                type="button"
                onClick={() => setLeaveSubTab('history')}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  leaveSubTab === 'history' ? 'bg-[#0d5c63] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Authorised & Audit History ({processedLeaves.length})
              </button>
            </div>
          </div>

          {/* Leave Queue Table */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Employee Details</th>
                    <th className="py-3 px-4">Center Location</th>
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Duration & Days</th>
                    <th className="py-3 px-4">Reason & Justification</th>
                    <th className="py-3 px-4">Reviewer Stamp</th>
                    <th className="py-3 px-4 text-right">Decision Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(leaveSubTab === 'pending' ? pendingLeaves : processedLeaves).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        {leaveSubTab === 'pending'
                          ? 'No pending leave applications awaiting APM sanction.'
                          : 'No processed leave records in audit history.'}
                      </td>
                    </tr>
                  ) : (
                    (leaveSubTab === 'pending' ? pendingLeaves : processedLeaves).map(l => {
                      const isPending = l.status === 'Pending';
                      const isApproved = l.status === 'Approved';
                      const isRejected = l.status === 'Rejected';
                      const empObj = employees.find(e => e.id === l.employeeId);

                      return (
                        <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Employee Name & Role */}
                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-slate-900 block">{l.employeeName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {l.employeeRole} • {empObj?.designation || l.employeeLevel}
                            </span>
                            {empObj && (
                              <span className="text-[10px] text-teal-800 font-mono block">
                                Quota Balance: {empObj.casualLeaveBalance}/12 Days
                              </span>
                            )}
                          </td>

                          {/* Center Location */}
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 block">{l.centerName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{l.centerId}</span>
                          </td>

                          {/* Leave Type */}
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-teal-900 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 text-[10px]">
                              {l.leaveType}
                            </span>
                          </td>

                          {/* Dates & Total Days */}
                          <td className="py-3.5 px-4 font-mono">
                            <span className="font-bold text-slate-900 block">{l.startDate} to {l.endDate}</span>
                            <span className="text-[10px] font-bold text-teal-800">{l.daysCount} Day(s)</span>
                          </td>

                          {/* Reason */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="text-slate-700 truncate" title={l.reason}>{l.reason}</p>
                            {l.compOffWorkDate && (
                              <span className="text-[10px] text-teal-800 font-mono block">
                                Generated on duty: {l.compOffWorkDate}
                              </span>
                            )}
                          </td>

                          {/* Reviewer Stamp */}
                          <td className="py-3.5 px-4">
                            {isApproved && (
                              <div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 inline-block">
                                  Approved
                                </span>
                                <span className="text-[10px] text-slate-500 block font-mono mt-0.5">
                                  Approved by: {l.reviewedBy || `${currentPersona.name} (Senior Manager)`}
                                </span>
                              </div>
                            )}

                            {isRejected && (
                              <div>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300 inline-block">
                                  Rejected
                                </span>
                                <span className="text-[10px] text-rose-600 block text-[9px] mt-0.5">
                                  {l.reviewRemarks || 'Rejected by Senior Manager'}
                                </span>
                              </div>
                            )}

                            {isPending && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                Pending Senior Manager Sanction
                              </span>
                            )}
                          </td>

                          {/* Decision Controls */}
                          <td className="py-3.5 px-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenLeaveModal(l, 'Approved')}
                                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs inline-flex items-center gap-1 transition-all active:scale-95"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Approve & Grant Leave</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenLeaveModal(l, 'Rejected')}
                                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-all active:scale-95"
                                >
                                  <X className="w-3 h-3" />
                                  <span>Reject Leave</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Action Logged • {l.reviewedAt || 'Today'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* FEATURE 4 / TAB 4: STAFF MOBILISATION CONSOLE        */}
      {/* ==================================================== */}
      {activeTab === 'staff_mobilisation' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Regional Workforce Mobility & Center Transfers
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500">Senior Manager Level 3 Jurisdiction</span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                Staff Mobilisation & Reassignment Console
              </h2>
              <p className="text-xs text-slate-500">
                Exercise regional authority to transfer or reassign field employees (OSE, Trainers, POs) across centers to balance training throughput or reinforce driver camps.
              </p>
            </div>
          </div>

          {/* Field Staff Roster with Mobilisation Triggers */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-extrabold text-slate-800 text-xs">
                Field Staff Cross-Center Reassignment Roster
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {employees.length} Active Regional Officers
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Field Employee</th>
                    <th className="py-3 px-4">Designation & Level</th>
                    <th className="py-3 px-4">Current Active Center</th>
                    <th className="py-3 px-4">Monthly Target & Output</th>
                    <th className="py-3 px-4">Tenure & Date of Joining</th>
                    <th className="py-3 px-4 text-right">Mobilisation Authority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="font-extrabold text-slate-900 block">{emp.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{emp.empCode}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">{emp.designation}</span>
                        <span className="text-[10px] text-teal-800 font-mono font-bold">
                          {emp.role} • {emp.level}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900">
                          <Building className="w-3.5 h-3.5 text-teal-700" />
                          <span>{emp.centerName}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">ID: {emp.centerId}</span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-bold text-teal-900">{emp.monthlyAchieved}</span> / {emp.monthlyTarget} Trainees
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        <span>{emp.dateOfJoining}</span>
                        <span className="text-[10px] text-slate-400 block font-sans">({emp.tenureMonths} Months)</span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEmployeeForMob(emp);
                            setTargetCenterId(centers.find(c => c.id !== emp.centerId)?.id || centers[0].id);
                          }}
                          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0d5c63] hover:bg-teal-900 text-white shadow-xs inline-flex items-center gap-1.5 transition-all active:scale-95"
                        >
                          <Navigation className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Mobilise / Reassign Center</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Permanent Deployment History Timeline */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-teal-700" />
                  Regional Permanent Deployment History & Movement Log
                </h3>
                <p className="text-xs text-slate-500">
                  Audit trail of all inter-center reassignments, official transfer orders, and reinforcement postings executed by Senior Manager.
                </p>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {allDeploymentHistory.length} Movement Orders Logged
              </span>
            </div>

            {allDeploymentHistory.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No historical mobilisation orders on record.
              </div>
            ) : (
              <div className="space-y-3">
                {allDeploymentHistory.map((hist, index) => (
                  <div
                    key={hist.id || index}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-900 bg-teal-100/60 px-2 py-0.5 rounded text-[10px]">
                          {hist.orderNumber}
                        </span>
                        <span className="font-extrabold text-slate-900">{hist.employeeName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({hist.empCode})</span>
                      </div>
                      <div className="flex items-center gap-2 font-medium text-slate-700">
                        <span className="text-slate-500">From:</span>
                        <span className="font-bold text-slate-800">{hist.fromCenterName}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="text-slate-500">To:</span>
                        <span className="font-bold text-teal-900">{hist.toCenterName}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 italic">
                        Order Ref / Reason: "{hist.reason}"
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-800 block font-mono">
                        Effective: {hist.effectiveDate}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Assigned by: {hist.assignedBy}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* FEATURE 5 / TAB 5: CANDIDATE QC & MASTER EXPORT      */}
      {/* ==================================================== */}
      {activeTab === 'qc_master_export' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Final Candidate Quality Approval & Master Export
              </h2>
              <p className="text-xs text-slate-500">
                Candidates verified by PO with <strong>Green Signal</strong> await final Senior Manager QC Approval Stamp before dispatch.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={candidateCenterFilter}
                onChange={(e) => setCandidateCenterFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium focus:outline-none"
              >
                <option value="all">All Regional Centers</option>
                {centers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search candidate..."
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
              </div>

              <button
                type="button"
                onClick={handleExportMasterExcel}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0d5c63] text-white hover:bg-teal-900 flex items-center gap-1.5 shadow-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                <span>Export Master Dossier</span>
              </button>
            </div>
          </div>

          {/* Candidate Dossier Review Table */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Trainee Candidate</th>
                    <th className="py-3 px-4">Center & Batch</th>
                    <th className="py-3 px-4">Commercial DL & Class</th>
                    <th className="py-3 px-4">PO Verification Stamp</th>
                    <th className="py-3 px-4">Audit Status</th>
                    <th className="py-3 px-4 text-right">Senior Manager Final Certification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        No candidate dossiers matching the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map(c => {
                      const isGreenSignal = c.status === 'Green Signal (Video Call)';
                      const isApmPassed = c.status === 'Senior Manager QC Passed' || c.status === 'APM QC Passed';
                      const isDispatched = c.status === 'Certified & Dispatched';
                      const centerObj = centers.find(ctr => ctr.id === c.centerId);

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={c.photoUrl}
                                alt={c.fullName}
                                className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <span className="font-extrabold text-slate-900 block leading-tight">{c.fullName}</span>
                                <span className="text-[10px] text-slate-500 font-mono">{c.registrationNumber}</span>
                                <span className="text-[10px] text-slate-400 block font-mono">Aadhaar: {c.idCardNumber}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 block">{centerObj?.name || c.centerId}</span>
                            <span className="text-[10px] font-mono text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                              {centerObj?.code || 'REG'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-slate-900 block">{c.dlNumber}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {c.vehicleClass}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">Exp: {c.dlExpiryDate}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {c.greenSignalBy ? (
                              <div className="text-[11px]">
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  Green Signal Passed
                                </span>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  By: {c.greenSignalBy}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Pending PO Audit</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ${
                                isDispatched
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : isApmPassed
                                  ? 'bg-teal-100 text-teal-900 border border-teal-300'
                                  : isGreenSignal
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {isGreenSignal && (
                              <button
                                type="button"
                                onClick={() => approveApmQc(c.id)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs inline-flex items-center gap-1 transition-all active:scale-95"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Senior Manager Final Certification</span>
                              </button>
                            )}

                            {isApmPassed && (
                              <button
                                type="button"
                                onClick={() => dispatchCandidate(c.id)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#0d5c63] hover:bg-teal-900 text-white shadow-xs inline-flex items-center gap-1 transition-all active:scale-95"
                              >
                                <Send className="w-3.5 h-3.5 text-emerald-300" />
                                <span>Dispatch Certificate</span>
                              </button>
                            )}

                            {isDispatched && (
                              <span className="text-[11px] font-mono text-emerald-800 font-bold inline-flex items-center gap-1">
                                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                                {c.certificateNumber || 'Certified'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* FEATURE 6 / TAB 6: REGIONAL FACILITY & MAINTENANCE DESK */}
      {/* ==================================================== */}
      {activeTab === 'facility_maintenance' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                  Step 3 & 4: APM Resolution & WhatsApp Action
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">Regional Center Infrastructure Oversight</span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900 mt-1">
                Regional Facility & Maintenance Desk
              </h2>
              <p className="text-xs text-slate-500 max-w-2xl">
                Review maintenance defects physically endorsed by Center Program Officers (POs). Authorize vendor repairs, mark tickets resolved, and dispatch automated WhatsApp operational directives directly to center staff.
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={facilityCenterFilter}
                onChange={e => setFacilityCenterFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
              >
                <option value="all">All Regional Centers</option>
                {centers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                {(["ALL", "ENDORSED", "RESOLVED"] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFacilityStatusFilter(tab)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      facilityStatusFilter === tab
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {tab === "ALL" && "All Tickets"}
                    {tab === "ENDORSED" && "Endorsed (Ready)"}
                    {tab === "RESOLVED" && "Resolved"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Regional Tickets</span>
              <strong className="text-xl font-black text-slate-900 mt-1 block">{regionalFacilityTickets.length}</strong>
              <span className="text-[11px] text-slate-500">Across monitored hubs</span>
            </div>

            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 shadow-2xs">
              <span className="text-amber-800 block text-[10px] uppercase font-bold">Awaiting Senior Manager Repair Action</span>
              <strong className="text-xl font-black text-amber-900 mt-1 block">
                {endorsedFacilityTickets.length}
              </strong>
              <span className="text-[11px] text-amber-700">PO Green Signal Granted</span>
            </div>

            <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 shadow-2xs">
              <span className="text-emerald-800 block text-[10px] uppercase font-bold">Resolved & Dispatched</span>
              <strong className="text-xl font-black text-emerald-900 mt-1 block">
                {maintenanceTickets.filter(t => t.status === "Resolved by Senior Manager" || t.status === "Resolved by APM").length}
              </strong>
              <span className="text-[11px] text-emerald-700">Directive sent via WhatsApp</span>
            </div>

            <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-200 shadow-2xs">
              <span className="text-teal-800 block text-[10px] uppercase font-bold">Assigned Senior Manager Auditor</span>
              <strong className="text-xs font-black text-teal-950 mt-1 block truncate">{currentPersona.name}</strong>
              <span className="text-[11px] text-teal-700 font-mono">Level 3 Regional</span>
            </div>
          </div>

          {/* Tickets Stream */}
          <div className="space-y-4">
            {regionalFacilityTickets.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs">
                <Wrench className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700 text-sm">No maintenance issues found</p>
                <p className="text-slate-400 mt-1">All endorsed center issues have been resolved or filter returned zero records.</p>
              </div>
            ) : (
              regionalFacilityTickets.map(ticket => (
                <div key={ticket.id} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-4">
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 shrink-0">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-teal-900 text-xs">{ticket.id}</span>
                          <span className="text-slate-300">•</span>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                            {ticket.category}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ticket.priority === "High"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : ticket.priority === "Medium"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {ticket.priority} Priority
                          </span>
                        </div>
                        <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">{ticket.title}</h3>
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${
                      ticket.status === "Resolved by APM"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : ticket.status === "Endorsed by PO"
                        ? "bg-blue-50 text-blue-800 border-blue-300"
                        : ticket.status === "Rejected"
                        ? "bg-rose-50 text-rose-800 border-rose-300"
                        : "bg-amber-50 text-amber-800 border-amber-300"
                    }`}>
                      {ticket.status}
                    </span>
                  </div>

                  {/* Body Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="md:col-span-2 space-y-3">
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Ground Problem Description
                        </span>
                        <p className="text-slate-800 leading-relaxed font-medium">
                          {ticket.description}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                        <div>
                          <span className="text-slate-400 block">Center Location</span>
                          <strong className="text-slate-800">{ticket.centerName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Trainer</span>
                          <strong className="text-slate-800">{ticket.reportedByTrainerName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">PO Endorsement</span>
                          <strong className="text-blue-800">{ticket.poName || "Pending"}</strong>
                        </div>
                      </div>

                      {/* PO Endorsement Info */}
                      {ticket.poEndorsedAt && (
                        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                          <p className="font-bold">PO Endorsement Verified:</p>
                          <p className="text-blue-800">Endorsed by {ticket.poName} at {ticket.poEndorsedAt} (Forwarded to Senior Manager for financial/repair sanction)</p>
                        </div>
                      )}

                      {/* Senior Manager Resolution Info */}
                      {ticket.apmResolvedAt && (
                        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-[11px] text-emerald-950">
                          <p className="font-bold">Senior Manager Resolution & Vendor Directive:</p>
                          <p className="text-emerald-900 font-medium">{ticket.resolutionRemarks}</p>
                          <p className="text-[10px] text-emerald-700 mt-1 font-semibold">Resolved by {ticket.apmName} at {ticket.apmResolvedAt}</p>
                        </div>
                      )}
                    </div>

                    {/* Photo Proof Box */}
                    <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                      {ticket.photoUrl ? (
                        <div className="space-y-2 w-full text-center">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Attached Photo Evidence
                          </span>
                          <img
                            src={ticket.photoUrl}
                            alt={ticket.title}
                            className="w-full h-32 rounded-xl object-cover border border-slate-200 cursor-pointer hover:opacity-95"
                            onClick={() => setInspectFacilityPhoto(ticket.photoUrl || null)}
                          />
                          <button
                            type="button"
                            onClick={() => setInspectFacilityPhoto(ticket.photoUrl || null)}
                            className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center justify-center gap-1 mx-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect Photo</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-6 text-slate-400">
                          <Wrench className="w-8 h-8 mx-auto mb-1 opacity-40" />
                          <span className="text-[11px]">No photo proof attached</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                    {ticket.status === "Endorsed by PO" && (
                      <button
                        type="button"
                        onClick={() => handleOpenApmResolveModal(ticket)}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-transform active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Mark Resolved & Generate WhatsApp Directive</span>
                      </button>
                    )}

                    {(ticket.status === "Resolved by Senior Manager" || ticket.status === "Resolved by APM") && (
                      <button
                        type="button"
                        onClick={() => {
                          const msg = generateDirectiveText(ticket, ticket.resolutionRemarks || "Repairs completed.");
                          setGeneratedWhatsAppData({ ticket, message: msg });
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>📱 Share WhatsApp Directive</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* APM RESOLUTION MODAL */}
      {isResolveModalOpen && selectedTicketForApmResolve && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-teal-700" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Resolve Maintenance Ticket ({selectedTicketForApmResolve.id})
                </h3>
              </div>
              <button
                onClick={() => setIsResolveModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Issue Details</span>
                <p className="font-bold text-slate-800">{selectedTicketForApmResolve.title}</p>
                <p className="text-slate-500 text-[11px]">{selectedTicketForApmResolve.description}</p>
                <p className="text-[11px] text-teal-800 font-semibold pt-1">
                  Center: {selectedTicketForApmResolve.centerName} | Endorsed By: {selectedTicketForApmResolve.poName}
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Senior Manager Action Required Note / Instructions <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={apmActionNote}
                  onChange={e => setApmActionNote(e.target.value)}
                  placeholder="e.g. Technician visited. Please inspect the repaired filter and confirm operation..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Instruction Presets</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Technician visited. Please inspect repaired unit and confirm operation.",
                    "Authorized vendor dispatched with OEM spare parts. Ground team to verify.",
                    "Repairs approved. Replacement hardware installed and tested.",
                    "Maintenance completed and verified under standard warranty."
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setApmActionNote(preset)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                    >
                      {preset.slice(0, 38)}...
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px]">
                <p className="font-bold">Automated WhatsApp Directive:</p>
                <p className="mt-0.5 text-emerald-800">
                  Submitting will mark this ticket resolved and immediately generate a pre-formatted WhatsApp action message to notify center staff and ground technicians.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsResolveModalOpen(false)}
                className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApmResolve}
                className="px-5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
              >
                Resolve & Generate WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP ACTION DISPATCH MODAL */}
      {generatedWhatsAppData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                  WA
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Automated WhatsApp Action Directive
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Pre-formatted broadcast for Center Staff & Technicians
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGeneratedWhatsAppData(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Live WhatsApp Chat Bubble Preview */}
            <div className="bg-emerald-950/5 border border-emerald-600/20 rounded-2xl p-4 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed shadow-inner">
              {generatedWhatsAppData.message}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.open(`https://wa.me/?text=${encodeURIComponent(generatedWhatsAppData.message)}`, '_blank');
                }}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-transform active:scale-98"
              >
                <span>📱 Open WhatsApp with Directive</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(generatedWhatsAppData.message);
                  showToast("Directive text copied to clipboard!");
                }}
                className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Directive Text</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setGeneratedWhatsAppData(null)}
              className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* INSPECT FACILITY PHOTO MODAL */}
      {inspectFacilityPhoto && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-4 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-xs">Facility Defect Photo Evidence</span>
              <button
                onClick={() => setInspectFacilityPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={inspectFacilityPhoto}
              alt="Facility Proof"
              className="w-full max-h-[70vh] rounded-2xl object-contain bg-slate-900"
            />
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL / DRAWER: TOUR CLAIM AUDIT & PROOF INSPECTOR   */}
      {/* ==================================================== */}
      {selectedClaimForAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Tour Reimbursement Claim Audit & Sanction
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {selectedClaimForAudit.claimNumber} • {selectedClaimForAudit.employeeName} ({selectedClaimForAudit.employeeRole})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClaimForAudit(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Claim Summary Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Tour Sanction No:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedClaimForAudit.tourSanctionNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Submission Date:</span>
                  <span className="font-mono text-slate-700">{selectedClaimForAudit.submissionDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">City Tariff Scale:</span>
                  <span className="font-bold text-teal-900">{selectedClaimForAudit.cityType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Claimed:</span>
                  <span className="font-mono font-extrabold text-teal-900 text-sm">
                    ₹{selectedClaimForAudit.totalClaimed.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70 text-[11px]">
                <span className="text-slate-400 block text-[10px]">Tour Purpose:</span>
                <span className="font-medium text-slate-700">
                  {selectedClaimForAudit.tourPurpose || 'Regional operational tour & safety instruction'}
                </span>
              </div>
            </div>

            {/* Uploaded Line Items & Receipts Review */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Itemized Expenses & Bill Proofs
              </span>

              <div className="space-y-2">
                {selectedClaimForAudit.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{item.category}</span>
                        {item.invoiceNumber && (
                          <span className="text-[9px] font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                            Inv: {item.invoiceNumber}
                          </span>
                        )}
                        {item.gstin && (
                          <span className="text-[9px] font-mono bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                            GSTIN: {item.gstin}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600">{item.description}</p>
                      {item.vendorName && (
                        <span className="text-[10px] text-slate-400 block">Vendor: {item.vendorName}</span>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-sm text-slate-900 block">
                        ₹{item.claimAmount.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => setInspectReceiptItem(item)}
                        className="text-teal-700 hover:text-teal-900 font-bold text-[10px] inline-flex items-center gap-1 mt-0.5"
                      >
                        <Eye className="w-3 h-3 text-teal-600" />
                        <span>Inspect Receipt</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Decision Fields */}
            <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
              {currentPersona.role === 'GM' ? (
                <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-200 text-teal-950 text-xs space-y-3">
                  <div className="flex items-center gap-2 font-bold text-teal-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>GM Financial Sanction & Review Authority</span>
                  </div>
                  <p className="text-[11px] text-teal-800">
                    As General Manager (Level 2), you hold exclusive authority to inspect attached bills, adjust sanctioned amounts, approve for bank disbursement, or return claims for discrepancy.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-teal-200/60">
                    <div>
                      <label className="text-[10px] font-bold text-teal-900 block mb-1 uppercase">
                        Sanctioned Amount (₹)
                      </label>
                      <input
                        type="number"
                        value={auditApprovedAmount}
                        onChange={e => setAuditApprovedAmount(Number(e.target.value))}
                        className="w-full px-3 py-1.5 rounded-xl border border-teal-300 bg-white text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-teal-900 block mb-1 uppercase">
                        GM Decision Remarks / Discrepancy Reason
                      </label>
                      <input
                        type="text"
                        value={auditRemarks}
                        onChange={e => setAuditRemarks(e.target.value)}
                        placeholder="e.g. Sanctioned as per policy / Hotel GST bill missing"
                        className="w-full px-3 py-1.5 rounded-xl border border-teal-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* GM Exclusive Authority Notice for Senior Manager */
                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-amber-950 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Lock className="w-4 h-4 text-amber-700" />
                    <span>Expense Sanctioning Authority: GM (General Manager / Level 2) Only</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Financial approval, bill audits, and discrepancy returns for tour reimbursement claims are routed exclusively to the General Manager (GM) desk. Senior Manager console provides read-only tracking. Accounts will disburse bank transfers strictly upon GM authorization.
                  </p>
                  {selectedClaimForAudit.reviewedBy && (
                    <p className="text-[11px] font-semibold text-emerald-800 pt-1 border-t border-amber-200/60">
                      Audit Status: {selectedClaimForAudit.reviewedBy} {selectedClaimForAudit.reviewedAt ? `on ${selectedClaimForAudit.reviewedAt}` : ''}
                      {selectedClaimForAudit.gmRemarks ? ` — "${selectedClaimForAudit.gmRemarks}"` : ''}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedClaimForAudit(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>

              {currentPersona.role === 'Senior Manager' && selectedClaimForAudit.status === 'Pending Senior Manager Review' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      rejectExpenseClaim(
                        selectedClaimForAudit.id,
                        auditRemarks || 'Tour physical verification discrepancy observed by Senior Manager.'
                      );
                      setSelectedClaimForAudit(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300 transition-colors"
                  >
                    Return Claim
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      endorseExpenseClaim(
                        selectedClaimForAudit.id,
                        auditRemarks || 'Tour physical execution, dates, and vouchers verified. Endorsed for GM Financial Sanction.'
                      );
                      setSelectedClaimForAudit(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4 text-white" />
                    <span>Verify & Endorse Claim (To GM)</span>
                  </button>
                </>
              )}

              {currentPersona.role === 'GM' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      rejectExpenseClaim(
                        selectedClaimForAudit.id,
                        auditRemarks || 'Bill discrepancy observed. Please re-upload verified GST invoices.'
                      );
                      setSelectedClaimForAudit(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300 transition-colors"
                  >
                    Return for Correction
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      approveExpenseClaim(
                        selectedClaimForAudit.id,
                        auditApprovedAmount > 0 ? auditApprovedAmount : selectedClaimForAudit.totalClaimed,
                        auditRemarks || 'Verified and sanctioned in full by General Manager.'
                      );
                      setSelectedClaimForAudit(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
                  >
                    Grant GM Financial Sanction
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: INTERACTIVE RECEIPT & BILL VIEWER (PREVIEW DOC) */}
      {/* ==================================================== */}
      {previewDoc?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 truncate max-w-md">
                    {previewDoc.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>Claimant: <strong className="text-slate-700">{previewDoc.claimant}</strong></span>
                    <span>•</span>
                    <span>Amount: <strong className="font-mono text-teal-800">{previewDoc.amount}</strong></span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Image & High-Fidelity Proof Viewport */}
            <div className="relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center min-h-[300px] max-h-[440px]">
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="w-full h-full object-contain max-h-[420px]"
              />
              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-slate-900/90 text-white text-[10px] font-mono border border-slate-700/80 backdrop-blur-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Verified GST Audit Slip • DB Skills Document Vault</span>
              </div>
            </div>

            {/* Footer Information & Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
              <div className="text-slate-500 text-[11px]">
                <span>Status: <strong className="text-emerald-700 font-semibold">Legible & Verified Voucher</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Document</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: RECEIPT & PROOF INSPECTOR (DIGITAL BILL PREVIEW) */}
      {/* ==================================================== */}
      {inspectReceiptItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Expense Proof & Voucher Inspector
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {inspectReceiptItem.receiptName || 'Official_Expense_Attachment.pdf'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectReceiptItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* High-Fidelity Bill Preview Card */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-3 font-mono">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 text-[10px] text-slate-500 font-sans">
                <span className="font-bold text-teal-800">TAX INVOICE / VOUCHER PROOF</span>
                <span>Category: {inspectReceiptItem.category}</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Vendor / Issuer:</span>
                  <span className="font-bold text-slate-900 text-right">
                    {inspectReceiptItem.vendorName || 'Authorized State Transport Agency'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Invoice / Ticket No:</span>
                  <span className="font-bold text-slate-900">
                    {inspectReceiptItem.invoiceNumber || 'INV-2026-904128'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">GSTIN / Tax ID:</span>
                  <span className="font-bold text-emerald-800">
                    {inspectReceiptItem.gstin || '08AABCR1234F1Z9'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date of Expense:</span>
                  <span className="font-bold text-slate-900">{inspectReceiptItem.date}</span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 text-[11px] font-sans">
                <span className="text-slate-400 block text-[10px]">Description:</span>
                <p className="text-slate-800 font-medium">{inspectReceiptItem.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-600 font-sans">Claimed Amount:</span>
                <span className="text-base font-extrabold text-teal-900">
                  ₹{inspectReceiptItem.claimAmount.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-sans bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>GST Tax Breakdown & Policy Limits Verified</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setInspectReceiptItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0d5c63] text-white hover:bg-teal-900"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: STAFF MOBILISATION REASSIGNMENT               */}
      {/* ==================================================== */}
      {selectedEmployeeForMob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Mobilise / Reassign Field Staff
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {selectedEmployeeForMob.name} ({selectedEmployeeForMob.empCode})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployeeForMob(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Current Assignment:</span>
                  <span className="font-bold text-slate-800">{selectedEmployeeForMob.centerName}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Designation:</span>
                  <span className="font-mono text-teal-900">{selectedEmployeeForMob.designation}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Target Destination Center <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetCenterId}
                  onChange={(e) => setTargetCenterId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                >
                  {centers.map(c => (
                    <option key={c.id} value={c.id} disabled={c.id === selectedEmployeeForMob.centerId}>
                      {c.name} ({c.code}) {c.id === selectedEmployeeForMob.centerId ? '- Current Center' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Effective Mobilisation Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={mobilisationEffectiveDate}
                  onChange={(e) => setMobilisationEffectiveDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Mobilisation Reason / Official Order Reference <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={mobilisationReason}
                  onChange={(e) => setMobilisationReason(e.target.value)}
                  placeholder="e.g. Special 1-day driver training camp reinforcement..."
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedEmployeeForMob(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmMobilisation}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0d5c63] hover:bg-teal-900 text-white shadow-xs"
              >
                Confirm Mobilisation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: LEAVE REVIEW ACTION & REMARKS                */}
      {/* ==================================================== */}
      {selectedLeaveForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    leaveReviewAction === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {leaveReviewAction === 'Approved' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {leaveReviewAction === 'Approved' ? 'Grant Leave Approval' : 'Reject Leave Application'}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {selectedLeaveForAction.employeeName} ({selectedLeaveForAction.leaveType})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLeaveForAction(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-bold text-slate-800">
                    {selectedLeaveForAction.startDate} to {selectedLeaveForAction.endDate} ({selectedLeaveForAction.daysCount} days)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Center:</span>
                  <span className="font-bold text-slate-800">{selectedLeaveForAction.centerName}</span>
                </div>
                <div className="pt-1 text-[11px] text-slate-600">
                  <span className="text-slate-400 block text-[10px]">Reason:</span>
                  <p>{selectedLeaveForAction.reason}</p>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Senior Manager Review Remarks <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={leaveReviewRemarks}
                  onChange={(e) => setLeaveReviewRemarks(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
              </div>

              <div className="bg-slate-50 p-2 rounded-xl text-[10px] text-slate-500 font-mono">
                Reviewer Stamp: <strong>Approved by: {currentPersona.name} (Senior Manager)</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedLeaveForAction(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLeaveDecision}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs ${
                  leaveReviewAction === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {leaveReviewAction === 'Approved' ? 'Confirm & Grant Leave' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: INDIVIDUAL EMPLOYEE DEPLOYMENT TIMELINE       */}
      {/* ==================================================== */}
      {selectedEmpForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Deployment History Timeline
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {selectedEmpForHistory.name} ({selectedEmpForHistory.empCode})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmpForHistory(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[60vh] overflow-y-auto">
              {(!selectedEmpForHistory.deploymentHistory || selectedEmpForHistory.deploymentHistory.length === 0) ? (
                <div className="py-8 text-center text-slate-400">
                  No historical reassignments recorded for this officer. Currently deployed at {selectedEmpForHistory.centerName}.
                </div>
              ) : (
                selectedEmpForHistory.deploymentHistory.map((rec, i) => (
                  <div key={rec.id || i} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-teal-900">{rec.orderNumber}</span>
                      <span className="text-slate-400 font-mono text-[10px]">{rec.effectiveDate}</span>
                    </div>
                    <div className="font-medium text-slate-800">
                      From: <span className="font-bold">{rec.fromCenterName}</span> ➔ To: <span className="font-bold text-teal-900">{rec.toCenterName}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 italic">"{rec.reason}"</p>
                    <span className="text-[10px] text-slate-400 block font-mono">Assigned by: {rec.assignedBy}</span>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedEmpForHistory(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0d5c63] text-white hover:bg-teal-900"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: PERSONAL APM TOUR SANCTION REQUEST            */}
      {/* ==================================================== */}
      {isPersonalTourModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Plane className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    File Personal Tour Sanction Request (Senior Manager Level 3)
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Applicant: {currentPersona.name} ({currentPersona.role})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPersonalTourModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePersonalTourSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Destination Location</label>
                <input
                  type="text"
                  required
                  value={personalDestCity}
                  onChange={(e) => setPersonalDestCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Departure Date</label>
                  <input
                    type="date"
                    required
                    value={personalDepDate}
                    onChange={(e) => setPersonalDepDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Return Date</label>
                  <input
                    type="date"
                    required
                    value={personalRetDate}
                    onChange={(e) => setPersonalRetDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Travel Mode</label>
                  <select
                    value={personalTravelMode}
                    onChange={(e) => setPersonalTravelMode(e.target.value as TravelMode)}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs bg-slate-50 font-medium"
                  >
                    <option value="Train 2AC">Train 2AC</option>
                    <option value="Train 3AC">Train 3AC</option>
                    <option value="Bus">Bus</option>
                    <option value="Flight (Special Permit)">Flight (Special Permit)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    required
                    value={personalBudget}
                    onChange={(e) => setPersonalBudget(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Official Purpose & Agenda</label>
                <textarea
                  rows={2}
                  required
                  value={personalPurpose}
                  onChange={(e) => setPersonalPurpose(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPersonalTourModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0d5c63] hover:bg-teal-900 text-white shadow-xs"
                >
                  Submit Tour Sanction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* UNIVERSAL EMPLOYEE SELF-ATTENDANCE PUNCH MODAL       */}
      {/* ==================================================== */}
      <EmployeeSelfAttendanceModal
        isOpen={isSelfPunchOpen}
        onClose={() => setIsSelfPunchOpen(false)}
        defaultType="CHECK_IN"
      />

      {/* Expense Claim Audit Trail Modal */}
      <ExpenseAuditTrailModal
        isOpen={isAuditTrailOpen}
        claim={auditTrailClaim}
        onClose={() => {
          setIsAuditTrailOpen(false);
          setAuditTrailClaim(null);
        }}
      />
    </div>
  );
};
