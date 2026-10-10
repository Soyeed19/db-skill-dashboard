import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Search,
  Building2,
  FileSpreadsheet,
  Download,
  Eye,
  Check,
  Video,
  CornerUpLeft,
  Users,
  Layers,
  Filter,
  CheckSquare,
  Square,
  Send,
  X,
  Clock,
  Building
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Candidate } from '../../types';
import { DossierViewerModal } from '../candidates/DossierViewerModal';
import { exportCandidatesToExcel } from '../../utils/excelExporter';
import { smAssignedCenterIds, isCenterAssignedToSM, SM_ASSIGNED_HUBS } from '../../data/hubs';

export interface SeniorManagerConsoleProps {
  initialCenterId?: string;
}

export const SeniorManagerConsole: React.FC<SeniorManagerConsoleProps> = () => {
  const {
    candidates,
    updateCandidate,
    centers,
    currentPersona,
    batches,
    showToast
  } = useApp();

  // 1. Regional Centers Mapping for Senior Manager (Siddharth Nair)
  // Maps all relevant centers across North & West commands (Jodhpur, Jaipur, Mumbai, Pune, etc.)
  const smCenters = useMemo(() => {
    const list = centers.filter(c =>
      smAssignedCenterIds.includes(c.id) ||
      smAssignedCenterIds.includes(c.code) ||
      c.apmName?.toLowerCase().includes('nair') ||
      c.region === 'North' ||
      c.region === 'West'
    );
    return list.length > 0 ? list : centers;
  }, [centers]);

  const smRegion = currentPersona?.region || 'North & West';

  // UI Filter States - Defaults to 'ALL' to view all assigned centers immediately
  const [selectedCenterFilter, setSelectedCenterFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'batch_review' | 'master_ledger'>('batch_review');

  // Modal States
  const [inspectingCandidateId, setInspectingCandidateId] = useState<string | null>(null);
  const [returnModalCandidate, setReturnModalCandidate] = useState<Candidate | null>(null);
  const [returnReason, setReturnReason] = useState<string>('');
  const [returnError, setReturnError] = useState<string>('');

  // Bulk selection state (Candidate IDs)
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  // Pending Reviews queue: Candidates with status PENDING_SM_REVIEW or Green Signal (Video Call) or Approved by PO
  const pendingReviews = useMemo(() => {
    return candidates.filter(candidate => {
      // 1. Must be waiting for SM approval
      const isPendingReview =
        candidate.status === 'PENDING_SM_REVIEW' ||
        candidate.status === 'Green Signal (Video Call)' ||
        candidate.status === 'Approved by PO';

      if (!isPendingReview) return false;

      // 2. Check center match - DO NOT hide candidates due to mismatched regional string tags
      const matchesCenter =
        selectedCenterFilter === 'ALL' ||
        selectedCenterFilter === 'all' ||
        !selectedCenterFilter ||
        candidate.centerId === selectedCenterFilter ||
        centers.find(c => c.id === candidate.centerId)?.code === selectedCenterFilter ||
        smAssignedCenterIds.includes(candidate.centerId) ||
        isCenterAssignedToSM(candidate.centerId);

      if (!matchesCenter) return false;

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = candidate.fullName?.toLowerCase().includes(q);
        const matchReg = candidate.registrationNumber?.toLowerCase().includes(q);
        const matchDl = candidate.dlNumber?.toLowerCase().includes(q);
        const matchAadhaar = candidate.idCardNumber?.includes(q);
        if (!matchName && !matchReg && !matchDl && !matchAadhaar) return false;
      }

      return true;
    });
  }, [candidates, selectedCenterFilter, searchQuery, centers]);

  // Group pending reviews by Center & Batch ID
  const groupedPendingBatches = useMemo(() => {
    const map = new Map<string, { centerName: string; centerCode: string; batchCode: string; items: Candidate[] }>();

    pendingReviews.forEach(cand => {
      const centerObj = centers.find(c => c.id === cand.centerId || c.code === cand.centerId);
      const batchObj = batches.find(b => b.id === cand.batchId);
      const key = `${cand.centerId}__${cand.batchId || 'default'}`;

      if (!map.has(key)) {
        map.set(key, {
          centerName: centerObj?.name || (cand.centerId === 'RJ-01' ? 'Jodhpur Transport Skill Hub' : cand.centerId === 'MH-03' ? 'Mumbai Central Logistics Hub' : 'Regional Hub'),
          centerCode: centerObj?.code || cand.centerId || 'REG',
          batchCode: batchObj?.batchCode || "Today's Foundation Batch",
          items: []
        });
      }
      map.get(key)!.items.push(cand);
    });

    return Array.from(map.values());
  }, [pendingReviews, centers, batches]);

  // Approved Master Candidates
  const approvedMasterCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      const isApproved =
        candidate.status === 'APM_QC_PASSED' ||
        candidate.status === 'Senior Manager QC Passed' ||
        candidate.status === 'APM QC Passed' ||
        candidate.status === 'Certified & Dispatched';

      if (!isApproved) return false;

      const matchesCenter =
        selectedCenterFilter === 'ALL' ||
        selectedCenterFilter === 'all' ||
        !selectedCenterFilter ||
        candidate.centerId === selectedCenterFilter ||
        centers.find(c => c.id === candidate.centerId)?.code === selectedCenterFilter ||
        smAssignedCenterIds.includes(candidate.centerId) ||
        isCenterAssignedToSM(candidate.centerId);

      if (!matchesCenter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = candidate.fullName?.toLowerCase().includes(q);
        const matchReg = candidate.registrationNumber?.toLowerCase().includes(q);
        const matchDl = candidate.dlNumber?.toLowerCase().includes(q);
        if (!matchName && !matchReg && !matchDl) return false;
      }

      return true;
    });
  }, [candidates, selectedCenterFilter, searchQuery, centers]);

  // Handlers
  const handleSmFinalApproval = (candidateIds: string[]) => {
    if (candidateIds.length === 0) return;
    const nowIso = new Date().toISOString();
    const smName = `${currentPersona?.name || 'Siddharth Nair'} (Senior Manager - ${smRegion} Region)`;

    candidateIds.forEach(id => {
      updateCandidate(id, {
        status: 'APM_QC_PASSED',
        currentStage: 'APM_QC_PASSED',
        smApprovedBy: smName,
        smApprovalTimestamp: nowIso,
        apmApprovedBy: smName,
        apmApprovedAt: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
        videoVerificationConfirmed: true
      });
    });

    setSelectedCandidateIds(prev => prev.filter(id => !candidateIds.includes(id)));
    showToast(`✓ Final QC Certification granted for ${candidateIds.length} candidate(s). Pipeline synchronized to GM console.`);
  };

  const handleMarkBatchVideoVerified = (candidateIds: string[]) => {
    if (candidateIds.length === 0) return;
    candidateIds.forEach(id => {
      updateCandidate(id, {
        videoVerificationConfirmed: true
      });
    });
    showToast(`📹 WhatsApp live video call verification logged for ${candidateIds.length} candidate(s).`);
  };

  const handleConfirmReturnToPo = () => {
    if (!returnModalCandidate) return;
    if (!returnReason.trim()) {
      setReturnError('Mandatory remark required for returning candidate to PO queue.');
      return;
    }

    const smName = `${currentPersona?.name || 'Senior Manager'} (${smRegion} Region)`;
    const nowIso = new Date().toISOString();

    updateCandidate(returnModalCandidate.id, {
      status: 'RETURNED_TO_PO',
      rejectionReason: returnReason.trim(),
      poCorrectionRemarks: returnReason.trim(),
      returnedBy: smName,
      returnedAt: nowIso,
      currentStage: 'PENDING_PO_REVIEW'
    });

    setReturnModalCandidate(null);
    setReturnReason('');
    setReturnError('');
    showToast(`Candidate ${returnModalCandidate.fullName} returned to Program Officer queue with query remarks.`);
  };

  const handleToggleSelectAllBatch = (batchCandidates: Candidate[]) => {
    const batchIds = batchCandidates.map(c => c.id);
    const allSelected = batchIds.every(id => selectedCandidateIds.includes(id));

    if (allSelected) {
      setSelectedCandidateIds(prev => prev.filter(id => !batchIds.includes(id)));
    } else {
      setSelectedCandidateIds(prev => Array.from(new Set([...prev, ...batchIds])));
    }
  };

  const handleToggleSelectCandidate = (candidateId: string) => {
    setSelectedCandidateIds(prev =>
      prev.includes(candidateId) ? prev.filter(id => id !== candidateId) : [...prev, candidateId]
    );
  };

  const handleExportApprovedReport = () => {
    if (approvedMasterCandidates.length === 0) {
      showToast(`No QC Approved candidate records found in ${smRegion} Region.`);
      return;
    }

    const firstCenter = smCenters[0] || centers[0];
    const fileName = exportCandidatesToExcel({
      candidates: approvedMasterCandidates,
      center: firstCenter,
      batchCode: `SM-REGIONAL-MASTER`,
      exportedBy: `${currentPersona?.name || 'Siddharth Nair'} (Senior Manager - ${smRegion} QC Command)`,
      filterLabel: `QC Approved Master Ledger — (${smCenters.length} Hubs Under Command)`
    });

    showToast(`Exported ${approvedMasterCandidates.length} QC Approved record(s) to ${fileName}`);
  };

  return (
    <div className="space-y-5 text-slate-800 selection:bg-teal-700 selection:text-white pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-teal-800/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-900/80 border border-teal-700/80 text-teal-300 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Senior Manager (Siddharth Nair) Regional Quality Control Desk</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Senior Manager Regional QC & Batch Certification Console
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl">
            Multi-center secondary audit gatekeeper. Review PO-verified driver batches, execute bulk video verification stamps, return discrepancy records, and grant final QC certification to sync GM command pipeline.
          </p>

          {/* Assigned Centers Display */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
            <span className="font-bold text-teal-300">Assigned Centers:</span>
            <span className="bg-teal-900/90 border border-teal-700/80 px-2 py-0.5 rounded-md font-mono text-[11px] text-teal-100">
              Jodhpur Transport Skill Hub (RJ-01)
            </span>
            <span className="bg-teal-900/90 border border-teal-700/80 px-2 py-0.5 rounded-md font-mono text-[11px] text-teal-100">
              Mumbai Central Logistics Hub (MH-03)
            </span>
            <span className="bg-teal-900/90 border border-teal-700/80 px-2 py-0.5 rounded-md font-mono text-[11px] text-teal-100">
              Jaipur Logistics Training Hub (RJ-02)
            </span>
            <span className="bg-teal-900/90 border border-teal-700/80 px-2 py-0.5 rounded-md font-mono text-[11px] text-teal-100">
              Pune Commercial Transport Academy (MH-01)
            </span>
            {smCenters.length > 4 && (
              <span className="text-teal-400 font-semibold text-[11px] px-1">
                (+{smCenters.length - 4} more hubs under command)
              </span>
            )}
          </div>
        </div>

        {/* Dedicated Export Report Button */}
        <div className="shrink-0 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportApprovedReport}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer border border-emerald-500/50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Export Final Approved Master Report (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* Regional Scoping & Filter Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('batch_review')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'batch_review'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>SM Batch Audit Queue</span>
              {pendingReviews.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950">
                  {pendingReviews.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('master_ledger')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'master_ledger'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>QC Certified Master Ledger</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-100 text-emerald-900 border border-emerald-200">
                {approvedMasterCandidates.length}
              </span>
            </button>
          </div>

          {/* Filters: Center Scope & Search */}
          <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl justify-end">
            <div className="flex items-center gap-1.5 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-200 text-xs text-teal-900 font-semibold">
              <Building2 className="w-3.5 h-3.5 text-teal-700" />
              <span>Assigned Command: <strong>{smCenters.length} Hubs</strong></span>
            </div>

            <select
              value={selectedCenterFilter}
              onChange={e => setSelectedCenterFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-medium focus:outline-teal-700 shadow-2xs"
            >
              <option value="ALL">All My Centers ({smCenters.length} Hubs)</option>
              {smCenters.map(ctr => (
                <option key={ctr.id} value={ctr.id}>
                  {ctr.name} ({ctr.code})
                </option>
              ))}
            </select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search driver name, DL, Reg ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-teal-700 font-medium shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      {activeTab === 'batch_review' && (
        <div className="space-y-6">
          {/* Global Bulk Action Bar for Selected Candidates */}
          {selectedCandidateIds.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                <CheckSquare className="w-4 h-4 text-amber-700" />
                <span>Selected {selectedCandidateIds.length} candidate(s) across batch queue</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleMarkBatchVideoVerified(selectedCandidateIds)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Mark Selected Video Verified</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSmFinalApproval(selectedCandidateIds)}
                  className="px-4 py-1.5 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Final QC Approve Selected ({selectedCandidateIds.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCandidateIds([])}
                  className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-200/60 rounded-xl text-xs font-semibold"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}

          {groupedPendingBatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white border border-slate-200 rounded-2xl text-center shadow-xs">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold mb-3">
                ✓
              </div>
              <h3 className="text-base font-bold text-slate-800">Regional Verification Queue Cleared</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                No candidates currently pending Senior Manager QC review across {smRegion} Region hubs.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                All approved candidates have been synchronized to General Manager command pipeline.
              </p>
            </div>
          ) : (
            groupedPendingBatches.map((batchGroup, groupIdx) => {
              const batchCandIds = batchGroup.items.map(c => c.id);
              const isAllBatchSelected = batchCandIds.length > 0 && batchCandIds.every(id => selectedCandidateIds.includes(id));

              return (
                <div key={groupIdx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
                  {/* Batch Group Header */}
                  <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleSelectAllBatch(batchGroup.items)}
                        className="text-slate-300 hover:text-white transition-colors"
                        title={isAllBatchSelected ? 'Deselect Batch' : 'Select All in Batch'}
                      >
                        {isAllBatchSelected ? (
                          <CheckSquare className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Square className="w-5 h-5 opacity-60" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-teal-300 font-mono">
                            {batchGroup.centerName} ({batchGroup.centerCode})
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                            {batchGroup.batchCode}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {batchGroup.items.length} candidate(s) awaiting Senior Manager secondary QC stamp
                        </p>
                      </div>
                    </div>

                    {/* Batch Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleMarkBatchVideoVerified(batchCandIds)}
                        className="px-3 py-1 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/50 text-[11px] font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Mark Batch Video Verified</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSmFinalApproval(batchCandIds)}
                        className="px-3.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Final Approve Entire Batch ({batchGroup.items.length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Batch Candidate Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-2.5 px-4 w-10 text-center">Select</th>
                          <th className="py-2.5 px-4">Candidate & Aadhaar</th>
                          <th className="py-2.5 px-4">Driving Licence & Class</th>
                          <th className="py-2.5 px-4">PO Clearance Status</th>
                          <th className="py-2.5 px-4">Video Call Stamp</th>
                          <th className="py-2.5 px-4 text-right">Dedicated SM Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80">
                        {batchGroup.items.map(candidate => {
                          const isSelected = selectedCandidateIds.includes(candidate.id);

                          return (
                            <tr key={candidate.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-teal-50/40' : ''}`}>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSelectCandidate(candidate.id)}
                                  className="text-slate-400 hover:text-slate-800"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-teal-700" />
                                  ) : (
                                    <Square className="w-4 h-4 opacity-50" />
                                  )}
                                </button>
                              </td>

                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={candidate.photoUrl || undefined}
                                    alt={candidate.fullName}
                                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                                  />
                                  <div>
                                    <span className="font-extrabold text-slate-900 block leading-tight">{candidate.fullName}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">{candidate.registrationNumber}</span>
                                    <span className="text-[10px] text-slate-400 block font-mono">UIDAI: {candidate.idCardNumber}</span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-4 font-mono">
                                <span className="font-bold text-slate-900 block">{candidate.dlNumber}</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                    {candidate.vehicleClass}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">Exp: {candidate.dlExpiryDate}</span>
                                </div>
                              </td>

                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>PO Approved</span>
                                </span>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  By: {candidate.poApprovedBy || candidate.poReviewer || 'Program Officer'}
                                </span>
                              </td>

                              <td className="py-3 px-4">
                                {candidate.videoVerificationConfirmed ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold">
                                    <Video className="w-3 h-3 text-emerald-700" />
                                    <span>Video Verified</span>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkBatchVideoVerified([candidate.id])}
                                    className="text-[10px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-md border border-teal-200 inline-flex items-center gap-1"
                                  >
                                    <Video className="w-3 h-3 text-teal-600" />
                                    <span>Log Video Call Stamp</span>
                                  </button>
                                )}
                              </td>

                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setInspectingCandidateId(candidate.id)}
                                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                                    title="View Full Archival Dossier"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-slate-600" />
                                    <span>View Full Dossier</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReturnModalCandidate(candidate);
                                      setReturnReason('');
                                      setReturnError('');
                                    }}
                                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Flag candidate back to Program Officer queue"
                                  >
                                    <CornerUpLeft className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Return to PO</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleSmFinalApproval([candidate.id])}
                                    className="px-3 py-1 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Final QC Approve</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: QC Certified Master Ledger Table */}
      {activeTab === 'master_ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
          <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Senior Manager QC Certified Driver Master Ledger ({smRegion} Region)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Terminal QC clearance records synchronized to General Manager command pipeline. Dispatch operations are executed downstream by HQ.
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportApprovedReport}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Regional Master (.xlsx)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Candidate & Reg ID</th>
                  <th className="py-3 px-4">Training Center Hub</th>
                  <th className="py-3 px-4">Commercial DL & Class</th>
                  <th className="py-3 px-4">PO Verification</th>
                  <th className="py-3 px-4">SENIOR MANAGER FINAL CERTIFICATION</th>
                  <th className="py-3 px-4 text-right">Archival Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80">
                {approvedMasterCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">
                      No QC Certified candidate records match the selected filters in {smRegion} Region.
                    </td>
                  </tr>
                ) : (
                  approvedMasterCandidates.map(c => {
                    const centerObj = centers.find(ctr => ctr.id === c.centerId);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={c.photoUrl || undefined}
                              alt={c.fullName}
                              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <span className="font-extrabold text-slate-900 block leading-tight">{c.fullName}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{c.registrationNumber}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">UID: {c.idCardNumber}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 block">{centerObj?.name || c.centerId}</span>
                          <span className="text-[10px] font-mono text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                            {centerObj?.code || 'REG'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <span className="font-bold text-slate-900 block">{c.dlNumber}</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {c.vehicleClass}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">Exp: {c.dlExpiryDate}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>PO Approved</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {c.poApprovedBy || c.poReviewer || 'Program Officer'}
                          </span>
                        </td>

                        {/* Strict Read-Only Certification Badge — No Dispatch Action Buttons */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xs bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>✓ QC Certified</span>
                          </span>
                          {c.smApprovedBy && (
                            <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                              Approved by: {c.smApprovedBy}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setInspectingCandidateId(c.id)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 inline-flex items-center gap-1 transition-colors text-xs font-bold"
                            title="Inspect Archival Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
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
      )}

      {/* Return to PO Modal */}
      {returnModalCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
                <CornerUpLeft className="w-4 h-4 text-rose-600" />
                <span>Return Candidate Record to Program Officer (PO)</span>
              </div>
              <button
                type="button"
                onClick={() => setReturnModalCandidate(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
              <p className="font-bold text-slate-900">{returnModalCandidate.fullName}</p>
              <p className="text-[11px] text-slate-500 font-mono">{returnModalCandidate.registrationNumber} • DL: {returnModalCandidate.dlNumber}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 block">
                Discrepancy / Return Remark *
              </label>
              <textarea
                rows={3}
                value={returnReason}
                onChange={e => {
                  setReturnReason(e.target.value);
                  if (e.target.value.trim()) setReturnError('');
                }}
                placeholder="Describe reason for returning candidate (e.g., DL back scan illegible, vehicle endorsement mismatch)..."
                className="w-full text-xs p-3 bg-white border border-slate-300 rounded-2xl focus:outline-teal-700 font-medium"
              />
              {returnError && <p className="text-[11px] font-bold text-rose-600">{returnError}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReturnModalCandidate(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmReturnToPo}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm Return to PO</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Dossier Inspector Modal */}
      {inspectingCandidateId && (
        <DossierViewerModal
          isOpen={Boolean(inspectingCandidateId)}
          candidateId={inspectingCandidateId}
          onClose={() => setInspectingCandidateId(null)}
        />
      )}
    </div>
  );
};

export default SeniorManagerConsole;
