import React, { useState, useEffect } from 'react';
import {
  Building2,
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
  X,
  Plus,
  Edit3,
  PowerOff,
  AlertTriangle,
  Check,
  Target
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Center } from '../types';

export interface CreateHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
  onHubCreated?: (hubData: any) => void;
  initialEditCenter?: Center | null;
}

/**
 * Strict RBAC Role Guard:
 * Permitted: GM, CEO (and equivalent role strings)
 */
export const isAuthorizedForHubCreation = (userRole?: string): boolean => {
  if (!userRole) return false;
  const normalized = userRole.toUpperCase().replace(/\s+/g, '_');

  const prohibited = [
    'ROLE_TRAINER',
    'ROLE_FIELD_STAFF',
    'ROLE_PROGRAM_OFFICER',
    'ROLE_SENIOR_MANAGER',
    'TRAINER',
    'FIELD_STAFF',
    'PROGRAM_OFFICER',
    'SENIOR_MANAGER',
    'PO',
    'OSE'
  ];

  if (prohibited.includes(normalized)) return false;

  const permitted = [
    'ROLE_GM_OPERATIONS',
    'ROLE_OPERATIONS_HEAD',
    'ROLE_SUPER_ADMIN',
    'ROLE_ADMIN',
    'ROLE_CEO',
    'GM_OPERATIONS',
    'OPERATIONS_HEAD',
    'SUPER_ADMIN',
    'ADMIN',
    'GM',
    'CEO'
  ];

  return permitted.includes(normalized);
};

