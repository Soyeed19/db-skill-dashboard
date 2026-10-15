import React, { useState } from 'react';
import {
  Building2,
  Users,
  Award,
  AlertTriangle,
  TrendingUp,
  Package,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  MapPin,
  AlertOctagon,
  Trash2,
  X,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { purgeAllDataFromSupabase } from '../../services/supabaseService';

interface ExecutiveDashboardProps {
  onNavigateToCandidates: () => void;
  onNavigateToInventory: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigateToCandidates,
  onNavigateToInventory
}) => {
  const {
    centers,
    candidates,
    consumables,
    activeCenter,
    setActiveCenter,
    resetAllData,
    showToast,
    currentPersona
  } = useApp();

  // Safeguarded Purge State
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isPurging, setIsPurging] = useState(false);

  const handleConfirmPurge = async () => {
    if (confirmationText.trim() !== 'PURGE-CLOUD-DATA') return;

    setIsPurging(true);
    try {
      // 1. Purge Supabase Cloud Database (real SQL deletion)
      const spResult = await purgeAllDataFromSupabase();
      console.log('[Governance Danger Zone] Supabase cloud purge result:', spResult);

      // 2. Call backend server endpoint if server is online
      try {
        await fetch('/api/admin/purge-all-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': currentPersona?.role || 'CEO'
          },
          body: JSON.stringify({ role: currentPersona?.role || 'CEO' })
        });
      } catch (e) {
        console.warn('[Governance Danger Zone] Backend API purge offline or skipped:', e);
      }

      // 3. Reset application state & local storage
      if (typeof resetAllData === 'function') {
        resetAllData();
      }

      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('dbsl_candidates', JSON.stringify([]));
      localStorage.setItem('dbs_candidates', JSON.stringify([]));
      localStorage.setItem('dbs_batches', JSON.stringify([]));
      localStorage.setItem('dbsl_purged', 'true');

      showToast('Cloud database and all candidate dossiers successfully purged to zero-state.');
      setIsPurgeModalOpen(false);
      setConfirmationText('');
    } catch (err: any) {
      console.error('[Governance Danger Zone] Purge failed:', err);
      showToast(`Purge failed: ${err?.message || 'Error executing wipe'}`);
    } finally {
      setIsPurging(false);
    }
  };

  const totalEnrolled = candidates.length;
  const totalCertified = candidates.filter(c => c.status === 'Certified & Dispatched').length;
  const totalGreenSignal = candidates.filter(c => c.status === 'Green Signal (Video Call)' || c.status === 'APM QC Passed' || c.status === 'Certified & Dispatched').length;
  const totalOpenQueries = candidates.reduce((acc, curr) => acc + curr.queries.filter(q => q.status === 'Open').length, 0);
  const lowStockCount = consumables.filter(c => c.quantityOnHand < c.minimumThreshold).length;

  return (
    <div className="space-y-6">
      {/* Top National Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              National Trainees
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {totalEnrolled}
              </span>
              <span className="text-xs text-emerald-600 font-bold flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +14%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">4 Commercial Training Hubs</p>
          </div>
          <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-teal-800">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              PO Green Signals
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-teal-800 tracking-tight">
                {totalGreenSignal}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ({Math.round((totalGreenSignal / (totalEnrolled || 1)) * 100)}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Video Call Authorization</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Dispatched & Certified
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-emerald-600 tracking-tight">
                {totalCertified}
              </span>
              <span className="text-xs text-slate-400 font-mono">100% Passed</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Official Certificates Handed</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-600">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Audit Flags & Low Stock
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-amber-600 tracking-tight">
                {totalOpenQueries}
              </span>
              <span className="text-xs text-rose-500 font-bold">
                {lowStockCount > 0 && `• ${lowStockCount} Stock Alerts`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Awaiting Resolution</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-700">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Multi-Center Comparative Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              National Operations Hubs
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Multi-Center Performance & Real-Time Capacity
            </h3>
          </div>
          <span className="text-xs text-slate-400">Click any center to switch active management scope</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {centers.map(center => {
            const centerCandidates = candidates.filter(c => c.centerId === center.id);
            const centerCertified = centerCandidates.filter(c => c.status === 'Certified & Dispatched').length;
            const centerConsumables = consumables.filter(c => c.centerId === center.id);
            const hasLowStock = centerConsumables.some(c => c.quantityOnHand < c.minimumThreshold);
            const isCurrent = center.id === activeCenter.id;

            return (
              <div
                key={center.id}
                onClick={() => setActiveCenter(center)}
                className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                  isCurrent
                    ? 'border-teal-700 ring-2 ring-teal-600/30 bg-teal-50/20 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {center.code}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                      Active Scope
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{center.name}</h4>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-teal-600" /> {center.city}, {center.state}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trainees Enrolled:</span>
                    <span className="font-bold text-slate-800">{centerCandidates.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Certified & Dispatched:</span>
                    <span className="font-bold text-emerald-700">{centerCertified}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Stock Status:</span>
                    <span
                      className={`font-semibold ${
                        hasLowStock ? 'text-rose-600 font-bold' : 'text-emerald-700'
                      }`}
                    >
                      {hasLowStock ? '⚠️ Low Stock' : 'Adequate'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verification Pipeline Waterfall */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              Audit Pipeline Stages
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Candidate Dossier Life-Cycle Breakdown
            </h3>
          </div>

          <button
            onClick={onNavigateToCandidates}
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
          >
            Inspect Active Candidates <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Stage 1</span>
            <span className="text-xs font-bold text-slate-700 mt-1 block">Pending Scan</span>
            <span className="text-xl font-extrabold text-slate-900 mt-1 block">
              {candidates.filter(c => c.status === 'Pending Scan').length}
            </span>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200">
            <span className="text-[10px] text-blue-400 font-bold uppercase block">Stage 2</span>
            <span className="text-xs font-bold text-blue-900 mt-1 block">Pending PO Review</span>
            <span className="text-xl font-extrabold text-blue-900 mt-1 block">
              {candidates.filter(c => c.status === 'Pending PO Review').length}
            </span>
          </div>

          <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200">
            <span className="text-[10px] text-rose-400 font-bold uppercase block">Audit Flag</span>
            <span className="text-xs font-bold text-rose-900 mt-1 block">Query Raised</span>
            <span className="text-xl font-extrabold text-rose-700 mt-1 block">
              {candidates.filter(c => c.status === 'Query Raised').length}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <span className="text-[10px] text-emerald-500 font-bold uppercase block">Stage 3</span>
            <span className="text-xs font-bold text-emerald-950 mt-1 block">Green Signal (VC)</span>
            <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
              {candidates.filter(c => c.status === 'Green Signal (Video Call)').length}
            </span>
          </div>

          <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200">
            <span className="text-[10px] text-teal-500 font-bold uppercase block">Stage 4</span>
            <span className="text-xs font-bold text-teal-950 mt-1 block">APM QC Passed</span>
            <span className="text-xl font-extrabold text-teal-800 mt-1 block">
              {candidates.filter(c => c.status === 'APM QC Passed').length}
            </span>
          </div>

          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-xs">
            <span className="text-[10px] text-emerald-200 font-bold uppercase block">Final Stage</span>
            <span className="text-xs font-bold text-white mt-1 block">Dispatched</span>
            <span className="text-xl font-extrabold text-white mt-1 block">
              {candidates.filter(c => c.status === 'Certified & Dispatched').length}
            </span>
          </div>
        </div>
      </div>

      {/* 4. DANGER ZONE / FACTORY RESET CARD */}
      <div className="bg-red-50/70 border-2 border-red-300 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 text-red-700 rounded-2xl border border-red-200 shrink-0">
              <AlertOctagon className="w-6 h-6 text-red-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-200 text-red-900 uppercase tracking-wider">
                  Danger Zone
                </span>
                <span className="text-xs text-red-600 font-bold">•</span>
                <span className="text-xs text-red-700 font-semibold">Factory Reset & Master Purge</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Erase All Data (Backend & Cloud DB Wipe)
              </h3>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                <strong className="text-red-700">Permanent Action:</strong> This truncates all cloud-hosted candidate dossiers, audit trails, and batch logs across all hubs. Only authorized for testing purges.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setConfirmationText('');
              setIsPurgeModalOpen(true);
            }}
            className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer shrink-0"
          >
            <Trash2 className="w-4 h-4 text-red-200" />
            <span>Erase All Data (Backend DB Wipe)</span>
          </button>
        </div>
      </div>

      {/* Confirmation Safeguard Modal */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-red-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Confirm Destructive Cloud Database Wipe
                  </h3>
                  <p className="text-xs text-red-600 font-medium">
                    This operation cannot be undone
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isPurging) setIsPurgeModalOpen(false);
                }}
                disabled={isPurging}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-900 text-xs space-y-1.5">
                <p className="font-bold">You are about to permanently delete:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-red-800">
                  <li>All candidate registration records & optical OCR audit proofs</li>
                  <li>All training batch logs, classroom photos & attendance punches</li>
                  <li>Supabase PostgreSQL cloud tables (<code>candidates</code>, <code>batches</code>)</li>
                  <li>Local storage cache and reset platform to zero-state</li>
                </ul>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">
                  To confirm, type <span className="font-mono text-red-600 font-extrabold select-all">PURGE-CLOUD-DATA</span> below:
                </label>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type PURGE-CLOUD-DATA to confirm"
                  disabled={isPurging}
                  className="w-full px-3.5 py-2.5 rounded-xl border-2 border-slate-300 focus:border-red-500 focus:outline-none font-mono text-xs text-slate-900 font-bold tracking-wider"
                  autoFocus
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(false)}
                disabled={isPurging}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurge}
                disabled={confirmationText.trim() !== 'PURGE-CLOUD-DATA' || isPurging}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isPurging ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Purging Cloud Database...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Wipe All Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
