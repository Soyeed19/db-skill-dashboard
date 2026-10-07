import React, { useState } from 'react';
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

  // Filter candidates by center and search
  const filteredCandidates = candidates.filter(c => {
    // If not GM/Senior Manager, filter by active center
    const matchesCenter = currentPersona.role === 'GM' || currentPersona.role === 'Senior Manager'
      ? (activeCenter ? c.centerId === activeCenter.id : true)
      : c.centerId === activeCenter.id;

    const matchesSearch =
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dlNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.idCardNumber.includes(searchQuery) ||
      c.mobileNumber.includes(searchQuery);

    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;

    return matchesCenter && matchesSearch && matchesStatus;
  });

  const statuses: { label: string; value: string; count: number }[] = [
    { label: 'All Candidates', value: 'All', count: candidates.filter(c => c.centerId === activeCenter.id).length },
    { label: 'Pending PO Review', value: 'Pending PO Review', count: candidates.filter(c => c.centerId === activeCenter.id && c.status === 'Pending PO Review').length },
    { label: 'Query Raised', value: 'Query Raised', count: candidates.filter(c => c.centerId === activeCenter.id && c.status === 'Query Raised').length },
    { label: 'Green Signal (Video Call)', value: 'Green Signal (Video Call)', count: candidates.filter(c => c.centerId === activeCenter.id && c.status === 'Green Signal (Video Call)').length },
    { label: 'APM QC Passed', value: 'APM QC Passed', count: candidates.filter(c => c.centerId === activeCenter.id && c.status === 'APM QC Passed').length },
    { label: 'Certified & Dispatched', value: 'Certified & Dispatched', count: candidates.filter(c => c.centerId === activeCenter.id && c.status === 'Certified & Dispatched').length }
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
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Query Raised':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      case 'Green Signal (Video Call)':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      case 'APM QC Passed':
        return 'bg-teal-50 text-teal-800 border-teal-300 font-semibold';
      case 'Certified & Dispatched':
        return 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-xs';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Target Progress Bar Card (OSE & Operations focus) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-50 rounded-xl border border-teal-200/80 text-teal-800">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
                Daily Enrollment Metric
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-mono">{activeCenter.name}</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {dailyEnrolled} of {dailyTarget} Candidates Registered Today ({targetPct}%)
            </h3>
          </div>
        </div>

        <div className="flex-1 max-w-md">
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
            <div
              className="bg-gradient-to-r from-teal-700 to-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${targetPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 mt-1.5 font-medium">
            <span>Minimum Batch Target: 25</span>
            <span>Capacity Ceiling: {dailyTarget}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportToExcel}
            disabled={isExporting}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            title="Download candidates spreadsheet (.xlsx) for local reporting"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Export to Excel</span>
            <span className="bg-emerald-200 text-emerald-950 font-mono text-[10px] px-1.5 py-0.5 rounded font-bold">
              {filteredCandidates.length}
            </span>
          </button>

          <button
            onClick={() => setIsWhatsAppOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            WhatsApp Batch Summary
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by candidate name, DL number, Aadhaar, reg ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-teal-600 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statuses.map(s => (
            <button
              key={s.value}
              onClick={() => setStatusFilter(s.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                statusFilter === s.value
                  ? 'bg-teal-800 text-white border-teal-800 shadow-xs font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s.label} <span className="opacity-70 text-[10px] ml-1">({s.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Candidates Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {/* Table Subheader Bar with Export Shortcut */}
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
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
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-emerald-800 border border-emerald-300 hover:bg-emerald-50 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            title="Download candidates spreadsheet (.xlsx) for local center reporting"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export to Excel (.xlsx)</span>
            <Download className="w-3 h-3 text-emerald-600" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Driver Profile</th>
                <th className="py-3.5 px-4">Gov ID & Contact</th>
                <th className="py-3.5 px-4">Commercial DL & Class</th>
                <th className="py-3.5 px-4">1-Day Training</th>
                <th className="py-3.5 px-4">Audit Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No candidates found matching the selected search and status filter.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map(candidate => (
                  <tr
                    key={candidate.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Driver Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={candidate.photoUrl}
                          alt={candidate.fullName}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs"
                        />
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-teal-900 transition-colors">
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
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-slate-900 block">
                          {candidate.dlNumber}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px] font-bold border border-slate-200">
                            {candidate.vehicleClass}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Exp: {candidate.dlExpiryDate}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 1-Day Training */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              candidate.attendanceStatus === 'Present'
                                ? 'bg-emerald-500'
                                : candidate.attendanceStatus === 'Late'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span className="text-[11px] font-medium text-slate-700">
                            {candidate.attendanceStatus || 'Present'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Score: Pre {candidate.preTestScore}% | Post{' '}
                          <strong className="text-emerald-700">{candidate.postTestScore}%</strong>
                        </div>
                        {candidate.kitIssued && (
                          <span className="text-[10px] text-teal-800 font-medium bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            Kit (Size {candidate.tshirtSize})
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Audit Status */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] border ${getStatusBadge(
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
                          <p className="text-[10px] font-mono text-emerald-800">
                            Cert: {candidate.certificateNumber}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedCandidateId(candidate.id)}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
                          title="Inspect 3-Page Archival Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            generateCandidateDossierPdf(candidate, activeCenter.name, 'DBS-RJ01-2609-B1')
                          }
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
                          title="Download 3-Page Dossier PDF"
                        >
                          <FileDown className="w-4 h-4 text-teal-700" />
                        </button>

                        {/* PO Quick Green Signal */}
                        {(currentPersona.role === 'PO' || currentPersona.role === 'GM') &&
                          candidate.status === 'Pending PO Review' && (
                            <button
                              onClick={() => grantGreenSignal(candidate.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs flex items-center gap-1"
                              title="Grant Green Signal for Video Call"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Green Signal
                            </button>
                          )}

                        {/* Senior Manager QC Clearance */}
                        {(currentPersona.role === 'Senior Manager' || currentPersona.role === 'GM') &&
                          candidate.status === 'Green Signal (Video Call)' && (
                            <button
                              onClick={() => approveApmQc(candidate.id)}
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-800 text-white hover:bg-teal-700 transition-colors shadow-xs flex items-center gap-1"
                              title="Approve APM Secondary QC"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              QC Pass
                            </button>
                          )}

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
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-300"
                            title="Print Official Driver Certificate"
                          >
                            <Award className="w-4 h-4 text-emerald-700" />
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
