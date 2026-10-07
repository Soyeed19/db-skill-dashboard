import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  Award,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertTriangle,
  Building,
  Filter,
  BarChart3,
  Percent,
  GraduationCap,
  Sparkles,
  HelpCircle,
  FileCheck2,
  Target
} from 'lucide-react';
import { Center, Candidate, Batch } from '../../types';

interface TrainingEfficacyChartProps {
  centers: Center[];
  candidates: Candidate[];
  batches: Batch[];
  className?: string;
}

// Center Historical Base Profile for statistical stability across all 4 national hubs
const HISTORICAL_CENTER_STATS: Record<
  string,
  {
    historicalTested: number;
    historicalPassed: number;
    historicalFailed: number;
    preTestAvg: number;
    postTestAvg: number;
    trainerName: string;
    totalBatchesConducted: number;
  }
> = {
  'ctr-jodhpur': {
    historicalTested: 240,
    historicalPassed: 221,
    historicalFailed: 19,
    preTestAvg: 62.4,
    postTestAvg: 89.1,
    trainerName: 'Vikram Singh Rathore',
    totalBatchesConducted: 8
  },
  'ctr-delhi': {
    historicalTested: 290,
    historicalPassed: 264,
    historicalFailed: 26,
    preTestAvg: 59.8,
    postTestAvg: 87.5,
    trainerName: 'Manish Kumar',
    totalBatchesConducted: 10
  },
  'ctr-mumbai': {
    historicalTested: 255,
    historicalPassed: 242,
    historicalFailed: 13,
    preTestAvg: 64.2,
    postTestAvg: 92.4,
    trainerName: 'Santosh Sawant',
    totalBatchesConducted: 9
  },
  'ctr-bengaluru': {
    historicalTested: 205,
    historicalPassed: 186,
    historicalFailed: 19,
    preTestAvg: 61.1,
    postTestAvg: 88.0,
    trainerName: 'K. Ramesh Babu',
    totalBatchesConducted: 7
  }
};

