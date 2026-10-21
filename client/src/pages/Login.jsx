import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Shield,
  Truck,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Logo from '../components/Logo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || (typeof location.state?.from === 'string' ? location.state.from : '/');

  const handleLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email.trim() || !password) {
      showToast('Please enter both your email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const loggedInUser = await login(email.trim().toLowerCase(), password);
      showToast(`Welcome back, ${loggedInUser.name}!`, 'success');

      if (from && from !== '/' && !from.startsWith('/login')) {
        navigate(from, { replace: true });
      } else if (loggedInUser.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (loggedInUser.role === 'vendor') {
        navigate('/vendor/dashboard', { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Invalid email or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for testing if opened
  const fillCredentials = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-8 sm:pt-12 pb-20 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 self-start">
        {/* Left Column: Brand & Security Showcase (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#071d42] via-[#0c2a5e] to-[#174896] p-8 sm:p-10 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <Logo theme="dark" variant="marketplace" />

            <div className="space-y-2 pt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>Secure Authentication</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Welcome Back to SR Marketplace
              </h2>
              <p className="text-sm text-blue-100/90 leading-relaxed">
                Log in to check order statuses, track deliveries, manage merchant products, or explore daily deals.
              </p>
            </div>

            {/* Platform Highlights */}
            <div className="space-y-3 pt-3">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <Truck className="w-5 h-5 text-amber-300 flex-shrink-0" />
                <span className="text-xs text-blue-100 font-medium">Real-time live order dispatch tracking</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span className="text-xs text-blue-100 font-medium">Bank-grade 256-bit encrypted checkout</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <RotateCcw className="w-5 h-5 text-cyan-300 flex-shrink-0" />
                <span className="text-xs text-blue-100 font-medium">Hassle-free 7-day returns &amp; refunds</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 mt-6 border-t border-white/10 text-xs text-blue-200/80 flex items-center justify-between">
            <span>© 2026 SR Marketplace</span>
            <span>Dream • Grow • Together</span>
          </div>
        </div>

        {/* Right Column: Clean Login Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full space-y-6">
            {/* Mobile Top Brand Header */}
            <div className="lg:hidden flex flex-col items-center justify-center pb-2 text-center">
              <Logo variant="marketplace" />
            </div>

            <div className="space-y-1.5 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Sign In
              </h1>
              <p className="text-sm text-slate-500">
                Enter your registered email and password to access your account.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4" autoComplete="off">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="login-email-input"
                    name="loginEmail"
                    autoComplete="off"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                    className="w-full pl-10 pr-3 py-2.5 text-sm sm:text-base bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-slate-700">
                    Password *
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-[#0c2a5e] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password-input"
                    name="loginPassword"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-10 py-2.5 text-sm sm:text-base bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] transition"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#0c2a5e] focus:ring-[#0c2a5e] cursor-pointer"
                />
                <label htmlFor="remember-me" className="text-xs text-slate-600 cursor-pointer">
                  Remember this device for 30 days
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="login-submit-btn"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0c2a5e] to-[#154699] hover:from-[#09224d] hover:to-[#123c85] text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-900/20 transition cursor-pointer disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300 flex items-center justify-center gap-2 active:scale-98"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Register Link */}
            <div className="text-center pt-2 border-t border-slate-100 text-sm text-slate-600">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-bold text-[#0c2a5e] hover:underline">
                Create an Account
              </Link>
            </div>

            {/* Discreet Collapsed Quick Fill for Testing */}
            <details className="pt-2 text-xs text-slate-400 cursor-pointer">
              <summary className="hover:text-slate-600 font-medium select-none">
                Quick Fill Test Credentials (Customer / Admin / Vendor)
              </summary>
              <div className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-slate-600 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200">
                  <div>
                    <span className="font-bold text-[#0c2a5e] block">Customer:</span>
                    <span className="font-mono text-[11px]">ramarajukoyyalagadda@gmail.com</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillCredentials('ramarajukoyyalagadda@gmail.com', 'R@maraju123')}
                    className="px-2.5 py-1 rounded-lg bg-[#0c2a5e] text-white font-bold text-[11px] hover:bg-[#153e85] transition cursor-pointer"
                  >
                    Auto Fill
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Admin: <strong className="font-mono">admin@amazon.com</strong></span>
                  <button
                    type="button"
                    onClick={() => fillCredentials('admin@amazon.com', 'admin123')}
                    className="text-[#0c2a5e] font-bold hover:underline cursor-pointer"
                  >
                    Auto Fill
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Vendor: <strong className="font-mono">techgear@vendor.com</strong></span>
                  <button
                    type="button"
                    onClick={() => fillCredentials('techgear@vendor.com', 'VendorPassword123!')}
                    className="text-[#0c2a5e] font-bold hover:underline cursor-pointer"
                  >
                    Auto Fill
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
