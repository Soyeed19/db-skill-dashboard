import React, { useState, useRef, useMemo } from 'react';
import {
  UserPlus,
  Camera,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Phone,
  CreditCard,
  Truck,
  Scan,
  Sparkles,
  Share2,
  Users,
  Eye,
  Check,
  RefreshCw,
  X,
  FileCheck,
  Receipt,
  MapPin,
  Clock,
  Briefcase,
  Download,
  AlertTriangle,
  History,
  ShieldCheck,
  Send,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  BadgeCheck,
  Paperclip,
  FileSpreadsheet,
  TrendingUp,
  BarChart3,
  Lock,
  Unlock,
  Search,
  ArrowLeft,
  CalendarRange,
  Award
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Candidate, CandidateStatus, ExpenseClaim, ExpenseItem, TourRequest, AttendancePunch, Employee, canEditCandidate, isCandidateReadyForPo } from '../../types';
import { DossierViewerModal } from '../candidates/DossierViewerModal';
import { EditDiscrepancyModal } from '../candidates/EditDiscrepancyModal';
import { EditCandidateModal } from '../candidates/EditCandidateModal';
import { CertificatePhotoUploadModal } from '../candidates/CertificatePhotoUploadModal';
import { BatchDispatchValidationModal } from '../candidates/BatchDispatchValidationModal';
import { WhatsAppSummaryModal } from '../common/WhatsAppSummaryModal';
import { EmployeeSelfAttendanceModal } from '../attendance/EmployeeSelfAttendanceModal';
import { generateExpenseClaimPdf } from '../../utils/pdfGenerator';
import { exportCandidatesToExcel } from '../../utils/excelExporter';
import { CenterEnrollmentTrendsChart } from './CenterEnrollmentTrendsChart';
import { ModeBCandidateRegistrationDesk } from './ModeBCandidateRegistrationDesk';
import { ExpenseAuditTrailModal } from '../travel/ExpenseAuditTrailModal';

/**
 * Indian Currency Number to Words converter (e.g., 4850 -> "Rupees Four Thousand Eight Hundred Fifty Only")
 */
function numberToWordsIndian(amount: number): string {
  if (!amount || amount <= 0) return 'Rupees Zero Only';
  const num = Math.floor(amount);
  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertSection(n: number): string {
    if (n < 20) return single[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + single[n % 10] : '');
    if (n < 1000) return single[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertSection(n % 100) : '');
    if (n < 100000) return convertSection(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertSection(n % 1000) : '');
    if (n < 10000000) return convertSection(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convertSection(n % 100000) : '');
    return convertSection(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convertSection(n % 10000000) : '');
  }

  return `Rupees ${convertSection(num)} Only`;
}

/**
 * Format registration date & timestamp (e.g., 24 Sep 2026, 10:15 AM)
 */
function formatEnrollmentDate(timestamp?: string): string {
  if (!timestamp) return '24 Sep 2026, 10:15 AM';
  try {
    const d = new Date(timestamp);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  } catch {
    // fallback
  }
  return timestamp;
}

