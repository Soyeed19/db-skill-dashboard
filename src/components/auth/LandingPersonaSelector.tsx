import React from 'react';
import {
  Building2,
  Users,
  Award,
  GraduationCap,
  Briefcase,
  CheckCircle,
  ArrowRight,
  UserCheck,
  FileCheck2,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserPersona, UserRole } from '../../types';
import { DbSkillsLogo } from '../common/DbSkillsLogo';

export const LandingPersonaSelector: React.FC = () => {
  const { personas, loginAsPersona } = useApp();

  // Map each role to specific features & details
  const getRoleMeta = (role: string) => {
    switch (role) {
      case 'CEO':
        return {
          displayRole: 'CEO / Managing Director',
          levelBadge: 'Level 1 - Executive Command',
          colorBorder: 'hover:border-dbs-green border-emerald-400',
          badgeBg: 'bg-dbs-green-light text-dbs-green-dark border-dbs-green/30',
          gradientBg: 'from-emerald-500/20 to-transparent',
          responsibilities: [
            'National Executive Command & MIS Intelligence Console',
            'Pan-India Centers League Table (Fulfillment %, Defects & Audit Readiness)',
            'Read-Only Full Pan-India Visibility across all national training hubs',
            'One-Click Export National Master Audit Dossier (.xlsx)'
          ]
        };
      case 'GM':
        return {
          displayRole: 'GM / National Operations',
          levelBadge: 'Level 1 - Operations Command',
          colorBorder: 'hover:border-amber-500 border-amber-200/80',
          badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
          gradientBg: 'from-amber-500/10 to-transparent',
          responsibilities: [
            'Pan-India Master Summary (National Trainees & Headcount)',
            'Center-Level Deep Drilldown (Stock Ledger & Candidate Registry)',
            'Employee Deployment Directory & "Onboard New Employee"',
            'Official Tour & Expense Sanction Final Authority'
          ]
        };
      case 'Senior Manager':
        return {
          displayRole: 'Senior Manager',
          levelBadge: 'Level 3 - Quality Control (QC) & Regional Console',
          colorBorder: 'hover:border-teal-600 border-teal-200/80',
          badgeBg: 'bg-teal-100 text-teal-900 border-teal-300',
          gradientBg: 'from-teal-500/10 to-transparent',
          responsibilities: [
            'Secondary QC Verification across Multi-Center Batches',
            'Pre-Dispatch Dossier Audit & Sponsor Handover',
            'Cross-Center Quality Benchmarking & Defect Control',
            'Self-Attendance GPS Punch & Official Travel'
          ]
        };
      case 'PO':
        return {
          displayRole: 'Program Officer (PO)',
          levelBadge: 'Level 3 - Regional Compliance',
          colorBorder: 'hover:border-blue-600 border-blue-200/80',
          badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
          gradientBg: 'from-blue-500/10 to-transparent',
          responsibilities: [
            'Real-Time Audit Board: Inspect PDFs, Photos & OCR Scans',
            'Raise & Resolve Inline Document Defect Queries',
            'Grant Official "Green Signal for Video Verification Call"',
            'Approve/Reject Center OSE & Trainer Leave Requests'
          ]
        };
      case 'Trainer':
        return {
          displayRole: 'Master Road Safety Trainer',
          levelBadge: 'Level 4 - Training Delivery',
          colorBorder: 'hover:border-emerald-600 border-emerald-200/80',
          badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          gradientBg: 'from-emerald-500/10 to-transparent',
          responsibilities: [
            'Launch 1-Day Interactive Defensive Driving Slide Deck',
            'Batch Classroom Attendance Roll-Call Register',
            'Capture Driver Holding ID & Live Classroom GPS Photo Proof',
            'Self-Attendance GPS Photo Punch (Zero Supervisor)'
          ]
        };
      case 'OSE':
      default:
        return {
          displayRole: 'Operation Support Executive (OSE)',
          levelBadge: 'Level 4 - Center Operations',
          colorBorder: 'hover:border-emerald-700 border-emerald-300',
          badgeBg: 'bg-emerald-100 text-emerald-950 border-emerald-400',
          gradientBg: 'from-emerald-500/10 to-transparent',
          responsibilities: [
            'Strict Center Scoping (Confined to Assigned Center)',
            'Comprehensive Candidate Registration & Demographics',
            '3-Way Aadhaar Ingestion: Manual, File Upload & Live OCR Viewfinder',
            'Self-Attendance GPS Photo Punch & WhatsApp Summary'
          ]
        };
    }
  };

  // Reorder personas: CEO first, then GM, Senior Manager, PO, Trainer, OSE
  const roleOrder: (UserRole | string)[] = ['CEO', 'GM', 'Senior Manager', 'PO', 'Trainer', 'OSE'];
  const sortedPersonas = [...personas].sort((a, b) => {
    return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role);
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-[#072428] text-slate-100 flex flex-col justify-between selection:bg-teal-600 selection:text-white">
      {/* Top Brand Bar */}
      <div className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DbSkillsLogo className="h-10 w-auto" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-lg tracking-tight">
                  DB SKILLS
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ENTERPRISE OPERATIONS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Commercial Driver Training, Verification & Multi-Center Operations Portal
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Production RBAC System Active
            </span>
            <span>•</span>
            <span>4 National Hubs</span>
          </div>
        </div>
      </div>

      {/* Hero & Role Selection */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 w-full">
        {/* Intro Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-1 shadow-inner">
            <Lock className="w-3.5 h-3.5 text-teal-400" />
            Strict Role-Based Access Control (RBAC) Gateway
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Select Your Organizational Persona
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Each role grants strict, tailored workflow permissions from National CEO Strategic Oversight to Single-Center OSE Candidate Enrollment with 3-Way Aadhaar Ingestion.
          </p>
        </div>

        {/* 5 Distinct Persona Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedPersonas.map((persona) => {
            const meta = getRoleMeta(persona.role);
            return (
              <div
                key={persona.id}
                onClick={() => loginAsPersona(persona)}
                className={`group cursor-pointer rounded-2xl p-5 bg-slate-800/60 hover:bg-slate-800/90 border transition-all duration-200 flex flex-col justify-between shadow-xl hover:shadow-2xl relative overflow-hidden backdrop-blur-sm ${meta.colorBorder}`}
              >
                {/* Background Accent */}
                <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradientBg} opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none`} />

                <div className="relative z-10 space-y-4">
                  {/* Persona Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={persona.avatar}
                        alt={persona.name}
                        className="w-12 h-12 rounded-xl object-cover border-2 border-slate-700 shadow-md group-hover:scale-105 transition-transform"
                      />
                      <div>
                        <h3 className="font-bold text-white text-base group-hover:text-emerald-300 transition-colors">
                          {persona.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">
                          {persona.title}
                        </p>
                        <p className="text-[11px] text-teal-400 font-mono flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-teal-400" />
                          {persona.centerName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Level & Role Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.badgeBg}`}>
                      {meta.displayRole}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-900/80 text-slate-300 border border-slate-700">
                      {meta.levelBadge}
                    </span>
                  </div>

                  {/* Responsibilities list */}
                  <div className="pt-2 border-t border-slate-700/60 space-y-1.5 text-xs text-slate-300">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Key Workflow Scopes:
                    </span>
                    {meta.responsibilities.map((resp, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[11px] leading-tight text-slate-300">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{resp}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Login Button */}
                <div className="relative z-10 pt-4 mt-4 border-t border-slate-700/60 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition-colors">
                    Access Portal as {persona.role}
                  </span>
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-dbs-green group-hover:bg-dbs-growth text-white flex items-center gap-1.5 shadow-md transition-all group-hover:translate-x-0.5"
                  >
                    <span>Login As {persona.role}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-5 text-center text-xs text-slate-500 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>DB Skills & Livelihood Commercial Vehicle Driver Training Infrastructure</span>
          <span className="font-mono text-slate-600">Aero-Green Design System • Version 4.2 RBAC</span>
        </div>
      </footer>
    </div>
  );
};
