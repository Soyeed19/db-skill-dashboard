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
      color: 'text-purple-700 bg-purple-50'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-dbs-green selection:text-white">
      {/* 1. ENTERPRISE PUBLIC NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Official Vector Logo & Branding */}
          <div className="flex items-center gap-3">
            <DbSkillsLogo className="h-11 w-auto" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                  DB SKILLS
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-dbs-green-light text-dbs-green-dark border border-dbs-green/30">
                  NATIONAL ENTERPRISE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                Commercial Driver Training & Verification Infrastructure
              </p>
            </div>
          </div>

          {/* Quick Hub Count & Staff Login Trigger */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-dbs-growth animate-pulse" />
              <span className="font-semibold">{centers.length} Active Hubs Nationwide</span>
            </div>

            {/* Top-Right Staff Login CTA */}
            <button
              type="button"
              onClick={() => openStaffLogin()}
              className="px-4 py-2 rounded-xl bg-dbs-green hover:bg-dbs-green-dark text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
            >
              <LogIn className="w-4 h-4 text-emerald-200" />
              <span>Staff Login</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-900 to-[#072428] text-white py-16 lg:py-24 overflow-hidden border-b border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-radial from-emerald-500/10 via-cyan-500/5 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dbs-growth/20 border border-dbs-growth/30 text-emerald-300 text-xs font-bold tracking-wide">
              <Compass className="w-3.5 h-3.5 text-dbs-growth" />
              <span>NATIONAL COMMERCIAL ROAD SAFETY ECOSYSTEM</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              Enterprise Driver Training, Verification & Multi-Center Governance
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Centralized command infrastructure managing pan-India commercial vehicle driver qualification. Integrated 3-way biometric ingestion, geotagged classroom audits, real-time consumable inventories, and hierarchical financial sanctions.
            </p>

            <div className="pt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => openStaffLogin('CEO')}
                className="px-5 py-3 rounded-xl bg-dbs-green hover:bg-dbs-green-dark text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4 text-emerald-200" />
                <span>Executive Command Portal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => openStaffLogin('OSE')}
                className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4 text-dbs-cyan" />
                <span>Field Staff & Trainer Sign-In</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PAN-INDIA TELEMETRIC HIGHLIGHTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {KEY_METRICS.map((metric, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                {metric.label}
              </span>
              <div className="text-xl font-black text-slate-900 mt-1 tracking-tight">
                {metric.value}
              </div>
              <span className="text-[11px] text-dbs-green font-semibold mt-1 block">
                {metric.sub}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 4. AUTHORIZED ROLE WORKSPACES (PERSONA PORTAL CARDS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-dbs-green">
            Enterprise RBAC Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Select Your Organizational Gateway
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Choose your designated command role below or authenticate with your dual credentials to access the tailored operations workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {personas.map((persona) => {
            const isCeo = persona.role === 'CEO';
            const isGm = persona.role === 'GM';

            return (
              <div
                key={persona.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between group hover:border-dbs-green"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={persona.avatar}
                        alt={persona.name}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-200 group-hover:border-dbs-green transition-colors"
                      />
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm sm:text-base group-hover:text-dbs-green transition-colors">
                          {persona.name}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">{persona.title}</p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{persona.centerName}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-dbs-green-light text-dbs-green-dark border border-dbs-green/20">
                      {persona.role}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                      {persona.level}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
                    {isCeo && 'Pan-India MIS command console, centers league table, critical alerts aggregator, and master Excel dossiers.'}
                    {isGm && 'Regional ops governance, stage-2 financial expense disbursements, personnel provisioning, and leave sanctions.'}
                    {persona.role === 'Senior Manager' && 'Multi-center regional quality control, audit query gatekeeping, and staff mobilisation.'}
                    {persona.role === 'PO' && 'First-tier candidate dossier approvals, Aadhaar mismatch queries, and batch certification reviews.'}
                    {persona.role === 'Trainer' && 'Classroom roll-call attendance, 1-day safety slide deck presentation, and batch rosters.'}
                    {persona.role === 'OSE' && 'Candidate enrollment desk, 3-way Aadhaar ingestion, and camera photo capture.'}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => loginAsPersona(persona)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors cursor-pointer text-center"
                    title="Quick Launch with this Demo Persona"
                  >
                    Quick Enter
                  </button>

                  <button
                    type="button"
                    onClick={() => openStaffLogin(persona.role)}
                    className="py-2 px-3 rounded-xl bg-dbs-green hover:bg-dbs-green-dark text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
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
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-dbs-green">
              Technology & Compliance Standards
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Enterprise Pillars of Verification
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {CORE_MODULES.map((mod, i) => {
              const Icon = mod.icon;
              return (
                <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${mod.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
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
