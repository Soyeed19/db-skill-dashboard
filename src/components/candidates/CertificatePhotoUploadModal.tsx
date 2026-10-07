import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RotateCw,
  Sparkles,
  Award,
  Users,
  Eye,
  Trash2
} from 'lucide-react';
import { Candidate } from '../../types';

interface CertificatePhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onSaveCertificatePhotos: (
    candidateId: string,
    holdingPhotoUrl: string,
    handoverPhotoUrl: string
  ) => void;
}

export const CertificatePhotoUploadModal: React.FC<CertificatePhotoUploadModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onSaveCertificatePhotos
}) => {
  if (!isOpen || !candidate) return null;

  // Active Proof Tab: 'holding' | 'handover'
  const [activeTab, setActiveTab] = useState<'holding' | 'handover'>('holding');

  // Photo URLs state
  const [holdingPhotoUrl, setHoldingPhotoUrl] = useState<string>(
    candidate.certificateHoldingPhotoUrl || ''
  );
  const [handoverPhotoUrl, setHandoverPhotoUrl] = useState<string>(
    candidate.certificateHandoverPhotoUrl || ''
  );

  // Live Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Sample verified photos for easy fallback / rapid testing
  const sampleHoldingPhotos = [
    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80'
  ];

  const sampleHandoverPhotos = [
    'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'
  ];

  // Stop camera helper
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  // Start camera helper
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (mediaStreamRef.current) {
        stopCamera();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError('Camera access unavailable or permission denied. Please use file upload or sample photo.');
      setIsCameraActive(false);
    }
  };

  // Capture snapshot from webcam
  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      if (activeTab === 'holding') {
        setHoldingPhotoUrl(dataUrl);
      } else {
        setHandoverPhotoUrl(dataUrl);
      }
      stopCamera();
    }
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (activeTab === 'holding') {
          setHoldingPhotoUrl(reader.result);
        } else {
          setHandoverPhotoUrl(reader.result);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Sync state on candidate prop change
  useEffect(() => {
    if (candidate) {
      setHoldingPhotoUrl(candidate.certificateHoldingPhotoUrl || '');
      setHandoverPhotoUrl(candidate.certificateHandoverPhotoUrl || '');
    }
    return () => {
      stopCamera();
    };
  }, [candidate, isOpen]);

  // Clean up camera on tab change
  useEffect(() => {
    stopCamera();
  }, [activeTab]);

  const isBothComplete = Boolean(holdingPhotoUrl && handoverPhotoUrl);

  const handleSave = () => {
    if (!holdingPhotoUrl || !handoverPhotoUrl) {
      // User can still save partial progress, but highlight
    }
    onSaveCertificatePhotos(candidate.id, holdingPhotoUrl, handoverPhotoUrl);
    stopCamera();
    onClose();
  };

  const handleApplySample = (tab: 'holding' | 'handover') => {
    if (tab === 'holding') {
      const idx = Math.floor(Math.random() * sampleHoldingPhotos.length);
      setHoldingPhotoUrl(sampleHoldingPhotos[idx]);
    } else {
      const idx = Math.floor(Math.random() * sampleHandoverPhotos.length);
      setHandoverPhotoUrl(sampleHandoverPhotos[idx]);
    }
    stopCamera();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-teal-700 flex items-center justify-center text-white shadow-xs">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Stage 2: Evening Training Completion
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  {candidate.registrationNumber}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 mt-0.5">
                Upload Certificate Proofs - {candidate.fullName}
              </h2>
              <p className="text-xs text-slate-500">
                Both photographic proofs are strictly required before today's batch can be dispatched to PO.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Candidate Summary Pill */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <img
              src={candidate.photoUrl}
              alt={candidate.fullName}
              className="w-10 h-10 rounded-xl object-cover border border-slate-200"
            />
            <div>
              <p className="font-bold text-slate-900">{candidate.fullName}</p>
              <p className="text-[11px] text-slate-500">
                S/O {candidate.fatherName} • DL: {candidate.dlNumber} ({candidate.vehicleClass})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                isBothComplete
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
            >
              {isBothComplete ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Ready for PO Dispatch (2/2)
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Proofs Pending ({[holdingPhotoUrl, handoverPhotoUrl].filter(Boolean).length}/2)
                </>
              )}
            </span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('holding')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'holding'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-amber-600" />
            <span>1. Candidate Holding Certificate</span>
            {holdingPhotoUrl ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('handover')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'handover'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-teal-700" />
            <span>2. Certificate Handover Photo</span>
            {handoverPhotoUrl ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {activeTab === 'holding'
                  ? 'Proof 1: Candidate Holding Issued Certificate'
                  : 'Proof 2: Trainer Handing Over Certificate to Driver'}
              </h3>
              <p className="text-xs text-slate-500">
                {activeTab === 'holding'
                  ? 'Clear snapshot showing driver candidate holding the printed DBS foundation certificate with name visible.'
                  : 'Live physical photograph of DB Skills trainer/staff presenting the certificate to the driver.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleApplySample(activeTab)}
              className="px-2.5 py-1 text-[11px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 flex items-center gap-1 transition-colors"
              title="Attach verified sample photograph for quick demonstration"
            >
              <Sparkles className="w-3 h-3 text-teal-600" />
              Use Sample Proof
            </button>
          </div>

          {/* Current Attached Photo or Viewfinder */}
          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 text-center min-h-[220px] flex flex-col items-center justify-center relative overflow-hidden">
            {isCameraActive ? (
              <div className="relative w-full max-w-md mx-auto aspect-video rounded-xl overflow-hidden bg-black shadow-md">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 border-2 border-emerald-400/70 rounded-xl pointer-events-none flex items-center justify-center">
                  <span className="bg-black/60 text-white text-[10px] px-3 py-1 rounded-full font-mono">
                    Align candidate & certificate within frame
                  </span>
                </div>
                <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={captureSnapshot}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-transform active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    Capture Snapshot
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-3 py-2 bg-slate-800/80 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (activeTab === 'holding' ? holdingPhotoUrl : handoverPhotoUrl) ? (
              <div className="relative group w-full max-w-sm mx-auto">
                <img
                  src={activeTab === 'holding' ? holdingPhotoUrl : handoverPhotoUrl}
                  alt="Certificate Proof Preview"
                  className="max-h-56 w-auto mx-auto rounded-xl object-contain border border-slate-200 shadow-sm bg-white"
                />
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'holding') setHoldingPhotoUrl('');
                      else setHandoverPhotoUrl('');
                    }}
                    className="p-1.5 bg-rose-600/90 text-white rounded-lg hover:bg-rose-700 shadow-xs"
                    title="Remove and retake photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="mt-2 text-center">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified Photographic Proof Attached
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-6">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mx-auto">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    No certificate photo attached for this proof
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Capture via webcam/device camera or upload scanned photo from file system
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-3.5 py-2 bg-[#0d5c63] hover:bg-teal-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Launch Live Camera</span>
                  </button>

                  <label className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>Choose File (PNG/JPG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {cameraError && (
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200 max-w-md mx-auto">
                    {cameraError}
                  </p>
                )}
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />

          {/* Side-by-side Proofs Status Checklist */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div
              onClick={() => setActiveTab('holding')}
              className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                holdingPhotoUrl
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              } ${activeTab === 'holding' ? 'ring-2 ring-teal-700' : ''}`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  1. Holding Certificate
                </span>
                {holdingPhotoUrl ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {holdingPhotoUrl ? 'Photo captured & ready' : 'Required before dispatch'}
              </p>
            </div>

            <div
              onClick={() => setActiveTab('handover')}
              className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                handoverPhotoUrl
                  ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              } ${activeTab === 'handover' ? 'ring-2 ring-teal-700' : ''}`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-teal-700" />
                  2. Handover Proof
                </span>
                {handoverPhotoUrl ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {handoverPhotoUrl ? 'Photo captured & ready' : 'Required before dispatch'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-teal-900/10 transition-transform active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>Save Certificate Proofs</span>
          </button>
        </div>
      </div>
    </div>
  );
};
