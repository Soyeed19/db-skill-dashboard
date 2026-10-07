import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  Building,
  CheckCircle2,
  Clock,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ConsumableType } from '../../types';

export const InventoryManagement: React.FC = () => {
  const {
    consumables,
    transactions,
    activeCenter,
    currentPersona,
    addIncomingStock,
    issueStockToBatch,
    batches,
    showToast
  } = useApp();

  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // Inward Form State
  const [inwardItemType, setInwardItemType] = useState<ConsumableType>('Certificates');
  const [inwardQty, setInwardQty] = useState<number>(50);
  const [challanNo, setChallanNo] = useState<string>(`CH-HQ-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [challanNotes, setChallanNotes] = useState<string>('Dispatched via BlueDart cargo from Jaipur print depot');
  const [sizeM, setSizeM] = useState<number>(10);
  const [sizeL, setSizeL] = useState<number>(20);
  const [sizeXL, setSizeXL] = useState<number>(15);
  const [sizeXXL, setSizeXXL] = useState<number>(5);

  // Issue Form State
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || '');
  const [issueQtyCert, setIssueQtyCert] = useState<number>(25);
  const [issueQtyBags, setIssueQtyBags] = useState<number>(25);
  const [issueQtyBlankets, setIssueQtyBlankets] = useState<number>(25);
  const [issueQtyCaps, setIssueQtyCaps] = useState<number>(25);
  const [issueQtyTshirts, setIssueQtyTshirts] = useState<number>(25);

  const centerConsumables = consumables.filter(c => c.centerId === activeCenter.id);
  const centerTransactions = transactions.filter(t => t.centerId === activeCenter.id);

  // Low stock check
  const lowStockItems = centerConsumables.filter(c => c.quantityOnHand < c.minimumThreshold);

  const handleInwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inwardQty <= 0) return;

    const sizes =
      inwardItemType === 'T-Shirts'
        ? { M: sizeM, L: sizeL, XL: sizeXL, XXL: sizeXXL }
        : undefined;

    addIncomingStock(
      activeCenter.id,
      inwardItemType,
      inwardItemType === 'T-Shirts' ? sizeM + sizeL + sizeXL + sizeXXL : inwardQty,
      challanNo,
      challanNotes,
      sizes
    );

    setIsInwardModalOpen(false);
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    issueStockToBatch(activeCenter.id, selectedBatchId, {
      Certificates: issueQtyCert,
      Bags: issueQtyBags,
      Blankets: issueQtyBlankets,
      Caps: issueQtyCaps,
      'T-Shirts': issueQtyTshirts
    });
    setIsIssueModalOpen(false);
  };

  // 1-Click CSV / Excel Export
  const handleExportCsv = () => {
    const headers = ['Item Type', 'Item Name', 'Quantity On Hand', 'Min Threshold', 'Unit', 'Stock Status', 'Last Updated'];
    const rows = centerConsumables.map(c => [
      c.itemType,
      `"${c.itemName}"`,
      c.quantityOnHand,
      c.minimumThreshold,
      c.unit,
      c.quantityOnHand < c.minimumThreshold ? 'LOW STOCK' : 'ADEQUATE',
      c.lastUpdated
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [`DB SKILLS CONSUMABLE INVENTORY - ${activeCenter.name}`, `Date: ${new Date().toLocaleDateString()}`]
        .concat([headers.join(',')])
        .concat(rows.map(r => r.join(',')))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DB_Skills_Stock_${activeCenter.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Consumable stock report exported as CSV!');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Low Stock Alert */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-teal-800">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
                Consumables & Central Inventory
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-mono">{activeCenter.name}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Center Material Logistics (Replaces WhatsApp Excel)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportCsv}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            1-Click Excel/CSV Export
          </button>

          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
          >
            <MinusCircle className="w-4 h-4 text-amber-700" />
            Issue to Batch
          </button>

          <button
            onClick={() => setIsInwardModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-xl bg-dbs-green text-white hover:bg-dbs-green-dark transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-emerald-300" />
            Receive Inward Stock (Challan)
          </button>
        </div>
      </div>

      {/* Low Stock Warning Alert if any item below threshold */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-300 rounded-2xl p-4 flex items-center gap-3.5 text-rose-900 shadow-xs">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
          <div className="flex-1 text-xs">
            <h5 className="font-bold text-sm text-rose-950">
              Immediate Reorder Required: {lowStockItems.length} Consumable Item(s) Below Minimum Threshold!
            </h5>
            <p className="text-rose-700 mt-0.5">
              The following supplies at {activeCenter.name} are critically low: {' '}
              {lowStockItems.map(item => `${item.itemType} (${item.quantityOnHand} ${item.unit} remaining, Min: ${item.minimumThreshold})`).join(', ')}.
              Please request a head office dispatch note.
            </p>
          </div>
        </div>
      )}

      {/* 5 Core Consumable Item Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {centerConsumables.map(item => {
          const isLow = item.quantityOnHand < item.minimumThreshold;
          return (
            <div
              key={item.id}
              className={`bg-white border rounded-2xl p-4 shadow-xs flex flex-col justify-between transition-all ${
                isLow ? 'border-rose-300 bg-rose-50/20 ring-1 ring-rose-200' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    {item.itemType}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isLow
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {isLow ? 'LOW STOCK' : 'IN STOCK'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-800 line-clamp-1 mb-1">
                  {item.itemName}
                </h4>

                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    {item.quantityOnHand}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{item.unit}</span>
                </div>

                <div className="mt-2 text-[11px] text-slate-500 flex justify-between">
                  <span>Min Buffer: {item.minimumThreshold}</span>
                  <span>Updated: {item.lastUpdated}</span>
                </div>

                {/* Size breakdown for T-shirts */}
                {item.sizeBreakdown && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1.5">
                      Sizes in Stock:
                    </span>
                    <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px]">
                      <div className="bg-slate-50 p-1 rounded border border-slate-200">
                        <span className="text-slate-400 block">M</span>
                        <span className="font-bold text-slate-800">{item.sizeBreakdown.M}</span>
                      </div>
                      <div className="bg-slate-50 p-1 rounded border border-slate-200">
                        <span className="text-slate-400 block">L</span>
                        <span className="font-bold text-slate-800">{item.sizeBreakdown.L}</span>
                      </div>
                      <div className="bg-slate-50 p-1 rounded border border-slate-200">
                        <span className="text-slate-400 block">XL</span>
                        <span className="font-bold text-slate-800">{item.sizeBreakdown.XL}</span>
                      </div>
                      <div className="bg-slate-50 p-1 rounded border border-slate-200">
                        <span className="text-slate-400 block">XXL</span>
                        <span className="font-bold text-slate-800">{item.sizeBreakdown.XXL}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stock Transaction Ledger */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-700" />
            <h4 className="text-sm font-bold text-slate-900">
              Audit Stock Ledger & Challan History (Inward / Outward)
            </h4>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {centerTransactions.length} Recorded Movements
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Consumable Item</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Ref # / Challan</th>
                <th className="py-3 px-4">Logged By</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {centerTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono text-slate-600">{tx.date}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.transactionType === 'INWARD_CHALLAN'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tx.transactionType === 'INWARD_CHALLAN' ? (
                        <>
                          <ArrowDownLeft className="w-3 h-3" /> Inward Challan
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-3 h-3" /> Batch Issue
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">{tx.itemType}</td>
                  <td className="py-3 px-4 font-bold font-mono">
                    <span
                      className={
                        tx.transactionType === 'INWARD_CHALLAN'
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }
                    >
                      {tx.transactionType === 'INWARD_CHALLAN' ? `+${tx.quantity}` : `-${tx.quantity}`}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-teal-800 font-semibold">
                    {tx.referenceNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-600">{tx.performedBy}</td>
                  <td className="py-3 px-4 text-slate-500 italic">{tx.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Incoming Stock (Challan) */}
      {isInwardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden text-slate-800">
            <div className="bg-gradient-to-r from-dbs-green-dark to-dbs-green text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-dbs-growth-light" />
                Receive Incoming Stock (Head Office Challan)
              </h3>
              <button
                onClick={() => setIsInwardModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                <AlertTriangle className="sr-only" /> ✕
              </button>
            </div>

            <form onSubmit={handleInwardSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Challan / Dispatch Note #</label>
                <input
                  type="text"
                  required
                  value={challanNo}
                  onChange={e => setChallanNo(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300 focus:outline-teal-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Consumable Item</label>
                <select
                  value={inwardItemType}
                  onChange={e => setInwardItemType(e.target.value as ConsumableType)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="Certificates">Certificates (Printed sheets with border)</option>
                  <option value="Bags">Bags (Driver kit backpacks)</option>
                  <option value="Blankets">Blankets (Cabin fleece)</option>
                  <option value="Caps">Caps (Embroidered safety caps)</option>
                  <option value="T-Shirts">T-Shirts (Size breakdown required)</option>
                </select>
              </div>

              {inwardItemType === 'T-Shirts' ? (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Size Breakdown Quantities</label>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Size M</span>
                      <input
                        type="number"
                        min={0}
                        value={sizeM}
                        onChange={e => setSizeM(Number(e.target.value))}
                        className="w-full p-2 border rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Size L</span>
                      <input
                        type="number"
                        min={0}
                        value={sizeL}
                        onChange={e => setSizeL(Number(e.target.value))}
                        className="w-full p-2 border rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Size XL</span>
                      <input
                        type="number"
                        min={0}
                        value={sizeXL}
                        onChange={e => setSizeXL(Number(e.target.value))}
                        className="w-full p-2 border rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Size XXL</span>
                      <input
                        type="number"
                        min={0}
                        value={sizeXXL}
                        onChange={e => setSizeXXL(Number(e.target.value))}
                        className="w-full p-2 border rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Total T-Shirts: {sizeM + sizeL + sizeXL + sizeXXL} Units
                  </p>
                </div>
              ) : (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Received Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={inwardQty}
                    onChange={e => setInwardQty(Number(e.target.value))}
                    className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">Dispatch / Transporter Notes</label>
                <input
                  type="text"
                  value={challanNotes}
                  onChange={e => setChallanNotes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInwardModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-800 text-white font-bold hover:bg-teal-900"
                >
                  Record Inward Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Issue Stock to Training Batch */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden text-slate-800">
            <div className="bg-gradient-to-r from-amber-700 to-amber-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <MinusCircle className="w-5 h-5 text-amber-300" />
                Issue Welcome Kits & Certificates to Batch
              </h3>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="text-white/70 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Training Batch</label>
                <select
                  value={selectedBatchId}
                  onChange={e => setSelectedBatchId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                >
                  {batches.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.batchCode} ({b.date}) - {b.enrolledCount} Drivers
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Certificates Deducted</label>
                  <input
                    type="number"
                    min={0}
                    value={issueQtyCert}
                    onChange={e => setIssueQtyCert(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bags Deducted</label>
                  <input
                    type="number"
                    min={0}
                    value={issueQtyBags}
                    onChange={e => setIssueQtyBags(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Blankets Deducted</label>
                  <input
                    type="number"
                    min={0}
                    value={issueQtyBlankets}
                    onChange={e => setIssueQtyBlankets(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Caps Deducted</label>
                  <input
                    type="number"
                    min={0}
                    value={issueQtyCaps}
                    onChange={e => setIssueQtyCaps(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">T-Shirts Deducted</label>
                  <input
                    type="number"
                    min={0}
                    value={issueQtyTshirts}
                    onChange={e => setIssueQtyTshirts(Number(e.target.value))}
                    className="w-full p-2 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-700 text-white font-bold hover:bg-amber-800"
                >
                  Confirm Batch Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
