import React, { useState } from 'react';
import { X, Copy, Check, Share2, Smartphone } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface WhatsAppSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchId?: string;
}

export const WhatsAppSummaryModal: React.FC<WhatsAppSummaryModalProps> = ({
  isOpen,
  onClose,
  batchId
}) => {
  const { batches, candidates, consumables, activeCenter, currentPersona, showToast } = useApp();
  const [copied, setCopied] = useState(false);

  const selectedBatch = batches.find(b => b.id === batchId) || batches[0];
  const batchCandidates = candidates.filter(c => c.batchId === selectedBatch?.id);
  const centerConsumables = consumables.filter(c => c.centerId === activeCenter.id);

  if (!isOpen || !selectedBatch) return null;

  const presentCount = batchCandidates.filter(c => c.attendanceStatus === 'Present' || c.attendanceStatus === 'Late').length;
  const greenCount = batchCandidates.filter(c => c.status === 'Green Signal (Video Call)' || c.status === 'APM QC Passed' || c.status === 'Certified & Dispatched').length;
  const certifiedCount = batchCandidates.filter(c => c.status === 'Certified & Dispatched').length;

  const summaryText = `*━━━━━━━━━━━━━━━━━━━━━━━━*
*DB SKILLS - DAILY BATCH REPORT*
*━━━━━━━━━━━━━━━━━━━━━━━━*
📍 *Center:* ${activeCenter.name} (${activeCenter.code})
📅 *Date:* ${selectedBatch.date}
🆔 *Batch Code:* ${selectedBatch.batchCode}
👨‍🏫 *Trainer:* ${selectedBatch.trainerName}
📋 *OSE On-Duty:* ${currentPersona.name}

*📊 BATCH PERFORMANCE METRICS:*
• Target Capacity: ${selectedBatch.targetCount} drivers
• Candidates Enrolled: ${batchCandidates.length}
• Live Classroom Attendance: ${presentCount} / ${batchCandidates.length}
• PO Green Signals Issued: ${greenCount}
• Certified & Dispatched: ${certifiedCount}

*📋 CANDIDATE ROSTER SUMMARY:*
${batchCandidates.map((c, i) => `${i + 1}. *${c.fullName}*
   DL: ${c.dlNumber} (${c.vehicleClass})
   Status: ${c.status}
   Kit: ${c.kitIssued ? `Issued (Size ${c.tshirtSize || 'L'})` : 'Pending'}`).join('\n\n')}

*📦 CENTER STOCK HEALTH:*
${centerConsumables.map(cs => `• ${cs.itemType}: *${cs.quantityOnHand} ${cs.unit}* ${cs.quantityOnHand < cs.minimumThreshold ? '⚠️ LOW STOCK' : '✅'}`).join('\n')}

*━━━━━━━━━━━━━━━━━━━━━━━━*
_Generated automatically via DB Skills Enterprise Ops Portal_
_Time: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}_`;

  const handleCopy = () => {
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    showToast('WhatsApp batch summary copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    const encoded = encodeURIComponent(summaryText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10">
              <Share2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                1-Click WhatsApp Broadcast
              </span>
              <h3 className="text-lg font-bold">Standardized Daily Batch Summary</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-xs text-slate-500">
            This pre-formatted template formats the entire daily training enrollment, attendance,
            audit clearances, and consumable levels for easy distribution to Regional Groups.
          </p>

          <div className="relative">
            <pre className="p-4 bg-slate-900 text-emerald-300 font-mono text-xs rounded-xl overflow-x-auto whitespace-pre-wrap max-h-96 border border-slate-800 select-all leading-relaxed">
              {summaryText}
            </pre>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-400">Total lines: {summaryText.split('\n').length}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenWhatsApp}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Open WhatsApp Web
            </button>
            <button
              onClick={handleCopy}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-dbs-green text-white hover:bg-dbs-green-dark transition-colors shadow-md flex items-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied to Clipboard!' : 'Copy Formatted Text'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
