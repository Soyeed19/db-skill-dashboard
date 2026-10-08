import React, { useState } from 'react';
import {
  Building2,
  Users,
  Award,
  GraduationCap,
  Briefcase,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Compass,
  Phone,
  Mail,
  MapPin,
  FileCheck2,
  Lock,
  ChevronRight,
  Layers,
  Sparkles,
  ExternalLink,
  KeyRound,
  LogIn
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DbSkillsLogo } from '../common/DbSkillsLogo';
import { LoginModal } from '../auth/LoginModal';

export const HomePage: React.FC = () => {
  const { centers, personas, loginAsPersona } = useApp();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [selectedRoleForLogin, setSelectedRoleForLogin] = useState<string>('OSE');

  const openStaffLogin = (role?: string) => {
    if (role) setSelectedRoleForLogin(role);
    setIsLoginModalOpen(true);
  };

  const KEY_METRICS = [
    { label: 'Active Driver Hubs', value: `${centers.length} Regional Centers`, sub: 'Pan-India Footprint' },
    { label: 'Certified Drivers MTD', value: '4,820 Commercial Drivers', sub: 'MoRTH & NSDC Aligned' },
    { label: 'Training Qualification Yield', value: '95.8%', sub: 'Pre & Post Rigorous QC' },
    { label: 'Regulatory Audit Readiness', value: '100% Verified', sub: 'Zero Supervisor Tampering' },
  ];

  const CORE_MODULES = [
    {
      title: 'Aadhaar Biometric & Optical Ingestion',
      desc: '3-way automated ingestion with instant regex validation, face-portrait extraction, and anti-fraud deduplication.',
      icon: ShieldCheck,
      color: 'text-dbs-green bg-dbs-green-light'
    },
    {
      title: '1-Day Commercial Safety Curriculum',
      desc: 'Interactive 5-module slide deck, roll-call attendance with geotagged classroom snapshots, and simulator evaluations.',
      icon: GraduationCap,
      color: 'text-dbs-cyan-dark bg-dbs-cyan-light'
    },
    {
      title: 'Geofenced Mobile Self-Attendance',
      desc: 'Tamper-proof GPS coordinates watermarked on live selfie punches without supervisor manual gatekeeping.',
      icon: MapPin,
      color: 'text-dbs-orange-dark bg-dbs-orange-light'
    },
    {
      title: 'Multi-Tiered Audit & Sanction Waterfall',
      desc: 'Four-eye review hierarchy from Program Officer (PO) approval to GM financial sanctions and bank disbursements.',
      icon: FileCheck2,
      color: 'text-[#007A3D] bg-[#E6F4EA]'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-[#007A3D] selection:text-white">
      {/* 1. ENTERPRISE PUBLIC NAVBAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Official Vector Logo & Branding */}
          <div className="flex items-center gap-3">
            <DbSkillsLogo className="h-10 w-auto" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-base tracking-tight">
                  DB SKILLS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Safer Roads | Generate Livelihood | Change Lives
              </p>
            </div>
          </div>

          {/* Quick Hub Count & Staff Login Trigger */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-sm border border-slate-200">
              <span className="w-2 h-2 rounded-xs bg-[#62B548]" />
              <span className="font-semibold">{centers.length} Active Hubs Nationwide</span>
            </div>

            {/* Top-Right Staff Login CTA */}
            <button
              type="button"
              onClick={() => openStaffLogin()}
              className="px-3.5 py-1.5 rounded-sm bg-[#007A3D] hover:bg-[#005C2E] text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-emerald-200" />
              <span>Staff Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="bg-slate-900 text-white py-12 lg:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xs bg-slate-800 border border-slate-700 text-emerald-300 text-xs font-bold tracking-wide">
              <Compass className="w-3.5 h-3.5 text-[#62B548]" />
              <span>NATIONAL COMMERCIAL ROAD SAFETY ECOSYSTEM</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Welcome to Integrated DB Skills & Livelihood Portal
            </h1>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xs bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs sm:text-sm font-bold tracking-wide">
              <span>Safer Roads | Generate Livelihood | Change Lives</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
              Centralized operational command managing pan-India commercial vehicle driver qualification. Integrated 3-way biometric ingestion, geotagged classroom audits, real-time consumable inventories, and hierarchical financial sanctions.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => openStaffLogin('CEO')}
                className="px-4 py-2 rounded-sm bg-[#007A3D] hover:bg-[#005C2E] text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Compass className="w-4 h-4 text-emerald-200" />
                <span>Executive Command Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => openStaffLogin('OSE')}
                className="px-4 py-2 rounded-sm bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4 text-[#00AEEF]" />
                <span>Field Staff & Trainer Sign-In</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PAN-INDIA TELEMETRIC HIGHLIGHTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {KEY_METRICS.map((metric, idx) => (
            <div
              key={idx}
              className="bg-white rounded-sm border border-slate-300 p-4 shadow-2xs"
            >
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {metric.label}
              </span>
              <div className="text-lg font-bold text-slate-900 mt-1 tracking-tight font-mono">
                {metric.value}
              </div>
              <span className="text-[11px] text-[#007A3D] font-semibold mt-1 block">
                {metric.sub}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. AUTHORIZED ROLE WORKSPACES (PERSONA PORTAL CARDS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-6">
        <div className="border-b border-slate-200 pb-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#007A3D] block">
            Enterprise RBAC Architecture
          </span>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
            Select Your Organizational Gateway
          </h2>
          <p className="text-xs text-slate-500">
            Choose your designated command role below or authenticate with your dual credentials to access the tailored operations workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map((persona) => {
            const isCeo = persona.role === 'CEO';
            const isGm = persona.role === 'GM';

            return (
              <div
                key={persona.id}
                className="bg-white rounded-sm border border-slate-300 p-4 flex flex-col justify-between hover:border-[#007A3D] transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={persona.avatar}
                        alt={persona.name}
                        className="w-10 h-10 rounded-xs object-cover border border-slate-300"
                      />
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          {persona.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">{persona.title}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{persona.centerName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-xs bg-[#E6F4EA] text-[#005C2E] border border-[#007A3D]/20">
                      {persona.role}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                      {persona.level}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-xs p-2.5 border border-slate-200">
                    {isCeo && 'Pan-India MIS command console, centers league table, critical alerts aggregator, and master Excel dossiers.'}
                    {isGm && 'Regional ops governance, stage-2 financial expense disbursements, personnel provisioning, and leave sanctions.'}
                    {persona.role === 'Senior Manager' && 'Multi-center regional quality control, audit query gatekeeping, and staff mobilisation.'}
                    {persona.role === 'PO' && 'First-tier candidate dossier approvals, Aadhaar mismatch queries, and batch certification reviews.'}
                    {persona.role === 'Trainer' && 'Classroom roll-call attendance, 1-day safety slide deck presentation, and batch rosters.'}
                    {persona.role === 'OSE' && 'Candidate enrollment desk, 3-way Aadhaar ingestion, and camera photo capture.'}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => loginAsPersona(persona)}
                    className="flex-1 py-1.5 rounded-sm bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer text-center border border-slate-300"
                    title="Quick Launch with this Demo Persona"
                  >
                    Quick Enter
                  </button>

                  <button
                    type="button"
                    onClick={() => openStaffLogin(persona.role)}
                    className="py-1.5 px-3 rounded-sm bg-[#007A3D] hover:bg-[#005C2E] text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                    title="Authenticate with Dual Credentials"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. CORE ARCHITECTURE PILLARS */}
      <section className="bg-white border-y border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#007A3D] block">
              Technology & Compliance Standards
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5">
              Enterprise Pillars of Verification
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CORE_MODULES.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <div key={i} className="p-4 rounded-sm bg-slate-50 border border-slate-300 space-y-2.5">
                  <div className={`w-9 h-9 rounded-xs flex items-center justify-center ${mod.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    {mod.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <DbSkillsLogo className="h-9 w-auto" />
            <div>
              <p className="font-bold text-white text-sm">DB Skills Enterprise Portal</p>
              <p className="text-[11px] text-slate-400">National Commercial Road Safety & Transport Skilling</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px] font-medium">
            <span>MoRTH & NSDC Certified Standards</span>
            <span>•</span>
            <span>256-Bit TLS Biometric Compliance</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => openStaffLogin()}
              className="text-dbs-cyan hover:underline font-bold cursor-pointer"
            >
              Employee Login Console
            </button>
          </div>
        </div>
      </footer>

      {/* Staff Login Modal Component */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialRole={selectedRoleForLogin}
      />
    </div>
  );
};
