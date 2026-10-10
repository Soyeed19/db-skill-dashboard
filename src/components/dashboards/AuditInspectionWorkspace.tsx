import React, { useState } from 'react';
import {
  FileText,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Phone,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  X,
  Send,
  CornerUpLeft
} from 'lucide-react';
import { Candidate, AuditQuery } from '../../types';

export interface AuditInspectionWorkspaceProps {
  candidate: Candidate;
  onApproveGreenSignal: (candidateId: string) => void;
  onRaiseQuery?: (candidateId: string, field: AuditQuery['field'], comment: string) => void;
  reviewerName?: string;
  isSeniorManager?: boolean;
  onSmFinalApproval?: (candidateId: string) => void;
  onReturnToPo?: (candidateId: string, remarks: string) => void;
}

type DocScanTab = 'id_front' | 'id_back' | 'dl_front' | 'dl_back' | 'photo' | 'driver_holding_id';

export const AuditInspectionWorkspace: React.FC<AuditInspectionWorkspaceProps> = ({
  candidate,
  onApproveGreenSignal,
  onRaiseQuery,
  reviewerName = 'Program Officer',
  isSeniorManager = false,
  onSmFinalApproval,
  onReturnToPo
}) => {
  const [activeDocTab, setActiveDocTab] = useState<DocScanTab>('id_front');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  // Raise Query Modal State
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [queryField, setQueryField] = useState<AuditQuery['field']>('Name Mismatch');
  const [queryComment, setQueryComment] = useState('');
  const [queryError, setQueryError] = useState('');

  // Return to PO Modal State (for Senior Manager)
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnRemarks, setReturnRemarks] = useState('');
  const [returnError, setReturnError] = useState('');

  // Image zoom & rotate controls
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.75));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleOpenQueryModal = () => {
    setQueryComment('');
    setQueryError('');
    setIsQueryModalOpen(true);
  };

  const handleConfirmRaiseQuery = () => {
    if (!queryComment.trim()) {
      setQueryError('Mandatory remark: Please describe the document defect or mismatch.');
      return;
    }
    if (onRaiseQuery) {
      onRaiseQuery(candidate.id, queryField, queryComment.trim());
    }
    setIsQueryModalOpen(false);
  };

  // Get active scan URL based on selected tab
  const getScanUrl = () => {
    switch (activeDocTab) {
      case 'id_front':
        return candidate.idFrontUrl;
      case 'id_back':
        return candidate.idBackUrl;
      case 'dl_front':
        return candidate.dlFrontUrl;
      case 'dl_back':
        return candidate.dlBackUrl;
      case 'photo':
        return candidate.photoUrl;
      case 'driver_holding_id':
        return candidate.driverHoldingIdUrl || candidate.photoUrl;
      default:
        return candidate.idFrontUrl;
    }
  };

  const currentScanUrl = getScanUrl();
  const isApproved =
    candidate.status === 'PENDING_SM_REVIEW' ||
    candidate.status === 'Green Signal (Video Call)' ||
    candidate.status === 'Senior Manager QC Passed' ||
    candidate.status === 'APM QC Passed' ||
    candidate.status === 'APM_QC_PASSED' ||
    candidate.status === 'Certified & Dispatched' ||
    candidate.status === 'Approved by PO';

  const isSmApproved =
    candidate.status === 'APM_QC_PASSED' ||
    candidate.status === 'Senior Manager QC Passed' ||
    candidate.status === 'APM QC Passed' ||
    candidate.status === 'Certified & Dispatched';

  return (
    <div className="space-y-4">
      {/* Active Candidate Action Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              {isSeniorManager ? 'Senior Manager QC Workspace' : 'Audit Inspection Workspace'}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-xs text-slate-500">{candidate.registrationNumber}</span>
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
            {candidate.fullName} (S/O {candidate.fatherName})
          </h2>
          <p className="text-xs text-slate-500">
            Ingestion Method:{' '}
            <strong className="text-teal-900">{candidate.aadhaarIngestionMethod || '3-Way Ingestion'}</strong>
          </p>
        </div>

        {/* Dynamic Action Controls based on Senior Manager vs PO Role */}
        {isSeniorManager ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setReturnRemarks('');
                setReturnError('');
                setIsReturnModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <CornerUpLeft className="w-4 h-4 text-amber-700" />
              <span>Return to PO with Query</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onSmFinalApproval) {
                  onSmFinalApproval(candidate.id);
                } else {
                  onApproveGreenSignal(candidate.id);
                }
              }}
              disabled={isSmApproved}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all ${
                isSmApproved
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-95 cursor-pointer border border-emerald-600'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{isSmApproved ? '✓ QC Certified / Passed' : 'Final QC Approval / Pass'}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenQueryModal}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Raise Query</span>
            </button>

            <button
              type="button"
              onClick={() => onApproveGreenSignal(candidate.id)}
              disabled={isApproved}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all ${
                isApproved
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 cursor-pointer'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>
                {isApproved
                  ? candidate.status === 'PENDING_SM_REVIEW'
                    ? 'Forwarded to SM'
                    : 'Green Signal Active'
                  : 'Approve / Green Signal'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Discrepancy / Return Notification Banner */}
      {(candidate.status === 'RETURNED_TO_PO' || candidate.poCorrectionRemarks || candidate.rejectionReason) && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-950">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Correction Remarks from Senior Manager:</span>
            <p className="mt-0.5 text-amber-900">{candidate.poCorrectionRemarks || candidate.rejectionReason}</p>
            {candidate.returnedBy && (
              <span className="text-[10px] text-amber-700 font-medium block mt-1">
                Returned by: {candidate.returnedBy}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Side: Structured Form Data */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-teal-700" />
              <h3 className="font-extrabold text-slate-900 text-sm">
                1. Form Enrollment Data
              </h3>
            </div>
            <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
              {candidate.vehicleClass}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Personal & Demographics
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">Candidate Full Name:</span>
                  <span className="font-bold text-slate-900">{candidate.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Father's Name:</span>
                  <span className="font-bold text-slate-900">{candidate.fatherName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Mother's Name:</span>
                  <span className="font-bold text-slate-900">{candidate.motherName || 'Verified'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Date of Birth (DOB):</span>
                  <span className="font-bold font-mono text-slate-900">{candidate.dateOfBirth}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Gender & Status:</span>
                  <span className="font-bold text-slate-900">
                    {candidate.gender} • {candidate.maritalStatus || 'Married'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Religion & Caste:</span>
                  <span className="font-bold text-slate-900">
                    {candidate.religion || 'Hindu'} ({candidate.casteCategory || 'OBC'})
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-teal-50/50 p-3 rounded-2xl border border-teal-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800 block">
                Government Identity & Driving Licence
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block text-[11px]">Govt ID / Aadhaar:</span>
                  <span className="font-mono font-bold text-teal-950">{candidate.idCardNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">ABHA Health ID:</span>
                  <span className="font-mono font-bold text-teal-950">{candidate.abhaNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Driving Licence No:</span>
                  <span className="font-mono font-bold text-emerald-900">{candidate.dlNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">DL Expiry Date:</span>
                  <span className="font-mono font-bold text-slate-900">{candidate.dlExpiryDate}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Contact & Permanent Residential Address
              </span>
              <p className="text-slate-700 leading-snug">
                {candidate.address}, {candidate.city}, {candidate.state} - {candidate.pincode}
              </p>
              <div className="flex items-center gap-1.5 text-slate-600 pt-1 font-mono">
                <Phone className="w-3 h-3 text-teal-700" />
                <span>{candidate.mobileNumber}</span>
              </div>
            </div>
          </div>

          {/* Audit Queries Log on this candidate */}
          {candidate.queries && candidate.queries.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Audit Remarks & Queries History
              </span>
              <div className="space-y-1.5">
                {candidate.queries.map(q => (
                  <div
                    key={q.id}
                    className={`p-2 rounded-xl text-[11px] border ${
                      q.status === 'Open'
                        ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                        : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{q.field} ({q.status})</span>
                      <span className="text-[10px] font-mono">{q.createdAt}</span>
                    </div>
                    <p className="mt-0.5">{q.comment}</p>
                    {q.resolutionComment && (
                      <p className="mt-1 pt-1 border-t border-emerald-200 text-emerald-800 text-[10px]">
                        <strong>OSE Resolution:</strong> {q.resolutionComment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Uploaded ID & Driving Licence Scans */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-700" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  2. Uploaded Document Scans
                </h3>
              </div>

              {/* Image Viewer Toolbar */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1 text-slate-600 hover:text-slate-900"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1 text-slate-600 hover:text-slate-900"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRotate}
                  className="p-1 text-slate-600 hover:text-slate-900"
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-1.5 py-0.5 text-[10px] font-mono text-slate-600 hover:text-slate-900"
                  title="Reset"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
              </div>
            </div>

            {/* Document Selector Tabs */}
            <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => {
                  setActiveDocTab('id_front');
                  handleResetZoom();
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeDocTab === 'id_front'
                    ? 'bg-teal-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Aadhaar Front
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveDocTab('id_back');
                  handleResetZoom();
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeDocTab === 'id_back'
                    ? 'bg-teal-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Aadhaar Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveDocTab('dl_front');
                  handleResetZoom();
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeDocTab === 'dl_front'
                    ? 'bg-teal-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                DL Front
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveDocTab('dl_back');
                  handleResetZoom();
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeDocTab === 'dl_back'
                    ? 'bg-teal-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                DL Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveDocTab('photo');
                  handleResetZoom();
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  activeDocTab === 'photo'
                    ? 'bg-teal-800 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Live Photo
              </button>
            </div>

            {/* Scan Display Canvas with Zoom & Rotate */}
            <div className="relative border border-slate-200 rounded-2xl bg-slate-900/5 min-h-[340px] max-h-[420px] flex items-center justify-center overflow-hidden p-2">
              {currentScanUrl && currentScanUrl.trim() !== '' ? (
                <div
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transition: 'transform 0.15s ease-out'
                  }}
                  className="max-w-full max-h-[380px] flex items-center justify-center"
                >
                  <img
                    src={currentScanUrl || undefined}
                    alt="Document Scan"
                    className="max-h-[360px] w-auto object-contain rounded-xl shadow-md border border-slate-300 bg-white"
                  />
                </div>
              ) : (
                <div className="text-center p-8 text-slate-400 text-xs">
                  <Eye className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Document scan preview unavailable for this field.
                </div>
              )}
            </div>
          </div>

          {/* Audit Checklist Guidance */}
          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-[11px] text-emerald-950 space-y-1">
            <span className="font-extrabold flex items-center gap-1.5 text-emerald-900">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              PO Inspection Verification Checklist
            </span>
            <p className="text-emerald-800">
              Verify candidate spelling matches the DL card, vehicle class authorization is valid for commercial transport, and DOB agrees with Aadhaar.
            </p>
          </div>
        </div>
      </div>

      {/* Raise Query Modal */}
      {isQueryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-700">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-base text-slate-900">Raise Audit Query to OSE</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQueryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Select Defect Field</label>
                <select
                  value={queryField}
                  onChange={(e) => setQueryField(e.target.value as AuditQuery['field'])}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="Name Mismatch">Name Mismatch between DL & Aadhaar</option>
                  <option value="DL Front">Driving Licence Front Image Blurry / Incomplete</option>
                  <option value="DL Back">Driving Licence Back Issue / Missing Class</option>
                  <option value="ID Front">Aadhaar Front Unreadable</option>
                  <option value="ID Back">Aadhaar Back Address Mismatch</option>
                  <option value="ABHA Mismatch">ABHA Health ID Mismatch</option>
                  <option value="Photo Blurry">Candidate Live Face Photo Unclear</option>
                  <option value="Other">Other Discrepancy</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Specific Observation Remarks <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail the exact issue so the OSE operator can rectify and re-submit..."
                  value={queryComment}
                  onChange={(e) => {
                    setQueryComment(e.target.value);
                    if (queryError) setQueryError('');
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
                />
                {queryError && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold">{queryError}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsQueryModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRaiseQuery}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Query to OSE</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return to PO Modal (for Senior Manager) */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CornerUpLeft className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Return Candidate to PO Queue
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-amber-900">
                <p className="font-semibold">Candidate: {candidate.fullName} ({candidate.registrationNumber})</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  This will transition candidate status back to <strong>RETURNED_TO_PO / PENDING_PO_REVIEW</strong> and flag the issue for the Program Officer to rectify.
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Mandatory Correction Remarks / Discrepancy Reason <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Specify why this candidate failed secondary QC inspection (e.g. blur DL scan, signature mismatch)..."
                  value={returnRemarks}
                  onChange={(e) => {
                    setReturnRemarks(e.target.value);
                    if (returnError) setReturnError('');
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none font-medium"
                />
                {returnError && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold">{returnError}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!returnRemarks.trim()) {
                    setReturnError('Mandatory remark: Please explain the discrepancy for the Program Officer.');
                    return;
                  }
                  if (onReturnToPo) {
                    onReturnToPo(candidate.id, returnRemarks.trim());
                  }
                  setIsReturnModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm Return to PO</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditInspectionWorkspace;
