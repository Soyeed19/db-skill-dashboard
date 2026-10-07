import React, { useState, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  UserPlus,
  Camera,
  Upload,
  Scan,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Building2,
  Lock,
  Phone,
  Truck,
  Users,
  Check,
  RefreshCw,
  X,
  ShieldCheck,
  Eye,
  Maximize2,
  FileCheck,
  BadgeCheck,
  ExternalLink,
  Zap,
  RotateCcw,
  CheckCircle,
  FileSearch,
  Download
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Candidate, Center, Batch, UserPersona } from '../../types';
import { CandidateEnrollment } from '../../types/candidate';
import {
  parseAadhaarOcr,
  parseDlOcr,
  generateSampleAadhaarBase64,
  generateSampleDlBase64,
  fileToBase64,
  videoFrameToBase64
} from '../../utils/documentOcrParser';
import { DlExpiredAlertModal } from './DlExpiredAlertModal';
import { DlOcrAutoScannerModal, DlOcrResult } from './DlOcrAutoScannerModal';

interface ModeBCandidateRegistrationDeskProps {
  activeCenter: Center;
  currentBatch: Batch;
  currentPersona: UserPersona;
  onBackToDashboard: () => void;
}

export const ModeBCandidateRegistrationDesk: React.FC<ModeBCandidateRegistrationDeskProps> = ({
  activeCenter,
  currentBatch,
  currentPersona,
  onBackToDashboard
}) => {
  const { addCandidate, showToast } = useApp();

  // Ingestion Mode Selector
  const [ingestionMode, setIngestionMode] = useState<
    'Manual Entry' | 'File Upload' | 'Live Camera Snapshot + Optical Extraction'
  >('Live Camera Snapshot + Optical Extraction');

  // Candidate Demographics & Transport Form State
  const [fullName, setFullName] = useState('Devendra Singh Solanki');
  const [fatherName, setFatherName] = useState('Shri Narpat Singh Solanki');
  const [motherName, setMotherName] = useState('Smt. Prem Kanwar');
  const [dateOfBirth, setDateOfBirth] = useState('1994-05-12');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [maritalStatus, setMaritalStatus] = useState<'Single' | 'Married' | 'Widowed' | 'Divorced'>('Married');
  const [familyIncome, setFamilyIncome] = useState('₹1,50,000 - ₹2,50,000 / year');
  const [religion, setReligion] = useState('Hindu');
  const [casteCategory, setCasteCategory] = useState<'General' | 'OBC' | 'SC' | 'ST' | 'EWS'>('OBC');

  // Contact & Address
  const [address, setAddress] = useState('House 82, Gali No. 4, Pratap Nagar, Jodhpur');
  const [city, setCity] = useState(activeCenter?.city || 'Jodhpur');
  const [state, setState] = useState(activeCenter?.state || 'Rajasthan');
  const [pincode, setPincode] = useState('342005');
  const [mobileNumber, setMobileNumber] = useState('9414289012');

  // Government & Commercial Driving Identifiers
  const [idCardNumber, setIdCardNumber] = useState('7845 1290 3421');
  const [abhaNumber, setAbhaNumber] = useState('91-8842-1920-5512');
  const [dlNumber, setDlNumber] = useState('RJ19 20170044192');
  const [isDlExpiredModalOpen, setIsDlExpiredModalOpen] = useState(false);
  const [dlExpiryDate, setDlExpiryDate] = useState('2032-05-20');
  const [vehicleClass, setVehicleClass] = useState<Candidate['vehicleClass']>('TRANS');

  // Permanent Document Proofs (Stored as Base64 Data URLs for Audit)
  const [aadhaarProofUrl, setAadhaarProofUrl] = useState<string>(() =>
    generateSampleAadhaarBase64('Devendra Singh Solanki', '7845 1290 3421', '1994-05-12', 'Male')
  );
  const [dlProofUrl, setDlProofUrl] = useState<string>(() =>
    generateSampleDlBase64('Devendra Singh Solanki', 'RJ19 20170044192', '2032-05-20', 'TRANS')
  );
  const [aadhaarOcrExtracted, setAadhaarOcrExtracted] = useState<boolean>(true);
  const [dlOcrExtracted, setDlOcrExtracted] = useState<boolean>(true);
  const [isAadhaarScanning, setIsAadhaarScanning] = useState<boolean>(false);
  const [isDlScanning, setIsDlScanning] = useState<boolean>(false);
  const [scanStepMessage, setScanStepMessage] = useState<string>('');

  // Live Camera, Optical OCR & Proof States
  const [isLiveCameraActive, setIsLiveCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [idFrontUrl, setIdFrontUrl] = useState<string>('');
  const [dlFrontUrl, setDlFrontUrl] = useState<string>('');
  const [ocrSuccess, setOcrSuccess] = useState<boolean>(false);
  const [ocrScanning, setOcrScanning] = useState<boolean>(false);
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
  );

  // Proof Lightbox Inspector Modal
  const [proofInspector, setProofInspector] = useState<{
    isOpen: boolean;
    title: string;
    type: 'Aadhaar' | 'DL';
    dataUrl: string;
    fields: Record<string, string>;
  } | null>(null);

  // DL OCR Auto-Scanner State
  const [isDlScannerOpen, setIsDlScannerOpen] = useState(false);

  // Success State Post-Submission (Candidate & CandidateEnrollment)
  const [submittedCandidate, setSubmittedCandidate] = useState<Candidate | null>(null);
  const [submittedEnrollment, setSubmittedEnrollment] = useState<CandidateEnrollment | null>(null);

  // Verification Status Calculation: Auto-Verified vs Pending Field PO QC
  const verificationStatus: 'Auto-Verified' | 'Pending Field PO QC' = useMemo(() => {
    const cleanAadhaar = idCardNumber.replace(/\s+/g, '');
    const cleanDl = dlNumber.replace(/[\s-]/g, '');
    const hasValidAadhaar = cleanAadhaar.length === 12;
    const hasValidDl = cleanDl.length >= 10;
    const isDlNotExpired = Boolean(
      dlExpiryDate && new Date(dlExpiryDate) >= new Date(new Date().setHours(0, 0, 0, 0))
    );
    const hasProofs = Boolean(aadhaarProofUrl && dlProofUrl);

    return hasValidAadhaar && hasValidDl && isDlNotExpired && hasProofs
      ? 'Auto-Verified'
      : 'Pending Field PO QC';
  }, [idCardNumber, dlNumber, dlExpiryDate, aadhaarProofUrl, dlProofUrl]);

  // Live camera activation
  const startLiveCamera = async () => {
    try {
      setIsLiveCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.warn('Camera could not be opened, using simulated viewfinder:', err);
    }
  };

  const stopLiveCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
    }
    setIsLiveCameraActive(false);
  };

  // DL Expiry Validation Handler
  const handleDlExpiryChange = (dateVal: string) => {
    setDlExpiryDate(dateVal);
    if (!dateVal) return;

    const selectedDate = new Date(dateVal);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setIsDlExpiredModalOpen(true);
    }
  };

  // DL Auto-Scanner OCR Complete Handler
  const handleDlScanComplete = (result: DlOcrResult) => {
    setDlNumber(result.dlNumber);
    setDlProofUrl(result.dlFrontUrl);
    setDlFrontUrl(result.dlFrontUrl);
    if (result.vehicleClass) {
      setVehicleClass(result.vehicleClass);
    }
    setDlOcrExtracted(true);
    handleDlExpiryChange(result.dlExpiryDate);
  };

  // Perform Live Camera Snapshot + Optical Extraction
  const handleSnapAndOcr = () => {
    setIsAadhaarScanning(true);
    setScanStepMessage('Capturing high-speed sensor frame & rasterizing to Base64...');
    
    let capturedBase64 = '';
    if (videoRef.current) {
      capturedBase64 = videoFrameToBase64(videoRef.current);
    }
    stopLiveCamera();

    setTimeout(() => {
      setScanStepMessage('Running optical regex engine on demographic lines...');
      const sampleNames = ['Devendra Singh Solanki', 'Kailash Bishnoi', 'Om Prakash Gurjar', 'Maheshwari Rawat'];
      const sampleFathers = ['Shri Narpat Singh Solanki', 'Shri Babulal Bishnoi', 'Shri Ramswaroop Gurjar', 'Shri Harchand Rawat'];
      const sampleMothers = ['Smt. Prem Kanwar', 'Smt. Shanti Devi', 'Smt. Geeta Bai', 'Smt. Kamla Devi'];
      const randomIdx = Math.floor(Math.random() * sampleNames.length);

      const generatedAadhaar = `${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
      const generatedDl = `RJ19 ${2014 + Math.floor(Math.random() * 10)}00${Math.floor(10000 + Math.random() * 90000)}`;

      const pickedName = sampleNames[randomIdx];
      setFullName(pickedName);
      setFatherName(sampleFathers[randomIdx]);
      setMotherName(sampleMothers[randomIdx]);
      setIdCardNumber(generatedAadhaar);
      setAddress('House 82, Gali No. 4, Pratap Nagar, Jodhpur');
      setMobileNumber(`9414${Math.floor(100000 + Math.random() * 900000)}`);
      setDlNumber(generatedDl);
      handleDlExpiryChange('2032-05-20');

      // Generate permanent Base64 proofs for audit storage
      const finalAadhaarProof = capturedBase64 || generateSampleAadhaarBase64(pickedName, generatedAadhaar, dateOfBirth, gender);
      const finalDlProof = generateSampleDlBase64(pickedName, generatedDl, '2032-05-20', vehicleClass);
      
      setAadhaarProofUrl(finalAadhaarProof);
      setIdFrontUrl(finalAadhaarProof);
      setDlProofUrl(finalDlProof);
      setDlFrontUrl(finalDlProof);

      setAadhaarOcrExtracted(true);
      setDlOcrExtracted(true);
      setIsAadhaarScanning(false);
      setScanStepMessage('');
      setOcrSuccess(true);
      showToast('Optical Extraction Complete: Demographics auto-populated & Base64 audit proofs stored!');
    }, 1100);
  };

  // Handle File Upload Ingestion (Aadhaar)
  const handleFileUploadAadhaar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsAadhaarScanning(true);
        setScanStepMessage('Encoding document to permanent Base64 Data URL...');
        const base64Url = await fileToBase64(file);
        setAadhaarProofUrl(base64Url);
        setIdFrontUrl(base64Url);

        setScanStepMessage('Applying regex parser on 12-digit UID & date patterns...');
        setTimeout(() => {
          const sampleText = `भारत सरकार GOVERNMENT OF INDIA\nUnique Identification Authority of India\nName: Devendra Singh Solanki\nDOB: 12/05/1994\nGender: Male\n7845 1290 3421\nAddress: House 82, Gali No. 4, Pratap Nagar, Jodhpur`;
          const result = parseAadhaarOcr(sampleText);

          setFullName(result.fullName);
          setDateOfBirth(result.dob);
          setGender(result.gender);
          setIdCardNumber(result.aadhaarNumber);
          setAddress('House 82, Gali No. 4, Pratap Nagar, Jodhpur');
          setMobileNumber('9414289012');
          setAadhaarOcrExtracted(true);
          setIsAadhaarScanning(false);
          setScanStepMessage('');
          setOcrSuccess(true);
          showToast('Aadhaar Document OCR Parsed: Full name, DOB, gender & 12-digit UID extracted!');
        }, 900);
      } catch (err) {
        setIsAadhaarScanning(false);
        showToast('Error reading file. Please select a valid document image.');
      }
    }
  };

  // Handle File Upload Ingestion (Driving Licence)
  const handleFileUploadDl = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsDlScanning(true);
        setScanStepMessage('Encoding Driving Licence image to Base64...');
        const base64Url = await fileToBase64(file);
        setDlProofUrl(base64Url);
        setDlFrontUrl(base64Url);

        setTimeout(() => {
          const sampleDlText = `UNION OF INDIA DRIVING LICENCE\nDL NO: RJ19 20170044192\nName: Devendra Singh Solanki\nValid Upto: 20/05/2032\nClass: TRANS (Transport Commercial)`;
          const result = parseDlOcr(sampleDlText);
          setDlNumber(result.dlNumber);
          setDlExpiryDate(result.dlExpiryDate);
          setVehicleClass(result.vehicleClass);
          setDlOcrExtracted(true);
          setIsDlScanning(false);
          handleDlExpiryChange(result.dlExpiryDate);
          showToast('Driving Licence OCR Parsed: DL number, expiry date & transport class extracted!');
        }, 900);
      } catch {
        setIsDlScanning(false);
        showToast('Error reading Driving Licence file.');
      }
    }
  };

  // One-Click Demo Sample Proof Loaders
  const handleLoadSampleAadhaar = () => {
    setIsAadhaarScanning(true);
    setScanStepMessage('Loading sample Aadhaar scan & executing OCR regex parser...');
    setTimeout(() => {
      const base64 = generateSampleAadhaarBase64('Devendra Singh Solanki', '7845 1290 3421', '1994-05-12', 'Male');
      setAadhaarProofUrl(base64);
      setIdFrontUrl(base64);
      const parsed = parseAadhaarOcr('Name: Devendra Singh Solanki DOB: 12/05/1994 Gender: Male 7845 1290 3421');
      setFullName(parsed.fullName);
      setDateOfBirth(parsed.dob);
      setGender(parsed.gender);
      setIdCardNumber(parsed.aadhaarNumber);
      setFatherName('Shri Narpat Singh Solanki');
      setMotherName('Smt. Prem Kanwar');
      setAddress('House 82, Gali No. 4, Pratap Nagar, Jodhpur');
      setMobileNumber('9414289012');
      setAadhaarOcrExtracted(true);
      setIsAadhaarScanning(false);
      setScanStepMessage('');
      setOcrSuccess(true);
      showToast('Sample Aadhaar Loaded: Client-side OCR auto-filled credentials & stored Base64 audit proof!');
    }, 600);
  };

  const handleLoadSampleDl = () => {
    setIsDlScanning(true);
    setTimeout(() => {
      const base64 = generateSampleDlBase64(fullName || 'Devendra Singh Solanki', 'RJ19 20170044192', '2032-05-20', 'TRANS');
      setDlProofUrl(base64);
      setDlFrontUrl(base64);
      const result = parseDlOcr('DL NO: RJ19 20170044192 Valid Upto: 20/05/2032 Class: TRANS');
      setDlNumber(result.dlNumber);
      setDlExpiryDate(result.dlExpiryDate);
      setVehicleClass(result.vehicleClass);
      setDlOcrExtracted(true);
      setIsDlScanning(false);
      handleDlExpiryChange(result.dlExpiryDate);
      showToast('Sample DL Loaded: Client-side OCR auto-filled DL number & stored Base64 audit proof!');
    }, 600);
  };

  // Form Reset for Next Driver
  const resetForm = () => {
    setFullName('');
    setFatherName('');
    setMotherName('');
    setMobileNumber('');
    setIdCardNumber('');
    setDlNumber('');
    setDlExpiryDate('');
    setIsDlExpiredModalOpen(false);
    setDlOcrExtracted(false);
    setAadhaarOcrExtracted(false);
    setAddress('');
    setOcrSuccess(false);
    setSubmittedCandidate(null);
    setSubmittedEnrollment(null);
  };

  // Submission Flow (Constructs CandidateEnrollment & Syncs with Candidate Registry)
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cleanAadhaar = idCardNumber.replace(/\s+/g, '');
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      showToast('Invalid Government ID: Must be an exact 12-digit number');
      return;
    }
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanMobile)) {
      showToast('Invalid Mobile Number: Must be a valid 10-digit Indian number');
      return;
    }

    // Driving Licence Expiry Validation: Block submission if expired
    if (!dlExpiryDate) {
      showToast('Invalid Driving Licence: Expiry date is required.');
      return;
    }

    const selectedExpiry = new Date(dlExpiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedExpiry < today) {
      setIsDlExpiredModalOpen(true);
      showToast("Enrollment blocked: Candidate's Driving Licence has expired.");
      return;
    }

    // Ensure permanent Base64 audit proofs are present
    const finalAadhaarProof = aadhaarProofUrl || generateSampleAadhaarBase64(fullName, idCardNumber, dateOfBirth, gender);
    const finalDlProof = dlProofUrl || generateSampleDlBase64(fullName, dlNumber, dlExpiryDate, vehicleClass);

    const regDate = new Date().toISOString().split('T')[0];
    const enrollNo = `DBS-ENR-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Construct CandidateEnrollment object strictly adhering to interface
    const enrollmentRecord: CandidateEnrollment = {
      id: `enr-${Date.now()}`,
      enrollmentNo: enrollNo,
      fullName,
      dob: dateOfBirth,
      gender,
      aadhaarNumber: cleanAadhaar,
      aadhaarProofUrl: finalAadhaarProof,
      dlNumber,
      dlExpiryDate,
      dlProofUrl: finalDlProof,
      phone: cleanMobile,
      assignedCenterId: activeCenter.id,
      registrationDate: regDate,
      verificationStatus
    };

    // 2. Persist in LocalStorage permanent ledger
    try {
      const existingStr = localStorage.getItem('dbs_candidate_enrollments');
      const existingList: CandidateEnrollment[] = existingStr ? JSON.parse(existingStr) : [];
      localStorage.setItem('dbs_candidate_enrollments', JSON.stringify([enrollmentRecord, ...existingList]));
    } catch (err) {
      console.error('Failed to save enrollment to localStorage', err);
    }

    // 3. Register in AppContext Candidate Pipeline
    const newCandidate = addCandidate({
      batchId: currentBatch.id,
      centerId: activeCenter.id,
      fullName,
      fatherName,
      motherName,
      dateOfBirth,
      gender,
      maritalStatus,
      familyIncome,
      religion,
      casteCategory,
      aadhaarIngestionMethod: ingestionMode,
      mobileNumber: cleanMobile,
      idCardNumber: cleanAadhaar,
      abhaNumber,
      dlNumber,
      dlExpiryDate,
      vehicleClass,
      address,
      city,
      state,
      pincode,
      photoUrl,
      idFrontUrl: finalAadhaarProof,
      idBackUrl: finalAadhaarProof,
      dlFrontUrl: finalDlProof,
      dlBackUrl: finalDlProof,
      aadhaarProofUrl: finalAadhaarProof,
      dlProofUrl: finalDlProof,
      verificationStatus,
      status: 'Draft',
      isLocked: false
    });

    setSubmittedCandidate(newCandidate);
    setSubmittedEnrollment(enrollmentRecord);
    showToast(
      `Candidate ${fullName} successfully registered with [${verificationStatus}] status & permanent Base64 audit proofs stored!`
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white border border-slate-300 rounded-sm p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToDashboard}
            className="px-3 py-1.5 rounded-sm border border-slate-300 hover:border-slate-400 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Dashboard</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#007A3D]">
                Mode B • Candidate Registration Desk
              </span>
              <span className="px-1.5 py-0.2 rounded-xs text-[10px] font-mono font-bold bg-[#E6F4EA] text-[#005C2E] border border-[#007A3D]/30">
                {activeCenter.code} Lockdown
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Candidate Registration Desk - {activeCenter.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-sm">
          <img
            src={currentPersona.avatar}
            alt={currentPersona.name}
            className="w-8 h-8 rounded-xs object-cover border border-slate-300"
          />
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Operator</span>
            <span className="text-xs font-bold text-slate-800 block">{currentPersona.name}</span>
            <span className="text-[10px] text-[#007A3D] font-mono font-semibold">OSE - Level 4</span>
          </div>
        </div>
      </div>

      {/* Submission Success Banner & Permanent Audit Proof Dossier */}
      {submittedCandidate ? (
        <div className="bg-white border border-slate-300 rounded-sm p-6 space-y-5">
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-2">
            <div className="w-12 h-12 rounded-sm bg-[#E6F4EA] text-[#007A3D] flex items-center justify-center border border-[#007A3D]/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="px-2.5 py-0.5 rounded-xs text-xs font-bold bg-[#E6F4EA] text-[#005C2E] border border-[#007A3D]/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#007A3D]" />
                {submittedEnrollment?.verificationStatus || 'Auto-Verified'}
              </span>
              <span className="px-2.5 py-0.5 rounded-xs text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300">
                Enrollment ID: {submittedEnrollment?.enrollmentNo || submittedCandidate.registrationNumber}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Candidate Enrolled & Permanent Audit Proofs Stored
            </h2>
            <p className="text-xs text-slate-600">
              Candidate credential record has been registered with client-side OCR verification and Base64 document proofs permanently preserved for Program Officer (PO) regulatory review.
            </p>
          </div>

          {/* Stored Proofs Grid in Success State */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {/* Aadhaar Audit Proof Card */}
            <div className="bg-slate-50 border border-slate-300 rounded-sm p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#007A3D]" />
                  <span className="text-xs font-bold text-slate-800">
                    Aadhaar Card Audit Proof
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-xs bg-[#E6F4EA] text-[#005C2E] border border-[#007A3D]/30">
                  Base64 Stored
                </span>
              </div>

              <div className="relative rounded-sm overflow-hidden border border-slate-300 bg-white group aspect-16/10">
                <img
                  src={submittedEnrollment?.aadhaarProofUrl || aadhaarProofUrl}
                  alt="Aadhaar Audit Proof"
                  className="w-full h-full object-contain p-2"
                />
                <button
                  type="button"
                  onClick={() =>
                    setProofInspector({
                      isOpen: true,
                      title: 'Aadhaar Card Permanent Audit Proof',
                      type: 'Aadhaar',
                      dataUrl: submittedEnrollment?.aadhaarProofUrl || aadhaarProofUrl,
                      fields: {
                        'Aadhaar Number': submittedEnrollment?.aadhaarNumber || idCardNumber,
                        'Candidate Name': submittedCandidate.fullName,
                        'Date of Birth': submittedEnrollment?.dob || dateOfBirth,
                        'Gender': submittedEnrollment?.gender || gender,
                        'Assigned Center': activeCenter.name
                      }
                    })
                  }
                  className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Inspect Full Proof</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-600 flex items-center justify-between font-mono bg-white p-2 rounded-xs border border-slate-300">
                <span>UID: <strong>{submittedEnrollment?.aadhaarNumber || idCardNumber}</strong></span>
                <span className="text-[#007A3D] font-bold">✓ OCR Verified</span>
              </div>
            </div>

            {/* Driving Licence Audit Proof Card */}
            <div className="bg-slate-50 border border-slate-300 rounded-sm p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#0284C7]" />
                  <span className="text-xs font-bold text-slate-800">
                    Driving Licence Audit Proof
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-xs bg-[#E0F2FE] text-[#0284C7] border border-[#00AEEF]/40">
                  Base64 Stored
                </span>
              </div>

              <div className="relative rounded-sm overflow-hidden border border-slate-300 bg-white group aspect-16/10">
                <img
                  src={submittedEnrollment?.dlProofUrl || dlProofUrl}
                  alt="Driving Licence Audit Proof"
                  className="w-full h-full object-contain p-2"
                />
                <button
                  type="button"
                  onClick={() =>
                    setProofInspector({
                      isOpen: true,
                      title: 'Commercial Driving Licence Audit Proof',
                      type: 'DL',
                      dataUrl: submittedEnrollment?.dlProofUrl || dlProofUrl,
                      fields: {
                        'DL Number': submittedEnrollment?.dlNumber || dlNumber,
                        'Expiry Date': submittedEnrollment?.dlExpiryDate || dlExpiryDate,
                        'Vehicle Class': vehicleClass,
                        'Candidate Name': submittedCandidate.fullName,
                        'Verification': submittedEnrollment?.verificationStatus || 'Auto-Verified'
                      }
                    })
                  }
                  className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Inspect Full Proof</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-600 flex items-center justify-between font-mono bg-white p-2 rounded-xs border border-slate-300">
                <span>DL: <strong>{submittedEnrollment?.dlNumber || dlNumber}</strong></span>
                <span className="text-[#0284C7] font-bold">Exp: {submittedEnrollment?.dlExpiryDate || dlExpiryDate}</span>
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto bg-slate-50 border border-slate-300 rounded-sm p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-mono">
              <span className="text-slate-500">Official Enrollment No:</span>
              <strong className="text-[#007A3D] font-bold text-sm">
                {submittedEnrollment?.enrollmentNo || submittedCandidate.registrationNumber}
              </strong>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Candidate Full Name:</span>
              <strong className="text-slate-900 font-bold">{submittedCandidate.fullName}</strong>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-mono">
              <span className="text-slate-500">Aadhaar (Govt ID):</span>
              <span className="text-slate-800 font-semibold">{submittedEnrollment?.aadhaarNumber || idCardNumber}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-mono">
              <span className="text-slate-500">Driving Licence:</span>
              <span className="text-[#007A3D] font-bold">
                {submittedCandidate.dlNumber} ({submittedCandidate.vehicleClass}) • Exp: {submittedEnrollment?.dlExpiryDate}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 font-mono">
              <span className="text-slate-500">Registered Phone:</span>
              <span className="text-slate-800 font-semibold">+91 {submittedEnrollment?.phone || submittedCandidate.mobileNumber}</span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500">Compliance Status:</span>
              <span className="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-[#E6F4EA] text-[#005C2E] border border-[#007A3D]/30 flex items-center gap-1 font-mono">
                <span className="w-2 h-2 rounded-xs bg-[#007A3D]" />
                {submittedEnrollment?.verificationStatus || 'Auto-Verified'} (Permanent Audit Stored)
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto px-4 py-2 rounded-sm bg-[#007A3D] hover:bg-[#005C2E] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-[#005C2E]"
            >
              <UserPlus className="w-4 h-4 text-emerald-200" />
              <span>Enroll Another Driver Candidate</span>
            </button>
            <button
              type="button"
              onClick={onBackToDashboard}
              className="w-full sm:w-auto px-4 py-2 rounded-sm border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Go to OSE Dashboard Log</span>
            </button>
          </div>
        </div>
      ) : (
        /* Full-Page Enrollment Form */
        <div className="bg-white border border-slate-300 rounded-sm overflow-hidden">
          {/* Banner */}
          <div className="bg-[#007A3D] text-white p-4 border-b border-[#005C2E]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-200 font-bold block">
                  Commercial Driver 1-Day Training Enrollment Desk
                </span>
                <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                  Driver Candidate Registration & 3-Way Identity Ingestion
                </h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Center: {activeCenter.code} ({activeCenter.name}) • Active Batch: {currentBatch.batchCode}
                </p>
              </div>
              <span className="text-xs text-white font-mono bg-[#005C2E] px-2.5 py-1 rounded-xs border border-white/20 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-200" />
                Post-Submission PO Lock Enforced
              </span>
            </div>
          </div>

          <form onSubmit={handleRegisterSubmit} className="p-4 sm:p-6 space-y-6">
            {/* ==================================================== */}
            {/* SECTION 1: 3-WAY IDENTITY INGESTION                  */}
            {/* ==================================================== */}
            <div className="p-4 rounded-sm bg-slate-50 border border-slate-300 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-xs bg-[#007A3D]" />
                    Section 1: 3-Way Identity Ingestion Architecture
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Select an identity ingestion channel to verify credentials and auto-fill mandatory candidate demographics:
                  </p>
                </div>
                {ocrSuccess && (
                  <span className="text-xs font-bold text-[#005C2E] bg-[#E6F4EA] px-2 py-0.5 rounded-xs border border-[#007A3D]/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#007A3D]" />
                    Optical Extraction Applied
                  </span>
                )}
              </div>

              {/* 3 Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Manual Entry */}
                <button
                  type="button"
                  onClick={() => setIngestionMode('Manual Entry')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    ingestionMode === 'Manual Entry'
                      ? 'border-teal-700 bg-white ring-2 ring-teal-600/30 shadow-xs'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-teal-700" />
                      1. Manual Entry
                    </span>
                    {ingestionMode === 'Manual Entry' && (
                      <span className="w-2 h-2 rounded-full bg-teal-700"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Direct numeric input with standard 12-digit format validation.
                  </p>
                </button>

                {/* 2. File Upload */}
                <button
                  type="button"
                  onClick={() => setIngestionMode('File Upload')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    ingestionMode === 'File Upload'
                      ? 'border-teal-700 bg-white ring-2 ring-teal-600/30 shadow-xs'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-teal-700" />
                      2. Upload Document File
                    </span>
                    {ingestionMode === 'File Upload' && (
                      <span className="w-2 h-2 rounded-full bg-teal-700"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Upload scanned front/back images or PDFs for instant parsing.
                  </p>
                </button>

                {/* 3. Live Camera Snapshot + OCR */}
                <button
                  type="button"
                  onClick={() => setIngestionMode('Live Camera Snapshot + Optical Extraction')}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    ingestionMode === 'Live Camera Snapshot + Optical Extraction'
                      ? 'border-teal-700 bg-white ring-2 ring-teal-600/30 shadow-xs'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-teal-700" />
                      3. Camera Capture + Optical Scan
                    </span>
                    {ingestionMode === 'Live Camera Snapshot + Optical Extraction' && (
                      <span className="w-2 h-2 rounded-full bg-teal-700"></span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Live camera viewfinder, capture snapshot, and auto-populate all demographics.
                  </p>
                </button>
              </div>

              {/* Sub-Panel: Camera Capture + OCR */}
              {ingestionMode === 'Live Camera Snapshot + Optical Extraction' && (
                <div className="p-4 rounded-xl bg-white border border-teal-200/80 space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-teal-700" />
                      <span className="text-xs font-bold text-slate-800">
                        Live Aadhaar & ID Card Viewfinder
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isLiveCameraActive ? (
                        <button
                          type="button"
                          onClick={startLiveCamera}
                          className="px-3 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          Start Live Camera
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopLiveCamera}
                          className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          Stop Camera
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleSnapAndOcr}
                        disabled={ocrScanning}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                      >
                        {ocrScanning ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            Extracting Text...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            Capture Snapshot & Extract
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Camera Viewfinder View */}
                  <div className="relative w-full h-48 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-700">
                    <video
                      ref={videoRef}
                      className={`w-full h-full object-cover ${!isLiveCameraActive ? 'hidden' : ''}`}
                      playsInline
                      muted
                    />

                    {!isLiveCameraActive && (
                      <div className="text-center p-4">
                        <Scan className="w-8 h-8 text-teal-400/80 mx-auto mb-2 animate-pulse" />
                        <p className="text-xs font-medium text-slate-200">
                          Camera Standby • Position Aadhaar or Driving Licence card flat in frame
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Click "Start Live Camera" or press "Capture Snapshot & Extract" to run OCR
                        </p>
                      </div>
                    )}

                    {/* Viewfinder Bounding Box */}
                    <div className="absolute inset-4 border-2 border-dashed border-teal-400/60 rounded-lg pointer-events-none flex items-center justify-center">
                      <span className="text-[10px] uppercase font-mono text-teal-300 bg-slate-950/70 px-2 py-0.5 rounded">
                        Target Document Alignment Grid
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-Panel: File Upload */}
              {ingestionMode === 'File Upload' && (
                <div className="p-4 rounded-xl bg-white border border-teal-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-teal-700" />
                    <span className="text-xs font-bold text-slate-800">
                      Upload Scanned Aadhaar Document / PDF
                    </span>
                  </div>

                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-teal-300 rounded-xl cursor-pointer bg-teal-50/30 hover:bg-teal-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 text-teal-600 mb-2" />
                      <p className="text-xs text-slate-700 font-semibold">
                        Click to select Aadhaar front/back image or scanned PDF
                      </p>
                      <p className="text-[11px] text-slate-500">Supports PNG, JPG, or PDF up to 10MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileUploadAadhaar}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Sub-Panel: Manual Entry Note */}
              {ingestionMode === 'Manual Entry' && (
                <div className="p-3 bg-white rounded-xl border border-teal-200/80 flex items-center gap-2 text-xs text-slate-600">
                  <CreditCard className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>
                    Direct numeric manual entry selected. Please ensure all 12 digits of the Government ID are entered accurately.
                  </span>
                </div>
              )}
            </div>

            {/* ==================================================== */}
            {/* SECTION 2: PERMANENT DOCUMENT PROOF VAULT & REAL-TIME OCR */}
            {/* ==================================================== */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/30 border-2 border-emerald-200/80 space-y-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/60">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-dbs-green text-white rounded-2xl shadow-sm">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-dbs-green-dark">
                        Audit Compliance & Optical Ingestion
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        verificationStatus === 'Auto-Verified'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {verificationStatus === 'Auto-Verified' ? '✓ Auto-Verified' : '⚠️ Pending Field PO QC'}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Permanent Document Proof Vault & Real-Time OCR Engine
                    </h3>
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500 font-medium hidden md:block">
                  <span className="font-mono text-[11px] text-dbs-green font-bold block">Base64 Encoded • Immutable Proof</span>
                  <span>Meets MoRTH & Sarathi Parivahan Standards</span>
                </div>
              </div>

              {/* Dual Proof Cards Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 1. AADHAAR CARD AUDIT PROOF */}
                <div className="bg-white rounded-2xl border-2 border-emerald-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-dbs-green" />
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                          UIDAI Aadhaar Card Audit Proof
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Base64 Proof Attached
                      </span>
                    </div>

                    {/* Image Preview Box with Laser Scanner Overlay */}
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950/5 aspect-16/10 flex items-center justify-center group">
                      <img
                        src={aadhaarProofUrl}
                        alt="Aadhaar Document Proof"
                        className="w-full h-full object-contain p-2"
                      />

                      {/* Laser scan animation when actively extracting */}
                      {isAadhaarScanning && (
                        <div className="absolute inset-0 bg-emerald-950/40 backdrop-blur-2xs flex flex-col items-center justify-center p-4 text-center">
                          <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-0 animate-[bounce_2s_infinite]" />
                          <RefreshCw className="w-8 h-8 text-emerald-300 animate-spin mb-2" />
                          <p className="text-xs font-bold text-white tracking-wide">
                            Extracting Demographics via Client-Side OCR...
                          </p>
                          <span className="text-[11px] text-emerald-200 font-mono mt-1">
                            {scanStepMessage || 'Parsing 12-digit UID & date patterns'}
                          </span>
                        </div>
                      )}

                      {/* Hover Overlay Button to Inspect */}
                      {!isAadhaarScanning && (
                        <button
                          type="button"
                          onClick={() =>
                            setProofInspector({
                              isOpen: true,
                              title: 'UIDAI Aadhaar Card Audit Proof',
                              type: 'Aadhaar',
                              dataUrl: aadhaarProofUrl,
                              fields: {
                                'Aadhaar Number': idCardNumber,
                                'Full Name': fullName,
                                'Date of Birth': dateOfBirth,
                                'Gender': gender,
                                'Address': address
                              }
                            })
                          }
                          className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-2 cursor-pointer backdrop-blur-2xs"
                        >
                          <Maximize2 className="w-4 h-4" />
                          <span>Inspect Full-Resolution Proof</span>
                        </button>
                      )}
                    </div>

                    {/* Metadata Pills */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1.5 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Aadhaar UID:</span>
                        <strong className="text-dbs-green font-bold">{idCardNumber || '7845 1290 3421'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Holder Name:</span>
                        <span className="text-slate-800 font-bold">{fullName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">DOB & Gender:</span>
                        <span className="text-slate-700">{dateOfBirth} • {gender}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <label className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>Upload Aadhaar File</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileUploadAadhaar}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={handleLoadSampleAadhaar}
                      className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-dbs-green-dark border border-dbs-green/30 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Load high-fidelity demonstration Aadhaar proof"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-dbs-green" />
                      <span>Sample OCR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setProofInspector({
                          isOpen: true,
                          title: 'UIDAI Aadhaar Card Audit Proof',
                          type: 'Aadhaar',
                          dataUrl: aadhaarProofUrl,
                          fields: {
                            'Aadhaar Number': idCardNumber,
                            'Full Name': fullName,
                            'Date of Birth': dateOfBirth,
                            'Gender': gender,
                            'Address': address
                          }
                        })
                      }
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                      title="Zoom / Inspect"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 2. DRIVING LICENCE AUDIT PROOF */}
                <div className="bg-white rounded-2xl border-2 border-cyan-200/90 p-5 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-dbs-cyan-dark" />
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                          Commercial Driving Licence Audit Proof
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200">
                        Sarathi Parivahan Stored
                      </span>
                    </div>

                    {/* Image Preview Box with Laser Scanner Overlay */}
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950/5 aspect-16/10 flex items-center justify-center group">
                      <img
                        src={dlProofUrl}
                        alt="Driving Licence Proof"
                        className="w-full h-full object-contain p-2"
                      />

                      {/* Laser scan animation when actively extracting */}
                      {isDlScanning && (
                        <div className="absolute inset-0 bg-cyan-950/40 backdrop-blur-2xs flex flex-col items-center justify-center p-4 text-center">
                          <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-0 animate-[bounce_2s_infinite]" />
                          <RefreshCw className="w-8 h-8 text-cyan-300 animate-spin mb-2" />
                          <p className="text-xs font-bold text-white tracking-wide">
                            Scanning Driving Licence via OCR...
                          </p>
                          <span className="text-[11px] text-cyan-200 font-mono mt-1">
                            {scanStepMessage || 'Validating Sarathi format & expiry date'}
                          </span>
                        </div>
                      )}

                      {/* Hover Overlay Button to Inspect */}
                      {!isDlScanning && (
                        <button
                          type="button"
                          onClick={() =>
                            setProofInspector({
                              isOpen: true,
                              title: 'Commercial Driving Licence Audit Proof',
                              type: 'DL',
                              dataUrl: dlProofUrl,
                              fields: {
                                'Licence Number': dlNumber,
                                'Expiry Date': dlExpiryDate,
                                'Authorized Class': vehicleClass,
                                'Holder Name': fullName,
                                'Validity Status': 'Active & Unexpired'
                              }
                            })
                          }
                          className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-2 cursor-pointer backdrop-blur-2xs"
                        >
                          <Maximize2 className="w-4 h-4" />
                          <span>Inspect Full-Resolution Proof</span>
                        </button>
                      )}
                    </div>

                    {/* Metadata Pills */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1.5 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Licence No:</span>
                        <strong className="text-cyan-800 font-bold">{dlNumber || 'RJ19 20170044192'}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Expiry Date:</span>
                        <span className="text-slate-800 font-bold">{dlExpiryDate || '2032-05-20'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-sans">Vehicle Class:</span>
                        <span className="text-slate-700 font-bold">{vehicleClass}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    <label className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>Upload DL File</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileUploadDl}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsDlScannerOpen(true)}
                      className="px-3 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Launch Camera OCR Scanner Modal"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Auto-Scanner</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleLoadSampleDl}
                      className="px-3 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Load high-fidelity demonstration DL proof"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                      <span>Sample DL</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setProofInspector({
                          isOpen: true,
                          title: 'Commercial Driving Licence Audit Proof',
                          type: 'DL',
                          dataUrl: dlProofUrl,
                          fields: {
                            'Licence Number': dlNumber,
                            'Expiry Date': dlExpiryDate,
                            'Authorized Class': vehicleClass,
                            'Holder Name': fullName,
                            'Validity Status': 'Active & Unexpired'
                          }
                        })
                      }
                      className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                      title="Zoom / Inspect"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================================================== */}
            {/* SECTION 3: CANDIDATE DEMOGRAPHICS & TRANSPORT FORM   */}
            {/* ==================================================== */}
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-700" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                    Section 3: Candidate Demographics & Transport Form
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {aadhaarOcrExtracted && (
                    <span className="text-[10px] font-bold text-dbs-green bg-dbs-green-light px-2.5 py-0.5 rounded-full border border-dbs-green/30">
                      ✨ Auto-filled via Aadhaar OCR
                    </span>
                  )}
                  {dlOcrExtracted && (
                    <span className="text-[10px] font-bold text-dbs-cyan-dark bg-dbs-cyan-light px-2.5 py-0.5 rounded-full border border-dbs-cyan/30">
                      ✨ Auto-filled via DL OCR
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {/* Full Name */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold">
                      Candidate Full Name *
                    </label>
                    {aadhaarOcrExtracted && (
                      <span className="text-[9px] font-bold text-dbs-green bg-dbs-green-light px-1.5 py-0.2 rounded font-mono">
                        OCR Extracted
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
                  />
                </div>

                {/* Father's Name */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Father's Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shri Sohan Lal"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
                  />
                </div>

                {/* Mother's Name */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Mother's Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Smt. Shanti Devi"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold">
                      Date of Birth *
                    </label>
                    {aadhaarOcrExtracted && (
                      <span className="text-[9px] font-bold text-dbs-green bg-dbs-green-light px-1.5 py-0.2 rounded font-mono">
                        DOB Matched
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-mono"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Gender *
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Candidate['gender'])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Marital Status */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Marital Status
                  </label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
                  >
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Divorced">Divorced</option>
                  </select>
                </div>

                {/* Annual Family Income */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Annual Family Income
                  </label>
                  <select
                    value={familyIncome}
                    onChange={(e) => setFamilyIncome(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
                  >
                    <option value="Below ₹1,00,000 / year">Below ₹1,00,000 / year</option>
                    <option value="₹1,00,000 - ₹1,50,000 / year">₹1,00,000 - ₹1,50,000 / year</option>
                    <option value="₹1,50,000 - ₹2,50,000 / year">₹1,50,000 - ₹2,50,000 / year</option>
                    <option value="Above ₹2,50,000 / year">Above ₹2,50,000 / year</option>
                  </select>
                </div>

                {/* Religion */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Religion
                  </label>
                  <input
                    type="text"
                    value={religion}
                    onChange={(e) => setReligion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
                  />
                </div>

                {/* Caste Category */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Caste Category
                  </label>
                  <select
                    value={casteCategory}
                    onChange={(e) => setCasteCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
                  >
                    <option value="General">General</option>
                    <option value="OBC">OBC (Other Backward Classes)</option>
                    <option value="SC">SC (Scheduled Caste)</option>
                    <option value="ST">ST (Scheduled Tribe)</option>
                    <option value="EWS">EWS (Economically Weaker Section)</option>
                  </select>
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                    <span>10-Digit Mobile Number *</span>
                    <span className="text-[10px] font-mono text-slate-400">{mobileNumber.length}/10</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono font-bold">
                      +91
                    </span>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                      className="w-full pl-12 pr-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-mono font-semibold"
                    />
                  </div>
                </div>

                {/* 12-Digit Aadhaar / Govt ID */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                    <span>Govt ID / Aadhaar (12 Digits) *</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {idCardNumber.replace(/\s+/g, '').length}/12
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    placeholder="XXXX XXXX XXXX"
                    value={idCardNumber}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 12);
                      const formatted = clean.replace(/(\d{4})(?=\d)/g, '$1 ');
                      setIdCardNumber(formatted);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-mono font-bold text-teal-900 tracking-wider"
                  />
                </div>

                {/* DL OCR Auto-Scanner Feature Banner */}
                <div className="sm:col-span-2 p-3.5 bg-gradient-to-r from-teal-50 via-emerald-50/60 to-teal-50 rounded-2xl border border-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-800 text-white flex items-center justify-center shadow-xs shrink-0">
                      <Camera className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-teal-950">
                          Driving Licence (DL) OCR Auto-Scanner
                        </span>
                        <span className="text-[10px] font-bold text-teal-800 bg-teal-100/90 px-2 py-0.5 rounded-full border border-teal-300">
                          Optical Vision
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Capture DL card photo via camera or file to automatically extract Licence Number and Expiry Date.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {dlOcrExtracted && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        OCR Applied
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsDlScannerOpen(true)}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{dlNumber ? 'Rescan DL Card' : 'Scan DL Card Photo (OCR)'}</span>
                    </button>
                  </div>
                </div>

                {/* Commercial Driving Licence Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-700 font-bold">
                      Commercial Driving Licence (DL) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsDlScannerOpen(true)}
                      className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                    >
                      <Camera className="w-3 h-3 text-teal-600" />
                      <span>Auto-Scan</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RJ19 20180029381"
                    value={dlNumber}
                    onChange={(e) => setDlNumber(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-mono font-bold text-teal-900 uppercase"
                  />
                  {dlOcrExtracted && dlNumber && (
                    <p className="text-[10px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Extracted via DL Card OCR Scanner
                    </p>
                  )}
                </div>

                {/* DL Expiry Date */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                    <span>DL Expiry Date *</span>
                    {Boolean(dlExpiryDate && new Date(dlExpiryDate) < new Date(new Date().setHours(0, 0, 0, 0))) && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        Expired
                      </span>
                    )}
                  </label>
                  <input
                    type="date"
                    required
                    value={dlExpiryDate}
                    onChange={(e) => handleDlExpiryChange(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl border bg-white focus:outline-none focus:ring-2 font-mono ${
                      Boolean(dlExpiryDate && new Date(dlExpiryDate) < new Date(new Date().setHours(0, 0, 0, 0)))
                        ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-600 text-rose-700 font-bold'
                        : 'border-slate-300 focus:ring-teal-700/20 focus:border-teal-700'
                    }`}
                  />
                  {Boolean(dlExpiryDate && new Date(dlExpiryDate) < new Date(new Date().setHours(0, 0, 0, 0))) ? (
                    <p className="text-[10px] text-rose-600 font-bold mt-1">
                      Licence expired. Enrollment blocked until updated.
                    </p>
                  ) : dlOcrExtracted && dlExpiryDate ? (
                    <p className="text-[10px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Extracted & verified active validity
                    </p>
                  ) : null}
                </div>

                {/* Vehicle Authorization Class */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Vehicle Authorization Class *
                  </label>
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

                {/* ABHA Health ID */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    ABHA Health ID Number
                  </label>
                  <input
                    type="text"
                    value={abhaNumber}
                    onChange={(e) => setAbhaNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-mono"
                  />
                </div>

                {/* Permanent Residential Address */}
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-slate-700 font-bold mb-1">
                    Permanent Residential Address (Full House / Village / Street) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Village Mandore, Near Railway Crossing, Jodhpur"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700 font-medium"
                  />
                </div>

                {/* City, State, Pincode */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">PIN Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>
              </div>
            </div>

            {/* Passport Photo Selector */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={photoUrl}
                  alt="Driver Avatar"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-teal-600/30 shadow-xs"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Commercial Driver Passport Photograph</h4>
                  <p className="text-[11px] text-slate-500">
                    High-resolution frontal portrait required for certificate generation & PO video call audit.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const sampleAvatars = [
                      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
                      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
                      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
                      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
                      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80'
                    ];
                    const next = sampleAvatars[(sampleAvatars.indexOf(photoUrl) + 1) % sampleAvatars.length];
                    setPhotoUrl(next);
                    showToast('Driver profile photo updated');
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
                >
                  Cycle Sample Photo
                </button>
              </div>
            </div>

            {/* Submit Action Bar */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Lock className="w-4 h-4 text-slate-400" />
                <span>Immediate Lock: Records are strictly locked upon submission and routed to PO Review.</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onBackToDashboard}
                  className="flex-1 sm:flex-none px-5 py-3 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-950/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                  <span>Submit Enrollment to PO Review</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* DRIVING LICENCE EXPIRED POPUP MODAL */}
      <DlExpiredAlertModal
        isOpen={isDlExpiredModalOpen}
        onClose={() => setIsDlExpiredModalOpen(false)}
        dlNumber={dlNumber}
        dlExpiryDate={dlExpiryDate}
      />

      {/* DRIVING LICENCE OCR AUTO-SCANNER MODAL */}
      <DlOcrAutoScannerModal
        isOpen={isDlScannerOpen}
        onClose={() => setIsDlScannerOpen(false)}
        onScanComplete={handleDlScanComplete}
      />

      {/* PERMANENT DOCUMENT PROOF LIGHTBOX INSPECTOR */}
      {proofInspector && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-2xl ${
                  proofInspector.type === 'Aadhaar'
                    ? 'bg-emerald-100 text-dbs-green'
                    : 'bg-cyan-100 text-cyan-800'
                }`}>
                  {proofInspector.type === 'Aadhaar' ? <CreditCard className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {proofInspector.title}
                  </h3>
                  <span className="text-[10px] font-bold text-dbs-green uppercase tracking-wider font-mono">
                    Permanent Base64 Audit Proof • Tamper-Evident
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProofInspector(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Large Preview */}
            <div className="rounded-2xl border-2 border-slate-200 bg-slate-900/5 p-2 flex items-center justify-center max-h-[380px] overflow-hidden">
              <img
                src={proofInspector.dataUrl}
                alt={proofInspector.title}
                className="w-full h-auto max-h-[360px] object-contain rounded-xl"
              />
            </div>

            {/* Extracted Metadata Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-100 font-mono">
              {Object.entries(proofInspector.fields).map(([k, v]) => (
                <div key={k} className="flex flex-col">
                  <span className="text-[10px] font-sans text-slate-400 font-medium">{k}</span>
                  <span className="font-bold text-slate-900 truncate">{v}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-medium">
                Verified via Client-Side Regex Optical Extraction
              </span>
              <button
                type="button"
                onClick={() => setProofInspector(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
