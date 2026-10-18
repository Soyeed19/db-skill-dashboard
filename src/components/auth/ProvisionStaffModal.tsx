import React, { useState } from 'react';
import {
  UserPlus,
  Mail,
  User,
  MapPin,
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Database,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

const REGIONAL_CLUSTERS = [
  'North Region (Rajasthan & Delhi NCR)',
  'West Region (Maharashtra)',
  'South Region (Karnataka)',
  'North & West Region',
  'All-India Regional Cluster'
];

interface ProvisionStaffPanelProps {
  compact?: boolean;
  onSuccess?: () => void;
}

export const ProvisionStaffPanel: React.FC<ProvisionStaffPanelProps> = ({ compact = false, onSuccess }) => {
  const {
    currentPersona,
    centers,
    profiles,
    provisionStaffMember,
    refreshFromSupabase,
    isCloudSyncing
  } = useApp();

  const currentRole = currentPersona.role;

  // Determine allowed target roles strictly based on hierarchy:
  // CEO -> GM
  // GM -> SM (Senior Manager)
  // SM -> PO and OSE
  const getDefaultTargetRole = (): UserRole => {
    if (currentRole === 'CEO') return 'GM';
    if (currentRole === 'GM') return 'Senior Manager';
    return 'PO';
  };

  const [targetRole, setTargetRole] = useState<UserRole>(getDefaultTargetRole);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [regionalCluster, setRegionalCluster] = useState(REGIONAL_CLUSTERS[0]);
  const [centerCode, setCenterCode] = useState(centers[0]?.code || 'RJ-01');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Keep targetRole aligned if currentRole changes
  React.useEffect(() => {
    if (currentRole === 'CEO') setTargetRole('GM');
    else if (currentRole === 'GM') setTargetRole('Senior Manager');
    else if (currentRole === 'Senior Manager' && targetRole !== 'PO' && targetRole !== 'OSE') {
      setTargetRole('PO');
    }
  }, [currentRole]);

  const canProvision = currentRole === 'CEO' || currentRole === 'GM' || currentRole === 'Senior Manager';

  if (!canProvision) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid official email address.');
      return;
    }
    if (!cleanName) {
      setErrorMsg('Please enter the staff member full name.');
      return;
    }

    let resolvedRole: UserRole = targetRole;
    let resolvedCenterId: string | null = null;
    let resolvedCluster: string | null = null;

    if (currentRole === 'CEO') {
      resolvedRole = 'GM';
      resolvedCenterId = null;
      resolvedCluster = 'National Operations';
    } else if (currentRole === 'GM') {
      resolvedRole = 'Senior Manager';
      resolvedCenterId = null;
      resolvedCluster = regionalCluster;
    } else if (currentRole === 'Senior Manager') {
      resolvedRole = targetRole === 'OSE' ? 'OSE' : 'PO';
      resolvedCenterId = centerCode.trim().toUpperCase();
      const matchedCenter = centers.find(c => c.code === resolvedCenterId || c.id === resolvedCenterId);
      resolvedCluster = matchedCenter?.region ? `${matchedCenter.region} Region` : currentPersona.region || 'Regional Cluster';
    }

    setIsSubmitting(true);
    try {
      const res = await provisionStaffMember({
        email: cleanEmail,
        fullName: cleanName,
        role: resolvedRole,
        centerId: resolvedCenterId,
        regionalCluster: resolvedCluster
      });

      if (res.success) {
        setSuccessMsg(res.message);
        setEmail('');
        setFullName('');
        onSuccess?.();
      } else {
        setErrorMsg(res.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#007A3D] text-white shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-[#E6F4EA] text-[#005C2E] border border-[#007A3D]/20">
                {currentRole === 'CEO'
                  ? 'CEO Authority → Provision GM'
                  : currentRole === 'GM'
                  ? 'GM Authority → Provision SM (Senior Manager)'
                  : 'SM Authority → Provision PO & OSE'}
              </span>
              <span className="text-[10px] font-mono text-slate-500">public.profiles</span>
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
              + Provision Staff Member (Downstream Role Access)
            </h3>
            <p className="text-xs text-slate-500">
              Inserts an authorized record into <code className="font-mono text-teal-800">public.profiles</code>. Provisioned staff can immediately sign in on any device via Email OTP.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refreshFromSupabase()}
          disabled={isCloudSyncing}
          className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
          <span>Sync Profiles</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Provisioning Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* Email Input */}
        <div className="md:col-span-4">
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Official Email Address <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={
                currentRole === 'CEO'
                  ? 'gm.operations@example.com'
                  : currentRole === 'GM'
                  ? 'sm.north@example.com'
                  : 'po.rj01@example.com'
              }
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#007A3D] outline-none"
            />
          </div>
        </div>

        {/* Full Name Input */}
        <div className="md:col-span-3">
          <label className="block text-[11px] font-bold text-slate-700 mb-1">
            Staff Full Name <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={
                currentRole === 'CEO'
                  ? 'e.g. Col. Rajesh Mehta'
                  : currentRole === 'GM'
                  ? 'e.g. Siddharth Nair'
                  : 'e.g. Pooja Verma'
              }
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#007A3D] outline-none"
            />
          </div>
        </div>

        {/* Role & Scope Specific Fields */}
        {currentRole === 'CEO' && (
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Provisioned Role & Scope
            </label>
            <div className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#007A3D] shrink-0" />
              <span>GM (National Command)</span>
            </div>
          </div>
        )}

        {currentRole === 'GM' && (
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              SM Regional Cluster <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={regionalCluster}
                onChange={(e) => setRegionalCluster(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-[#007A3D] outline-none"
              >
                {REGIONAL_CLUSTERS.map((cluster) => (
                  <option key={cluster} value={cluster}>
                    {cluster}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {currentRole === 'Senior Manager' && (
          <>
            <div className="md:col-span-1">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value as UserRole)}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-[#007A3D] outline-none"
              >
                <option value="PO">PO</option>
                <option value="OSE">OSE</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Center ID (e.g. RJ-01) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <select
                  value={centerCode}
                  onChange={(e) => setCenterCode(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:border-[#007A3D] outline-none"
                >
                  {centers.map((c) => (
                    <option key={c.id} value={c.code}>
                      {c.code} — {c.city}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {/* Submit CTA */}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-3 rounded-xl bg-[#007A3D] hover:bg-[#005C2E] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5 shrink-0" />
            <span>{isSubmitting ? 'Saving...' : '+ Provision'}</span>
          </button>
        </div>
      </form>

      {/* Authorized Profiles Directory (public.profiles) */}
      {!compact && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#007A3D]" />
              <span>Authorized Profiles in Supabase (`public.profiles` — {profiles.length} total)</span>
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2 px-3">Full Name</th>
                  <th className="py-2 px-3">Registered Email (OTP Login)</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">Center ID / Scope</th>
                  <th className="py-2 px-3">Profile UUID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {profiles.map((p) => (
                  <tr key={p.email} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-bold text-slate-900">{p.full_name}</td>
                    <td className="py-2 px-3 font-mono text-teal-800 font-semibold">{p.email}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-[#E6F4EA] text-[#005C2E] border border-[#007A3D]/20">
                        {p.role}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-700">
                      {p.center_id ? (
                        <span className="px-2 py-0.5 rounded-xs bg-sky-50 text-sky-800 border border-sky-200 font-bold text-[10px]">
                          {p.center_id}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">
                          {p.regional_cluster || 'NULL (All-Hub / National)'}
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 font-mono text-[10px] text-slate-400">
                      {p.id ? `${p.id.slice(0, 8)}...` : 'Pending Auth Link'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

interface ProvisionStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProvisionStaffModal: React.FC<ProvisionStaffModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Downstream Role Provisioning (`public.profiles`)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <ProvisionStaffPanel />
        </div>
      </div>
    </div>
  );
};
