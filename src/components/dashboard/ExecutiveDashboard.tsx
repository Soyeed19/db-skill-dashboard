import React from 'react';
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
  MapPin
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ExecutiveDashboardProps {
  onNavigateToCandidates: () => void;
  onNavigateToInventory: () => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  onNavigateToCandidates,
  onNavigateToInventory
}) => {
  const { centers, candidates, consumables, activeCenter, setActiveCenter } = useApp();

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
    </div>
  );
};
