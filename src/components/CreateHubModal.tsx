import React, { useState } from 'react';
import { Building2, ShieldAlert, CheckCircle2, MapPin, Users, Mail, Phone, Compass, X } from 'lucide-react';

export interface CreateHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string; // e.g., 'ROLE_GM_OPERATIONS' | 'ROLE_OPERATIONS_HEAD' | 'ROLE_SUPER_ADMIN' | 'GM' | 'CEO' | 'ADMIN' | 'TRAINER'
  onHubCreated: (hubData: any) => void;
}

/**
 * Strict RBAC Role Guard:
 * Permitted: ROLE_GM_OPERATIONS, ROLE_OPERATIONS_HEAD, ROLE_SUPER_ADMIN, GM, CEO, ADMIN
 * Strictly Prohibited: ROLE_TRAINER, ROLE_FIELD_STAFF, ROLE_PROGRAM_OFFICER, ROLE_SENIOR_MANAGER
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
}) => {
  // STRICT RBAC CHECK: Only GM Operations or Admin/CEO can view or submit
  const isAuthorized = isAuthorizedForHubCreation(userRole);

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
    facilityCapacity: 40,
    address: ''
  };

  const [formData, setFormData] = useState(initialForm);

  if (!isOpen || !isAuthorized) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onHubCreated({
      ...formData,
      // Standardize mapped properties
      code: formData.centerCode.trim().toUpperCase(),
      name: formData.centerName.trim(),
      latitude: formData.latitude ? parseFloat(formData.latitude) : 26.9124,
      longitude: formData.longitude ? parseFloat(formData.longitude) : 75.7873,
      geofenceRadiusMeters: Number(formData.geofenceRadiusMeters) || 150,
      capacity: Number(formData.facilityCapacity) || 40,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    });
    setFormData(initialForm);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-xl rounded-xs border border-slate-200 bg-white shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xs bg-[#007A3D] text-white flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#007A3D] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Executive Governance
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-[11px] font-medium text-slate-500">GM & Admin Exclusive</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Create New Training Hub</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-xs hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Audit Badge */}
        <div className="bg-emerald-50/60 border-b border-emerald-100 px-6 py-2 flex items-center justify-between text-xs text-slate-700">
          <span className="flex items-center gap-1.5 text-[#007A3D] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Authorized Executive Role: <strong>{userRole}</strong></span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">RBAC SEC-HUB-2026</span>
        </div>

        {/* Creation Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Hub Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                Hub / Center Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.centerName}
                onChange={(e) => setFormData({ ...formData, centerName: e.target.value })}
                className="w-full rounded-xs border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] focus:outline-hidden"
                placeholder="e.g. Lucknow Regional Driver Training Center"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                Center Code (Unique) <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.centerCode}
                onChange={(e) => setFormData({ ...formData, centerCode: e.target.value })}
                className="w-full rounded-xs border border-slate-300 p-2.5 text-xs font-mono uppercase text-slate-900 focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] focus:outline-hidden"
                placeholder="DBSL-HUB-015"
              />
            </div>
          </div>

          {/* State & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                State <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full rounded-xs border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] focus:outline-hidden"
                placeholder="e.g. Uttar Pradesh"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                District / City <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-xs border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] focus:outline-hidden"
                placeholder="e.g. Lucknow"
              />
            </div>
          </div>

          {/* Physical Address */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
              Complete Facility Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full rounded-xs border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] focus:outline-hidden"
              placeholder="Plot No. 12, Transport Nagar Industrial Area..."
            />
          </div>

          {/* In-Charge & Facility Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                Center In-Charge / Manager <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={formData.inChargeName}
                onChange={(e) => setFormData({ ...formData, inChargeName: e.target.value })}
                className="w-full rounded-xs border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] focus:outline-hidden"
                placeholder="e.g. Vikramaditya Singh"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                Facility Capacity (Max / Batch) <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="number"
                min="10"
                max="200"
                value={formData.facilityCapacity}
                onChange={(e) => setFormData({ ...formData, facilityCapacity: Number(e.target.value) })}
                className="w-full rounded-xs border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] focus:outline-hidden"
                placeholder="40"
              />
            </div>
          </div>

          {/* Contact Number & Official Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                Contact Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  className="w-full rounded-xs border border-slate-300 p-2.5 pl-8 text-xs text-slate-900 focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] focus:outline-hidden"
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
                  className="w-full rounded-xs border border-slate-300 p-2.5 pl-8 text-xs text-slate-900 focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] focus:outline-hidden"
                  placeholder="hub.lucknow@dbskills.in"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          {/* Geofence Coordinates */}
          <div className="border border-slate-200 rounded-xs p-3.5 bg-slate-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#007A3D]" />
                <span>Geofencing & Biometric Attendance Locking</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Radius: {formData.geofenceRadiusMeters}m</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Latitude
                </label>
                <input
                  type="text"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full rounded-xs border border-slate-300 bg-white p-2 text-xs font-mono text-slate-900 focus:border-[#007A3D] focus:outline-hidden"
                  placeholder="e.g. 26.8467"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Longitude
                </label>
                <input
                  type="text"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full rounded-xs border border-slate-300 bg-white p-2 text-xs font-mono text-slate-900 focus:border-[#007A3D] focus:outline-hidden"
                  placeholder="e.g. 80.9462"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  Geofence Radius (meters) <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min="50"
                  max="1000"
                  value={formData.geofenceRadiusMeters}
                  onChange={(e) => setFormData({ ...formData, geofenceRadiusMeters: Number(e.target.value) })}
                  className="w-full rounded-xs border border-slate-300 bg-white p-2 text-xs text-slate-900 focus:border-[#007A3D] focus:outline-hidden"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              Attendance punches outside this radius trigger supervisor alerts and geofence flags.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xs border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xs bg-[#007A3D] hover:bg-[#005C2E] px-5 py-2 text-xs font-bold text-white transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Create Training Hub</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateHubModal;