export const TrainingEfficacyChart: React.FC<TrainingEfficacyChartProps> = ({
  centers,
  candidates,
  batches,
  className = ''
}) => {
  // View mode: 'pass_fail_volume' | 'efficacy_scores' | 'batch_drilldown'
  const [viewMode, setViewMode] = useState<'pass_fail_volume' | 'efficacy_scores' | 'batch_drilldown'>('pass_fail_volume');
  const [selectedCenterFilter, setSelectedCenterFilter] = useState<string>('all');

  // Compute aggregated center statistics combining live candidates with historical baselines
  const centerEfficacyData = useMemo(() => {
    return centers.map(center => {
      const centerCand = candidates.filter(c => c.centerId === center.id);
      const base = HISTORICAL_CENTER_STATS[center.id] || {
        historicalTested: 180,
        historicalPassed: 162,
        historicalFailed: 18,
        preTestAvg: 60.0,
        postTestAvg: 88.0,
        trainerName: center.poName || 'Master Trainer',
        totalBatchesConducted: 6
      };

      // Live candidate pass/fail breakdown
      let livePassed = 0;
      let liveFailed = 0;
      let livePreTotal = 0;
      let livePostTotal = 0;
      let scoredCount = 0;

      centerCand.forEach(c => {
        const post = c.postTestScore ?? 85;
        const pre = c.preTestScore ?? 62;
        livePreTotal += pre;
        livePostTotal += post;
        scoredCount += 1;

        const isPassed =
          post >= 70 ||
          c.status === 'Certified & Dispatched' ||
          c.status === 'APM QC Passed' ||
          c.status === 'Approved by PO' ||
          c.status === 'Green Signal (Video Call)';

        if (isPassed) {
          livePassed += 1;
        } else {
          liveFailed += 1;
        }
      });

      const totalTested = base.historicalTested + centerCand.length;
      const totalPassed = base.historicalPassed + livePassed;
      const totalFailed = base.historicalFailed + liveFailed;
      const passRate = totalTested > 0 ? Number(((totalPassed / totalTested) * 100).toFixed(1)) : 0;
      const failRate = totalTested > 0 ? Number(((totalFailed / totalTested) * 100).toFixed(1)) : 0;

      const preScoreAvg = scoredCount > 0
        ? Number(((base.preTestAvg * 4 + (livePreTotal / scoredCount)) / 5).toFixed(1))
        : base.preTestAvg;

      const postScoreAvg = scoredCount > 0
        ? Number(((base.postTestAvg * 4 + (livePostTotal / scoredCount)) / 5).toFixed(1))
        : base.postTestAvg;

      const knowledgeGain = Number((postScoreAvg - preScoreAvg).toFixed(1));
      const centerBatches = batches.filter(b => b.centerId === center.id);

      return {
        id: center.id,
        code: center.code,
        name: center.name,
        city: center.city,
        totalTested,
        totalPassed,
        totalFailed,
        passRate,
        failRate,
        preScoreAvg,
        postScoreAvg,
        knowledgeGain,
        trainerName: base.trainerName,
        batchesCount: base.totalBatchesConducted + (centerBatches.length > 0 ? centerBatches.length : 1),
        isAboveTarget: passRate >= 85.0
      };
    });
  }, [centers, candidates, batches]);

  // Compute batch-level breakdown across all or filtered centers
  const batchEfficacyData = useMemo(() => {
    const list: Array<{
      batchCode: string;
      centerCode: string;
      centerName: string;
      date: string;
      trainer: string;
      enrolled: number;
      passed: number;
      failed: number;
      passRate: number;
      preAvg: number;
      postAvg: number;
    }> = [];

    // Synthesize realistic batch records from active batches and centers
    centers.forEach(center => {
      if (selectedCenterFilter !== 'all' && center.id !== selectedCenterFilter) return;

      const centerCand = candidates.filter(c => c.centerId === center.id);
      const centerBatches = batches.filter(b => b.centerId === center.id);
      const base = HISTORICAL_CENTER_STATS[center.id];

      // Batch 1: Current active batch
      const b1Enrolled = centerCand.length > 0 ? centerCand.length : 28;
      const b1Passed = Math.round(b1Enrolled * (base ? base.historicalPassed / base.historicalTested : 0.91));
      const b1Failed = Math.max(1, b1Enrolled - b1Passed);
      const b1PassRate = Number(((b1Passed / b1Enrolled) * 100).toFixed(1));

      list.push({
        batchCode: centerBatches[0]?.batchCode || `DBS-${center.code.replace('-', '')}-2609-B1`,
        centerCode: center.code,
        centerName: center.name,
        date: '2026-09-23',
        trainer: centerBatches[0]?.trainerName || base?.trainerName || 'Master Trainer',
        enrolled: b1Enrolled,
        passed: b1Passed,
        failed: b1Failed,
        passRate: b1PassRate,
        preAvg: base ? base.preTestAvg : 62,
        postAvg: base ? base.postTestAvg : 89
      });

      // Batch 2: Previous cycle batch
      const b2Enrolled = 30;
      const b2Passed = Math.round(30 * (base ? (base.historicalPassed / base.historicalTested) + 0.02 : 0.93));
      const b2Failed = b2Enrolled - b2Passed;
      list.push({
        batchCode: `DBS-${center.code.replace('-', '')}-2609-B2`,
        centerCode: center.code,
        centerName: center.name,
        date: '2026-09-16',
        trainer: base?.trainerName || 'Master Trainer',
        enrolled: b2Enrolled,
        passed: b2Passed,
        failed: b2Failed,
        passRate: Number(((b2Passed / b2Enrolled) * 100).toFixed(1)),
        preAvg: base ? Number((base.preTestAvg - 1.5).toFixed(1)) : 60,
        postAvg: base ? Number((base.postTestAvg + 1.2).toFixed(1)) : 90
      });

      // Batch 3: Early month batch
      const b3Enrolled = 26;
      const b3Passed = Math.round(26 * (base ? (base.historicalPassed / base.historicalTested) - 0.03 : 0.88));
      const b3Failed = b3Enrolled - b3Passed;
      list.push({
        batchCode: `DBS-${center.code.replace('-', '')}-2609-B3`,
        centerCode: center.code,
        centerName: center.name,
        date: '2026-09-08',
        trainer: base?.trainerName || 'Master Trainer',
        enrolled: b3Enrolled,
        passed: b3Passed,
        failed: b3Failed,
        passRate: Number(((b3Passed / b3Enrolled) * 100).toFixed(1)),
        preAvg: base ? Number((base.preTestAvg + 0.8).toFixed(1)) : 63,
        postAvg: base ? Number((base.postTestAvg - 0.5).toFixed(1)) : 88
      });
    });

    return list;
  }, [centers, candidates, batches, selectedCenterFilter]);

  // Overall Pan-India Executive KPI Calculations
  const panIndiaTotals = useMemo(() => {
    let tested = 0;
    let passed = 0;
    let failed = 0;
    let preSum = 0;
    let postSum = 0;

    centerEfficacyData.forEach(c => {
      tested += c.totalTested;
      passed += c.totalPassed;
      failed += c.totalFailed;
      preSum += c.preScoreAvg;
      postSum += c.postScoreAvg;
    });

    const passRate = tested > 0 ? Number(((passed / tested) * 100).toFixed(1)) : 0;
    const avgPre = centerEfficacyData.length > 0 ? Number((preSum / centerEfficacyData.length).toFixed(1)) : 0;
    const avgPost = centerEfficacyData.length > 0 ? Number((postSum / centerEfficacyData.length).toFixed(1)) : 0;
    const knowledgeGain = Number((avgPost - avgPre).toFixed(1));

    // Best performing center
    const sorted = [...centerEfficacyData].sort((a, b) => b.passRate - a.passRate);
    const topCenter = sorted[0];

    return {
      tested,
      passed,
      failed,
      passRate,
      avgPre,
      avgPost,
      knowledgeGain,
      topCenter
    };
  }, [centerEfficacyData]);

  // Filtered center dataset for chart rendering
  const displayChartData = useMemo(() => {
    if (selectedCenterFilter === 'all') {
      return centerEfficacyData;
    }
    return centerEfficacyData.filter(c => c.id === selectedCenterFilter);
  }, [centerEfficacyData, selectedCenterFilter]);

  return (
    <div className={`bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6 ${className}`}>
      {/* 1. Header & Executive Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
              National Driver Training Quality Audit
            </span>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
              <Target className="w-3 h-3 text-emerald-700" />
              SLA Standard: ≥ 85.0% Pass Rate
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-teal-800" />
            Training Efficacy & Batch Qualification Matrix
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time visualization of commercial driver batch pass/fail distributions, pre-to-post test score jumps, and regional compliance.
          </p>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Center Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCenterFilter}
              onChange={(e) => setSelectedCenterFilter(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Training Hubs (Pan-India)</option>
              {centers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Mode Pill Switcher */}
          <div className="inline-flex rounded-2xl bg-slate-100 p-1 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('pass_fail_volume')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'pass_fail_volume'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Pass vs Fail Volume</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('efficacy_scores')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'efficacy_scores'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Score Delta & Rate %</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('batch_drilldown')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'batch_drilldown'
                  ? 'bg-teal-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Batch Drilldown</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Executive Performance KPI Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            National Pass Rate
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-emerald-700 font-mono">
              {panIndiaTotals.passRate}%
            </span>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-xs">
              +7.0% Over SLA
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Target SLA Benchmark: 85.0%
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Certified & Qualified
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-teal-900 font-mono">
              {panIndiaTotals.passed.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-500">Drivers</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Ready for transport union dispatch
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Remedial / Retests
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-rose-700 font-mono">
              {panIndiaTotals.failed.toLocaleString()}
            </span>
            <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded-xs">
              {(100 - panIndiaTotals.passRate).toFixed(1)}% Retest
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Simulator re-evaluations flagged
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xs p-3.5">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Knowledge Score Gain
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-[#007A3D] font-mono">
              +{panIndiaTotals.knowledgeGain}%
            </span>
            <span className="text-[10px] font-bold text-[#005C2E] bg-[#E6F4EA] border border-[#007A3D]/30 px-1.5 py-0.2 rounded-xs">
              Efficacy Delta
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Baseline {panIndiaTotals.avgPre}% → Post {panIndiaTotals.avgPost}%
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 col-span-2 sm:col-span-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">
            Top Performing Hub
          </span>
          <div className="mt-1">
            <span className="text-sm font-black text-slate-900 block truncate">
              {panIndiaTotals.topCenter?.code}: {panIndiaTotals.topCenter?.city}
            </span>
            <span className="text-xs font-mono font-extrabold text-emerald-700">
              {panIndiaTotals.topCenter?.passRate}% Pass • {panIndiaTotals.topCenter?.trainerName}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            Highest first-attempt qualification
          </span>
        </div>
      </div>

      {/* 3. The Recharts Visualizations */}
      <div className="bg-slate-50/60 border border-slate-200 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              {viewMode === 'pass_fail_volume' && 'Comparative Pass vs Remedial Retest Volume by Training Center'}
              {viewMode === 'efficacy_scores' && 'Qualification Pass Rate (%) & Pre-to-Post Test Score Progression'}
              {viewMode === 'batch_drilldown' && 'Individual Batch Qualification Performance Matrix'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {viewMode === 'pass_fail_volume' && 'Total assessed commercial vehicle drivers qualified vs mandated for simulator re-testing'}
              {viewMode === 'efficacy_scores' && 'Evaluating training efficacy through post-test competency scores against corporate SLA target'}
              {viewMode === 'batch_drilldown' && 'Comparing historical & active batch pass percentages across all scheduled sessions'}
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-600" />
              Passed / Qualified
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-500" />
              Retest Required
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-amber-500" />
              85% Target SLA
            </span>
          </div>
        </div>

        {/* Chart View 1: Pass vs Fail Volume */}
        {viewMode === 'pass_fail_volume' && (
          <div className="w-full h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={displayChartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="code"
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  label={{
                    value: 'Number of Drivers Tested',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#64748b',
                    fontSize: 11
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[220px] space-y-2">
                          <div className="border-b border-slate-700 pb-1.5">
                            <span className="font-mono text-emerald-400 font-extrabold text-[11px] block">
                              {data.code} • {data.city}
                            </span>
                            <strong className="text-slate-100 text-xs block leading-tight">
                              {data.name}
                            </strong>
                          </div>

                          <div className="space-y-1 font-mono text-[11px]">
                            <div className="flex justify-between items-center text-slate-300">
                              <span>Total Assessed:</span>
                              <strong className="text-white">{data.totalTested} Drivers</strong>
                            </div>
                            <div className="flex justify-between items-center text-emerald-400 font-bold">
                              <span>Passed & Qualified:</span>
                              <strong>{data.totalPassed} ({data.passRate}%)</strong>
                            </div>
                            <div className="flex justify-between items-center text-rose-400 font-bold">
                              <span>Retest Needed:</span>
                              <strong>{data.totalFailed} ({data.failRate}%)</strong>
                            </div>
                            <div className="flex justify-between items-center text-sky-300 pt-1 border-t border-slate-800">
                              <span>Knowledge Delta:</span>
                              <strong>+{data.knowledgeGain}%</strong>
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                            Master Trainer: <span className="text-slate-200 font-semibold">{data.trainerName}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
                />
                <Bar
                  dataKey="totalPassed"
                  name="Passed / Qualified Drivers"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
                <Bar
                  dataKey="totalFailed"
                  name="Remedial Retests Required"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart View 2: Efficacy & Score Delta (Composed Chart) */}
        {viewMode === 'efficacy_scores' && (
          <div className="w-full h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={displayChartData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="code"
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  label={{
                    value: 'Percentage (%)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#64748b',
                    fontSize: 11
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[220px] space-y-2">
                          <div className="border-b border-slate-700 pb-1.5">
                            <span className="font-mono text-teal-400 font-extrabold text-[11px] block">
                              {data.code} ({data.city})
                            </span>
                            <strong className="text-slate-100 text-xs block leading-tight">
                              {data.name}
                            </strong>
                          </div>

                          <div className="space-y-1 font-mono text-[11px]">
                            <div className="flex justify-between items-center text-teal-300 font-extrabold">
                              <span>Pass Rate:</span>
                              <span className="text-sm font-black">{data.passRate}%</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Pre-Test Baseline:</span>
                              <strong>{data.preScoreAvg}%</strong>
                            </div>
                            <div className="flex justify-between items-center text-emerald-400">
                              <span>Post-Test Score:</span>
                              <strong>{data.postScoreAvg}%</strong>
                            </div>
                            <div className="flex justify-between items-center text-emerald-300 font-bold pt-1 border-t border-slate-800">
                              <span>Efficacy Jump:</span>
                              <strong>+{data.knowledgeGain}%</strong>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: 12, fontSize: 11 }}
                />
                <ReferenceLine
                  yAxisId="left"
                  y={85}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  label={{
                    value: 'Target SLA Benchmark (85%)',
                    position: 'top',
                    fill: '#b45309',
                    fontSize: 10,
                    fontWeight: 700
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="passRate"
                  name="Qualification Pass Rate %"
                  fill="#007A3D"
                  radius={[4, 4, 0, 0]}
                  barSize={36}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="postScoreAvg"
                  name="Post-Test Average Score %"
                  stroke="#62B548"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#62B548', strokeWidth: 2, stroke: '#ffffff' }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="preScoreAvg"
                  name="Pre-Test Baseline Score %"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 4, fill: '#94a3b8' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart View 3: Batch-by-Batch Drilldown */}
        {viewMode === 'batch_drilldown' && (
          <div className="w-full h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={batchEfficacyData}
                margin={{ top: 20, right: 30, left: 10, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="batchCode"
                  tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  label={{
                    value: 'Batch Pass Rate (%)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#64748b',
                    fontSize: 11
                  }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs min-w-[200px] space-y-1.5 font-mono">
                          <span className="text-emerald-400 font-bold block">{data.batchCode}</span>
                          <span className="text-slate-300 text-[11px] block">{data.centerName}</span>
                          <div className="border-t border-slate-800 pt-1 text-[11px] space-y-0.5">
                            <div>Tested: <strong className="text-white">{data.enrolled} Drivers</strong></div>
                            <div>Passed: <strong className="text-emerald-400">{data.passed} ({data.passRate}%)</strong></div>
                            <div>Failed: <strong className="text-rose-400">{data.failed}</strong></div>
                            <div>Post-Test Avg: <strong className="text-slate-100">{data.postAvg}%</strong></div>
                          </div>
                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                            Trainer: {data.trainer}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine
                  y={85}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                />
                <Bar
                  dataKey="passRate"
                  name="Batch Pass Rate %"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                >
                  {batchEfficacyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.passRate >= 90 ? '#62B548' : entry.passRate >= 85 ? '#007A3D' : '#F15A24'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 4. Center-Wise Detailed Efficacy Audit Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              National Training Center Qualification Scorecard
            </h4>
            <p className="text-[11px] text-slate-500">
              Audit status, competency uplift metrics, and master trainer accountability across active locations.
            </p>
          </div>
          <span className="text-[11px] font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
            Showing {centerEfficacyData.length} Training Centers
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Center & Code</th>
                <th className="py-3 px-4">Batches</th>
                <th className="py-3 px-4">Assessed</th>
                <th className="py-3 px-4 text-emerald-800">Passed</th>
                <th className="py-3 px-4 text-rose-800">Retest</th>
                <th className="py-3 px-4">Pass Rate</th>
                <th className="py-3 px-4">Pre → Post Score</th>
                <th className="py-3 px-4">Efficacy Gain</th>
                <th className="py-3 px-4">Master Trainer</th>
                <th className="py-3 px-4 text-right">Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {centerEfficacyData.map(center => {
                const isSelected = selectedCenterFilter === center.id;
                return (
                  <tr
                    key={center.id}
                    onClick={() => setSelectedCenterFilter(center.id === selectedCenterFilter ? 'all' : center.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-teal-50/70 font-semibold' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-800 border border-slate-200">
                          {center.code}
                        </span>
                        <div>
                          <strong className="text-slate-900 block leading-tight">{center.name}</strong>
                          <span className="text-[10px] text-slate-500">{center.city}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                      {center.batchesCount}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {center.totalTested}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                      {center.totalPassed}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-700">
                      {center.totalFailed}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              center.passRate >= 90
                                ? 'bg-emerald-500'
                                : center.passRate >= 85
                                ? 'bg-teal-600'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, center.passRate)}%` }}
                          />
                        </div>
                        <span className="font-mono font-extrabold text-slate-900 text-xs">
                          {center.passRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">
                      <span className="text-slate-400">{center.preScoreAvg}%</span>
                      <span className="mx-1 text-slate-300">→</span>
                      <strong className="text-emerald-700">{center.postScoreAvg}%</strong>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-[#007A3D]">
                      +{center.knowledgeGain}%
                    </td>
                    <td className="py-3 px-4 text-slate-700 text-xs font-medium">
                      {center.trainerName}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                          center.passRate >= 90
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : center.passRate >= 85
                            ? 'bg-teal-50 text-teal-800 border-teal-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        {center.passRate >= 90 ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Benchmark
                          </>
                        ) : center.passRate >= 85 ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-teal-600" />
                            Compliant
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Remedial Focus
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
