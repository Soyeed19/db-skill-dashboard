import React, { useState } from 'react';
import {
  Users,
  MapPin,
  Clock,
  ShieldCheck,
  Target,
  Calendar,
  CheckCircle,
  Phone,
  Mail,
  Navigation
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const EmployeeDirectory: React.FC = () => {
  const { employees, activeCenter, currentPersona, performCheckIn } = useApp();
  const [filterCenter, setFilterCenter] = useState<string>('all');

  const filteredEmployees = employees.filter(emp =>
    filterCenter === 'all' ? true : emp.centerId === filterCenter
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-teal-800">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-800">
                Staff Operations & Geofencing
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-mono">National Field Roster</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Employee Directory & Performance Tracker
            </h3>
          </div>
        </div>

        {/* Check-In Action for Current Persona */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => performCheckIn(currentPersona.id)}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Navigation className="w-4 h-4" />
            Stamp Geofenced GPS Check-In
          </button>
        </div>
      </div>

      {/* Center Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterCenter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            filterCenter === 'all'
              ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Locations ({employees.length})
        </button>
        <button
          onClick={() => setFilterCenter('ctr-jodhpur')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            filterCenter === 'ctr-jodhpur'
              ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Jodhpur Hub
        </button>
        <button
          onClick={() => setFilterCenter('ctr-delhi')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            filterCenter === 'ctr-delhi'
              ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Delhi South
        </button>
        <button
          onClick={() => setFilterCenter('ctr-mumbai')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            filterCenter === 'ctr-mumbai'
              ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Mumbai Logistics
        </button>
      </div>

      {/* Personnel Record Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEmployees.map(emp => {
          const targetPct = Math.min(100, Math.round((emp.monthlyAchieved / emp.monthlyTarget) * 100));
          const isCurrent = emp.id === currentPersona.id;

          return (
            <div
              key={emp.id}
              className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                isCurrent ? 'ring-2 ring-teal-600 border-teal-300' : 'border-slate-200'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start gap-3.5 mb-4">
                  <img
                    src={emp.avatar}
                    alt={emp.name}
                    className="w-13 h-13 rounded-xl object-cover border-2 border-slate-100 shadow-xs shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                        {emp.empCode}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {emp.level}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 truncate mt-1">
                      {emp.name} {isCurrent && <span className="text-[10px] text-teal-700 font-bold">(You)</span>}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">{emp.designation}</p>
                  </div>
                </div>

                {/* Center & Hierarchy */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs mb-4">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                    <span className="font-semibold truncate">{emp.centerName}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span>Reports to: {emp.reportingOfficer}</span>
                    <span>Tenure: {emp.tenureMonths} Months</span>
                  </div>
                </div>

                {/* Target Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5 text-teal-700" />
                      Monthly Target
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {emp.monthlyAchieved} / {emp.monthlyTarget} ({targetPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all ${
                        targetPct >= 90
                          ? 'bg-emerald-500'
                          : targetPct >= 70
                          ? 'bg-teal-600'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${targetPct}%` }}
                    />
                  </div>
                </div>

                {/* Leave Balances */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs mb-4">
                  <div className="p-2 rounded-lg bg-teal-50/70 border border-teal-200">
                    <span className="text-[10px] text-teal-700 block">CL/SL Balance</span>
                    <span className="font-bold text-teal-900 font-mono text-sm">
                      {emp.casualLeaveBalance} / 12 Days
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 block">Comp-Off Credits</span>
                    <span className="font-bold text-emerald-900 font-mono text-sm">
                      {emp.compOffBalance} Days
                    </span>
                  </div>
                </div>

                {/* Geofence Status */}
                {emp.lastCheckIn ? (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-900">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Geofenced Check-In ({emp.lastCheckIn.centerDistanceMeters}m from center)</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[10px]">
                      {emp.lastCheckIn.timestamp.split(' ')[1]}
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>No check-in recorded today</span>
                  </div>
                )}
              </div>

              {/* Bottom Contact */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {emp.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" />
                  {emp.email.split('@')[0]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
