import React, { useState } from 'react';
import {
  X,
  FileDown,
  Award,
  CheckCircle,
  AlertTriangle,
  Building,
  User,
  ShieldCheck,
  Send,
  MessageSquare,
  QrCode
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Candidate, AuditQuery } from '../../types';
import {
  generateCandidateDossierPdf,
  generateTrainingCertificatePdf
} from '../../utils/pdfGenerator';

interface DossierViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
}

export const DossierViewerModal: React.FC<DossierViewerModalProps> = ({
  isOpen,
  onClose,
  candidateId
}) => {
  const {
    candidates,
    activeCenter,
    batches,
    currentPersona,
    grantGreenSignal,
    approveApmQc,
    dispatchCandidate,
    raiseAuditQuery,
    resolveAuditQuery
  } = useApp();

  const [activeDossierPage, setActiveDossierPage] = useState<1 | 2 | 3>(1);
  const [showQueryBox, setShowQueryBox] = useState(false);
  const [queryField, setQueryField] = useState<AuditQuery['field']>('DL Back');
  const [queryComment, setQueryComment] = useState('');
  const [resolveText, setResolveText] = useState('');
  const [selectedQueryToResolve, setSelectedQueryToResolve] = useState<string | null>(null);

  const candidate = candidates.find(c => c.id === candidateId);
  if (!isOpen || !candidate) return null;

  const currentBatch = batches.find(b => b.id === candidate.batchId);
  const batchCode = currentBatch?.batchCode || 'DBS-RJ01-2609-B1';

  const handleDownloadDossier = () => {
    generateCandidateDossierPdf(candidate, activeCenter.name, batchCode);
  };

  const handleDownloadCertificate = () => {
    generateTrainingCertificatePdf(candidate, activeCenter.name, currentBatch?.trainerName || 'Vikram Singh Rathore');
  };

  const handleRaiseQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryComment.trim()) return;
    raiseAuditQuery(candidate.id, queryField, queryComment);
    setQueryComment('');
    setShowQueryBox(false);
  };

  const handleResolve = (queryId: string) => {
    if (!resolveText.trim()) return;
    resolveAuditQuery(candidate.id, queryId, resolveText);
    setResolveText('');
    setSelectedQueryToResolve(null);
  };

  const isPo = currentPersona.role === 'PO' || currentPersona.role === 'GM';
  const isApm = currentPersona.role === 'Senior Manager' || currentPersona.role === 'GM';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 overflow-y-auto">
      <div className="bg-white rounded-sm border border-slate-300 shadow-md w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 my-4">
        {/* Top Bar */}
        <div className="bg-[#007A3D] text-white px-5 py-3 flex items-center justify-between shrink-0 border-b border-[#005C2E]">
          <div className="flex items-center gap-3">
            <img
              src={candidate.photoUrl}
              alt={candidate.fullName}
              className="w-10 h-10 rounded-xs object-cover border border-white/40"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  3-Page Official Candidate Dossier
                </span>
                <span className="text-white/40">•</span>
                <span className="text-xs font-mono text-white/90">{candidate.registrationNumber}</span>
              </div>
              <h3 className="text-base font-bold flex items-center gap-2">
                {candidate.fullName}
                <span className="text-[10px] font-semibold px-2 py-0.2 rounded-xs bg-black/20 text-white border border-white/20">
                  {candidate.status}
                </span>
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadDossier}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1.5 transition-colors shadow-xs"
              title="Download 3-page PDF archival dossier"
            >
              <FileDown className="w-4 h-4 text-emerald-300" />
              Download 3-Page Dossier PDF
            </button>

            {candidate.status === 'Certified & Dispatched' && (
              <button
                onClick={handleDownloadCertificate}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 transition-colors shadow-xs font-bold"
                title="Download 1-Day Driver Training Certificate"
              >
                <Award className="w-4 h-4" />
                Certificate PDF
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Page Switcher Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveDossierPage(1)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeDossierPage === 1
                  ? 'bg-[#0d5c63] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Page 1: Enrollment & Biometrics
            </button>

            <button
              onClick={() => setActiveDossierPage(2)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeDossierPage === 2
                  ? 'bg-[#0d5c63] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Page 2: Government ID & Live Proof
            </button>

            <button
              onClick={() => setActiveDossierPage(3)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeDossierPage === 3
                  ? 'bg-[#0d5c63] text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Page 3: Commercial DL & QC Audit
            </button>
          </div>

          <div className="flex items-center gap-2">
            {candidate.queries.some(q => q.status === 'Open') && (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Action Required: Open Query
              </span>
            )}
          </div>
        </div>

        {/* Main Document Content Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* ================= PAGE 1 VIEW ================= */}
          {activeDossierPage === 1 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                    Dossier Section 1 of 3
                  </span>
                  <h4 className="text-base font-bold text-slate-900">
                    Candidate Enrollment Particulars & Biometric Record
                  </h4>
                </div>
                <div className="text-right font-mono text-xs text-slate-500">
                  <p>Batch: {batchCode}</p>
                  <p>Enrolled: {candidate.enrolledAt}</p>
                </div>
              </div>

              {/* Bio Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Photo & QR */}
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <img
                    src={candidate.photoUrl}
                    alt={candidate.fullName}
                    className="w-32 h-40 object-cover rounded-lg shadow-sm border-2 border-white mb-3"
                  />
                  <span className="text-xs font-bold text-slate-900">{candidate.fullName}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{candidate.registrationNumber}</span>
                  <div className="mt-3 flex items-center gap-1 text-[11px] text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-200">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>UIDAI Match: 99.8%</span>
                  </div>
                </div>

                {/* Details */}
                <div className="md:col-span-2 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block mb-0.5">Father's / Guardian Name</span>
                      <span className="font-bold text-slate-800">{candidate.fatherName}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block mb-0.5">Date of Birth & Gender</span>
                      <span className="font-bold text-slate-800">
                        {candidate.dateOfBirth} ({candidate.gender})
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block mb-0.5">Mobile Contact (10-Digit)</span>
                      <span className="font-bold text-slate-800 font-mono">+91 {candidate.mobileNumber}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block mb-0.5">ABHA Health Account (14-Digit)</span>
                      <span className="font-bold text-slate-800 font-mono">{candidate.abhaNumber}</span>
                    </div>

                    <div className="col-span-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block mb-0.5">Permanent Address</span>
                      <span className="font-bold text-slate-800">
                        {candidate.address}, {candidate.city}, {candidate.state} - {candidate.pincode}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block mb-0.5">T-Shirt Size Preference</span>
                      <span className="font-bold text-slate-800">Size {candidate.tshirtSize || 'L'}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-slate-400 block mb-0.5">Welcome Kit (Bag, Blanket, Cap)</span>
                      <span className="font-bold text-emerald-700">
                        {candidate.kitIssued ? '✓ Issued at Enrollment' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {/* Assessment scores */}
                  <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-teal-900">1-Day Safety Knowledge Evaluation</h5>
                      <p className="text-[11px] text-teal-700">Pre-training baseline vs post-training mastery score</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center px-3 py-1 bg-white rounded-lg border border-teal-200">
                        <span className="text-[10px] text-slate-400 block">Pre-Test</span>
                        <span className="text-xs font-bold text-slate-800">{candidate.preTestScore}%</span>
                      </div>
                      <div className="text-center px-3 py-1 bg-emerald-600 text-white rounded-lg shadow-xs">
                        <span className="text-[10px] text-emerald-100 block">Post-Test</span>
                        <span className="text-xs font-bold">{candidate.postTestScore}% (PASSED)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= PAGE 2 VIEW ================= */}
          {activeDossierPage === 2 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                    Dossier Section 2 of 3
                  </span>
                  <h4 className="text-base font-bold text-slate-900">
                    Government Identity (Aadhaar / National ID) & Biometric Proof
                  </h4>
                </div>
                <div className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                  ID: {candidate.idCardNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3')}
                </div>
              </div>

              {/* Scans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* ID Front */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">1. ID Card Front Scan</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      OCR Extracted
                    </span>
                  </div>
                  <div className="relative rounded-lg overflow-hidden border border-slate-300 aspect-video bg-slate-900 flex items-center justify-center">
                    <img
                      src={candidate.idFrontUrl}
                      alt="ID Front Scan"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                      NAME MATCH: 100%
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Extracted text matches applicant name: <strong className="text-slate-800">{candidate.fullName}</strong>
                  </p>
                </div>

                {/* ID Back */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">2. ID Card Back Scan</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Address Proof
                    </span>
                  </div>
                  <div className="relative rounded-lg overflow-hidden border border-slate-300 aspect-video bg-slate-900 flex items-center justify-center">
                    <img
                      src={candidate.idBackUrl}
                      alt="ID Back Scan"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                      PINCODE: {candidate.pincode}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Pincode and residential address cross-referenced with local district registry.
                  </p>
                </div>
              </div>

              {/* Driver Holding ID Proof */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-teal-700" />
                    3. Live Classroom Proof: Driver Holding Physical ID Card
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Fraud Prevention Certified
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-4 rounded-lg overflow-hidden border border-slate-300 h-36 bg-slate-900">
                    <img
                      src={candidate.driverHoldingIdUrl || candidate.photoUrl}
                      alt="Driver Holding ID"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="md:col-span-8 space-y-2 text-xs">
                    <p className="text-slate-700 leading-relaxed">
                      This photo confirms in-person physical presence of the driver at the training facility,
                      preventing proxy attendance or fraudulent document submission.
                    </p>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 space-y-1 font-mono text-[11px]">
                      <div className="text-emerald-700 font-bold">✓ Visual Facial Biometric Match: PASSED</div>
                      <div className="text-slate-600">Geo-tagging: {activeCenter.name} ({activeCenter.city})</div>
                      <div className="text-slate-600">Captured by Trainer: {currentBatch?.trainerName}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= PAGE 3 VIEW ================= */}
          {activeDossierPage === 3 && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                    Dossier Section 3 of 3
                  </span>
                  <h4 className="text-base font-bold text-slate-900">
                    Commercial Driving Licence & Multi-Tier Quality Audit
                  </h4>
                </div>
                <div className="text-xs font-mono font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-lg border border-teal-200">
                  DL: {candidate.dlNumber} ({candidate.vehicleClass})
                </div>
              </div>

              {/* DL Scans */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Commercial DL Front</span>
                  <div className="rounded-lg overflow-hidden border border-slate-300 aspect-video bg-slate-900">
                    <img
                      src={candidate.dlFrontUrl}
                      alt="DL Front"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Validity: <strong className="text-slate-800">{candidate.dlExpiryDate}</strong> • Vehicle Class:{' '}
                    <strong className="text-slate-800">{candidate.vehicleClass}</strong>
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                  <span className="text-xs font-bold text-slate-800 block">Commercial DL Back</span>
                  <div className="rounded-lg overflow-hidden border border-slate-300 aspect-video bg-slate-900">
                    <img
                      src={candidate.dlBackUrl}
                      alt="DL Back"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Hazardous materials badge and heavy commercial endorsements verified.
                  </p>
                </div>
              </div>

              {/* Multi-Tier Approval Chain Summary */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Verification & Dispatch Audit Trail
                </h5>

                <div className="space-y-2.5 text-xs">
                  {/* Step 1: PO Green Signal */}
                  <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          candidate.greenSignalAt
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        PO
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          Green Signal for Video Verification Call (Program Officer)
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          {candidate.greenSignalAt
                            ? `Authorized by ${candidate.greenSignalBy} on ${candidate.greenSignalAt}`
                            : 'Pending PO Document Scrutiny & Approval'}
                        </p>
                      </div>
                    </div>
                    {candidate.greenSignalAt && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Signal Granted
                      </span>
                    )}
                  </div>

                  {/* Step 2: Senior Manager QC Clearance */}
                  <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          candidate.apmApprovedAt
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        SM
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          Secondary Quality Check (Senior Manager)
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          {candidate.apmApprovedAt
                            ? `Approved by ${candidate.apmApprovedBy} on ${candidate.apmApprovedAt}`
                            : 'Awaiting video call verification & Senior Manager final review'}
                        </p>
                      </div>
                    </div>
                    {candidate.apmApprovedAt && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        QC Passed
                      </span>
                    )}
                  </div>

                  {/* Step 3: Central Certification & Dispatch */}
                  <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          candidate.status === 'Certified & Dispatched'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        HQ
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">
                          Official Certificate Assignment & Sponsor Dispatch
                        </p>
                        <p className="text-slate-500 text-[11px]">
                          {candidate.certificateNumber
                            ? `Certificate Assigned: ${candidate.certificateNumber} (Dispatched: ${candidate.dispatchedAt || 'Today'})`
                            : 'Pending final dispatch trigger'}
                        </p>
                      </div>
                    </div>
                    {candidate.certificateNumber && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                        Dispatched
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audit Queries Panel (Always visible if queries exist) */}
          {candidate.queries.length > 0 && (
            <div className="mt-6 border border-amber-300 bg-amber-50/70 rounded-xl p-4 space-y-3">
              <h5 className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Audit Discrepancies & Raised Queries ({candidate.queries.length})
              </h5>

              <div className="space-y-3">
                {candidate.queries.map(q => (
                  <div
                    key={q.id}
                    className="p-3 bg-white rounded-lg border border-amber-200 text-xs space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                          {q.field}
                        </span>
                        <span className="text-slate-500">
                          Raised by {q.raisedByName} ({q.raisedByRole}) on {q.createdAt}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          q.status === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {q.status}
                      </span>
                    </div>

                    <p className="text-slate-800 font-medium">{q.comment}</p>

                    {q.status === 'Resolved' ? (
                      <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900">
                        <span className="font-bold">Resolution: </span>
                        {q.resolutionComment} ({q.resolvedAt})
                      </div>
                    ) : (
                      <div>
                        {selectedQueryToResolve === q.id ? (
                          <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
                            <input
                              type="text"
                              placeholder="Enter resolution notes (e.g. Scanned fresh high-res copy from original card)..."
                              value={resolveText}
                              onChange={e => setResolveText(e.target.value)}
                              className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-teal-600"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleResolve(q.id)}
                                className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500"
                              >
                                Mark Resolved
                              </button>
                              <button
                                onClick={() => setSelectedQueryToResolve(null)}
                                className="px-2.5 py-1 rounded-lg text-xs text-slate-500 hover:text-slate-800"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedQueryToResolve(q.id)}
                            className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline"
                          >
                            Resolve this query
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Query Form (PO / APM only) */}
          {showQueryBox && (
            <form onSubmit={handleRaiseQuery} className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
                  Raise Audit Flag / Query on Candidate Record
                </h5>
                <button
                  type="button"
                  onClick={() => setShowQueryBox(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Field</label>
                  <select
                    value={queryField}
                    onChange={e => setQueryField(e.target.value as AuditQuery['field'])}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="DL Back">DL Back (Blurry / Endorsement missing)</option>
                    <option value="DL Front">DL Front (Validity / Name)</option>
                    <option value="ID Front">Gov ID Front</option>
                    <option value="ID Back">Gov ID Back (Address text)</option>
                    <option value="Name Mismatch">Name Mismatch across IDs</option>
                    <option value="ABHA Mismatch">ABHA Mismatch</option>
                    <option value="Photo Blurry">Driver Photo Blurry</option>
                    <option value="Other">Other Discrepancy</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Audit Remark / Instructions</label>
                  <input
                    type="text"
                    placeholder="Describe discrepancy clearly for OSE to remedy..."
                    value={queryComment}
                    onChange={e => setQueryComment(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white focus:outline-rose-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Submit Flag to OSE
              </button>
            </form>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {/* Raise query button for PO/APM */}
            {(isPo || isApm) && !showQueryBox && (
              <button
                onClick={() => setShowQueryBox(true)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Raise Audit Query
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Step 1: PO Green Signal Action */}
            {isPo && candidate.status !== 'Green Signal (Video Call)' && candidate.status !== 'APM QC Passed' && candidate.status !== 'Certified & Dispatched' && (
              <button
                onClick={() => grantGreenSignal(candidate.id)}
                disabled={candidate.queries.some(q => q.status === 'Open')}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                Grant Green Signal for Video Call
              </button>
            )}

            {/* Step 2: Senior Manager QC Clearance */}
            {isApm && candidate.status === 'Green Signal (Video Call)' && (
              <button
                onClick={() => approveApmQc(candidate.id)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-800 text-white hover:bg-teal-700 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                Approve Senior Manager Secondary QC
              </button>
            )}

            {/* Step 3: Dispatch & Certify */}
            {(isApm || isPo) && (candidate.status === 'Senior Manager QC Passed' || candidate.status === 'APM QC Passed') && (
              <button
                onClick={() => dispatchCandidate(candidate.id)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-700 text-white hover:bg-emerald-600 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                Certify & Dispatch to Sponsor
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Close Dossier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