export const CreateHubModal: React.FC<CreateHubModalProps> = ({
  isOpen,
  onClose,
  userRole,
  onHubCreated,
  initialEditCenter = null
}) => {
  const {
    centers,
    addCenter,
    updateCenter,
    deactivateCenter,
    setActiveCenter,
    setSelectedCenterId
  } = useApp();

  const isAuthorized = isAuthorizedForHubCreation(userRole);

  const [activeTab, setActiveTab] = useState<'add' | 'manage'>('add');

  const initialForm = {
    centerName: '',
    centerCode: '',
    state: '',
    city: '',
    inChargeName: '',
    contactNumber: '',
    email: '',
    latitude: '',
    longitude: '',
    geofenceRadiusMeters: 150,
    targetCapacity: 450,
    address: ''
  };

  const [formData, setFormData] = useState(initialForm);

  // Quick Edit Hub state
  const [editingHub, setEditingHub] = useState<Center | null>(null);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editState, setEditState] = useState('');
  const [editTargetCapacity, setEditTargetCapacity] = useState<number>(450);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Deactivation Confirmation Dialog state
  const [confirmDeactivateHub, setConfirmDeactivateHub] = useState<Center | null>(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  useEffect(() => {
    if (initialEditCenter) {
      setActiveTab('manage');
      handleStartEdit(initialEditCenter);
    }
  }, [initialEditCenter]);

  if (!isOpen || !isAuthorized) return null;

  const handleStartEdit = (hub: Center) => {
    setEditingHub(hub);
    setEditName(hub.name);
    setEditCity(hub.city);
    setEditState(hub.state || hub.region || '');
    setEditTargetCapacity(hub.targetDrivers || hub.capacity || 400);
    setConfirmDeactivateHub(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHub) return;
    setIsSavingEdit(true);
    try {
      await updateCenter(editingHub.id, {
        name: editName.trim(),
        city: editCity.trim(),
        state: editState.trim(),
        region: editState.trim(),
        targetDrivers: Number(editTargetCapacity) || 400,
        capacity: Number(editTargetCapacity) || 400
      });
      setEditingHub(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!confirmDeactivateHub) return;
    setIsDeactivating(true);
    try {
      await deactivateCenter(confirmDeactivateHub.id);
      setConfirmDeactivateHub(null);
      if (editingHub?.id === confirmDeactivateHub.id) {
        setEditingHub(null);
      }
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hubPayload = {
      ...formData,
      code: formData.centerCode.trim().toUpperCase(),
      name: formData.centerName.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      region: formData.state.trim(),
      address: formData.address.trim() || `${formData.city.trim()}, ${formData.state.trim()}`,
      latitude: formData.latitude ? parseFloat(formData.latitude) : 26.9124,
      longitude: formData.longitude ? parseFloat(formData.longitude) : 75.7873,
      geofenceRadiusMeters: Number(formData.geofenceRadiusMeters) || 150,
      poName: formData.inChargeName.trim() || 'Designated PO',
      apmName: 'Designated Manager',
      capacity: Number(formData.targetCapacity) || 450,
      targetDrivers: Number(formData.targetCapacity) || 450,
      inChargeName: formData.inChargeName.trim(),
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    if (onHubCreated) {
      onHubCreated(hubPayload);
    } else {
      const created = addCenter(hubPayload);
      setActiveCenter(created);
      setSelectedCenterId(created.id);
    }

    setFormData(initialForm);
    setActiveTab('manage');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#007A3D] text-white flex items-center justify-center font-bold shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#007A3D] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Executive Hub Governance
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-[11px] font-medium text-slate-500">GM & CEO Exclusive</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Manage Centers / Hubs (Add, Edit, Deactivate)
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Audit & Tab Switcher Bar */}
        <div className="bg-emerald-50/60 border-b border-emerald-100 px-6 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('add')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'add'
                  ? 'bg-[#007A3D] text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add New Hub</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manage')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'manage'
                  ? 'bg-[#007A3D] text-white shadow-2xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Active Hubs ({centers.length})</span>
            </button>
          </div>

          <span className="flex items-center gap-1.5 text-[#007A3D] font-medium text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Role: <strong>{userRole}</strong> • Syncs with Supabase `hubs`</span>
          </span>
        </div>

        {/* TAB 1: ADD NEW HUB FORM */}
        {activeTab === 'add' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Hub Code & Center Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Hub Code (e.g., DL-04, RJ-05) <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.centerCode}
                  onChange={(e) => setFormData({ ...formData, centerCode: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold uppercase text-slate-900 focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] outline-none"
                  placeholder="e.g. DL-04 or RJ-05"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Center Name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.centerName}
                  onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] outline-none"
                  placeholder="e.g. Lucknow Regional Driver Training Center"
                />
              </div>
            </div>

            {/* City & State/Region & Target Capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] outline-none"
                  placeholder="e.g. Lucknow"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  State / Region <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] outline-none"
                  placeholder="e.g. Uttar Pradesh"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Target Capacity (/ mo) <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="10"
                  max="5000"
                  value={formData.targetCapacity}
                  onChange={(e) => setFormData({ ...formData, targetCapacity: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono font-bold text-slate-900 focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] outline-none"
                  placeholder="450"
                />
              </div>
            </div>

            {/* Optional Facility Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Center In-Charge / PO Name
                </label>
                <input
                  type="text"
                  value={formData.inChargeName}
                  onChange={(e) => setFormData({ ...formData, inChargeName: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] outline-none"
                  placeholder="Optional designated manager"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Complete Facility Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] outline-none"
                  placeholder="Plot No. 12, Transport Nagar..."
                />
              </div>
            </div>

            {/* Contact & Geofence */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Contact Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 pl-8 text-xs text-slate-900 focus:border-[#007A3D] outline-none"
                    placeholder="+91 98765 43210"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Official Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 p-2.5 pl-8 text-xs text-slate-900 focus:border-[#007A3D] outline-none"
                    placeholder="hub@dbskills.in"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Geofence Radius (m)
                </label>
                <input
                  type="number"
                  min="50"
                  max="1000"
                  value={formData.geofenceRadiusMeters}
                  onChange={(e) => setFormData({ ...formData, geofenceRadiusMeters: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[#007A3D] outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="rounded-xl bg-[#007A3D] hover:bg-[#005C2E] px-5 py-2 text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Hub & Sync to Supabase</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: MANAGE ACTIVE HUBS (EDIT & SOFT-DELETE DEACTIVATE) */}
        {activeTab === 'manage' && (
          <div className="p-6 space-y-4">
            {/* Deactivation Confirmation Dialog */}
            {confirmDeactivateHub && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-extrabold text-rose-900 uppercase tracking-wide">
                      Confirm Center Deactivation (Soft-Delete)
                    </h4>
                    <p className="text-xs text-rose-800 mt-1">
                      Are you sure you want to deactivate <strong>{confirmDeactivateHub.name}</strong> (<span className="font-mono font-bold">{confirmDeactivateHub.code}</span>)?
                      This will set <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">status = 'INACTIVE'</code> in the Supabase <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">hubs</code> table and remove it from active operational dropdowns.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDeactivateHub(null)}
                    disabled={isDeactivating}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeactivate}
                    disabled={isDeactivating}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <PowerOff className="w-3.5 h-3.5" />
                    <span>{isDeactivating ? 'Deactivating...' : 'Confirm Deactivate'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Edit Hub Modal / Form */}
            {editingHub && (
              <form
                onSubmit={handleSaveEdit}
                className="p-4 rounded-xl bg-teal-50/70 border border-teal-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-teal-900 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-teal-700" />
                    <span>Edit Hub: {editingHub.code}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingHub(null)}
                    className="text-xs text-slate-500 hover:text-slate-700 font-bold"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      Center Name *
                    </label>
                    <input
                      required
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-[#007A3D] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      City *
                    </label>
                    <input
                      required
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-[#007A3D] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      State / Region *
                    </label>
                    <input
                      required
                      type="text"
                      value={editState}
                      onChange={(e) => setEditState(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-[#007A3D] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                      Monthly Candidate Target *
                    </label>
                    <input
                      required
                      type="number"
                      min="10"
                      max="5000"
                      value={editTargetCapacity}
                      onChange={(e) => setEditTargetCapacity(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:border-[#007A3D] outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="px-4 py-1.5 rounded-lg bg-[#007A3D] hover:bg-[#005C2E] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSavingEdit ? 'Saving...' : 'Save Changes to Supabase'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Hubs List */}
            {centers.length === 0 ? (
              <div className="py-10 text-center bg-slate-50 rounded-xl border border-slate-200">
                <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No active hubs currently provisioned</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Switch to "+ Add New Hub" above to create your first training hub.
                </p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-200 border border-slate-200 rounded-xl bg-white">
                {centers.map((hub) => (
                  <div
                    key={hub.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-[#007A3D] border border-emerald-200 font-mono text-[11px] font-bold">
                          {hub.code}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{hub.name}</span>
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold uppercase">
                          {hub.status || 'ACTIVE'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {hub.city}, {hub.state}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-mono font-semibold text-slate-700">
                          <Target className="w-3 h-3 text-teal-600" />
                          Target: {hub.targetDrivers || hub.capacity || 400} / mo
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(hub)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit3 className="w-3 h-3 text-teal-700" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeactivateHub(hub);
                          setEditingHub(null);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <PowerOff className="w-3 h-3" />
                        <span>Deactivate</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('add')}
                className="text-xs font-bold text-[#007A3D] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Another Center / Hub</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateHubModal;
