import React, { useState } from 'react';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DbSkillsLogo } from '../common/DbSkillsLogo';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, initialRole }) => {
  const { loginWithCredentials, requestPasswordReset, loginAsPersona, personas } = useApp();

  const [activeTab, setActiveTab] = useState<'login' | 'reset' | 'quick'>('login');
  const [credential, setCredential] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [resetIdentifier, setResetIdentifier] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!credential.trim()) {
      setErrorMsg('Please enter your Employee ID (e.g. DBS-EMP-1042) or Official Email.');
      return;
    }
    if (!password) {
      setErrorMsg('Please enter your account password.');
      return;
    }

    setIsSubmitting(true);
    const res = loginWithCredentials(credential, password);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!resetIdentifier.trim()) {
      setErrorMsg('Please enter your Employee ID or Email to route your request to GM.');
      return;
    }

    setIsSubmitting(true);
    const res = requestPasswordReset(resetIdentifier);
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(res.message);
      setResetIdentifier('');
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-dbs-green-dark via-dbs-green to-[#072428] text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <DbSkillsLogo className="h-10 w-auto" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">
                  DB SKILLS ENTERPRISE
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-dbs-growth-light text-dbs-growth-dark">
                  STAFF PORTAL
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                Dual-Credential Employee Access & Verification Console
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1.5 mt-5 bg-black/20 p-1 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-dbs-green shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Dual Login
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('reset');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'reset'
                  ? 'bg-white text-dbs-green shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              GM Password Reset
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('quick');
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'quick'
                  ? 'bg-white text-dbs-green shadow-xs'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Persona Sandbox
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto text-xs space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="font-semibold">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="font-semibold leading-relaxed">{successMsg}</div>
            </div>
          )}

          {/* TAB 1: DUAL-CREDENTIAL LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Employee ID or Official Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={credential}
                    onChange={(e) => setCredential(e.target.value)}
                    placeholder="e.g. DBS-EMP-1042 or ramesh.sharma@dbskills.in"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-dbs-green focus:ring-1 focus:ring-dbs-green outline-none transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Accepts either your system Employee ID or your official @dbskills.in mailbox.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">
                    Account Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('reset');
                      setResetIdentifier(credential);
                    }}
                    className="text-dbs-cyan hover:text-dbs-cyan-dark font-bold text-[11px] hover:underline cursor-pointer"
                  >
                    Forgot Password? (GM Reset)
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (default demo: DBS@2026)"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:border-dbs-green focus:ring-1 focus:ring-dbs-green outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Demo Helper Badge */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Default Demo Passcode:</span>
                  <span className="font-mono text-dbs-green font-bold text-[11px]">DBS@2026</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCredential('ramesh.sharma@dbskills.in');
                    setPassword('DBS@2026');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-dbs-green text-slate-700 font-bold text-[10px] shadow-2xs cursor-pointer"
                >
                  Fill Sample OSE
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-dbs-green hover:bg-dbs-green-dark text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Verify Credentials & Enter Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: GM PASSWORD RESET WORKFLOW */}
          {activeTab === 'reset' && (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Enterprise Security Directive: GM-Led Recovery Loop</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Self-service password resets are restricted for operational security. Submitting this form flags your record for the <strong>General Manager (Col. Rajesh Mehta)</strong> to generate and disburse a fresh password token from the GM Leadership Console.
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Your Registered Employee ID or Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    placeholder="e.g. DBS-EMP-0612 or pooja.verma@dbskills.in"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-dbs-green focus:ring-1 focus:ring-dbs-green outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Transmit Reset Request to GM Console</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('login')}
                  className="text-slate-500 hover:text-slate-700 font-semibold text-[11px] cursor-pointer"
                >
                  ← Back to Dual-Credential Login
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: PERSONA SANDBOX SWITCHER (Preserved Fast Direct Access) */}
          {activeTab === 'quick' && (
            <div className="space-y-3">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Instant testing sandbox for enterprise evaluators. Jump straight into any operational persona without password re-entry:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {personas.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      loginAsPersona(p);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-dbs-green hover:bg-emerald-50/50 flex items-center gap-2.5 text-left transition-all cursor-pointer group"
                  >
                    <img
                      src={p.avatar}
                      alt={p.name}
                      className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-slate-900 text-xs block truncate group-hover:text-dbs-green">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold">
                        {p.role}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Guarantee */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-dbs-green" />
            256-Bit Encrypted TLS Session
          </span>
          <span className="font-mono text-slate-400">MoRTH & NSDC Compliant</span>
        </div>
      </div>
    </div>
  );
};
