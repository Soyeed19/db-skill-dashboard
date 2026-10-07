import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Plane,
  Receipt,
  FileDown,
  Building,
  CreditCard,
  Send,
  Calendar,
  CheckCircle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Eye,
  Upload,
  FileText,
  X,
  AlertCircle,
  ArrowRight,
  UserCheck,
  Sparkles,
  BadgeCheck,
  Plus,
  Search,
  Filter,
  History
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TourRequest, ExpenseClaim, ExpenseItem, TravelMode, UserRole, UserLevel } from '../../types';
import { generateExpenseClaimPdf } from '../../utils/pdfGenerator';
import { ExpenseAuditTrailModal } from './ExpenseAuditTrailModal';

// Unified Tour Record merging Sanction + Claim
export interface UnifiedTourRecord {
  id: string;
  tourId?: string;
  sanctionRef: string;
  applicationDate: string;
  applicantName: string;
  applicantRole: UserRole;
  applicantLevel: UserLevel;
  applicantId?: string;
  destination: string;
  mode: string;
  startDate: string;
  endDate: string;
  tourDays: number;
  purpose: string;
  estimatedBudget: number;
  sanctionedBudget?: number;
  sanctionedBy?: string;
  sanctionStatus: string;
  originalTour?: TourRequest;
  claim?: ExpenseClaim;
}

