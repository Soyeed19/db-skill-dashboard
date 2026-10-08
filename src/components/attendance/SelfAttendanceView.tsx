import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Eye,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SelfAttendanceView: React.FC = () => {
  const { currentPersona, attendancePunches } = useApp();
  const [inspectPhotoUrl, setInspectPhotoUrl] = useState<string | null>(null);

  // Senior leadership (PO, Senior Manager, GM, CEO) can inspect all staff punches across centers
  const isLeadership = currentPersona.role === 'GM' || currentPersona.role === 'CEO' || currentPersona.role === 'Senior Manager' || currentPersona.role === 'PO';
  const isCeo = isLeadership;
  const myPunches = isLeadership
    ? attendancePunches
    : attendancePunches.filter(p => p.employeeId === currentPersona.id || p.employeeName === currentPersona.name);

  return (
    <div className="space-y-6">
      {/* History Ledger Table */}
      <div className="bg-white border border-slate-300 rounded-sm p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
              {isCeo ? 'All Centers Staff Punch Audit Trail' : 'My Personal Self-Punch Record'}
            </span>
            <h3 className="text-base font-bold text-slate-900">
              Indelibly Watermarked Attendance Logs ({myPunches.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Click any photo thumbnail to inspect the full indelible watermark stamp
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Watermark Selfie</th>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Punch Type</th>
                <th className="py-3 px-4">Date & Time Stamp</th>
                <th className="py-3 px-4">Geotag Coordinates</th>
                <th className="py-3 px-4">Geofence Compliance</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {myPunches.map((punch) => (
                <tr key={punch.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div
                      onClick={() => setInspectPhotoUrl(punch.photoWithWatermark)}
                      className="w-12 h-12 rounded-xs overflow-hidden cursor-pointer border border-slate-300 hover:border-slate-400 transition-all relative group shadow-2xs bg-slate-100"
                    >
                      <img
                        src={punch.photoWithWatermark}
                        alt="Watermark Selfie"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{punch.employeeName}</p>
                    <p className="text-[11px] text-slate-500">{punch.designation}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        punch.type === 'CHECK_IN'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {punch.type === 'CHECK_IN' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          CHECK IN
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-600" />
                          CHECK OUT
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    <p className="font-bold">{punch.timeFormatted}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-mono text-slate-800 font-medium">
                      {punch.lat.toFixed(4)}, {punch.lng.toFixed(4)}
                    </p>
                    <p className="text-[10px] text-slate-400 line-clamp-1 max-w-xs">{punch.locationAddress}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        punch.centerProximityStatus === 'Within Center Geofence'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {punch.centerProximityStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setInspectPhotoUrl(punch.photoWithWatermark)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-teal-700" />
                      View Stamp
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      {/* Modal: Inspect Full High-Res Watermark Photo */}
      {inspectPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 overflow-y-auto">
          <div className="bg-white rounded-sm overflow-hidden max-w-md w-full shadow-md border border-slate-300 my-4">
            <div className="bg-[#007A3D] text-white p-3.5 flex items-center justify-between border-b border-[#005C2E]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                Indelible Watermark Proof
              </span>
              <button
                onClick={() => setInspectPhotoUrl(null)}
                className="w-6 h-6 rounded-xs bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-slate-900">
              <img
                src={inspectPhotoUrl}
                alt="Full Watermark Proof"
                className="w-full aspect-square object-cover rounded-xs border border-slate-700"
              />
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500 font-mono text-[11px]">Tamper-proof canvas composite</span>
              <button
                onClick={() => setInspectPhotoUrl(null)}
                className="px-3 py-1 rounded-sm bg-[#007A3D] hover:bg-[#005C2E] text-white font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
