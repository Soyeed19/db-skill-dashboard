import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Building,
  Wrench,
  Camera,
  Layers,
  CornerUpLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Candidate, AuditQuery } from '../../types';
import { AuditInspectionWorkspace } from './AuditInspectionWorkspace';

export interface PoAuditDeskProps {
  initialCenterId?: string;
}

export const PoAuditDesk: React.FC<PoAuditDeskProps> = ({ initialCenterId }) => {
  const {
    candidates,
    updateCandidate,
    centers,
    currentPersona,
    raiseAuditQuery,
    showToast,
    maintenanceTickets,
    attendanceLogs
  } = useApp();

  const currentUser = currentPersona || { name: 'Program Officer', role: 'PO' };
  const roleStr = String(currentUser.role || '');
  const isSeniorManager =
    roleStr === 'Senior Manager' ||
    roleStr === 'SENIOR_MANAGER' ||
    roleStr === 'APM';

  // Status Filter
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'QUERIES' | 'GREEN_SIGNAL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCenterId, setFilterCenterId] = useState<string>(initialCenterId || 'all');

  // Selected candidate state
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Active Queue filtered by center, status, search, and dynamic persona role
  const queue = useMemo(() => {
    return candidates.filter(c => {
      // Center scoping filter
      if (filterCenterId !== 'all' && c.centerId !== filterCenterId) return false;

      // Status filter dynamically routed by role:
      // Senior Manager reviews candidates approved by PO (PENDING_SM_REVIEW / Green Signal)
      // Program Officer reviews raw candidate intake (PENDING_PO_REVIEW / Pending PO Review)
      if (isSeniorManager) {
        if (statusFilter === 'PENDING') {
          const isPendingSm =
            c.status === 'PENDING_SM_REVIEW' ||
            c.status === 'Green Signal (Video Call)' ||
            c.status === 'Approved by PO';
          if (!isPendingSm) return false;
        } else if (statusFilter === 'QUERIES') {
          if (c.status !== 'RETURNED_TO_PO' && c.status !== 'Query Raised') return false;
        } else if (statusFilter === 'GREEN_SIGNAL') {
          const isQcPassed =
            c.status === 'APM_QC_PASSED' ||
            c.status === 'Senior Manager QC Passed' ||
            c.status === 'APM QC Passed' ||
            c.status === 'Certified & Dispatched';
          if (!isQcPassed) return false;
        }
      } else {
        // Program Officer mode
        if (
          statusFilter === 'PENDING' &&
          c.status !== 'Pending PO Review' &&
          (c.status as any) !== 'PENDING_PO_REVIEW'
        ) {
          return false;
        }
        if (statusFilter === 'QUERIES' && c.status !== 'Query Raised' && c.status !== 'RETURNED_TO_PO') {
          return false;
        }
        if (
          statusFilter === 'GREEN_SIGNAL' &&
          c.status !== 'Green Signal (Video Call)' &&
          (c.status as any) !== 'PENDING_SM_REVIEW' &&
          (c.status as any) !== 'Approved by PO' &&
          c.status !== 'APM_QC_PASSED' &&
          c.status !== 'Senior Manager QC Passed'
        ) {
          return false;
        }
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
  }, [candidates, filterCenterId, statusFilter, searchQuery, isSeniorManager]);

  // Synchronize selection: If queue is empty or selected candidate is no longer in queue, reset or pick first
  useEffect(() => {
    if (queue.length === 0) {
      if (selectedCandidate !== null) {
        setSelectedCandidate(null);
      }
    } else if (!selectedCandidate || !queue.some(item => item.id === selectedCandidate.id)) {
      setSelectedCandidate(queue[0]);
    }
  }, [queue, selectedCandidate]);

  // PO Workflow Handover to Senior Manager
  const handleApproveGreenSignal = (candidateId: string) => {
    const timestamp = new Date().toISOString();

    // 1. Candidate status update to PENDING_SM_REVIEW
    updateCandidate(candidateId, {
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
    const updatedQueue = queue.filter(item => item.id !== candidateId);

    // 3. Selection reset logic
    if (updatedQueue.length > 0) {
      setSelectedCandidate(updatedQueue[0]);
    } else {
      setSelectedCandidate(null);
    }

    showToast('Candidate approved by PO and forwarded to Senior Manager for final QC approval.');
  };

  // Senior Manager Final QC Approval
  const handleSmFinalApproval = (candidateId: string) => {
    const timestamp = new Date().toISOString();
    const smName = `${currentUser.name} (Senior Manager)`;

    updateCandidate(candidateId, {
      status: 'APM_QC_PASSED',
      currentStage: 'APM_QC_PASSED',
      smApprovedBy: smName,
      smApprovalTimestamp: timestamp,
      apmApprovedBy: smName,
      apmApprovedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
      videoVerificationConfirmed: true
    });

    const updatedQueue = queue.filter(item => item.id !== candidateId);
    if (updatedQueue.length > 0) {
      setSelectedCandidate(updatedQueue[0]);
    } else {
      setSelectedCandidate(null);
    }

    showToast('✓ Final QC Certification granted by Senior Manager. Pipeline synchronized to GM console.');
  };

  // Senior Manager Return to PO with Remarks
  const handleReturnToPo = (candidateId: string, remarks: string) => {
    const timestamp = new Date().toISOString();
    const smName = `${currentUser.name} (Senior Manager)`;

    updateCandidate(candidateId, {
      status: 'RETURNED_TO_PO',
      rejectionReason: remarks,
      poCorrectionRemarks: remarks,
      returnedBy: smName,
      returnedAt: timestamp,
      currentStage: 'PENDING_PO_REVIEW'
    });

    const updatedQueue = queue.filter(item => item.id !== candidateId);
    if (updatedQueue.length > 0) {
      setSelectedCandidate(updatedQueue[0]);
    } else {
      setSelectedCandidate(null);
    }

    showToast('Candidate returned to Program Officer queue with correction remarks.');
  };

  // Counters for Metric Badges
  const pendingCount = useMemo(() => {
    if (isSeniorManager) {
      return candidates.filter(
        c =>
          c.status === 'PENDING_SM_REVIEW' ||
          c.status === 'Green Signal (Video Call)' ||
          c.status === 'Approved by PO'
      ).length;
    }
    return candidates.filter(
      c => c.status === 'Pending PO Review' || (c.status as any) === 'PENDING_PO_REVIEW'
    ).length;
  }, [candidates, isSeniorManager]);

  const queriesCount = useMemo(() => {
    return candidates.filter(
      c => c.status === 'Query Raised' || c.status === 'RETURNED_TO_PO'
    ).length;
  }, [candidates]);

  const greenSignalCount = useMemo(() => {
    if (isSeniorManager) {
      return candidates.filter(
        c =>
          c.status === 'APM_QC_PASSED' ||
          c.status === 'Senior Manager QC Passed' ||
          c.status === 'APM QC Passed' ||
          c.status === 'Certified & Dispatched'
      ).length;
    }
    return candidates.filter(
      c =>
        c.status === 'Green Signal (Video Call)' ||
        (c.status as any) === 'PENDING_SM_REVIEW' ||
        (c.status as any) === 'Approved by PO' ||
        c.status === 'APM_QC_PASSED' ||
        c.status === 'Senior Manager QC Passed'
    ).length;
  }, [candidates, isSeniorManager]);

  const totalInQueue = candidates.length;

  return (
    <div className="space-y-6">
      {/* Top Banner: Dynamically tuned for Senior Manager vs PO */}
      <div className="bg-gradient-to-r from-[#007A3D] via-[#005A2D] to-slate-900 text-white rounded-3xl p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {isSeniorManager
                ? 'Senior Manager (SM - Level 4) Regional QC & Audit Desk'
                : 'Program Officer (PO - Level 3) Compliance & Audit Desk'}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {isSeniorManager
                ? 'Regional Candidate Verification & QC Certification Split-View'
                : 'Real-Time Candidate Verification Split-View'}
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 max-w-2xl">
              {isSeniorManager
                ? 'Inspect PO-audited candidate enrollment forms and document scans side-by-side. Grant official Final QC Certification to sync General Manager pipeline or Return to PO with corrective remarks.'
                : 'Inspect candidate enrollment forms side-by-side against uploaded ID cards and Driving Licence scans. Grant the official Green Signal to forward records to Senior Manager or Raise Queries back to the OSE.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/15 text-xs text-white">
              <span className="text-white/60 block text-[10px] font-bold uppercase tracking-wider">
                {isSeniorManager ? 'Senior QC Auditor' : 'Assigned Auditor'}
              </span>
              <span className="font-extrabold">{currentUser.name}</span>
              <span className="text-emerald-300 font-mono text-[11px] block">{currentUser.role || (isSeniorManager ? 'Senior Manager' : 'PO')}</span>
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
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 block">
              {isSeniorManager ? 'Pending SM Review' : 'Pending PO Review'}
            </span>
            <span className="text-xl font-extrabold">{pendingCount}</span>
            <span className="text-[10px] block opacity-80">
              {isSeniorManager ? 'Awaiting secondary QC stamp' : 'Awaiting side-by-side audit'}
            </span>
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
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-300 block">
              {isSeniorManager ? 'Discrepancies / Returned' : 'Queries Raised'}
            </span>
            <span className="text-xl font-extrabold">{queriesCount}</span>
            <span className="text-[10px] block opacity-80">
              {isSeniorManager ? 'Returned to PO or flagged' : 'Routed back to OSE'}
            </span>
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
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block">
              {isSeniorManager ? 'QC Passed & Certified' : 'Forwarded to SM'}
            </span>
            <span className="text-xl font-extrabold">{greenSignalCount}</span>
            <span className="text-[10px] block opacity-80">
              {isSeniorManager ? 'Synchronized to GM Pipeline' : 'Senior Manager QC Queue'}
            </span>
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
                  {isSeniorManager ? `SM Verification Queue (${queue.length})` : `PO Verification Queue (${queue.length})`}
                </span>
                <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                  {isSeniorManager ? 'SM Secondary QC' : 'PO Live Audit'}
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
                  <option value="all">
                    {isSeniorManager ? 'All Regional Centers Under Command' : 'All Regional Centers'}
                  </option>
                  {centers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Candidate Cards List */}
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {queue.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-60" />
                  <p className="font-semibold text-slate-600">No candidates in this queue state.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isSeniorManager
                      ? 'Candidates approved by PO will appear here for Senior Manager QC verification.'
                      : 'Candidates submitted by OSE will appear here for PO verification.'}
                  </p>
                </div>
              ) : (
                queue.map(c => {
                  const isSelected = selectedCandidate?.id === c.id;
                  const hasOpenQueries = c.queries?.some(q => q.status === 'Open');
                  const isReturned = c.status === 'RETURNED_TO_PO';

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCandidate(c)}
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
                            c.status === 'Pending PO Review' || (c.status as any) === 'PENDING_PO_REVIEW'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : isReturned
                              ? 'bg-amber-100 text-amber-950 border border-amber-400 font-extrabold'
                              : c.status === 'Query Raised'
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : (c.status as any) === 'PENDING_SM_REVIEW' || c.status === 'Green Signal (Video Call)' || (c.status as any) === 'Approved by PO'
                              ? 'bg-teal-100 text-teal-950 border border-teal-300'
                              : c.status === 'APM_QC_PASSED' || c.status === 'Senior Manager QC Passed' || c.status === 'APM QC Passed'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {(c.status as any) === 'PENDING_SM_REVIEW'
                            ? 'Pending SM Review'
                            : isReturned
                            ? 'Returned to PO'
                            : c.status === 'APM_QC_PASSED'
                            ? 'QC Passed'
                            : c.status}
                        </span>
                      </div>

                      {hasOpenQueries && (
                        <div className="mt-2 pt-1.5 border-t border-rose-100 flex items-center gap-1.5 text-[10px] text-rose-700 font-semibold">
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>
                            {c.queries.filter(q => q.status === 'Open').length} Open Query: {c.queries[0]?.field}
                          </span>
                        </div>
                      )}

                      {isReturned && (
                        <div className="mt-2 pt-1.5 border-t border-amber-200 flex items-center gap-1.5 text-[10px] text-amber-800 font-medium">
                          <CornerUpLeft className="w-3 h-3 text-amber-700 shrink-0" />
                          <span className="truncate">Correction needed: {c.poCorrectionRemarks || c.rejectionReason}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Inspection Workspace or Clean Empty State */}
        <div className="lg:col-span-8 space-y-4">
          {selectedCandidate && queue.length > 0 ? (
            <AuditInspectionWorkspace
              candidate={selectedCandidate}
              onApproveGreenSignal={handleApproveGreenSignal}
              onRaiseQuery={(id, field, comment) => raiseAuditQuery(id, field, comment)}
              reviewerName={currentUser.name}
              isSeniorManager={isSeniorManager}
              onSmFinalApproval={handleSmFinalApproval}
              onReturnToPo={handleReturnToPo}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200 rounded-xs min-h-[480px] text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold mb-3">
                ✓
              </div>
              <h3 className="text-base font-bold text-slate-800">All Queue Items Processed</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                {isSeniorManager
                  ? 'No candidates currently pending Senior Manager QC review.'
                  : 'No candidates currently pending PO verification for this center.'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {isSeniorManager
                  ? 'All PO-approved candidates have been processed and certified for the General Manager command pipeline.'
                  : 'All candidates have been processed and forwarded to Senior Manager for final QC approval.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoAuditDesk;
