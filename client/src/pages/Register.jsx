import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  UserPlus,
  Mail,
  Lock,
  User,
  Phone,
  Store,
  ArrowRight,
  Gift,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  KeyRound,
  RefreshCw,
  UploadCloud,
  FileText,
  Eye,
  EyeOff,
  X,
  Truck,
  FileCheck,
  CreditCard,
  Check,
  Camera,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Logo from '../components/Logo';
import api from '../services/api';

const Register = () => {
  const [role, setRole] = useState('customer'); // 'customer' | 'vendor'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Profile Picture State
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarInputRef = useRef(null);

  const handleAvatarChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      error('Please select an image file (JPG, PNG, or WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      error('Profile image exceeds 10MB limit. Please select a smaller photo.');
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  // Merchant KYC: Numbers and Documents (Both Aadhaar & PAN are mandatory)
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [aadhaarPreview, setAadhaarPreview] = useState(null);
  const [isDraggingAadhaar, setIsDraggingAadhaar] = useState(false);
  const aadhaarInputRef = useRef(null);

  const [panNumber, setPanNumber] = useState('');
  const [panFile, setPanFile] = useState(null);
  const [panPreview, setPanPreview] = useState(null);
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const panInputRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Pick up ?ref= query parameter from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refParam = params.get('ref') || params.get('referral');
    if (refParam) {
      setReferralCode(refParam.toUpperCase());
      setShowReferralInput(true);
    }
  }, [location.search]);

  // Handle Aadhaar File Selection
  const handleAadhaarChange = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      error('Aadhaar file exceeds 10MB limit. Please select a smaller document.');
      return;
    }
    setAadhaarFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setAadhaarPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setAadhaarPreview(null);
    }
  };

  const removeAadhaar = () => {
    setAadhaarFile(null);
    setAadhaarPreview(null);
    if (aadhaarInputRef.current) aadhaarInputRef.current.value = '';
  };

  // Handle PAN File Selection
  const handlePanChange = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      error('PAN file exceeds 10MB limit. Please select a smaller document.');
      return;
    }
    setPanFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPanPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPanPreview(null);
    }
  };

  const removePan = () => {
    setPanFile(null);
    setPanPreview(null);
    if (panInputRef.current) panInputRef.current.value = '';
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      error('Please enter your full name');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      error('Please provide a valid email address');
      return;
    }

    if (password.length < 6) {
      error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      error('Passwords do not match');
      return;
    }

    // Role-specific verification: Numbers and Documents ONLY for merchants
    if (role === 'vendor') {
      const cleanAadhaar = aadhaarNumber.replace(/\s/g, '');
      if (!cleanAadhaar || cleanAadhaar.length !== 12) {
        error('Please enter a valid 12-digit Aadhaar number');
        return;
      }

      if (!aadhaarFile) {
        error('Aadhaar Card document upload is mandatory for Merchant registration');
        return;
      }

      const cleanPan = panNumber.trim().toUpperCase();
      if (!cleanPan || cleanPan.length !== 10) {
        error('Please enter a valid 10-character PAN number (e.g. ABCDE1234F)');
        return;
      }

      if (!panFile) {
        error('PAN Card document upload is mandatory for Merchant registration');
        return;
      }
    }

    if (!agreeTerms) {
      error('Please agree to the Terms of Service & Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('email', email.trim().toLowerCase());
      formData.append('phone', phone.trim());
      formData.append('password', password);
      formData.append('role', role);

      // Attach profile picture if uploaded
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      // Only attach numbers & documents if role is vendor
      if (role === 'vendor') {
        formData.append('aadhaarNumber', aadhaarNumber.replace(/\s/g, ''));
        formData.append('aadhaar', aadhaarFile);
        formData.append('panNumber', panNumber.trim().toUpperCase());
        formData.append('pan', panFile);
      }

      if (referralCode.trim()) {
        formData.append('referralCode', referralCode.trim().toUpperCase());
      }

      const registeredUser = await register(formData);

      if (role === 'vendor') {
        success(`KYC documents submitted! Verification code sent to ${email}`);
        navigate('/verify-otp', {
          state: {
            email: email.trim().toLowerCase(),
            name: name.trim(),
            role: 'vendor',
            redirectTo: '/vendor/register',
          },
        });
      } else {
        success(`Account created! A 6-digit verification code has been dispatched to ${email}`);
        navigate('/verify-otp', {
          state: {
            email: email.trim().toLowerCase(),
            name: name.trim(),
            role: 'customer',
            redirectTo: '/profile',
          },
        });
      }
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-8 sm:pt-10 pb-20 px-4 sm:px-6 lg:px-8 flex justify-center">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden grid grid-cols-1 lg:grid-cols-12 self-start">
        {/* Left Column: Brand Showcase & Value Props (Desktop only) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#071d42] via-[#0c2a5e] to-[#174896] p-8 sm:p-10 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10 space-y-6">
            <Logo theme="dark" variant="marketplace" />

            <div className="space-y-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Verified Marketplace Network</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {role === 'vendor'
                  ? 'Start Selling with Verified Trust.'
                  : 'Shop with Confidence, Save More.'}
              </h2>
              <p className="text-sm text-blue-100/90 leading-relaxed">
                {role === 'vendor'
                  ? 'Join audited merchants with Aadhaar & PAN KYC compliance, instant payouts, and zero listing fees.'
                  : "Join India's fastest growing commerce platform with genuine products, rapid delivery, and exclusive rewards."}
              </p>
            </div>

            {/* Feature Points */}
            <div className="space-y-4 pt-4">
              {role === 'vendor' ? (
                <>
                  <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                    <div className="p-2 rounded-xl bg-blue-400/20 text-blue-200 flex-shrink-0">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Audited Merchant KYC</h4>
                      <p className="text-xs text-blue-100/80 mt-0.5">
                        Aadhaar and PAN details &amp; documents are securely encrypted in Cloudinary and the database.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                    <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 flex-shrink-0">
                      <Gift className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">₹500 Referral Bonuses</h4>
                      <p className="text-xs text-blue-100/80 mt-0.5">
                        Earn ₹500 directly in your wallet balance on every merchant store you refer.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                    <div className="p-2 rounded-xl bg-cyan-400/20 text-cyan-200 flex-shrink-0">
                      <Store className="w-5 h-5 text-cyan-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Custom Merchant Storefront</h4>
                      <p className="text-xs text-blue-100/80 mt-0.5">
                        Manage inventory, track customer orders, and receive direct bank settlements.
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                    <div className="p-2 rounded-xl bg-blue-400/20 text-blue-200 flex-shrink-0">
                      <Check className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Instant Customer Signup</h4>
                      <p className="text-xs text-blue-100/80 mt-0.5">
                        No documentation required for shoppers. Create an account in under 30 seconds.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                    <div className="p-2 rounded-xl bg-amber-400/20 text-amber-300 flex-shrink-0">
                      <Gift className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Welcome Shopping Rewards</h4>
                      <p className="text-xs text-blue-100/80 mt-0.5">
                        Earn reward points on orders and wallet discounts through friend referrals.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                    <div className="p-2 rounded-xl bg-cyan-400/20 text-cyan-200 flex-shrink-0">
                      <Truck className="w-5 h-5 text-cyan-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Express Pan-India Delivery</h4>
                      <p className="text-xs text-blue-100/80 mt-0.5">
                        Automated live tracking and hassle-free 7-day returns on verified orders.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bottom Trust Metrics */}
          <div className="relative z-10 pt-8 mt-6 border-t border-white/10 grid grid-cols-3 gap-3 text-center">
            <div className="space-y-0.5">
              <p className="text-lg sm:text-xl font-black text-amber-400">50K+</p>
              <p className="text-[11px] text-blue-200 font-medium">Happy Shoppers</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-lg sm:text-xl font-black text-white">1,200+</p>
              <p className="text-[11px] text-blue-200 font-medium">Verified Vendors</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-lg sm:text-xl font-black text-emerald-400">100%</p>
              <p className="text-[11px] text-blue-200 font-medium">Safe &amp; Secure</p>
            </div>
          </div>
        </div>

        {/* Right Column: Registration Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
          <div className="max-w-xl mx-auto w-full space-y-6">
            {/* Mobile-Only Top Brand Header */}
            <div className="lg:hidden flex flex-col items-center justify-center pb-2 text-center">
              <Logo variant="marketplace" />
            </div>

            {/* Header */}
            <div className="space-y-1.5 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Create Your Account
              </h1>
              <p className="text-sm text-slate-500">
                {role === 'vendor'
                  ? 'Apply as an authorized merchant seller on Amezon.online'
                  : 'Join as a customer to browse and purchase products'}
              </p>
            </div>

            {/* Account Role Selector */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                id="customer-role-btn"
                onClick={() => setRole('customer')}
                className={`py-3 px-3 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                  role === 'customer'
                    ? 'bg-[#0c2a5e] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Customer</span>
              </button>
              <button
                type="button"
                id="merchant-role-btn"
                onClick={() => setRole('vendor')}
                className={`py-3 px-3 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                  role === 'vendor'
                    ? 'bg-[#0c2a5e] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span>Merchant / Seller</span>
              </button>
            </div>

            {/* Merchant Guidance Notice */}
            {role === 'vendor' && (
              <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1 text-xs text-amber-900">
                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Merchant Compliance &amp; KYC Requirement</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[12px]">
                  Merchants must verify their business email with OTP, provide <strong>Aadhaar &amp; PAN numbers</strong>, and upload both verification documents.
                </p>
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4" autoComplete="off">
              {/* Profile Picture Upload (Replaces default stock avatar) */}
              <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/40 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group flex-shrink-0">
                  <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-slate-300 group-hover:border-[#0c2a5e] overflow-hidden bg-white shadow-xs flex items-center justify-center transition">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-[#0c2a5e] transition">
                        <User className="w-8 h-8 stroke-[1.5]" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#0c2a5e] hover:bg-[#16428a] text-white shadow-md transition cursor-pointer"
                    title="Choose photo"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <label className="text-xs sm:text-sm font-bold text-slate-800">
                      Profile Picture <span className="text-[11px] font-normal text-slate-500">(Optional)</span>
                    </label>
                    {avatarPreview && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Photo Selected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    Upload your real personal or merchant photo. It will appear on your store, header, and order dispatches.
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      id="upload-profile-photo-btn"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                    >
                      {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                    </button>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="px-2.5 py-1.5 text-xs font-bold rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={avatarInputRef}
                    id="profile-pic-input"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleAvatarChange(e.target.files?.[0])}
                  />
                </div>
              </div>

              {/* Row 1: Full Name & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-700">
                    {role === 'vendor' ? 'Business Owner Name *' : 'Full Name *'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="reg-name-input"
                      name="registerFullName"
                      autoComplete="off"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter full name"
                      className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] transition"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-700">
                    {role === 'vendor' ? 'Business Phone *' : 'Phone Number *'}
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="reg-phone-input"
                      name="registerPhone"
                      autoComplete="off"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter mobile number"
                      className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] transition"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* Row 2: Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-bold text-slate-700">
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="reg-email-input"
                    name="registerEmail"
                    autoComplete="off"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter business email address"
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Row 3: Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-700">
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="reg-password-input"
                      name="registerNewPassword"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] transition"
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

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-700">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="reg-confirm-password-input"
                      name="registerConfirmPassword"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] transition"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* MERCHANT ONLY: MANDATORY AADHAAR AND PAN NUMBERS + DOCUMENT UPLOADS */}
              {role === 'vendor' && (
                <div className="space-y-4 pt-1">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#0c2a5e] text-white">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                          Merchant KYC Documents &amp; Numbers
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Both Aadhaar and PAN numbers and documents are mandatory for merchant verification
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                      Mandatory
                    </span>
                  </div>

                  {/* 2-Column Responsive Grid for Aadhaar & PAN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1. Aadhaar Card Section */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-b from-blue-50/50 to-slate-50 border border-blue-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-[#0c2a5e]" />
                          <span className="text-xs font-bold text-slate-900">
                            1. Aadhaar Card *
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                          Required
                        </span>
                      </div>

                      {/* Aadhaar Number Input */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700">
                            Aadhaar Number (12 Digits) *
                          </label>
                          {aadhaarNumber.replace(/\s/g, '').length === 12 && (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>12 Digits</span>
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          id="reg-aadhaar-number"
                          maxLength={14}
                          value={aadhaarNumber}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
                            const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
                            setAadhaarNumber(formatted);
                          }}
                          placeholder="1234 5678 9012"
                          className="w-full px-3 py-2 text-xs sm:text-sm font-mono tracking-wider bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                        />
                      </div>

                      {/* Aadhaar File Upload */}
                      {!aadhaarFile ? (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingAadhaar(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDraggingAadhaar(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingAadhaar(false);
                            handleAadhaarChange(e.dataTransfer.files?.[0]);
                          }}
                          onClick={() => aadhaarInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                            isDraggingAadhaar
                              ? 'border-[#0c2a5e] bg-blue-50'
                              : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400'
                          }`}
                        >
                          <input
                            ref={aadhaarInputRef}
                            type="file"
                            id="reg-aadhaar-input"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleAadhaarChange(e.target.files?.[0])}
                            className="hidden"
                          />
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0c2a5e] flex items-center justify-center">
                            <UploadCloud className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              Upload Aadhaar Document *
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              PDF, JPG, PNG (Max 10MB)
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl p-2.5 border border-emerald-300 shadow-2xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {aadhaarPreview ? (
                              <img
                                src={aadhaarPreview}
                                alt="Aadhaar Preview"
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 border border-red-200">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 truncate block">
                                {aadhaarFile.name}
                              </span>
                              <span className="text-[10px] text-emerald-700 font-semibold">
                                {(aadhaarFile.size / 1024).toFixed(1)} KB • Attached
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={removeAadhaar}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer flex-shrink-0"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 2. PAN Card Section */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-b from-blue-50/50 to-slate-50 border border-blue-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-[#0c2a5e]" />
                          <span className="text-xs font-bold text-slate-900">
                            2. PAN Card *
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                          Required
                        </span>
                      </div>

                      {/* PAN Number Input */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-700">
                            PAN Number (10 Characters) *
                          </label>
                          {panNumber.trim().length === 10 && (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Valid Format</span>
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          id="reg-pan-number"
                          maxLength={10}
                          value={panNumber}
                          onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
                          placeholder="ABCDE1234F"
                          className="w-full px-3 py-2 text-xs sm:text-sm font-mono tracking-wider uppercase bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                        />
                      </div>

                      {/* PAN File Upload */}
                      {!panFile ? (
                        <div
                          onDragOver={(e) => {
                            e.preventDefault();
                            setIsDraggingPan(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            setIsDraggingPan(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingPan(false);
                            handlePanChange(e.dataTransfer.files?.[0]);
                          }}
                          onClick={() => panInputRef.current?.click()}
                          className={`border-2 border-dashed rounded-xl p-3.5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                            isDraggingPan
                              ? 'border-[#0c2a5e] bg-blue-50'
                              : 'border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400'
                          }`}
                        >
                          <input
                            ref={panInputRef}
                            type="file"
                            id="reg-pan-input"
                            accept="image/*,application/pdf"
                            onChange={(e) => handlePanChange(e.target.files?.[0])}
                            className="hidden"
                          />
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0c2a5e] flex items-center justify-center">
                            <UploadCloud className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              Upload PAN Document *
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              PDF, JPG, PNG (Max 10MB)
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl p-2.5 border border-emerald-300 shadow-2xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {panPreview ? (
                              <img
                                src={panPreview}
                                alt="PAN Preview"
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 border border-red-200">
                                <FileText className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 truncate block">
                                {panFile.name}
                              </span>
                              <span className="text-[10px] text-emerald-700 font-semibold">
                                {(panFile.size / 1024).toFixed(1)} KB • Attached
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={removePan}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer flex-shrink-0"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Referral Code (Optional) */}
              <div className="space-y-1.5 pt-1">
                {!showReferralInput && !referralCode ? (
                  <button
                    type="button"
                    onClick={() => setShowReferralInput(true)}
                    className="text-xs font-bold text-[#0c2a5e] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Have a referral code? Enter it for welcome rewards</span>
                  </button>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        Referral Code (Optional)
                      </label>
                      <span className="text-[11px] text-emerald-600 font-semibold">
                        Eligible for Rewards
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        id="reg-referral-input"
                        autoComplete="off"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        placeholder="Enter referral code"
                        className="w-full pl-10 pr-3 py-2 text-sm font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] transition"
                      />
                      <Gift className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="reg-terms-checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#0c2a5e] focus:ring-[#0c2a5e] cursor-pointer"
                />
                <label htmlFor="reg-terms-checkbox" className="text-xs text-slate-600 leading-snug cursor-pointer">
                  I agree to Amezon's{' '}
                  <span className="text-[#0c2a5e] font-semibold underline">Terms of Use</span> and{' '}
                  <span className="text-[#0c2a5e] font-semibold underline">Privacy Policy</span>.
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="register-submit-btn"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0c2a5e] to-[#154699] hover:from-[#09224d] hover:to-[#123c85] text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-900/20 transition cursor-pointer disabled:bg-slate-300 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-98"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>
                      {role === 'vendor'
                        ? 'Uploading KYC documents & dispatching OTP...'
                        : 'Creating your account...'}
                    </span>
                  </div>
                ) : role === 'vendor' ? (
                  <>
                    <span>Continue Merchant KYC</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Create Customer Account</span>
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-100 text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-[#0c2a5e] hover:underline">
                Sign In here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
