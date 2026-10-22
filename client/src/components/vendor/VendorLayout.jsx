import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Wallet,
  Share2,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Bell,
  Plus,
  Store,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  TrendingUp,
  Sparkles,
  RefreshCw,
  CreditCard,
  Building,
  MapPin,
  Phone,
  FileText,
  Clock,
  Zap,
} from 'lucide-react';
import Logo from '../Logo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const VendorLayout = ({
  children,
  title = 'Merchant Dashboard',
  subtitle = 'Manage your store catalog, customer shipments, and earnings',
  actions = null,
}) => {
  const { user, logout } = useAuth();
  const { showToast, success, error, info } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [storeData, setStoreData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Store Profile & Settings Modal
  const [storeSettingsModalOpen, setStoreSettingsModalOpen] = useState(false);
  const [savingStore, setSavingStore] = useState(false);
  const [storeFormData, setStoreFormData] = useState({
    storeName: '',
    category: 'Electronics',
    phone: '',
    description: '',
    address: { street: '', landmark: '', city: '', state: '', zipCode: '' },
    bankDetails: { accountHolder: '', bankName: '', accountNumber: '', ifscCode: '', upiId: '' },
  });

  // Plan Renewal Modal
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plansLoading, setPlansLoading] = useState(false);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const res = await api.get('/vendors/my-store');
      if (res.data?.success) {
        setStoreData(res.data);
        const s = res.data.store;
        if (s) {
          setStoreFormData({
            storeName: s.storeName || '',
            category: s.category || 'General',
            phone: s.phone || '',
            description: s.description || '',
            address: {
              street: s.address?.street || '',
              landmark: s.address?.landmark || '',
              city: s.address?.city || '',
              state: s.address?.state || 'Andhra Pradesh',
              zipCode: s.address?.zipCode || '',
            },
            bankDetails: {
              accountHolder: s.bankDetails?.accountHolder || '',
              bankName: s.bankDetails?.bankName || '',
              accountNumber: s.bankDetails?.accountNumber || '',
              ifscCode: s.bankDetails?.ifscCode || '',
              upiId: s.bankDetails?.upiId || '',
            },
          });
        }
      }
    } catch (e) {
      console.warn('Could not fetch store data:', e);
    }
  };

  const openRenewModal = async () => {
    setRenewModalOpen(true);
    setPlansLoading(true);
    try {
      const res = await api.get('/plans');
      if (res.data?.success && Array.isArray(res.data.plans)) {
        const active = res.data.plans.filter((p) => p.isActive !== false);
        setPlans(active);
        if (active.length > 0) {
          setSelectedPlan(active[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to load plans:', err);
    } finally {
      setPlansLoading(false);
    }
  };

  const handleRenewPlan = async () => {
    if (!selectedPlan) {
      error('Please select a membership plan to renew');
      return;
    }

    setRenewing(true);
    try {
      // Direct renewal endpoint
      const res = await api.post('/vendors/renew-plan', {
        planId: selectedPlan._id,
        razorpayPaymentId: `sim_pay_${Date.now()}`,
        razorpayOrderId: `sim_ord_${Date.now()}`,
        razorpaySignature: 'sim_sig_verified_ok',
      });

      if (res.data?.success) {
        success(res.data.message || 'Store plan renewed successfully!');
        setRenewModalOpen(false);
        fetchStore();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Plan renewal failed. Please try again.');
    } finally {
      setRenewing(false);
    }
  };

  const handleSaveStoreSettings = async (e) => {
    e.preventDefault();
    setSavingStore(true);
    try {
      const res = await api.put('/vendors/my-store', storeFormData);
      if (res.data?.success) {
        success('Store profile & bank details saved successfully!');
        setStoreSettingsModalOpen(false);
        fetchStore();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update store');
    } finally {
      setSavingStore(false);
    }
  };

  const store = storeData?.store || (typeof user?.store === 'object' ? user.store : null);
  const storeName = store?.storeName || user?.store?.storeName || (user?.name ? `${user.name}'s Store` : 'SR Merchant Store');
  const referralCode = user?.referralCode || store?.referralCode || 'SR-VENDOR1';
  const referralUrl = `${window.location.origin}/vendor/register?ref=${referralCode}`;
  const walletBalance = user?.walletBalance ?? storeData?.vendor?.walletBalance ?? 0;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    success('Referral link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleLogout = () => {
    logout();
    showToast('Signed out of Vendor Portal', 'info');
    navigate('/login');
  };

  const navItems = [
    {
      title: 'Dashboard Overview',
      path: '/vendor/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Products & Inventory',
      path: '/vendor/products',
      icon: Package,
    },
    {
      title: 'Orders & Shipments',
      path: '/vendor/orders',
      icon: ShoppingBag,
    },
    {
      title: 'Wallet & Bank Payouts',
      path: '/vendor/wallet',
      icon: Wallet,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-amber-50/20 text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900 relative">
      {/* Decorative ambient background mesh blobs */}
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-1/3 w-80 h-80 bg-amber-200/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 1. Top Vendor Header - Sticky Glassmorphism */}
      <header className="bg-white/85 backdrop-blur-xl border-b border-white/80 sticky top-0 z-40 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
        {/* Left: Mobile Toggle + Logo + Motto */}
        <div className="flex items-center gap-3 sm:gap-6">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100/80 transition cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Logo variant="vendor" size="sm" />

          <div className="hidden xl:flex items-center gap-2 text-xs font-semibold text-slate-500 border-l border-slate-200/80 pl-4">
            <span className="text-[#0c2a5e]">Sell Products</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-600 font-bold">Promote &amp; Earn</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-600 font-bold">Grow Together</span>
          </div>
        </div>

        {/* Right: Quick Actions, Wallet Pill, Notifications & Avatar */}
        <div className="flex items-center gap-2.5 sm:gap-4 text-xs">
          {/* Quick Add Product Button */}
          <Link
            to="/vendor/products"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>

          {/* Quick Wallet Pill */}
          <Link
            to="/vendor/wallet"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50/90 border border-emerald-200/80 text-emerald-800 font-bold hover:bg-emerald-100 transition shadow-2xs"
            title="Available Wallet Balance"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-extrabold">₹{walletBalance.toLocaleString('en-IN')}</span>
          </Link>

          {/* Store Settings Button */}
          <button
            type="button"
            onClick={() => setStoreSettingsModalOpen(true)}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/90 border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition cursor-pointer font-bold shadow-2xs"
            title="Store Profile & Settings"
          >
            <Store className="w-3.5 h-3.5 text-[#0c2a5e]" />
            <span>Store Profile</span>
          </button>

          {/* Vendor Profile Avatar Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0c2a5e] to-[#174896] text-white flex items-center justify-center shadow-xs overflow-hidden flex-shrink-0 font-black text-xs border border-slate-200">
              {(user?.avatar || store?.logo) ? (
                <img src={user?.avatar || store?.logo} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                (storeName || user?.name || 'V').slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="hidden md:block text-left leading-tight">
              <div className="font-bold text-slate-900 text-xs truncate max-w-[130px]">{storeName}</div>
              <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Verified Merchant</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Body Container: Light Frosted Glass Sidebar + Main Content Area */}
      <div className="flex-1 flex min-w-0 items-start">
        {/* Light Frosted Glass Left Sidebar (Desktop) - Collapsible and Sticky with Smooth Scroll */}
        <aside
          className={`${
            sidebarCollapsed ? 'w-20' : 'w-64'
          } bg-white/80 backdrop-blur-2xl text-slate-700 hidden lg:flex flex-col justify-between select-none border-r border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 ease-in-out shrink-0 sticky top-[57px] h-[calc(100vh-57px)] z-30`}
        >
          {/* Scrollable Container with custom sleek scrollbar */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
            {/* Collapse / Expand Toggle Button Bar */}
            <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-1 pb-1`}>
              {!sidebarCollapsed && (
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                  MERCHANT WORKSPACE
                </div>
              )}
              <button
                type="button"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Store Profile Card */}
            <div className={`p-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-2xs flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0c2a5e] to-[#174896] text-white font-black text-xs flex items-center justify-center shrink-0 shadow-inner overflow-hidden border border-slate-200">
                {(user?.avatar || store?.logo) ? (
                  <img
                    src={user?.avatar || store?.logo}
                    alt="Profile / Store Pic"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  (storeName || 'SR').slice(0, 2).toUpperCase()
                )}
              </div>
              {!sidebarCollapsed && (
                <div className="overflow-hidden leading-tight flex-1">
                  <div className="font-black text-xs text-slate-900 truncate">{storeName}</div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">SR Verified Store</span>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1.5 text-xs font-bold">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center ${
                      sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5'
                    } rounded-xl transition duration-150 group ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-500/10 text-amber-950 font-black border border-amber-300/60 shadow-xs'
                        : 'text-slate-600 hover:bg-white/80 hover:text-slate-900 hover:shadow-2xs'
                    }`}
                    title={sidebarCollapsed ? item.title : undefined}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-amber-600' : 'text-slate-400 group-hover:text-[#0c2a5e]'
                      }`}
                    />
                    {!sidebarCollapsed && <span className="truncate">{item.title}</span>}
                  </Link>
                );
              })}

              {/* Store Profile & Bank Details quick modal button */}
              <button
                type="button"
                onClick={() => setStoreSettingsModalOpen(true)}
                className={`w-full flex items-center ${
                  sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-3 py-2.5'
                } rounded-xl transition duration-150 text-slate-600 hover:bg-white/80 hover:text-slate-900 cursor-pointer text-left hover:shadow-2xs`}
                title={sidebarCollapsed ? 'Store Profile & Bank' : undefined}
              >
                <Store className="w-4 h-4 text-slate-400 shrink-0" />
                {!sidebarCollapsed && <span className="truncate">Store Profile &amp; Bank</span>}
              </button>
            </nav>

            {/* Plan Status & Renewal Card (Collapsed view icon / Full view card) */}
            {!sidebarCollapsed ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white/90 border border-emerald-200/80 text-left space-y-2 shadow-2xs backdrop-blur-md">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                    <span>Store Plan Active</span>
                  </span>
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md text-[10px]">
                    {storeData?.daysRemaining ? `${storeData.daysRemaining}d left` : 'Active'}
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-600 leading-snug">
                  Verified storefront listed on SR Marketplace panel.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={openRenewModal}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-gradient-to-r from-[#0c2a5e] to-[#174896] hover:from-[#081c40] hover:to-[#123875] text-white font-black text-[10.5px] flex items-center justify-center gap-1 transition shadow-xs cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3 text-amber-300" />
                    <span>Renew Plan</span>
                  </button>
                  {store?._id && (
                    <Link
                      to={`/store/${store._id}`}
                      target="_blank"
                      className="p-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-[#0c2a5e] hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                      title="View Public Storefront"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={openRenewModal}
                className="w-full py-2.5 flex items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
                title="Renew Store Plan"
              >
                <RefreshCw className="w-4 h-4 text-emerald-600" />
              </button>
            )}

            {/* Bottom Promote Banner & Sign Out */}
            <div className="pt-2 border-t border-slate-200/80 space-y-2">
              {!sidebarCollapsed ? (
                <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/60 rounded-2xl p-3 text-center space-y-1.5 border border-blue-200/80 shadow-2xs backdrop-blur-xs">
                  <div className="text-[11px] font-black text-[#0c2a5e]">
                    Invite Vendors &amp; Earn ₹200
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    Earn ₹200 instant reward when a merchant activates their store using your code.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-[10px] rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Invite Link'}</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full py-2.5 flex items-center justify-center rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition cursor-pointer"
                  title="Copy Invite Link (Earn ₹200)"
                >
                  <Share2 className="w-4 h-4 text-blue-600" />
                </button>
              )}

              {/* Logout Action */}
              <button
                onClick={handleLogout}
                className={`w-full flex items-center ${
                  sidebarCollapsed ? 'justify-center py-2.5' : 'gap-2.5 px-3 py-2'
                } rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer`}
                title={sidebarCollapsed ? 'Sign Out' : undefined}
              >
                <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
                {!sidebarCollapsed && <span>Sign Out</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Drawer (Visible on < lg) */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 bg-white/95 backdrop-blur-2xl text-slate-800 shadow-2xl flex flex-col justify-between z-50 p-4 border-r border-white/60">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <Logo variant="vendor" size="sm" />
                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                    aria-label="Close sidebar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Store Profile */}
                <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0c2a5e] to-[#174896] text-white flex items-center justify-center font-black text-xs">
                    {(storeName || 'SR').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="overflow-hidden leading-tight">
                    <span className="font-extrabold text-xs text-slate-900 truncate block">{storeName}</span>
                    <span className="text-[10px] text-emerald-600 font-bold">Verified Merchant</span>
                  </div>
                </div>

                {/* Mobile Navigation */}
                <nav className="space-y-1 text-xs font-bold">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileDrawerOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-amber-500/10 text-amber-950 font-black border border-amber-300/60'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-amber-600" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      setStoreSettingsModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-left font-bold"
                  >
                    <Store className="w-4 h-4 text-slate-400" />
                    <span>Store Profile &amp; Bank</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      openRenewModal();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-emerald-700 bg-emerald-50 text-left font-bold"
                  >
                    <RefreshCw className="w-4 h-4 text-emerald-600" />
                    <span>Renew Store Plan</span>
                  </button>
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-2">
                <Link
                  to="/"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-[#0c2a5e]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Public Storefront</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area - Light Morphism */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {/* Header Title & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200/80">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                {title}
              </h1>
              {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
          </div>

          {children}
        </main>
      </div>

      {/* =====================================================================
          STORE PROFILE & SETTLEMENT BANK SETTINGS MODAL
         ===================================================================== */}
      {storeSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-[#0c2a5e]">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Store Profile &amp; Settlement Bank</h3>
                  <p className="text-xs text-slate-500">Update your store information, physical dispatch address, and payout bank account</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStoreSettingsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStoreSettings} className="space-y-5 text-xs">
              {/* Store Details */}
              <div className="space-y-3">
                <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] block">1. Store Profile</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Store Name *</label>
                    <input
                      type="text"
                      required
                      value={storeFormData.storeName}
                      onChange={(e) => setStoreFormData({ ...storeFormData, storeName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Store Phone *</label>
                    <input
                      type="tel"
                      required
                      value={storeFormData.phone}
                      onChange={(e) => setStoreFormData({ ...storeFormData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Store Description</label>
                  <textarea
                    rows={2}
                    value={storeFormData.description}
                    onChange={(e) => setStoreFormData({ ...storeFormData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                  />
                </div>
              </div>

              {/* Physical Dispatch Address */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] block">2. Physical Dispatch Hub Address</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Street / Shop Address *</label>
                    <input
                      type="text"
                      value={storeFormData.address.street}
                      onChange={(e) => setStoreFormData({ ...storeFormData, address: { ...storeFormData.address, street: e.target.value } })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">City / Town *</label>
                    <input
                      type="text"
                      value={storeFormData.address.city}
                      onChange={(e) => setStoreFormData({ ...storeFormData, address: { ...storeFormData.address, city: e.target.value } })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Settlement Details */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] block">3. Settlement Bank Account Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Holder Name *</label>
                    <input
                      type="text"
                      value={storeFormData.bankDetails.accountHolder}
                      onChange={(e) => setStoreFormData({ ...storeFormData, bankDetails: { ...storeFormData.bankDetails, accountHolder: e.target.value } })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bank Name *</label>
                    <input
                      type="text"
                      value={storeFormData.bankDetails.bankName}
                      onChange={(e) => setStoreFormData({ ...storeFormData, bankDetails: { ...storeFormData.bankDetails, bankName: e.target.value } })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Number *</label>
                    <input
                      type="text"
                      value={storeFormData.bankDetails.accountNumber}
                      onChange={(e) => setStoreFormData({ ...storeFormData, bankDetails: { ...storeFormData.bankDetails, accountNumber: e.target.value } })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">IFSC Code *</label>
                    <input
                      type="text"
                      value={storeFormData.bankDetails.ifscCode}
                      onChange={(e) => setStoreFormData({ ...storeFormData, bankDetails: { ...storeFormData.bankDetails, ifscCode: e.target.value.toUpperCase() } })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStoreSettingsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingStore}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0c2a5e] to-[#174896] text-white font-black shadow-md hover:from-[#092048] hover:to-[#123875] transition cursor-pointer disabled:bg-slate-400"
                >
                  {savingStore ? 'Saving Details...' : 'Save Store Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          PLAN SUBSCRIPTION RENEWAL MODAL
         ===================================================================== */}
      {renewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Renew Store Subscription Plan</h3>
                  <p className="text-xs text-slate-500">Extend your marketplace listing validity and maintain public store visibility</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRenewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {plansLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-36 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : plans.length > 0 ? (
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-700">Choose Membership Plan:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {plans.map((p) => {
                    const isSelected = selectedPlan?._id === p._id;
                    return (
                      <div
                        key={p._id}
                        onClick={() => setSelectedPlan(p)}
                        className={`p-4 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-[#0c2a5e] bg-blue-50/70 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-base text-slate-900 capitalize">{p.title}</span>
                            {isSelected && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#0c2a5e]">
                                Selected
                              </span>
                            )}
                          </div>
                          <div className="flex items-baseline gap-1 pt-1">
                            <span className="text-2xl font-black text-[#0c2a5e]">₹{p.price?.toLocaleString('en-IN')}</span>
                            <span className="text-xs text-slate-500 font-bold">/ {p.durationDays} Days</span>
                          </div>
                          <p className="text-[11px] text-slate-600 pt-1">{p.description || 'Verified merchant listing on SR Multi-Vendor panel'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setRenewModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRenewPlan}
                    disabled={renewing || !selectedPlan}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md transition cursor-pointer disabled:bg-slate-400 flex items-center gap-2"
                  >
                    {renewing ? (
                      <span>Activating Renewal...</span>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Pay ₹{selectedPlan?.price} &amp; Renew Store Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No active plans configured by administration at this moment.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorLayout;
