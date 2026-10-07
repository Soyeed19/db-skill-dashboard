import React, { useState, useRef, useEffect } from 'react';
import {
  Wrench,
  X,
  Camera,
  Upload,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';

export interface ReportCenterIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportingTrainerName: string;
  centerName: string;
  centerCode?: string;
  poName?: string;
  onSubmit: (ticketData: {
    category: string;
    title: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    photoUrl?: string;
  }) => void;
}

export const ReportCenterIssueModal: React.FC<ReportCenterIssueModalProps> = ({
  isOpen,
  onClose,
  reportingTrainerName,
  centerName,
  centerCode,
  poName,
  onSubmit
}) => {
  const [issueCategory, setIssueCategory] = useState('Water Filter / RO');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issuePriority, setIssuePriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  // Camera & File upload state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  // Cleanup camera stream when closing modal or unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // When modal closes, reset camera and error
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
    }
  }, [isOpen]);

  // Start Live Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (mediaStreamRef.current) {
        stopCamera();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError('Camera access unavailable or permission denied. Please choose an image file from your device.');
      setIsCameraActive(false);
    }
  };

  // Capture Snapshot from Camera Feed
  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPhotoUrl(dataUrl);
      stopCamera();
    }
  };

  // File Picker Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  // Sample Defect Photo for Testing / Fallback
  const handleUseSamplePhoto = () => {
    // High-resolution realistic facility maintenance defect photo
    setPhotoUrl('https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=800&q=80');
    stopCamera();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim() || !issueDescription.trim()) {
      return;
    }

    onSubmit({
      category: issueCategory,
      title: issueTitle.trim(),
      description: issueDescription.trim(),
      priority: issuePriority,
      photoUrl: photoUrl.trim() || undefined
    });

    // Reset fields
    setIssueTitle('');
    setIssueDescription('');
    setIssuePriority('Medium');
    setPhotoUrl('');
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-teal-700" />
            <h3 className="font-extrabold text-slate-900 text-sm">
              Report Center Facility & Maintenance Issue
            </h3>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block">Reporting Trainer</span>
              <strong className="text-slate-800">{reportingTrainerName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block">Center Location</span>
              <strong className="text-slate-800">
                {centerName} {centerCode ? `(${centerCode})` : ''}
              </strong>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Issue Category</label>
            <select
              value={issueCategory}
              onChange={(e) => setIssueCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-700"
            >
              <option value="Water Filter / RO">Water Filter / RO (Drinking Water)</option>
              <option value="CCTV & Security">CCTV & Security Cameras</option>
              <option value="Classroom Projector / Audio">Classroom Projector / Audio / Mic</option>
              <option value="Electricity / AC">Electricity / AC / Inverter / Lighting</option>
              <option value="Sanitation / Washroom">Sanitation / Washroom / Plumbing</option>
              <option value="Other">Other Center Facility Defect</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Issue Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Water Filter Leaking / Low Pressure"
              value={issueTitle}
              onChange={(e) => setIssueTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Detailed Description of Defect</label>
            <textarea
              rows={3}
              required
              placeholder="Explain the exact operational defect and how it impacts driver training..."
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Priority / Urgency Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(['Low', 'Medium', 'High'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setIssuePriority(p)}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                    issuePriority === p
                      ? p === 'High'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : p === 'Medium'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-teal-700 text-white border-teal-700'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {p === 'High' ? 'High / Urgent' : p}
                </button>
              ))}
            </div>
          </div>

          {/* PHOTO PROOF: DIRECT FILE UPLOAD & LIVE CAMERA SNAPSHOT */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700">Photo Proof of Defect</label>
              <span className="text-[10px] text-slate-400 font-medium">Optional but recommended</span>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Hidden canvas for video frame capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* View 1: When photo is already attached */}
            {photoUrl ? (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 max-h-48 flex items-center justify-center">
                  <img
                    src={photoUrl}
                    alt="Defect Proof Preview"
                    className="w-full h-44 object-contain"
                  />
                  <div className="absolute top-2 left-2 bg-emerald-600/90 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Photo Proof Attached</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Replace Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoUrl('');
                      startCamera();
                    }}
                    className="flex-1 py-1.5 px-2.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-teal-700" />
                    <span>Retake via Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : isCameraActive ? (
              /* View 2: Live Camera View */
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-700 space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-black flex items-center justify-center min-h-[180px]">
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-rose-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white"></span>
                    <span>Live Camera Active</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={captureSnapshot}
                    className="flex-1 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors text-xs"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Snapshot</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* View 3: Default File Picker or Camera Option */
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-600 bg-slate-50 hover:bg-teal-50/40 text-slate-700 flex flex-col items-center justify-center gap-1.5 transition-all text-center group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Upload className="w-4 h-4 text-teal-700" />
                    </div>
                    <span className="font-bold text-xs text-slate-800">Upload Image File</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG, or Device Gallery</span>
                  </button>

                  <button
                    type="button"
                    onClick={startCamera}
                    className="p-3 rounded-2xl border-2 border-dashed border-slate-300 hover:border-teal-600 bg-slate-50 hover:bg-teal-50/40 text-slate-700 flex flex-col items-center justify-center gap-1.5 transition-all text-center group"
                  >
                    <div className="w-8 h-8 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Camera className="w-4 h-4 text-teal-700" />
                    </div>
                    <span className="font-bold text-xs text-slate-800">Take Live Photo</span>
                    <span className="text-[10px] text-slate-400">Open Center Camera</span>
                  </button>
                </div>

                {cameraError && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-[11px] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span>{cameraError}</span>
                      <button
                        type="button"
                        onClick={handleUseSamplePhoto}
                        className="block mt-1 font-bold text-teal-700 hover:underline"
                      >
                        Use Sample Defect Proof Image Instead
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
            <p className="font-bold">Workflow Step 1 of 3:</p>
            <p className="mt-0.5">
              Submitting this ticket routes it immediately to Program Officer ({poName || 'Pooja Verma'})
              for on-site physical endorsement before reaching Senior Manager.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold transition-colors shadow-xs"
            >
              Submit Ticket to PO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
