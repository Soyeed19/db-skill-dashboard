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
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { fetchProfileByEmail, ROOT_CEO_EMAIL } from '../../services/supabaseService';
import { DbSkillsLogo } from '../common/DbSkillsLogo';
import { ThemeToggle } from '../common/ThemeToggle';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { verifyEmailOtp } = useApp();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState<string>('');
  const [otpToken, setOtpToken] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

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
      // 1. Pre-login email verification check against public.profiles
      const cleanEmail = email.trim().toLowerCase();
      console.log("Checking email in profiles:", cleanEmail);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)
        .maybeSingle();

      console.log("Supabase profiles query result:", { data, error });

      let profileRecord = data;
      if (!profileRecord) {
        const { data: ilikeData } = await supabase
          .from('profiles')
          .select('*')
          .ilike('email', cleanEmail)
          .maybeSingle();
        if (ilikeData) {
          profileRecord = ilikeData;
        }
      }

      if (!profileRecord && cleanEmail === ROOT_CEO_EMAIL) {
        const seeded = await ensureRootCeoProfileInSupabase();
        profileRecord = seeded;
      }

      if (!profileRecord) {
        setErrorMsg('Access Denied: Unregistered email address.');
        return;
      }

      // 2. Dispatch 6-digit OTP token without any emailRedirectTo or redirection options
      let otpData: any = null;
      let otpError: any = null;

      try {
        const res = await supabase.auth.signInWithOtp({
          email: cleanEmail,
          options: {
            shouldCreateUser: false
          }
        });
        otpData = res.data;
        otpError = res.error;
      } catch (sendErr: any) {
        otpError = sendErr;
      }

      // If provisioned in public.profiles but not yet in auth.users, initialize their OTP identity
      if (otpError && (otpError.code === 'otp_disabled' || otpError.message?.toLowerCase().includes('signups not allowed'))) {
        try {
          console.log("Provisioned user first login: dispatching OTP with shouldCreateUser: true for", cleanEmail);
          const retry = await supabase.auth.signInWithOtp({
            email: cleanEmail,
            options: {
              shouldCreateUser: true
            }
          });
          otpData = retry.data;
          otpError = retry.error;
        } catch (retryErr: any) {
          otpError = retryErr;
        }
      }

      if (otpError) {
        console.warn("signInWithOtp rate limit / error:", otpError);
        const errMsg = (otpError.message || '').toLowerCase();
        const isRateLimit = errMsg.includes('rate limit') || otpError.code === 'over_email_send_rate_limit';

        if (isRateLimit) {
          // Allow verified profile to advance to OTP input without being blocked by Supabase's email rate limit
          setStep('otp');
          setSuccessMsg(`Email rate limit reached on auth server. Dev OTP bypass 123456 is active for ${cleanEmail}.`);
          return;
        }

        setErrorMsg(otpError.message || 'Failed to dispatch verification OTP.');
        return;
      }

      setStep('otp');
      setSuccessMsg(`6-digit verification code token sent to ${cleanEmail}. (Dev Bypass OTP: 123456)`);
    } catch (err: any) {
      console.warn("handleRequestOtp notice:", err);
      const errMsg = (err?.message || '').toLowerCase();
      if (errMsg.includes('rate limit')) {
        setStep('otp');
        setSuccessMsg(`Email rate limit reached on auth server. Dev OTP bypass 123456 is active for ${cleanEmail}.`);
        return;
      }
      setErrorMsg(err?.message || 'Failed to request OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const otpCode = otpToken.trim();
    if (!otpCode || otpCode.length < 6) {
      setErrorMsg('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    // IMMEDIATE DEVELOPMENT BYPASS (To avoid auth/link lockouts & rate limits during dev):
    const normalizedEmail = email.trim().toLowerCase();
    if (otpCode.trim() === '123456') {
      setIsSubmitting(true);
      try {
        const res = await verifyEmailOtp(normalizedEmail, otpCode);
        if (res.success) {
          onClose();
        } else {
          setErrorMsg(res.message);
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await verifyEmailOtp(email.trim().toLowerCase(), otpCode);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <div className="absolute top-5 right-5 flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <DbSkillsLogo className="h-10 w-auto" />
            <div>
              <span className="font-extrabold text-white text-base tracking-tight block">
                DB SKILLS AUTHENTICATION
              </span>
              <p className="text-xs text-emerald-300 font-medium">
                Zero-Trust Email OTP Verification
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="font-bold">{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="font-semibold">{successMsg}</div>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  Registered Official Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter registered official email"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-[#007A3D] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#007A3D] hover:bg-[#005C2E] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Sending OTP...' : 'Send 6-Digit Email OTP'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">
                    Enter 6-Digit OTP Code <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('email');
                      setOtpToken('');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-[#007A3D] hover:underline font-bold text-[11px] cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    required
                    value={otpToken}
                    onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono tracking-widest font-bold text-slate-900 focus:bg-white focus:border-[#007A3D] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#007A3D] hover:bg-[#005C2E] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Verifying OTP...' : 'Verify OTP & Sign In'}</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleRequestOtp}
                className="w-full py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend OTP Code</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
