import React, { useState, useMemo } from 'react';
import {
  Search,
  FileDown,
  Award,
  ShieldCheck,
  CheckCircle,
  Eye,
  Filter,
  Share2,
  Building,
  Target,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Candidate, CandidateStatus } from '../../types';
import { DossierViewerModal } from './DossierViewerModal';
import { WhatsAppSummaryModal } from '../common/WhatsAppSummaryModal';
import {
  generateCandidateDossierPdf,
  generateTrainingCertificatePdf
} from '../../utils/pdfGenerator';
import { exportCandidatesToExcel } from '../../utils/excelExporter';

export const CandidateList: React.FC = () => {
  const {
    candidates,
    activeCenter,
    centers,
    currentPersona,
    grantGreenSignal,
    approveApmQc,
    dispatchCandidate,
    batches,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportToExcel = () => {
    try {
      setIsExporting(true);
      const candidatesToExport = filteredCandidates.length > 0
        ? filteredCandidates
        : candidates.filter(c => c.centerId === activeCenter.id);

      if (candidatesToExport.length === 0) {
        showToast('No candidates available to export for this center.');
        return;
      }

      const activeBatchCode = todayBatch?.batchCode || 'DBS-BATCH-ALL';
      const fileName = exportCandidatesToExcel({
        candidates: candidatesToExport,
        center: activeCenter,
        batchCode: activeBatchCode,
        exportedBy: `${currentPersona.name} (${currentPersona.role} - ${currentPersona.level})`,
        filterLabel: statusFilter !== 'All' || searchQuery ? `Filtered: ${statusFilter}${searchQuery ? ` / Search: "${searchQuery}"` : ''}` : 'All Active Center Trainees'
      });

      showToast(`Exported ${candidatesToExport.length} candidate(s) to Excel: ${fileName}`);
    } catch (err) {
      console.error('Failed to export candidates to Excel:', err);
      showToast('Error exporting candidate list to Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  const [selectedCenterFilter, setSelectedCenterFilter] = useState<string>('all');

  // Candidate pool scoped by role
  const centerScopedCandidates = useMemo(() => {
    if (currentPersona.role === 'GM' || currentPersona.role === 'Senior Manager') {
      return selectedCenterFilter === 'all'
        ? candidates
        : candidates.filter(c => c.centerId === selectedCenterFilter);
    }
    return candidates.filter(c => c.centerId === activeCenter.id);
  }, [candidates, currentPersona.role, selectedCenterFilter, activeCenter.id]);

  const isApmQcPassedStatus = (s: string) =>
    s === 'APM_QC_PASSED' || s === 'APM QC Passed' || s === 'Senior Manager QC Passed';

  // Filter candidates by search and status
  const filteredCandidates = useMemo(() => {
    return centerScopedCandidates.filter(c => {
      const matchesSearch =
        c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.dlNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.idCardNumber.includes(searchQuery) ||
        c.mobileNumber.includes(searchQuery);

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Pending PO Review'
          ? (c.status === 'Pending PO Review' || (c.status as any) === 'PENDING_PO_REVIEW')
          : statusFilter === 'Green Signal (Video Call)'
          ? (c.status === 'Green Signal (Video Call)' || (c.status as any) === 'PENDING_SM_REVIEW' || (c.status as any) === 'Approved by PO')
          : statusFilter === 'APM QC Passed'
          ? isApmQcPassedStatus(c.status)
          : c.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [centerScopedCandidates, searchQuery, statusFilter]);

  const statuses: { label: string; value: string; count: number }[] = [
    { label: 'All Candidates', value: 'All', count: centerScopedCandidates.length },
    {
      label: 'Pending PO Review',
      value: 'Pending PO Review',
      count: centerScopedCandidates.filter(c => c.status === 'Pending PO Review' || (c.status as any) === 'PENDING_PO_REVIEW').length
    },
    { label: 'Query Raised', value: 'Query Raised', count: centerScopedCandidates.filter(c => c.status === 'Query Raised').length },
    {
      label: 'Green Signal (Video Call)',
      value: 'Green Signal (Video Call)',
      count: centerScopedCandidates.filter(c => c.status === 'Green Signal (Video Call)' || (c.status as any) === 'PENDING_SM_REVIEW' || (c.status as any) === 'Approved by PO').length
    },
    { label: 'APM QC Passed', value: 'APM QC Passed', count: centerScopedCandidates.filter(c => isApmQcPassedStatus(c.status)).length },
    { label: 'Certified & Dispatched', value: 'Certified & Dispatched', count: centerScopedCandidates.filter(c => c.status === 'Certified & Dispatched').length }
  ];

  // Daily target calculation for OSE
  const todayBatch = batches.find(b => b.centerId === activeCenter.id);
  const dailyTarget = todayBatch?.targetCount || 30;
  const dailyEnrolled = filteredCandidates.length;
  const targetPct = Math.min(100, Math.round((dailyEnrolled / dailyTarget) * 100));

  const getStatusBadge = (status: CandidateStatus) => {
    switch (status) {
      case 'Pending Scan':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Pending PO Review':
        return 'bg-[#E0F2FE] text-[#0284C7] border-[#00AEEF]/40 font-medium';
      case 'Query Raised':
        return 'bg-[#FFF7ED] text-[#C2410C] border-[#F15A24]/40 font-bold';
      case 'Green Signal (Video Call)':
        return 'bg-[#E6F4EA] text-[#005C2E] border-[#007A3D]/40 font-semibold';
      case 'APM QC Passed':
        return 'bg-[#DCFCE7] text-[#15803D] border-[#62B548]/40 font-semibold';
      case 'Certified & Dispatched':
        return 'bg-[#007A3D] text-white border-[#005C2E] font-bold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Target Progress Bar Card (OSE & Operations focus) */}
      <div className="bg-white border border-slate-300 rounded-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#E6F4EA] rounded-xs border border-[#007A3D]/30 text-[#007A3D]">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#007A3D]">
                Daily Enrollment Metric
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-mono">{activeCenter.name}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {dailyEnrolled} of {dailyTarget} Candidates Registered Today ({targetPct}%)
            </h3>
          </div>
        </div>

        <div className="flex-1 max-w-md">
          <div className="w-full bg-slate-100 rounded-xs h-2.5 overflow-hidden border border-slate-300">
            <div
              className="bg-[#007A3D] h-full rounded-xs transition-all duration-300"
              style={{ width: `${targetPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>Minimum Batch Target: 25</span>
            <span>Capacity Ceiling: {dailyTarget}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportToExcel}
            disabled={isExporting}
            className="px-3 py-1.5 rounded-sm text-xs font-bold bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Download candidates spreadsheet (.xlsx) for local reporting"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#007A3D]" />
            <span>Export to Excel</span>
            <span className="bg-slate-100 text-slate-700 font-mono text-[10px] px-1.5 py-0.2 rounded-xs border border-slate-200 font-bold">
              {filteredCandidates.length}
            </span>
          </button>

          <button
            onClick={() => setIsWhatsAppOpen(true)}
            className="px-3 py-1.5 rounded-sm text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp Summary</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 max-w-xl">
          {(currentPersona.role === 'GM' || currentPersona.role === 'Senior Manager') && (
            <select
              value={selectedCenterFilter}
              onChange={e => setSelectedCenterFilter(e.target.value)}
              className="text-xs bg-white border border-slate-300 rounded-sm px-2.5 py-1.5 font-bold text-slate-800 focus:outline-[#007A3D]"
            >
              <option value="all">All Pan-India Centers ({centers.length})</option>
              {centers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          )}

          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by candidate name, DL number, Aadhaar, reg ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:outline-[#007A3D]"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {statuses.map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-2.5 py-1 rounded-sm text-xs font-medium whitespace-nowrap transition-colors border ${
                statusFilter === s.value
                  ? 'bg-[#007A3D] text-white border-[#005C2E] font-bold'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              {s.label} <span className="text-[10px] ml-0.5 opacity-80">({s.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
        {/* Table Subheader Bar with Export Shortcut */}
        <div className="px-3.5 py-2 border-b border-slate-300 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              Center Roster: {activeCenter.name} ({activeCenter.code})
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">
              Showing <strong>{filteredCandidates.length}</strong> {statusFilter !== 'All' ? `(${statusFilter})` : ''} of <strong>{candidates.filter(c => c.centerId === activeCenter.id).length}</strong> candidates
            </span>
          </div>

          <button
            onClick={handleExportToExcel}
            disabled={isExporting || filteredCandidates.length === 0}
            className="px-2.5 py-1 rounded-sm text-xs font-bold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
            title="Download candidates spreadsheet (.xlsx) for local center reporting"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#007A3D]" />
            <span>Export (.xlsx)</span>
            <Download className="w-3 h-3 text-slate-500" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-300 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-2.5 px-3">Driver Profile</th>
                <th className="py-2.5 px-3">Gov ID & Contact</th>
                <th className="py-2.5 px-3">Commercial DL & Class</th>
                <th className="py-2.5 px-3">1-Day Training</th>
                <th className="py-2.5 px-3">Audit Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No candidates found matching the selected search and status filter.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map(candidate => (
                  <tr
                    key={candidate.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Driver Profile */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={candidate.photoUrl || undefined}
                          alt={candidate.fullName}
                          className="w-9 h-9 rounded-xs object-cover border border-slate-300"
                        />
                        <div>
                          <p className="font-bold text-slate-900">
                            {candidate.fullName}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            S/o {candidate.fatherName}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">
                            Reg: {candidate.registrationNumber}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Gov ID & Contact */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-0.5">
                        <p className="font-mono text-slate-800 font-semibold">
                          ID: {candidate.idCardNumber.slice(0, 4)}••••{candidate.idCardNumber.slice(-4)}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Mob: +91 {candidate.mobileNumber}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          ABHA: {candidate.abhaNumber.slice(0, 4)}••••{candidate.abhaNumber.slice(-4)}
                        </p>
                      </div>
                    </td>

                    {/* Commercial DL */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-slate-900 block">
                          {candidate.dlNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.2 rounded-xs bg-slate-100 text-slate-700 font-mono text-[10px] font-bold border border-slate-300">
                            {candidate.vehicleClass}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Exp: {candidate.dlExpiryDate}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 1-Day Training */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-xs ${
                              candidate.attendanceStatus === 'Present'
                                ? 'bg-[#007A3D]'
                                : candidate.attendanceStatus === 'Late'
                                ? 'bg-[#F15A24]'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span className="text-[11px] font-medium text-slate-700">
                            {candidate.attendanceStatus || 'Present'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Score: Pre {candidate.preTestScore}% | Post{' '}
                          <strong className="text-[#007A3D]">{candidate.postTestScore}%</strong>
                        </div>
                        {candidate.kitIssued && (
                          <span className="text-[10px] text-[#005C2E] font-medium bg-[#E6F4EA] px-1 py-0.2 rounded-xs border border-[#007A3D]/30 inline-block">
                            Kit (Size {candidate.tshirtSize})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Audit Status */}
                    <td className="py-2.5 px-3">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-xs text-[10px] border ${getStatusBadge(
                            candidate.status
                          )}`}
                        >
                          {candidate.status}
                        </span>
                        {candidate.queries.some(q => q.status === 'Open') && (
                          <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                            ⚠️ Query on {candidate.queries.find(q => q.status === 'Open')?.field}
                          </p>
                        )}
                        {candidate.certificateNumber && (
                          <p className="text-[10px] font-mono text-[#007A3D]">
                            Cert: {candidate.certificateNumber}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedCandidateId(candidate.id)}
                          className="p-1 rounded-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300"
                          title="Inspect 3-Page Archival Dossier"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() =>
                            generateCandidateDossierPdf(candidate, activeCenter.name, 'DBS-RJ01-2609-B1')
                          }
                          className="p-1 rounded-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300"
                          title="Download 3-Page Dossier PDF"
                        >
                          <FileDown className="w-3.5 h-3.5 text-[#007A3D]" />
                        </button>


                        {/* Final Certificate PDF */}
                        {candidate.status === 'Certified & Dispatched' && (
                          <button
                            onClick={() =>
                              generateTrainingCertificatePdf(
                                candidate,
                                activeCenter.name,
                                'Vikram Singh Rathore'
                              )
                            }
                            className="p-1 rounded-sm bg-[#E6F4EA] text-[#005C2E] hover:bg-[#DCFCE7] transition-colors border border-[#007A3D]/40"
                            title="Print Official Driver Certificate"
                          >
                            <Award className="w-3.5 h-3.5 text-[#007A3D]" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedCandidateId && (
        <DossierViewerModal
          isOpen={!!selectedCandidateId}
          candidateId={selectedCandidateId}
          onClose={() => setSelectedCandidateId(null)}
        />
      )}

      <WhatsAppSummaryModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        batchId={todayBatch?.id}
      />
    </div>
  );
};
