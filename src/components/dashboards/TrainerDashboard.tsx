import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  MapPin,
  Camera,
  CheckCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Briefcase,
  UserCheck,
  ShieldAlert,
  Search,
  ChevronRight,
  Maximize2,
  FileCheck,
  Layers,
  Building,
  User,
  ExternalLink,
  ChevronLeft,
  X,
  Send,
  Upload,
  Receipt,
  Eye,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Info,
  Wrench
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Candidate, LeaveType, LeaveRecord, ExpenseItem, ExpenseClaim, CenterIssueTicket } from '../../types';
import { ClassroomTrainingModal } from '../training/ClassroomTrainingModal';
import { EmployeeSelfAttendanceModal } from '../attendance/EmployeeSelfAttendanceModal';
import { ReportCenterIssueModal } from './ReportCenterIssueModal';

export const TrainerDashboard: React.FC = () => {
  const {
    candidates,
    activeCenter,
    currentPersona,
    employees,
    leaves,
    expenseClaims,
    applyLeave,
    submitExpenseClaim,
    showToast,
    attendancePunches,
    maintenanceTickets,
    createCenterTicket
  } = useApp();

  type TrainerTab =
    | 'batch_roster'
    | 'slide_deck'
    | 'leave_desk'
    | 'tour_claim'
    | 'attendance_profile'
    | 'facility_issues';

  const [activeTab, setActiveTab] = useState<TrainerTab>('batch_roster');

  // Slide deck modal
  const [isSlideDeckModalOpen, setIsSlideDeckModalOpen] = useState(false);
  const [isSelfPunchModalOpen, setIsSelfPunchModalOpen] = useState(false);
  const [punchModalType, setPunchModalType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');

  // Trainer employee profile
  const currentEmp = useMemo(() => {
    return employees.find(e => e.role === 'Trainer' && (e.id === currentPersona.id || e.name === currentPersona.name))
      || employees.find(e => e.role === 'Trainer')
      || employees[1];
  }, [employees, currentPersona]);

  // Tab 6: Facility Maintenance Issue State
  const [isNewIssueModalOpen, setIsNewIssueModalOpen] = useState(false);
  const [selectedTicketForView, setSelectedTicketForView] = useState<CenterIssueTicket | null>(null);

  const myCenterTickets = useMemo(() => {
    return maintenanceTickets.filter(t => t.centerId === activeCenter.id);
  }, [maintenanceTickets, activeCenter.id]);

    // Tab 1: Candidates for assigned center only (Strict read-only)
  const [searchRoster, setSearchRoster] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const centerCandidates = useMemo(() => {
    return candidates.filter(c => c.centerId === activeCenter.id);
  }, [candidates, activeCenter.id]);

  const filteredCandidates = useMemo(() => {
    if (!searchRoster.trim()) return centerCandidates;
    const q = searchRoster.toLowerCase();
    return centerCandidates.filter(c =>
      c.fullName.toLowerCase().includes(q) ||
      c.mobileNumber.includes(q) ||
      c.dlNumber.toLowerCase().includes(q) ||
      c.registrationNumber.toLowerCase().includes(q)
    );
  }, [centerCandidates, searchRoster]);

  // Tab 2: Embedded Slide Deck
  const SLIDE_MODULES = [
    {
      id: 1,
      title: 'Commercial Vehicle Defensive Driving & Space Cushioning',
      module: 'Module 1: Vehicle Dynamics',
      duration: '45 mins',
      bullets: [
        'Maintain minimum 4-second distance under dry highway conditions; 6-8 seconds in rain/fog.',
        'Heavy commercial trucks require up to 40% more braking distance than passenger cars.',
        'Anticipate pedestrian and two-wheeler sudden blind cut-ins at toll gates and bypasses.',
        'Always maintain an escape lane on the left shoulder during heavy traffic deceleration.'
      ],
      rule: 'Look 15-20 seconds ahead to detect hazard patterns before touching the brake pedal.',
      quiz: {
        q: 'What is the minimum recommended following distance for heavy trucks at 60 km/h in wet conditions?',
        options: ['2 seconds', '4 seconds', '6 to 8 seconds', '12 seconds'],
        correct: 2,
        exp: 'Wet asphalt reduces tire friction by nearly half, requiring 6-8 seconds cushion.'
      }
    },
    {
      id: 2,
      title: 'Heavy Truck Blind Zones (The "NO-ZONES")',
      module: 'Module 2: Spatial Safety',
      duration: '35 mins',
      bullets: [
        'Front Blind Zone: Commercial trucks have a 6-meter dead blind zone directly in front of the elevated cabin.',
        'Left & Right Blind Zones: Passenger side has an expansive 2-lane dead zone.',
        'Rear Blind Zone: Extends up to 60 meters directly behind closed containers or tankers.',
        'Convex and cross-view mirrors must be adjusted prior to moving wheels—never during transit.'
      ],
      rule: 'If you cannot see the driver in their side mirrors, they cannot see you.',
      quiz: {
        q: 'Where is the largest commercial truck blind zone located?',
        options: ['Directly above cabin', 'Passenger/Left side across 2 lanes', 'Inside vehicle', 'Bumper center'],
        correct: 1,
        exp: 'The passenger/left side has the widest blind perimeter due to distance from driver seat.'
      }
    },
    {
      id: 3,
      title: 'Hazard Perception & Intersections Protocol',
      module: 'Module 3: Hazard Management',
      duration: '40 mins',
      bullets: [
        'Scan roundabouts, traffic signals, and side-lanes 100 meters prior to approach.',
        'Never overtake on curves, steep inclines, bridges, or within 50 meters of railroad crossings.',
        'Maintain strict lane discipline in multi-axle trailers; avoid erratic zig-zagging.',
        'Night-driving protocol: Dim headlights within 200m of oncoming vehicles to avoid blinding dazzle.'
      ],
      rule: 'Treat every uncontrolled rural intersection as if an invisible obstacle is about to emerge.',
      quiz: {
        q: 'When must a heavy truck driver dim their high-beam headlights at night?',
        options: ['Only when parked', 'Within 200m of oncoming traffic', 'Never on highways', 'At toll booths only'],
        correct: 1,
        exp: 'High beams cause temporary retinal dazzle in opposing drivers, leading to head-on collisions.'
      }
    },
    {
      id: 4,
      title: 'Fatigue Management, Rest Cycles & Driver Wellness',
      module: 'Module 4: Human Factors',
      duration: '30 mins',
      bullets: [
        'Maximum continuous driving limit: 4.5 hours followed by mandatory 45-minute rest.',
        'Circadian low peaks between 2:00 AM – 5:00 AM and 2:00 PM – 4:00 PM: heightened vigilance required.',
        'Dehydration and poor posture amplify micro-sleep risks; hydrate with water, not high-sugar stimulants.',
        'Physical pre-trip warm-up: 5 minutes neck and shoulder stretching before taking the wheel.'
      ],
      rule: 'A 15-minute power nap beats a 500 km struggle with eyelids drooping.',
      quiz: {
        q: 'What is the maximum recommended continuous driving duration before a mandatory break?',
        options: ['2 hours', '4.5 hours', '8 hours', '12 hours'],
        correct: 1,
        exp: 'After 4.5 hours continuous steering, reaction latency drops by over 60%.'
      }
    }
  ];

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [showQuizExplanation, setShowQuizExplanation] = useState(false);

  const activeSlide = SLIDE_MODULES[currentSlideIndex];

  // Tab 3: Leave Application & Balances
  const [isApplyLeaveOpen, setIsApplyLeaveOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('Casual/Sick Leave');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [compOffDate, setCompOffDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  const myLeaves = useMemo(() => {
    return leaves.filter(l =>
      l.employeeId === currentEmp?.id ||
      l.employeeName === currentEmp?.name ||
      l.employeeRole === 'Trainer'
    );
  }, [leaves, currentEmp]);

  const calculateDays = () => {
    if (!leaveStart || !leaveEnd) return 1;
    const s = new Date(leaveStart);
    const e = new Date(leaveEnd);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const handleApplyLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd || !leaveReason.trim()) {
      showToast('Please provide leave dates and a valid operational reason.');
      return;
    }
    if (leaveType === 'Compensatory Off (Comp Off)' && !compOffDate.trim()) {
      showToast('Please specify the weekend / holiday duty date worked.');
      return;
    }

    const days = calculateDays();
    const success = applyLeave({
      employeeId: currentEmp?.id || currentPersona.id,
      employeeName: currentEmp?.name || currentPersona.name,
      employeeRole: 'Trainer',
      employeeLevel: 'Level 4',
      centerId: activeCenter.id,
      centerName: activeCenter.name,
      leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      daysCount: days,
      reason: leaveReason,
      compOffWorkDate: leaveType === 'Compensatory Off (Comp Off)' ? compOffDate : undefined
    });

    if (success) {
      setIsApplyLeaveOpen(false);
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveReason('');
      setCompOffDate('');
    }
  };

  // Tab 4: Travel Expense Claim Form
  const [isNewClaimOpen, setIsNewClaimOpen] = useState(false);
  const [claimProject, setClaimProject] = useState('Special Hazmat Fleet Driver Upskilling');
  const [claimZone, setClaimZone] = useState('North-West Zone');
  const [claimDates, setClaimDates] = useState('24 Sep 2026 – 26 Sep 2026');
  const [claimPurpose, setClaimPurpose] = useState('Emergency on-site hazmat chemical transport driver training at Kota Industrial Corridor');
  const [claimFareAmount, setClaimFareAmount] = useState<number>(0);
  const [claimFareReceipt, setClaimFareReceipt] = useState('');
  const [claimLbAmount, setClaimLbAmount] = useState<number>(0);
  const [claimLbReceipt, setClaimLbReceipt] = useState('');
  const [claimLbGstin, setClaimLbGstin] = useState('');
  const [claimOthersAmount, setClaimOthersAmount] = useState<number>(0);
  const [claimOthersReceipt, setClaimOthersReceipt] = useState('');
  const [selectedReceiptForPreview, setSelectedReceiptForPreview] = useState<{ name: string; type: string; amount: number; vendor?: string } | null>(null);

  const totalClaimAmount = Number((claimFareAmount + claimLbAmount + claimOthersAmount).toFixed(2));

  const myClaims = useMemo(() => {
    return expenseClaims.filter(c =>
      c.employeeId === currentEmp?.id ||
      c.employeeName === currentEmp?.name ||
      c.employeeRole === 'Trainer'
    );
  }, [expenseClaims, currentEmp]);

  const handleSubmitClaimForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalClaimAmount <= 0) {
      showToast('Claim amount must be greater than zero.');
      return;
    }

    const items: ExpenseItem[] = [
      {
        id: `itm-${Date.now()}-1`,
        category: 'Travel Ticket',
        description: `Official travel tickets: ${claimPurpose}`,
        date: new Date().toISOString().split('T')[0],
        claimAmount: claimFareAmount,
        entitlementLimit: claimFareAmount + 300,
        approvedAmount: claimFareAmount,
        receiptName: claimFareReceipt,
        invoiceNumber: `INV/TIC/${Math.floor(1000 + Math.random() * 9000)}`,
        vendorName: 'State Transport / IRCTC',
        isWithinPolicy: true
      },
      {
        id: `itm-${Date.now()}-2`,
        category: 'Hotel/Lodging',
        description: `Official accommodation: ${claimLbGstin ? `GSTIN ${claimLbGstin}` : ''}`,
        date: new Date().toISOString().split('T')[0],
        claimAmount: claimLbAmount,
        entitlementLimit: claimLbAmount + 500,
        approvedAmount: claimLbAmount,
        receiptName: claimLbReceipt,
        invoiceNumber: `HTL/${Math.floor(1000 + Math.random() * 9000)}`,
        vendorName: 'Corporate Transit Hotel',
        gstin: claimLbGstin,
        isWithinPolicy: true
      },
      {
        id: `itm-${Date.now()}-3`,
        category: 'Daily Food Allowance (DA)',
        description: 'Daily Food Allowance & local transit conveyance per diem',
        date: new Date().toISOString().split('T')[0],
        claimAmount: claimOthersAmount,
        entitlementLimit: claimOthersAmount + 200,
        approvedAmount: claimOthersAmount,
        receiptName: claimOthersReceipt,
        isWithinPolicy: true
      }
    ];

    submitExpenseClaim({
      tourId: `tour-trainer-${Date.now()}`,
      tourSanctionNumber: `TSO/DBS/2026/09/${Math.floor(100 + Math.random() * 899)}`,
      employeeId: currentEmp?.id || currentPersona.id,
      employeeName: currentEmp?.name || currentPersona.name,
      employeeRole: 'Trainer',
      employeeLevel: 'Level 4',
      designation: currentEmp?.designation || 'Senior Master Road Safety Trainer',
      submissionDate: new Date().toISOString().split('T')[0],
      cityType: 'Non-Metro',
      items,
      totalClaimed: totalClaimAmount,
      totalEntitlement: totalClaimAmount + 1000,
      totalApproved: totalClaimAmount,
      projectName: claimProject,
      zone: claimZone,
      tourDates: claimDates,
      tourPurpose: claimPurpose,
      fareAmount: claimFareAmount,
      lodgingBoardingAmount: claimLbAmount,
      othersDaAmount: claimOthersAmount,
      status: 'Pending GM Review'
    });

    setIsNewClaimOpen(false);
  };

  // Tab 5: Attendance Punches for Trainer
  const trainerPunches = useMemo(() => {
    return attendancePunches.filter(p =>
      p.employeeId === currentEmp?.id ||
      p.employeeName === currentEmp?.name ||
      p.designation?.includes('Trainer')
    );
  }, [attendancePunches, currentEmp]);

  return (
    <div className="space-y-6">
      {/* Role Header Banner */}
      <div className="bg-gradient-to-r from-dbs-green-dark via-dbs-green to-[#005C2E] text-white rounded-3xl p-6 sm:p-7 shadow-sm border border-dbs-green/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/15 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold tracking-wide">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-300" />
              <span>TRAINER WORKSPACE (LEVEL 4) — STRICT READ-ONLY OPERATIONAL DESK</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Master Road Safety Training Desk
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
              Assigned Hub: <strong className="text-white font-semibold">{activeCenter.name} ({activeCenter.code})</strong>.
              Delivering national commercial vehicle training curriculum with zero data administrative tampering privileges.
            </p>
          </div>

          {/* Quick Header Self-Service CTA */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setPunchModalType('CHECK_IN');
                setIsSelfPunchModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-transform active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Self Check-In</span>
            </button>

            <button
              onClick={() => {
                setPunchModalType('CHECK_OUT');
                setIsSelfPunchModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-transform active:scale-95"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Self Check-Out</span>
            </button>

            <button
              onClick={() => setIsSlideDeckModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white text-teal-900 hover:bg-teal-50 font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
            >
              <Maximize2 className="w-3.5 h-3.5 text-teal-700" />
              <span>Launch Classroom Deck</span>
            </button>
          </div>
        </div>

        {/* Operational Restriction Pill */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-teal-200">
            <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
            <span>
              <strong>Access Restriction:</strong> Read-only access to assigned center ({activeCenter.code}). Candidate editing, verification & deletion blocked.
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-teal-200">
            <span>Trainer: <strong>{currentEmp?.name || currentPersona.name}</strong></span>
            <span>•</span>
            <span>Employee ID: <strong className="font-mono text-white">{currentEmp?.empCode || 'DBS-EMP-0881'}</strong></span>
          </div>
        </div>
      </div>

      {/* High-Visibility 5 Sub-Tabs Navigation */}
      <div className="bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xs flex flex-wrap gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('batch_roster')}
          className={`flex-1 min-w-[200px] px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'batch_roster'
              ? 'bg-dbs-green text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>1. Today's Batch Roster</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/20 text-white font-bold">
            {centerCandidates.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('slide_deck')}
          className={`flex-1 min-w-[200px] px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'slide_deck'
              ? 'bg-dbs-green text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>2. 1-Day Presentation Deck</span>
        </button>

        <button
          onClick={() => setActiveTab('leave_desk')}
          className={`flex-1 min-w-[190px] px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'leave_desk'
              ? 'bg-dbs-green text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>3. Leave Desk & Balance</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700 font-bold">
            {currentEmp?.casualLeaveBalance || 5}d left
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tour_claim')}
          className={`flex-1 min-w-[190px] px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'tour_claim'
              ? 'bg-dbs-green text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>4. File Tour Claim</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-100 text-slate-700 font-bold">
            {myClaims.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('attendance_profile')}
          className={`flex-1 min-w-[190px] px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'attendance_profile'
              ? 'bg-dbs-green text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>5. Attendance & Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('facility_issues')}
          className={`flex-1 min-w-[190px] px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'facility_issues'
              ? 'bg-dbs-green text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>6. Report Center Issue</span>
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 text-amber-800 font-bold">
            {myCenterTickets.length}
          </span>
        </button>
      </div>

      {/* SUB-TAB 1: TODAY'S BATCH ROSTER (READ-ONLY CANDIDATE LIST) */}
      {activeTab === 'batch_roster' && (
        <div className="space-y-5">
          {/* Strict Role Guard Info Box */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3.5">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-800 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="text-xs text-amber-900 space-y-1">
              <p className="font-bold text-amber-950">
                STRICT READ-ONLY OPERATIONAL DESK (NO CANDIDATE DATA MODIFICATION PERMISSIONS)
              </p>
              <p className="text-amber-800/90 leading-relaxed">
                As a Master Road Safety Trainer (Level 4), your mandate is classroom delivery and driver instruction.
                You cannot enroll new candidates, edit demographics, change document status, or delete candidate profiles.
                For discrepancies or spelling errors, direct drivers to the Center Operation Support Executive (OSE).
              </p>
            </div>
          </div>

          {/* Roster Controls & Metric Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by candidate name, mobile, DL number..."
                value={searchRoster}
                onChange={e => setSearchRoster(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-700/20"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end text-xs text-slate-600">
              <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-medium">
                Scheduled Drivers: <strong className="text-slate-900">{filteredCandidates.length}</strong>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-medium">
                Assigned Center: <strong className="font-bold">{activeCenter.name}</strong>
              </div>
            </div>
          </div>

          {/* Read-Only Candidate Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Today's Classroom Training Batch Roster
                </h3>
                <p className="text-xs text-slate-500">
                  Read-only manifest of commercial vehicle drivers scheduled for training at {activeCenter.name}.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-mono text-[11px] font-bold">
                Read-Only Roster
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-4">Mobile Number</th>
                    <th className="py-3 px-4">Driving Licence (DL) Number</th>
                    <th className="py-3 px-4">Enrollment Date</th>
                    <th className="py-3 px-4">Father's Name</th>
                    <th className="py-3 px-4">Attendance Status</th>
                    <th className="py-3 px-4 text-right">View Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No candidates found matching the query for {activeCenter.name}.
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={c.photoUrl}
                              alt={c.fullName}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{c.fullName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{c.registrationNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {c.mobileNumber}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[11px]">
                            {c.dlNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {c.enrolledAt || '2026-09-23'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {c.fatherName}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {c.attendanceStatus || 'Scheduled'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedCandidate(c)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATE INSPECT MODAL (STRICT READ-ONLY) */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                  Read-Only Dossier
                </span>
                <h3 className="font-bold text-slate-900 text-sm">
                  {selectedCandidate.fullName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-start gap-4">
              <img
                src={selectedCandidate.photoUrl}
                alt={selectedCandidate.fullName}
                className="w-20 h-20 rounded-xl object-cover border border-slate-200"
              />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-900 text-sm">{selectedCandidate.fullName}</p>
                <p className="text-slate-500">Father's Name: <strong className="text-slate-800">{selectedCandidate.fatherName}</strong></p>
                <p className="text-slate-500">Mobile: <span className="font-mono font-bold text-slate-800">{selectedCandidate.mobileNumber}</span></p>
                <p className="text-slate-500">Driving Licence: <span className="font-mono font-bold text-blue-700">{selectedCandidate.dlNumber}</span></p>
                <p className="text-slate-500">Aadhaar: <span className="font-mono">{selectedCandidate.idCardNumber}</span></p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
              <p className="text-slate-500">Assigned Training Center: <strong className="text-slate-800">{activeCenter.name}</strong></p>
              <p className="text-slate-500">Batch Code: <strong className="text-slate-800">{activeCenter.code}-2609-B1</strong></p>
              <p className="text-slate-500">Enrolled On: <strong className="text-slate-800">{selectedCandidate.enrolledAt || '2026-09-23'}</strong></p>
              <p className="text-slate-500">Verification Status: <span className="text-emerald-700 font-bold">{selectedCandidate.status}</span></p>
            </div>

            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Trainer Desk is read-only. Editing or verifying candidates is reserved for OSE and PO.</span>
            </div>

            <button
              onClick={() => setSelectedCandidate(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: LAUNCH 1-DAY TRAINING PRESENTATION DECK */}
      {activeTab === 'slide_deck' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Standardized Curriculum
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs text-slate-500">National Defensive Driving Standards</span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900 mt-1">
                1-Day Commercial Vehicle Driver Training Presentation Deck
              </h2>
            </div>

            <button
              onClick={() => setIsSlideDeckModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs hover:from-emerald-700 hover:to-teal-800 transition-all shrink-0"
            >
              <Maximize2 className="w-4 h-4 text-emerald-200" />
              <span>Launch Full-Screen Classroom Projector Mode</span>
            </button>
          </div>

          {/* Interactive In-Console Slide Viewer */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
            {/* Top Slide Meta Bar */}
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold font-mono">
                  SLIDE {activeSlide.id} OF {SLIDE_MODULES.length}
                </span>
                <span className="text-xs text-slate-300 font-semibold">{activeSlide.module}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>Recommended Classroom Duration: <strong className="text-white">{activeSlide.duration}</strong></span>
              </div>
            </div>

            {/* Slide Body */}
            <div className="p-6 sm:p-8 space-y-6">
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {activeSlide.title}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSlide.bullets.map((b, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {b}
                    </p>
                  </div>
                ))}
              </div>

              {/* Critical Safety Rule Banner */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <p className="font-bold text-amber-950">CRITICAL MASTER TRAINER RULE:</p>
                  <p className="mt-0.5 leading-relaxed">{activeSlide.rule}</p>
                </div>
              </div>

              {/* In-Class Knowledge Check Quiz Box */}
              <div className="p-5 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-teal-700" />
                    <span className="font-bold text-teal-950 text-xs uppercase tracking-wide">
                      Classroom Knowledge Check (Test Trainees Now)
                    </span>
                  </div>
                  {showQuizExplanation && (
                    <span className="text-[11px] font-bold text-teal-800">
                      Answer Verified
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-slate-800">
                  {activeSlide.quiz.q}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeSlide.quiz.options.map((opt, oIdx) => {
                    const isSelected = selectedQuizAnswer === oIdx;
                    const isCorrect = oIdx === activeSlide.quiz.correct;
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => {
                          setSelectedQuizAnswer(oIdx);
                          setShowQuizExplanation(true);
                        }}
                        className={`text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                          showQuizExplanation
                            ? isCorrect
                              ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold'
                              : isSelected
                              ? 'bg-rose-100 border-rose-300 text-rose-900'
                              : 'bg-white border-slate-200 text-slate-600'
                            : isSelected
                            ? 'bg-teal-700 text-white border-teal-700 font-bold'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <span className="font-mono mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {showQuizExplanation && (
                  <p className="text-[11px] text-teal-900 bg-white/80 p-2.5 rounded-xl border border-teal-200">
                    <strong>Explanation:</strong> {activeSlide.quiz.exp}
                  </p>
                )}
              </div>
            </div>

            {/* Slide Navigation Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
              <button
                type="button"
                disabled={currentSlideIndex === 0}
                onClick={() => {
                  setCurrentSlideIndex(prev => Math.max(0, prev - 1));
                  setSelectedQuizAnswer(null);
                  setShowQuizExplanation(false);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-white text-xs font-bold text-slate-700 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Slide</span>
              </button>

              <div className="flex items-center gap-1.5">
                {SLIDE_MODULES.map((s, idx) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setCurrentSlideIndex(idx);
                      setSelectedQuizAnswer(null);
                      setShowQuizExplanation(false);
                    }}
                    className={`w-3 h-3 rounded-full transition-all ${
                      currentSlideIndex === idx ? 'bg-teal-700 w-6' : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>

              <button
                type="button"
                disabled={currentSlideIndex === SLIDE_MODULES.length - 1}
                onClick={() => {
                  setCurrentSlideIndex(prev => Math.min(SLIDE_MODULES.length - 1, prev + 1));
                  setSelectedQuizAnswer(null);
                  setShowQuizExplanation(false);
                }}
                className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 transition-colors"
              >
                <span>Next Slide</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: APPLY LEAVE & VIEW LEAVE BALANCE */}
      {activeTab === 'leave_desk' && (
        <div className="space-y-6">
          {/* Leave Quota Balance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Annual Quota</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">12</span>
                <span className="text-xs text-slate-500">Days / Year</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Paid casual/sick leave entitlement</p>
            </div>

            <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-2xs bg-emerald-50/20">
              <span className="text-xs font-bold uppercase text-emerald-700 tracking-wider">Casual Leave Balance</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-800">{currentEmp?.casualLeaveBalance ?? 5}</span>
                <span className="text-xs text-emerald-600">Days Available</span>
              </div>
              <p className="text-[11px] text-emerald-600 mt-1">Max 3 days allowed per month</p>
            </div>

            <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-2xs bg-blue-50/20">
              <span className="text-xs font-bold uppercase text-blue-700 tracking-wider">Comp-Off Balance</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-blue-800">{currentEmp?.compOffBalance ?? 3}</span>
                <span className="text-xs text-blue-600">Days Banked</span>
              </div>
              <p className="text-[11px] text-blue-600 mt-1">Earned from weekend camp duty</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Leave Taken</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {12 - (currentEmp?.casualLeaveBalance ?? 5)}
                </span>
                <span className="text-xs text-slate-500">Days Consumed</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Current calendar year</p>
            </div>
          </div>

          {/* Action Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              <p className="font-bold text-slate-900">Self-Service Leave Application Desk</p>
              <p className="text-slate-500">All applications automatically route to Program Officer (PO) & Regional Senior Manager for sanctioning.</p>
            </div>

            <button
              onClick={() => setIsApplyLeaveOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors shrink-0"
            >
              <Calendar className="w-4 h-4" />
              <span>Apply for Leave</span>
            </button>
          </div>

          {/* Leave History Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-sm">
                My Leave Applications Ledger
              </h3>
              <span className="text-xs text-slate-400">Total Applications: {myLeaves.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Leave Type</th>
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Days</th>
                    <th className="py-3 px-4">Reason</th>
                    <th className="py-3 px-4">Applied At</th>
                    <th className="py-3 px-4">Approval Status</th>
                    <th className="py-3 px-4">Reviewer Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No leave records found. Apply above when needed.
                      </td>
                    </tr>
                  ) : (
                    myLeaves.map(lv => (
                      <tr key={lv.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {lv.leaveType}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">
                          {lv.startDate} to {lv.endDate}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800 font-mono">
                          {lv.daysCount} d
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {lv.reason}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono">
                          {lv.appliedAt}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            lv.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : lv.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {lv.status === 'Approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {lv.status === 'Rejected' && <XCircle className="w-3 h-3 text-rose-600" />}
                            {lv.status === 'Pending' && <Clock className="w-3 h-3 text-amber-600" />}
                            {lv.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {lv.reviewedBy ? (
                            <div>
                              <p className="font-semibold text-slate-700">{lv.reviewRemarks || 'No remarks provided'}</p>
                              <p className="text-[10px] text-slate-400">By: {lv.reviewedBy}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Under review by PO / Senior Manager</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* APPLY LEAVE MODAL */}
      {isApplyLeaveOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                Apply for Official Staff Leave
              </h3>
              <button
                onClick={() => setIsApplyLeaveOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyLeaveSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Leave Type</label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value as LeaveType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold"
                >
                  <option value="Casual/Sick Leave">Casual / Sick Leave (Max 3 days/mo)</option>
                  <option value="Compensatory Off (Comp Off)">Compensatory Off (Comp Off)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveStart}
                    onChange={e => setLeaveStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveEnd}
                    onChange={e => setLeaveEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              {leaveType === 'Compensatory Off (Comp Off)' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Credit Duty Date Worked</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 13 Sep 2026 (Sunday Special Batch)"
                    value={compOffDate}
                    onChange={e => setCompOffDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Operational Reason</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Specify clear reason for leave..."
                  value={leaveReason}
                  onChange={e => setLeaveReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-teal-900 text-[11px]">
                <p><strong>Routing:</strong> Will be submitted to Pooja Verma (Program Officer) & Siddharth Nair (Senior Manager).</p>
                <p className="text-teal-700 mt-0.5">Calculated: <strong>{calculateDays()} day(s)</strong></p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApplyLeaveOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: FILE TOUR EXPENSE CLAIM (WITH RECEIPTS) */}
      {activeTab === 'tour_claim' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Official Travel Expenses Claim Filing & Audit Status
              </h3>
              <p className="text-xs text-slate-500">
                Submit formal TRAVEL EXPENSES CLAIM FORM post-tour with Fare, Hotel L&B, and Food/DA bills for GM (General Manager) sanction.
              </p>
            </div>

            <button
              onClick={() => setIsNewClaimOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors shrink-0"
            >
              <Receipt className="w-4 h-4" />
              <span>File New Expense Claim</span>
            </button>
          </div>

          {/* Submitted Claims List */}
          <div className="space-y-4">
            {myClaims.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
                No expense claims submitted yet. Click "File New Expense Claim" above to submit travel bills.
              </div>
            ) : (
              myClaims.map(claim => {
                const fare = claim.fareAmount ?? claim.items.filter(i => i.category === 'Travel Ticket').reduce((s, i) => s + i.claimAmount, 0);
                const lb = claim.lodgingBoardingAmount ?? claim.items.filter(i => i.category === 'Hotel/Lodging').reduce((s, i) => s + i.claimAmount, 0);
                const da = claim.othersDaAmount ?? claim.items.filter(i => i.category.includes('Food') || i.category.includes('Conveyance')).reduce((s, i) => s + i.claimAmount, 0);

                return (
                  <div key={claim.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
                    {/* Top Row: Claim Code & Status */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-sm">{claim.claimNumber}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-xs text-slate-500 font-mono">{claim.tourSanctionNumber}</span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">{claim.tourPurpose || claim.projectName}</p>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        claim.status.includes('Approved') || claim.status.includes('Settled')
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : claim.status.includes('Reject') || claim.status.includes('Return')
                          ? 'bg-rose-50 text-rose-800 border-rose-300'
                          : 'bg-amber-50 text-amber-800 border-amber-300'
                      }`}>
                        {claim.status}
                      </span>
                    </div>

                    {/* Breakdown Matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Fare (Bus / Train)</span>
                        <span className="font-bold text-slate-800 text-sm">₹ {fare.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Lodging & Boarding</span>
                        <span className="font-bold text-slate-800 text-sm">₹ {lb.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">DA / Food / Local</span>
                        <span className="font-bold text-slate-800 text-sm">₹ {da.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="border-l border-slate-200 pl-3">
                        <span className="text-teal-800 block text-[10px] uppercase font-bold">Total Claimed</span>
                        <span className="font-black text-teal-900 text-base">₹ {claim.totalClaimed.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    {/* Attached Bills & Receipts */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        Attached Audit Invoices & Proofs
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {claim.items.map(item => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedReceiptForPreview({
                              name: item.receiptName || 'Receipt_Doc.pdf',
                              type: item.category,
                              amount: item.claimAmount,
                              vendor: item.vendorName || item.description
                            })}
                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-teal-500 text-xs text-slate-700 font-medium flex items-center gap-2 shadow-2xs transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-teal-700" />
                            <span>{item.receiptName || `${item.category}.pdf`}</span>
                            <span className="text-[10px] font-mono text-slate-400">₹{item.claimAmount}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* GM Audit Feedback Note if exists */}
                    {(claim.gmRemarks || claim.apmRemarks) && (
                      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
                        <p className="font-bold text-blue-950">GM (General Manager) Review Feedback:</p>
                        <p className="mt-0.5">{claim.gmRemarks || claim.apmRemarks}</p>
                        {(claim.reviewedBy || claim.apmApprovedBy) && (
                          <p className="text-[10px] text-blue-700 mt-1 font-semibold">Reviewed by: {claim.reviewedBy || claim.apmApprovedBy} at {claim.reviewedAt || claim.apmApprovedAt}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* FILE NEW EXPENSE CLAIM MODAL */}
      {isNewClaimOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                  Official Finance Form
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm mt-0.5">
                  TRAVEL EXPENSES CLAIM FORM (LEVEL 4 TRAINER)
                </h3>
              </div>
              <button
                onClick={() => setIsNewClaimOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitClaimForm} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Trainer Name</span>
                  <strong className="text-slate-800">{currentEmp?.name || currentPersona.name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Designation</span>
                  <strong className="text-slate-800">Trainer - Level 4</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Employee ID</span>
                  <span className="font-mono text-slate-800 font-bold">{currentEmp?.empCode || 'DBS-EMP-0881'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Assigned Center</span>
                  <strong className="text-slate-800">{activeCenter.name}</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  value={claimProject}
                  onChange={e => setClaimProject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Zone</label>
                  <input
                    type="text"
                    required
                    value={claimZone}
                    onChange={e => setClaimZone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tour Dates</label>
                  <input
                    type="text"
                    required
                    value={claimDates}
                    onChange={e => setClaimDates(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Purpose of Tour</label>
                <textarea
                  rows={2}
                  required
                  value={claimPurpose}
                  onChange={e => setClaimPurpose(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              {/* Itemized Expenses Breakdown */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 text-xs">Itemized Expenses & Bill Uploads</h4>

                {/* 1. Fare */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>1. Travel Fare (Train / Volvo / Bus)</span>
                    <span className="font-mono text-teal-800">₹ {claimFareAmount}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="Fare Amount"
                      value={claimFareAmount}
                      onChange={e => setClaimFareAmount(parseFloat(e.target.value) || 0)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Ticket File Name"
                      value={claimFareReceipt}
                      onChange={e => setClaimFareReceipt(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                {/* 2. Hotel L&B */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>2. Lodging & Boarding (L&B Hotel Invoice)</span>
                    <span className="font-mono text-teal-800">₹ {claimLbAmount}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="L&B Amount"
                      value={claimLbAmount}
                      onChange={e => setClaimLbAmount(parseFloat(e.target.value) || 0)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Hotel Invoice PDF"
                      value={claimLbReceipt}
                      onChange={e => setClaimLbReceipt(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Hotel GSTIN"
                      value={claimLbGstin}
                      onChange={e => setClaimLbGstin(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>

                {/* 3. Others / Food DA */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>3. Daily Allowance (DA) & Local Conveyance</span>
                    <span className="font-mono text-teal-800">₹ {claimOthersAmount}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      placeholder="Food/Others Amount"
                      value={claimOthersAmount}
                      onChange={e => setClaimOthersAmount(parseFloat(e.target.value) || 0)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Food Slips / Conveyance PDF"
                      value={claimOthersReceipt}
                      onChange={e => setClaimOthersReceipt(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-teal-800">Total Claimed Reimbursement</span>
                  <p className="text-[11px] text-teal-700">Routes to Siddharth Nair (Senior Manager) for formal audit & sanction</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-teal-950 font-mono">
                    ₹ {totalClaimAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewClaimOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold"
                >
                  Submit for Senior Manager Sanction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL */}
      {selectedReceiptForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Attached Invoice Inspection
                </h3>
              </div>
              <button
                onClick={() => setSelectedReceiptForPreview(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">File Attachment:</span>
                <span className="font-mono font-bold text-slate-800">{selectedReceiptForPreview.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="font-bold text-slate-800">{selectedReceiptForPreview.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Claim Amount:</span>
                <span className="font-mono font-bold text-emerald-700">₹ {selectedReceiptForPreview.amount.toFixed(2)}</span>
              </div>
              {selectedReceiptForPreview.vendor && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Vendor / Details:</span>
                  <span className="text-slate-700">{selectedReceiptForPreview.vendor}</span>
                </div>
              )}
            </div>

            <div className="h-44 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
              <FileText className="w-10 h-10 text-slate-400 mb-2" />
              <p className="font-bold text-slate-600">Simulated Verified High-Resolution Tax Document</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Attached via DB Skills Secure File Vault</p>
            </div>

            <button
              onClick={() => setSelectedReceiptForPreview(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: MY SELF-ATTENDANCE HISTORY & PROFILE */}
      {activeTab === 'attendance_profile' && (
        <div className="space-y-6">
          {/* Trainer Profile Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <img
                  src={currentEmp?.avatar || currentPersona.avatar}
                  alt={currentEmp?.name || currentPersona.name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-xs"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">{currentEmp?.name || currentPersona.name}</h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      Trainer - Level 4
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{currentEmp?.designation || 'Senior Master Road Safety Trainer'}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {currentEmp?.empCode || 'DBS-EMP-0881'} • Joined: {currentEmp?.dateOfJoining || '2023-01-10'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPunchModalType('CHECK_IN');
                    setIsSelfPunchModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Self Check-In</span>
                </button>
                <button
                  onClick={() => {
                    setPunchModalType('CHECK_OUT');
                    setIsSelfPunchModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Self Check-Out</span>
                </button>
              </div>
            </div>

            {/* Profile Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Center</span>
                <strong className="text-slate-900 text-sm mt-0.5 block">{activeCenter.name}</strong>
                <span className="text-[10px] text-teal-800 font-mono font-bold">{activeCenter.code}</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Reporting Officer</span>
                <strong className="text-slate-900 text-sm mt-0.5 block">{currentEmp?.reportingOfficer || 'Pooja Verma (PO)'}</strong>
                <span className="text-[10px] text-slate-500">Program Officer (North)</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Tenure</span>
                <strong className="text-slate-900 text-sm mt-0.5 block">{currentEmp?.tenureMonths || 44} Months</strong>
                <span className="text-[10px] text-slate-500">Continuous Service</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Monthly Target</span>
                <strong className="text-slate-900 text-sm mt-0.5 block">{currentEmp?.monthlyAchieved || 540} / {currentEmp?.monthlyTarget || 600}</strong>
                <span className="text-[10px] text-emerald-600 font-bold">90% Drivers Trained</span>
              </div>
            </div>

            {/* Past Center Postings & Deployment Timeline */}
            <div className="space-y-3 pt-2">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
                Past Center Postings & Mobilisation History
              </h4>
              <div className="space-y-2.5">
                {(currentEmp?.deploymentHistory && currentEmp.deploymentHistory.length > 0) ? (
                  currentEmp.deploymentHistory.map(hist => (
                    <div key={hist.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-teal-800 text-[11px]">{hist.orderNumber}</span>
                          <span className="text-slate-400">•</span>
                          <span className="font-bold text-slate-800">{hist.fromCenterName} → {hist.toCenterName}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{hist.reason}</p>
                      </div>
                      <div className="text-right shrink-0 text-[11px] text-slate-400">
                        <p className="font-semibold text-slate-600">Effective: {hist.effectiveDate}</p>
                        <p>Authorized by: {hist.assignedBy}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">ORD/MOB/2026/07/218 • Mumbai Central → Jodhpur Transport Hub</p>
                      <p className="text-slate-500 text-[11px]">Heavy simulation module trainer deployment and regional instructor calibration</p>
                    </div>
                    <span className="text-slate-400 text-[11px]">Effective: 15 Jul 2026 (By Siddharth Nair Senior Manager)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Self-Attendance Punches Log */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Live Geotagged Attendance Punch History
                </h3>
                <p className="text-xs text-slate-500">
                  Zero manual supervisor overrides. Indelible GPS location stamping with late-arrival tracking.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
                Today: Duty Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Punch Type</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Center Locality</th>
                    <th className="py-3 px-4">GPS Coordinates</th>
                    <th className="py-3 px-4">Geofence Compliance</th>
                    <th className="py-3 px-4">Arrival Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trainerPunches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400">
                        No biometric punches recorded today yet. Click "Self Check-In" to record live GPS photo punch.
                      </td>
                    </tr>
                  ) : (
                    trainerPunches.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            p.type === 'CHECK_IN'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.type === 'CHECK_IN' ? 'Duty Start (In)' : 'Duty End (Out)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-800 font-bold">
                          {p.timestamp}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {p.locationAddress}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {p.lat.toFixed(4)}, {p.lng.toFixed(4)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.centerProximityStatus === 'Within Center Geofence'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {p.centerProximityStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-emerald-700 text-[11px]">
                            On Time (Before 09:00 AM)
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: REPORT CENTER FACILITY ISSUE */}
      {activeTab === 'facility_issues' && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  Center Infrastructure
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">3-Tier PO & Senior Manager Maintenance Escalation</span>
              </div>
              <h2 className="text-base font-extrabold text-slate-900 mt-1">
                Report & Track Center Facility & Maintenance Issues
              </h2>
              <p className="text-xs text-slate-500">
                Log equipment malfunctions, RO water leaks, projector audio faults, or sanitation defects for immediate PO verification and Senior Manager repair sanction.
              </p>
            </div>

            <button
              onClick={() => setIsNewIssueModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors shrink-0"
            >
              <Wrench className="w-4 h-4" />
              <span>Report Facility Issue</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Reported</span>
              <strong className="text-xl font-black text-slate-900 mt-1 block">{myCenterTickets.length}</strong>
              <span className="text-[11px] text-slate-500">At {activeCenter.name}</span>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200 shadow-2xs">
              <span className="text-amber-800 block text-[10px] uppercase font-bold">Pending PO Audit</span>
              <strong className="text-xl font-black text-amber-900 mt-1 block">
                {myCenterTickets.filter(t => t.status === "Pending PO Verification").length}
              </strong>
              <span className="text-[11px] text-amber-700">Awaiting PO Green Signal</span>
            </div>

            <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200 shadow-2xs">
              <span className="text-blue-800 block text-[10px] uppercase font-bold">Endorsed to Senior Manager</span>
              <strong className="text-xl font-black text-blue-900 mt-1 block">
                {myCenterTickets.filter(t => t.status === "Endorsed by PO").length}
              </strong>
              <span className="text-[11px] text-blue-700">Awaiting Senior Manager repair order</span>
            </div>

            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 shadow-2xs">
              <span className="text-emerald-800 block text-[10px] uppercase font-bold">Resolved / Fixed</span>
              <strong className="text-xl font-black text-emerald-900 mt-1 block">
                {myCenterTickets.filter(t => t.status === "Resolved by Senior Manager" || t.status === "Resolved by APM").length}
              </strong>
              <span className="text-[11px] text-emerald-700">Work completed & verified</span>
            </div>
          </div>

          {/* Status Log Table */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Center Maintenance Tickets Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time status tracking from Trainer log to PO endorsement and Senior Manager vendor resolution.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono font-bold">
                {myCenterTickets.length} Tickets
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">Ticket ID</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Issue Title & Description</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Reported On</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myCenterTickets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No maintenance issues logged for this center yet.
                      </td>
                    </tr>
                  ) : (
                    myCenterTickets.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-teal-800">
                          {t.id}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {t.category}
                        </td>
                        <td className="py-3 px-4 max-w-sm">
                          <p className="font-bold text-slate-900">{t.title}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{t.description}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.priority === "High"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : t.priority === "Medium"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {t.createdAt}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === "Resolved by Senior Manager" || t.status === "Resolved by APM"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : t.status === "Endorsed by PO"
                              ? "bg-blue-100 text-blue-800 border border-blue-200"
                              : t.status === "Rejected"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}>
                            {(t.status === "Resolved by Senior Manager" || t.status === "Resolved by APM") && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {t.status === "Endorsed by PO" && <Send className="w-3 h-3 text-blue-600" />}
                            {t.status === "Pending PO Verification" && <Clock className="w-3 h-3 text-amber-600" />}
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedTicketForView(t)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT FACILITY ISSUE MODAL */}
      <ReportCenterIssueModal
        isOpen={isNewIssueModalOpen}
        onClose={() => setIsNewIssueModalOpen(false)}
        reportingTrainerName={currentEmp?.name || currentPersona.name}
        centerName={activeCenter.name}
        centerCode={activeCenter.code}
        poName={activeCenter.poName}
        onSubmit={(ticketData) => {
          createCenterTicket({
            centerId: activeCenter.id,
            centerName: activeCenter.name,
            reportedByTrainerId: currentEmp?.id || currentPersona.id,
            reportedByTrainerName: currentEmp?.name || currentPersona.name,
            category: ticketData.category,
            title: ticketData.title,
            description: ticketData.description,
            priority: ticketData.priority,
            photoUrl: ticketData.photoUrl
          });
          showToast("Center facility maintenance issue submitted to PO.");
        }}
      />

      {/* TICKET DETAILS MODAL */}
      {selectedTicketForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-teal-800 text-xs">{selectedTicketForView.id}</span>
                <h3 className="font-bold text-slate-900 text-sm">Maintenance Ticket Details</h3>
              </div>
              <button
                onClick={() => setSelectedTicketForView(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400">Category & Title</span>
                <p className="text-sm font-bold text-slate-900">{selectedTicketForView.title}</p>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                  {selectedTicketForView.category}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">Ground Problem Description</span>
                <p className="text-slate-800 leading-relaxed">{selectedTicketForView.description}</p>
              </div>

              {selectedTicketForView.photoUrl && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Attached Photo Evidence</span>
                  <img
                    src={selectedTicketForView.photoUrl}
                    alt={selectedTicketForView.title}
                    className="w-full h-44 rounded-xl object-cover border border-slate-200"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Reported By</span>
                  <strong className="text-slate-800">{selectedTicketForView.reportedByTrainerName}</strong>
                  <span className="text-[10px] text-slate-500 block font-mono">{selectedTicketForView.createdAt}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Priority</span>
                  <span className="font-bold text-rose-700">{selectedTicketForView.priority}</span>
                </div>
              </div>

              {/* Endorsement / Resolution Status */}
              {selectedTicketForView.poEndorsedAt && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900">
                  <p className="font-bold">PO Physical Endorsement (Green Signal):</p>
                  <p className="text-blue-800 mt-0.5">Endorsed by {selectedTicketForView.poName} at {selectedTicketForView.poEndorsedAt}</p>
                </div>
              )}

              {selectedTicketForView.apmResolvedAt && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-[11px] text-emerald-950">
                  <p className="font-bold">Senior Manager Resolution & Vendor Action:</p>
                  <p className="text-emerald-800 mt-0.5">{selectedTicketForView.resolutionRemarks}</p>
                  <p className="text-[10px] text-emerald-700 mt-1 font-semibold">Resolved by {selectedTicketForView.apmName} at {selectedTicketForView.apmResolvedAt}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedTicketForView(null)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* Classroom Training Fullscreen Modal */}
      <ClassroomTrainingModal
        isOpen={isSlideDeckModalOpen}
        onClose={() => setIsSlideDeckModalOpen(false)}
        batchCode="DBS-RJ01-2609-B1"
        trainerName={currentEmp?.name || currentPersona.name}
      />

      {/* Self Punch Camera & GPS Modal */}
      <EmployeeSelfAttendanceModal
        isOpen={isSelfPunchModalOpen}
        onClose={() => setIsSelfPunchModalOpen(false)}
        defaultType={punchModalType}
      />
    </div>
  );
};
