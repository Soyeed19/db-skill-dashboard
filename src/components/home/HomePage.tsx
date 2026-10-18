import React, { useState } from 'react';
import {
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Database
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DbSkillsLogo } from '../common/DbSkillsLogo';
import { ThemeToggle } from '../common/ThemeToggle';
import { SupabaseStatusModal } from '../common/SupabaseStatusModal';

export const HomePage: React.FC = () => {
  const { sendEmailOtp, verifyEmailOtp, supabaseStatus } = useApp();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState<string>('');
  const [otpToken, setOtpToken] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState<boolean>(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid registered official email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendEmailOtp(cleanEmail);
      if (res.success) {
        setStep('otp');
        setSuccessMsg(res.message);
      } else {
        setErrorMsg(res.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanToken = otpToken.trim();
    if (!cleanToken || cleanToken.length < 6) {
      setErrorMsg('Please enter the 6-digit OTP verification code sent to your email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyEmailOtp(email.trim().toLowerCase(), cleanToken);
      if (!res.success) {
        setErrorMsg(res.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between font-sans selection:bg-[#007A3D] selection:text-white">
      {/* Top Minimal Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DbSkillsLogo className="h-10 w-auto" />
            <div>
              <span className="font-extrabold text-slate-900 text-base tracking-tight block">
                DB SKILLS
              </span>
              <p className="text-[11px] text-slate-500 font-medium">
                Safer Roads | Generate Livelihood | Change Lives
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsSqlModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Inspect Supabase Cloud Connection & RLS SQL Schema"
            >
              <Database className="w-3.5 h-3.5 text-[#007A3D]" />
              <span className="hidden sm:inline">Cloud DB & RLS Setup</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  supabaseStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Centered Login Card */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Card Header */}
          <div className="bg-slate-900 text-white p-6 space-y-2 border-b border-slate-800">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-[#62B548]" />
              <span>Production Zero-Trust Authentication</span>
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Official Staff Sign-In
            </h1>
            <p className="text-xs text-slate-300 leading-relaxed">
              Authenticate with your registered official email in <code className="font-mono text-emerald-300">public.profiles</code> to receive a 6-digit verification OTP.
            </p>
          </div>

          {/* Card Body */}
          <div className="p-6 space-y-4 text-xs">
            {errorMsg && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="font-bold leading-relaxed">{errorMsg}</div>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="font-semibold leading-relaxed">{successMsg}</div>
              </div>
            )}

            {step === 'email' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label htmlFor="official-email-input" className="font-bold text-slate-700 block mb-1.5">
                    Registered Official Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="official-email-input"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your registered official email"
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] outline-none transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Only emails provisioned in <code className="font-mono">public.profiles</code> are authorized to receive login OTPs.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#007A3D] hover:bg-[#005C2E] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmitting ? 'Verifying & Sending OTP...' : 'Send 6-Digit Email OTP'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      OTP Dispatched To
                    </span>
                    <span className="font-mono font-bold text-slate-800 truncate block">
                      {email.trim().toLowerCase()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtpToken('');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[#007A3D] hover:underline font-bold text-[11px] shrink-0 cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>

                <div>
                  <label htmlFor="otp-code-input" className="font-bold text-slate-700 block mb-1.5">
                    Enter 6-Digit Email OTP Code <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="otp-code-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={8}
                      required
                      autoFocus
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 6-digit code"
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-mono tracking-[0.25em] font-bold text-slate-900 focus:bg-white focus:border-[#007A3D] focus:ring-1 focus:ring-[#007A3D] outline-none transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1.5">
                    Enter the 6-digit verification code token sent to your email inbox. No redirect link is required.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#007A3D] hover:bg-[#005C2E] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Verifying Session...' : 'Verify OTP & Enter Workspace'}</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleRequestOtp}
                  className="w-full py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Resend 6-Digit OTP</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-slate-700">
            DB Skills Multi-Center Commercial Vehicle Driver Training & Verification System
          </span>
          <span className="text-[11px] font-mono">
            Supabase Auth OTP • Row Level Security Enforced
          </span>
        </div>
      </footer>

      <SupabaseStatusModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />
    </div>
  );
};
