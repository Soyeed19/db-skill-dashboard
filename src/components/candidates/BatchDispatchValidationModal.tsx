import React from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Send
} from 'lucide-react';
import { Candidate } from '../../types';

interface BatchDispatchValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftCandidates: Candidate[];
  onUploadPhotosForCandidate: (candidate: Candidate) => void;
  onConfirmDispatch: () => void;
}

export const BatchDispatchValidationModal: React.FC<BatchDispatchValidationModalProps> = ({
  isOpen,
  onClose,
  draftCandidates,
  onUploadPhotosForCandidate,
  onConfirmDispatch
}) => {
  if (!isOpen) return null;

  const incompleteCandidates = draftCandidates.filter(
    (c) => !c.certificateHoldingPhotoUrl || !c.certificateHandoverPhotoUrl
  );
  const readyCandidates = draftCandidates.filter(
    (c) => Boolean(c.certificateHoldingPhotoUrl && c.certificateHandoverPhotoUrl)
  );

  const hasIncomplete = incompleteCandidates.length > 0;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
      <div className="bg-white rounded-sm max-w-2xl w-full p-5 sm:p-6 shadow-md border border-slate-300 space-y-4 my-8" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xs flex items-center justify-center text-white ${
                hasIncomplete ? 'bg-[#F15A24]' : 'bg-[#007A3D]'
              }`}
            >
              {hasIncomplete ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-xs border ${
                    hasIncomplete
                      ? 'bg-[#FFF7ED] text-[#C2410C] border-[#F15A24]/40'
                      : 'bg-[#E6F4EA] text-[#005C2E] border-[#007A3D]/40'
                  }`}
                >
                  {hasIncomplete
                    ? 'Dispatch Validation Blocked'
                    : 'Batch Ready for Evening Dispatch'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {draftCandidates.length} Draft Drivers
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                {hasIncomplete
                  ? `Certificate Photos Missing (${incompleteCandidates.length} Drivers)`
                  : "Submit Today's Completed Batch to PO"}
              </h2>
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

        {/* Status Breakdown Bar */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div
            className={`p-3 rounded-2xl border ${
              hasIncomplete
                ? 'bg-amber-50 border-amber-300 text-amber-950'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block">
              Missing Certificate Proofs
            </span>
            <span className="text-xl font-black text-amber-700">{incompleteCandidates.length}</span>
            <span className="text-[11px] block text-slate-500 mt-0.5">
              Requires holding or handover photo
            </span>
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              !hasIncomplete
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider block">
              Complete & Verified
            </span>
            <span className="text-xl font-black text-emerald-700">{readyCandidates.length}</span>
            <span className="text-[11px] block text-slate-500 mt-0.5">
              Both certificate proofs attached
            </span>
          </div>
        </div>

        {/* Incomplete Records Warning List */}
        {hasIncomplete ? (
          <div className="space-y-3">
            <div className="bg-amber-50/80 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Dispatch Constraint: Mandatory Certificate Proofs
              </span>
              <p className="text-[11px] text-amber-800">
                The evening batch cannot be dispatched until training concludes and both verified photographic proofs (Holding Photo & Handover Photo) are uploaded for every driver in the batch.
              </p>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {incompleteCandidates.map((c) => {
                const missingHolding = !c.certificateHoldingPhotoUrl;
                const missingHandover = !c.certificateHandoverPhotoUrl;

                return (
                  <div
                    key={c.id}
                    className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={c.photoUrl || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80'}
                        alt={c.fullName}
                        className="w-9 h-9 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-slate-900">{c.fullName}</p>
                          <span className="text-[10px] font-mono text-slate-400">
                            {c.registrationNumber}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {missingHolding && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                              Missing Holding Photo
                            </span>
                          )}
                          {missingHandover && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-200">
                              Missing Handover Photo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onUploadPhotosForCandidate(c)}
                      className="px-3.5 py-1.5 bg-[#007A3D] hover:bg-[#005C2E] text-white text-xs font-bold rounded-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
                    >
                      <span>📷</span>
                      <span>Upload Now</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-950 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>All {draftCandidates.length} Driver Candidates Are Ready for Dispatch</span>
              </div>
              <p className="text-xs text-emerald-800">
                All candidates have verified Certificate Holding and Certificate Handover photos attached.
              </p>
            </div>

            {/* Immutability Lock Warning */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-slate-700" />
                Strict Immutability Lock Policy
              </span>
              <p className="text-slate-600">
                Upon submitting today's batch to PO:
              </p>
              <ul className="list-disc pl-5 text-[11px] text-slate-500 space-y-1">
                <li>All candidate records instantly become strictly <strong>Read-Only</strong> (<code className="font-mono">isLocked: true</code>).</li>
                <li>OSE loses all edit, overwrite, and delete permissions.</li>
                <li>Records can only be unlocked if a Program Officer (PO) marks an individual candidate as <em>Returned for Correction</em>.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
          >
            {hasIncomplete ? 'Back to Dashboard' : 'Cancel'}
          </button>

          <button
            type="button"
            disabled={hasIncomplete || draftCandidates.length === 0}
            onClick={() => {
              onConfirmDispatch();
              onClose();
            }}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all ${
              hasIncomplete || draftCandidates.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                : 'bg-gradient-to-r from-emerald-600 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white active:scale-95 shadow-teal-900/10'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Confirm & Dispatch Batch to PO ({draftCandidates.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
