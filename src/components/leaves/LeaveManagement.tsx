import React, { useState } from 'react';
import {
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  User,
  ShieldCheck,
  Building,
  Search
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { LeaveType, LeaveRecord } from '../../types';

export const LeaveManagement: React.FC = () => {
  const {
    leaves,
    currentPersona,
    employees,
    centers,
    applyLeave,
    reviewLeave,
    showToast
  } = useApp();

  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<LeaveType>('Casual/Sick Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [compOffDate, setCompOffDate] = useState('');

  // Review modal
  const [selectedLeaveToReview, setSelectedLeaveToReview] = useState<LeaveRecord | null>(null);
  const [reviewAction, setReviewAction] = useState<'Approved' | 'Rejected'>('Approved');
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const currentEmp = employees.find(e => e.id === currentPersona.id) || employees[0];

  const currentUser = {
    ...currentPersona,
    designation: currentEmp?.designation || currentPersona.title,
    region: currentPersona.region || currentEmp?.region || centers.find(c => c.id === currentPersona.centerId)?.region || 'North'
  };

  // Map leaves to ensure applicant, routing, and regional metadata compatibility
  const leaveRequests = leaves.map(leave => {
    const center = centers.find(c => c.id === leave.centerId);
    return {
      ...leave,
      applicantId: leave.employeeId === currentPersona.id ? currentPersona.id : (leave.applicantId || leave.employeeId),
      applicantName: leave.applicantName || leave.employeeName,
      applicantRole: leave.applicantRole || leave.employeeRole,
      routingTarget: leave.routingTarget || leave.approverTarget,
      region: leave.region || center?.region || 'North'
    };
  });

  const visibleLeaves = leaveRequests.filter((leave) => {
    const userRole: string = currentUser?.role || currentUser?.designation || '';

    // Level 4 Staff (OSE / Trainer): Can ONLY view their own leave requests
    if (userRole === 'OSE' || userRole === 'Trainer') {
      return leave.applicantId === currentUser?.id || leave.applicantName === currentUser?.name;
    }

    // Level 3 Staff (Program Officer / PO): Can only view leaves from Level 4 field staff routed to PO for review
    if (userRole === 'Program Officer' || userRole === 'PO') {
      return leave.routingTarget === 'PO' || leave.applicantRole === 'OSE' || leave.applicantRole === 'Trainer';
    }

    // Regional Leadership & Executive (Senior Manager / GM): Can view regional field leaves and routed requests
    if (userRole === 'Senior Manager' || userRole === 'Assistant Program Manager' || userRole === 'APM') {
      return leave.region === currentUser?.region || leave.routingTarget === 'Senior Manager' || leave.routingTarget === 'APM' || currentUser?.role === 'Senior Manager';
    }

    // Executive Management (GM / CEO): Full national visibility
    return true;
  });

  // Filter leave records by applicant name or status
  const filteredLeaves = visibleLeaves.filter((leave) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const applicantName = (leave.applicantName || leave.employeeName || '').toLowerCase();
    const status = (leave.status || '').toLowerCase();
    return applicantName.includes(query) || status.includes(query);
  });

  // Routing logic check
  const isLevel4 = currentPersona.role === 'OSE' || currentPersona.role === 'Trainer';
  const approverRole = isLevel4 ? 'PO' : 'GM';

  // Calculate days between start and end date
  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 1;
  };

  const daysCount = calculateDays();

  // Pending leaves routed to current persona
  const pendingForCurrentReviewer = leaves.filter(l => {
    if (currentPersona.role === 'PO') {
      return l.status === 'Pending' && l.approverTarget === 'PO';
    }
    if (currentPersona.role === 'GM') {
      return l.status === 'Pending' && l.approverTarget === 'GM';
    }
    return false;
  });

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason.trim()) {
      showToast('Please fill all mandatory leave dates and reasons.');
      return;
    }

    if (leaveType === 'Compensatory Off (Comp Off)' && !compOffDate.trim()) {
      showToast('Please provide the weekend/duty date worked to claim Comp Off.');
      return;
    }

    const success = applyLeave({
      employeeId: currentPersona.id,
      employeeName: currentPersona.name,
      employeeRole: currentPersona.role,
      employeeLevel: currentPersona.level,
      centerId: currentPersona.centerId,
      centerName: currentPersona.centerName,
      leaveType,
      startDate,
      endDate,
      daysCount,
      reason,
      compOffWorkDate: leaveType === 'Compensatory Off (Comp Off)' ? compOffDate : undefined
    });

    if (success) {
      setIsApplyOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
      setCompOffDate('');
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeaveToReview) return;
    reviewLeave(selectedLeaveToReview.id, reviewAction, reviewRemarks);
    setSelectedLeaveToReview(null);
    setReviewRemarks('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quota Policy Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-teal-800">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
                HR Governance & Leaves
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-mono">DB Skills Rules Engine</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Multi-Tier Leave Management & Comp-Off Ledger
            </h3>
          </div>
        </div>

        <button
          onClick={() => setIsApplyOpen(true)}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-dbs-green text-white hover:bg-dbs-green-dark transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <Send className="w-4 h-4 text-dbs-growth-light" />
          Submit Leave / Comp-Off Application
        </button>
      </div>

      {/* Quota & Policy Rule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Casual/Sick Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400 font-mono block mb-1">
              Annual Quota Balance
            </span>
            <h4 className="text-base font-bold text-slate-900">Casual / Sick Leaves (CL/SL)</h4>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-teal-900 font-mono">
                {currentEmp.casualLeaveBalance}
              </span>
              <span className="text-xs text-slate-500 font-medium">days remaining of 12</span>
            </div>
            <div className="mt-3 p-2.5 rounded-xl bg-teal-50/70 border border-teal-200/80 text-[11px] text-teal-900 leading-relaxed">
              <strong>Policy Cap:</strong> Max 3 days allowed per calendar month. Eligible after 3 months of tenure (Current tenure: {currentEmp.tenureMonths} mos).
            </div>
          </div>
        </div>

        {/* Comp Off Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400 font-mono block mb-1">
              Weekend / Travel Credits
            </span>
            <h4 className="text-base font-bold text-slate-900">Compensatory Offs (Comp Off)</h4>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-extrabold text-emerald-700 font-mono">
                {currentEmp.compOffBalance}
              </span>
              <span className="text-xs text-slate-500 font-medium">days earned on duty</span>
            </div>
            <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-900 leading-relaxed">
              <strong>Rules:</strong> Earned for emergency Sunday/holiday training batches or official travel tours. Cannot be clubbed with regular leaves.
            </div>
          </div>
        </div>

        {/* Multi-Tier Routing Rules */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase text-slate-400 font-mono block mb-1">
              Hierarchical Routing
            </span>
            <h4 className="text-base font-bold text-slate-900">Approval Authority Matrix</h4>
            <div className="space-y-2 mt-2.5 text-xs">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span>OSE & Trainers (Level 4)</span>
                <span className="font-bold text-teal-800">→ Program Officer (PO)</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span>PO, RMT & APM (Level 3)</span>
                <span className="font-bold text-teal-800">→ Senior Manager / GM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviewer Action Queue (if PO or GM) */}
      {(currentPersona.role === 'PO' || currentPersona.role === 'GM') && (
        <div className="bg-amber-50/50 border border-amber-300 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-700" />
              <h4 className="text-sm font-bold text-amber-950">
                Action Required: Pending Leave Approvals Routed to You ({pendingForCurrentReviewer.length})
              </h4>
            </div>
            <span className="text-xs font-semibold text-amber-800">
              Authority Role: {currentPersona.role}
            </span>
          </div>

          {pendingForCurrentReviewer.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No pending leave applications in your review queue.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingForCurrentReviewer.map(l => (
                <div
                  key={l.id}
                  className="bg-white border border-amber-200 rounded-xl p-4 shadow-xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{l.employeeName}</p>
                      <p className="text-[11px] text-slate-500">
                        {l.employeeRole} • {l.centerName}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      {l.leaveType}
                    </span>
                  </div>

                  <div className="p-2 rounded bg-slate-50 border border-slate-200 text-[11px] space-y-0.5">
                    <p className="font-semibold text-slate-800">
                      Dates: {l.startDate} to {l.endDate} ({l.daysCount} days)
                    </p>
                    <p className="text-slate-600">Reason: "{l.reason}"</p>
                    {l.compOffWorkDate && (
                      <p className="text-emerald-700 font-medium">Worked Duty: {l.compOffWorkDate}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => {
                        setSelectedLeaveToReview(l);
                        setReviewAction('Rejected');
                      }}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setSelectedLeaveToReview(l);
                        setReviewAction('Approved');
                      }}
                      className="px-3.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 shadow-xs"
                    >
                      Approve Leave
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* All Leaves Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900">National Leaves & Comp-Off Records Log</h4>
            <p className="text-[11px] text-slate-500">
              Showing {filteredLeaves.length} of {visibleLeaves.length} records in role scope
            </p>
          </div>

          {/* Search bar: Filter by applicant name or status */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by applicant name or status..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-dbs-green/20 focus:border-dbs-green transition-all text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1.5 py-0.5 rounded-full hover:bg-slate-200 transition-colors"
                title="Clear search"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Dates & Duration</th>
                <th className="py-3 px-4">Reason / Duty Proof</th>
                <th className="py-3 px-4">Routing Target</th>
                <th className="py-3 px-4">Status & Reviewer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                    {searchQuery
                      ? `No leave records matching "${searchQuery}".`
                      : 'No leave or comp-off records found in your role scope.'}
                  </td>
                </tr>
              ) : (
                filteredLeaves.map(leave => (
                  <tr key={leave.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{leave.employeeName}</p>
                    <p className="text-[11px] text-slate-500">
                      {leave.employeeRole} ({leave.employeeLevel})
                    </p>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">{leave.leaveType}</td>
                  <td className="py-3 px-4">
                    <p className="font-mono text-slate-800 font-medium">
                      {leave.startDate} to {leave.endDate}
                    </p>
                    <p className="text-[10px] text-slate-500">{leave.daysCount} Day(s)</p>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <p className="text-slate-700 truncate">{leave.reason}</p>
                    {leave.compOffWorkDate && (
                      <p className="text-[10px] text-emerald-700 font-mono">
                        Duty: {leave.compOffWorkDate}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      Routed to {leave.approverTarget}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          leave.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : leave.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {leave.status}
                      </span>
                      {leave.reviewedBy && (
                        <p className="text-[10px] text-slate-500">
                          By: {leave.reviewedBy}
                        </p>
                      )}
                      {leave.reviewRemarks && (
                        <p className="text-[10px] text-slate-400 italic">"{leave.reviewRemarks}"</p>
                      )}
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Apply Leave */}
      {isApplyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden text-slate-800">
            <div className="bg-gradient-to-r from-dbs-green-dark to-dbs-green text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-dbs-growth-light" />
                Submit Leave / Comp-Off Application
              </h3>
              <button
                onClick={() => setIsApplyOpen(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApply} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Leave Category</label>
                <select
                  value={leaveType}
                  onChange={e => setLeaveType(e.target.value as LeaveType)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Casual/Sick Leave">Casual / Sick Leave (Max 3 days/month)</option>
                  <option value="Compensatory Off (Comp Off)">Compensatory Off (Comp Off for weekend/travel)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-500">Total Requested Duration:</span>
                <span className="font-bold text-slate-900 font-mono">{daysCount} Day(s)</span>
              </div>

              {leaveType === 'Compensatory Off (Comp Off)' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Duty Date Worked (Sunday / Holiday / Tour) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2026-09-13 (Sunday Special Batch for Logistics Fleet)"
                    value={compOffDate}
                    onChange={e => setCompOffDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Detailed Reason</label>
                <textarea
                  required
                  rows={3}
                  placeholder="State clear official or personal justification..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-teal-600"
                />
              </div>

              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-[11px] text-teal-900">
                <strong>Automatic Approval Routing:</strong> As {currentPersona.name} ({currentPersona.role} - {currentPersona.level}),
                your application will be forwarded to the <strong>{approverRole}</strong> dashboard.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsApplyOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-800 text-white font-bold hover:bg-teal-900"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Review Leave */}
      {selectedLeaveToReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden text-slate-800">
            <div className="bg-gradient-to-r from-dbs-green-dark to-dbs-green text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">Review Leave Application</h3>
              <button
                onClick={() => setSelectedLeaveToReview(null)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">{selectedLeaveToReview.employeeName}</p>
                <p className="text-slate-500">
                  {selectedLeaveToReview.leaveType}: {selectedLeaveToReview.startDate} to {selectedLeaveToReview.endDate} ({selectedLeaveToReview.daysCount} days)
                </p>
                <p className="text-slate-700 italic">"{selectedLeaveToReview.reason}"</p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Decision</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-700">
                    <input
                      type="radio"
                      name="decision"
                      checked={reviewAction === 'Approved'}
                      onChange={() => setReviewAction('Approved')}
                    />
                    Approve Leave
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700">
                    <input
                      type="radio"
                      name="decision"
                      checked={reviewAction === 'Rejected'}
                      onChange={() => setReviewAction('Rejected')}
                    />
                    Reject Leave
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reviewer Remarks</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verified against training batch log. Approved."
                  value={reviewRemarks}
                  onChange={e => setReviewRemarks(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedLeaveToReview(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-bold ${
                    reviewAction === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirm {reviewAction}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