export const TourExpenseManagement: React.FC = () => {
  const {
    tours,
    expenseClaims,
    currentPersona,
    activeCenter,
    applyTour,
    sanctionTour,
    submitExpenseClaim,
    endorseExpenseClaim,
    approveExpenseClaim,
    rejectExpenseClaim,
    settleExpenseClaim,
    showToast
  } = useApp();

  // Search and Filter State for Unified Ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'pending_tour' | 'ready_to_claim' | 'claim_in_review' | 'settled'
  >('all');

  // Modal Visibility State
  const [isApplyTourOpen, setIsApplyTourOpen] = useState(false);
  const [isSettleClaimOpen, setIsSettleClaimOpen] = useState(false);
  const [selectedTourForClaim, setSelectedTourForClaim] = useState<TourRequest | null>(null);
  const [tourDays, setTourDays] = useState(4);

  // Apply Tour Form State
  const [destinationCity, setDestinationCity] = useState('Mumbai Port Facility');
  const [travelMode, setTravelMode] = useState<TravelMode>('Train 2AC');
  const [departureDate, setDepartureDate] = useState('2026-10-02');
  const [returnDate, setReturnDate] = useState('2026-10-06');
  const [purpose, setPurpose] = useState('Inspect newly installed driver simulation hall and cross-train 2 local trainers');
  const [estimatedBudget, setEstimatedBudget] = useState(14500);

  // Settlement Form State (Line Items) - Starts clean with NO hardcoded mock text or dummy files
  const [cityType, setCityType] = useState<'Metro' | 'Non-Metro'>('Metro');
  const [expenseItems, setExpenseItems] = useState<ExpenseItem[]>([
    {
      id: 'item-1',
      category: 'Travel Ticket',
      description: '',
      date: '2026-10-02',
      claimAmount: 0,
      entitlementLimit: 4000,
      approvedAmount: 0,
      receiptName: '',
      receiptUrl: '',
      invoiceNumber: '',
      vendorName: '',
      gstin: '',
      isWithinPolicy: true
    },
    {
      id: 'item-2',
      category: 'Hotel/Lodging',
      description: '',
      date: '2026-10-03',
      claimAmount: 0,
      entitlementLimit: 7500,
      approvedAmount: 0,
      receiptName: '',
      receiptUrl: '',
      invoiceNumber: '',
      vendorName: '',
      gstin: '',
      isWithinPolicy: true
    },
    {
      id: 'item-3',
      category: 'Daily Food Allowance (DA)',
      description: '',
      date: '2026-10-02',
      claimAmount: 0,
      entitlementLimit: 4800,
      approvedAmount: 0,
      receiptName: '',
      receiptUrl: '',
      invoiceNumber: '',
      vendorName: '',
      gstin: '',
      isWithinPolicy: true
    },
    {
      id: 'item-4',
      category: 'Local Conveyance',
      description: '',
      date: '2026-10-04',
      claimAmount: 0,
      entitlementLimit: 1200,
      approvedAmount: 0,
      receiptName: '',
      receiptUrl: '',
      invoiceNumber: '',
      vendorName: '',
      gstin: '',
      isWithinPolicy: true
    }
  ]);

  const [newItemCategory, setNewItemCategory] = useState<ExpenseItem['category']>('Local Conveyance');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemAmount, setNewItemAmount] = useState<number>(0);
  const [newItemDate, setNewItemDate] = useState('2026-10-05');

  // Interactive Lightbox Bill Viewer State
  const [previewDoc, setPreviewDoc] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
    amount: string;
    claimant: string;
    invoiceNo?: string;
    gstin?: string;
    vendorName?: string;
    category?: string;
    items?: ExpenseItem[];
    currentIndex?: number;
  } | null>(null);

  // Expense Claim Audit Trail Modal State
  const [auditTrailClaim, setAuditTrailClaim] = useState<ExpenseClaim | null>(null);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState(false);

  // Calculations for Active Claim Modal
  const totalClaimed = expenseItems.reduce((acc, curr) => acc + curr.claimAmount, 0);
  const totalEntitlement = expenseItems.reduce((acc, curr) => acc + curr.entitlementLimit, 0);
  const advanceAmount = selectedTourForClaim?.sanctionedBudget || selectedTourForClaim?.estimatedBudget || 0;
  const netPayable = totalClaimed - advanceAmount;

  // Build Unified Tour & Expense Register
  const unifiedRecords: UnifiedTourRecord[] = useMemo(() => {
    const records: UnifiedTourRecord[] = [];
    const processedClaimIds = new Set<string>();

    tours.forEach(tour => {
      // Find matching claim
      const linkedClaim = expenseClaims.find(
        c => c.tourId === tour.id || (c.tourSanctionNumber && c.tourSanctionNumber === tour.tourSanctionNumber)
      );

      if (linkedClaim) {
        processedClaimIds.add(linkedClaim.id);
      }

      let days = 1;
      if (tour.departureDate && tour.returnDate) {
        const d1 = new Date(tour.departureDate);
        const d2 = new Date(tour.returnDate);
        const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)) + 1;
        if (diff > 0) days = diff;
      }

      records.push({
        id: tour.id,
        tourId: tour.id,
        sanctionRef: tour.tourSanctionNumber,
        applicationDate: tour.appliedAt?.split(' ')?.[0] || tour.departureDate,
        applicantName: tour.employeeName,
        applicantRole: tour.employeeRole,
        applicantLevel: tour.employeeLevel,
        applicantId: tour.employeeId,
        destination: tour.destinationCity,
        mode: tour.travelMode,
        startDate: tour.departureDate,
        endDate: tour.returnDate,
        tourDays: days,
        purpose: tour.purpose,
        estimatedBudget: tour.estimatedBudget,
        sanctionedBudget: tour.sanctionedBudget,
        sanctionedBy: tour.sanctionedBy,
        sanctionStatus: tour.status,
        originalTour: tour,
        claim: linkedClaim
      });
    });

    // Also include any standalone / direct claims not tied to an existing tour
    expenseClaims.forEach(claim => {
      if (!processedClaimIds.has(claim.id)) {
        records.push({
          id: claim.id,
          sanctionRef: claim.tourSanctionNumber || claim.tourSanctionRef || 'Direct / Verbal Directive',
          applicationDate: claim.submissionDate || claim.claimDate || '-',
          applicantName: claim.employeeName || claim.claimantName || 'Field Staff',
          applicantRole: (claim.employeeRole as UserRole) || 'Trainer',
          applicantLevel: (claim.employeeLevel as UserLevel) || 'Level 4',
          applicantId: claim.employeeId,
          destination: (claim as any).destinationCity || claim.zone || 'Outstation Facility',
          mode: 'Direct Transit',
          startDate: claim.tourDates?.split(' to ')?.[0] || claim.claimDate || '-',
          endDate: claim.tourDates?.split(' to ')?.[1] || claim.claimDate || '-',
          tourDays: 3,
          purpose: claim.tourPurpose || 'Emergency operational duty undertaken under verbal directive',
          estimatedBudget: claim.totalClaimed,
          sanctionedBudget: claim.totalApproved || claim.totalClaimed,
          sanctionedBy: 'Verbal Approval',
          sanctionStatus: 'Sanctioned',
          claim: claim
        });
      }
    });

    return records;
  }, [tours, expenseClaims]);

  // Filtered and Searched Records
  const filteredRecords = useMemo(() => {
    return unifiedRecords.filter(rec => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          rec.sanctionRef.toLowerCase().includes(q) ||
          rec.applicantName.toLowerCase().includes(q) ||
          rec.destination.toLowerCase().includes(q) ||
          rec.purpose.toLowerCase().includes(q) ||
          (rec.claim?.claimNumber && rec.claim.claimNumber.toLowerCase().includes(q)) ||
          (rec.claim?.claimRef && rec.claim.claimRef.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Filter Status
      if (filterStatus === 'pending_tour') {
        return rec.sanctionStatus === 'Submitted';
      }
      if (filterStatus === 'ready_to_claim') {
        const isApprovedTour =
          rec.sanctionStatus === 'Sanctioned' ||
          rec.sanctionStatus === 'Completed' ||
          rec.sanctionStatus === 'Approved / Granted';
        return isApprovedTour && !rec.claim;
      }
      if (filterStatus === 'claim_in_review') {
        if (!rec.claim) return false;
        return (
          rec.claim.status === 'Pending Senior Manager Review' ||
          rec.claim.status === 'Pending GM Review' ||
          rec.claim.status === 'Returned by Senior Manager' ||
          rec.claim.status === 'Returned by GM for Correction'
        );
      }
      if (filterStatus === 'settled') {
        if (!rec.claim) return false;
        return (
          rec.claim.status === 'Settled via Bank Transfer' ||
          rec.claim.status === 'Disbursed' ||
          rec.claim.status === 'Approved by GM - Ready for Bank Disbursement' ||
          rec.claim.status === 'Approved by GM'
        );
      }

      return true;
    });
  }, [unifiedRecords, searchQuery, filterStatus]);

  // Handlers for Opening Claim Modal from Sanctions List
  const handleOpenClaimForTour = (tour: TourRequest) => {
    setSelectedTourForClaim(tour);

    // Calculate tour days
    let days = 3;
    if (tour.departureDate && tour.returnDate) {
      const d1 = new Date(tour.departureDate);
      const d2 = new Date(tour.returnDate);
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)) + 1;
      if (diff > 0) days = diff;
    }
    setTourDays(days);

    const isMetro = /mumbai|delhi|bengaluru|bangalore|hyderabad|chennai|kolkata/i.test(tour.destinationCity);
    const tier: 'Metro' | 'Non-Metro' = isMetro ? 'Metro' : 'Non-Metro';
    setCityType(tier);

    const daDailyRate = tier === 'Metro' ? 1200 : 900;
    const calculatedDa = daDailyRate * days;

    // Structured 4 itemized line items with clean/empty fields ready for user input (NO mock data)
    setExpenseItems([
      {
        id: `item-${Date.now()}-1`,
        category: 'Travel Ticket',
        description: '',
        date: tour.departureDate,
        claimAmount: 0,
        entitlementLimit: tour.travelMode.includes('Flight') ? 7000 : tour.travelMode.includes('2AC') ? 4000 : 2800,
        approvedAmount: 0,
        receiptName: '',
        receiptUrl: '',
        invoiceNumber: '',
        vendorName: '',
        gstin: '',
        isWithinPolicy: true
      },
      {
        id: `item-${Date.now()}-2`,
        category: 'Hotel/Lodging',
        description: '',
        date: tour.departureDate,
        claimAmount: 0,
        entitlementLimit: (tier === 'Metro' ? 3500 : 2400) * Math.max(1, days - 1),
        approvedAmount: 0,
        receiptName: '',
        receiptUrl: '',
        invoiceNumber: '',
        vendorName: '',
        gstin: '',
        isWithinPolicy: true
      },
      {
        id: `item-${Date.now()}-3`,
        category: 'Daily Food Allowance (DA)',
        description: '',
        date: tour.returnDate,
        claimAmount: 0,
        entitlementLimit: calculatedDa,
        approvedAmount: 0,
        receiptName: '',
        receiptUrl: '',
        invoiceNumber: '',
        vendorName: '',
        gstin: '',
        isWithinPolicy: true
      },
      {
        id: `item-${Date.now()}-4`,
        category: 'Local Conveyance',
        description: '',
        date: tour.returnDate,
        claimAmount: 0,
        entitlementLimit: tier === 'Metro' ? 1600 : 1000,
        approvedAmount: 0,
        receiptName: '',
        receiptUrl: '',
        invoiceNumber: '',
        vendorName: '',
        gstin: '',
        isWithinPolicy: true
      }
    ]);

    setIsSettleClaimOpen(true);
  };

  // Direct / Verbal Claim Action
  const handleOpenDirectVerbalClaim = () => {
    const directSanctionRef = `DIR/VERBAL/2026/09/${Math.floor(100 + Math.random() * 900)}`;
    const directTour: TourRequest = {
      id: `tour-dir-${Date.now()}`,
      tourSanctionNumber: directSanctionRef,
      employeeId: currentPersona.id,
      employeeName: currentPersona.name,
      employeeRole: currentPersona.role,
      employeeLevel: currentPersona.level,
      originCenter: activeCenter.name,
      destinationCity: 'Emergency Field Cluster',
      departureDate: new Date().toISOString().split('T')[0],
      returnDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
      travelMode: 'Train 2AC',
      purpose: 'Urgent verbal directive travel (post-facto sanction & settlement claim)',
      estimatedBudget: 7500,
      sanctionedBudget: 7500,
      status: 'Sanctioned',
      sanctionedBy: 'Verbal Directive (Senior Management)',
      appliedAt: new Date().toISOString().split('T')[0]
    };
    handleOpenClaimForTour(directTour);
  };

  // City Tier Switcher in Modal
  const handleCityTierChange = (newTier: 'Metro' | 'Non-Metro') => {
    setCityType(newTier);
    const daDailyRate = newTier === 'Metro' ? 1200 : 900;
    const calculatedDa = daDailyRate * tourDays;
    setExpenseItems(prev =>
      prev.map(item => {
        if (item.category === 'Daily Food Allowance (DA)') {
          return {
            ...item,
            entitlementLimit: calculatedDa
          };
        }
        if (item.category === 'Hotel/Lodging') {
          return {
            ...item,
            entitlementLimit: (newTier === 'Metro' ? 3500 : 2400) * Math.max(1, tourDays - 1)
          };
        }
        if (item.category === 'Local Conveyance') {
          return {
            ...item,
            entitlementLimit: newTier === 'Metro' ? 1600 : 1000
          };
        }
        return item;
      })
    );
  };

  // Item Amount Change Handler
  const handleItemAmountChange = (itemId: string, newAmount: number) => {
    setExpenseItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const val = isNaN(newAmount) || newAmount < 0 ? 0 : newAmount;
          return {
            ...item,
            claimAmount: val,
            approvedAmount: val
          };
        }
        return item;
      })
    );
  };

  // Item Particulars / Description Handler
  const handleItemDescriptionChange = (itemId: string, newDesc: string) => {
    setExpenseItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, description: newDesc } : item))
    );
  };

  // Item Invoice / Ref Handler
  const handleItemInvoiceChange = (itemId: string, newInvoice: string) => {
    setExpenseItems(prev =>
      prev.map(item => (item.id === itemId ? { ...item, invoiceNumber: newInvoice } : item))
    );
  };

  // Auto-calculate Standard DA Helper
  const handleAutoFillDa = (itemId: string) => {
    const daDailyRate = cityType === 'Metro' ? 1200 : 900;
    const calculatedDa = daDailyRate * tourDays;
    setExpenseItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            claimAmount: calculatedDa,
            approvedAmount: calculatedDa,
            description:
              item.description ||
              `Daily Food Allowance (${tourDays} days @ ₹${daDailyRate}/day ${cityType} Entitlement Policy)`
          };
        }
        return item;
      })
    );
    showToast(`Applied standard DA policy: ₹${calculatedDa.toLocaleString()}`);
  };

  // Receipt File Upload Handler
  const handleFileUploadForItem = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const url = event.target?.result as string;
      setExpenseItems(prev =>
        prev.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              receiptName: file.name,
              receiptUrl: url
            };
          }
          return item;
        })
      );
      showToast(`Attached proof: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  // Remove Receipt File Handler
  const handleRemoveFileForItem = (itemId: string) => {
    setExpenseItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? {
              ...item,
              receiptName: '',
              receiptUrl: ''
            }
          : item
      )
    );
    showToast('Receipt attachment removed');
  };

  // Category specific input placeholders
  const getCategoryPlaceholder = (category: string) => {
    switch (category) {
      case 'Travel Ticket':
        return 'Train / Bus name, From - To station, PNR number';
      case 'Hotel/Lodging':
        return 'Hotel name, City, GST invoice number, Number of nights';
      case 'Daily Food Allowance (DA)':
        return 'Daily Food Allowance: Number of days, date range, meal particulars';
      case 'Local Conveyance':
        return 'Auto / Cab / Metro route and purpose';
      default:
        return 'Expense details, particulars, and vendor name';
    }
  };

  const handleApplyTourSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyTour({
      employeeId: currentPersona.id,
      employeeName: currentPersona.name,
      employeeRole: currentPersona.role,
      employeeLevel: currentPersona.level,
      originCenter: activeCenter.name,
      destinationCity,
      departureDate,
      returnDate,
      travelMode,
      purpose,
      estimatedBudget
    });
    setIsApplyTourOpen(false);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemDesc || newItemAmount <= 0) return;
    const limit = newItemCategory === 'Daily Food Allowance (DA)' ? 1200 : newItemAmount * 1.1;

    setExpenseItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        category: newItemCategory,
        description: newItemDesc,
        date: newItemDate,
        claimAmount: newItemAmount,
        entitlementLimit: Math.round(limit),
        approvedAmount: newItemAmount,
        receiptName: '',
        receiptUrl: '',
        invoiceNumber: '',
        vendorName: '',
        gstin: '',
        isWithinPolicy: true
      }
    ]);
    setNewItemDesc('');
    setNewItemAmount(0);
  };

  const handleRemoveItem = (id: string) => {
    setExpenseItems(prev => prev.filter(i => i.id !== id));
  };

  // Step A: Employee Submits Claim -> Initial Status: Pending Senior Manager Review
  const handleSubmitClaim = () => {
    if (!selectedTourForClaim) return;

    if (totalClaimed <= 0) {
      showToast('Please enter your expense claim amounts before submitting.');
      return;
    }

    // If direct/verbal tour not in tours, persist tour as well
    if (!tours.some(t => t.id === selectedTourForClaim.id)) {
      applyTour({
        employeeId: selectedTourForClaim.employeeId,
        employeeName: selectedTourForClaim.employeeName,
        employeeRole: selectedTourForClaim.employeeRole,
        employeeLevel: selectedTourForClaim.employeeLevel,
        originCenter: selectedTourForClaim.originCenter,
        destinationCity: selectedTourForClaim.destinationCity,
        departureDate: selectedTourForClaim.departureDate,
        returnDate: selectedTourForClaim.returnDate,
        travelMode: selectedTourForClaim.travelMode,
        purpose: selectedTourForClaim.purpose,
        estimatedBudget: selectedTourForClaim.estimatedBudget
      });
    }

    submitExpenseClaim({
      tourId: selectedTourForClaim.id,
      tourSanctionNumber: selectedTourForClaim.tourSanctionNumber,
      tourSanctionRef: selectedTourForClaim.tourSanctionNumber,
      employeeId: selectedTourForClaim.employeeId,
      empId: selectedTourForClaim.employeeId,
      employeeName: selectedTourForClaim.employeeName,
      claimantName: selectedTourForClaim.employeeName,
      employeeRole: selectedTourForClaim.employeeRole,
      claimantRole: selectedTourForClaim.employeeRole,
      employeeLevel: selectedTourForClaim.employeeLevel,
      submissionDate: new Date().toISOString().split('T')[0],
      claimDate: new Date().toISOString().split('T')[0],
      tourDates: `${selectedTourForClaim.departureDate} to ${selectedTourForClaim.returnDate}`,
      tourPurpose: selectedTourForClaim.purpose,
      cityType,
      items: expenseItems,
      bills: expenseItems
        .filter(i => i.receiptName || i.claimAmount > 0)
        .map(i => ({
          name: i.receiptName || `${i.category} Voucher`,
          url: i.receiptUrl,
          category: i.category,
          amount: i.claimAmount
        })),
      fareAmount: expenseItems.find(i => i.category === 'Travel Ticket')?.claimAmount || 0,
      lodgingBoardingAmount: expenseItems.find(i => i.category === 'Hotel/Lodging')?.claimAmount || 0,
      othersDaAmount: expenseItems.find(i => i.category === 'Daily Food Allowance (DA)')?.claimAmount || 0,
      conveyanceAmount: expenseItems.find(i => i.category === 'Local Conveyance')?.claimAmount || 0,
      totalClaimed,
      totalEntitlement,
      policyEntitlement: totalEntitlement,
      totalApproved: totalClaimed,
      approvedReimbursement: totalClaimed,
      status: 'Pending Senior Manager Review'
    });

    setIsSettleClaimOpen(false);
    showToast(`Claim for ${selectedTourForClaim.tourSanctionNumber} submitted successfully!`);
  };

  // Inspect Bills Handler
  const handleOpenBillViewer = (claim: ExpenseClaim, itemIdx: number = 0) => {
    const item = claim.items?.[itemIdx] || claim.items?.[0];
    const defaultUrl = item?.category === 'Hotel/Lodging'
      ? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
      : item?.category === 'Travel Ticket'
      ? 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80'
      : 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80';

    setPreviewDoc({
      isOpen: true,
      title: item ? `${item.category}: ${item.receiptName || item.description}` : `Attached Vouchers - ${claim.claimNumber || claim.claimRef}`,
      url: item?.receiptUrl || defaultUrl,
      amount: `₹${(item?.claimAmount || claim.totalClaimed).toLocaleString('en-IN')}`,
      claimant: `${claim.employeeName || claim.claimantName} (${claim.employeeRole || claim.claimantRole || 'Field Staff'})`,
      invoiceNo: item?.invoiceNumber || `INV-${(claim.claimNumber || claim.claimRef || '000').replace(/[^0-9]/g, '')}`,
      gstin: item?.gstin || '08AABCR1234F1Z9',
      vendorName: item?.vendorName || 'Authorized DBS Service Provider',
      category: item?.category,
      items: claim.items,
      currentIndex: itemIdx
    });
  };

  const isSeniorManager = currentPersona.role === 'Senior Manager';
  const isGeneralManager = currentPersona.role === 'GM';

  return (
    <div className="space-y-6">
      {/* Top Banner with Top Action Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-teal-800">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
                Official Tours & Finance
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-mono">
                Two-Stage Settlement: SM Verification → GM Financial Grant
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Official Tour Sanction & Expense Reimbursement Workflow
            </h3>
          </div>
        </div>

        {/* Action Buttons: Apply for Tour Sanction & Direct / Verbal Claim */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setIsApplyTourOpen(true)}
            className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-xl bg-dbs-green text-white hover:bg-dbs-green-dark transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Plane className="w-4 h-4 text-emerald-300" />
            <span>Apply for Tour Sanction</span>
          </button>

          <button
            onClick={handleOpenDirectVerbalClaim}
            className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold rounded-xl bg-white border border-teal-700 text-teal-900 hover:bg-teal-50 transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
            title="File reimbursement directly for urgent/emergency travel undertaken under verbal directive"
          >
            <CreditCard className="w-4 h-4 text-teal-700" />
            <span>Direct / Verbal Claim</span>
          </button>
        </div>
      </div>

      {/* Travel Policy Limit Cards (Strictly preserved) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <CreditCard className="w-4 h-4 text-teal-700" />
            DB Skills Official Travel Policy Limits (Per Diem & DA)
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            Two-Stage Hierarchy: SM Endorsement → GM Sanction
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
            <span className="font-bold text-slate-800 block">Tier 1 Metro (Mumbai, Delhi, Bengaluru)</span>
            <span className="text-teal-800 font-bold font-mono">DA: ₹1,200/day</span>
            <span className="text-slate-400 block text-[10px]">Hotel cap: ₹3,500/night • Mandatory GST bill</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
            <span className="font-bold text-slate-800 block">Tier 2 State Capitals (Jaipur, Pune, Lucknow)</span>
            <span className="text-teal-800 font-bold font-mono">DA: ₹900/day</span>
            <span className="text-slate-400 block text-[10px]">Hotel cap: ₹2,400/night • Mandatory GST bill</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-slate-200">
            <span className="font-bold text-slate-800 block">Tier 3 Regional Hubs & Outstations</span>
            <span className="text-teal-800 font-bold font-mono">DA: ₹700/day</span>
            <span className="text-slate-400 block text-[10px]">Hotel cap: ₹1,800/night • Mandatory GST bill</span>
          </div>
        </div>
      </div>

      {/* SINGLE UNIFIED LEDGER TABLE: "Official Tours & Expense Settlement Register" */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-4 p-5">
        {/* Table Header & Search/Filter Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">
                Official Tours & Expense Settlement Register
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold font-mono">
                {filteredRecords.length} {filteredRecords.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unified end-to-end ledger tracking advance travel sanctions, itemized reimbursement claims, and two-stage approvals (SM → GM).
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ref, destination, name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Quick Filter Pill Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-teal-800 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Tours & Claims ({unifiedRecords.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending_tour')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              filterStatus === 'pending_tour'
                ? 'bg-amber-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Pending Tour Approval ({unifiedRecords.filter(r => r.sanctionStatus === 'Submitted').length})
          </button>
          <button
            onClick={() => setFilterStatus('ready_to_claim')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              filterStatus === 'ready_to_claim'
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Ready to Claim ({unifiedRecords.filter(r => (r.sanctionStatus === 'Sanctioned' || r.sanctionStatus === 'Completed' || r.sanctionStatus === 'Approved / Granted') && !r.claim).length})
          </button>
          <button
            onClick={() => setFilterStatus('claim_in_review')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              filterStatus === 'claim_in_review'
                ? 'bg-sky-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Claims in Review ({unifiedRecords.filter(r => r.claim && (r.claim.status === 'Pending Senior Manager Review' || r.claim.status === 'Pending GM Review' || r.claim.status.includes('Returned'))).length})
          </button>
          <button
            onClick={() => setFilterStatus('settled')}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
              filterStatus === 'settled'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Settled / Approved ({unifiedRecords.filter(r => r.claim && (r.claim.status.includes('Approved by GM') || r.claim.status.includes('Settled') || r.claim.status === 'Disbursed')).length})
          </button>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Sanction Ref & Date</th>
                <th className="py-3 px-4">Destination & Purpose</th>
                <th className="py-3 px-4">Tour Dates</th>
                <th className="py-3 px-4">Tour Sanction Status</th>
                <th className="py-3 px-4">Expense Claim & Settlement</th>
                <th className="py-3 px-4 text-right">Unified Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No official tour or expense records found matching current criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map(record => {
                  const claim = record.claim;
                  const isApprovedTour =
                    record.sanctionStatus === 'Sanctioned' ||
                    record.sanctionStatus === 'Completed' ||
                    record.sanctionStatus === 'Approved / Granted' ||
                    record.sanctionStatus === 'Expense Claim Filed';

                  const isPendingTour = record.sanctionStatus === 'Submitted';

                  // Claim status checks
                  const isPendingSm = claim?.status === 'Pending Senior Manager Review';
                  const isPendingGm = claim?.status === 'Pending GM Review';
                  const isReturnedSm = claim?.status === 'Returned by Senior Manager';
                  const isReturnedGm = claim?.status === 'Returned by GM for Correction';
                  const isApprovedGm =
                    claim?.status === 'Approved by GM - Ready for Bank Disbursement' ||
                    claim?.status === 'Approved by GM';
                  const isDisbursed =
                    claim?.status === 'Settled via Bank Transfer' || claim?.status === 'Disbursed';

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Column 1: Sanction Ref & Date */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <span className="font-mono font-bold text-teal-800 text-xs block">
                            {record.sanctionRef}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Applied: {record.applicationDate}
                          </span>
                          <p className="font-bold text-slate-900 mt-1">
                            {record.applicantName}{' '}
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({record.applicantRole})
                            </span>
                          </p>
                        </div>
                      </td>

                      {/* Column 2: Destination & Purpose */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800 text-xs">
                              {record.destination}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium border border-slate-200">
                              {record.mode}
                            </span>
                          </div>
                          <p
                            className="text-[11px] text-slate-600 max-w-xs truncate"
                            title={record.purpose}
                          >
                            {record.purpose}
                          </p>
                        </div>
                      </td>

                      {/* Column 3: Tour Dates */}
                      <td className="py-3 px-4 font-mono">
                        <p className="font-bold text-slate-800 text-xs">
                          {record.startDate} to {record.endDate}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {record.tourDays} Days Official Tour
                        </p>
                      </td>

                      {/* Column 4: Tour Sanction Status */}
                      <td className="py-3 px-4">
                        {isPendingTour ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                              <span>Submitted / Pending SM Approval</span>
                            </span>
                            {/* GM quick action if GM is viewing */}
                            {isGeneralManager && record.originalTour && (
                              <button
                                onClick={() =>
                                  sanctionTour(
                                    record.originalTour!.id,
                                    record.estimatedBudget,
                                    'Approved as per business travel mandate by GM'
                                  )
                                }
                                className="mt-1 block px-2.5 py-0.5 text-[10px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shadow-2xs"
                              >
                                Sanction Tour (₹{record.estimatedBudget.toLocaleString()})
                              </button>
                            )}
                          </div>
                        ) : isApprovedTour ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span>
                                Sanctioned by {record.sanctionedBy?.includes('GM') ? 'GM' : 'SM'}: ₹
                                {(record.sanctionedBudget || record.estimatedBudget).toLocaleString()}
                              </span>
                            </span>
                            {record.sanctionedBy && (
                              <p className="text-[10px] text-slate-400">By {record.sanctionedBy}</p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {record.sanctionStatus}
                          </span>
                        )}
                      </td>

                      {/* Column 5: Expense Claim & Settlement */}
                      <td className="py-3 px-4">
                        {!claim ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                              <Receipt className="w-3 h-3 text-slate-400" />
                              <span>Not Claimed Yet</span>
                            </span>
                            <p className="text-[10px] text-slate-400">
                              Est: ₹{record.estimatedBudget.toLocaleString()}
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-teal-800 text-xs">
                                {claim.claimNumber || claim.claimRef}
                              </span>
                              <span className="font-mono font-bold text-slate-800 text-xs">
                                ₹{claim.totalClaimed.toLocaleString()}
                              </span>
                            </div>

                            {/* Two-Stage Approval Hierarchy Badge */}
                            <div>
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  isPendingSm
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : isPendingGm
                                    ? 'bg-sky-100 text-sky-900 border border-sky-300 font-bold'
                                    : isReturnedSm
                                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                    : isReturnedGm
                                    ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                    : isApprovedGm
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                                    : isDisbursed
                                    ? 'bg-teal-100 text-teal-900 border border-teal-300 font-extrabold'
                                    : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {claim.status}
                              </span>
                            </div>

                            {claim.smRemarks && (
                              <p
                                className="text-[10px] text-sky-800 italic max-w-[190px] truncate"
                                title={claim.smRemarks}
                              >
                                SM: {claim.smRemarks}
                              </p>
                            )}
                            {claim.gmRemarks && (
                              <p
                                className="text-[10px] text-emerald-800 italic max-w-[190px] truncate"
                                title={claim.gmRemarks}
                              >
                                GM: {claim.gmRemarks}
                              </p>
                            )}
                            {claim.bankReferenceNumber && (
                              <p className="text-[10px] text-teal-700 font-mono">
                                NEFT: {claim.bankReferenceNumber}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Column 6: Unified Actions Column (Smart Contextual Actions) */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {/* Case 1: Tour is Pending Approval -> Disabled text */}
                          {isPendingTour && !claim && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 border border-slate-200 text-xs font-medium cursor-not-allowed">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Awaiting Tour Approval</span>
                            </span>
                          )}

                          {/* Case 2: Tour is Sanctioned & Not Claimed -> Primary Action Button "+ Claim Expenses" */}
                          {isApprovedTour && !claim && (
                            <button
                              onClick={() => {
                                if (record.originalTour) {
                                  handleOpenClaimForTour(record.originalTour);
                                } else {
                                  // Synthesize tour object for direct sanction
                                  handleOpenClaimForTour({
                                    id: record.id,
                                    tourSanctionNumber: record.sanctionRef,
                                    employeeId: record.applicantId || currentPersona.id,
                                    employeeName: record.applicantName,
                                    employeeRole: record.applicantRole as UserRole,
                                    employeeLevel: record.applicantLevel as UserLevel,
                                    originCenter: activeCenter.name,
                                    destinationCity: record.destination,
                                    departureDate: record.startDate,
                                    returnDate: record.endDate,
                                    travelMode: (record.mode as TravelMode) || 'Train 2AC',
                                    purpose: record.purpose,
                                    estimatedBudget: record.estimatedBudget,
                                    sanctionedBudget: record.sanctionedBudget || record.estimatedBudget,
                                    status: 'Sanctioned',
                                    appliedAt: record.applicationDate || new Date().toISOString().split('T')[0]
                                  });
                                }
                              }}
                              className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-teal-800 text-white hover:bg-teal-700 shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Click to open itemized Expense Claim modal pre-filled with this Tour Sanction Order"
                            >
                              <Receipt className="w-3.5 h-3.5 text-emerald-300" />
                              <span>+ Claim Expenses</span>
                            </button>
                          )}

                          {/* Case 3: Claim is Submitted -> View Bills & Accounts PDF */}
                          {claim && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenBillViewer(claim)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1 transition-colors cursor-pointer"
                                title="Inspect Uploaded Receipts & Invoices in Lightbox Viewer"
                              >
                                <Eye className="w-3.5 h-3.5 text-teal-700" />
                                <span>View Bills ({claim.items?.length || claim.bills?.length || 0})</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  generateExpenseClaimPdf(claim, record.originalTour)
                                }
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 cursor-pointer"
                                title="Download Official Accounts Settlement Voucher PDF"
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
                                className="px-2.5 py-1 text-xs font-semibold rounded-xs bg-[#E0F2FE] hover:bg-[#E0F2FE]/80 text-[#0284C7] border border-[#00AEEF]/40 flex items-center gap-1 transition-colors cursor-pointer"
                                title="View complete timestamped audit trail log (Submitted, SM Verified, GM Sanctioned)"
                              >
                                <History className="w-3.5 h-3.5 text-[#00AEEF]" />
                                <span>Audit Trail</span>
                              </button>

                              {/* Two-Stage Approval Buttons for SM / GM */}
                              {(isSeniorManager || isGeneralManager) && isPendingSm && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      endorseExpenseClaim(
                                        claim.id,
                                        'Tour physical execution, dates, and vouchers verified by Senior Manager. Endorsed for GM Financial Sanction.'
                                      )
                                    }
                                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs flex items-center gap-1 cursor-pointer"
                                    title="SM: Verify physical execution & forward to GM"
                                  >
                                    <CheckCircle className="w-3 h-3 text-white" />
                                    <span>Verify & Endorse Claim</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      rejectExpenseClaim(
                                        claim.id,
                                        'Senior Manager discrepancy: Missing verified tour log sheet / ticket proof.'
                                      )
                                    }
                                    className="px-2 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                                    title="Return claim to employee for correction"
                                  >
                                    Return
                                  </button>
                                </>
                              )}

                              {isGeneralManager && isPendingGm && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      approveExpenseClaim(
                                        claim.id,
                                        claim.totalClaimed,
                                        'Reimbursement verified against accounts policy. Sanction & grant approved in full by GM.'
                                      )
                                    }
                                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs flex items-center gap-1 cursor-pointer"
                                    title="Grant GM Financial Sanction"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5 text-white" />
                                    <span>Sanction Reimbursement</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      rejectExpenseClaim(
                                        claim.id,
                                        'GM discrepancy: Invalid hotel GST number or non-compliant vouchers.'
                                      )
                                    }
                                    className="px-2 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 cursor-pointer"
                                    title="Return for correction"
                                  >
                                    Return
                                  </button>
                                </>
                              )}

                              {isApprovedGm && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    settleExpenseClaim(
                                      claim.id,
                                      `HDFC-NEFT-${Math.floor(10000000 + Math.random() * 90000000)}`
                                    )
                                  }
                                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-800 text-white hover:bg-teal-700 shadow-xs flex items-center gap-1 cursor-pointer"
                                  title="Process Bank NEFT Disbursement"
                                >
                                  <CreditCard className="w-3.5 h-3.5 text-emerald-300" />
                                  <span>Disburse NEFT</span>
                                </button>
                              )}
                            </>
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

      {/* ========================================================= */}
      {/* MODAL 1: APPLY PRE-TOUR SANCTION                         */}
      {/* ========================================================= */}
      {isApplyTourOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
          <div className="bg-white rounded-sm border border-slate-300 shadow-md w-full max-w-lg overflow-hidden text-slate-800 my-4">
            <div className="bg-[#007A3D] text-white px-5 py-3 flex items-center justify-between border-b border-[#005C2E]">
              <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                <Plane className="w-4 h-4 text-emerald-200" />
                Apply for Official Tour Sanction
              </h3>
              <button
                onClick={() => setIsApplyTourOpen(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyTourSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Destination Location</label>
                  <input
                    type="text"
                    required
                    value={destinationCity}
                    onChange={e => setDestinationCity(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Travel Mode</label>
                  <select
                    value={travelMode}
                    onChange={e => setTravelMode(e.target.value as TravelMode)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="Train 2AC">Train 2AC (Standard Executive)</option>
                    <option value="Train 3AC">Train 3AC (Standard)</option>
                    <option value="Bus">Commercial Volvo / Deluxe Bus</option>
                    <option value="Flight (Special Permit)">Flight (Special General Manager Permit)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Departure Date</label>
                  <input
                    type="date"
                    required
                    value={departureDate}
                    onChange={e => setDepartureDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Return Date</label>
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={e => setReturnDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Official Purpose & Agenda</label>
                <textarea
                  required
                  rows={2}
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Estimated Budget Requirement (₹)</label>
                <input
                  type="number"
                  min={1000}
                  value={estimatedBudget}
                  onChange={e => setEstimatedBudget(Number(e.target.value))}
                  className="w-full font-mono text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <p className="text-[11px] text-teal-800 bg-teal-50 p-2.5 rounded-xl border border-teal-200">
                Official tours require approval and budget sanction from Senior Management (GM/CEO).
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsApplyTourOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-800 text-white font-bold hover:bg-teal-900 cursor-pointer"
                >
                  Submit for Sanction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EXPENSE CLAIM MODAL WITH MANDATORY PROOF UPLOADS */}
      {/* ========================================================= */}
      {isSettleClaimOpen && selectedTourForClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 overflow-y-auto">
          <div className="bg-white rounded-sm border border-slate-300 shadow-md w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 my-4">
            {/* Header */}
            <div className="bg-[#007A3D] text-white px-5 py-3 flex items-center justify-between shrink-0 border-b border-[#005C2E]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase text-emerald-200 font-bold tracking-wider font-mono">
                    Linked Sanction Order: {selectedTourForClaim.tourSanctionNumber}
                  </span>
                  <span className="text-white/40">•</span>
                  <span className="text-xs text-white/80 font-mono">Reimbursement Filing</span>
                </div>
                <h3 className="text-base font-extrabold flex items-center gap-2 mt-0.5">
                  <Receipt className="w-5 h-5 text-emerald-300" />
                  Apply Tour Expense Reimbursement Claim
                </h3>
              </div>
              <button
                onClick={() => setIsSettleClaimOpen(false)}
                className="p-1 rounded-xl text-white/70 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Auto-filled Tour Context Card */}
              <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-teal-950 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                    Auto-Linked Tour Sanction Order Details
                  </span>
                  <span className="font-mono text-teal-800 bg-white px-2.5 py-0.5 rounded-full border border-teal-200 font-bold text-[11px]">
                    {selectedTourForClaim.tourSanctionNumber}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-white p-2.5 rounded-xl border border-teal-100">
                    <span className="text-slate-400 block text-[10px]">Claimant & Employee ID:</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {selectedTourForClaim.employeeName}
                    </span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      Emp ID: {selectedTourForClaim.employeeId} ({selectedTourForClaim.employeeRole})
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-teal-100">
                    <span className="text-slate-400 block text-[10px]">Tour Dates & Duration:</span>
                    <span className="font-bold text-slate-800 text-xs font-mono">
                      {selectedTourForClaim.departureDate} to {selectedTourForClaim.returnDate}
                    </span>
                    <span className="text-[10px] text-teal-800 block font-semibold">
                      Total Duration: {tourDays} Days Official Tour
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-teal-100">
                    <span className="text-slate-400 block text-[10px]">Destination & Travel Mode:</span>
                    <span className="font-bold text-slate-800 text-xs">
                      {selectedTourForClaim.destinationCity}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Approved Mode: <strong>{selectedTourForClaim.travelMode}</strong>
                    </span>
                  </div>
                </div>

                <div className="bg-white/80 p-2.5 rounded-xl border border-teal-100 text-[11px] text-slate-700">
                  <span className="font-bold text-slate-800">Official Purpose: </span>
                  <span>{selectedTourForClaim.purpose}</span>
                </div>
              </div>

              {/* City Tier & DA Policy Control */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-teal-700" />
                  <div>
                    <span className="font-bold text-slate-800 block">Destination City Policy Tier:</span>
                    <span className="text-slate-500 text-[11px]">
                      DA per-diem auto-calculates based on destination classification.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCityTierChange('Metro')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      cityType === 'Metro'
                        ? 'bg-teal-800 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    Tier 1 Metro (₹1,200 DA)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCityTierChange('Non-Metro')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      cityType === 'Non-Metro'
                        ? 'bg-teal-800 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    Non-Metro / Regional (₹900 DA)
                  </button>
                </div>
              </div>

              {/* MANDATORY PROOFS SECTION (4 LINE ITEMS) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-teal-700" />
                    Mandatory Itemized Expenses & Proof Attachments
                  </h4>
                  <span className="text-[11px] text-amber-700 font-medium">
                    * Valid ticket, GST hotel bill, and local transit slips required
                  </span>
                </div>

                <div className="space-y-2.5">
                  {expenseItems.map((item, idx) => {
                    const isDa = item.category === 'Daily Food Allowance (DA)';

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-teal-300 transition-all shadow-2xs space-y-2.5 text-xs"
                      >
                        {/* Top: Category Title & Editable Amount Input */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-teal-50 border border-teal-200 text-teal-800 font-bold flex items-center justify-center text-xs shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <span className="font-extrabold text-slate-900 text-xs">
                                {item.category}
                              </span>
                              {item.entitlementLimit > 0 && (
                                <span className="text-[10px] text-slate-400 font-mono ml-2">
                                  (Policy Cap: ₹{item.entitlementLimit.toLocaleString()})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Editable Claim Amount Input */}
                          <div className="flex items-center gap-2">
                            <label className="text-slate-600 font-semibold text-xs whitespace-nowrap">
                              Claim Amount:
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">
                                ₹
                              </span>
                              <input
                                type="number"
                                min={0}
                                placeholder="Enter Amount"
                                value={item.claimAmount > 0 ? item.claimAmount : ''}
                                onChange={e => handleItemAmountChange(item.id, Number(e.target.value))}
                                className="w-32 pl-6 pr-2 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 text-xs focus:ring-1 focus:ring-teal-500 bg-white"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Editable Description / Particulars */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-slate-700">
                              Particulars & Journey Details:
                            </label>
                            {isDa && (
                              <button
                                type="button"
                                onClick={() => handleAutoFillDa(item.id)}
                                className="text-[10px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-full border border-teal-200 transition-colors cursor-pointer"
                              >
                                ⚡ Auto-calculate policy DA ({tourDays} days × ₹{cityType === 'Metro' ? '1,200' : '900'} = ₹{(tourDays * (cityType === 'Metro' ? 1200 : 900)).toLocaleString()})
                              </button>
                            )}
                          </div>
                          <textarea
                            rows={2}
                            value={item.description}
                            onChange={e => handleItemDescriptionChange(item.id, e.target.value)}
                            placeholder={getCategoryPlaceholder(item.category)}
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder:text-slate-400 bg-slate-50/50 hover:bg-white focus:bg-white focus:ring-1 focus:ring-teal-500 transition-all resize-none"
                          />
                        </div>

                        {/* Optional Reference & Real File Upload Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
                          {/* Invoice / PNR Ref Input */}
                          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                            <span className="text-[11px] font-medium text-slate-500 shrink-0">
                              Invoice / PNR Ref:
                            </span>
                            <input
                              type="text"
                              value={item.invoiceNumber || ''}
                              onChange={e => handleItemInvoiceChange(item.id, e.target.value)}
                              placeholder="e.g. PNR / Invoice No. / GSTIN (Optional)"
                              className="w-full max-w-xs px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-mono bg-white placeholder:text-slate-400 text-slate-800 focus:ring-1 focus:ring-teal-500"
                            />
                          </div>

                          {/* Real File Picker & Preview Controls */}
                          <div className="flex items-center gap-2 flex-wrap shrink-0">
                            {item.receiptName ? (
                              <div className="flex items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-[11px] font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="truncate max-w-[160px]">{item.receiptName}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFileForItem(item.id)}
                                  className="text-rose-500 hover:text-rose-700 text-[11px] font-semibold cursor-pointer underline"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 border border-slate-200 text-[10px]">
                                <AlertCircle className="w-3 h-3 text-slate-400" />
                                No Bill Uploaded Yet
                              </span>
                            )}

                            {/* Clean File Picker Button */}
                            <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
                              <Upload className="w-3.5 h-3.5 text-teal-700" />
                              <span>{item.receiptName ? 'Change Bill / Receipt' : 'Upload Bill / Receipt'}</span>
                              <input
                                type="file"
                                accept="image/*,.pdf,application/pdf"
                                className="hidden"
                                onChange={e => handleFileUploadForItem(item.id, e)}
                              />
                            </label>

                            {item.receiptUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewDoc({
                                    isOpen: true,
                                    title: `${item.category}: ${item.receiptName || item.description || 'Receipt'}`,
                                    url: item.receiptUrl!,
                                    amount: `₹${item.claimAmount.toLocaleString()}`,
                                    claimant: selectedTourForClaim.employeeName,
                                    invoiceNo: item.invoiceNumber,
                                    gstin: item.gstin,
                                    vendorName: item.vendorName,
                                    category: item.category
                                  });
                                }}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-600" />
                                <span>Preview</span>
                              </button>
                            )}

                            {/* Option to delete non-essential added item */}
                            {idx >= 4 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add Additional Custom Item */}
              <form
                onSubmit={handleAddItem}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2"
              >
                <span className="font-bold text-slate-700 block">
                  Add Additional Misc Expense (e.g. Toll, Station Parking):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <select
                      value={newItemCategory}
                      onChange={e => setNewItemCategory(e.target.value as any)}
                      className="w-full p-2 border rounded-xl bg-white text-xs"
                    >
                      <option value="Local Conveyance">Local Conveyance</option>
                      <option value="Travel Ticket">Travel Ticket</option>
                      <option value="Hotel/Lodging">Hotel/Lodging</option>
                      <option value="Daily Food Allowance (DA)">Daily Food Allowance (DA)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Receipt details / vendor name"
                      value={newItemDesc}
                      onChange={e => setNewItemDesc(e.target.value)}
                      className="w-full p-2 border rounded-xl text-xs"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Amount ₹"
                      value={newItemAmount || ''}
                      onChange={e => setNewItemAmount(Number(e.target.value))}
                      className="w-full p-2 border rounded-xl font-mono text-xs"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-xl bg-teal-800 text-white font-bold hover:bg-teal-900 shrink-0 text-xs cursor-pointer"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </form>

              {/* Advance & Net Calculation Banner */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Sanctioned Tour Advance:</span>
                  <span className="font-mono font-bold text-slate-200 text-sm">
                    ₹{advanceAmount.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Total Claimed Expenses:</span>
                  <span className="font-mono font-bold text-teal-300 text-sm">
                    ₹{totalClaimed.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[11px]">
                    Net Reimbursement Payable to Employee:
                  </span>
                  <span
                    className={`font-mono font-extrabold text-lg ${
                      netPayable >= 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    ₹{netPayable.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Routed to <strong>Senior Manager</strong> for physical tour execution audit.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettleClaimOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitClaim}
                  className="px-5 py-2 rounded-xl bg-teal-800 text-white text-xs font-bold hover:bg-teal-900 shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Submit Settlement Claim</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: INTERACTIVE BILL LIGHTBOX VIEWER                 */}
      {/* ========================================================= */}
      {previewDoc?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
          <div className="bg-white rounded-sm max-w-2xl w-full p-5 shadow-md border border-slate-300 space-y-4 my-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xs bg-[#E6F4EA] border border-[#007A3D]/30 flex items-center justify-center text-[#007A3D]">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 truncate max-w-md">
                    {previewDoc.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                    <span>
                      Claimant: <strong className="text-slate-700">{previewDoc.claimant}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Amount: <strong className="font-mono text-teal-800">{previewDoc.amount}</strong>
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document Image & High-Fidelity Proof Viewport */}
            <div className="relative bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex flex-col items-center justify-center min-h-[300px] max-h-[420px]">
              {previewDoc.url ? (
                previewDoc.url.startsWith('data:application/pdf') || previewDoc.url.toLowerCase().endsWith('.pdf') ? (
                  <div className="p-6 text-center text-white space-y-3">
                    <FileText className="w-16 h-16 mx-auto text-teal-400" />
                    <div>
                      <p className="font-bold text-sm text-slate-100">{previewDoc.title}</p>
                      <p className="text-xs text-slate-400 mt-1">Uploaded PDF Document</p>
                    </div>
                    <a
                      href={previewDoc.url}
                      download={previewDoc.title?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'receipt.pdf'}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs cursor-pointer"
                    >
                      <FileDown className="w-4 h-4" />
                      <span>Download / Open PDF</span>
                    </a>
                  </div>
                ) : (
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.title}
                    className="w-full h-full object-contain max-h-[400px]"
                  />
                )
              ) : (
                <div className="text-center text-slate-400 p-8">
                  <FileText className="w-12 h-12 mx-auto text-slate-600 mb-2" />
                  <p className="font-semibold text-xs">No visual preview available for this voucher.</p>
                </div>
              )}
              <div className="absolute bottom-3 left-3 right-3 bg-slate-900/90 backdrop-blur-md border border-slate-700 p-2.5 rounded-xl flex items-center justify-between text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <span className="font-medium">
                      {previewDoc.invoiceNo ? `Invoice: ${previewDoc.invoiceNo}` : 'GST-Compliant Official Vouchers'}
                    </span>
                    {previewDoc.gstin && (
                      <span className="text-slate-400 text-[11px] ml-1">
                        • GSTIN: {previewDoc.gstin}
                      </span>
                    )}
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-300 shrink-0 ml-2">
                  {previewDoc.amount}
                </span>
              </div>
            </div>

            {/* Item Switcher if multiple items exist */}
            {previewDoc.items && previewDoc.items.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {previewDoc.items.map((it, idx) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => {
                      setPreviewDoc(prev =>
                        prev
                          ? {
                              ...prev,
                              title: `${it.category}: ${it.receiptName || it.description}`,
                              url:
                                it.receiptUrl ||
                                (it.category === 'Hotel/Lodging'
                                  ? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80'
                                  : 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80'),
                              amount: `₹${it.claimAmount.toLocaleString()}`,
                              invoiceNo: it.invoiceNumber,
                              gstin: it.gstin,
                              vendorName: it.vendorName,
                              category: it.category,
                              currentIndex: idx
                            }
                          : null
                      );
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                      previewDoc.currentIndex === idx
                        ? 'bg-teal-800 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {it.category} (₹{it.claimAmount.toLocaleString()})
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-dbs-green hover:bg-dbs-green-dark text-white transition-colors cursor-pointer"
              >
                Done Inspecting
              </button>
            </div>
          </div>
        </div>
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
    </div>
  );
};
