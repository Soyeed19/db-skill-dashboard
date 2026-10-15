import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp,
  Award,
  Users,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  LineChart as LineChartIcon,
  Layers,
  ArrowUpRight,
  Info,
  ShieldCheck,
  Building
} from 'lucide-react';
import { Center, Candidate } from '../../types';

interface CenterEnrollmentTrendsChartProps {
  activeCenter: Center;
  centerCandidates: Candidate[];
  className?: string;
}

interface MonthlyDataPoint {
  month: string;
  monthShort: string;
  year: number;
  target: number;
  enrolled: number;
  certified: number;
  queriesRaised: number;
  achievementRate: number;
  lmv: number;
  trans: number;
  hmv: number;
  hgmv: number;
  threeWheeler: number;
}

// Helper to extract year-month key ('YYYY-MM') from candidate record
function getCandidateMonthKey(c: Candidate): string {
  const raw = c.enrolledAt || (c as any).created_at || (c as any).createdAt || c.trainingDate;
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export const CenterEnrollmentTrendsChart: React.FC<CenterEnrollmentTrendsChartProps> = ({
  activeCenter,
  centerCandidates,
  className = ''
}) => {
  const [chartViewMode, setChartViewMode] = useState<'area' | 'bar' | 'achievement'>('area');
  const [timeRange, setTimeRange] = useState<'6m' | '3m'>('6m');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Month buckets for the last 6 months (chronological order)
  const monthBuckets = useMemo(() => {
    const now = new Date();
    let refYear = now.getFullYear();
    let refMonth = now.getMonth();
    // Default to at least 2026 if system runtime clock is 2026
    if (refYear < 2026) {
      refYear = 2026;
      refMonth = 8; // September
    }

    const list: Array<{ key: string; name: string; short: string; year: number; monthIndex: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(refYear, refMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      const name = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
      const short = d.toLocaleString('en-IN', { month: 'short' });
      list.push({ key, name, short, year: y, monthIndex: m });
    }
    return list;
  }, []);

  // Dynamically aggregate real candidates from connected Supabase table by timestamp
  const trendData = useMemo<MonthlyDataPoint[]>(() => {
    const baseTarget = activeCenter.code === 'DL-02' ? 650 : 600;

    const data: MonthlyDataPoint[] = monthBuckets.map((m, idx) => {
      const isCurrentMonth = idx === monthBuckets.length - 1;
      const target = baseTarget;

      // Filter real candidate dossiers strictly belonging to this center and matching this month bucket
      const monthCandidates = centerCandidates.filter(c => {
        const key = getCandidateMonthKey(c);
        if (key) {
          return key === m.key;
        }
        // If candidate date is unparsable, only place into the current month bucket
        return isCurrentMonth;
      });

      const enrolled = monthCandidates.length;
      const certified = monthCandidates.filter(c => c.status === 'Certified & Dispatched').length;
      const queries = monthCandidates.filter(c => c.queries && c.queries.some(q => q.status === 'Open')).length;
      const achievementRate = target > 0 ? Math.round((enrolled / target) * 100) : 0;

      const trans = monthCandidates.filter(c => c.vehicleClass === 'TRANS').length;
      const hmv = monthCandidates.filter(c => c.vehicleClass === 'HMV').length;
      const lmv = monthCandidates.filter(c => c.vehicleClass === 'LMV-TR').length;
      const hgmv = monthCandidates.filter(c => c.vehicleClass === 'HGMV').length;
      const threeWheeler = monthCandidates.filter(c => c.vehicleClass === '3W-CAB').length;

      return {
        month: m.name,
        monthShort: m.short,
        year: m.year,
        target,
        enrolled,
        certified,
        queriesRaised: queries,
        achievementRate,
        trans,
        hmv,
        lmv,
        hgmv,
        threeWheeler
      };
    });

    return timeRange === '3m' ? data.slice(-3) : data;
  }, [activeCenter.code, centerCandidates, monthBuckets, timeRange]);

  // Aggregate stats across the visible period
  const totalEnrolled = useMemo(() => trendData.reduce((acc, d) => acc + d.enrolled, 0), [trendData]);
  const totalTarget = useMemo(() => trendData.reduce((acc, d) => acc + d.target, 0), [trendData]);
  const totalCertified = useMemo(() => trendData.reduce((acc, d) => acc + d.certified, 0), [trendData]);
  const avgMonthlyEnrolled = useMemo(() => Math.round(totalEnrolled / trendData.length), [totalEnrolled, trendData]);
  const overallCertificationRate = useMemo(
    () => (totalEnrolled > 0 ? ((totalCertified / totalEnrolled) * 100).toFixed(1) : '0'),
    [totalCertified, totalEnrolled]
  );
  const overallTargetAchievement = useMemo(
    () => (totalTarget > 0 ? Math.round((totalEnrolled / totalTarget) * 100) : 0),
    [totalEnrolled, totalTarget]
  );

  // Month-over-month growth for the latest completed month (August vs July)
  const momGrowth = useMemo(() => {
    if (trendData.length < 2) return 0;
    const prev = trendData[trendData.length - 2].enrolled;
    const curr = trendData[trendData.length - 1].enrolled;
    if (prev === 0) return 0;
    return (((curr - prev) / prev) * 100).toFixed(1);
  }, [trendData]);

  // Custom Recharts Tooltip
  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload as MonthlyDataPoint;
    if (!data) return null;

    const variance = data.enrolled - data.target;
    const varianceColor = variance >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold';

    return (
      <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200/80 shadow-xl text-xs space-y-2 min-w-[220px]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <span>{data.month}</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              data.achievementRate >= 100
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {data.achievementRate}% Target
          </span>
        </div>

        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-600 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#007A3D]"></span>
              Enrolled Drivers:
            </span>
            <span className="font-extrabold text-slate-900">{data.enrolled.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Certified & Dispatched:
            </span>
            <span className="font-bold text-emerald-800">{data.certified.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-600 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Monthly Target:
            </span>
            <span className="font-semibold text-slate-700">{data.target.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-[11px]">
            <span className="text-slate-500">Target Variance:</span>
            <span className={varianceColor}>
              {variance >= 0 ? `+${variance}` : variance} ({variance >= 0 ? 'Surplus' : 'Deficit'})
            </span>
          </div>
        </div>

        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-[10px] text-slate-600 space-y-1">
          <div className="font-semibold text-slate-700">Commercial Class Distribution:</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            <span>TRANS: <strong className="text-slate-800">{data.trans}</strong></span>
            <span>HMV: <strong className="text-slate-800">{data.hmv}</strong></span>
            <span>LMV-TR: <strong className="text-slate-800">{data.lmv}</strong></span>
            <span>HGMV/3W: <strong className="text-slate-800">{data.hgmv + data.threeWheeler}</strong></span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Center Enrollment Trends (Last 6 Months)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-900 border border-teal-300">
                  {activeCenter.code} Lockdown
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Monthly trainee intake, target achievement trajectory & certification yields for{' '}
                <strong className="text-teal-900">{activeCenter.name}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setChartViewMode('area')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                chartViewMode === 'area'
                  ? 'bg-white text-teal-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-teal-700" />
              <span>Trend Area</span>
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('bar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                chartViewMode === 'bar'
                  ? 'bg-white text-teal-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-teal-700" />
              <span>Target vs Actual</span>
            </button>
            <button
              type="button"
              onClick={() => setChartViewMode('achievement')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                chartViewMode === 'achievement'
                  ? 'bg-white text-teal-900 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5 text-emerald-700" />
              <span>Achievement %</span>
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60 text-xs font-bold">
            <button
              type="button"
              onClick={() => setTimeRange('6m')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                timeRange === '6m' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              6 Months
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('3m')}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                timeRange === '3m' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3 Months
            </button>
          </div>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            title={isExpanded ? 'Minimize chart' : 'Expand chart'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 mt-4">
          {/* Key Metric Highlights Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                {timeRange === '6m' ? '6-Month' : '3-Month'} Intake Total
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-extrabold text-teal-950">{totalEnrolled.toLocaleString()}</span>
                <span className="text-xs font-bold text-teal-700">Drivers</span>
              </div>
              <span className="text-[10px] text-teal-800 font-medium">
                {overallTargetAchievement}% of aggregate target
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                Average Monthly Run-Rate
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-extrabold text-emerald-950">{avgMonthlyEnrolled}</span>
                <span className="text-xs font-bold text-emerald-700">/ mo</span>
              </div>
              <span className="text-[10px] text-emerald-800 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Target: {activeCenter.code === 'DL-02' ? '650' : '600'} / mo
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
                Certification Yield
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-extrabold text-slate-900">{overallCertificationRate}%</span>
                <span className="text-xs font-bold text-slate-600">Passed</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                {totalCertified.toLocaleString()} of {totalEnrolled.toLocaleString()} completed
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                {trendData[trendData.length - 1]?.monthShort || 'Current Month'} Live Trainees
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-extrabold text-amber-950">
                  {trendData[trendData.length - 1]?.enrolled || 0}
                </span>
                <span className="text-xs font-bold text-amber-700">Enrolled</span>
              </div>
              <span className="text-[10px] text-amber-800 font-medium">
                {centerCandidates.length === 0 ? '0 live dossier registrations' : `Includes ${centerCandidates.length} live dossier registrations`}
              </span>
            </div>
          </div>

          {/* Zero-State Real-Time Notification */}
          {centerCandidates.length === 0 && (
            <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <Info className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                <strong>Connected Supabase Cloud Database:</strong> Zero candidate dossiers currently registered for <strong>{activeCenter.name}</strong>. All metric cards accurately reflect real-time zero-state.
              </span>
            </div>
          )}

          {/* Recharts Canvas */}
          <div className="w-full h-72 sm:h-80 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              {chartViewMode === 'area' ? (
                <ComposedChart data={trendData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEnrolled" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#007A3D" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#007A3D" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="colorCertified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#62B548" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#62B548" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="monthShort"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 'dataMax + 100']}
                  />
                  <Tooltip content={renderCustomTooltip} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: 12, fontSize: 11, fontWeight: 600 }}
                  />
                  {/* Monthly Sanctioned Target Reference Line */}
                  <Line
                    type="monotone"
                    dataKey="target"
                    name="Target Capacity"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 3, fill: '#f59e0b' }}
                  />
                  {/* Actual Enrolled Area */}
                  <Area
                    type="monotone"
                    dataKey="enrolled"
                    name="Enrolled Drivers"
                    stroke="#007A3D"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorEnrolled)"
                  />
                  {/* Certified Drivers Area */}
                  <Area
                    type="monotone"
                    dataKey="certified"
                    name="Certified & Dispatched"
                    stroke="#62B548"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCertified)"
                  />
                </ComposedChart>
              ) : chartViewMode === 'bar' ? (
                <ComposedChart data={trendData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="monthShort"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 'dataMax + 100']}
                  />
                  <Tooltip content={renderCustomTooltip} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="rect"
                    wrapperStyle={{ paddingBottom: 12, fontSize: 11, fontWeight: 600 }}
                  />
                  <Bar dataKey="target" name="Monthly Target" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="enrolled" name="Enrolled Drivers" fill="#007A3D" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar
                    dataKey="certified"
                    name="Certified Drivers"
                    fill="#62B548"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                  />
                </ComposedChart>
              ) : (
                <ComposedChart data={trendData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="monthShort"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[60, 120]}
                    unit="%"
                  />
                  <Tooltip content={renderCustomTooltip} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="line"
                    wrapperStyle={{ paddingBottom: 12, fontSize: 11, fontWeight: 600 }}
                  />
                  <ReferenceLine
                    y={100}
                    stroke="#62B548"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{ value: '100% Target Benchmark', fill: '#007A3D', fontSize: 10, position: 'top' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="achievementRate"
                    name="Target Fulfillment %"
                    stroke="#007A3D"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#007A3D', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Footer Diagnostic Note */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>
                Data source: Center Batch Registers & ERP Ingestion Pipe ({activeCenter.code}).
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Vehicle Classes:</span>
              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                TRANS (Commercial Bus/Truck)
              </span>
              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                HMV & HGMV
              </span>
              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                LMV-TR (Commercial Cab)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
