import React, { useState } from 'react';
import {
  X,
  History,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  AlertTriangle,
  CreditCard,
  Copy,
  Check,
  Building2,
  Calendar,
  Send,
  UserCheck,
  FileCheck2
} from 'lucide-react';
import { ExpenseClaim, ExpenseAuditLog } from '../../types';
import { generateDefaultAuditTrail } from '../../context/AppContext';

interface ExpenseAuditTrailModalProps {
  claim: ExpenseClaim | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExpenseAuditTrailModal: React.FC<ExpenseAuditTrailModalProps> = ({
  claim,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !claim) return null;

  const logs: ExpenseAuditLog[] = (claim.auditTrail && claim.auditTrail.length > 0)
    ? claim.auditTrail
    : generateDefaultAuditTrail(claim);

  const getStageMeta = (stage: string) => {
    switch (stage) {
      case 'Submitted':
        return {
          icon: <Send className="w-4 h-4 text-sky-600" />,
          bgColor: 'bg-sky-50 border-sky-200',
          badgeColor: 'bg-sky-100 text-sky-900 border-sky-300',
          dotColor: 'bg-sky-500'
        };
      case 'SM Verified':
        return {
          icon: <UserCheck className="w-4 h-4 text-amber-700" />,
          bgColor: 'bg-amber-50 border-amber-200',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
          dotColor: 'bg-amber-500'
        };
      case 'GM Sanctioned':
        return {
          icon: <FileCheck2 className="w-4 h-4 text-emerald-700" />,
          bgColor: 'bg-emerald-50 border-emerald-200',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          dotColor: 'bg-emerald-500'
        };
      case 'Disbursed / Settled':
        return {
          icon: <CreditCard className="w-4 h-4 text-teal-700" />,
          bgColor: 'bg-teal-50 border-teal-200',
          badgeColor: 'bg-teal-100 text-teal-900 border-teal-300',
          dotColor: 'bg-teal-600'
        };
      case 'Returned for Correction':
      case 'Rejected':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
          bgColor: 'bg-rose-50 border-rose-200',
          badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
          dotColor: 'bg-rose-500'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4 text-slate-600" />,
          bgColor: 'bg-slate-50 border-slate-200',
          badgeColor: 'bg-slate-100 text-slate-900 border-slate-300',
          dotColor: 'bg-slate-400'
        };
    }
  };

  const handleCopyAuditJson = () => {
    const jsonStr = JSON.stringify(logs, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                  Expense Claim Audit Trail & Lifecycle Log
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                  Immutable Record
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official timestamped log of submissions, SM physical verification, GM financial sanctions & bank disbursement.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Claim Summary Card */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Claim Number</span>
              <span className="font-mono font-bold text-teal-800">{claim.claimNumber || claim.claimRef}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Claimant</span>
              <span className="font-bold text-slate-900 truncate block">
                {claim.employeeName || claim.claimantName}
              </span>
              <span className="text-[10px] text-slate-500">{claim.employeeRole || claim.claimantRole}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Amount Claimed / Sanctioned</span>
              <div className="flex items-center gap-1 font-mono font-extrabold text-xs text-slate-900">
                <span>₹{claim.totalClaimed.toLocaleString()}</span>
                {claim.totalApproved ? (
                  <span className="text-emerald-700">/ ₹{claim.totalApproved.toLocaleString()}</span>
                ) : null}
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Current Status</span>
              <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 truncate max-w-full">
                {claim.status}
              </span>
            </div>
          </div>
          {claim.tourSanctionNumber && (
            <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-600">
              <span className="flex items-center gap-1 font-mono text-slate-500">
                <FileText className="w-3.5 h-3.5 text-teal-700" />
                TSO Order: <strong className="text-slate-700">{claim.tourSanctionNumber}</strong>
              </span>
              {claim.bankReferenceNumber && (
                <span className="font-mono text-teal-800 font-semibold">
                  NEFT UTR: {claim.bankReferenceNumber}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Audit Timeline Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {logs.map((log, idx) => {
              const meta = getStageMeta(log.stage);
              const isLast = idx === logs.length - 1;

              return (
                <div key={log.id || idx} className="relative group">
                  {/* Timeline Node Bullet */}
                  <div
                    className={`absolute -left-6 top-1 w-6 h-6 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${meta.bgColor} z-10`}
                  >
                    <div className={`w-2 h-2 rounded-full ${meta.dotColor}`} />
                  </div>

                  {/* Card Event Content */}
                  <div className={`p-4 rounded-xl border ${meta.bgColor} transition-shadow hover:shadow-xs space-y-2`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${meta.badgeColor}`}>
                          {log.stage}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                          {log.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono shrink-0">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{log.timestamp}</span>
                      </div>
                    </div>

                    {/* Actor Identity & Role */}
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <span className="font-semibold text-slate-900">{log.actionBy}</span>
                      <span className="text-slate-400">•</span>
                      <span className="px-1.5 py-0.5 rounded-sm bg-white/80 border border-slate-200/80 text-[10px] font-mono text-slate-600">
                        {log.role}
                      </span>
                      {log.amount !== undefined && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="font-mono font-bold text-emerald-700">
                            ₹{log.amount.toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Remarks / Narrative */}
                    {log.remarks && (
                      <div className="bg-white/80 border border-slate-200/80 p-2.5 rounded-lg text-xs text-slate-700 italic leading-relaxed">
                        &ldquo;{log.remarks}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pending Next Action Prompt if not yet Settled */}
          {claim.status === 'Pending Senior Manager Review' && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-dashed border-amber-300 text-xs text-amber-900 flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Awaiting SM Tour Physical Verification</strong>
                <span>Senior Manager will inspect attached tickets, GST hotel vouchers, and physical tour delivery before forwarding to GM for financial sanction.</span>
              </div>
            </div>
          )}

          {claim.status === 'Pending GM Review' && (
            <div className="p-3.5 rounded-xl bg-sky-50/70 border border-dashed border-sky-300 text-xs text-sky-900 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">SM Verified — Awaiting GM Sanction</strong>
                <span>Verified by Senior Manager. Pending General Manager (GM) financial authorization for disbursement.</span>
              </div>
            </div>
          )}

          {claim.status === 'Approved by GM - Ready for Bank Disbursement' && (
            <div className="p-3.5 rounded-xl bg-teal-50/70 border border-dashed border-teal-300 text-xs text-teal-900 flex items-start gap-2.5">
              <CreditCard className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Sanctioned by GM — Ready for NEFT Disbursement</strong>
                <span>GM has sanctioned the claim. Accounts department can enter the NEFT bank transfer reference to settle this reimbursement.</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleCopyAuditJson}
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy audit log to clipboard as compliance JSON"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? 'Copied Audit Log' : 'Copy JSON Audit Log'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};