export const OseDashboard: React.FC = () => {
  const {
    currentPersona,
    activeCenter,
    candidates,
    addCandidate,
    updateCandidate,
    resolveAuditQuery,
    submitBatchToPo,
    uploadCertificatePhotos,
    batches,
    employees,
    tours,
    expenseClaims,
    submitExpenseClaim,
    attendancePunches,
    showToast
  } = useApp();

  // 1. Strict Center Scoping: OSE sees only candidates registered at active center
  const centerCandidates = useMemo(() => {
    return candidates.filter(c => c.centerId === activeCenter.id);
  }, [candidates, activeCenter.id]);

  const currentBatch = useMemo(() => {
    return batches.find(b => b.centerId === activeCenter.id) || batches[0];
  }, [batches, activeCenter.id]);

  // Draft Batch Tracking for Daily Lifecycle (Stage 1 to Stage 3)
  const draftCandidates = useMemo(() => {
    return centerCandidates.filter(c => c.status === 'Draft');
  }, [centerCandidates]);

  const readyForDispatchCount = useMemo(() => {
    return draftCandidates.filter(c => isCandidateReadyForPo(c)).length;
  }, [draftCandidates]);

  // Two Isolated Modes in OSE Workspace
  // Mode A: OSE Operations Dashboard & Enrollment History (Default)
  // Mode B: Dedicated Full-Page Candidate Registration Desk
  type OseMode = 'MODE_A_DASHBOARD' | 'MODE_B_ENROLLMENT_DESK';
  const [oseMode, setOseMode] = useState<OseMode>('MODE_A_DASHBOARD');
  const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);

  // Filter & Search Engine for Candidate Registry Log
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'DRAFT' | 'PENDING' | 'APPROVED' | 'CORRECTION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Daily Batch Workflow & Certificate Photos Modal State
  const [selectedCandidateForCertPhotos, setSelectedCandidateForCertPhotos] = useState<Candidate | null>(null);
  const [isCertPhotosModalOpen, setIsCertPhotosModalOpen] = useState(false);

  const [selectedCandidateForEdit, setSelectedCandidateForEdit] = useState<Candidate | null>(null);
  const [isEditCandidateModalOpen, setIsEditCandidateModalOpen] = useState(false);

  const [isBatchDispatchModalOpen, setIsBatchDispatchModalOpen] = useState(false);

  // Discrepancy & PO Audit Lock Modal State
  const [selectedCandidateForEditDiscrepancy, setSelectedCandidateForEditDiscrepancy] = useState<Candidate | null>(null);
  const [isEditDiscrepancyOpen, setIsEditDiscrepancyOpen] = useState(false);

  // Expense Claim Audit Trail Modal State
  const [selectedClaimForAudit, setSelectedClaimForAudit] = useState<ExpenseClaim | null>(null);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Filtered Center Candidates based on search, status, and date range
  const filteredCenterCandidates = useMemo(() => {
    return centerCandidates.filter((candidate) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (candidate.fullName || '').toLowerCase().includes(q);
        const matchFather = (candidate.fatherName || '').toLowerCase().includes(q);
        const matchMobile = (candidate.mobileNumber || '').includes(q);
        const matchDl = (candidate.dlNumber || '').toLowerCase().includes(q);
        const matchReg = (candidate.registrationNumber || '').toLowerCase().includes(q);
        const matchId = (candidate.idCardNumber || '').includes(q);
        if (!matchName && !matchFather && !matchMobile && !matchDl && !matchReg && !matchId) {
          return false;
        }
      }

      // 2. PO Audit Status Filter
      if (filterStatus === 'DRAFT') {
        if (candidate.status !== 'Draft') {
          return false;
        }
      } else if (filterStatus === 'PENDING') {
        if (candidate.status !== 'Pending PO Review' && candidate.status !== 'Pending Scan') {
          return false;
        }
      } else if (filterStatus === 'APPROVED') {
        if (
          candidate.status !== 'Approved by PO' &&
          candidate.status !== 'Green Signal (Video Call)' &&
          candidate.status !== 'APM QC Passed' &&
          candidate.status !== 'Certified & Dispatched'
        ) {
          return false;
        }
      } else if (filterStatus === 'CORRECTION') {
        if (candidate.status !== 'Returned for Correction' && candidate.status !== 'Query Raised') {
          return false;
        }
      }

      // 3. Date Range Filter
      if (filterDateFrom || filterDateTo) {
        let candDate = candidate.trainingDate || '';
        if (!candDate && candidate.enrolledAt) {
          candDate = candidate.enrolledAt.slice(0, 10);
        }
        if (candDate) {
          if (filterDateFrom && candDate < filterDateFrom) return false;
          if (filterDateTo && candDate > filterDateTo) return false;
        }
      }

      return true;
    });
  }, [centerCandidates, searchQuery, filterStatus, filterDateFrom, filterDateTo]);

  // Handle Resubmission of Returned Candidates (Audit Lock Architecture)
  const handleResubmitDiscrepancy = (
    candidateId: string,
    updatedFields: Partial<Candidate>,
    resolutionComment: string
  ) => {
    const targetCandidate = candidates.find(c => c.id === candidateId);
    const openQuery = targetCandidate?.queries?.find(q => q.status === 'Open');

    if (openQuery) {
      resolveAuditQuery(candidateId, openQuery.id, resolutionComment);
    }

    updateCandidate(candidateId, {
      ...updatedFields,
      status: 'Pending PO Review'
    });

    showToast(
      `Candidate ${targetCandidate?.fullName || 'Record'} corrections resubmitted to PO! Record re-locked under 'Pending PO Review'.`
    );
  };

  // Handle Certificate Photos Upload Save
  const handleSaveCertPhotos = (candidateId: string, holdingUrl: string, handoverUrl: string) => {
    uploadCertificatePhotos(candidateId, holdingUrl, handoverUrl);
    setIsCertPhotosModalOpen(false);
    setSelectedCandidateForCertPhotos(null);
  };

  // Handle Edit Candidate (Draft or Discrepancy Fix)
  const handleSaveEditCandidate = (
    candidateId: string,
    updatedFields: Partial<Candidate>,
    resubmitToPo?: boolean,
    resolutionComment?: string
  ) => {
    if (resubmitToPo) {
      handleResubmitDiscrepancy(candidateId, updatedFields, resolutionComment || 'Corrected flagged discrepancy.');
    } else {
      updateCandidate(candidateId, updatedFields);
      showToast('Candidate draft record updated locally!');
    }
    setIsEditCandidateModalOpen(false);
    setSelectedCandidateForEdit(null);
  };

  // Handle Batch Dispatch to PO
  const handleConfirmBatchDispatch = () => {
    submitBatchToPo(activeCenter.id);
  };

  // Find OSE employee record
  const oseEmployee: Employee = useMemo(() => {
    return employees.find(
      e => e.name.toLowerCase().includes(currentPersona.name.toLowerCase()) || e.role === 'OSE'
    ) || {
      id: 'emp-1',
      empCode: 'DBS-EMP-1042',
      name: currentPersona.name,
      role: 'OSE',
      level: 'Level 4',
      designation: 'Operations Support Executive',
      centerId: activeCenter.id,
      centerName: activeCenter.name,
      reportingOfficer: 'Pooja Verma (PO)',
      dateOfJoining: '2024-03-15',
      tenureMonths: 30,
      phone: currentPersona.phone,
      email: currentPersona.email,
      avatar: currentPersona.avatar,
      monthlyTarget: 600,
      monthlyAchieved: 512,
      casualLeaveBalance: 7,
      compOffBalance: 2
    };
  }, [employees, currentPersona, activeCenter]);

  // OSE Tours and Claims
  const oseClaims = useMemo(() => {
    return expenseClaims.filter(
      c => c.employeeId === oseEmployee.id || c.employeeName.toLowerCase().includes(currentPersona.name.toLowerCase())
    );
  }, [expenseClaims, oseEmployee.id, currentPersona.name]);

  const pendingClaimsAmount = useMemo(() => {
    return oseClaims
      .filter(c => c.status === 'Pending GM Review' || c.status === 'Approved by GM')
      .reduce((sum, c) => sum + c.totalClaimed, 0);
  }, [oseClaims]);

  const oseTours = useMemo(() => {
    return tours.filter(
      t => t.employeeId === oseEmployee.id || t.employeeName.toLowerCase().includes(currentPersona.name.toLowerCase())
    );
  }, [tours, oseEmployee.id, currentPersona.name]);

  const completedToursCount = Math.max(1, oseTours.filter(t => t.status === 'Completed' || t.status === 'Expense Claim Filed' || t.status === 'Sanctioned').length);

  // Main navigation sub-tabs
  type OseSubTab = 'enrollment' | 'expense_claim' | 'attendance_history' | 'enrollment_trends';
  const [activeSubTab, setActiveSubTab] = useState<OseSubTab>('enrollment');
  const [candidateSubView, setCandidateSubView] = useState<'form' | 'table'>('form');

  // Modals state
  const [selectedCandidateForDossier, setSelectedCandidateForDossier] = useState<Candidate | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [isSelfAttendanceModalOpen, setIsSelfAttendanceModalOpen] = useState(false);

  // Export to Excel handler (Date Range & Filter Aware)
  const handleExportCenterCandidatesToExcel = () => {
    if (filteredCenterCandidates.length === 0) {
      showToast('No candidate records match the selected filter criteria.');
      return;
    }
    const dateRangeLabel = filterDateFrom || filterDateTo
      ? `Dates: ${filterDateFrom || 'Start'} to ${filterDateTo || 'End'}`
      : 'All Dates';

    const fileName = exportCandidatesToExcel({
      candidates: filteredCenterCandidates,
      center: activeCenter,
      batchCode: currentBatch?.batchCode || 'DBS-BATCH-ALL',
      exportedBy: `${currentPersona.name} (OSE - Level 4)`,
      filterLabel: `${dateRangeLabel} • Status: ${filterStatus} • Total: ${filteredCenterCandidates.length}`
    });
    showToast(`Exported ${filteredCenterCandidates.length} center candidate(s) to Excel: ${fileName}`);
  };

  // ----------------------------------------------------
  // TAB 1: 3-WAY AADHAAR INGESTION & CANDIDATE REGISTRATION
  // ----------------------------------------------------
  const [ingestionMode, setIngestionMode] = useState<'Manual Entry' | 'File Upload' | 'Live Camera Snapshot + Optical Extraction'>('Live Camera Snapshot + Optical Extraction');
  
  // Mandatory Candidate Form Fields
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1994-05-12');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [maritalStatus, setMaritalStatus] = useState<'Single' | 'Married' | 'Widowed' | 'Divorced'>('Married');
  const [familyIncome, setFamilyIncome] = useState('₹1,50,000 - ₹2,50,000 / year');
  const [religion, setReligion] = useState('Hindu');
  const [casteCategory, setCasteCategory] = useState<'General' | 'OBC' | 'SC' | 'ST' | 'EWS'>('OBC');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState(activeCenter.city);
  const [state, setState] = useState(activeCenter.state);
  const [pincode, setPincode] = useState('342005');
  const [mobileNumber, setMobileNumber] = useState('');

  const [idCardNumber, setIdCardNumber] = useState('');
  const [abhaNumber, setAbhaNumber] = useState('91-8842-1920-5512');
  const [dlNumber, setDlNumber] = useState('');
  const [dlExpiryDate, setDlExpiryDate] = useState('2031-08-15');
  const [vehicleClass, setVehicleClass] = useState<Candidate['vehicleClass']>('TRANS');

  // Images
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80');
  const [idFrontUrl, setIdFrontUrl] = useState('https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80');
  const [idBackUrl, setIdBackUrl] = useState('https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80');
  const [dlFrontUrl, setDlFrontUrl] = useState('https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80');
  const [dlBackUrl, setDlBackUrl] = useState('https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80');

  // Camera State for Live Aadhaar Snapshot + Optical Extraction
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [ocrScanning, setOcrScanning] = useState(false);
  const [ocrSuccess, setOcrSuccess] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Start live camera for card scanning
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
      stream.getTracks().forEach(t => t.stop());
    }
    setIsLiveCameraActive(false);
  };

  // Perform Live Camera Snapshot + Optical Extraction
  const handleSnapAndOcr = () => {
    setOcrScanning(true);
    stopLiveCamera();

    // Optical extraction simulation with realistic Aadhaar data extraction
    setTimeout(() => {
      const names = ['Kailash Bishnoi', 'Om Prakash Gurjar', 'Maheshwari Rawat', 'Vikramaditya Soni'];
      const fathers = ['Shri Babulal Bishnoi', 'Shri Ramswaroop Gurjar', 'Shri Harchand Rawat', 'Shri Mohanlal Soni'];
      const mothers = ['Smt. Shanti Devi', 'Smt. Geeta Bai', 'Smt. Kamla Devi', 'Smt. Rukmani Devi'];
      const randomIdx = Math.floor(Math.random() * names.length);

      const generatedAadhaar = `${Math.floor(1000 + Math.random() * 9000)}${Math.floor(1000 + Math.random() * 9000)}${Math.floor(1000 + Math.random() * 9000)}`;
      const generatedDl = `RJ19 ${2014 + Math.floor(Math.random() * 10)}00${Math.floor(10000 + Math.random() * 90000)}`;

      setFullName(names[randomIdx]);
      setFatherName(fathers[randomIdx]);
      setMotherName(mothers[randomIdx]);
      setIdCardNumber(generatedAadhaar);
      setAddress('Village & Post Mandore, Near Krishi Mandi');
      setMobileNumber(`98${Math.floor(10000000 + Math.random() * 90000000)}`);
      setDlNumber(generatedDl);

      setOcrScanning(false);
      setOcrSuccess(true);
      showToast('Optical Extraction Complete: Candidate demographics, Aadhaar & address auto-populated!');
    }, 1200);
  };

  // Handle File Upload Ingestion
  const handleFileUploadAadhaar = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setIdFrontUrl(event.target.result as string);
          setOcrScanning(true);
          setTimeout(() => {
            setFullName('Devendra Singh Solanki');
            setFatherName('Shri Narpat Singh Solanki');
            setMotherName('Smt. Prem Kanwar');
            setIdCardNumber('784512903421');
            setAddress('House 82, Gali No. 4, Pratap Nagar');
            setMobileNumber('9414289012');
            setDlNumber('RJ19 20170044192');
            setOcrScanning(false);
            setOcrSuccess(true);
            showToast('Document File Parsed: Aadhaar extracted successfully!');
          }, 1100);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Form Submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Aadhaar 12-digit check
    const cleanAadhaar = idCardNumber.replace(/\s+/g, '');
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      showToast('Invalid Government ID: Must be an exact 12-digit number');
      return;
    }
    // Mobile 10-digit check
    const cleanMobile = mobileNumber.replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanMobile)) {
      showToast('Invalid Mobile Number: Must be a valid 10-digit Indian number');
      return;
    }

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
      idFrontUrl,
      idBackUrl,
      dlFrontUrl,
      dlBackUrl,
      status: 'Pending PO Review'
    });

    showToast(`Candidate ${fullName} successfully enrolled! 3-Page Archival Dossier compiled & forwarded to PO Audit Board.`);
    setCandidateSubView('table');
  };

  // ----------------------------------------------------
  // TAB 2: DB SKILLS OFFICIAL TRAVEL EXPENSE CLAIM FORM
  // ----------------------------------------------------
  const [claimPurpose, setClaimPurpose] = useState('Outstation Regional Driver Mobilization & Verification Drive');
  const [claimProject, setClaimProject] = useState('Commercial Vehicle Driver Road Safety & Skill Training');
  const [claimZone, setClaimZone] = useState<'North' | 'West' | 'East' | 'South'>('North');
  const [claimSanctionNo, setClaimSanctionNo] = useState('TSO/DBS/2026/09/028');
  const [travelStartDate, setTravelStartDate] = useState('2026-09-20');
  const [travelEndDate, setTravelEndDate] = useState('2026-09-22');

  // Particular 1: Travelling Expenses - Fare
  const [fareAmount, setFareAmount] = useState<number>(0);
  const [fareDescription, setFareDescription] = useState('');
  const [fareReceiptName, setFareReceiptName] = useState<string>('');

  // Particular 2: Travelling Expenses - L&B (Lodging & Boarding)
  const [lodgingAmount, setLodgingAmount] = useState<number>(0);
  const [lodgingDescription, setLodgingDescription] = useState('');
  const [lodgingReceiptName, setLodgingReceiptName] = useState<string>('');

  // Particular 3: Travel - Others (Food DA / Local Conveyance)
  const [othersAmount, setOthersAmount] = useState<number>(0);
  const [othersDescription, setOthersDescription] = useState('');
  const [othersReceiptName, setOthersReceiptName] = useState<string>('');

  // Dynamic sum calculation
  const totalClaimAmount = useMemo(() => {
    return (fareAmount || 0) + (lodgingAmount || 0) + (othersAmount || 0);
  }, [fareAmount, lodgingAmount, othersAmount]);

  const totalClaimInWords = useMemo(() => {
    return numberToWordsIndian(totalClaimAmount);
  }, [totalClaimAmount]);

  const [declarationAccepted, setDeclarationAccepted] = useState(true);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // File upload handler for receipts
  const handleReceiptUpload = (category: 'fare' | 'lodging' | 'others', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const fileName = e.target.files[0].name;
      if (category === 'fare') setFareReceiptName(fileName);
      if (category === 'lodging') setLodgingReceiptName(fileName);
      if (category === 'others') setOthersReceiptName(fileName);
      showToast(`Proof uploaded for ${category.toUpperCase()}: ${fileName}`);
    }
  };

  // Submit Expense Claim
  const handleExpenseClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalClaimAmount <= 0) {
      showToast('Claim amount must be greater than zero.');
      return;
    }
    if (!fareReceiptName || !lodgingReceiptName || !othersReceiptName) {
      showToast('Mandatory Proof Upload: Please attach receipt proof for all 3 expense particulars.');
      return;
    }
    if (!declarationAccepted) {
      showToast('Please confirm and sign the employee truthfulness declaration.');
      return;
    }

    setIsSubmittingClaim(true);

    const items: ExpenseItem[] = [
      {
        id: `itm-fare-${Date.now()}`,
        category: 'Travel Ticket',
        description: `Travelling Expenses - Fare: ${fareDescription}`,
        date: travelStartDate,
        claimAmount: fareAmount,
        entitlementLimit: 2500,
        approvedAmount: fareAmount,
        receiptName: fareReceiptName,
        isWithinPolicy: true
      },
      {
        id: `itm-lodging-${Date.now()}`,
        category: 'Hotel/Lodging',
        description: `Travelling Expenses - L&B: ${lodgingDescription}`,
        date: travelStartDate,
        claimAmount: lodgingAmount,
        entitlementLimit: 3000,
        approvedAmount: lodgingAmount,
        receiptName: lodgingReceiptName,
        isWithinPolicy: true
      },
      {
        id: `itm-others-${Date.now()}`,
        category: 'Daily Food Allowance (DA)',
        description: `Travel - Others (Food DA / Local Conveyance): ${othersDescription}`,
        date: travelEndDate,
        claimAmount: othersAmount,
        entitlementLimit: 1500,
        approvedAmount: othersAmount,
        receiptName: othersReceiptName,
        isWithinPolicy: true
      }
    ];

    submitExpenseClaim({
      tourId: `tour-ose-${Date.now()}`,
      tourSanctionNumber: claimSanctionNo,
      employeeId: oseEmployee.id,
      employeeName: oseEmployee.name,
      employeeRole: 'OSE',
      employeeLevel: 'Level 4',
      submissionDate: new Date().toISOString().split('T')[0],
      cityType: 'Non-Metro',
      items,
      totalClaimed: totalClaimAmount,
      totalEntitlement: 7000,
      totalApproved: totalClaimAmount
    });

    setIsSubmittingClaim(false);
    showToast(`DB Skills Travel Claim of ₹${totalClaimAmount.toLocaleString()} submitted! Status updated to 'Pending GM / Accounts Sanction'.`);
  };

  // ----------------------------------------------------
  // TAB 3: SELF-ATTENDANCE & DEPLOYMENT TIMELINE
  // ----------------------------------------------------
  // Past deployment postings
  const deploymentPostings = [
    {
      centerName: 'Jodhpur Transport Skill Hub (RJ-01)',
      period: 'March 2024 — Present',
      duration: '30 Months (Active)',
      role: 'Operation Support Executive (Level 4)',
      status: 'Current Posting',
      isCurrent: true,
      highlights: 'Lead enrollment desk; 512+ commercial drivers qualified; zero audit discrepancies'
    },
    {
      centerName: 'Jaipur Logistics Training Hub (RJ-02)',
      period: 'July 2023 — February 2024',
      duration: '8 Months',
      role: 'Field Operations Associate (Level 4)',
      status: 'Past Deployment',
      isCurrent: false,
      highlights: 'Managed 18 batches; cross-border transport union driver mobilizations'
    },
    {
      centerName: 'Udaipur Commercial Driving Center (RJ-03)',
      period: 'January 2023 — June 2023',
      duration: '6 Months',
      role: 'Junior Ingestion Executive (Level 4)',
      status: 'Past Deployment',
      isCurrent: false,
      highlights: 'Assisted center inauguration, installed biometric terminals & scanner hubs'
    }
  ];

  // Self attendance logs for this OSE
  const oseAttendanceLogs = useMemo(() => {
    const directPunches = attendancePunches.filter(
      p => p.employeeName.toLowerCase().includes(currentPersona.name.toLowerCase()) || p.employeeId === oseEmployee.id
    );

    // Complement with historical 22 days records for this month
    const pastRecords: {
      date: string;
      checkIn: string;
      checkOut: string;
      coordinates: string;
      status: 'Present' | 'Late Arrival' | 'Comp-Off';
      geofence: string;
    }[] = [
      { date: '2026-09-23', checkIn: '08:15:10 AM', checkOut: '05:32:00 PM', coordinates: '26.2391° N, 73.0245° E', status: 'Present', geofence: 'Within Center Geofence (45m)' },
      { date: '2026-09-22', checkIn: '08:18:22 AM', checkOut: '05:30:15 PM', coordinates: '26.2389° N, 73.0243° E', status: 'Present', geofence: 'Within Center Geofence (22m)' },
      { date: '2026-09-21', checkIn: '08:14:05 AM', checkOut: '05:35:40 PM', coordinates: '26.2390° N, 73.0244° E', status: 'Present', geofence: 'Within Center Geofence (18m)' },
      { date: '2026-09-20', checkIn: '08:20:12 AM', checkOut: '05:40:00 PM', coordinates: '26.2388° N, 73.0241° E', status: 'Present', geofence: 'Within Center Geofence (30m)' },
      { date: '2026-09-19', checkIn: '08:16:30 AM', checkOut: '05:31:10 PM', coordinates: '26.2391° N, 73.0245° E', status: 'Present', geofence: 'Within Center Geofence (25m)' },
      { date: '2026-09-18', checkIn: '08:22:45 AM', checkOut: '05:33:20 PM', coordinates: '26.2389° N, 73.0243° E', status: 'Present', geofence: 'Within Center Geofence (20m)' },
      { date: '2026-09-17', checkIn: '08:15:00 AM', checkOut: '05:30:00 PM', coordinates: '26.2390° N, 73.0242° E', status: 'Present', geofence: 'Within Center Geofence (15m)' },
      { date: '2026-09-16', checkIn: '08:19:10 AM', checkOut: '05:34:12 PM', coordinates: '26.2391° N, 73.0244° E', status: 'Present', geofence: 'Within Center Geofence (32m)' },
      { date: '2026-09-15', checkIn: '08:17:40 AM', checkOut: '05:32:50 PM', coordinates: '26.2388° N, 73.0240° E', status: 'Present', geofence: 'Within Center Geofence (28m)' },
      { date: '2026-09-14', checkIn: '08:14:55 AM', checkOut: '05:30:10 PM', coordinates: '26.2390° N, 73.0243° E', status: 'Present', geofence: 'Within Center Geofence (22m)' },
      { date: '2026-09-12', checkIn: '09:24:15 AM', checkOut: '05:45:00 PM', coordinates: '26.2392° N, 73.0246° E', status: 'Late Arrival', geofence: 'Within Center Geofence (38m) • Late +24m' },
      { date: '2026-09-11', checkIn: '08:18:00 AM', checkOut: '05:31:00 PM', coordinates: '26.2389° N, 73.0242° E', status: 'Present', geofence: 'Within Center Geofence (19m)' },
      { date: '2026-09-10', checkIn: '08:15:30 AM', checkOut: '05:30:45 PM', coordinates: '26.2391° N, 73.0245° E', status: 'Present', geofence: 'Within Center Geofence (24m)' },
      { date: '2026-09-09', checkIn: '08:16:20 AM', checkOut: '05:32:10 PM', coordinates: '26.2390° N, 73.0243° E', status: 'Present', geofence: 'Within Center Geofence (21m)' },
      { date: '2026-09-08', checkIn: '08:14:40 AM', checkOut: '05:30:00 PM', coordinates: '26.2389° N, 73.0244° E', status: 'Present', geofence: 'Within Center Geofence (16m)' },
      { date: '2026-09-07', checkIn: '08:21:10 AM', checkOut: '05:35:00 PM', coordinates: '26.2392° N, 73.0245° E', status: 'Present', geofence: 'Within Center Geofence (35m)' },
      { date: '2026-09-05', checkIn: '08:19:00 AM', checkOut: '05:30:20 PM', coordinates: '26.2389° N, 73.0242° E', status: 'Present', geofence: 'Within Center Geofence (20m)' },
      { date: '2026-09-04', checkIn: '08:15:10 AM', checkOut: '05:33:00 PM', coordinates: '26.2390° N, 73.0243° E', status: 'Present', geofence: 'Within Center Geofence (22m)' },
      { date: '2026-09-03', checkIn: '08:18:40 AM', checkOut: '05:31:50 PM', coordinates: '26.2388° N, 73.0241° E', status: 'Present', geofence: 'Within Center Geofence (27m)' },
      { date: '2026-09-02', checkIn: '08:16:00 AM', checkOut: '05:30:00 PM', coordinates: '26.2391° N, 73.0244° E', status: 'Present', geofence: 'Within Center Geofence (26m)' },
      { date: '2026-09-01', checkIn: '08:14:20 AM', checkOut: '05:30:10 PM', coordinates: '26.2390° N, 73.0243° E', status: 'Present', geofence: 'Within Center Geofence (18m)' }
    ];

    return pastRecords;
  }, [attendancePunches, currentPersona.name, oseEmployee.id]);

  // Mode B: Dedicated Full-Page Candidate Registration Desk
  if (oseMode === 'MODE_B_ENROLLMENT_DESK' || isEnrollmentOpen) {
    return (
      <ModeBCandidateRegistrationDesk
        activeCenter={activeCenter}
        currentBatch={currentBatch}
        currentPersona={currentPersona}
        onBackToDashboard={() => {
          setOseMode('MODE_A_DASHBOARD');
          setIsEnrollmentOpen(false);
        }}
      />
    );
  }

  // Mode A: OSE Operations Dashboard & Enrollment History (Default)
  return (
    <div className="space-y-6">
      {/* ==================================================== */}
      {/* 1. TOP PROFILE & DEPLOYMENT AUDIT HEADER             */}
      {/* ==================================================== */}
      <div className="bg-white border border-slate-300 rounded-sm p-4 shadow-2xs mb-4">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          
          {/* Left: User Identity */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <img 
                src={currentPersona.avatar} 
                alt={currentPersona.name} 
                className="w-12 h-12 rounded-sm border border-slate-300 object-cover" 
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900">{currentPersona.name}</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-teal-800 border border-teal-300 rounded-xs">
                  OSE - Level 4
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 border border-slate-200 rounded-xs">
                  {oseEmployee.empCode}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                <span className="font-semibold text-slate-700">Assigned Center:</span> {activeCenter.name} ({activeCenter.code})
                <span className="mx-1.5 text-slate-300">•</span>
                Reporting Officer: <span className="font-semibold">{oseEmployee.reportingOfficer || 'Pooja Verma (PO)'}</span>
              </p>
            </div>
          </div>

          {/* Right: Actions & Center Lockdown Badge */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0 justify-end">
            {/* Submit Batch Button */}
            <button 
              type="button"
              disabled={draftCandidates.length === 0}
              onClick={() => {
                if (draftCandidates.length === 0) {
                  showToast("No Draft candidates in today's batch. Enroll drivers in morning to build batch.");
                  return;
                }
                setIsBatchDispatchModalOpen(true);
              }}
              className={`px-3.5 py-2 font-bold text-xs rounded-xs flex items-center gap-1.5 transition-colors ${
                draftCandidates.length === 0
                  ? 'bg-slate-100 border border-slate-300 text-slate-600 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 border border-emerald-800 text-white cursor-pointer shadow-xs'
              }`}
            >
              <span>✈</span>
              <span>Submit Today's Completed Batch to PO ({draftCandidates.length} Drivers)</span>
              {draftCandidates.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-xs text-[10px] font-mono font-bold ${
                    readyForDispatchCount === draftCandidates.length
                      ? 'bg-emerald-300 text-emerald-950'
                      : 'bg-amber-300 text-amber-950'
                  }`}
                >
                  {readyForDispatchCount}/{draftCandidates.length}
                </span>
              )}
            </button>

            {/* Start New Candidate Enrollment Button */}
            <button 
              type="button"
              onClick={() => {
                setOseMode('MODE_B_ENROLLMENT_DESK');
                setIsEnrollmentOpen(true);
              }}
              className="px-4 py-2 bg-[#0f4c81] hover:bg-[#0c3c66] text-white font-bold text-xs rounded-xs shadow-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors"
            >
              <span className="text-sm font-black">+</span>
              <span>Start New Candidate Enrollment</span>
            </button>

            {/* Center Lockdown Badge (Integrated inside flex flow, not overflowing) */}
            <div className="bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-xs flex items-center gap-2 shrink-0">
              <span className="text-emerald-700 text-sm">🛡️</span>
              <div className="text-left">
                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-900 leading-tight">
                  Center Lockdown Active
                </div>
                <div className="text-[9px] font-semibold text-emerald-700 leading-tight">
                  {activeCenter.code} Scoped
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 5 Audit & Deployment Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mt-4 pt-4 border-t border-slate-200">
          {/* Card 1: Past Deployment History */}
          <div className="p-3.5 rounded-sm bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[10px]">Past Deployment</span>
              <History className="w-4 h-4 text-teal-700" />
            </div>
            <p className="text-base font-extrabold text-slate-900 truncate">
              {activeCenter.city} Hub (Current)
            </p>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              Past: Jaipur Hub • Udaipur Hub
            </p>
          </div>

          {/* Card 2: Monthly Self-Attendance Record */}
          <div className="p-3.5 rounded-sm bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[10px]">Monthly Attendance</span>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-emerald-700">22</span>
              <span className="text-xs font-bold text-slate-600">Days Present</span>
            </div>
            <p className="text-[11px] text-amber-700 font-semibold mt-1">
              1 Late-Arrival Flag (9:24 AM)
            </p>
          </div>

          {/* Card 3: Official Tours Completed */}
          <div className="p-3.5 rounded-sm bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[10px]">Official Tours</span>
              <Briefcase className="w-4 h-4 text-teal-700" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-slate-900">{completedToursCount}</span>
              <span className="text-xs font-bold text-slate-600">Tours Executed</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              Last: Pali Transport Depot
            </p>
          </div>

          {/* Card 4: Pending Tour Money Claim */}
          <div className="p-3.5 rounded-sm bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[10px]">Pending Claim</span>
              <Receipt className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-amber-800">
                ₹{pendingClaimsAmount.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              {pendingClaimsAmount > 0 ? 'Awaiting GM Sanction' : 'All Claims Settled'}
            </p>
          </div>

          {/* Card 5: Center All-Time Enrollment Count & Trend Launcher */}
          <div
            onClick={() => setActiveSubTab('enrollment_trends')}
            className="p-3.5 rounded-sm bg-slate-50 border border-slate-200 hover:border-teal-400 hover:shadow-xs transition-all cursor-pointer group"
            title="Click to view center-specific 6-month enrollment trends and charts"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1.5">
              <span className="font-bold uppercase tracking-wider text-[10px]">Center Trainees</span>
              <Users className="w-4 h-4 text-teal-700 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-extrabold text-teal-900">{centerCandidates.length}</span>
              <span className="text-xs font-bold text-slate-600">Enrolled</span>
            </div>
            <p className="text-[11px] text-teal-700 font-semibold mt-1 truncate flex items-center gap-1 group-hover:text-teal-900">
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>View 6-Mo Trends →</span>
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. CENTER-SPECIFIC ENROLLMENT TRENDS (RECHARTS)      */}
      {/* ==================================================== */}
      <CenterEnrollmentTrendsChart
        activeCenter={activeCenter}
        centerCandidates={centerCandidates}
      />

      {/* ==================================================== */}
      {/* 3. MAIN NAVIGATION SUB-TABS                          */}
      {/* ==================================================== */}
      <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-Tab 1: Center Candidates Registry & PO Audit Desk */}
          <button
            onClick={() => setActiveSubTab('enrollment')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'enrollment'
                ? 'bg-[#0d5c63] text-white shadow-xs ring-2 ring-[#0d5c63]/20'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-300" />
            <span>1. Center Candidates Registry & PO Audit Desk</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
              activeSubTab === 'enrollment' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {centerCandidates.length}
            </span>
          </button>

          {/* Sub-Tab 2: Travel Expenses Claim Form */}
          <button
            onClick={() => setActiveSubTab('expense_claim')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'expense_claim'
                ? 'bg-[#0d5c63] text-white shadow-xs ring-2 ring-[#0d5c63]/20'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4 text-amber-300" />
            <span>2. File Tour Expense Claim (DB Skills Official Format)</span>
            {pendingClaimsAmount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-amber-400 text-amber-950 font-bold text-[10px]">
                Pending
              </span>
            )}
          </button>

          {/* Sub-Tab 3: Attendance & Deployment History */}
          <button
            onClick={() => setActiveSubTab('attendance_history')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'attendance_history'
                ? 'bg-[#0d5c63] text-white shadow-xs ring-2 ring-[#0d5c63]/20'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4 text-teal-300" />
            <span>3. My Attendance & Deployment History</span>
          </button>

          {/* Sub-Tab 4: 6-Month Enrollment Analytics */}
          <button
            onClick={() => setActiveSubTab('enrollment_trends')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'enrollment_trends'
                ? 'bg-[#0d5c63] text-white shadow-xs ring-2 ring-[#0d5c63]/20'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>4. 6-Month Enrollment Trends & Analytics</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeSubTab === 'enrollment_trends' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}>
              Recharts
            </span>
          </button>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 3. TAB 1: CANDIDATE ENROLLMENT & 3-WAY AADHAAR       */}
      {/* ==================================================== */}
      {activeSubTab === 'enrollment' && (
        <div className="space-y-4">
          {/* Sub-header Bar with Active Center, Batch, and Mode B CTA */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                Active Center: {activeCenter.name}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-mono">
                Batch: {currentBatch.batchCode}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 font-medium">
                Scope: Strict {activeCenter.code} Isolation
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsWhatsAppOpen(true)}
                className="px-3 py-1.5 rounded-xs text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Send daily candidate registration summary on WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Summary</span>
              </button>
            </div>
          </div>

          {/* Table Container & Filter / Search / Excel Export Engine */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-teal-800">
                  Center Registry Log
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Center Candidates Enrollment & PO Status Audit Table ({centerCandidates.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Itemized registry of all candidate registrations enrolled at {activeCenter.name}. All records are locked post-submission.
                </p>
              </div>

              {/* Status Pills Summary */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Stage 1 Drafts: {draftCandidates.length}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Pending PO: {centerCandidates.filter(c => c.status === 'Pending PO Review' || c.status === 'Pending Scan').length}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Approved by PO: {centerCandidates.filter(c => c.status === 'Approved by PO' || c.status === 'Green Signal (Video Call)' || c.status === 'APM QC Passed' || c.status === 'Certified & Dispatched').length}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  Returned: {centerCandidates.filter(c => c.status === 'Returned for Correction' || c.status === 'Query Raised').length}
                </span>
              </div>
            </div>

            {/* Filter Bar with Date Range, Status Filter, Search, and Excel Export */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search candidate by Full Name, Father's Name, Mobile, DL, Govt ID, Reg No..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  />
                </div>

                {/* Status Filter & Export Button */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-teal-700/20 focus:border-teal-700"
                  >
                    <option value="ALL">All PO Statuses ({centerCandidates.length})</option>
                    <option value="DRAFT">
                      Stage 1: Draft Mode ({draftCandidates.length})
                    </option>
                    <option value="PENDING">
                      Pending PO Review ({centerCandidates.filter(c => c.status === 'Pending PO Review' || c.status === 'Pending Scan').length})
                    </option>
                    <option value="APPROVED">
                      Approved by PO ({centerCandidates.filter(c => c.status === 'Approved by PO' || c.status === 'Green Signal (Video Call)' || c.status === 'APM QC Passed' || c.status === 'Certified & Dispatched').length})
                    </option>
                    <option value="CORRECTION">
                      Returned for Correction ({centerCandidates.filter(c => c.status === 'Returned for Correction' || c.status === 'Query Raised').length})
                    </option>
                  </select>

                  <button
                    type="button"
                    onClick={handleExportCenterCandidatesToExcel}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                    title="Export center records filtered by date range, containing registration timestamps, DL numbers, and PO verification logs to Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                    <span>Export to Excel / CSV</span>
                  </button>
                </div>
              </div>

              {/* Date Range Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80 text-xs">
                <div className="flex flex-wrap items-center gap-2 text-slate-600">
                  <CalendarRange className="w-4 h-4 text-teal-700" />
                  <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">Date Range:</span>
                  <div className="flex items-center gap-1">
                    <label className="text-[11px] text-slate-500">From:</label>
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-[11px] text-slate-500">To:</label>
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                    />
                  </div>
                  {(filterDateFrom || filterDateTo) && (
                    <button
                      onClick={() => {
                        setFilterDateFrom('');
                        setFilterDateTo('');
                      }}
                      className="text-[11px] font-bold text-rose-600 hover:underline px-1"
                    >
                      Clear Dates
                    </button>
                  )}
                </div>

                <div className="text-[11px] text-slate-500 font-medium">
                  Showing <strong className="text-slate-800">{filteredCenterCandidates.length}</strong> of {centerCandidates.length} candidate records
                </div>
              </div>
            </div>

            {/* Itemized Candidates Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">1. Candidate Details</th>
                    <th className="py-3 px-4">2. Enrollment Timestamp</th>
                    <th className="py-3 px-4">3. Certificate Proofs (Mandatory)</th>
                    <th className="py-3 px-4">4. PO Review & Audit Status</th>
                    <th className="py-3 px-4 text-right">5. Actions & Audit Lock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCenterCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">No candidate records found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          No candidates match the specified search query or date range filters.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCenterCandidates.map((candidate) => {
                      const isDraft = candidate.status === 'Draft';
                      const isReturned = candidate.status === 'Returned for Correction' || candidate.status === 'Query Raised';
                      const isApproved = candidate.status === 'Approved by PO' || candidate.status === 'Green Signal (Video Call)' || candidate.status === 'APM QC Passed' || candidate.status === 'Certified & Dispatched';
                      const openQuery = candidate.queries?.find(q => q.status === 'Open') || candidate.queries?.[0];
                      const hasHolding = Boolean(candidate.certificateHoldingPhotoUrl);
                      const hasHandover = Boolean(candidate.certificateHandoverPhotoUrl);
                      const hasBothCertPhotos = hasHolding && hasHandover;
                      const photosCount = (hasHolding ? 1 : 0) + (hasHandover ? 1 : 0);

                      return (
                        <tr key={candidate.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* Column 1: Candidate Details */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={candidate.photoUrl}
                                alt={candidate.fullName}
                                className="w-11 h-11 rounded-xs object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-slate-900 text-sm">{candidate.fullName}</p>
                                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-slate-100 text-slate-600 border border-slate-200">
                                    {candidate.registrationNumber}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500">
                                  S/O {candidate.fatherName}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px]">
                                  <span className="font-mono text-slate-700">
                                    📱 +91 {candidate.mobileNumber}
                                  </span>
                                  <span>•</span>
                                  <span className="font-mono font-bold text-teal-800">
                                    DL: {candidate.dlNumber} ({candidate.vehicleClass})
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Column 2: Enrollment Timestamp */}
                          <td className="py-3 px-4 font-mono">
                            <div className="space-y-0.5">
                              <p className="text-slate-800 font-semibold text-xs flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-teal-700" />
                                {formatEnrollmentDate(candidate.enrolledAt)}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Training Date: {candidate.trainingDate || '1-Day Foundation'}
                              </p>
                            </div>
                          </td>

                          {/* Column 3: Certificate Proofs (Mandatory Before PO Dispatch) */}
                          <td className="py-3 px-4">
                            {hasBothCertPhotos ? (
                              <div className="space-y-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-[#E6F4EA] text-[#005C2E] border border-[#007A3D]/30">
                                  <CheckCircle2 className="w-3 h-3 text-[#007A3D]" />
                                  Proofs Complete (2/2)
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCandidateForCertPhotos(candidate);
                                      setIsCertPhotosModalOpen(true);
                                    }}
                                    className="group relative cursor-pointer"
                                    title="Holding Certificate Photo (Click to inspect or change)"
                                  >
                                    <img
                                      src={candidate.certificateHoldingPhotoUrl}
                                      alt="Holding Certificate"
                                      className="w-8 h-8 rounded-xs object-cover border border-[#007A3D]/30 shadow-2xs group-hover:scale-105 transition-transform"
                                    />
                                    <span className="absolute -bottom-1 -right-1 bg-[#007A3D] text-white rounded-full p-0.5 shadow-xs">
                                      <Check className="w-2.5 h-2.5" />
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCandidateForCertPhotos(candidate);
                                      setIsCertPhotosModalOpen(true);
                                    }}
                                    className="group relative cursor-pointer"
                                    title="Certificate Handover Photo (Click to inspect or change)"
                                  >
                                    <img
                                      src={candidate.certificateHandoverPhotoUrl}
                                      alt="Certificate Handover"
                                      className="w-8 h-8 rounded-xs object-cover border border-[#007A3D]/30 shadow-2xs group-hover:scale-105 transition-transform"
                                    />
                                    <span className="absolute -bottom-1 -right-1 bg-[#007A3D] text-white rounded-full p-0.5 shadow-xs">
                                      <Check className="w-2.5 h-2.5" />
                                    </span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                                  <Camera className="w-3 h-3 text-slate-500" />
                                  {photosCount}/2 Photos
                                </span>
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedCandidateForCertPhotos(candidate);
                                      setIsCertPhotosModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-semibold rounded-xs bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                    title="Upload mandatory certificate holding and handover photos"
                                  >
                                    <Camera className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Upload Photos</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>

                          {/* Column 4: PO Review & Audit Status */}
                          <td className="py-3 px-4">
                            {isDraft ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                  Draft (In Progress)
                                </span>
                                <p className="text-[10px] text-slate-500 font-medium">
                                  Locally editable • Dispatch upon completion
                                </p>
                              </div>
                            ) : isReturned ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                                  <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                  Returned for Correction
                                </span>
                                <div className="text-[11px] text-rose-950 bg-rose-50/90 p-2 rounded-xl border border-rose-200 max-w-xs">
                                  <span className="text-[10px] uppercase font-bold text-rose-950 block">
                                    PO Audit Remarks {openQuery?.field ? `[${openQuery.field}]` : ''}:
                                  </span>
                                  <p className="line-clamp-2 text-[11px] mt-0.5 italic">
                                    "{candidate.poCorrectionRemarks || openQuery?.comment || 'Discrepancy identified in candidate driving licence or identity details. Correction requested.'}"
                                  </p>
                                </div>
                              </div>
                            ) : isApproved ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                  Approved by PO
                                </span>
                                <p className="text-[10px] text-slate-500 font-medium">
                                  Verified: {candidate.poApprovalTimestamp || candidate.greenSignalAt || candidate.enrolledAt}
                                </p>
                                <p className="text-[10px] text-teal-800 font-semibold">
                                  Auditor: {candidate.greenSignalBy || 'PO Board Verified'}
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                                  Pending PO Review
                                </span>
                                <p className="text-[10px] text-slate-400 font-medium">
                                  Form submitted • Awaiting PO inspection
                                </p>
                              </div>
                            )}
                          </td>

                          {/* Column 5: Actions & Audit Lock */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* View Dossier (Always available for viewing) */}
                              <button
                                onClick={() => {
                                  setSelectedCandidateForDossier(candidate);
                                  setIsDossierOpen(true);
                                }}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 inline-flex items-center gap-1 shadow-2xs"
                                title="View 3-page archival candidate dossier"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Dossier</span>
                              </button>

                              {/* Stage 1: Draft Mode - Full Local Edit */}
                              {isDraft ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedCandidateForEdit(candidate);
                                      setIsEditCandidateModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 inline-flex items-center gap-1 shadow-2xs transition-colors"
                                    title="Edit candidate details locally before evening batch dispatch"
                                  >
                                    <Unlock className="w-3 h-3 text-slate-600" />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedCandidateForCertPhotos(candidate);
                                      setIsCertPhotosModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-700 hover:bg-teal-800 text-white shadow-2xs inline-flex items-center gap-1 transition-colors"
                                    title="Attach certificate holding & handover photos"
                                  >
                                    <Camera className="w-3 h-3 text-teal-200" />
                                    <span>Photos</span>
                                  </button>
                                </>
                              ) : isReturned ? (
                                /* Stage 4: PO Returned for Correction - Unlocked for Discrepancy Fix */
                                <button
                                  onClick={() => {
                                    setSelectedCandidateForEdit(candidate);
                                    setIsEditCandidateModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-white shadow-xs inline-flex items-center gap-1 animate-pulse"
                                  title="PO flagged this record. Click to correct discrepancy and resubmit."
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Edit & Fix Discrepancy</span>
                                </button>
                              ) : (
                                /* Strict Post-Submission Lock */
                                <span
                                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-400 border border-slate-200 inline-flex items-center gap-1 select-none"
                                  title="Record is strictly locked post-submission. Edit is disabled unless returned for correction by PO."
                                >
                                  <Lock className="w-3 h-3 text-slate-400" />
                                  <span>Locked</span>
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* ==================================================== */}
      {/* 4. TAB 2: TRAVEL EXPENSES CLAIM FORM (DB SKILLS)     */}
      {/* ==================================================== */}
      {activeSubTab === 'expense_claim' && (
        <div className="space-y-6">
          {/* DB Skills Official Claim Form */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
            {/* Header Metadata Container (Official Letterhead) */}
            <div className="bg-gradient-to-r from-teal-950 via-[#0d5c63] to-teal-900 text-white p-6 sm:p-8 border-b-4 border-emerald-500">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold tracking-widest uppercase text-emerald-300">
                      DB SKILLS FOUNDATION • OFFICIAL REIMBURSEMENT
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/20 text-white">
                      FORM DBS-FIN-04
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    TRAVEL EXPENSES CLAIM FORM
                  </h2>
                  <p className="text-xs text-teal-100 mt-0.5">
                    Corporate Office: F48/31, Sector 12, Kharghar, Navi Mumbai 410210
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-right">
                  <span className="text-[10px] uppercase font-bold text-emerald-300 block">Sanction Head</span>
                  <span className="text-sm font-mono font-bold text-white block">
                    {claimSanctionNo}
                  </span>
                  <span className="text-[11px] text-teal-200">Status: Form Ready</span>
                </div>
              </div>

              {/* Header Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-teal-700/60 text-xs">
                <div>
                  <span className="text-teal-300 block font-semibold text-[10px] uppercase">Employee Name</span>
                  <strong className="text-white text-sm">{oseEmployee.name}</strong>
                </div>
                <div>
                  <span className="text-teal-300 block font-semibold text-[10px] uppercase">Employee ID</span>
                  <strong className="font-mono text-white text-sm">{oseEmployee.empCode}</strong>
                </div>
                <div>
                  <span className="text-teal-300 block font-semibold text-[10px] uppercase">Group & Level</span>
                  <strong className="text-white text-sm">DBSF • L4 (Executive)</strong>
                </div>
                <div>
                  <span className="text-teal-300 block font-semibold text-[10px] uppercase">Assigned Center</span>
                  <strong className="text-white text-sm">{activeCenter.code} ({activeCenter.city})</strong>
                </div>
              </div>
            </div>

            {/* Claim Entry Body */}
            <form onSubmit={handleExpenseClaimSubmit} className="p-6 sm:p-8 space-y-6">
              {/* Tour Context Metadata Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Purpose of Tour <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={claimPurpose}
                    onChange={e => setClaimPurpose(e.target.value)}
                    placeholder="e.g. Regional Meeting / Logistics / Outstation Driver Mobilization"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Operating Zone <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={claimZone}
                    onChange={e => setClaimZone(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="North">North Zone</option>
                    <option value="West">West Zone</option>
                    <option value="East">East Zone</option>
                    <option value="South">South Zone</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    value={claimProject}
                    onChange={e => setClaimProject(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tour Departure Date
                  </label>
                  <input
                    type="date"
                    value={travelStartDate}
                    onChange={e => setTravelStartDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tour Return Date
                  </label>
                  <input
                    type="date"
                    value={travelEndDate}
                    onChange={e => setTravelEndDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Itemized Expense Particulars with Mandatory Proof Upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-teal-800" />
                    Itemized Expense Particulars & Proof Upload (DB Skills Scale)
                  </h3>
                  <span className="text-xs text-slate-500">
                    Mandatory bill/receipt upload required for every line item
                  </span>
                </div>

                {/* Particular 1: Travelling Expenses - Fare */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center">
                        A
                      </span>
                      <strong className="text-xs text-slate-900">
                        Travelling Expenses — Fare (Train 3AC / Bus Ticket)
                      </strong>
                    </div>
                    <span className="text-[11px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      Entitlement: Train 3AC / State AC Bus
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Particulars / Route</label>
                      <input
                        type="text"
                        required
                        value={fareDescription}
                        onChange={e => setFareDescription(e.target.value)}
                        placeholder="Train / Bus name, From - To station, PNR number"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Amount Claimed (₹)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        placeholder="Enter Amount"
                        value={fareAmount > 0 ? fareAmount : ''}
                        onChange={e => setFareAmount(Number(e.target.value))}
                        className="w-full font-mono text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Ticket Proof (PDF/JPG) *</label>
                      <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300">
                        <Paperclip className="w-3.5 h-3.5 text-teal-700" />
                        <span className="truncate">{fareReceiptName || 'Choose Receipt File'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={e => handleReceiptUpload('fare', e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Particular 2: Travelling Expenses - L&B (Lodging & Boarding) */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center">
                        B
                      </span>
                      <strong className="text-xs text-slate-900">
                        Travelling Expenses — L&B (Lodging & Boarding / Hotel Stay)
                      </strong>
                    </div>
                    <span className="text-[11px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      Policy Cap: Non-Metro Hotel Limit
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Hotel Particulars & GST Details</label>
                      <input
                        type="text"
                        required
                        value={lodgingDescription}
                        onChange={e => setLodgingDescription(e.target.value)}
                        placeholder="Hotel name, City, GST invoice number, Number of nights"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Amount Claimed (₹)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        placeholder="Enter Amount"
                        value={lodgingAmount > 0 ? lodgingAmount : ''}
                        onChange={e => setLodgingAmount(Number(e.target.value))}
                        className="w-full font-mono text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Hotel GST Bill (PDF/JPG) *</label>
                      <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300">
                        <Paperclip className="w-3.5 h-3.5 text-teal-700" />
                        <span className="truncate">{lodgingReceiptName || 'Choose GST Bill'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={e => handleReceiptUpload('lodging', e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Particular 3: Travel - Others (Food DA / Local Conveyance) */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold flex items-center justify-center">
                        C
                      </span>
                      <strong className="text-xs text-slate-900">
                        Travel — Others (Daily Food Allowance [DA] & Local Conveyance Transit)
                      </strong>
                    </div>
                    <span className="text-[11px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                      DA Scale: ₹500/day Non-Metro
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">DA & Local Auto/Transit Details</label>
                      <input
                        type="text"
                        required
                        value={othersDescription}
                        onChange={e => setOthersDescription(e.target.value)}
                        placeholder="Daily Food Allowance particulars, days, local transit route"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Amount Claimed (₹)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        placeholder="Enter Amount"
                        value={othersAmount > 0 ? othersAmount : ''}
                        onChange={e => setOthersAmount(Number(e.target.value))}
                        className="w-full font-mono text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="text-[11px] font-semibold text-slate-600 block mb-1">Food / Auto Slips (PDF/JPG) *</label>
                      <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300">
                        <Paperclip className="w-3.5 h-3.5 text-teal-700" />
                        <span className="truncate">{othersReceiptName || 'Choose Vouchers'}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={e => handleReceiptUpload('others', e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settlement Calculations & Auto-Sum in Numeric and Text */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      Total Reimbursement Calculation
                    </span>
                    <h4 className="text-xl font-extrabold text-teal-950 font-mono">
                      ₹{totalClaimAmount.toLocaleString('en-IN')}
                    </h4>
                  </div>

                  <div className="bg-white px-3.5 py-2 rounded-xl border border-emerald-300 text-right">
                    <span className="text-[10px] text-slate-500 block uppercase font-bold">Sum in Words</span>
                    <span className="text-xs font-bold text-teal-900 italic">
                      {totalClaimInWords}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-emerald-200/80">
                  <input
                    type="checkbox"
                    id="declaration"
                    required
                    checked={declarationAccepted}
                    onChange={e => setDeclarationAccepted(e.target.checked)}
                    className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-600"
                  />
                  <label htmlFor="declaration" className="text-[11px] text-slate-700 cursor-pointer">
                    I, <strong>{oseEmployee.name}</strong>, hereby certify that the above expenses were genuinely incurred on official DB Skills operational duty and supported by genuine attached vouchers.
                  </label>
                </div>
              </div>

              {/* Submission Action */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <BadgeCheck className="w-4 h-4 text-emerald-600" />
                  <span>Submission routes this claim to General Manager & Central Accounts.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingClaim}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-teal-950/20"
                >
                  <Send className="w-4 h-4 text-emerald-200" />
                  <span>Submit Claim for GM / Accounts Sanction</span>
                </button>
              </div>
            </form>
          </div>

          {/* Past Claims Submitted by This OSE */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Personnel Claim Ledger
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  My Filed Travel Expense Claims ({oseClaims.length})
                </h3>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Claim Ref & Tour TSO</th>
                    <th className="py-3 px-4">Submission Date</th>
                    <th className="py-3 px-4">Total Claimed</th>
                    <th className="py-3 px-4">Sanction Status</th>
                    <th className="py-3 px-4">Settlement Reference</th>
                    <th className="py-3 px-4 text-right">PDF Voucher</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {oseClaims.map((claim) => (
                    <tr key={claim.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <strong className="font-mono text-teal-800 text-xs block">{claim.claimNumber}</strong>
                        <span className="text-[10px] text-slate-500 font-mono">{claim.tourSanctionNumber}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {claim.submissionDate}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        ₹{claim.totalClaimed.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            claim.status === 'Settled via Bank Transfer'
                              ? 'bg-emerald-100 text-emerald-800'
                              : claim.status === 'Approved by GM'
                              ? 'bg-teal-100 text-teal-800'
                              : claim.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {claim.status === 'Pending GM Review' ? 'Pending GM / Accounts Sanction' : claim.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {claim.bankReferenceNumber || '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedClaimForAudit(claim);
                              setIsAuditModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-xs bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 inline-flex items-center gap-1 transition-colors cursor-pointer"
                            title="Inspect complete timestamped lifecycle audit trail"
                          >
                            <History className="w-3.5 h-3.5 text-sky-700" />
                            Audit Trail
                          </button>
                          <button
                            onClick={() => {
                              const linkedTour = tours.find(t => t.id === claim.tourId);
                              generateExpenseClaimPdf(claim, linkedTour);
                              showToast(`Downloading DB Skills Voucher for ${claim.claimNumber}`);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 5. TAB 3: SELF-ATTENDANCE & DEPLOYMENT TIMELINE       */}
      {/* ==================================================== */}
      {activeSubTab === 'attendance_history' && (
        <div className="space-y-6">
          {/* Action Header Card */}
          <div className="bg-gradient-to-r from-teal-900 to-[#0d5c63] rounded-3xl p-6 text-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-emerald-300 font-bold">
                  Zero Supervisor • Automated Geotagging
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
                  GPS Verification Active
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                Employee Self-Attendance Ledger & Historical Deployment
              </h2>
              <p className="text-xs text-teal-100 mt-0.5">
                Every punch records real device GPS latitude/longitude, timestamp, and watermarked front camera selfie.
              </p>
            </div>

            <button
              onClick={() => setIsSelfAttendanceModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all shrink-0"
            >
              <Camera className="w-4 h-4" />
              <span>Punch Live Attendance Now</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Deployment Timeline (Left Column) */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Career Trajectory
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  Deployment History Timeline
                </h3>
                <p className="text-xs text-slate-500">
                  Official center assignments under DB Skills operations
                </p>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {deploymentPostings.map((posting, idx) => (
                  <div key={idx} className="relative">
                    <span
                      className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 ${
                        posting.isCurrent
                          ? 'bg-emerald-500 border-white ring-4 ring-emerald-100'
                          : 'bg-slate-400 border-white'
                      }`}
                    />
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                          {posting.status}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{posting.duration}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {posting.centerName}
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium">
                        {posting.role} ({posting.period})
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1 italic">
                        {posting.highlights}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance Punch Ledger (Right Column 2 Cols Wide) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                    Monthly Punch History
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">
                    Live Geotagged Attendance Ledger (September 2026)
                  </h3>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                    22 Present
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">
                    1 Late Flag
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-100 rounded-2xl max-h-[500px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Check-In Time</th>
                      <th className="py-3 px-4">Check-Out Time</th>
                      <th className="py-3 px-4">GPS Geotag Status</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {oseAttendanceLogs.map((log, i) => (
                      <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {log.date}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {log.checkIn}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {log.checkOut}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[11px] font-medium text-slate-700 block">{log.geofence}</span>
                          <span className="text-[10px] font-mono text-slate-400">{log.coordinates}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              log.status === 'Present'
                                ? 'bg-emerald-100 text-emerald-800'
                                : log.status === 'Late Arrival'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 6. TAB 4: CENTER ENROLLMENT TRENDS & ANALYTICS       */}
      {/* ==================================================== */}
      {activeSubTab === 'enrollment_trends' && (
        <div className="space-y-6">
          {/* Section Sub-header */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Center Performance Intelligence
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-mono text-slate-500">
                  {activeCenter.code} ({activeCenter.city}, {activeCenter.state})
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                6-Month Center Enrollment Trends & Target Performance
              </h2>
              <p className="text-xs text-slate-500">
                Detailed trainee throughput, target compliance, and commercial vehicle distribution for {activeCenter.name}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCenterCandidatesToExcel}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 flex items-center gap-1.5 shadow-2xs"
                title="Export center candidates to Microsoft Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Export to Excel
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSubTab('enrollment');
                  setCandidateSubView('form');
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#0d5c63] text-white hover:bg-teal-900 flex items-center gap-1.5 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-300" />
                Enroll Candidate
              </button>
            </div>
          </div>

          {/* Dedicated In-Depth Recharts Data Visualization Card */}
          <CenterEnrollmentTrendsChart
            activeCenter={activeCenter}
            centerCandidates={centerCandidates}
            className="shadow-sm"
          />

          {/* 6-Month Center Historical Ledger & Vehicle Mix */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Center Compliance Ledger
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  Monthly Trainee Intake & Vehicle Authorization Ledger
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Financial Year 2026-27 (Q1 - Q2)
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Billing Month</th>
                    <th className="py-3 px-4">Sanctioned Target</th>
                    <th className="py-3 px-4">Actual Enrolled</th>
                    <th className="py-3 px-4">Target Achievement</th>
                    <th className="py-3 px-4">Certified & Dispatched</th>
                    <th className="py-3 px-4">Primary Vehicle Class</th>
                    <th className="py-3 px-4">Audit Status</th>
                    <th className="py-3 px-4 text-right">Center Capacity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">April 2026</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{activeCenter.code === 'DL-02' ? 550 : 500}</td>
                    <td className="py-3 px-4 font-mono font-bold text-teal-900">{activeCenter.code === 'DL-02' ? 530 : 482}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {activeCenter.code === 'DL-02' ? '96%' : '96%'} Achieved
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-800 font-bold">{activeCenter.code === 'DL-02' ? 505 : 456}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">TRANS (42%) • HMV (28%)</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Senior Manager QC Closed
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono">100%</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">May 2026</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{activeCenter.code === 'DL-02' ? 550 : 500}</td>
                    <td className="py-3 px-4 font-mono font-bold text-teal-900">{activeCenter.code === 'DL-02' ? 560 : 514}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        103% (Surplus)
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-800 font-bold">{activeCenter.code === 'DL-02' ? 538 : 490}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">TRANS (40%) • LMV-TR (20%)</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Senior Manager QC Closed
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono">100%</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">June 2026</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{activeCenter.code === 'DL-02' ? 600 : 550}</td>
                    <td className="py-3 px-4 font-mono font-bold text-teal-900">{activeCenter.code === 'DL-02' ? 592 : 540}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        98% Achieved
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-800 font-bold">{activeCenter.code === 'DL-02' ? 570 : 518}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">TRANS (44%) • HMV (26%)</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Senior Manager QC Closed
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono">100%</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">July 2026</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{activeCenter.code === 'DL-02' ? 600 : 550}</td>
                    <td className="py-3 px-4 font-mono font-bold text-teal-900">{activeCenter.code === 'DL-02' ? 615 : 562}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        102% (Surplus)
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-800 font-bold">{activeCenter.code === 'DL-02' ? 592 : 539}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">TRANS (42%) • HMV (30%)</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Senior Manager QC Closed
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono">100%</td>
                  </tr>

                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">August 2026</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{activeCenter.code === 'DL-02' ? 650 : 600}</td>
                    <td className="py-3 px-4 font-mono font-bold text-teal-900">{activeCenter.code === 'DL-02' ? 638 : 588}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        98% Achieved
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-800 font-bold">{activeCenter.code === 'DL-02' ? 615 : 564}</td>
                    <td className="py-3 px-4 text-slate-600 font-mono">TRANS (45%) • HMV (25%)</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Senior Manager QC Closed
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono">100%</td>
                  </tr>

                  <tr className="hover:bg-teal-50/50 bg-teal-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-teal-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      September 2026 (Live MTD)
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{activeCenter.code === 'DL-02' ? 650 : 600}</td>
                    <td className="py-3 px-4 font-mono font-extrabold text-teal-900">
                      {(activeCenter.code === 'DL-02' ? 570 : 512) + centerCandidates.length}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        In Progress (Day 23)
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-emerald-800 font-bold">
                      {(activeCenter.code === 'DL-02' ? 542 : 480) + centerCandidates.filter(c => c.status === 'Certified & Dispatched').length}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-mono">TRANS • HMV • LMV-TR</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700">
                        PO Audit & QC Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-teal-800 font-mono font-bold">Active</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Center Operational Infrastructure Status Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Batch Classroom Capacity
                </span>
                <p className="text-sm font-extrabold text-slate-800 mt-1">
                  30 Candidates / Daily Session
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Center Hall 1: Audio-visual projector & defensive driving simulator equipped.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Trainer Deployment
                </span>
                <p className="text-sm font-extrabold text-slate-800 mt-1">
                  Level 4 Certified Trainers Active
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  100% attendance tracking via geotagged time-stamped group classroom photos.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  QC & Certification Pipeline
                </span>
                <p className="text-sm font-extrabold text-slate-800 mt-1">
                  1-Day Video Audit Resolution
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Direct PO Green Signal video verification with Senior Manager final dispatch sign-off.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* GLOBAL MODALS                                        */}
      {/* ==================================================== */}
      {/* WhatsApp Summary Modal */}
      <WhatsAppSummaryModal
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        batchId={currentBatch.id}
      />

      {/* Dossier Viewer Modal */}
      {selectedCandidateForDossier && (
        <DossierViewerModal
          isOpen={isDossierOpen}
          onClose={() => {
            setIsDossierOpen(false);
            setSelectedCandidateForDossier(null);
          }}
          candidateId={selectedCandidateForDossier.id}
        />
      )}

      {/* Live Geotagged Employee Self-Attendance Modal */}
      <EmployeeSelfAttendanceModal
        isOpen={isSelfAttendanceModalOpen}
        onClose={() => setIsSelfAttendanceModalOpen(false)}
      />

      {/* Edit & Fix Discrepancy Modal (PO Audit Lock Architecture) */}
      {selectedCandidateForEditDiscrepancy && (
        <EditDiscrepancyModal
          isOpen={isEditDiscrepancyOpen}
          onClose={() => {
            setIsEditDiscrepancyOpen(false);
            setSelectedCandidateForEditDiscrepancy(null);
          }}
          candidate={selectedCandidateForEditDiscrepancy}
          onResubmit={handleResubmitDiscrepancy}
        />
      )}

      {/* Edit Candidate Details Modal (Stage 1 Draft Edit & Stage 4 Correction) */}
      {selectedCandidateForEdit && (
        <EditCandidateModal
          isOpen={isEditCandidateModalOpen}
          onClose={() => {
            setIsEditCandidateModalOpen(false);
            setSelectedCandidateForEdit(null);
          }}
          candidate={selectedCandidateForEdit}
          onSaveCandidate={handleSaveEditCandidate}
        />
      )}

      {/* Mandatory Certificate Photo Upload Modal (Holding & Handover Proofs) */}
      {selectedCandidateForCertPhotos && (
        <CertificatePhotoUploadModal
          isOpen={isCertPhotosModalOpen}
          onClose={() => {
            setIsCertPhotosModalOpen(false);
            setSelectedCandidateForCertPhotos(null);
          }}
          candidate={selectedCandidateForCertPhotos}
          onSaveCertificatePhotos={handleSaveCertPhotos}
        />
      )}

      {/* End-of-Day Batch Dispatch Validation & Audit Lock Modal */}
      <BatchDispatchValidationModal
        isOpen={isBatchDispatchModalOpen}
        onClose={() => setIsBatchDispatchModalOpen(false)}
        draftCandidates={draftCandidates}
        onUploadPhotosForCandidate={(candidate) => {
          setSelectedCandidateForCertPhotos(candidate);
          setIsCertPhotosModalOpen(true);
        }}
        onConfirmDispatch={handleConfirmBatchDispatch}
      />

      {/* Expense Claim Audit Trail Modal */}
      <ExpenseAuditTrailModal
        isOpen={isAuditModalOpen}
        claim={selectedClaimForAudit}
        onClose={() => {
          setIsAuditModalOpen(false);
          setSelectedClaimForAudit(null);
        }}
      />
    </div>
  );
};
