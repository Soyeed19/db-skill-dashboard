import React from 'react';
import { AlertTriangle, AlertCircle, X, ShieldAlert } from 'lucide-react';

interface DlExpiredAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  dlNumber: string;
  dlExpiryDate: string;
}

export const DlExpiredAlertModal: React.FC<DlExpiredAlertModalProps> = ({
  isOpen,
  onClose,
  dlNumber,
  dlExpiryDate
}) => {
  if (!isOpen) return null;

  const formattedDate = dlExpiryDate
    ? new Date(dlExpiryDate).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : 'Recorded Expiry Date';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-200 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                Compliance Block
              </span>
              <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">
                Driving Licence Expired!
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* DL & Expiry Details */}
        <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-100 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">DL Number:</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-rose-200 uppercase">
              {dlNumber || 'Not Entered Yet'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Licence Expiry Date:</span>
            <span className="font-mono font-bold text-rose-700 bg-white px-2.5 py-1 rounded border border-rose-200">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Policy Warning Message */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Policy Warning:</span>
          </div>
          <p className="text-slate-700 font-medium">
            This candidate's Driving Licence has expired on{' '}
            <strong className="text-rose-700 underline font-bold">{formattedDate}</strong>.
            Enrollment cannot proceed with an invalid licence.
          </p>
          <p className="text-[11px] text-slate-500">
            Commercial vehicle drivers must have an active, non-expired driving licence issued by the RTO to attend skill and safety training. Candidate registration is suspended until an active DL is entered.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shadow-xs"
          >
            Acknowledge & Correct Licence Details
          </button>
        </div>
      </div>
    </div>
  );
};
