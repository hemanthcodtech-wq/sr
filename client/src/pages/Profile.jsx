import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  User,
  Package,
  Truck,
  Heart,
  Settings,
  Share2,
  Copy,
  Check,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  CreditCard,
  Wallet,
  Clock,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Bell,
  Search,
  FileText,
  AlertCircle,
  Sparkles,
  ChevronRight,
  DollarSign,
  TrendingUp,
  LogOut,
  ShoppingBag,
  Camera,
  Tag,
  Gift,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const isRealAvatar = (avatar) => {
  if (!avatar || typeof avatar !== 'string') return false;
  if (avatar.includes('images.unsplash.com')) return false;
  return true;
};

const getUserInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || 'U').slice(0, 2).toUpperCase();
};

const Profile = () => {
  const { user, updateUserData, logout } = useAuth();
  const { wishlistItems, removeFromWishlist, moveToCart } = useCart();
  const { success, error, info } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  // Tab State: 'profile' | 'orders' | 'tracking' | 'wishlist' | 'referrals' | 'settings'
  const [activeTab, setActiveTab] = useState('profile');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Tracking State
  const [trackingQuery, setTrackingQuery] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState('');

  // Saved Addresses State
  const [addresses, setAddresses] = useState(user?.savedAddresses || []);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    tag: 'Home',
    isDefault: false,
  });

  // Wallet & Withdrawal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    method: 'UPI',
    details: '',
  });

  // Settings State
  const [editProfileForm, setEditProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
    address: user?.address || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarFileRef = useRef(null);

  const handleAvatarFileChange = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      error('Please select an image file (JPG, PNG, or WEBP)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      error('Profile image exceeds 10MB limit. Please select a smaller photo.');
      return;
    }
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      setUploadingAvatar(true);
      const res = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        updateUserData(res.data.user);
        success('Profile photo updated successfully!');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update profile photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Copy helpers
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync tab with URL query or hash
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    } else if (location.hash === '#referrals') {
      setActiveTab('referrals');
    } else if (location.pathname === '/orders') {
      setActiveTab('orders');
    } else if (location.pathname === '/wishlist') {
      setActiveTab('wishlist');
    }
  }, [location]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    navigate(`/profile?tab=${tab}`, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch orders when tab is orders, tracking, or profile
  useEffect(() => {
    const fetchOrders = async () => {
      setLoadingOrders(true);
      try {
        const res = await api.get('/orders/my-orders');
        if (res.data?.success) {
          setOrders(res.data.orders);
          if (res.data.orders.length > 0 && !trackedOrder) {
            setTrackedOrder(res.data.orders[0]);
            setTrackingQuery(res.data.orders[0].trackingNumber || res.data.orders[0].invoiceNumber || res.data.orders[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/auth/addresses');
      if (res.data?.success) {
        setAddresses(res.data.addresses);
      }
    } catch (err) {
      console.warn('Addresses fetch note:', err.message);
    }
  };

  const referralLink = user?.referralCode
    ? `${window.location.origin}/register?ref=${user.referralCode}`
    : `${window.location.origin}/register`;

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      success('Referral code copied to clipboard!');
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      success('Referral link copied to clipboard!');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join Amezon.online Marketplace',
        text: `Shop products with verified merchants on Amezon.online. Use my referral code: ${user?.referralCode || ''}`,
        url: referralLink,
      }).catch(() => {});
    } else {
      handleCopy(referralLink, 'link');
    }
  };

  const handleTrackSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!trackingQuery.trim()) return;

    setTrackingLoading(true);
    setTrackingError('');
    try {
      const res = await api.get(`/orders/track/${encodeURIComponent(trackingQuery.trim())}`);
      if (res.data?.success) {
        setTrackedOrder(res.data.order);
      } else {
        setTrackingError('No shipment found for this reference code.');
      }
    } catch (err) {
      setTrackingError(err.response?.data?.message || 'Could not find tracking record for this reference.');
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put('/auth/profile', editProfileForm);
      if (res.data?.success) {
        updateUserData(res.data.user);
        success('Personal profile updated successfully!');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      error('New password and confirm password do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      error('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await api.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.data?.success) {
        success('Password updated successfully!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/addresses', newAddress);
      if (res.data?.success) {
        setAddresses(res.data.addresses);
        setShowAddressModal(false);
        setNewAddress({
          fullName: user?.name || '',
          phone: user?.phone || '',
          street: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'India',
          tag: 'Home',
          isDefault: false,
        });
        success('New delivery address saved!');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Could not save address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const res = await api.delete(`/auth/addresses/${addressId}`);
      if (res.data?.success) {
        setAddresses(res.data.addresses);
        success('Address removed');
      }
    } catch (err) {
      error('Failed to remove address');
    }
  };

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const amt = parseFloat(withdrawForm.amount);
    if (isNaN(amt) || amt <= 0) {
      error('Please enter a valid amount');
      return;
    }
    if (amt > (user?.walletBalance || 0)) {
      error(`Cannot withdraw more than active balance: ₹${user?.walletBalance || 0}`);
      return;
    }

    setShowWithdrawModal(false);
    success(`Withdrawal request of ₹${amt.toLocaleString('en-IN')} submitted successfully to admin!`);
    setWithdrawForm({ amount: '', method: 'UPI', details: '' });
  };

  const filteredOrders = orders.filter((order) => {
    if (orderFilter !== 'all') {
      const hasStatus = order.items?.some((i) => i.deliveryStatus?.toLowerCase() === orderFilter.toLowerCase());
      if (!hasStatus) return false;
    }
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const matchId = (order.invoiceNumber || order._id).toLowerCase().includes(q);
      const matchItem = order.items?.some((i) => i.title.toLowerCase().includes(q));
      if (!matchId && !matchItem) return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Out for Delivery':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Processing':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-14 py-8 select-none">
      {/* Top Breadcrumb & User Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/" className="hover:text-[#0c2a5e]">Home</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-900 font-semibold">Customer Account Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Customer Dashboard &amp; Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your personal profile, real-time order tracking, address book, and referral rewards.
          </p>
        </div>

        {/* Quick Top Stats Pill */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl">
            <Wallet className="w-4 h-4 text-[#0c2a5e]" />
            <div className="text-left">
              <span className="text-[10px] text-slate-500 block leading-tight">Wallet Balance</span>
              <strong className="text-sm font-extrabold text-[#0c2a5e]">₹{(user?.walletBalance || 0).toLocaleString('en-IN')}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-xl">
            <Heart className="w-4 h-4 text-rose-500" />
            <div className="text-left">
              <span className="text-[10px] text-slate-500 block leading-tight">Wishlist</span>
              <strong className="text-sm font-extrabold text-rose-600">{wishlistItems.length}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl">
            <Package className="w-4 h-4 text-emerald-600" />
            <div className="text-left">
              <span className="text-[10px] text-slate-500 block leading-tight">Total Orders</span>
              <strong className="text-sm font-extrabold text-emerald-700">{orders.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Sidebar + Active Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SIDEBAR NAVIGATION (lg:col-span-3) */}
        <aside className="lg:col-span-3 space-y-4 lg:sticky lg:top-24">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 text-center space-y-4">
            {/* User Avatar */}
            <div className="relative inline-block mx-auto group">
              {isRealAvatar(user?.avatar) ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'Customer'}
                  className="w-20 h-20 rounded-full object-cover border-4 border-blue-50 shadow-sm mx-auto"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#0c2a5e] to-[#1a4b9c] text-white flex items-center justify-center font-black text-2xl tracking-wider shadow-sm border-4 border-blue-50 mx-auto">
                  {getUserInitials(user?.name)}
                </div>
              )}

              {/* Upload / Change Photo Button */}
              <button
                type="button"
                onClick={() => avatarFileRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#0c2a5e] hover:bg-[#16428a] text-white shadow-md transition cursor-pointer border-2 border-white"
                title="Update profile picture"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                type="file"
                ref={avatarFileRef}
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleAvatarFileChange(e.target.files?.[0])}
              />
            </div>

            <div>
              <h3 className="font-extrabold text-base text-slate-900 truncate">{user?.name || 'Customer User'}</h3>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0c2a5e] border border-blue-200 text-[11px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0c2a5e]" />
                <span>Verified {user?.role || 'Customer'}</span>
              </div>
            </div>

            {/* Navigation List */}
            <nav className="pt-2 border-t border-slate-100 flex flex-col gap-1 text-left text-xs">
              <button
                id="tab-btn-profile"
                onClick={() => handleTabChange('profile')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition cursor-pointer text-left ${
                  activeTab === 'profile'
                    ? 'bg-[#0c2a5e] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">My Profile</span>
              </button>

              <button
                id="tab-btn-orders"
                onClick={() => handleTabChange('orders')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition cursor-pointer text-left ${
                  activeTab === 'orders'
                    ? 'bg-[#0c2a5e] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Package className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">My Orders</span>
                {orders.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'orders' ? 'bg-white text-[#0c2a5e]' : 'bg-slate-100 text-slate-700'}`}>
                    {orders.length}
                  </span>
                )}
              </button>

              <button
                id="tab-btn-tracking"
                onClick={() => handleTabChange('tracking')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition cursor-pointer text-left ${
                  activeTab === 'tracking'
                    ? 'bg-[#0c2a5e] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Truck className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">Live Order Tracking</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
              </button>

              <button
                id="tab-btn-wishlist"
                onClick={() => handleTabChange('wishlist')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition cursor-pointer text-left ${
                  activeTab === 'wishlist'
                    ? 'bg-[#0c2a5e] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Heart className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">Wishlist</span>
                {wishlistItems.length > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === 'wishlist' ? 'bg-white text-rose-600' : 'bg-rose-100 text-rose-700'}`}>
                    {wishlistItems.length}
                  </span>
                )}
              </button>

              <button
                id="tab-btn-referrals"
                onClick={() => handleTabChange('referrals')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition cursor-pointer text-left ${
                  activeTab === 'referrals'
                    ? 'bg-[#0c2a5e] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Gift className="w-4 h-4 flex-shrink-0 text-amber-400" />
                <span className="flex-1 text-left">Referral Coupons</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-md flex-shrink-0">
                  ₹200 OFF
                </span>
              </button>

              <button
                id="tab-btn-settings"
                onClick={() => handleTabChange('settings')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold transition cursor-pointer text-left ${
                  activeTab === 'settings'
                    ? 'bg-[#0c2a5e] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">Account Settings</span>
              </button>

              <div className="border-t border-slate-100 my-1"></div>

              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer text-left"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">Sign Out</span>
              </button>
            </nav>
          </div>

          {/* Quick Help Box */}
          <div className="bg-gradient-to-br from-slate-900 to-[#0c2a5e] text-white p-5 rounded-3xl shadow-sm space-y-3 text-xs">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Sparkles className="w-4 h-4 flex-shrink-0 animate-pulse" />
              <span>Need Assistance?</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Have queries about returns, courier dispatch or payments? Our 24/7 customer concierge is here to help.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 font-bold text-amber-300 hover:underline"
            >
              <span>Contact Support Desk</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </aside>

        {/* MAIN CONTENT AREA (lg:col-span-9) */}
        <main className="lg:col-span-9 space-y-6">
          {/* TAB 1: PROFILE OVERVIEW */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Customer Referral Coupons & Rewards Banner */}
              <div className="relative overflow-hidden bg-gradient-to-r from-[#0c2a5e] via-[#0f3475] to-[#15459b] text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-blue-900">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  {/* Active Referral Coupons */}
                  <div className="space-y-1 md:border-r border-blue-800/60 md:pr-6">
                    <span className="text-[11px] uppercase tracking-wider text-amber-300 font-bold block flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      Referral Discount Coupons
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black text-amber-300">
                        ₹200 OFF
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-200 mt-1">
                      Per successful customer referral. Apply coupon at checkout.
                    </p>
                  </div>

                  {/* Active Coupons Count */}
                  <div className="space-y-1 md:border-r border-blue-800/60 md:pr-6">
                    <span className="text-[11px] uppercase tracking-wider text-blue-200 font-bold block">
                      Active Coupons Available
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-300 flex items-center gap-2">
                      <span>3 Coupons</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Ready to Use</span>
                    </div>
                    <p className="text-[11px] text-blue-200 mt-1">
                      Code: <span className="font-mono font-bold text-white">REF200-SAVE</span> &amp; more.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2.5">
                    <button
                      onClick={() => navigate('/products')}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-sm text-center cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Shop With Coupons</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('referrals')}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs transition text-center cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Gift className="w-3.5 h-3.5 text-amber-300" />
                      <span>View My Coupons &amp; Refer</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Personal Information & Referral Credentials Card */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Personal Profile Details</h2>
                    <p className="text-xs text-slate-500">Your account identity, contact details, and network referral code</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-[#0c2a5e] hover:bg-slate-50 transition cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                  {/* Name */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[11px] text-slate-500 block font-semibold">Full Legal Name</span>
                    <strong className="text-sm font-bold text-slate-900 block">{user?.name}</strong>
                  </div>

                  {/* Email */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 block font-semibold">Email Address</span>
                      <span className="px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">Verified</span>
                    </div>
                    <strong className="text-sm font-bold text-slate-900 block truncate">{user?.email}</strong>
                  </div>

                  {/* Phone */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[11px] text-slate-500 block font-semibold">Phone Number</span>
                    <strong className="text-sm font-bold text-slate-900 block">{user?.phone || '+91 98765 43210'}</strong>
                  </div>

                  {/* Primary Delivery Address */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
                    <span className="text-[11px] text-slate-500 block font-semibold">Primary Delivery Address</span>
                    <strong className="text-xs font-bold text-slate-800 block line-clamp-2">
                      {user?.address || addresses[0]?.street ? `${addresses[0]?.street}, ${addresses[0]?.city} - ${addresses[0]?.zipCode}` : 'Flat 402, Royal Palms, Whitefield, Bengaluru'}
                    </strong>
                  </div>

                  {/* Referral Code */}
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2">
                    <span className="text-[11px] text-[#0c2a5e] block font-bold">My Referral Code</span>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-sm font-black font-mono text-[#0c2a5e]">
                        {user?.referralCode || 'RAMARAJU100'}
                      </code>
                      <button
                        onClick={() => handleCopy(user?.referralCode || 'RAMARAJU100', 'code')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0c2a5e] text-white text-[11px] font-bold hover:bg-[#153e85] transition cursor-pointer"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Referral Link */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                    <span className="text-[11px] text-amber-900 block font-bold">Shareable Referral Link</span>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-slate-700 truncate max-w-[180px]">
                        {referralLink}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopy(referralLink, 'link')}
                          className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer"
                          title="Copy Link"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={handleShare}
                          className="p-1.5 rounded-lg bg-[#0c2a5e] hover:bg-[#153e85] text-white transition cursor-pointer"
                          title="Share"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders Sneak Peek */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Recent Purchase Orders</h3>
                    <p className="text-xs text-slate-500">Track shipments or download GST tax invoices</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#0c2a5e] hover:underline cursor-pointer"
                  >
                    <span>View All ({orders.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No orders placed yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {orders.slice(0, 2).map((order) => (
                      <div key={order._id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={order.items?.[0]?.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&auto=format&fit=crop&q=80'}
                            alt={order.items?.[0]?.title || 'Product'}
                            className="w-14 h-14 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                          />
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">
                              {order.items?.[0]?.title}
                            </h4>
                            <div className="text-[11px] text-slate-500">
                              Order #{order.invoiceNumber || order._id} • {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div className="text-xs font-extrabold text-slate-900">
                              ₹{order.totalAmount?.toLocaleString('en-IN')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(order.items?.[0]?.deliveryStatus)}`}>
                            <Truck className="w-3.5 h-3.5" />
                            <span>{order.items?.[0]?.deliveryStatus || 'Processing'}</span>
                          </span>

                          <button
                            onClick={() => {
                              setTrackedOrder(order);
                              setTrackingQuery(order.trackingNumber || order.invoiceNumber || order._id);
                              setActiveTab('tracking');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-[#0c2a5e] text-white hover:bg-[#153e85] text-xs font-bold transition cursor-pointer"
                          >
                            Track
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: MY ORDERS (ORDER HISTORY) */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {/* Header & Filter Controls */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Order History &amp; Receipts</h2>
                    <p className="text-xs text-slate-500">Filter, inspect, and track all packages across independent sellers</p>
                  </div>

                  {/* Search Order */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search order or item..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                  {['all', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setOrderFilter(status)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                        orderFilter === status
                          ? 'bg-[#0c2a5e] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {status === 'all' ? 'All Orders' : status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Orders List */}
              {loadingOrders ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-44 bg-slate-100 rounded-3xl animate-pulse" />
                  ))}
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
                  <Package className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-800">No orders match your filter</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Check out our product catalog and place your first order with instant wallet rewards.
                  </p>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0c2a5e] text-white text-xs font-bold"
                  >
                    <span>Explore Products</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {filteredOrders.map((order) => (
                    <div
                      key={order._id}
                      className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden transition hover:shadow-md"
                    >
                      {/* Order Card Header */}
                      <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-4 text-slate-600">
                          <div>
                            <span className="text-slate-400">Order ID: </span>
                            <strong className="text-slate-900 font-mono">#{order.invoiceNumber || order._id}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Placed: </span>
                            <strong className="text-slate-800 font-semibold">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400">Payment: </span>
                            <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase text-[10px]">
                              {order.paymentStatus} via {order.paymentMethod}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setTrackedOrder(order);
                              setTrackingQuery(order.trackingNumber || order.invoiceNumber || order._id);
                              setActiveTab('tracking');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0c2a5e] text-white font-bold hover:bg-[#153e85] transition cursor-pointer text-xs"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Live Track</span>
                          </button>

                          <a
                            href={`http://localhost:5000/api/orders/${order._id}/invoice-preview`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:border-slate-400 font-bold transition text-xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span>Invoice</span>
                          </a>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="p-5 divide-y divide-slate-100">
                        {order.items?.map((item) => (
                          <div
                            key={item._id}
                            className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-4">
                              <img
                                src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&auto=format&fit=crop&q=80'}
                                alt={item.title}
                                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                              />
                              <div className="space-y-1">
                                <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{item.title}</h4>
                                <div className="text-xs text-slate-500">
                                  Merchant: <span className="font-semibold text-slate-700">{item.store?.storeName || 'Verified Merchant'}</span>
                                </div>
                                <div className="text-xs text-slate-600 font-medium">
                                  Qty: {item.quantity} × ₹{item.price?.toLocaleString('en-IN')}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col sm:items-end gap-1 text-xs">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(item.deliveryStatus)}`}>
                                <Truck className="w-3.5 h-3.5" />
                                <span>{item.deliveryStatus}</span>
                              </span>
                              {item.trackingNumber && (
                                <span className="text-[11px] font-mono text-slate-500">
                                  AWB: {item.trackingNumber}
                                </span>
                              )}
                              <div className="text-sm font-black text-slate-900 mt-1">
                                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer Info */}
                      <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            Delivering to: <strong className="text-slate-800">{order.shippingAddress?.fullName}</strong>, {order.shippingAddress?.city} ({order.shippingAddress?.zipCode})
                          </span>
                        </div>
                        <div className="text-right">
                          <span>Grand Total: </span>
                          <strong className="text-sm font-black text-slate-900">
                            ₹{order.totalAmount?.toLocaleString('en-IN')}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIVE ORDER TRACKING */}
          {activeTab === 'tracking' && (
            <div className="space-y-6">
              {/* Tracking Search Input Card */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Real-Time Package Tracking</h2>
                  <p className="text-xs text-slate-500">Enter your Order ID, Invoice Number, or Courier AWB Tracking Code</p>
                </div>

                <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="e.g. AWB892110293 or INV-2026-0944"
                      value={trackingQuery}
                      onChange={(e) => setTrackingQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={trackingLoading}
                    className="px-6 py-3 bg-[#0c2a5e] hover:bg-[#153e85] text-white font-extrabold text-xs sm:text-sm rounded-2xl transition shadow-sm cursor-pointer disabled:bg-slate-300"
                  >
                    {trackingLoading ? 'Locating...' : 'Track Shipment'}
                  </button>
                </form>

                {trackingError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{trackingError}</span>
                  </div>
                )}
              </div>

              {/* Active Tracking Visual Stepper */}
              {trackedOrder ? (
                <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
                  {/* Courier & AWB Bar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#0c2a5e] text-white flex items-center justify-center font-black">
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[11px] text-blue-900 font-extrabold uppercase tracking-wider block">
                          {trackedOrder.courierName || 'Delhivery Express Logistics'}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-500 font-medium">Tracking Number:</span>
                          <strong className="text-sm font-mono text-slate-900 font-extrabold">
                            {trackedOrder.trackingNumber || trackedOrder.items?.[0]?.trackingNumber || 'AWB892110293'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Estimated Delivery</span>
                        <strong className="text-xs text-slate-900 font-extrabold">
                          {trackedOrder.estimatedDelivery
                            ? new Date(trackedOrder.estimatedDelivery).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '2-3 Business Days'}
                        </strong>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(trackedOrder.items?.[0]?.deliveryStatus || 'Shipped')}`}>
                        {trackedOrder.items?.[0]?.deliveryStatus || 'Shipped'}
                      </span>
                    </div>
                  </div>

                  {/* Visual Milestones Timeline */}
                  <div className="py-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-6">Delivery Progress Milestones</h3>
                    <div className="relative pl-6 sm:pl-8 border-l-2 border-blue-200 space-y-8 ml-3">
                      {(trackedOrder.trackingTimeline && trackedOrder.trackingTimeline.length > 0
                        ? trackedOrder.trackingTimeline
                        : [
                            {
                              status: 'Order Placed',
                              title: 'Order Confirmed & Payment Verified',
                              description: 'Transaction confirmed successfully.',
                              location: 'Central Order Facility',
                              timestamp: new Date(Date.now() - 2 * 86400000),
                            },
                            {
                              status: 'Processing',
                              title: 'Package Packed by Merchant',
                              description: 'Seller securely boxed item and generated courier label.',
                              location: 'Seller Warehouse',
                              timestamp: new Date(Date.now() - 36 * 3600000),
                            },
                            {
                              status: 'Shipped',
                              title: 'In Transit with Express Logistics',
                              description: 'Consignment departed origin hub heading to delivery station.',
                              location: 'Regional Sorting Facility',
                              timestamp: new Date(Date.now() - 12 * 3600000),
                            },
                          ]
                      ).map((step, idx) => (
                        <div key={idx} className="relative group">
                          {/* Stepper Dot */}
                          <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full bg-white border-4 border-[#0c2a5e] flex items-center justify-center shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0c2a5e]"></span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">{step.title}</h4>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {new Date(step.timestamp).toLocaleString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                            {step.location && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                                <MapPin className="w-3 h-3 text-[#0c2a5e]" />
                                <span>{step.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Destination Address & Items Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Shipping Destination
                      </span>
                      <strong className="text-slate-900 block font-bold text-sm">
                        {trackedOrder.shippingAddress?.fullName}
                      </strong>
                      <p className="text-slate-600 mt-0.5">
                        {trackedOrder.shippingAddress?.street}, {trackedOrder.shippingAddress?.city}, {trackedOrder.shippingAddress?.state} - {trackedOrder.shippingAddress?.zipCode}
                      </p>
                      <p className="text-slate-500 mt-1">Phone: {trackedOrder.shippingAddress?.phone}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Package Contents ({trackedOrder.items?.length || 1} items)
                      </span>
                      {trackedOrder.items?.map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-1 border-b last:border-b-0 border-slate-200/60">
                          <span className="text-slate-800 font-medium truncate max-w-[200px]">{item.title}</span>
                          <span className="font-bold text-slate-900">Qty: {item.quantity}</span>
                        </div>
                      ))}
                      <div className="pt-2 flex justify-between font-bold text-slate-900">
                        <span>Paid Total:</span>
                        <span>₹{trackedOrder.totalAmount?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 4: MY WISHLIST */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Saved Wishlist Items</h2>
                  <p className="text-xs text-slate-500">Products you've saved to buy later or monitor for price drops</p>
                </div>
                <Link
                  to="/products"
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Explore More
                </Link>
              </div>

              {wishlistItems.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
                  <Heart className="w-12 h-12 text-rose-300 mx-auto fill-rose-50" />
                  <h3 className="text-base font-bold text-slate-800">Your wishlist is currently empty</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Save top-rated gadgets, apparel, and goods directly while browsing products.
                  </p>
                  <Link
                    to="/products"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0c2a5e] text-white text-xs font-bold"
                  >
                    <span>Browse Catalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {wishlistItems.map((product) => {
                    const price = product.price || 0;
                    const discountPrice = product.discountPrice || 0;
                    const hasDiscount = discountPrice > 0 && discountPrice < price;
                    const displayPrice = hasDiscount ? discountPrice : price;
                    const imageSrc = product.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80';

                    return (
                      <div
                        key={product._id}
                        className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-4 flex flex-col justify-between hover:shadow-md transition space-y-3"
                      >
                        <div className="w-full aspect-square rounded-2xl bg-slate-50 overflow-hidden relative flex items-center justify-center p-3">
                          <img src={imageSrc} alt={product.title} className="w-full h-full object-contain" />
                          <button
                            onClick={() => removeFromWishlist(product._id)}
                            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 text-rose-500 hover:bg-rose-50 border border-slate-200 flex items-center justify-center cursor-pointer transition shadow-2xs"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <Link to={`/products/${product._id}`} className="font-bold text-xs text-slate-900 line-clamp-2 hover:text-[#0c2a5e]">
                            {product.title}
                          </Link>
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-extrabold text-slate-900">
                              ₹{displayPrice.toLocaleString('en-IN')}
                            </span>
                            {hasDiscount && (
                              <span className="text-xs text-slate-400 line-through">
                                ₹{price.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            moveToCart(product);
                            success('Moved item into shopping cart!');
                          }}
                          className="w-full py-2.5 px-3 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Move to Cart</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: REFERRAL REWARDS & DISCOUNT COUPONS */}
          {activeTab === 'referrals' && (
            <div className="space-y-6">
              {/* Customer Referral Header Banner */}
              <div className="bg-gradient-to-br from-slate-950 via-[#0c2a5e] to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-blue-900 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-amber-400" />
                      Referral Rewards Program
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                      Invite Friends &amp; Get ₹200 Shopping Coupons
                    </div>
                    <p className="text-xs text-blue-200 mt-1">
                      Whenever your friend joins with your invite code and shops, you both unlock exclusive ₹200 discount vouchers!
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/products')}
                    className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-sm transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Redeem in Store</span>
                  </button>
                </div>

                {/* Referral Link Box */}
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">Your Personal Referral Invite Link</span>
                    <button
                      onClick={() => handleCopy(referralLink, 'link')}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-[#0c2a5e] text-xs font-black transition cursor-pointer hover:bg-blue-50"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied Link' : 'Copy Link'}</span>
                    </button>
                  </div>
                  <p className="font-mono text-xs text-blue-100 truncate">{referralLink}</p>
                </div>
              </div>

              {/* Earned Coupons Wallet / Cards Section */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-amber-500" />
                      <span>My Available Shopping Coupons</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Copy any promo voucher code below and enter it at checkout for instant order discounts!
                    </p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    ● 3 Coupons Active
                  </span>
                </div>

                {/* Grid of Coupons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                  {/* Coupon 1: Referral Discount */}
                  <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-amber-400 bg-gradient-to-br from-amber-50/80 to-white p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                        Referral Reward
                      </span>
                      <span className="text-xs font-bold text-amber-800">Flat ₹200 OFF</span>
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900 tracking-tight">₹200 OFF</div>
                      <p className="text-[11px] text-slate-600 mt-0.5">Valid on all orders above ₹499</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-amber-200">
                      <span className="font-mono text-xs font-black text-[#0c2a5e] bg-amber-100 px-2 py-1 rounded">
                        REF200
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('REF200');
                          success('Coupon REF200 copied to clipboard!');
                        }}
                        className="text-xs font-bold text-amber-900 hover:text-amber-700 underline cursor-pointer"
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>

                  {/* Coupon 2: Referral Code based coupon */}
                  <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-blue-400 bg-gradient-to-br from-blue-50/80 to-white p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-[#0c2a5e] text-white text-[10px] font-black uppercase tracking-wider">
                        Friend Invite Bonus
                      </span>
                      <span className="text-xs font-bold text-blue-800">Flat ₹200 OFF</span>
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900 tracking-tight">₹200 Instant Off</div>
                      <p className="text-[11px] text-slate-600 mt-0.5">Use your unique referral promo code</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-blue-200">
                      <span className="font-mono text-xs font-black text-[#0c2a5e] bg-blue-100 px-2 py-1 rounded truncate max-w-[130px]">
                        {user?.referralCode || 'REF200-SAVE'}
                      </span>
                      <button
                        onClick={() => {
                          const code = user?.referralCode || 'REF200-SAVE';
                          navigator.clipboard.writeText(code);
                          success(`Coupon ${code} copied!`);
                        }}
                        className="text-xs font-bold text-blue-900 hover:text-blue-700 underline cursor-pointer"
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>

                  {/* Coupon 3: Festive Offer */}
                  <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-emerald-400 bg-gradient-to-br from-emerald-50/80 to-white p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider">
                        Festive Promo
                      </span>
                      <span className="text-xs font-bold text-emerald-800">Save ₹1,000</span>
                    </div>
                    <div>
                      <div className="text-lg font-black text-slate-900 tracking-tight">₹1,000 Mega Off</div>
                      <p className="text-[11px] text-slate-600 mt-0.5">Applicable on cart orders above ₹2,999</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
                      <span className="font-mono text-xs font-black text-emerald-900 bg-emerald-100 px-2 py-1 rounded">
                        DASARA20
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('DASARA20');
                          success('Coupon DASARA20 copied to clipboard!');
                        }}
                        className="text-xs font-bold text-emerald-900 hover:text-emerald-700 underline cursor-pointer"
                      >
                        Copy Code
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* How Customer Referral Coupons Work */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-5">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900">How Customer Referral Coupons Work</h3>
                  <p className="text-xs text-slate-500">
                    Invite friends, family, and colleagues to shop on SR Multi-Vendor Marketplace.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1.5">
                    <div className="text-xs font-bold text-blue-800 uppercase tracking-wider">Step 1</div>
                    <div className="font-extrabold text-sm text-slate-900">Share Your Invite Link</div>
                    <p className="text-[11.5px] text-slate-600 leading-relaxed">
                      Copy your unique referral invite link or promo code and share it with friends via WhatsApp, SMS, or social media.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1.5">
                    <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Step 2</div>
                    <div className="font-extrabold text-sm text-slate-900">Friend Joins &amp; Purchases</div>
                    <p className="text-[11.5px] text-slate-600 leading-relaxed">
                      Your friend registers on the platform and places their first order from authentic verified merchants.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-1.5">
                    <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Step 3</div>
                    <div className="font-extrabold text-sm text-slate-900">Unlock ₹200 Shopping Coupons</div>
                    <p className="text-[11.5px] text-slate-600 leading-relaxed">
                      You receive ₹200 discount coupons added directly to your account to apply at checkout for instant savings!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ACCOUNT SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Profile Details Edit Form */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-5">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-900">Edit Profile Information</h3>
                  <p className="text-xs text-slate-500">Update your display name, telephone number, and default delivery address</p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={editProfileForm.name}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={editProfileForm.phone}
                        onChange={(e) => setEditProfileForm({ ...editProfileForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Primary Delivery Address</label>
                    <input
                      type="text"
                      value={editProfileForm.address}
                      onChange={(e) => setEditProfileForm({ ...editProfileForm, address: e.target.value })}
                      placeholder="e.g. Flat 402, Royal Palms, Whitefield Main Road, Bengaluru"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="py-2.5 px-6 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-extrabold text-xs transition cursor-pointer"
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </form>
              </div>

              {/* Manage Saved Delivery Addresses */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Saved Address Book</h3>
                    <p className="text-xs text-slate-500">Addresses used for 1-click checkout and deliveries</p>
                  </div>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0c2a5e] text-white font-bold text-xs hover:bg-[#153e85] transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No saved addresses found. Add one above.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div key={addr._id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 relative space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs uppercase px-2 py-0.5 rounded-md bg-blue-100 text-[#0c2a5e]">
                            {addr.tag || 'Home'}
                          </span>
                          <button
                            onClick={() => handleDeleteAddress(addr._id)}
                            className="text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <strong className="text-sm font-bold text-slate-900 block">{addr.fullName}</strong>
                        <p className="text-slate-600 line-clamp-2">
                          {addr.street}, {addr.city}, {addr.state} - {addr.zipCode}
                        </p>
                        <p className="text-slate-500 font-medium">Phone: {addr.phone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Change Password Card */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-5">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-900">Security &amp; Password</h3>
                  <p className="text-xs text-slate-500">Ensure your account uses a strong credentials password</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 text-xs max-w-md">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Current Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">New Password (min 6 characters)</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition cursor-pointer"
                  >
                    {changingPassword ? 'Updating...' : 'Change Password'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: ADD NEW ADDRESS */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Add New Delivery Address</h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Street Address &amp; House/Flat No. *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 402, Royal Palms, Whitefield Main Rd"
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">City *</label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">State *</label>
                  <input
                    type="text"
                    required
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={newAddress.zipCode}
                    onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="font-bold text-slate-700">Address Label:</label>
                {['Home', 'Work', 'Other'].map((t) => (
                  <label key={t} className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="tag"
                      checked={newAddress.tag === t}
                      onChange={() => setNewAddress({ ...newAddress, tag: t })}
                      className="accent-[#0c2a5e]"
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0c2a5e] text-white font-bold hover:bg-[#153e85]"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: WALLET WITHDRAWAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Withdraw Wallet Funds</h3>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex justify-between items-center">
                <span className="text-slate-600">Available to Withdraw:</span>
                <strong className="text-sm font-extrabold text-[#0c2a5e]">
                  ₹{(user?.walletBalance || 0).toLocaleString('en-IN')}
                </strong>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Withdrawal Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="100"
                  max={user?.walletBalance || 0}
                  placeholder="Min ₹100"
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Payout Method *</label>
                <select
                  value={withdrawForm.method}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, method: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                >
                  <option value="UPI">UPI Transfer (GooglePay / PhonePe / Paytm)</option>
                  <option value="Bank">Direct NEFT / IMPS Bank Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  {withdrawForm.method === 'UPI' ? 'UPI ID (VPA) *' : 'Bank Account Number & IFSC *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={withdrawForm.method === 'UPI' ? 'e.g. 9876543210@upi' : 'e.g. Acct: 1234567890, IFSC: HDFC0001234'}
                  value={withdrawForm.details}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, details: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  Submit Payout Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
