import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Mail,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Sparkles,
  Store,
  KeyRound,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Logo from '../components/Logo';
import api from '../services/api';

const VerifyOtp = () => {
  const { user, updateUserData } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Pick up email from location.state or current logged-in user or query params
  const queryParams = new URLSearchParams(location.search);
  const initialEmail =
    location.state?.email ||
    user?.email ||
    queryParams.get('email') ||
    '';

  const [email, setEmail] = useState(initialEmail);
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const inputRefs = useRef([]);
  const redirectTo = location.state?.redirectTo || (user?.role === 'vendor' ? '/vendor/register' : '/');

  // Countdown timer for resending OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Autofocus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Handle single digit input and auto-advance
  const handleDigitChange = (index, value) => {
    // Only accept numeric character
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const updated = [...digits];
      updated[index] = '';
      setDigits(updated);
      return;
    }

    // If pasted multiple digits
    if (cleaned.length > 1) {
      handlePastedCode(cleaned);
      return;
    }

    const updated = [...digits];
    updated[index] = cleaned[cleaned.length - 1];
    setDigits(updated);

    // Auto-advance to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePastedCode = (pastedText) => {
    const numbers = pastedText.replace(/\D/g, '').slice(0, 6);
    if (!numbers) return;
    const updated = ['', '', '', '', '', ''];
    for (let i = 0; i < numbers.length; i++) {
      updated[i] = numbers[i];
    }
    setDigits(updated);
    const nextIndex = Math.min(numbers.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  // Submit OTP Verification
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const code = digits.join('').trim();

    if (code.length !== 6) {
      error('Please enter the complete 6-digit verification code');
      return;
    }

    if (!email || !email.includes('@')) {
      error('A valid email address is required for verification');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        email: email.trim().toLowerCase(),
        otp: code,
      });

      if (res.data?.success) {
        success(isVendor ? 'Email verified successfully! Preparing your store setup...' : 'Email verified successfully! Welcome to your customer account.');

        if (res.data.user) {
          updateUserData(res.data.user);
        } else if (user) {
          updateUserData({ ...user, emailVerified: true });
        }

        const targetRoute = isVendor ? '/vendor/register' : (location.state?.redirectTo || '/profile');

        setTimeout(() => {
          navigate(targetRoute, { replace: true });
        }, 1200);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;

    if (!email || !email.includes('@')) {
      error('Please specify a valid email address to resend OTP');
      return;
    }

    setResending(true);
    try {
      const res = await api.post('/auth/send-otp', { email: email.trim().toLowerCase() });
      if (res.data?.success) {
        setCountdown(60);
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();

        success(`A fresh 6-digit verification code has been dispatched to ${email}`);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to dispatch new OTP code');
    } finally {
      setResending(false);
    }
  };

  const userRole = location.state?.role || user?.role || 'customer';
  const isVendor = userRole === 'vendor';

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-50 via-white to-blue-50/30">
      <div className="max-w-md w-full space-y-6">
        {/* Onboarding Steps Indicator for Merchants vs Customers */}
        {isVendor ? (
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[11px]">
                ✓
              </span>
              <span>1. KYC Details</span>
            </div>
            <span className="text-slate-300">──</span>
            <div className="flex items-center gap-1.5 text-[#0c2a5e] font-bold">
              <span className="w-5 h-5 rounded-full bg-[#0c2a5e] text-white flex items-center justify-center text-[11px] animate-pulse">
                2
              </span>
              <span>2. Email OTP</span>
            </div>
            <span className="text-slate-300">──</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px]">
                3
              </span>
              <span>3. Store Setup</span>
            </div>
          </div>
        ) : (
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[11px]">
                ✓
              </span>
              <span>1. Register</span>
            </div>
            <span className="text-slate-300">──</span>
            <div className="flex items-center gap-1.5 text-[#0c2a5e] font-bold">
              <span className="w-5 h-5 rounded-full bg-[#0c2a5e] text-white flex items-center justify-center text-[11px] animate-pulse">
                2
              </span>
              <span>2. Verify Email</span>
            </div>
            <span className="text-slate-300">──</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px]">
                3
              </span>
              <span>3. Start Shopping</span>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-blue-900/5 relative overflow-hidden text-center">
          {/* Subtle Accent Glow */}
          <div className="absolute -top-20 -right-20 w-44 h-44 bg-blue-100/60 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-amber-100/50 rounded-full blur-2xl pointer-events-none" />

          {/* Icon Badge */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#0c2a5e] to-[#1e40af] text-white flex items-center justify-center shadow-lg shadow-blue-900/20 mb-5">
            <Mail className="w-8 h-8" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isVendor ? 'Verify Your Business Email' : 'Verify Your Email Address'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
            We have dispatched a 6-digit verification code to:
          </p>

          {/* Email Highlight Pill */}
          <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 border border-blue-200/80 rounded-full text-xs font-bold text-[#0c2a5e] max-w-full">
            <span className="truncate">{email || 'your-email@example.com'}</span>
          </div>

          {/* 6-Digit Code Inputs */}
          <form onSubmit={handleVerifyOtp} className="mt-8 space-y-6">
            <div className="flex justify-center gap-2 sm:gap-3">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={(e) => {
                    e.preventDefault();
                    handlePastedCode(e.clipboardData.getData('text'));
                  }}
                  id={`otp-digit-${idx}`}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black font-mono bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:border-[#0c2a5e] focus:outline-none focus:ring-4 focus:ring-blue-100 transition shadow-inner"
                />
              ))}
            </div>



            {/* Action Button */}
            <button
              type="submit"
              id="verify-otp-submit-btn"
              disabled={loading || digits.join('').length !== 6}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#0c2a5e] to-[#154699] hover:from-[#09224d] hover:to-[#123c85] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-900/20 transition cursor-pointer disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Code &amp; Opening Store Setup...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Code &amp; Proceed to Store Setup</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Resend Section */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>Didn't receive the email?</span>
            {countdown > 0 ? (
              <span className="font-semibold text-slate-400">
                Resend code in <strong className="text-slate-700">{countdown}s</strong>
              </span>
            ) : (
              <button
                type="button"
                id="resend-otp-btn"
                onClick={handleResendOtp}
                disabled={resending}
                className="font-bold text-[#0c2a5e] hover:underline cursor-pointer disabled:text-slate-400 inline-flex items-center gap-1"
              >
                {resending ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>Resend OTP Code</span>
              </button>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0c2a5e] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Registration</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtp;
