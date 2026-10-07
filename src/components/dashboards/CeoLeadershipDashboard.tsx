import React, { useState } from 'react';
import {
  Building2,
  Users,
  Award,
  AlertTriangle,
  TrendingUp,
  Package,
  ShieldCheck,
  CheckCircle2,
  ArrowUpRight,
  MapPin,
  UserPlus,
  Calendar,
  Phone,
  Briefcase,
  X,
  Send,
  Eye,
  FileCheck2,
  ChevronRight,
  Search,
  Filter,
  Receipt,
  FileDown,
  Lock,
  BadgeCheck,
  CheckCircle,
  FileText,
  History,
  GraduationCap,
  Camera,
  Upload,
  Image as ImageIcon,
  KeyRound,
  Copy,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Center, Employee, UserRole, UserLevel, ExpenseClaim, ExpenseItem, AttendancePunch } from '../../types';
import { DossierViewerModal } from '../candidates/DossierViewerModal';
import { generateExpenseClaimPdf } from '../../utils/pdfGenerator';
import { ExpenseAuditTrailModal } from '../travel/ExpenseAuditTrailModal';
import { TrainingEfficacyChart } from './TrainingEfficacyChart';

export const CeoLeadershipDashboard: React.FC = () => {
  const {
    centers,
    candidates,
    batches,
    employees,
    employeeUsers,
    consumables,
    tours,
    leaves,
    expenseClaims,
    selectedCenterId,
    setSelectedCenterId,
    activeCenter,
    onboardEmployee,
    approveExpenseClaim,
    rejectExpenseClaim,
    settleExpenseClaim,
    gmResetPassword,
    attendanceLogs,
    showToast
  } = useApp();

  // Active Tab: Pan-India Overview vs Training Efficacy vs Employee Management vs Attendance vs Expense Sanctions
  const [activeTab, setActiveTab] = useState<'drilldown' | 'efficacy' | 'employees' | 'attendance_audit' | 'expenses'>('drilldown');
  const [inspectGmPunch, setInspectGmPunch] = useState<AttendancePunch | null>(null);
  const [gmAttendanceSearch, setGmAttendanceSearch] = useState('');
  const [gmAttendanceTypeFilter, setGmAttendanceTypeFilter] = useState<'ALL' | 'CHECK_IN' | 'CHECK_OUT'>('ALL');
  const [expenseFilter, setExpenseFilter] = useState<'all' | 'pending' | 'sanctioned' | 'disbursed' | 'returned'>('all');
  const [selectedClaimForSanction, setSelectedClaimForSanction] = useState<ExpenseClaim | null>(null);
  const [sanctionAmount, setSanctionAmount] = useState<number>(0);
  const [sanctionRemarks, setSanctionRemarks] = useState<string>('');
  const [auditTrailClaim, setAuditTrailClaim] = useState<ExpenseClaim | null>(null);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
    amount: string;
    claimant: string;
    invoiceNo?: string;
    gstin?: string;
  } | null>(null);

  // Drilldown Selected Center (defaults to activeCenter)
  const [drilldownCenterId, setDrilldownCenterId] = useState<string>(activeCenter.id);
  const selectedCenter = centers.find(c => c.id === drilldownCenterId) || centers[0];

  // Candidates at the drilled-down center
  const centerCandidates = candidates.filter(c => c.centerId === drilldownCenterId);
  const centerConsumables = consumables.filter(c => c.centerId === drilldownCenterId);

  // Pan-India Metrics
  const totalEnrolledPanIndia = candidates.length;
  const totalEmployeesPanIndia = employees.length;
  const totalCertifiedPanIndia = candidates.filter(c => c.status === 'Certified & Dispatched').length;
  const totalToursActive = tours.filter(t => t.status === 'Sanctioned' || t.status === 'Submitted').length;

  // Onboard New Employee Modal State
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState<UserRole>('Trainer');
  const [newEmpLevel, setNewEmpLevel] = useState<UserLevel>('Level 4');
  const [newEmpDesignation, setNewEmpDesignation] = useState('Assistant Road Safety Trainer');
  const [newEmpCenterId, setNewEmpCenterId] = useState(centers[0].id);
  const [newEmpPhone, setNewEmpPhone] = useState('+91 98');
  const [newEmpEmail, setNewEmpEmail] = useState('');
  const [newEmpDoj, setNewEmpDoj] = useState('2026-09-23');
  const [newEmpReporting, setNewEmpReporting] = useState('Pooja Verma (PO)');
  const [newEmpTarget, setNewEmpTarget] = useState(600);
  const [newEmpPhoto, setNewEmpPhoto] = useState<string>('');
  const [newEmpStatus, setNewEmpStatus] = useState<'Active' | 'On Leave' | 'Suspended'>('Active');

  // Password Reset Token Modal State (GM Authority)
  const [resetResultModal, setResetResultModal] = useState<{
    isOpen: boolean;
    empName: string;
    empId: string;
    email: string;
    newPassword: string;
  } | null>(null);
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  const handleGmIssuePassword = (userId: string, empName: string, empId: string, email: string) => {
    const res = gmResetPassword(userId);
    if (res.success) {
      setCopiedToken(false);
      setResetResultModal({
        isOpen: true,
        empName,
        empId,
        email,
        newPassword: res.newPasswordGenerated
      });
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('Image file too large. Please select a photo under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEmpPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Selected candidate for dossier view
  const [inspectCandidateId, setInspectCandidateId] = useState<string | null>(null);

  const handleRoleChange = (role: UserRole) => {
    setNewEmpRole(role);
    if (role === 'OSE') {
      setNewEmpLevel('Level 4');
      setNewEmpDesignation('Operation Support Executive');
      setNewEmpReporting('Pooja Verma (PO)');
      setNewEmpTarget(600);
    } else if (role === 'Trainer') {
      setNewEmpLevel('Level 4');
      setNewEmpDesignation('Commercial Vehicle Driver Trainer');
      setNewEmpReporting('Pooja Verma (PO)');
      setNewEmpTarget(600);
    } else if (role === 'PO') {
      setNewEmpLevel('Level 3');
      setNewEmpDesignation('Program Officer (Regional Ops)');
      setNewEmpReporting('Col. Rajesh Mehta (GM)');
      setNewEmpTarget(1200);
    } else if (role === 'Senior Manager') {
      setNewEmpLevel('Level 3');
      setNewEmpDesignation('Senior Manager (Quality & QC)');
      setNewEmpReporting('Col. Rajesh Mehta (GM)');
      setNewEmpTarget(1500);
    }
  };

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) {
      showToast('Please enter the employee full name');
      return;
    }

    const assignedCenter = centers.find(c => c.id === newEmpCenterId) || centers[0];

    onboardEmployee({
      name: newEmpName.trim(),
      role: newEmpRole,
      level: newEmpLevel,
      designation: newEmpDesignation,
      centerId: assignedCenter.id,
      centerName: assignedCenter.name,
      reportingOfficer: newEmpReporting,
      dateOfJoining: newEmpDoj,
      phone: newEmpPhone,
      email: newEmpEmail || `${newEmpName.toLowerCase().replace(/\s+/g, '.')}@dbskills.in`,
      avatar: newEmpPhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=256&q=80',
      monthlyTarget: Number(newEmpTarget),
      monthlyAchieved: 0
    });

    showToast(`Successfully provisioned ${newEmpName} (${newEmpRole}) at ${assignedCenter.name}`);

    setIsOnboardModalOpen(false);
    // Reset form
    setNewEmpName('');
    setNewEmpPhone('+91 98');
    setNewEmpEmail('');
    setNewEmpPhoto('');
    setNewEmpStatus('Active');
  };

  return (
    <div className="space-y-6">
      {/* CEO Strategic Leadership Header */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-[#072428] text-white rounded-3xl p-6 shadow-lg border border-teal-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold font-mono">
                COMMAND LEVEL 1 • GENERAL MANAGEMENT
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300">Pan-India Operations Headquarters</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Executive Leadership & National Governance
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time oversight over all {centers.length} national commercial driver academies, consumable stock ledgers, candidate certification waterfalls, and personnel deployment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('drilldown')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'drilldown'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-300" />
              <span>Center Deep Drilldown</span>
            </button>

            <button
              onClick={() => setActiveTab('efficacy')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'efficacy'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-emerald-300" />
              <span>Training Efficacy & Pass Rates</span>
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'employees'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-300" />
              <span>Employee Management ({employees.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance_audit')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'attendance_audit'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              <Camera className="w-4 h-4 text-emerald-300" />
              <span>Staff Attendance Punches</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white font-mono">
                {attendanceLogs.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'expenses'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              <Receipt className="w-4 h-4 text-emerald-300" />
              <span>Tour Expense Sanctions</span>
              {expenseClaims.filter(c => c.status === 'Pending GM Review' || c.status.toLowerCase().includes('pending')).length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950">
                  {expenseClaims.filter(c => c.status === 'Pending GM Review' || c.status.toLowerCase().includes('pending')).length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* PAN-INDIA MASTER SUMMARY METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pan-India Trainees Enrolled
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {totalEnrolledPanIndia}
              </span>
              <span className="text-xs text-emerald-600 font-bold flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5" /> +18.4% MoM
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across {centers.length} National Training Centers</p>
          </div>
          <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200 text-teal-800">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Active Employees
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {totalEmployeesPanIndia}
              </span>
              <span className="text-xs text-teal-700 font-bold">100% Deployed</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">OSE, Trainers, POs & Senior Managers</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Certified & Dispatched
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-emerald-700 tracking-tight">
                {totalCertifiedPanIndia}
              </span>
              <span className="text-xs text-slate-500 font-medium">Dossiers Handed Over</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Full 3-Page Archival Certified</p>
          </div>
          <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200 text-teal-800">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Official Tours
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-amber-600 tracking-tight">
                {totalToursActive}
              </span>
              <span className="text-xs text-amber-700 font-bold">In-Transit</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Field Audits & Mobile Batches</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800">
            <MapPin className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* TAB 1: CENTER-LEVEL DEEP DRILLDOWN */}
      {activeTab === 'drilldown' && (
        <div className="space-y-6">
          {/* Pan-India Batch Training Efficacy & Qualification Matrix */}
          <TrainingEfficacyChart
            centers={centers}
            candidates={candidates}
            batches={batches}
          />

          {/* Active Training Centers List with Regional Performance Indicators */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  National Training Network
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Select Training Center for Deep Operational Drilldown
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Click any center below to inspect real-time inventory ledger and candidate enrollment records
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {centers.map((center) => {
                const centerTrainees = candidates.filter(c => c.centerId === center.id);
                const isSelected = center.id === drilldownCenterId;
                return (
                  <div
                    key={center.id}
                    onClick={() => {
                      setDrilldownCenterId(center.id);
                      setSelectedCenterId(center.id);
                    }}
                    className={`cursor-pointer rounded-2xl p-4.5 border transition-all duration-200 ${
                      isSelected
                        ? 'border-teal-700 bg-teal-50/60 ring-2 ring-teal-600/30 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                        {center.code}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-300">
                        Active Hub
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm mt-2.5 leading-snug line-clamp-1">
                      {center.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{center.city}, {center.state}</p>

                    <div className="mt-3.5 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Enrolled Trainees</span>
                        <strong className="text-slate-900 text-sm font-extrabold">{centerTrainees.length}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Assigned PO</span>
                        <strong className="text-slate-700 text-xs font-semibold">{center.poName}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DEEP DRILLDOWN 1: CONSUMABLES STOCK LEDGER */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Center Consumables Stock Ledger
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedCenter.name} ({selectedCenter.code}) — Real-Time Inventory Count
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Minimum Buffer Threshold: 20-50 units per item
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {centerConsumables.map((item) => {
                const isLow = item.quantityOnHand < item.minimumThreshold;
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border ${
                      isLow
                        ? 'border-rose-300 bg-rose-50/60'
                        : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        {item.itemType}
                      </span>
                      {isLow && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                          Low Stock
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-2xl font-extrabold text-slate-900">
                        {item.quantityOnHand}
                      </span>
                      <span className="text-xs text-slate-500">{item.unit}</span>
                    </div>

                    {item.sizeBreakdown && (
                      <div className="mt-2 pt-2 border-t border-slate-200/80 grid grid-cols-4 gap-1 text-[10px] text-center font-mono">
                        <div>M: {item.sizeBreakdown.M}</div>
                        <div>L: {item.sizeBreakdown.L}</div>
                        <div>XL: {item.sizeBreakdown.XL}</div>
                        <div>XXL: {item.sizeBreakdown.XXL}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* DEEP DRILLDOWN 2: ENROLLED CANDIDATES REGISTRY */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  Center Trainee Registry
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedCenter.name} — Enrolled Candidates & Certification Records ({centerCandidates.length})
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Click "View Dossier" to inspect the official 3-page archival verification document
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Registration #</th>
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-4">Aadhaar & DL</th>
                    <th className="py-3 px-4">Enrollment Date</th>
                    <th className="py-3 px-4">Training Completion</th>
                    <th className="py-3 px-4">Certification Record</th>
                    <th className="py-3 px-4 text-right">Archival Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {centerCandidates.map((candidate) => (
                    <tr key={candidate.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-teal-800">
                        {candidate.registrationNumber}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{candidate.fullName}</p>
                        <p className="text-[10px] text-slate-400">S/O {candidate.fatherName}</p>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <p className="text-slate-800">{candidate.idCardNumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3')}</p>
                        <p className="text-[10px] text-teal-700">{candidate.dlNumber}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono">
                        {candidate.enrolledAt}
                      </td>
                      <td className="py-3 px-4">
                        {candidate.trainingDate ? (
                          <span className="font-mono text-slate-800 font-medium">
                            {candidate.trainingDate}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">In 1-Day Session</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            candidate.status === 'Certified & Dispatched'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : candidate.status === 'Green Signal (Video Call)'
                              ? 'bg-teal-100 text-teal-800 border border-teal-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {candidate.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setInspectCandidateId(candidate.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Dossier
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEDICATED TRAINING EFFICACY & QUALIFICATION MATRIX */}
      {activeTab === 'efficacy' && (
        <div className="space-y-6">
          <TrainingEfficacyChart
            centers={centers}
            candidates={candidates}
            batches={batches}
          />
        </div>
      )}

      {/* TAB 3: EMPLOYEE MANAGEMENT, CREDENTIAL RESET & ONBOARDING */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          {/* GM Credential Governance & Password Reset Section */}
          {(() => {
            const pendingResetUsers = employeeUsers.filter(u => u.resetRequested);
            return (
              <div className="space-y-4">
                {pendingResetUsers.length > 0 ? (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-amber-200">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-sm">
                          <KeyRound className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                              GM Credential Recovery Authority
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px]">
                              {pendingResetUsers.length} Action Required
                            </span>
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900">
                            Pending Password Reset Requests
                          </h3>
                        </div>
                      </div>
                      <p className="text-xs text-amber-900/80 font-medium max-w-sm">
                        Personnel who encountered login barriers and initiated recovery tickets via the homepage portal.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      {pendingResetUsers.map((user) => (
                        <div
                          key={user.id}
                          className="bg-white rounded-2xl border border-amber-200 p-4 shadow-2xs flex flex-col justify-between gap-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.photoUrl}
                                alt={user.name}
                                className="w-11 h-11 rounded-xl object-cover border border-amber-300"
                              />
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{user.name}</h4>
                                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                  <span className="font-mono font-semibold text-teal-800">{user.empId}</span>
                                  <span>•</span>
                                  <span>{user.role}</span>
                                </div>
                                <p className="text-[11px] text-slate-400">{user.email}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                              Reset Requested
                            </span>
                          </div>

                          <div className="bg-amber-50/60 rounded-xl p-2.5 text-[11px] text-slate-600 flex items-center justify-between">
                            <span>Hub: <strong className="text-slate-800">{user.assignedCenterName}</strong></span>
                            {user.resetRequestedAt && (
                              <span className="text-slate-400 font-mono text-[10px]">{user.resetRequestedAt}</span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleGmIssuePassword(user.id, user.name, user.empId, user.email)}
                            className="w-full py-2.5 rounded-xl bg-dbs-green hover:bg-dbs-green-dark text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-emerald-200" />
                            <span>Issue New Secure Password</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-600 text-white rounded-xl">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">All Personnel Credentials Active & Secure</h4>
                        <p className="text-[11px] text-slate-500">Zero pending employee password reset requests across all national hubs.</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-mono">
                      100% Operational
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                  National Personnel Governance
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Personnel Deployment Directory ({employees.length} Active Staff Members)
                </h3>
              </div>

              {/* Dedicated "Onboard New Employee" button */}
              <button
                onClick={() => setIsOnboardModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-[#0d5c63] hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-colors"
              >
                <UserPlus className="w-4 h-4 text-emerald-300" />
                <span>Onboard New Employee</span>
              </button>
            </div>

            {/* Personnel Deployment Directory Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Staff Member & Code</th>
                    <th className="py-3 px-4">Role & Level</th>
                    <th className="py-3 px-4">Deployment Center</th>
                    <th className="py-3 px-4">Tenure & Joining</th>
                    <th className="py-3 px-4">Leave Balance</th>
                    <th className="py-3 px-4">Driver Target Progress</th>
                    <th className="py-3 px-4">Tour Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => {
                    // Check if employee has an active tour request
                    const activeTour = tours.find(t => t.employeeId === emp.id && (t.status === 'Sanctioned' || t.status === 'Submitted'));
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <img
                            src={emp.avatar}
                            alt={emp.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900">{emp.name}</p>
                            <p className="text-[10px] font-mono text-teal-800 font-semibold">{emp.empCode}</p>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800">{emp.designation}</span>
                          <p className="text-[10px] text-slate-400">{emp.role} • {emp.level}</p>
                        </td>

                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800">{emp.centerName}</p>
                          <p className="text-[10px] text-slate-400">Reports to: {emp.reportingOfficer}</p>
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-700">
                          <p className="font-bold">{emp.tenureMonths} Months</p>
                          <p className="text-[10px] text-slate-400">Joined {emp.dateOfJoining}</p>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-slate-700 font-semibold">
                            {emp.casualLeaveBalance} Casual / {emp.compOffBalance} Comp-Off
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="w-36 space-y-1">
                            <div className="flex justify-between text-[10px] font-semibold">
                              <span>{emp.monthlyAchieved}</span>
                              <span className="text-slate-400">/ {emp.monthlyTarget}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-700 rounded-full"
                                style={{ width: `${Math.min(100, (emp.monthlyAchieved / emp.monthlyTarget) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {activeTour ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              Tour {activeTour.status} ({activeTour.destinationCity})
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Stationary at Hub</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* FEATURE 4 / TAB: STAFF ATTENDANCE & BIOMETRIC PROOFS */}
      {/* ==================================================== */}
      {activeTab === 'attendance_audit' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-300">
                  National Leadership Audit
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-semibold">Shared Store (localStorage: dbs_attendance_logs)</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Pan-India Field Staff Biometric Attendance & Watermark Audit
              </h2>
              <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
                As General Manager, inspect indelibly watermarked hardware webcam snapshots captured at employee duty start and end. Each punch verifies real-time Timestamp, Lat/Lng coordinates, Accuracy, and Resolved Center Address across all national hubs.
              </p>
            </div>

            {/* Quick Summary Cards */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Punches</span>
                <span className="text-lg font-extrabold text-slate-800 font-mono">{attendanceLogs.length}</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2.5 text-center">
                <span className="text-[10px] text-emerald-700 font-bold uppercase block">Geofence Valid</span>
                <span className="text-lg font-extrabold text-emerald-800 font-mono">
                  {attendanceLogs.filter(p => p.centerProximityStatus === 'Within Center Geofence').length}
                </span>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search staff member, designation, address or center..."
                  value={gmAttendanceSearch}
                  onChange={(e) => setGmAttendanceSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                {(['ALL', 'CHECK_IN', 'CHECK_OUT'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setGmAttendanceTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      gmAttendanceTypeFilter === type
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {type === 'ALL' ? 'All Punches' : type === 'CHECK_IN' ? 'Check-Ins' : 'Check-Outs'}
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              National Attendance Ledger: {attendanceLogs.length} Entries Recorded
            </span>
          </div>

          {/* Punches Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Watermarked Proof</th>
                    <th className="py-3.5 px-4">Staff Member</th>
                    <th className="py-3.5 px-4">Punch Action</th>
                    <th className="py-3.5 px-4">Timestamp (IST)</th>
                    <th className="py-3.5 px-4">GPS Coordinates</th>
                    <th className="py-3.5 px-4">Resolved Location</th>
                    <th className="py-3.5 px-4 text-right">GM Audit Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceLogs
                    .filter((p) => {
                      if (gmAttendanceTypeFilter !== 'ALL' && p.type !== gmAttendanceTypeFilter) return false;
                      if (gmAttendanceSearch.trim()) {
                        const q = gmAttendanceSearch.toLowerCase();
                        const matchesName = p.employeeName?.toLowerCase().includes(q);
                        const matchesTitle = p.designation?.toLowerCase().includes(q);
                        const matchesAddr = p.locationAddress?.toLowerCase().includes(q);
                        if (!matchesName && !matchesTitle && !matchesAddr) return false;
                      }
                      return true;
                    })
                    .map((punch) => {
                      const isCheckIn = punch.type === 'CHECK_IN';
                      return (
                        <tr key={punch.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div
                              onClick={() => setInspectGmPunch(punch)}
                              className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-300 shadow-2xs group cursor-pointer bg-slate-900"
                              title="Click to inspect burned watermark stamp"
                            >
                              <img
                                src={punch.photoWithWatermark}
                                alt="Watermarked proof"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-4 h-4 text-white" />
                              </div>
                              <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] text-white font-mono text-center truncate px-0.5">
                                WATERMARKED
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <div>
                              <p className="font-bold text-slate-900">{punch.employeeName}</p>
                              <p className="text-[11px] text-slate-500">{punch.designation}</p>
                              <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-1 rounded">
                                {punch.employeeId}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isCheckIn
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-orange-100 text-orange-800 border border-orange-200'
                              }`}
                            >
                              {isCheckIn ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              <span>{isCheckIn ? 'Check-In (Duty Start)' : 'Check-Out (Duty End)'}</span>
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono">
                            <p className="font-bold text-slate-800">{punch.timeFormatted}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(punch.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </td>

                          <td className="py-3 px-4 font-mono text-[11px]">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-slate-700">
                                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{punch.lat?.toFixed(5)}, {punch.lng?.toFixed(5)}</span>
                              </div>
                              <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {punch.centerProximityStatus}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-4 max-w-xs">
                            <p className="text-slate-700 truncate text-[11px]" title={punch.locationAddress}>
                              {punch.locationAddress || activeCenter.address}
                            </p>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setInspectGmPunch(punch)}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Inspect Watermark</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* FEATURE 3 / TAB 3: TOUR EXPENSE SANCTIONS DESK (GM)  */}
      {/* ==================================================== */}
      {activeTab === 'expenses' && (
        <div className="space-y-5">
          {/* Header Banner */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-300">
                  Level 2 Sanction Authority
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-semibold">General Manager Review Desk</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Tour Reimbursement Claims & Expense Sanctions
              </h2>
              <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
                As General Manager, you hold exclusive authority to audit line-item expenses, inspect attached GST receipts & transport vouchers, adjust approved totals, return claims with discrepancy notes, or grant final financial sanction. Accounts will process NEFT bank disbursement strictly upon GM approval.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setExpenseFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  expenseFilter === 'all'
                    ? 'bg-[#0d5c63] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({expenseClaims.length})
              </button>
              <button
                type="button"
                onClick={() => setExpenseFilter('pending')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                  expenseFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-amber-800 hover:text-amber-950 bg-amber-50/80'
                }`}
              >
                <span>Pending GM Review</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-950 font-black">
                  {expenseClaims.filter(c => c.status === 'Pending GM Review' || c.status.toLowerCase().includes('pending')).length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setExpenseFilter('sanctioned')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  expenseFilter === 'sanctioned'
                    ? 'bg-[#0d5c63] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sanctioned ({expenseClaims.filter(c => c.status === 'Approved by GM - Ready for Bank Disbursement' || c.status === 'Approved by GM').length})
              </button>
              <button
                type="button"
                onClick={() => setExpenseFilter('disbursed')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  expenseFilter === 'disbursed'
                    ? 'bg-[#0d5c63] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Disbursed ({expenseClaims.filter(c => c.status === 'Disbursed' || c.status === 'Settled via Bank Transfer').length})
              </button>
              <button
                type="button"
                onClick={() => setExpenseFilter('returned')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  expenseFilter === 'returned'
                    ? 'bg-[#0d5c63] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Returned ({expenseClaims.filter(c => c.status === 'Returned by GM for Correction' || c.status.toLowerCase().includes('returned')).length})
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-amber-200 rounded-3xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                  Pending GM Sanction
                </span>
                <span className="text-2xl font-black text-amber-950 font-mono mt-0.5 block">
                  ₹{expenseClaims
                    .filter(c => c.status === 'Pending GM Review' || c.status.toLowerCase().includes('pending'))
                    .reduce((sum, c) => sum + c.totalClaimed, 0)
                    .toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[11px] text-amber-700 font-semibold">
                  {expenseClaims.filter(c => c.status === 'Pending GM Review' || c.status.toLowerCase().includes('pending')).length} claims awaiting review
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-700">
                <Receipt className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-emerald-200 rounded-3xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                  GM Approved (Ready)
                </span>
                <span className="text-2xl font-black text-emerald-950 font-mono mt-0.5 block">
                  ₹{expenseClaims
                    .filter(c => c.status === 'Approved by GM - Ready for Bank Disbursement' || c.status === 'Approved by GM')
                    .reduce((sum, c) => sum + (c.totalApproved || c.totalClaimed), 0)
                    .toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[11px] text-emerald-700 font-semibold">
                  {expenseClaims.filter(c => c.status === 'Approved by GM - Ready for Bank Disbursement' || c.status === 'Approved by GM').length} approved for Accounts NEFT
                </span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-700">
                <BadgeCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-teal-200 rounded-3xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 block">
                  Disbursed via Bank
                </span>
                <span className="text-2xl font-black text-teal-950 font-mono mt-0.5 block">
                  ₹{expenseClaims
                    .filter(c => c.status === 'Disbursed' || c.status === 'Settled via Bank Transfer')
                    .reduce((sum, c) => sum + (c.totalApproved || c.totalClaimed), 0)
                    .toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[11px] text-teal-700 font-semibold">
                  {expenseClaims.filter(c => c.status === 'Disbursed' || c.status === 'Settled via Bank Transfer').length} settled via NEFT transfer
                </span>
              </div>
              <div className="p-3 bg-teal-50 rounded-2xl border border-teal-200 text-teal-700">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-rose-200 rounded-3xl p-4 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 block">
                  Returned for Discrepancy
                </span>
                <span className="text-2xl font-black text-rose-950 font-mono mt-0.5 block">
                  {expenseClaims.filter(c => c.status === 'Returned by GM for Correction' || c.status.toLowerCase().includes('returned')).length}
                </span>
                <span className="text-[11px] text-rose-700 font-semibold">
                  Sent back to claimant
                </span>
              </div>
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-rose-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Claims Queue Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {expenseClaims
              .filter(claim => {
                if (expenseFilter === 'all') return true;
                if (expenseFilter === 'pending') {
                  return claim.status === 'Pending GM Review' || claim.status.toLowerCase().includes('pending');
                }
                if (expenseFilter === 'sanctioned') {
                  return claim.status === 'Approved by GM - Ready for Bank Disbursement' || claim.status === 'Approved by GM';
                }
                if (expenseFilter === 'disbursed') {
                  return claim.status === 'Disbursed' || claim.status === 'Settled via Bank Transfer';
                }
                if (expenseFilter === 'returned') {
                  return claim.status === 'Returned by GM for Correction' || claim.status.toLowerCase().includes('returned');
                }
                return true;
              })
              .map(claim => {
                const correspondingTour = tours.find(t => t.id === claim.tourId);
                const isPending = claim.status === 'Pending GM Review' || claim.status.toLowerCase().includes('pending');
                const isApprovedByGm = claim.status === 'Approved by GM - Ready for Bank Disbursement' || claim.status === 'Approved by GM';
                const isDisbursed = claim.status === 'Disbursed' || claim.status === 'Settled via Bank Transfer';
                const isReturned = claim.status === 'Returned by GM for Correction' || claim.status.toLowerCase().includes('returned');

                const fareTotal = claim.fareAmount ?? claim.items.filter(i => i.category === 'Travel Ticket').reduce((sum, i) => sum + i.claimAmount, 0);
                const lbTotal = claim.lodgingBoardingAmount ?? claim.items.filter(i => i.category === 'Hotel/Lodging').reduce((sum, i) => sum + i.claimAmount, 0);
                const othersTotal = claim.othersDaAmount ?? claim.items.filter(i => i.category !== 'Travel Ticket' && i.category !== 'Hotel/Lodging').reduce((sum, i) => sum + i.claimAmount, 0);

                return (
                  <div
                    key={claim.id}
                    className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                              {claim.claimNumber}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              Sanction: {claim.tourSanctionNumber}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-slate-900 text-sm mt-1">{claim.employeeName}</h3>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {claim.designation || claim.employeeRole} • Emp ID: {claim.employeeId}
                          </span>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold text-right ${
                            isDisbursed
                              ? 'bg-teal-100 text-teal-900 border border-teal-300'
                              : isApprovedByGm
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : isReturned
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {claim.status}
                        </span>
                      </div>

                      {/* Project, Zone & Tour Purpose */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1.5">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px]">Project Name:</span>
                            <span className="font-bold text-slate-800">{claim.projectName || 'National Fleet Safety Mission'}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px]">Zone / Region:</span>
                            <span className="font-bold text-teal-900">{claim.zone || 'North-West Zone'}</span>
                          </div>
                        </div>

                        <div className="pt-1 border-t border-slate-200/60">
                          <span className="text-slate-400 block text-[10px]">Tour Dates & Purpose:</span>
                          <span className="font-bold text-slate-700 block font-mono text-[11px]">
                            {claim.tourDates || claim.submissionDate}
                          </span>
                          <p className="text-[11px] text-slate-600 italic mt-0.5 line-clamp-2">
                            "{claim.tourPurpose || 'Regional simulator instruction and fleet driver evaluation tour.'}"
                          </p>
                        </div>
                      </div>

                      {/* Itemized Breakdown Strip */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-blue-50/60 border border-blue-200/70 p-2.5 rounded-2xl">
                          <span className="text-[10px] uppercase font-bold text-blue-700 block">Fare Amount</span>
                          <span className="text-sm font-extrabold text-blue-950 font-mono">₹{fareTotal.toLocaleString()}</span>
                          <span className="text-[9px] text-blue-600 block">Tickets</span>
                        </div>

                        <div className="bg-amber-50/60 border border-amber-200/70 p-2.5 rounded-2xl">
                          <span className="text-[10px] uppercase font-bold text-amber-700 block">Lodging & Boarding</span>
                          <span className="text-sm font-extrabold text-amber-950 font-mono">₹{lbTotal.toLocaleString()}</span>
                          <span className="text-[9px] text-amber-600 block">Hotel GST Bills</span>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xs">
                          <span className="text-[10px] uppercase font-bold text-slate-700 block">Others / DA</span>
                          <span className="text-sm font-extrabold text-slate-900 font-mono">₹{othersTotal.toLocaleString()}</span>
                          <span className="text-[9px] text-slate-600 block">Food & Conveyance</span>
                        </div>
                      </div>

                      {/* Uploaded Line Items & Receipts */}
                      <div className="space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Uploaded Bills & Proofs ({claim.items.length})
                        </span>
                        <div className="space-y-1">
                          {claim.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-[11px] bg-slate-50/70 px-2.5 py-1.5 rounded-xl border border-slate-100"
                            >
                              <div className="truncate max-w-[240px]">
                                <span className="font-bold text-slate-800">{item.category}:</span>{' '}
                                <span className="text-slate-600">{item.description}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-mono font-bold text-slate-900">₹{item.claimAmount.toLocaleString()}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const defaultUrl = item.category === 'Hotel/Lodging'
                                      ? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
                                      : item.category === 'Travel Ticket'
                                      ? 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80'
                                      : 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80';
                                    setPreviewDoc({
                                      isOpen: true,
                                      title: `${item.category}: ${item.receiptName || item.description}`,
                                      url: item.receiptUrl || defaultUrl,
                                      amount: `₹${item.claimAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                                      claimant: `${claim.employeeName} (${claim.employeeRole || 'Field Staff'})`,
                                      invoiceNo: item.invoiceNumber,
                                      gstin: item.gstin
                                    });
                                  }}
                                  className="text-teal-700 hover:text-teal-900 p-0.5 rounded text-[10px] font-bold flex items-center gap-0.5"
                                  title="Inspect attached invoice/receipt"
                                >
                                  <Eye className="w-3 h-3 text-teal-600" />
                                  <span>View Bill</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Total Claimed & Sanction Details */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600">Total Claimed:</span>
                        <span className="text-lg font-extrabold text-teal-950 font-mono">
                          ₹{claim.totalClaimed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Reviewer / Discrepancy details */}
                      {claim.reviewedBy && (
                        <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl text-[11px] text-emerald-900 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold flex items-center gap-1">
                              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Sanctioned by: {claim.reviewedBy}
                            </span>
                            <span className="font-mono text-[10px] text-emerald-700">{claim.reviewedAt}</span>
                          </div>
                          {claim.gmRemarks && (
                            <p className="text-[10px] text-emerald-800 font-normal italic">
                              Remarks: {claim.gmRemarks}
                            </p>
                          )}
                        </div>
                      )}

                      {claim.status.includes('Returned') && claim.gmRemarks && (
                        <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-2xl text-[11px] text-rose-900">
                          <span className="font-bold block">Discrepancy Notes:</span>
                          <p className="text-[10px] text-rose-700">{claim.gmRemarks}</p>
                        </div>
                      )}

                      {claim.bankReferenceNumber && (
                        <div className="bg-teal-50 border border-teal-200 p-2 rounded-xl text-[11px] text-teal-900 font-mono">
                          Bank Ref: <strong>{claim.bankReferenceNumber}</strong> {claim.settledAt ? `• ${claim.settledAt}` : ''}
                        </div>
                      )}
                    </div>

                    {/* GM Action Footer */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => generateExpenseClaimPdf(claim, correspondingTour)}
                          className="py-1.5 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 cursor-pointer"
                        >
                          <FileDown className="w-3.5 h-3.5 text-teal-700" />
                          <span>Accounts PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAuditTrailClaim(claim);
                            setIsAuditTrailOpen(true);
                          }}
                          className="py-1.5 px-3 rounded-xs text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="View complete timestamped audit trail log (Submitted, SM Verified, GM Sanctioned, Disbursed)"
                        >
                          <History className="w-3.5 h-3.5 text-sky-700" />
                          <span>Audit Trail</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedClaimForSanction(claim);
                                setSanctionAmount(claim.totalClaimed);
                                setSanctionRemarks('Verified against DB Skills travel policy & tax receipts. Sanctioned in full.');
                              }}
                              className="py-1.5 px-3.5 rounded-xl text-xs font-bold bg-[#0d5c63] hover:bg-teal-900 text-white shadow-xs transition-colors flex items-center gap-1.5"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                              <span>Audit & Sanction</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                rejectExpenseClaim(claim.id, 'Bill discrepancy observed. Missing valid GST invoice / details.');
                              }}
                              className="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                            >
                              Return
                            </button>
                          </>
                        )}

                        {isApprovedByGm && (
                          <button
                            type="button"
                            onClick={() => {
                              settleExpenseClaim(claim.id, `HDFC-NEFT-${Math.floor(10000000 + Math.random() * 90000000)}`);
                            }}
                            className="py-1.5 px-3.5 rounded-xl text-xs font-bold bg-teal-800 hover:bg-teal-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Disburse NEFT</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* MODAL: GM EXPENSE CLAIM AUDIT & FINANCIAL SANCTION */}
      {selectedClaimForSanction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    GM Tour Expense Sanction Authority
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {selectedClaimForSanction.claimNumber} • {selectedClaimForSanction.employeeName} ({selectedClaimForSanction.employeeRole})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClaimForSanction(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary details */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Tour Sanction No:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedClaimForSanction.tourSanctionNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Submission Date:</span>
                  <span className="font-mono text-slate-700">{selectedClaimForSanction.submissionDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Tariff Scale:</span>
                  <span className="font-bold text-teal-900">{selectedClaimForSanction.cityType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Total Claimed:</span>
                  <span className="font-mono font-extrabold text-teal-900 text-sm">
                    ₹{selectedClaimForSanction.totalClaimed.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/70 text-[11px]">
                <span className="text-slate-400 block text-[10px]">Tour Purpose:</span>
                <span className="font-medium text-slate-700">
                  {selectedClaimForSanction.tourPurpose || 'Regional operational tour & safety instruction'}
                </span>
              </div>
            </div>

            {/* Attached Items List */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Itemized Expenses & Bill Proofs ({selectedClaimForSanction.items.length})
              </span>
              <div className="space-y-2">
                {selectedClaimForSanction.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{item.category}</span>
                        {item.invoiceNumber && (
                          <span className="text-[9px] font-mono bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                            Inv: {item.invoiceNumber}
                          </span>
                        )}
                        {item.gstin && (
                          <span className="text-[9px] font-mono bg-emerald-50 text-emerald-800 px-1.5 py-0.2 rounded border border-emerald-200">
                            GSTIN: {item.gstin}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{item.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-sm text-slate-900 block">
                        ₹{item.claimAmount.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const defaultUrl = item.category === 'Hotel/Lodging'
                            ? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
                            : item.category === 'Travel Ticket'
                            ? 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80'
                            : 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80';
                          setPreviewDoc({
                            isOpen: true,
                            title: `${item.category}: ${item.receiptName || item.description}`,
                            url: item.receiptUrl || defaultUrl,
                            amount: `₹${item.claimAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
                            claimant: `${selectedClaimForSanction.employeeName} (${selectedClaimForSanction.employeeRole || 'Field Staff'})`,
                            invoiceNo: item.invoiceNumber,
                            gstin: item.gstin
                          });
                        }}
                        className="text-teal-700 hover:text-teal-900 font-bold text-[10px] inline-flex items-center gap-1 mt-0.5"
                      >
                        <Eye className="w-3 h-3 text-teal-600" />
                        <span>Inspect Receipt</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GM Decision Inputs */}
            <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-200 text-teal-950 text-xs space-y-3">
              <div className="flex items-center gap-2 font-bold text-teal-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Financial Sanction Authorization</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-teal-900 block mb-1 uppercase">
                    Approved Sanction Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={sanctionAmount}
                    onChange={e => setSanctionAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-teal-300 bg-white text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-teal-900 block mb-1 uppercase">
                    GM Sanction Remarks / Discrepancy Note
                  </label>
                  <input
                    type="text"
                    value={sanctionRemarks}
                    onChange={e => setSanctionRemarks(e.target.value)}
                    placeholder="Enter sanction authorization or return discrepancy reason"
                    className="w-full px-3 py-2 rounded-xl border border-teal-300 bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedClaimForSanction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  rejectExpenseClaim(
                    selectedClaimForSanction.id,
                    sanctionRemarks || 'Bill discrepancy observed. Please re-upload verified GST tax invoice.'
                  );
                  setSelectedClaimForSanction(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300 transition-colors"
              >
                Return for Discrepancy
              </button>

              <button
                type="button"
                onClick={() => {
                  approveExpenseClaim(
                    selectedClaimForSanction.id,
                    sanctionAmount > 0 ? sanctionAmount : selectedClaimForSanction.totalClaimed,
                    sanctionRemarks || 'Sanctioned and verified in full by General Manager.'
                  );
                  setSelectedClaimForSanction(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Grant GM Financial Sanction</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INTERACTIVE RECEIPT & BILL VIEWER (PREVIEW DOC) */}
      {previewDoc?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 truncate max-w-md">
                    {previewDoc.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>Claimant: <strong className="text-slate-700">{previewDoc.claimant}</strong></span>
                    <span>•</span>
                    <span>Amount: <strong className="font-mono text-teal-800">{previewDoc.amount}</strong></span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Image & High-Fidelity Proof Viewport */}
            <div className="relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center min-h-[300px] max-h-[440px]">
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="w-full h-full object-contain max-h-[420px]"
              />
              <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-2.5 rounded-xl flex items-center justify-between text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-emerald-400" />
                  <span>
                    {previewDoc.invoiceNo ? `Invoice: ${previewDoc.invoiceNo}` : 'GST-Compliant Official Vouchers'}
                    {previewDoc.gstin ? ` • GSTIN: ${previewDoc.gstin}` : ''}
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-300">{previewDoc.amount}</span>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#0d5c63] hover:bg-teal-900 text-white transition-colors"
              >
                Done Inspecting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ONBOARD NEW EMPLOYEE */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-dbs-green-dark to-dbs-green text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-5 h-5 text-dbs-growth-light" />
                <h3 className="text-base font-bold">Onboard New DB Skills Employee</h3>
              </div>
              <button
                onClick={() => setIsOnboardModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Photo Upload & Live Preview Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <label className="font-bold text-slate-700 block mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-teal-700" />
                    <span>Employee ID Photo & Portrait Preview</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">PNG, JPG, WebP (Max 2MB)</span>
                </label>

                <div className="flex items-center gap-4">
                  {/* Photo Preview Circle */}
                  <div className="relative group shrink-0">
                    {newEmpPhoto ? (
                      <div className="relative">
                        <img
                          src={newEmpPhoto}
                          alt="Employee Preview"
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-600 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setNewEmpPhoto('')}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-[10px] shadow-sm cursor-pointer"
                          title="Remove uploaded photo"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shadow-2xs">
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                        <span className="text-[9px] font-bold mt-0.5 text-slate-400">No Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:border-teal-600 hover:bg-teal-50/50 text-slate-700 font-bold text-xs cursor-pointer transition-all shadow-2xs">
                      <Upload className="w-3.5 h-3.5 text-teal-700" />
                      <span>{newEmpPhoto ? 'Change Selected Photo' : 'Upload Employee Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <p className="text-[11px] text-slate-500">
                      High-resolution portrait for biometric ID badges and geofenced self-attendance punches.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Surendra Mohan"
                  value={newEmpName}
                  onChange={e => setNewEmpName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:ring-1 focus:ring-teal-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Official Email</label>
                  <input
                    type="email"
                    placeholder="e.g. s.mohan@dbskills.in"
                    value={newEmpEmail}
                    onChange={e => setNewEmpEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Account Status</label>
                  <select
                    value={newEmpStatus}
                    onChange={e => setNewEmpStatus(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Active">Active Duty</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Role / Designation</label>
                  <select
                    value={newEmpRole}
                    onChange={e => handleRoleChange(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Trainer">Trainer (Level 4)</option>
                    <option value="OSE">OSE (Level 4)</option>
                    <option value="PO">PO (Level 3)</option>
                    <option value="Senior Manager">Senior Manager (Level 3)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Center Location</label>
                  <select
                    value={newEmpCenterId}
                    onChange={e => setNewEmpCenterId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    {centers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile Contact</label>
                  <input
                    type="tel"
                    required
                    value={newEmpPhone}
                    onChange={e => setNewEmpPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date of Joining</label>
                  <input
                    type="date"
                    required
                    value={newEmpDoj}
                    onChange={e => setNewEmpDoj(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Reporting Authority</label>
                  <input
                    type="text"
                    required
                    value={newEmpReporting}
                    onChange={e => setNewEmpReporting(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Monthly Driver Target</label>
                  <input
                    type="number"
                    required
                    value={newEmpTarget}
                    onChange={e => setNewEmpTarget(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Complete Onboarding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DOSSIER INSPECTOR */}
      {inspectCandidateId && (
        <DossierViewerModal
          isOpen={true}
          onClose={() => setInspectCandidateId(null)}
          candidateId={inspectCandidateId}
        />
      )}

      {/* Expense Claim Audit Trail Modal */}
      <ExpenseAuditTrailModal
        isOpen={isAuditTrailOpen}
        claim={auditTrailClaim}
        onClose={() => {
          setIsAuditTrailOpen(false);
          setAuditTrailClaim(null);
        }}
      />

      {/* GM ISSUED PASSWORD RESET MODAL */}
      {resetResultModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-dbs-green-light text-dbs-green-dark rounded-2xl">
                  <KeyRound className="w-5 h-5 text-dbs-green" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Temporary Credential Issued
                  </h3>
                  <span className="text-[10px] font-bold text-dbs-green uppercase tracking-wider">
                    GM Sanction Complete
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetResultModal(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Employee Name:</span>
                  <span className="font-bold text-slate-900">{resetResultModal.empName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Employee ID:</span>
                  <span className="font-mono font-bold text-teal-800">{resetResultModal.empId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Official Email:</span>
                  <span className="font-mono text-slate-600">{resetResultModal.email}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Generated Temporary Password
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-3 font-mono text-lg font-black text-amber-900 tracking-wider select-all text-center">
                    {resetResultModal.newPassword}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(resetResultModal.newPassword);
                      setCopiedToken(true);
                      showToast('Copied password to clipboard');
                      setTimeout(() => setCopiedToken(false), 2500);
                    }}
                    className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center transition-colors cursor-pointer"
                    title="Copy Password"
                  >
                    {copiedToken ? (
                      <Check className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 leading-relaxed flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  The employee's recovery ticket is cleared. They can now authenticate using either their <strong>{resetResultModal.empId}</strong> or official email and this temporary password on the Staff Login modal.
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setResetResultModal(null)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close & Return to Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GM Attendance Watermark Inspection Modal */}
      {inspectGmPunch && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-300 flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Camera className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm leading-tight">
                    Biometric Watermark Audit - GM Leadership Desk
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Live hardware camera capture with burned watermark proof from shared store
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectGmPunch(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="relative w-full max-h-[460px] bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-700">
                <img
                  src={inspectGmPunch.photoWithWatermark}
                  alt="Watermarked punch proof"
                  className="max-h-[460px] w-auto object-contain mx-auto"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Staff Identity</span>
                  <p className="font-bold text-slate-900 text-sm">{inspectGmPunch.employeeName}</p>
                  <p className="text-slate-600">{inspectGmPunch.designation}</p>
                  <span className="text-xs font-mono text-teal-800 font-semibold">{inspectGmPunch.employeeId}</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Duty Status & Time</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${inspectGmPunch.type === 'CHECK_IN' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>
                      {inspectGmPunch.type === 'CHECK_IN' ? 'DUTY CHECK-IN' : 'DUTY CHECK-OUT'}
                    </span>
                    <strong className="text-slate-900 font-mono">{inspectGmPunch.timeFormatted}</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">Timestamp: {inspectGmPunch.timestamp}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">GPS Coordinates & Geofence</span>
                  <p className="font-mono text-emerald-800 font-bold">
                    Lat: {inspectGmPunch.lat?.toFixed(6)}, Lng: {inspectGmPunch.lng?.toFixed(6)}
                  </p>
                  <p className="text-[11px] text-slate-600">Proximity: {inspectGmPunch.centerProximityStatus}</p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Resolved Address</span>
                  <p className="text-slate-800 text-[11px]">{inspectGmPunch.locationAddress || activeCenter.address}</p>
                  <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-1">
                    ✓ Verified Indelible Watermark
                  </span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectGmPunch(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
