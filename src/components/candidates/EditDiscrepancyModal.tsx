import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Lock,
  Send,
  FileText,
  Upload,
  CheckCircle2,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { Candidate, AuditQuery } from '../../types';

interface EditDiscrepancyModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onResubmit: (candidateId: string, updatedFields: Partial<Candidate>, resolutionComment: string) => void;
}

export const EditDiscrepancyModal: React.FC<EditDiscrepancyModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onResubmit
}) => {
  if (!isOpen || !candidate) return null;

  // Active open query from PO
  const openQuery: AuditQuery | undefined = candidate.queries?.find(q => q.status === 'Open') || candidate.queries?.[0];

  // Editable fields initialized from candidate
  const [fullName, setFullName] = useState(candidate.fullName);
  const [fatherName, setFatherName] = useState(candidate.fatherName);
  const [motherName, setMotherName] = useState(candidate.motherName || '');
  const [mobileNumber, setMobileNumber] = useState(candidate.mobileNumber);
  const [dlNumber, setDlNumber] = useState(candidate.dlNumber);
  const [dlExpiryDate, setDlExpiryDate] = useState(candidate.dlExpiryDate);
  const [vehicleClass, setVehicleClass] = useState(candidate.vehicleClass);
  const [address, setAddress] = useState(candidate.address);
  const [city, setCity] = useState(candidate.city);
  const [state, setState] = useState(candidate.state);
  const [pincode, setPincode] = useState(candidate.pincode);

  // Document scan URLs
  const [dlFrontUrl, setDlFrontUrl] = useState(candidate.dlFrontUrl);
  const [dlBackUrl, setDlBackUrl] = useState(candidate.dlBackUrl);
  const [idFrontUrl, setIdFrontUrl] = useState(candidate.idFrontUrl);
  const [idBackUrl, setIdBackUrl] = useState(candidate.idBackUrl);

  // Correction resolution note
  const [resolutionComment, setResolutionComment] = useState(
    `Discrepancy fixed by OSE: Corrected ${openQuery?.field || 'flagged fields'} and updated documentation.`
  );

  useEffect(() => {
    if (candidate) {
      setFullName(candidate.fullName);
      setFatherName(candidate.fatherName);
      setMotherName(candidate.motherName || '');
      setMobileNumber(candidate.mobileNumber);
      setDlNumber(candidate.dlNumber);
      setDlExpiryDate(candidate.dlExpiryDate);
      setVehicleClass(candidate.vehicleClass);
      setAddress(candidate.address);
      setCity(candidate.city);
      setState(candidate.state);
      setPincode(candidate.pincode);
      setDlFrontUrl(candidate.dlFrontUrl);
      setDlBackUrl(candidate.dlBackUrl);
      setIdFrontUrl(candidate.idFrontUrl);
      setIdBackUrl(candidate.idBackUrl);
      setResolutionComment(
        `Discrepancy fixed by OSE: Corrected ${openQuery?.field || 'flagged documentation'} per PO instructions.`
      );
    }
  }, [candidate, openQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onResubmit(
      candidate.id,
      {
        fullName,
        fatherName,
        motherName,
        mobileNumber,
        dlNumber,
        dlExpiryDate,
        vehicleClass,
        address,
        city,
        state,
        pincode,
        dlFrontUrl,
        dlBackUrl,
        idFrontUrl,
        idBackUrl,
        status: 'Pending PO Review'
      },
      resolutionComment
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
      <div className="bg-white rounded-sm shadow-md border border-slate-300 w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-[#F15A24] text-white p-4 flex items-start justify-between border-b border-[#C2410C]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-[#C2410C] text-white border border-white/20 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
                PO Audit Correction Mode
              </span>
              <span className="font-mono text-xs text-amber-100">
                {candidate.registrationNumber}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">
              Edit & Fix Discrepancy for {candidate.fullName}
            </h2>
            <p className="text-xs text-amber-100">
              Only flagged records returned by PO can be edited. Submitting will re-lock data and route back to PO Audit Board.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-amber-100 hover:text-white hover:bg-amber-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PO Correction Reason Alert Box */}
        <div className="p-6 bg-amber-50/70 border-b border-amber-200">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-500 rounded-2xl text-white shadow-xs shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1 w-full">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                  PO Reviewer Defect Flag: {openQuery?.field || 'General Discrepancy'}
                </h4>
                <span className="text-[11px] font-mono text-amber-800 font-semibold">
                  Raised by: {openQuery?.raisedByName || 'Pooja Verma (PO)'} • {openQuery?.createdAt || 'Recent'}
                </span>
              </div>
              <p className="text-xs text-amber-900 bg-white/80 p-3 rounded-xl border border-amber-200/80 font-medium">
                "{openQuery?.comment || 'Document defect reported by Program Officer. Please verify details and update documentation.'}"
              </p>
            </div>
          </div>
        </div>

        {/* Editable Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Candidate Identification & DL Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-teal-700" />
              Rectify Candidate & Driving Licence Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Driver Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Father's Name</label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Mother's Name</label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">10-Digit Mobile Number</label>
                <input
                  type="text"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Driving Licence (DL) Number</label>
                <input
                  type="text"
                  value={dlNumber}
                  onChange={(e) => setDlNumber(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-bold text-teal-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">DL Expiry Date</label>
                <input
                  type="date"
                  value={dlExpiryDate}
                  onChange={(e) => setDlExpiryDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Vehicle Class</label>
                <select
                  value={vehicleClass}
                  onChange={(e) => setVehicleClass(e.target.value as Candidate['vehicleClass'])}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
                >
                  <option value="TRANS">TRANS (Commercial Transport)</option>
                  <option value="HMV">HMV (Heavy Motor Vehicle)</option>
                  <option value="LMV">LMV (Light Motor Vehicle)</option>
                  <option value="MCWG">MCWG (Motor Cycle with Gear)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-700 font-bold mb-1">Permanent Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                />
              </div>
            </div>
          </div>

          {/* Document Scan Re-upload & URLs */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
              <span>Re-upload / Update Scanned Documents</span>
              <span className="text-[10px] text-teal-800 font-normal">Flagged scan can be replaced</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">DL Back Scan (Flagged)</span>
                  <label className="cursor-pointer text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    Replace Scan
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) setDlBackUrl(ev.target.result as string);
                          };
                          reader.readAsDataURL(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
                {dlBackUrl ? (
                  <img
                    src={dlBackUrl}
                    alt="DL Back Scan"
                    className="w-full h-24 object-cover rounded-lg border border-slate-200"
                  />
                ) : (
                  <div className="w-full h-24 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                    No DL Back Scan
                  </div>
                )}
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">DL Front Scan</span>
                  <label className="cursor-pointer text-[10px] font-bold text-teal-700 hover:text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 flex items-center gap-1">
                    <Upload className="w-3 h-3" />
                    Replace Scan
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) setDlFrontUrl(ev.target.result as string);
                          };
                          reader.readAsDataURL(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
                {dlFrontUrl ? (
                  <img
                    src={dlFrontUrl}
                    alt="DL Front Scan"
                    className="w-full h-24 object-cover rounded-lg border border-slate-200"
                  />
                ) : (
                  <div className="w-full h-24 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                    No DL Front Scan
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* OSE Resolution Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
              OSE Resubmission Resolution Remarks (Visible to PO)
            </label>
            <textarea
              rows={2}
              value={resolutionComment}
              onChange={(e) => setResolutionComment(e.target.value)}
              placeholder="Detail the corrections applied for the Program Officer..."
              required
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Record will re-lock immediately upon resubmission.</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Resubmit to PO (Lock Record)</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
