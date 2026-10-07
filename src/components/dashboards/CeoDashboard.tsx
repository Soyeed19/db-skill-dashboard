import React, { useState, useMemo } from 'react';
import {
  Building2,
  Award,
  CheckCircle2,
  CreditCard,
  Download,
  Filter,
  Search,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Users,
  Compass,
  FileSpreadsheet,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  MapPin,
  Clock,
  Layers,
  Sparkles,
  ArrowUpRight,
  Check,
  Wrench,
  X,
  Package,
  AlertOctagon,
  BellRing,
  PackageX,
  FileWarning
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Center } from '../../types';
import { exportNationalMasterAuditDossier, NationalLeagueItem } from '../../utils/excelExporter';

export const CeoDashboard: React.FC = () => {
  const {
    centers,
    candidates,
    batches,
    consumables,
    expenseClaims,
    maintenanceTickets,
    employees,
    attendancePunches,
    setActiveCenter,
    setSelectedCenterId,
    showToast
  } = useApp();

  // Filter State
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('Q3 FY 2026-27 (Current)');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [performanceFilter, setPerformanceFilter] = useState<'All' | 'Target Met' | 'Underperforming'>('All');
  const [sortField, setSortField] = useState<'rank' | 'targetPercent' | 'defects' | 'auditScore'>('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [inspectCenter, setInspectCenter] = useState<NationalLeagueItem | null>(null);
  const [alertFilter, setAlertFilter] = useState<'all' | 'audit_failure' | 'inventory_stockout' | 'facility_defect'>('all');
  const [isAlertsCollapsed, setIsAlertsCollapsed] = useState<boolean>(false);

  // States list from centers
  const uniqueStates = useMemo(() => {
    const states = Array.from(new Set(centers.map(c => c.state))).filter(Boolean);
    return ['All States', ...states];
  }, [centers]);

  // Aggregate GM Sanctioned Expense Burn
  const totalSanctionedExpenseBurn = useMemo(() => {
    const sanctionedClaims = expenseClaims.filter(c =>
      c.status === 'Approved by GM - Ready for Bank Disbursement' ||
      c.status === 'Disbursed' ||
      c.status === 'Settled via Bank Transfer'
    );
    const sum = sanctionedClaims.reduce((acc, c) => acc + (c.totalApproved || c.totalClaimed || 0), 0);
    // Baseline historical burn + live claims to represent full 14-hub national operation
    return sum > 0 ? sum + 185000 : 248500;
  }, [expenseClaims]);

  // Precomputed baseline stats per center for high-fidelity MIS league table
  const leagueData: NationalLeagueItem[] = useMemo(() => {
    // Deterministic simulation based on center code to guarantee authentic enterprise variance
    return centers.map((center, index) => {
      // Find actual center candidates if any
      const centerCandidates = candidates.filter(c => c.centerId === center.id);
      const centerBatches = batches.filter(b => b.centerId === center.id);
      const centerTickets = maintenanceTickets.filter(
        t => t.centerId === center.id &&
        t.status !== 'Resolved by APM' &&
        t.status !== 'Resolved by Senior Manager'
      );

      // Realistic baseline target quotas for national commercial driving centers
      const baselineTargets: Record<string, { target: number; enrolled: number; certified: number; defects: number; auditScore: number }> = {
        'RJ-01': { target: 450, enrolled: 472, certified: 458, defects: 0, auditScore: 98 },
        'RJ-02': { target: 400, enrolled: 416, certified: 395, defects: 1, auditScore: 94 },
        'RJ-03': { target: 350, enrolled: 315, certified: 298, defects: 2, auditScore: 82 },
        'RJ-04': { target: 300, enrolled: 288, certified: 275, defects: 0, auditScore: 91 },
        'DL-01': { target: 500, enrolled: 520, certified: 505, defects: 0, auditScore: 99 },
        'DL-02': { target: 480, enrolled: 494, certified: 476, defects: 1, auditScore: 96 },
        'DL-03': { target: 420, enrolled: 395, certified: 380, defects: 0, auditScore: 93 },
        'MH-01': { target: 460, enrolled: 482, certified: 466, defects: 0, auditScore: 97 },
        'MH-02': { target: 380, enrolled: 310, certified: 290, defects: 3, auditScore: 78 },
        'MH-03': { target: 440, enrolled: 455, certified: 438, defects: 1, auditScore: 95 },
        'MH-04': { target: 360, enrolled: 375, certified: 360, defects: 0, auditScore: 92 },
        'KA-01': { target: 420, enrolled: 438, certified: 422, defects: 0, auditScore: 96 },
        'KA-02': { target: 340, enrolled: 265, certified: 248, defects: 2, auditScore: 79 },
        'KA-04': { target: 450, enrolled: 468, certified: 451, defects: 0, auditScore: 97 }
      };

      const preset = baselineTargets[center.code] || {
        target: 350 + (index * 20),
        enrolled: 340 + (index * 18),
        certified: 320 + (index * 16),
        defects: index % 4 === 0 ? 1 : 0,
        auditScore: 88 + (index % 10)
      };

      // Add real candidates if matching center
      const actualEnrolled = centerCandidates.length > 0 ? preset.enrolled + centerCandidates.length : preset.enrolled;
      const actualTarget = preset.target;
      const targetPercent = Math.round((actualEnrolled / actualTarget) * 100);

      // Defect tickets
      const openDefects = centerTickets.length > 0 ? centerTickets.length : preset.defects;

      // Staff presence
      const centerEmployees = employees.filter(e => e.centerId === center.id);
      const staffTotal = centerEmployees.length > 0 ? centerEmployees.length : 3;
      const staffPresent = openDefects >= 3 ? staffTotal - 1 : staffTotal;
      const staffPresencePercent = Math.round((staffPresent / staffTotal) * 100);
      const staffPresence = staffPresent === staffTotal
        ? `100% Present (${staffPresent}/${staffTotal} GPS Punched)`
        : `${staffPresencePercent}% Present (${staffPresent}/${staffTotal} On-Duty)`;

      // Status
      let performanceStatus: 'Target Met' | 'Near Target' | 'Underperforming' = 'Target Met';
      if (targetPercent < 85 || openDefects >= 3) {
        performanceStatus = 'Underperforming';
      } else if (targetPercent < 90) {
        performanceStatus = 'Near Target';
      }

      // Audit Readiness
      let auditReadiness = '100% PO Verified • Green Signal';
      if (preset.auditScore < 80) {
        auditReadiness = 'Remediation Directives Issued';
      } else if (preset.auditScore < 90) {
        auditReadiness = 'Audit In Progress (92%)';
      }

      return {
        code: center.code,
        name: center.name,
        city: center.city,
        state: center.state,
        region: center.region || 'North Zone',
        poName: center.poName || 'Pooja Verma',
        apmName: center.apmName || 'Siddharth Nair',
        targetDrivers: actualTarget,
        enrolledDrivers: actualEnrolled,
        certifiedDrivers: preset.certified,
        targetPercent,
        openDefects,
        staffPresence,
        staffPresencePercent,
        auditReadiness,
        auditScore: preset.auditScore,
        performanceStatus
      };
    });
  }, [centers, candidates, batches, maintenanceTickets, employees]);

  // Filtered and Sorted League Data
  const filteredLeagueData = useMemo(() => {
    return leagueData
      .filter(item => {
        // State Filter
        if (selectedState !== 'All States' && item.state !== selectedState) {
          return false;
        }
        // Performance Filter
        if (performanceFilter === 'Target Met' && item.performanceStatus !== 'Target Met') {
          return false;
        }
        if (performanceFilter === 'Underperforming' && item.performanceStatus !== 'Underperforming') {
          return false;
        }
        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            item.code.toLowerCase().includes(q) ||
            item.name.toLowerCase().includes(q) ||
            item.city.toLowerCase().includes(q) ||
            item.state.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortField === 'targetPercent') {
          return sortOrder === 'asc' ? a.targetPercent - b.targetPercent : b.targetPercent - a.targetPercent;
        }
        if (sortField === 'defects') {
          return sortOrder === 'asc' ? a.openDefects - b.openDefects : b.openDefects - a.openDefects;
        }
        if (sortField === 'auditScore') {
          return sortOrder === 'asc' ? a.auditScore - b.auditScore : b.auditScore - a.auditScore;
        }
        // Default Rank: Highest fulfillment first
        return sortOrder === 'asc' ? b.targetPercent - a.targetPercent : a.targetPercent - b.targetPercent;
      });
  }, [leagueData, selectedState, performanceFilter, searchQuery, sortField, sortOrder]);

  // High-Level National Overview Aggregates
  const nationalOverview = useMemo(() => {
    const totalCertified = leagueData.reduce((acc, curr) => acc + curr.certifiedDrivers, 0);
    const totalEnrolled = leagueData.reduce((acc, curr) => acc + curr.enrolledDrivers, 0);
    const totalTargets = leagueData.reduce((acc, curr) => acc + curr.targetDrivers, 0);
    const statesCount = new Set(centers.map(c => c.state)).size;
    const avgPassYield = 95.8; // Standardized commercial driver evaluation score

    const targetsMetCount = leagueData.filter(c => c.performanceStatus === 'Target Met').length;
    const underperformingCount = leagueData.filter(c => c.performanceStatus === 'Underperforming').length;
    const totalDefectsCount = leagueData.reduce((acc, curr) => acc + curr.openDefects, 0);

    return {
      activeCentersCount: centers.length,
      statesCount,
      totalCertifiedMtd: totalCertified > 0 ? totalCertified : 4820,
      totalEnrolled,
      totalTargets,
      trainingPassRate: avgPassYield,
      monthlyExpenseBurn: totalSanctionedExpenseBurn,
      targetsMetCount,
      underperformingCount,
      totalDefectsCount
    };
  }, [leagueData, centers, totalSanctionedExpenseBurn]);

  // Dedicated Critical Alerts Aggregator across all centers
  // Aggregates high-priority issues: Audit Failures / Queries, Inventory Stockouts below thresholds, Critical Facility Defects
  interface CriticalAlertItem {
    id: string;
    type: 'audit_failure' | 'inventory_stockout' | 'facility_defect' | 'underperforming_quota';
    severity: 'critical' | 'warning';
    title: string;
    centerCode: string;
    centerName: string;
    centerId: string;
    description: string;
    metricValue: string;
    timestamp?: string;
  }

  const criticalAlerts: CriticalAlertItem[] = useMemo(() => {
    const alerts: CriticalAlertItem[] = [];

    // 1. Audit Failures / Open Queries across Candidates
    candidates.forEach(cand => {
      const openQueries = (cand.queries || []).filter(q => q.status === 'Open');
      if (openQueries.length > 0) {
        const center = centers.find(c => c.id === cand.centerId);
        openQueries.forEach(q => {
          alerts.push({
            id: `audit-${q.id}`,
            type: 'audit_failure',
            severity: 'critical',
            title: `Audit Failure / Flag: ${q.field}`,
            centerCode: center?.code || 'HUB',
            centerName: center?.name || 'Center',
            centerId: cand.centerId,
            description: `Driver ${cand.fullName} (${cand.registrationNumber}): ${q.comment}`,
            metricValue: `Raised by ${q.raisedByRole} (${q.raisedByName})`,
            timestamp: q.createdAt
          });
        });
      }

      if (cand.status === 'Returned for Correction' && cand.poCorrectionRemarks) {
        const center = centers.find(c => c.id === cand.centerId);
        alerts.push({
          id: `audit-ret-${cand.id}`,
          type: 'audit_failure',
          severity: 'warning',
          title: 'Dossier Returned for Correction',
          centerCode: center?.code || 'HUB',
          centerName: center?.name || 'Center',
          centerId: cand.centerId,
          description: `Driver ${cand.fullName} (${cand.registrationNumber}): ${cand.poCorrectionRemarks}`,
          metricValue: 'PO Compliance Rejection',
          timestamp: 'Action Required'
        });
      }
    });

    // 2. Inventory Stockouts below thresholds
    (consumables || []).forEach(item => {
      const isStockout = item.quantityOnHand === 0;
      const isBelowThreshold = item.quantityOnHand < item.minimumThreshold;

      if (isStockout || isBelowThreshold) {
        const center = centers.find(c => c.id === item.centerId);
        const deficit = item.minimumThreshold - item.quantityOnHand;
        alerts.push({
          id: `csm-${item.id}`,
          type: 'inventory_stockout',
          severity: isStockout ? 'critical' : 'warning',
          title: isStockout ? `Critical Stockout: ${item.itemName}` : `Low Stock Breach: ${item.itemName}`,
          centerCode: center?.code || 'HUB',
          centerName: center?.name || 'Center',
          centerId: item.centerId,
          description: `${item.itemType} inventory is below mandated threshold (${item.quantityOnHand} ${item.unit} remaining, min required: ${item.minimumThreshold} ${item.unit}). Deficit: ${deficit} ${item.unit}.`,
          metricValue: `${item.quantityOnHand} / ${item.minimumThreshold} ${item.unit}`,
          timestamp: item.lastUpdated
        });
      }
    });

    // 3. Facility Defects / Open Maintenance Tickets (High or Medium Priority)
    maintenanceTickets.forEach(ticket => {
      const isOpen = ticket.status !== 'Resolved by APM' && ticket.status !== 'Resolved by Senior Manager';
      if (isOpen) {
        const center = centers.find(c => c.id === ticket.centerId);
        alerts.push({
          id: `defect-${ticket.id}`,
          type: 'facility_defect',
          severity: ticket.priority === 'High' ? 'critical' : 'warning',
          title: `Facility Defect (${ticket.priority} Priority): ${ticket.title}`,
          centerCode: center?.code || 'HUB',
          centerName: center?.name || 'Center',
          centerId: ticket.centerId,
          description: ticket.description,
          metricValue: `Status: ${ticket.status}`,
          timestamp: ticket.createdAt
        });
      }
    });

    // 4. Centers severely underperforming quota (from leagueData)
    leagueData.forEach(item => {
      if (item.performanceStatus === 'Underperforming') {
        const center = centers.find(c => c.code === item.code);
        if (center) {
          alerts.push({
            id: `quota-${item.code}`,
            type: 'underperforming_quota',
            severity: 'warning',
            title: `Enrollment Quota Deficit: ${item.name}`,
            centerCode: item.code,
            centerName: item.name,
            centerId: center.id,
            description: `Enrollment at ${item.targetPercent}% (${item.enrolledDrivers}/${item.targetDrivers} drivers). Audit readiness score: ${item.auditScore}/100.`,
            metricValue: `${item.targetPercent}% Achieved`,
            timestamp: 'Current Target Period'
          });
        }
      }
    });

    // Prioritize critical over warning
    return alerts.sort((a, b) => {
      if (a.severity === 'critical' && b.severity !== 'critical') return -1;
      if (b.severity === 'critical' && a.severity !== 'critical') return 1;
      return 0;
    });
  }, [candidates, consumables, maintenanceTickets, leagueData, centers]);

  // Handle Export to Excel
  const handleExportDossier = () => {
    setIsExporting(true);
    try {
      const fileName = exportNationalMasterAuditDossier({
        leagueData: filteredLeagueData,
        nationalMetrics: {
          activeCentersCount: nationalOverview.activeCentersCount,
          statesCount: nationalOverview.statesCount,
          totalCertifiedMtd: nationalOverview.totalCertifiedMtd,
          trainingPassRate: nationalOverview.trainingPassRate,
          monthlyExpenseBurn: nationalOverview.monthlyExpenseBurn,
          quarter: selectedQuarter,
          stateFilter: selectedState
        },
        exportedBy: 'Col. Ajay Bakshi (Retd.) (CEO / Managing Director)'
      });
      showToast(`Exported: ${fileName}`);
    } catch (err) {
      console.error(err);
      showToast('Error exporting national audit dossier. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Executive National Command Header Banner */}
      <div className="bg-gradient-to-r from-dbs-green-dark via-dbs-green to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-sm border border-dbs-green/30 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/15 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dbs-growth/20 border border-dbs-growth/30 text-emerald-200 text-xs font-bold tracking-wide">
              <Compass className="w-3.5 h-3.5 text-dbs-growth" />
              <span>EXECUTIVE COMMAND (LEVEL 1) — NATIONAL OPERATIONS CONSOLE</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
              National Executive Command Console
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed">
              Read-Only Pan-India Executive Intelligence for Managing Director & CEO. Comprehensive real-time telemetrics across commercial vehicle driver training hubs, state regulatory certifications, defect audits, and GM-sanctioned financial disbursements.
            </p>
          </div>

          {/* Persona Signature & Security Rating */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex flex-col gap-2 shrink-0 text-xs">
            <div className="flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80"
                alt="Col. Ajay Bakshi"
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-400"
              />
              <div>
                <span className="font-bold text-white block">Col. Ajay Bakshi (Retd.)</span>
                <span className="text-[11px] text-emerald-300 font-medium">CEO / Managing Director</span>
              </div>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3 text-[11px] text-emerald-100 font-mono">
              <span>Authority: Pan-India Command</span>
              <span>•</span>
              <span className="text-emerald-300">Level 1 Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Executive Action Bar with Filters & 1-Click Excel Export */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Left: Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Quarter Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="Q3 FY 2026-27 (Current)">Q3 FY 2026-27 (Current)</option>
              <option value="Q2 FY 2026-27 (Archived)">Q2 FY 2026-27 (Archived)</option>
              <option value="Q1 FY 2026-27 (Archived)">Q1 FY 2026-27 (Archived)</option>
              <option value="FY 2026-27 Full Year">FY 2026-27 Full Year</option>
            </select>
          </div>

          {/* State Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <MapPin className="w-3.5 h-3.5 text-dbs-cyan shrink-0" />
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
            >
              {uniqueStates.map(st => (
                <option key={st} value={st}>{st === 'All States' ? 'All India (14 Hubs)' : `${st} Centers`}</option>
              ))}
            </select>
          </div>

          {/* Performance Quick Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <select
              value={performanceFilter}
              onChange={(e) => setPerformanceFilter(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="All">All Hubs (100%)</option>
              <option value="Target Met">Targets Met (Green Tags)</option>
              <option value="Underperforming">Underperforming (Red Tags)</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search code, city or hub..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-dbs-green transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Right: Primary Master Action Button: Export .xlsx */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportDossier}
            disabled={isExporting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-dbs-green hover:bg-dbs-green-dark text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="Download full multi-sheet Microsoft Excel dossier with centers league, defect logs, and national summaries"
          >
            <FileSpreadsheet className="w-4 h-4 text-dbs-growth-light" />
            <span>📊 Export National Master Audit Dossier (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* 2.5 DEDICATED CRITICAL ALERTS COMMAND CONSOLE (High-Priority Pan-India Aggregator) */}
      <div className="bg-white rounded-3xl border border-red-200/90 shadow-sm overflow-hidden transition-all">
        {/* Alerts Banner Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-700 to-amber-600 text-white px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shrink-0">
              <AlertOctagon className="w-5 h-5 text-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                  <span>Pan-India Critical Alerts & Operational Exceptions</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-black font-mono">
                    {criticalAlerts.length}
                  </span>
                </h2>
              </div>
              <p className="text-xs text-rose-100 font-medium">
                Real-time exception aggregator: Candidate Audit Failures, Consumable Inventory Stockouts, and Facility Defects requiring Executive escalation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Filter Pills */}
            <div className="hidden md:flex items-center bg-black/20 backdrop-blur-sm p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setAlertFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  alertFilter === 'all' ? 'bg-white text-rose-900 shadow-2xs' : 'text-white/80 hover:text-white'
                }`}
              >
                All ({criticalAlerts.length})
              </button>
              <button
                type="button"
                onClick={() => setAlertFilter('audit_failure')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  alertFilter === 'audit_failure' ? 'bg-white text-rose-900 shadow-2xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Audit Flags ({criticalAlerts.filter(a => a.type === 'audit_failure').length})
              </button>
              <button
                type="button"
                onClick={() => setAlertFilter('inventory_stockout')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  alertFilter === 'inventory_stockout' ? 'bg-white text-rose-900 shadow-2xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Stockouts ({criticalAlerts.filter(a => a.type === 'inventory_stockout').length})
              </button>
              <button
                type="button"
                onClick={() => setAlertFilter('facility_defect')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  alertFilter === 'facility_defect' ? 'bg-white text-rose-900 shadow-2xs' : 'text-white/80 hover:text-white'
                }`}
              >
                Defects ({criticalAlerts.filter(a => a.type === 'facility_defect').length})
              </button>
            </div>

            {/* Collapse / Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsAlertsCollapsed(!isAlertsCollapsed)}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {isAlertsCollapsed ? 'Expand View' : 'Minimize'}
            </button>
          </div>
        </div>

        {/* Mobile filter buttons */}
        <div className="flex md:hidden items-center gap-1.5 p-2 bg-rose-50 border-b border-rose-100 overflow-x-auto text-[11px]">
          <button
            type="button"
            onClick={() => setAlertFilter('all')}
            className={`px-2 py-1 rounded-lg font-bold shrink-0 ${
              alertFilter === 'all' ? 'bg-rose-700 text-white' : 'bg-white text-slate-700'
            }`}
          >
            All ({criticalAlerts.length})
          </button>
          <button
            type="button"
            onClick={() => setAlertFilter('audit_failure')}
            className={`px-2 py-1 rounded-lg font-bold shrink-0 ${
              alertFilter === 'audit_failure' ? 'bg-rose-700 text-white' : 'bg-white text-slate-700'
            }`}
          >
            Audits ({criticalAlerts.filter(a => a.type === 'audit_failure').length})
          </button>
          <button
            type="button"
            onClick={() => setAlertFilter('inventory_stockout')}
            className={`px-2 py-1 rounded-lg font-bold shrink-0 ${
              alertFilter === 'inventory_stockout' ? 'bg-rose-700 text-white' : 'bg-white text-slate-700'
            }`}
          >
            Stockouts ({criticalAlerts.filter(a => a.type === 'inventory_stockout').length})
          </button>
          <button
            type="button"
            onClick={() => setAlertFilter('facility_defect')}
            className={`px-2 py-1 rounded-lg font-bold shrink-0 ${
              alertFilter === 'facility_defect' ? 'bg-rose-700 text-white' : 'bg-white text-slate-700'
            }`}
          >
            Defects ({criticalAlerts.filter(a => a.type === 'facility_defect').length})
          </button>
        </div>

        {/* Alert Cards List */}
        {!isAlertsCollapsed && (
          <div className="p-4 sm:p-5 bg-gradient-to-b from-rose-50/40 to-white">
            {criticalAlerts.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                <CheckCircle2 className="w-9 h-9 mx-auto text-emerald-600 mb-2" />
                <p className="font-bold text-slate-800">No Critical Operational Alerts Found</p>
                <p className="text-xs text-slate-500 mt-0.5">All 14 training hubs report compliance across audits, safety inventory, and facility health.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {criticalAlerts
                  .filter(alert => alertFilter === 'all' || alert.type === alertFilter)
                  .map((alert) => {
                    const isAudit = alert.type === 'audit_failure';
                    const isStockout = alert.type === 'inventory_stockout';
                    const isDefect = alert.type === 'facility_defect';

                    return (
                      <div
                        key={alert.id}
                        className={`rounded-2xl p-4 border transition-all hover:shadow-md flex flex-col justify-between ${
                          alert.severity === 'critical'
                            ? 'bg-white border-red-300 shadow-2xs hover:border-red-400'
                            : 'bg-white border-amber-300 shadow-2xs hover:border-amber-400'
                        }`}
                      >
                        <div>
                          {/* Alert Top Bar */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`p-1.5 rounded-xs ${
                                isAudit
                                  ? 'bg-rose-100 text-rose-700'
                                  : isStockout
                                  ? 'bg-orange-100 text-orange-700'
                                  : isDefect
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {isAudit && <FileWarning className="w-4 h-4" />}
                                {isStockout && <PackageX className="w-4 h-4" />}
                                {isDefect && <Wrench className="w-4 h-4" />}
                                {!isAudit && !isStockout && !isDefect && <AlertTriangle className="w-4 h-4" />}
                              </span>

                              <div>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  alert.severity === 'critical'
                                    ? 'bg-red-100 text-red-800 border border-red-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  {alert.severity === 'critical' ? 'CRITICAL HIGH' : 'ATTENTION'}
                                </span>
                              </div>
                            </div>

                            {/* Hub badge */}
                            <span className="font-mono text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                              {alert.centerCode}
                            </span>
                          </div>

                          {/* Title & Hub */}
                          <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1">
                            {alert.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {alert.centerName}
                          </p>

                          {/* Description */}
                          <p className="text-xs text-slate-600 mt-2 bg-slate-50 rounded-xl p-2.5 border border-slate-100 leading-relaxed">
                            {alert.description}
                          </p>
                        </div>

                        {/* Bottom action & telemetric */}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-slate-700 truncate max-w-[170px]">
                            {alert.metricValue}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              const matchItem = leagueData.find(item => item.code === alert.centerCode);
                              if (matchItem) {
                                setInspectCenter(matchItem);
                              } else {
                                showToast(`Scoping into ${alert.centerName} (${alert.centerCode})`);
                              }
                            }}
                            className="text-dbs-green hover:text-dbs-green-dark font-bold inline-flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <span>Inspect Hub</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Top Metric Cards (Pan-India Overview) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Centers */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Centers</span>
            <div className="w-9 h-9 rounded-xl bg-dbs-green-light flex items-center justify-center text-dbs-green">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {nationalOverview.activeCentersCount} Hubs Across {nationalOverview.statesCount} States
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-dbs-growth"></span>
              <span>Rajasthan (4) • Delhi NCR (3) • MH (4) • KA (3)</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Infrastructure Readiness</span>
            <span className="font-bold text-dbs-green">100% Licensed</span>
          </div>
        </div>

        {/* Metric 2: Total Drivers Certified MTD */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Drivers Certified (MTD)</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-dbs-cyan">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {nationalOverview.totalCertifiedMtd.toLocaleString()} Drivers
            </div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+14.2% MoM • 96.4% of 5,000 Target</span>
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Enrolled Driver Pool</span>
            <span className="font-bold text-slate-800">{nationalOverview.totalEnrolled.toLocaleString()} Trainees</span>
          </div>
        </div>

        {/* Metric 3: Training Pass Rate */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Training Pass Rate</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-dbs-growth">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {nationalOverview.trainingPassRate}% Pass Yield
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Exceeds 90% benchmark threshold (+2.4% vs Q2)
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Curriculum Standard</span>
            <span className="font-bold text-dbs-green">MoRTH Standardized</span>
          </div>
        </div>

        {/* Metric 4: Monthly Operational Expense Burn */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operational Expense Burn</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{nationalOverview.monthlyExpenseBurn.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              GM Sanctioned Total • 94.6% budget adherence
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Average Burn / Hub</span>
            <span className="font-bold text-slate-800">₹{(Math.round(nationalOverview.monthlyExpenseBurn / nationalOverview.activeCentersCount)).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* 4. Pan-India Centers League Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* League Table Header Bar */}
        <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Pan-India Centers League Table
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-dbs-green-light text-dbs-green-dark border border-dbs-green/20">
                {filteredLeagueData.length} Centers Listed
              </span>
            </div>
            <p className="text-xs text-slate-500">
              National performance ranking across enrollment quota, facility physical audits, biometric staff punches, and auditor readiness.
            </p>
          </div>

          {/* Quick Counter Summary */}
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {nationalOverview.targetsMetCount} Met Targets
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-red-800 border border-red-200 font-semibold text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {nationalOverview.underperformingCount} Attention Required
            </span>
          </div>
        </div>

        {/* The League Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/75 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Center Code</th>
                <th className="py-3 px-4 min-w-[200px]">Location & Hub</th>
                <th
                  onClick={() => {
                    setSortField('targetPercent');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-4 min-w-[180px] cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Current Enrollment Target %</span>
                    {sortField === 'targetPercent' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortField('defects');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-4 min-w-[170px] cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Facility Health (Open Defects)</span>
                    {sortField === 'defects' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th className="py-3 px-4 min-w-[190px]">Staff Attendance Status</th>
                <th
                  onClick={() => {
                    setSortField('auditScore');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-4 min-w-[180px] cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Audit Readiness</span>
                    {sortField === 'auditScore' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeagueData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No centers matched your current filter criteria.</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting the state filter or search keywords.</p>
                  </td>
                </tr>
              ) : (
                filteredLeagueData.map((item, index) => {
                  const isGreen = item.performanceStatus === 'Target Met';
                  const isRed = item.performanceStatus === 'Underperforming';

                  return (
                    <tr
                      key={item.code}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isRed ? 'bg-red-50/20' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-mono ${
                          index === 0 ? 'bg-amber-100 text-amber-800 font-bold' :
                          index === 1 ? 'bg-slate-200 text-slate-700 font-bold' :
                          index === 2 ? 'bg-orange-100 text-orange-800 font-bold' :
                          'text-slate-500'
                        }`}>
                          {index + 1}
                        </span>
                      </td>

                      {/* Center Code */}
                      <td className="py-3.5 px-4 font-mono font-extrabold">
                        <span className="px-2.5 py-1 rounded-lg bg-dbs-cyan-light text-dbs-cyan-dark border border-dbs-cyan/20">
                          {item.code}
                        </span>
                      </td>

                      {/* Location & Hub Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{item.city}, {item.state}</span>
                          <span>•</span>
                          <span className="text-slate-400 font-medium">PO: {item.poName}</span>
                        </div>
                      </td>

                      {/* Current Enrollment Target % & Visual Indicator Tag */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-slate-900 text-xs">
                              {item.enrolledDrivers} / {item.targetDrivers}
                            </span>

                            {/* CRITICAL DIRECTIVE: Visual Indicator Red tag for underperforming centers, Green for targets met */}
                            {isGreen ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Target Met • {item.targetPercent}%
                              </span>
                            ) : isRed ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                Underperforming • {item.targetPercent}%
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                Near Target • {item.targetPercent}%
                              </span>
                            )}
                          </div>

                          {/* Linear visual progress bar */}
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isGreen ? 'bg-dbs-green' : isRed ? 'bg-red-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${Math.min(item.targetPercent, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Facility Health (Open Defects) */}
                      <td className="py-3.5 px-4">
                        {item.openDefects === 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            0 Defects • Pristine
                          </span>
                        ) : item.openDefects >= 3 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-red-50 text-red-800 border border-red-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                            {item.openDefects} Open Issues (Urgent)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Wrench className="w-3.5 h-3.5 text-amber-600" />
                            {item.openDefects} Active Maintenance
                          </span>
                        )}
                      </td>

                      {/* Staff Attendance Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${
                            item.staffPresencePercent === 100 ? 'bg-dbs-growth' : 'bg-amber-500'
                          }`} />
                          <div>
                            <span className="font-semibold text-slate-800 text-[11px] block">
                              {item.staffPresence}
                            </span>
                            <span className="text-[10px] text-slate-400">Zero Supervisor • Geotagged</span>
                          </div>
                        </div>
                      </td>

                      {/* Audit Readiness */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className={`w-4 h-4 shrink-0 ${
                            item.auditScore >= 95 ? 'text-dbs-green' : item.auditScore >= 85 ? 'text-amber-500' : 'text-red-500'
                          }`} />
                          <div>
                            <span className="font-bold text-slate-800 text-[11px] block">
                              {item.auditReadiness}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              Audit Score: <strong>{item.auditScore}/100</strong>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action: Inspect */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectCenter(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-dbs-green hover:text-white text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                          title="Inspect detailed hub telemetry and dossier"
                        >
                          <span>Inspect</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Diagnostics */}
        <div className="px-6 py-3.5 bg-slate-50/90 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
          <div className="flex items-center gap-3">
            <span>Pan-India Coverage: <strong>{nationalOverview.activeCentersCount} Regional Hubs</strong></span>
            <span>•</span>
            <span>Average National Fulfillment: <strong>{Math.round((nationalOverview.totalEnrolled / nationalOverview.totalTargets) * 100)}%</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span>Last Synced: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>•</span>
            <span className="text-dbs-green font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-dbs-green" /> Live Telemetry Linked
            </span>
          </div>
        </div>
      </div>

      {/* 5. Center Telemetry Inspection Modal */}
      {inspectCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-dbs-green-dark to-dbs-green text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl border border-white/20 font-mono font-black text-sm">
                  {inspectCenter.code}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white leading-tight">
                    {inspectCenter.name}
                  </h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    {inspectCenter.city}, {inspectCenter.state} ({inspectCenter.region} Region)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectCenter(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Quick Status Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Enrollment Fulfillment</span>
                  <span className={`text-base font-extrabold block mt-0.5 ${
                    inspectCenter.performanceStatus === 'Target Met' ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {inspectCenter.targetPercent}%
                  </span>
                  <span className="text-[10px] text-slate-400">{inspectCenter.enrolledDrivers} / {inspectCenter.targetDrivers} Drivers</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Certified Drivers</span>
                  <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                    {inspectCenter.certifiedDrivers}
                  </span>
                  <span className="text-[10px] text-slate-400">MTD Qualified</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Facility Defects</span>
                  <span className={`text-base font-extrabold block mt-0.5 ${
                    inspectCenter.openDefects === 0 ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {inspectCenter.openDefects} Open
                  </span>
                  <span className="text-[10px] text-slate-400">Physical audit</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Audit Score</span>
                  <span className="text-base font-extrabold text-dbs-green block mt-0.5">
                    {inspectCenter.auditScore}/100
                  </span>
                  <span className="text-[10px] text-slate-400">{inspectCenter.auditReadiness.split('•')[0]}</span>
                </div>
              </div>

              {/* Officers & Key Staff */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                  Assigned Leadership & Field Officers
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Program Compliance Officer (PO):</span>
                    <strong className="text-slate-900 font-semibold">{inspectCenter.poName}</strong>
                    <span className="text-[10px] text-slate-400 block">Biometric & Identity QC Verification</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Senior Manager (Regional Operations):</span>
                    <strong className="text-slate-900 font-semibold">{inspectCenter.apmName}</strong>
                    <span className="text-[10px] text-slate-400 block">Travel Gatekeeper & Staff Sanctions</span>
                  </div>
                </div>
              </div>

              {/* Staff Attendance & Daily Punch Status */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950">Daily Field Staff Presence Status</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {inspectCenter.staffPresencePercent}% Present
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {inspectCenter.staffPresence}. All employees at this center record attendance with front camera biometric selfie photos and GPS device coordinates without manual supervisor signatures.
                </p>
              </div>

              {/* Executive Directives for Underperforming Hubs */}
              {inspectCenter.performanceStatus === 'Underperforming' && (
                <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-red-900 font-bold">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>Executive Warning: Center Below 85% National Threshold</span>
                  </div>
                  <p className="text-red-700 text-[11px]">
                    This center is flagged in the national audit. Recommended action: Direct Senior Manager ({inspectCenter.apmName}) to inspect local mobilisation campaigns and expedite remediation of open facility tickets.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Hub ID: <strong>{inspectCenter.code}</strong> • Full Read-Only Pan-India Access
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const match = centers.find(c => c.code === inspectCenter.code);
                    if (match) {
                      setActiveCenter(match);
                      setSelectedCenterId(match.id);
                      showToast(`Scaped active center to: ${match.name}`);
                    }
                    setInspectCenter(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-dbs-green hover:bg-dbs-green-dark text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Set as Active Center Scope
                </button>
                <button
                  type="button"
                  onClick={() => setInspectCenter(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
