import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  Filter,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Clock,
  User,
  CreditCard,
  Building,
  Calendar,
  Phone,
  MapPin,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  HelpCircle,
  X,
  FileCheck2,
  Layers,
  ArrowRight,
  Wrench,
  CheckCircle,
  XCircle,
  Send,
  Camera
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Candidate, AuditQuery, Center, CenterIssueTicket, AttendancePunch } from '../../types';
import { AuditInspectionWorkspace } from './AuditInspectionWorkspace';
import { PoAuditDesk } from './PoAuditDesk';

export const PoDashboard: React.FC = () => {
  const {
    candidates,
    updateCandidate,
    activeCenter,
    centers,
    currentPersona,
    grantGreenSignal,
    raiseAuditQuery,
    maintenanceTickets,
    endorseTicketByPo,
    rejectTicketByPo,
    attendanceLogs,
    showToast
  } = useApp();

  // PO Workspace Mode
  const [poWorkspaceMode, setPoWorkspaceMode] = useState<'candidates' | 'facility_audit' | 'staff_attendance'>('candidates');

  // Staff Attendance Audit State
  const [inspectWatermarkPunch, setInspectWatermarkPunch] = useState<AttendancePunch | null>(null);
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('');
  const [attendanceTypeFilter, setAttendanceTypeFilter] = useState<'ALL' | 'CHECK_IN' | 'CHECK_OUT'>('ALL');

  // Facility Audit State
  const [facilityStatusFilter, setFacilityStatusFilter] = useState<'ALL' | 'PENDING' | 'ENDORSED' | 'RESOLVED'>('PENDING');
  const [selectedTicketForPoAction, setSelectedTicketForPoAction] = useState<CenterIssueTicket | null>(null);
  const [rejectTicketReason, setRejectTicketReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [inspectPhotoUrl, setInspectPhotoUrl] = useState<string | null>(null);

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'QUERIES' | 'GREEN_SIGNAL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Split-View Document Scans Tab
  type DocScanTab = 'id_front' | 'id_back' | 'dl_front' | 'dl_back' | 'photo' | 'driver_holding_id';
  const [activeDocTab, setActiveDocTab] = useState<DocScanTab>('id_front');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  // Raise Query Modal State
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [queryField, setQueryField] = useState<AuditQuery['field']>('Name Mismatch');
  const [queryComment, setQueryComment] = useState('');
  const [queryError, setQueryError] = useState('');

  // Center filter (PO can review assigned center or all regional centers)
  const [filterCenterId, setFilterCenterId] = useState<string>('all');

  // Filter maintenance tickets for PO assigned center / regional view
  const poCenterTickets = useMemo(() => {
    return maintenanceTickets.filter(t => {
      if (filterCenterId !== "all" && t.centerId !== filterCenterId) return false;
      if (facilityStatusFilter === "PENDING" && t.status !== "Pending PO Verification") return false;
      if (facilityStatusFilter === "ENDORSED" && t.status !== "Endorsed by PO") return false;
      if (facilityStatusFilter === "RESOLVED" && t.status !== "Resolved by APM") return false;
      return true;
    });
  }, [maintenanceTickets, filterCenterId, facilityStatusFilter]);

  const pendingPoTicketsCount = useMemo(() => {
    return maintenanceTickets.filter(t => {
      if (filterCenterId !== "all" && t.centerId !== filterCenterId) return false;
      return t.status === "Pending PO Verification";
    }).length;
  }, [maintenanceTickets, filterCenterId]);

  // Filter attendance logs from shared store
  const filteredAttendanceLogs = useMemo(() => {
    return attendanceLogs.filter(punch => {
      if (attendanceTypeFilter !== 'ALL' && punch.type !== attendanceTypeFilter) return false;
      if (attendanceSearchQuery.trim()) {
        const q = attendanceSearchQuery.toLowerCase();
        const matchesName = punch.employeeName?.toLowerCase().includes(q);
        const matchesDesig = punch.designation?.toLowerCase().includes(q);
        const matchesAddr = punch.locationAddress?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesig && !matchesAddr) return false;
      }
      return true;
    });
  }, [attendanceLogs, attendanceTypeFilter, attendanceSearchQuery]);

  const handleConfirmRejectTicket = () => {
    if (!selectedTicketForPoAction || !rejectTicketReason.trim()) {
      showToast("Please provide a reason for rejecting this maintenance ticket.");
      return;
    }
    rejectTicketByPo(selectedTicketForPoAction.id, currentPersona.name, rejectTicketReason.trim());
    setIsRejectModalOpen(false);
    setSelectedTicketForPoAction(null);
    setRejectTicketReason("");
  };

  // Filter candidates relevant to PO review queue
  const poCandidates = useMemo(() => {
    return candidates.filter(c => {
      // Center scoping filter
      if (filterCenterId !== 'all' && c.centerId !== filterCenterId) return false;

      // Status filter
      if (
        statusFilter === 'PENDING' &&
        c.status !== 'Pending PO Review' &&
        (c.status as any) !== 'PENDING_PO_REVIEW'
      ) {
        return false;
      }
      if (statusFilter === 'QUERIES' && c.status !== 'Query Raised') return false;
      if (
        statusFilter === 'GREEN_SIGNAL' &&
        c.status !== 'Green Signal (Video Call)' &&
        (c.status as any) !== 'PENDING_SM_REVIEW' &&
        (c.status as any) !== 'Approved by PO'
      ) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.fullName?.toLowerCase().includes(q);
        const matchReg = c.registrationNumber?.toLowerCase().includes(q);
        const matchDl = c.dlNumber?.toLowerCase().includes(q);
        const matchAadhaar = c.idCardNumber?.includes(q);
        if (!matchName && !matchReg && !matchDl && !matchAadhaar) return false;
      }

      return true;
    });
  }, [candidates, filterCenterId, statusFilter, searchQuery]);

  // Synchronize selection: If queue is empty or selected candidate is no longer in queue, reset or pick first
  useEffect(() => {
    if (poCandidates.length === 0) {
      if (selectedCandidate !== null) {
        setSelectedCandidate(null);
      }
    } else if (!selectedCandidate || !poCandidates.some(c => c.id === selectedCandidate.id)) {
      setSelectedCandidate(poCandidates[0]);
    }
  }, [poCandidates, selectedCandidate]);

  // Counters for Metric Badges
  const isSeniorManager =
    currentPersona?.role === 'Senior Manager' ||
    (currentPersona as any)?.role === 'SENIOR_MANAGER' ||
    (currentPersona as any)?.role === 'APM';

  const pendingCount = candidates.filter(c => {
    if (isSeniorManager) {
      return (
        c.status === 'PENDING_SM_REVIEW' ||
        c.status === 'Green Signal (Video Call)' ||
        (c.status as any) === 'Approved by PO'
      );
    }
    return c.status === 'Pending PO Review' || (c.status as any) === 'PENDING_PO_REVIEW';
  }).length;
  const queriesCount = candidates.filter(c => c.status === 'Query Raised').length;
  const greenSignalCount = candidates.filter(
    c =>
      c.status === 'Green Signal (Video Call)' ||
      (c.status as any) === 'PENDING_SM_REVIEW' ||
      (c.status as any) === 'Approved by PO'
  ).length;
  const totalInQueue = candidates.length;

  // Image zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  // Trigger Approve / Green Signal with Handover to Senior Manager
  const handleApproveGreenSignal = (candidateId?: string) => {
    const targetId = candidateId || selectedCandidate?.id;
    if (!targetId) return;

    const timestamp = new Date().toISOString();
    const currentUser = currentPersona || { name: 'Program Officer', role: 'PO' };

    // 1. Candidate status update
    updateCandidate(targetId, {
      status: 'PENDING_SM_REVIEW',
      poApprovedAt: timestamp,
      poReviewer: currentUser.name,
      poApprovedBy: currentUser.name,
      poApprovalTimestamp: timestamp,
      currentStage: 'PENDING_SM_REVIEW',
      greenSignalBy: `${currentUser.name} (${currentUser.role || 'PO'})`,
      greenSignalAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      isLocked: true
    });

    // 2. Queue filter
    const updatedQueue = poCandidates.filter(item => item.id !== targetId);

    // 3. Selection reset logic
    if (updatedQueue.length > 0) {
      setSelectedCandidate(updatedQueue[0]);
    } else {
      setSelectedCandidate(null); // Prevents stale data leak
    }

    showToast('Candidate approved by PO and forwarded to Senior Manager for final QC approval.');
  };

  const activeCandidate = selectedCandidate;

  // Trigger Raise Query with validation
  const handleOpenQueryModal = () => {
    setQueryComment('');
    setQueryError('');
    setIsQueryModalOpen(true);
  };

  const handleConfirmRaiseQuery = () => {
    if (!queryComment.trim()) {
      setQueryError('Mandatory remark: Please describe the document defect or mismatch.');
      return;
    }
    if (!activeCandidate) return;

    raiseAuditQuery(activeCandidate.id, queryField, queryComment.trim());
    setIsQueryModalOpen(false);
  };

  // Get active scan URL based on selected tab
  const currentScanUrl = useMemo(() => {
    if (!activeCandidate) return '';
    switch (activeDocTab) {
      case 'id_front':
        return activeCandidate.idFrontUrl;
      case 'id_back':
        return activeCandidate.idBackUrl;
      case 'dl_front':
        return activeCandidate.dlFrontUrl;
      case 'dl_back':
        return activeCandidate.dlBackUrl;
      case 'photo':
        return activeCandidate.photoUrl;
      case 'driver_holding_id':
        return activeCandidate.driverHoldingIdUrl || activeCandidate.photoUrl;
      default:
        return activeCandidate.idFrontUrl;
    }
  }, [activeCandidate, activeDocTab]);

  return (
    <div className="space-y-6">
      {/* PO Desk Mode Navigation Switcher */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xs flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPoWorkspaceMode("candidates")}
          className={`flex-1 min-w-[240px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            poWorkspaceMode === "candidates"
              ? "bg-dbs-green text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>1. Candidate Verification Split-View</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/20 text-white font-bold">
            {pendingCount} Pending
          </span>
        </button>

        <button
          type="button"
          onClick={() => setPoWorkspaceMode("facility_audit")}
          className={`flex-1 min-w-[240px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            poWorkspaceMode === "facility_audit"
              ? "bg-dbs-green text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>2. Center Facility Issues Audit Queue</span>
          {pendingPoTicketsCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 text-amber-900 font-bold">
              {pendingPoTicketsCount} Urgent
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setPoWorkspaceMode("staff_attendance")}
          className={`flex-1 min-w-[240px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            poWorkspaceMode === "staff_attendance"
              ? "bg-dbs-green text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>3. Staff Biometric Attendance Logs</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/20 text-white font-bold">
            {attendanceLogs.length} Records
          </span>
        </button>
      </div>

      {poWorkspaceMode === 'candidates' ? (
        <PoAuditDesk initialCenterId={filterCenterId} />
      ) : poWorkspaceMode === 'facility_audit' ? (
        /* CENTER FACILITY ISSUES AUDIT QUEUE */
        <div className="space-y-6">
          {/* Section Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                  Step 2: PO Physical Endorsement
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">Center Maintenance Queue</span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900 mt-1">
                Center Facility Issues Audit Queue
              </h2>
              <p className="text-xs text-slate-500">
                Audit on-ground facility issues reported by Trainers. Physically verify defects and grant "Green Signal Endorsement" to escalate for APM repair authorization.
              </p>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
              {(["PENDING", "ENDORSED", "RESOLVED", "ALL"] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFacilityStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    facilityStatusFilter === tab
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {tab === "PENDING" && "Pending PO Verification"}
                  {tab === "ENDORSED" && "Endorsed to APM"}
                  {tab === "RESOLVED" && "Resolved by APM"}
                  {tab === "ALL" && "All Tickets"}
                </button>
              ))}
            </div>
          </div>

          {/* Issue Cards Grid */}
          <div className="space-y-4">
            {poCenterTickets.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-xs">
                <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-600">No maintenance tickets in this queue</p>
                <p className="text-[11px] text-slate-400 mt-0.5">All center facility issues are currently up-to-date or matching the selected filters.</p>
              </div>
            ) : (
              poCenterTickets.map(ticket => (
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

                  {/* Body & Image */}
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
                          <span className="text-slate-400 block">Center Hub</span>
                          <strong className="text-slate-800">{ticket.centerName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Reported By Trainer</span>
                          <strong className="text-slate-800">{ticket.reportedByTrainerName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Logged Timestamp</span>
                          <span className="font-mono text-slate-600">{ticket.createdAt}</span>
                        </div>
                      </div>

                      {/* PO Endorsement or APM Status Notes */}
                      {ticket.poEndorsedAt && (
                        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                          <p className="font-bold">Endorsement Logged:</p>
                          <p className="text-blue-800">Physically audited and endorsed by PO {ticket.poName} at {ticket.poEndorsedAt}</p>
                        </div>
                      )}

                      {ticket.apmResolvedAt && (
                        <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-[11px] text-emerald-950">
                          <p className="font-bold">APM Resolution & Vendor Action:</p>
                          <p className="text-emerald-800">{ticket.resolutionRemarks}</p>
                          <p className="text-[10px] text-emerald-700 font-semibold mt-1">Resolved by {ticket.apmName} at {ticket.apmResolvedAt}</p>
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
                            className="w-full h-32 rounded-xl object-cover border border-slate-200 cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => setInspectPhotoUrl(ticket.photoUrl || null)}
                          />
                          <button
                            type="button"
                            onClick={() => setInspectPhotoUrl(ticket.photoUrl || null)}
                            className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center justify-center gap-1 mx-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Enlarge Image</span>
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

                  {/* Action Controls for PO */}
                  {ticket.status === "Pending PO Verification" && (
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTicketForPoAction(ticket);
                          setRejectTicketReason("");
                          setIsRejectModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-4 h-4 text-rose-500" />
                        <span>Reject / Invalid</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => endorseTicketByPo(ticket.id, currentPersona.name)}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>Endorse Issue (Green Signal)</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* STAFF BIOMETRIC ATTENDANCE LOGS AUDIT BOARD */
        <div className="space-y-6">
          {/* Section Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Live Biometric Audit Desk
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">Shared Store (localStorage: dbs_attendance_logs)</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                Staff Biometric Attendance & Indelible Watermark Audit
              </h2>
              <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
                Every record contains an indelible dark bottom banner watermark burned during hardware camera capture with real-time Timestamp, Lat/Lng coordinates, Accuracy, and Resolved Center Address.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Punches</span>
                <span className="text-sm font-extrabold text-slate-800 font-mono">{attendanceLogs.length}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[10px] text-emerald-700 uppercase font-semibold block">Within Geofence</span>
                <span className="text-sm font-extrabold text-emerald-800 font-mono">
                  {attendanceLogs.filter(p => p.centerProximityStatus === 'Within Center Geofence').length}
                </span>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff name, title, center or address..."
                  value={attendanceSearchQuery}
                  onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Punch Type Filter */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                {(['ALL', 'CHECK_IN', 'CHECK_OUT'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setAttendanceTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      attendanceTypeFilter === type
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {type === 'ALL' ? 'All Types' : type === 'CHECK_IN' ? 'Check-Ins' : 'Check-Outs'}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredAttendanceLogs.length} of {attendanceLogs.length} verified records
            </span>
          </div>

          {/* Attendance Records Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Watermark Proof</th>
                    <th className="py-3.5 px-4">Staff Member</th>
                    <th className="py-3.5 px-4">Punch Type</th>
                    <th className="py-3.5 px-4">Timestamp (Real-time)</th>
                    <th className="py-3.5 px-4">GPS & Geofence Accuracy</th>
                    <th className="py-3.5 px-4">Resolved Address</th>
                    <th className="py-3.5 px-4 text-right">Audit Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendanceLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <Camera className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs font-semibold">No attendance punch logs found matching the filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredAttendanceLogs.map((punch) => {
                      const isCheckIn = punch.type === 'CHECK_IN';
                      return (
                        <tr key={punch.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Photo Thumbnail */}
                          <td className="py-3 px-4">
                            <div
                              onClick={() => setInspectWatermarkPunch(punch)}
                              className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-300 shadow-2xs group cursor-pointer bg-slate-900"
                              title="Click to inspect indelible watermark"
                            >
                              <img
                                src={punch.photoWithWatermark}
                                alt="Selfie proof"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <ZoomIn className="w-4 h-4 text-white" />
                              </div>
                              <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] text-white font-mono text-center truncate px-0.5">
                                WATERMARKED
                              </span>
                            </div>
                          </td>

                          {/* Staff Info */}
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-bold text-slate-900">{punch.employeeName}</p>
                              <p className="text-[11px] text-slate-500">{punch.designation}</p>
                              <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-1 rounded">
                                {punch.employeeId}
                              </span>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isCheckIn
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-orange-100 text-orange-800 border border-orange-200'
                              }`}
                            >
                              {isCheckIn ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              <span>{isCheckIn ? 'Check-In (Duty Start)' : 'Check-Out (Duty End)'}</span>
                            </span>
                          </td>

                          {/* Timestamp */}
                          <td className="py-3 px-4 font-mono">
                            <p className="font-bold text-slate-800">{punch.timeFormatted}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(punch.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </td>

                          {/* GPS & Accuracy */}
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-slate-700">
                                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{punch.lat?.toFixed(5)}, {punch.lng?.toFixed(5)}</span>
                              </div>
                              <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {punch.centerProximityStatus}
                              </span>
                            </div>
                          </td>

                          {/* Resolved Address */}
                          <td className="py-3 px-4 max-w-xs">
                            <p className="text-slate-700 truncate text-[11px]" title={punch.locationAddress}>
                              {punch.locationAddress || activeCenter.address}
                            </p>
                          </td>

                          {/* Inspect Action */}
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setInspectWatermarkPunch(punch)}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Inspect Watermark</span>
                            </button>
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

      {/* PO REJECT TICKET MODAL */}
      {isRejectModalOpen && selectedTicketForPoAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Reject Maintenance Ticket ({selectedTicketForPoAction.id})
              </h3>
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800">{selectedTicketForPoAction.title}</p>
                <p className="text-slate-500 text-[11px] mt-0.5">{selectedTicketForPoAction.description}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Mandatory Rejection Remark <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectTicketReason}
                  onChange={e => setRejectTicketReason(e.target.value)}
                  placeholder="Explain why this issue is not valid or already resolved..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectTicket}
                className="px-4 py-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENLARGE PHOTO MODAL */}
      {inspectPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-4 shadow-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-xs">Photo Proof Inspection</span>
              <button
                onClick={() => setInspectPhotoUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={inspectPhotoUrl}
              alt="Maintenance Proof"
              className="w-full max-h-[70vh] rounded-2xl object-contain bg-slate-900"
            />
          </div>
        </div>
      )}

      {/* Raise Defect Query Modal */}
      {isQueryModalOpen && activeCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Raise Candidate Audit Query
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {activeCandidate.fullName} ({activeCandidate.registrationNumber})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQueryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Defect Category / Flagged Field <span className="text-rose-500">*</span>
                </label>
                <select
                  value={queryField}
                  onChange={(e) => setQueryField(e.target.value as AuditQuery['field'])}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="Name Mismatch">Name Mismatch (Form vs DL/Aadhaar)</option>
                  <option value="DL Front">Driving Licence Front Scan Blurry/Invalid</option>
                  <option value="DL Back">Driving Licence Back Scan Expired/Missing</option>
                  <option value="ID Front">Aadhaar Front Scan Unreadable</option>
                  <option value="ID Back">Aadhaar Back Scan Missing Address</option>
                  <option value="Photo Blurry">Candidate Live Portrait Blurry/Defective</option>
                  <option value="ABHA Mismatch">ABHA Health ID Not Matching Government Format</option>
                  <option value="Other">Other Operational Non-Compliance</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Required Auditor Remark / Instruction <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={queryComment}
                  onChange={(e) => {
                    setQueryComment(e.target.value);
                    setQueryError('');
                  }}
                  placeholder="Specify exact error details for the OSE to correct and re-upload..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
                {queryError && (
                  <span className="text-[11px] text-rose-600 font-bold block mt-1">
                    {queryError}
                  </span>
                )}
              </div>

              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                Submitting this query will immediately transition the candidate to <strong>"Query Raised"</strong> and route the record back to the OSE registration desk.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsQueryModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRaiseQuery}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                Flag & Route to OSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WATERMARK AUDIT INSPECTION MODAL */}
      {inspectWatermarkPunch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-300 flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm leading-tight">
                    Biometric Watermark Verification Audit
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Live hardware camera capture with indelible dark bottom banner watermark
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectWatermarkPunch(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Photo Preview */}
              <div className="relative w-full max-h-[460px] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-700">
                <img
                  src={inspectWatermarkPunch.photoWithWatermark}
                  alt="Watermarked punch proof"
                  className="max-h-[460px] w-auto object-contain mx-auto"
                />
              </div>

              {/* Watermark Verification Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Staff Identity</span>
                  <p className="font-bold text-slate-900 text-sm">{inspectWatermarkPunch.employeeName}</p>
                  <p className="text-slate-600">{inspectWatermarkPunch.designation}</p>
                  <span className="text-xs font-mono text-teal-800 font-semibold">{inspectWatermarkPunch.employeeId}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Punch Timestamp & Duty</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${inspectWatermarkPunch.type === 'CHECK_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                      {inspectWatermarkPunch.type === 'CHECK_IN' ? 'DUTY CHECK-IN' : 'DUTY CHECK-OUT'}
                    </span>
                    <strong className="text-slate-900 font-mono">{inspectWatermarkPunch.timeFormatted}</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">ISO: {inspectWatermarkPunch.timestamp}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">GPS Coordinates & Geofence</span>
                  <p className="font-mono text-emerald-800 font-bold">
                    Lat: {inspectWatermarkPunch.lat?.toFixed(6)}, Lng: {inspectWatermarkPunch.lng?.toFixed(6)}
                  </p>
                  <p className="text-[11px] text-slate-600">Status: {inspectWatermarkPunch.centerProximityStatus}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Resolved Address & Hub</span>
                  <p className="text-slate-800 text-[11px]">{inspectWatermarkPunch.locationAddress || activeCenter.address}</p>
                  <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1">
                    ✓ Verified Indelible Watermark
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectWatermarkPunch(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { PoAuditDesk, AuditInspectionWorkspace };
export default PoDashboard;

