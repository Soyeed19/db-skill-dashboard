import React, { useState, useMemo } from 'react';
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

export const PoDashboard: React.FC = () => {
  const {
    candidates,
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
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

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
      if (statusFilter === 'PENDING' && c.status !== 'Pending PO Review') return false;
      if (statusFilter === 'QUERIES' && c.status !== 'Query Raised') return false;
      if (statusFilter === 'GREEN_SIGNAL' && c.status !== 'Green Signal (Video Call)') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.fullName.toLowerCase().includes(q);
        const matchReg = c.registrationNumber.toLowerCase().includes(q);
        const matchDl = c.dlNumber.toLowerCase().includes(q);
        const matchAadhaar = c.idCardNumber.includes(q);
        if (!matchName && !matchReg && !matchDl && !matchAadhaar) return false;
      }

      return true;
    });
  }, [candidates, filterCenterId, statusFilter, searchQuery]);

  // Current active candidate in split-view
  const activeCandidate = useMemo(() => {
    if (selectedCandidateId) {
      const found = candidates.find(c => c.id === selectedCandidateId);
      if (found) return found;
    }
    return poCandidates[0] || candidates[0] || null;
  }, [selectedCandidateId, candidates, poCandidates]);

  // Counters for Metric Badges
  const pendingCount = candidates.filter(c => c.status === 'Pending PO Review').length;
  const queriesCount = candidates.filter(c => c.status === 'Query Raised').length;
  const greenSignalCount = candidates.filter(c => c.status === 'Green Signal (Video Call)').length;
  const totalInQueue = candidates.length;

  // Image zoom controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  // Trigger Approve / Green Signal
  const handleApproveGreenSignal = () => {
    if (!activeCandidate) return;
    grantGreenSignal(activeCandidate.id);
  };

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
        <>
          {/* Top Banner: PO Audit Desk */}
      <div className="bg-gradient-to-r from-dbs-green-dark via-dbs-green to-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dbs-growth/20 border border-dbs-growth/30 text-emerald-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Program Officer (PO - Level 3) Compliance & Audit Desk
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Real-Time Candidate Verification Split-View
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 max-w-2xl">
              Inspect candidate enrollment forms side-by-side against uploaded ID cards and Driving Licence scans. Grant the official <strong>Green Signal</strong> to route records to the APM queue or <strong>Raise Queries</strong> back to the OSE.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/15 text-xs text-white">
              <span className="text-white/60 block text-[10px] font-bold uppercase tracking-wider">Assigned Auditor</span>
              <span className="font-extrabold">{currentPersona.name}</span>
              <span className="text-emerald-300 font-mono text-[11px] block">{currentPersona.title}</span>
            </div>
          </div>
        </div>

        {/* Audit Queue Metrics Ribbon */}
        <div className="mt-5 pt-4 border-t border-teal-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('PENDING')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              statusFilter === 'PENDING'
                ? 'bg-amber-500/20 border-amber-400 text-white ring-2 ring-amber-400/40'
                : 'bg-white/5 border-white/10 text-teal-100 hover:bg-white/10'
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 block">Pending PO Review</span>
            <span className="text-xl font-extrabold">{pendingCount}</span>
            <span className="text-[10px] block opacity-80">Awaiting side-by-side audit</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('QUERIES')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              statusFilter === 'QUERIES'
                ? 'bg-rose-500/20 border-rose-400 text-white ring-2 ring-rose-400/40'
                : 'bg-white/5 border-white/10 text-teal-100 hover:bg-white/10'
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-300 block">Queries Raised</span>
            <span className="text-xl font-extrabold">{queriesCount}</span>
            <span className="text-[10px] block opacity-80">Routed back to OSE</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('GREEN_SIGNAL')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              statusFilter === 'GREEN_SIGNAL'
                ? 'bg-emerald-500/20 border-emerald-400 text-white ring-2 ring-emerald-400/40'
                : 'bg-white/5 border-white/10 text-teal-100 hover:bg-white/10'
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block">Green Signal Passed</span>
            <span className="text-xl font-extrabold">{greenSignalCount}</span>
            <span className="text-[10px] block opacity-80">Advanced to APM Queue</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`p-3 rounded-2xl border text-left transition-all ${
              statusFilter === 'ALL'
                ? 'bg-teal-500/20 border-teal-400 text-white ring-2 ring-teal-400/40'
                : 'bg-white/5 border-white/10 text-teal-100 hover:bg-white/10'
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider text-teal-200 block">Total In Registry</span>
            <span className="text-xl font-extrabold">{totalInQueue}</span>
            <span className="text-[10px] block opacity-80">Across regional hubs</span>
          </button>
        </div>
      </div>

      {/* Main Split-View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Candidate Queue List (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
            {/* Search and Center Scoping Filter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Verification Queue ({poCandidates.length})
                </span>
                <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  PO Live Audit
                </span>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Name, Reg #, DL, Aadhaar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-700/20"
                />
              </div>

              {/* Regional Center Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={filterCenterId}
                  onChange={(e) => setFilterCenterId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none"
                >
                  <option value="all">All Regional Centers</option>
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Candidate Cards List */}
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {poCandidates.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                  No candidates found in this queue state.
                </div>
              ) : (
                poCandidates.map(c => {
                  const isSelected = activeCandidate?.id === c.id;
                  const hasOpenQueries = c.queries.some(q => q.status === 'Open');

                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedCandidateId(c.id);
                        handleResetZoom();
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-teal-50/80 border-teal-500 shadow-sm ring-2 ring-teal-500/20'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={c.photoUrl}
                            alt={c.fullName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div>
                            <h4 className="font-extrabold text-slate-900 leading-tight">{c.fullName}</h4>
                            <span className="font-mono text-[10px] text-slate-500">{c.registrationNumber}</span>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-600 mt-0.5">
                              <span className="font-bold text-teal-900">{c.vehicleClass}</span>
                              <span>•</span>
                              <span>DL: {c.dlNumber}</span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${
                            c.status === 'Pending PO Review'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : c.status === 'Query Raised'
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : c.status === 'Green Signal (Video Call)'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>

                      {hasOpenQueries && (
                        <div className="mt-2 pt-1.5 border-t border-rose-100 flex items-center gap-1.5 text-[10px] text-rose-700 font-semibold">
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>{c.queries.filter(q => q.status === 'Open').length} Open Query: {c.queries[0]?.field}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Columns: Side-by-Side Split View Verification Workbench (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          {activeCandidate ? (
            <div className="space-y-4">
              {/* Active Candidate Action Header */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                      Audit Inspection Workspace
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-xs text-slate-500">{activeCandidate.registrationNumber}</span>
                  </div>
                  <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                    {activeCandidate.fullName} (S/O {activeCandidate.fatherName})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ingestion Method: <strong className="text-teal-900">{activeCandidate.aadhaarIngestionMethod || '3-Way Ingestion'}</strong>
                  </p>
                </div>

                {/* Primary Action Controls: Approve Green Signal vs Raise Query */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenQueryModal}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Raise Query</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApproveGreenSignal}
                    disabled={activeCandidate.status === 'Green Signal (Video Call)' || activeCandidate.status === 'APM QC Passed'}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all ${
                      activeCandidate.status === 'Green Signal (Video Call)' || activeCandidate.status === 'APM QC Passed'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>
                      {activeCandidate.status === 'Green Signal (Video Call)'
                        ? 'Green Signal Active'
                        : 'Approve / Green Signal'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Side-by-Side Comparison Container */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Side: Structured Form Data */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-teal-700" />
                      <h3 className="font-extrabold text-slate-900 text-sm">
                        1. Form Enrollment Data
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                      {activeCandidate.vehicleClass}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Personal & Demographics
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Candidate Full Name:</span>
                          <span className="font-bold text-slate-900">{activeCandidate.fullName}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Father's Name:</span>
                          <span className="font-bold text-slate-900">{activeCandidate.fatherName}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Mother's Name:</span>
                          <span className="font-bold text-slate-900">{activeCandidate.motherName || 'Verified'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Date of Birth (DOB):</span>
                          <span className="font-bold font-mono text-slate-900">{activeCandidate.dateOfBirth}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Gender & Status:</span>
                          <span className="font-bold text-slate-900">{activeCandidate.gender} • {activeCandidate.maritalStatus || 'Married'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Religion & Caste:</span>
                          <span className="font-bold text-slate-900">{activeCandidate.religion || 'Hindu'} ({activeCandidate.casteCategory || 'OBC'})</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-teal-50/50 p-3 rounded-2xl border border-teal-100 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                        Government Identity & Driving Licence
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Govt ID / Aadhaar:</span>
                          <span className="font-mono font-bold text-teal-950">{activeCandidate.idCardNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">ABHA Health ID:</span>
                          <span className="font-mono font-bold text-teal-950">{activeCandidate.abhaNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">Driving Licence No:</span>
                          <span className="font-mono font-bold text-emerald-900">{activeCandidate.dlNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[11px]">DL Expiry Date:</span>
                          <span className="font-mono font-bold text-slate-900">{activeCandidate.dlExpiryDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Contact & Permanent Residential Address
                      </span>
                      <p className="text-slate-700 leading-snug">{activeCandidate.address}, {activeCandidate.city}, {activeCandidate.state} - {activeCandidate.pincode}</p>
                      <div className="flex items-center gap-1.5 text-slate-600 pt-1 font-mono">
                        <Phone className="w-3 h-3 text-teal-700" />
                        <span>{activeCandidate.mobileNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Audit Queries Log on this candidate */}
                  {activeCandidate.queries && activeCandidate.queries.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Audit Remarks & Queries History
                      </span>
                      <div className="space-y-1.5">
                        {activeCandidate.queries.map(q => (
                          <div
                            key={q.id}
                            className={`p-2 rounded-xl text-[11px] border ${
                              q.status === 'Open'
                                ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                            }`}
                          >
                            <div className="flex items-center justify-between font-bold">
                              <span>{q.field} ({q.status})</span>
                              <span className="text-[10px] font-mono">{q.createdAt}</span>
                            </div>
                            <p className="mt-0.5">{q.comment}</p>
                            {q.resolutionComment && (
                              <p className="mt-1 pt-1 border-t border-emerald-200 text-emerald-800 text-[10px]">
                                <strong>OSE Resolution:</strong> {q.resolutionComment}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side: Uploaded ID & Driving Licence Scans */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-emerald-700" />
                        <h3 className="font-extrabold text-slate-900 text-sm">
                          2. Uploaded Document Scans
                        </h3>
                      </div>

                      {/* Image Viewer Toolbar */}
                      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={handleZoomIn}
                          className="p-1 text-slate-600 hover:text-slate-900"
                          title="Zoom In"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleZoomOut}
                          className="p-1 text-slate-600 hover:text-slate-900"
                          title="Zoom Out"
                        >
                          <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRotate}
                          className="p-1 text-slate-600 hover:text-slate-900"
                          title="Rotate 90 degrees"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleResetZoom}
                          className="px-1.5 py-0.5 text-[10px] font-mono text-slate-600 hover:text-slate-900"
                          title="Reset"
                        >
                          {Math.round(zoomLevel * 100)}%
                        </button>
                      </div>
                    </div>

                    {/* Document Selector Tabs */}
                    <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDocTab('id_front');
                          handleResetZoom();
                        }}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          activeDocTab === 'id_front'
                            ? 'bg-teal-800 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Aadhaar Front
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDocTab('id_back');
                          handleResetZoom();
                        }}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          activeDocTab === 'id_back'
                            ? 'bg-teal-800 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Aadhaar Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDocTab('dl_front');
                          handleResetZoom();
                        }}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          activeDocTab === 'dl_front'
                            ? 'bg-teal-800 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        DL Front
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDocTab('dl_back');
                          handleResetZoom();
                        }}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          activeDocTab === 'dl_back'
                            ? 'bg-teal-800 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        DL Back
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveDocTab('photo');
                          handleResetZoom();
                        }}
                        className={`px-2.5 py-1 rounded-lg transition-all ${
                          activeDocTab === 'photo'
                            ? 'bg-teal-800 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        Live Photo
                      </button>
                    </div>

                    {/* Scan Display Canvas with Zoom & Rotate */}
                    <div className="relative border border-slate-200 rounded-2xl bg-slate-900/5 min-h-[340px] max-h-[420px] flex items-center justify-center overflow-hidden p-2">
                      {currentScanUrl ? (
                        <div
                          style={{
                            transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                            transition: 'transform 0.15s ease-out'
                          }}
                          className="max-w-full max-h-[380px] flex items-center justify-center"
                        >
                          <img
                            src={currentScanUrl}
                            alt="Document Scan"
                            className="max-h-[360px] w-auto object-contain rounded-xl shadow-md border border-slate-300 bg-white"
                          />
                        </div>
                      ) : (
                        <div className="text-center p-8 text-slate-400 text-xs">
                          <Eye className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          Document scan preview unavailable for this field.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Audit Checklist Guidance */}
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-[11px] text-emerald-950 space-y-1">
                    <span className="font-extrabold flex items-center gap-1.5 text-emerald-900">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      PO Inspection Verification Checklist
                    </span>
                    <p className="text-emerald-800">
                      Verify candidate spelling matches the DL card, vehicle class authorization is valid for commercial transport, and DOB agrees with Aadhaar.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 space-y-3 shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Queue is Clear</h3>
              <p className="text-xs text-slate-500">
                All candidates in this regional scope have been reviewed. Select another center or filter from the left list.
              </p>
            </div>
          )}
        </div>
      </div>

        </>
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
