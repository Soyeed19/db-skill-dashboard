import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  User,
  CreditCard,
  Truck,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Upload,
  Sparkles,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { Candidate } from '../../types';

interface EditCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onSaveCandidate: (
    candidateId: string,
    updatedFields: Partial<Candidate>,
    resubmitToPo?: boolean,
    resolutionComment?: string
  ) => void;
}

export const EditCandidateModal: React.FC<EditCandidateModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onSaveCandidate
}) => {
  if (!isOpen || !candidate) return null;

  const isDraft = candidate.status === 'Draft';
  const isReturned = candidate.status === 'Returned for Correction' || candidate.status === 'Query Raised';

  // Form Fields
  const [fullName, setFullName] = useState(candidate.fullName);
  const [fatherName, setFatherName] = useState(candidate.fatherName);
  const [motherName, setMotherName] = useState(candidate.motherName || '');
  const [dateOfBirth, setDateOfBirth] = useState(candidate.dateOfBirth || '1995-01-01');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(candidate.gender || 'Male');
  const [maritalStatus, setMaritalStatus] = useState(candidate.maritalStatus || 'Married');
  const [familyIncome, setFamilyIncome] = useState(candidate.familyIncome || '₹1,50,000 - ₹2,50,000 / year');
  const [religion, setReligion] = useState(candidate.religion || 'Hindu');
  const [casteCategory, setCasteCategory] = useState(candidate.casteCategory || 'OBC');

  const [mobileNumber, setMobileNumber] = useState(candidate.mobileNumber);
  const [idCardNumber, setIdCardNumber] = useState(candidate.idCardNumber);
  const [abhaNumber, setAbhaNumber] = useState(candidate.abhaNumber || '');
  const [dlNumber, setDlNumber] = useState(candidate.dlNumber);
  const [dlExpiryDate, setDlExpiryDate] = useState(candidate.dlExpiryDate);
  const [vehicleClass, setVehicleClass] = useState<Candidate['vehicleClass']>(candidate.vehicleClass);

  const [address, setAddress] = useState(candidate.address);
  const [city, setCity] = useState(candidate.city);
  const [state, setState] = useState(candidate.state);
  const [pincode, setPincode] = useState(candidate.pincode);

  // Document URLs
  const [photoUrl, setPhotoUrl] = useState(candidate.photoUrl);
  const [idFrontUrl, setIdFrontUrl] = useState(candidate.idFrontUrl);
  const [idBackUrl, setIdBackUrl] = useState(candidate.idBackUrl);
  const [dlFrontUrl, setDlFrontUrl] = useState(candidate.dlFrontUrl);
  const [dlBackUrl, setDlBackUrl] = useState(candidate.dlBackUrl);

  // PO Discrepancy Note (if returned)
  const openQuery = candidate.queries?.find(q => q.status === 'Open') || candidate.queries?.[0];
  const [resolutionComment, setResolutionComment] = useState(
    candidate.poCorrectionRemarks
      ? `Discrepancy fixed by OSE: Corrected ${openQuery?.field || 'flagged details'} per PO remarks.`
      : 'Discrepancy fixed by OSE.'
  );

  useEffect(() => {
    if (candidate) {
      setFullName(candidate.fullName);
      setFatherName(candidate.fatherName);
      setMotherName(candidate.motherName || '');
      setDateOfBirth(candidate.dateOfBirth || '1995-01-01');
      setGender(candidate.gender || 'Male');
      setMaritalStatus(candidate.maritalStatus || 'Married');
      setFamilyIncome(candidate.familyIncome || '₹1,50,000 - ₹2,50,000 / year');
      setReligion(candidate.religion || 'Hindu');
      setCasteCategory(candidate.casteCategory || 'OBC');
      setMobileNumber(candidate.mobileNumber);
      setIdCardNumber(candidate.idCardNumber);
      setAbhaNumber(candidate.abhaNumber || '');
      setDlNumber(candidate.dlNumber);
      setDlExpiryDate(candidate.dlExpiryDate);
      setVehicleClass(candidate.vehicleClass);
      setAddress(candidate.address);
      setCity(candidate.city);
      setState(candidate.state);
      setPincode(candidate.pincode);
      setPhotoUrl(candidate.photoUrl);
      setIdFrontUrl(candidate.idFrontUrl);
      setIdBackUrl(candidate.idBackUrl);
      setDlFrontUrl(candidate.dlFrontUrl);
      setDlBackUrl(candidate.dlBackUrl);
    }
  }, [candidate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedFields: Partial<Candidate> = {
      fullName,
      fatherName,
      motherName,
      dateOfBirth,
      gender,
      maritalStatus,
      familyIncome,
      religion,
      casteCategory,
      mobileNumber,
      idCardNumber,
      abhaNumber,
      dlNumber,
      dlExpiryDate,
      vehicleClass,
      address,
      city,
      state,
      pincode,
      photoUrl,
      idFrontUrl,
      idBackUrl,
      dlFrontUrl,
      dlBackUrl
    };

    if (isReturned) {
      // Re-lock and resubmit to PO
      onSaveCandidate(candidate.id, updatedFields, true, resolutionComment);
    } else {
      // Keep in Draft
      onSaveCandidate(candidate.id, updatedFields, false);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
      <div className="bg-white rounded-sm max-w-3xl w-full p-5 sm:p-6 shadow-md border border-slate-300 space-y-4 my-8">
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xs flex items-center justify-center text-white ${
                isReturned ? 'bg-[#F15A24]' : 'bg-[#007A3D]'
              }`}
            >
              {isReturned ? <AlertTriangle className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-xs border ${
                    isReturned
                      ? 'bg-[#FFF7ED] text-[#C2410C] border-[#F15A24]/40'
                      : 'bg-[#E6F4EA] text-[#005C2E] border-[#007A3D]/40'
                  }`}
                >
                  {isReturned
                    ? 'Stage 4: PO Discrepancy Correction'
                    : 'Stage 1: Draft Mode • Full Local Edit Permitted'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {candidate.registrationNumber}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-0.5">
                {isReturned ? 'Fix PO Discrepancy & Resubmit' : `Edit Draft Candidate - ${candidate.fullName}`}
              </h2>
              <p className="text-xs text-slate-500">
                {isReturned
                  ? 'Resolve auditor remarks and resubmit to PO review queue to re-lock the record.'
                  : 'Modify candidate demographics, identity numbers, and document scans without restriction throughout the training day.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PO Audit Remarks Banner (if returned) */}
        {isReturned && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>PO Discrepancy Remarks {openQuery?.field ? `[${openQuery.field}]` : ''}</span>
            </div>
            <p className="text-xs text-amber-900 italic font-medium">
              "{candidate.poCorrectionRemarks || openQuery?.comment || 'Discrepancy identified in candidate driving licence or identity details. Correction requested.'}"
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Demographics */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
              <User className="w-4 h-4 text-teal-600" />
              <span>1. Candidate Demographics & Personal Info</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Father's Name *</label>
                <input
                  type="text"
                  required
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Mother's Name</label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Marital Status</label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Divorced">Divorced</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Caste Category</label>
                <select
                  value={casteCategory}
                  onChange={(e) => setCasteCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Annual Family Income</label>
                <input
                  type="text"
                  value={familyIncome}
                  onChange={(e) => setFamilyIncome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Religion</label>
                <input
                  type="text"
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Contact, Driving Licence & Govt ID */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-teal-600" />
              <span>2. Contact & Commercial Transport Identifiers</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">10-Digit Mobile *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 text-xs">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Driving Licence (DL) No *</label>
                <input
                  type="text"
                  required
                  value={dlNumber}
                  onChange={(e) => setDlNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono uppercase font-bold text-teal-900"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Vehicle Class</label>
                <select
                  value={vehicleClass}
                  onChange={(e) => setVehicleClass(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800"
                >
                  <option value="TRANS">TRANS (Commercial Transport)</option>
                  <option value="HMV">HMV (Heavy Motor Vehicle)</option>
                  <option value="HGMV">HGMV (Heavy Goods Motor Vehicle)</option>
                  <option value="LMV-TR">LMV-TR (Light Motor Vehicle Transport)</option>
                  <option value="3W-CAB">3W-CAB (Three Wheeler Taxi)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Govt ID / Aadhaar No</label>
                <input
                  type="text"
                  maxLength={12}
                  value={idCardNumber}
                  onChange={(e) => setIdCardNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">ABHA Health ID Number</label>
                <input
                  type="text"
                  value={abhaNumber}
                  onChange={(e) => setAbhaNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">DL Expiry Date</label>
                <input
                  type="date"
                  value={dlExpiryDate}
                  onChange={(e) => setDlExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Permanent Residential Address */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-600" />
              <span>3. Permanent Residential Address</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Street / Village / Landmark *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">City / District *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">Pincode *</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Discrepancy Resolution Field (Only if returned) */}
          {isReturned && (
            <div className="space-y-2 pt-2 border-t border-amber-200">
              <label className="text-xs font-bold text-amber-950 block">
                OSE Discrepancy Fix Note (Mandatory for PO re-audit) *
              </label>
              <textarea
                rows={2}
                required
                value={resolutionComment}
                onChange={(e) => setResolutionComment(e.target.value)}
                className="w-full p-3 rounded-xl border border-amber-300 bg-amber-50/50 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                placeholder="Explain what corrections were applied to the flagged candidate record..."
              />
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 ${
                isReturned
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/10'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-800 hover:from-emerald-700 hover:to-teal-900 shadow-teal-900/10'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{isReturned ? 'Resubmit to PO (Lock Record)' : 'Save Draft Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
