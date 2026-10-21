import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login, logout, isAuthenticated, isAdmin } = useAuth();
  const { showToast, success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin/dashboard';

  // If already authenticated as admin, redirect to admin dashboard
  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const handleAdminLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter your administrator email and password.');
      error('Please enter your administrator email and password.');
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login(email.trim().toLowerCase(), password);

      // Verify role is strictly 'admin'
      if (loggedInUser.role !== 'admin') {
        logout();
        const unauthorizedMsg =
          'Access Denied: This portal is restricted to authorized platform administrators only.';
        setErrorMessage(unauthorizedMsg);
        error(unauthorizedMsg);
        return;
      }

      success(`Welcome back, ${loggedInUser.name}!`);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid administrator credentials';
      setErrorMessage(msg);
      error(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAdmin = () => {
    setEmail('admin@amazon.com');
    setPassword('admin123');
    setErrorMessage('');
  };

  return (
    <div className="w-full bg-slate-50 py-10 sm:py-16 px-4 sm:px-6 lg:px-8 select-none flex items-center justify-center">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Column: Premium SR Navy Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#071d42] via-[#0c2a5e] to-[#16448f] p-8 sm:p-12 text-white flex flex-col justify-between items-center text-center relative overflow-hidden">
          {/* Background ambient lighting */}
          <div className="absolute -top-20 -left-20 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 w-full flex flex-col items-center justify-center my-auto space-y-6">
            {/* Circular White Logo Container showcasing SR emblem */}
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-white shadow-[0_8px_30px_rgba(245,158,11,0.25)] p-4 flex flex-col items-center justify-center transform transition-transform duration-300 hover:scale-105 border-2 border-amber-400/60">
              <img
                src="/logo.png"
                alt="SR Admin"
                className="w-20 h-20 sm:w-26 sm:h-26 object-contain filter drop-shadow-xs"
              />
              <span className="font-black text-[#0c2a5e] text-xs sm:text-sm tracking-tight leading-none mt-1">
                SR Multi-Vendor
              </span>
              <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider mt-0.5">
                Admin Console
              </span>
            </div>

            {/* Title & Tagline */}
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Superadmin Access</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Admin Control Panel
              </h2>
              <p className="text-xs text-blue-100/90 max-w-xs mx-auto leading-relaxed">
                Central control for merchant onboarding, product catalog audits, commission settlements, and platform parameters.
              </p>
            </div>

            {/* Quick Highlights */}
            <div className="w-full space-y-2 pt-2 text-left text-xs text-blue-100">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>Verified Merchant &amp; KYC Management</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                <CheckCircle2 className="w-4 h-4 text-amber-300 flex-shrink-0" />
                <span>Automated Wallet &amp; Order Settlements</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-4 text-[11px] text-blue-200/70 border-t border-white/10 w-full flex items-center justify-between">
            <span>SR Enterprise Hub</span>
            <span className="text-amber-300 font-semibold">Dream • Grow • Together</span>
          </div>
        </div>

        {/* Right Column: Clean White Form Area */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-14 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-6">
            <div className="space-y-1.5 text-left">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Welcome Back
                </h1>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/70">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>256-Bit SSL</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Please enter your administrator credentials to continue
              </p>
            </div>

            {/* Error feedback */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed animate-shake">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4" autoComplete="off">
              {/* Admin Email */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs sm:text-sm font-bold text-slate-700">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    id="admin-email-input"
                    name="adminEmail"
                    autoComplete="off"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter admin email"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] focus:border-transparent transition shadow-2xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => showToast('Contact system administrator to reset master admin password.', 'info')}
                    className="text-xs font-semibold text-[#0c2a5e] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="admin-password-input"
                    name="adminPassword"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] focus:border-transparent transition shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Secure Login Button */}
              <button
                type="submit"
                id="admin-login-submit-btn"
                disabled={loading}
                className="w-full py-3.5 mt-2 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-bold text-base shadow-lg shadow-[#0c2a5e]/25 transition cursor-pointer disabled:bg-slate-300 flex items-center justify-center gap-2 active:scale-98"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <>
                    <span>Secure Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Fill Credentials Helper */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Quick Test Access:</span>
              <button
                type="button"
                id="admin-quick-fill-btn"
                onClick={fillQuickAdmin}
                className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold transition cursor-pointer flex items-center gap-1.5 border border-amber-300/70"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Auto-Fill (admin@amazon.com)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
