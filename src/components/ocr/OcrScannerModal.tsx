import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Upload,
  RotateCcw,
  Check,
  CreditCard,
  Truck,
  Sparkles,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { processCardImage, preprocessCardCanvas, ExtractedCardData } from '../../hooks/useCardOcr';

export interface OcrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  docType: 'DL' | 'AADHAAR';
  onScanComplete: (extracted: ExtractedCardData, imageBase64: string) => void;
}

export const OcrScannerModal: React.FC<OcrScannerModalProps> = ({
  isOpen,
  onClose,
  docType,
  onScanComplete
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Capture & OCR states
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [extractedData, setExtractedData] = useState<ExtractedCardData | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Start live webcam stream
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        stopCamera();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      setCameraError('Unable to access camera. Please allow webcam permissions or upload an image file.');
      setIsCameraActive(false);
    }
  };

  // Lifecycle control
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'camera') {
        startCamera();
      }
    } else {
      stopCamera();
      setCapturedImage(null);
      setExtractedData(null);
      setIsProcessing(false);
      setProgress(0);
      setWarningMessage(null);
      setOcrError(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode]);

  // Flip camera facing mode
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Snap photo and run real Tesseract OCR
  const handleSnapPhoto = async () => {
    if (!videoRef.current) return;
    try {
      setIsProcessing(true);
      setProgress(10);
      setStatusText('Capturing high-resolution camera frame...');
      setOcrError(null);

      // Preprocess image on canvas with contrast & grayscale enhancement
      const preprocessedBase64 = preprocessCardCanvas(videoRef.current);
      setCapturedImage(preprocessedBase64);

      // Stop camera stream once captured
      stopCamera();

      // Run real Tesseract OCR
      const result = await processCardImage(preprocessedBase64, docType, (pct, status) => {
        setProgress(pct);
        setStatusText(status);
      });

      setExtractedData(result.data);
      if (result.warning) {
        setWarningMessage(result.warning);
      }
      setIsProcessing(false);
    } catch (err: any) {
      setIsProcessing(false);
      setOcrError(`OCR extraction failed: ${err.message || 'Could not parse text'}`);
    }
  };

  // Handle file upload fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setProgress(10);
      setStatusText('Reading file into image memory...');
      setOcrError(null);

      const reader = new FileReader();
      reader.onload = async () => {
        const rawBase64 = reader.result as string;
        setCapturedImage(rawBase64);

        // Run real Tesseract OCR
        const result = await processCardImage(rawBase64, docType, (pct, status) => {
          setProgress(pct);
          setStatusText(status);
        });

        setExtractedData(result.data);
        if (result.warning) {
          setWarningMessage(result.warning);
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsProcessing(false);
      setOcrError(`Error parsing uploaded file: ${err.message}`);
    }
  };

  // Reset & retake
  const handleRetake = () => {
    setCapturedImage(null);
    setExtractedData(null);
    setWarningMessage(null);
    setOcrError(null);
    setIsProcessing(false);
    setProgress(0);
    if (activeTab === 'camera') {
      startCamera();
    }
  };

  // Confirm & apply extracted values
  const handleApply = () => {
    if (extractedData && capturedImage) {
      onScanComplete(extractedData, capturedImage);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-xs ${
              docType === 'DL' ? 'bg-cyan-800 text-white' : 'bg-emerald-800 text-white'
            }`}>
              {docType === 'DL' ? <Truck className="w-5 h-5 text-cyan-300" /> : <CreditCard className="w-5 h-5 text-emerald-300" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  {docType === 'DL' ? 'Driving Licence (DL) Camera OCR' : 'UIDAI Aadhaar Card Camera OCR'}
                </h3>
                <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  Live Tesseract.js
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {docType === 'DL'
                  ? 'Real-time camera extraction of DL Number and Expiry Date with validation'
                  : 'Real-time optical extraction of 12-digit Aadhaar UID and Demographics'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection: Live Camera vs File Upload */}
        {!capturedImage && !isProcessing && (
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('camera')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'camera'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-teal-700" />
              <span>Live Webcam Feed</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'upload'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-teal-700" />
              <span>Upload Card Image</span>
            </button>
          </div>
        )}

        {/* CAMERA VIEWPORT WITH ALIGNMENT OVERLAY */}
        {activeTab === 'camera' && !capturedImage && !isProcessing && (
          <div className="space-y-3">
            <div className="relative w-full aspect-16/10 max-h-[380px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
              {/* Actual Video Element */}
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* CARD ALIGNMENT GUIDE OVERLAY */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                {/* Translucent Backdrop Mask */}
                <div className="w-[85%] max-w-[440px] aspect-16/10 rounded-2xl border-2 border-dashed border-cyan-400/90 shadow-[0_0_0_9999px_rgba(2,6,23,0.55)] relative flex items-center justify-center">
                  {/* Corner Target Markers */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-3 border-l-3 border-cyan-300 rounded-tl-lg" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-3 border-r-3 border-cyan-300 rounded-tr-lg" />
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-3 border-l-3 border-cyan-300 rounded-bl-lg" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-3 border-r-3 border-cyan-300 rounded-br-lg" />

                  {/* Laser Beam Animation */}
                  <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-[bounce_2.5s_infinite]" />

                  {/* Alignment Prompt */}
                  <div className="bg-slate-950/70 backdrop-blur-xs text-white text-[11px] font-bold px-3 py-1 rounded-full border border-white/20 tracking-wide text-center">
                    Align {docType === 'DL' ? 'Driving Licence' : 'Aadhaar'} Flat in Box
                  </div>
                </div>
              </div>

              {/* Camera Error Message */}
              {cameraError && (
                <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
                  <AlertCircle className="w-10 h-10 text-rose-500" />
                  <p className="text-xs text-rose-200 font-medium max-w-sm">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 rounded-xl bg-teal-800 text-white font-bold text-xs"
                  >
                    Switch to File Upload
                  </button>
                </div>
              )}

              {/* Floating Camera Controls */}
              {isCameraActive && (
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleFacingMode}
                    className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 text-xs flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer"
                    title="Flip Camera"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">Flip</span>
                  </button>
                </div>
              )}
            </div>

            {/* Snap Action Button */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Real-time on-device regex extraction
              </span>
              <button
                type="button"
                onClick={handleSnapPhoto}
                disabled={!isCameraActive}
                className="px-6 py-3 rounded-2xl bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4 text-emerald-300" />
                <span>Capture & Run Optical OCR</span>
              </button>
            </div>
          </div>
        )}

        {/* FILE UPLOAD VIEWPORT */}
        {activeTab === 'upload' && !capturedImage && !isProcessing && (
          <div className="space-y-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-teal-700 bg-slate-50 hover:bg-teal-50/30 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3"
            >
              <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 mx-auto flex items-center justify-center">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="font-extrabold text-slate-800 text-sm">
                  Click to select {docType === 'DL' ? 'Driving Licence' : 'Aadhaar Card'} photo
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports JPEG, PNG, or WebP. Preprocessed for high-contrast OCR recognition.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* PROCESSING LOADER WITH PROGRESS */}
        {isProcessing && (
          <div className="p-8 text-center space-y-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-teal-800 text-emerald-300 mx-auto flex items-center justify-center animate-pulse">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1.5 max-w-sm mx-auto">
              <h4 className="font-extrabold text-slate-900 text-sm">
                Optical Engine Processing...
              </h4>
              <p className="text-xs text-slate-600 font-mono">{statusText || 'Executing Tesseract recognition...'}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden max-w-md mx-auto">
              <div
                className="bg-gradient-to-r from-teal-700 to-emerald-500 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-500 block">
              {progress}% Completed
            </span>
          </div>
        )}

        {/* EXTRACTED RESULTS REVIEW & VALIDATION */}
        {capturedImage && !isProcessing && extractedData && (
          <div className="space-y-4">
            {/* Split View: Photo Thumbnail + Extracted Card Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              {/* Photo Preview */}
              <div className="rounded-xl overflow-hidden border border-slate-300 bg-black max-h-[160px] flex items-center justify-center">
                <img
                  src={capturedImage}
                  alt="Scanned ID Card"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Data Summary Grid */}
              <div className="sm:col-span-2 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="font-extrabold text-slate-800 uppercase tracking-wide text-[11px]">
                    Extracted Fields ({docType})
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                    ✓ Parsed
                  </span>
                </div>

                {docType === 'DL' && (
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-sans text-slate-400 font-bold block">DL Number</span>
                      <strong className="text-cyan-900 font-bold text-xs">{extractedData.dlNumber || 'Not Detected'}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-sans text-slate-400 font-bold block">Expiry Date</span>
                      <strong className={`font-bold text-xs ${extractedData.isExpired ? 'text-rose-700' : 'text-slate-900'}`}>
                        {extractedData.expiryDate || 'Not Detected'}
                      </strong>
                    </div>
                    {extractedData.vehicleClass && (
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-sans text-slate-400 font-bold block">Vehicle Class</span>
                        <strong className="text-slate-800 font-bold text-xs">{extractedData.vehicleClass}</strong>
                      </div>
                    )}
                    {extractedData.name && (
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-sans text-slate-400 font-bold block">Holder Name</span>
                        <strong className="text-slate-800 font-bold text-xs truncate block">{extractedData.name}</strong>
                      </div>
                    )}
                  </div>
                )}

                {docType === 'AADHAAR' && (
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-sans text-slate-400 font-bold block">Aadhaar UID</span>
                      <strong className="text-emerald-900 font-bold text-xs">{extractedData.aadhaarNumber || 'Not Detected'}</strong>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-sans text-slate-400 font-bold block">Date of Birth</span>
                      <strong className="text-slate-900 font-bold text-xs">{extractedData.dob || 'Not Detected'}</strong>
                    </div>
                    {extractedData.gender && (
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-sans text-slate-400 font-bold block">Gender</span>
                        <strong className="text-slate-800 font-bold text-xs">{extractedData.gender}</strong>
                      </div>
                    )}
                    {extractedData.name && (
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-sans text-slate-400 font-bold block">Holder Name</span>
                        <strong className="text-slate-800 font-bold text-xs truncate block">{extractedData.name}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* DL EXPIRED WARNING BANNER (CRITICAL REQUIREMENT) */}
            {docType === 'DL' && extractedData.isExpired && (
              <div className="p-3.5 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-black text-rose-800 uppercase tracking-wide block">
                    ⚠️ EXPIRED DRIVING LICENCE: This licence expired on {extractedData.expiryDate}.
                  </strong>
                  <p className="text-[11px] text-rose-700 font-medium">
                    Renewal required before batch enrollment. Candidate will be flagged and blocked from active dispatch until a valid driving licence is provided.
                  </p>
                </div>
              </div>
            )}

            {/* DL EXPIRING SOON BANNER */}
            {docType === 'DL' && extractedData.isExpiringSoon && !extractedData.isExpired && (
              <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="font-black text-amber-800 uppercase tracking-wide block">
                    ⚠️ EXPIRING SOON: Licence expires within 30 days ({extractedData.expiryDate}).
                  </strong>
                  <p className="text-[11px] text-amber-700 font-medium">
                    Please notify the candidate to initiate license renewal with their Regional Transport Office (RTO).
                  </p>
                </div>
              </div>
            )}

            {/* OCR Notice if no fields detected */}
            {!extractedData.dlNumber && !extractedData.aadhaarNumber && !extractedData.expiryDate && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Text was faint or blurred. You can still apply the photo as audit proof and enter details manually, or click Rescan.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rescan / Retake</span>
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex-1 max-w-sm px-6 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Apply Extracted Data to Form</span>
              </button>
            </div>
          </div>
        )}

        {/* Global OCR Error */}
        {ocrError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{ocrError}</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default OcrScannerModal;
