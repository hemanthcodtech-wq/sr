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
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import Logo from '../Logo';
import NotificationDropdown from '../NotificationDropdown';
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

  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    fetchStore();
    fetchPendingOrdersCount();

    // Listen for live order updates
    const handleOrdersUpdated = () => fetchPendingOrdersCount();
    window.addEventListener('orders-updated', handleOrdersUpdated);
    const interval = setInterval(fetchPendingOrdersCount, 12000);

    return () => {
      window.removeEventListener('orders-updated', handleOrdersUpdated);
      clearInterval(interval);
    };
  }, []);

  const fetchPendingOrdersCount = async () => {
    try {
      const res = await api.get('/orders/vendor/orders');
      if (res.data?.success) {
        const orders = res.data.orders || [];
        const pending = orders.filter((o) => {
          if (o.status === 'Processing') return true;
          return o.items?.some((it) => it.deliveryStatus === 'Processing');
        }).length;
        setPendingOrdersCount(pending);
      }
    } catch (e) {
      // quiet fallback
    }
  };

  const fetchStore = async () => {
    try {
      const res = await api.get('/vendors/my-store');
      if (res.data?.success) {
        setStoreData(res.data);
        if (res.data.store) {
          setStoreFormData({
            storeName: res.data.store.storeName || '',
            category: res.data.store.category || 'Electronics',
            phone: res.data.store.phone || '',
            description: res.data.store.description || '',
            address: {
              street: res.data.store.address?.street || '',
              landmark: res.data.store.address?.landmark || '',
              city: res.data.store.address?.city || '',
              state: res.data.store.address?.state || '',
              zipCode: res.data.store.address?.zipCode || '',
            },
            bankDetails: {
              accountHolder: res.data.store.bankDetails?.accountHolder || '',
              bankName: res.data.store.bankDetails?.bankName || '',
              accountNumber: res.data.store.bankDetails?.accountNumber || '',
              ifscCode: res.data.store.bankDetails?.ifscCode || '',
              upiId: res.data.store.bankDetails?.upiId || '',
            },
          });
        }
      }
    } catch (err) {
      console.error('Error fetching store in layout:', err);
    }
  };

  const openRenewModal = async () => {
    setRenewModalOpen(true);
    setPlansLoading(true);
    try {
      const res = await api.get('/plans');
      if (res.data?.success && res.data.plans?.length > 0) {
        setPlans(res.data.plans);
        setSelectedPlan(res.data.plans[0]);
      }
    } catch (err) {
      error('Failed to load subscription plans');
    } finally {
      setPlansLoading(false);
    }
  };

  const handleRenewPlan = async () => {
    if (!selectedPlan) return;
    setRenewing(true);
    try {
      const res = await api.post('/vendors/renew-plan', {
        planId: selectedPlan._id,
        paymentReference: `RNW-${Date.now().toString().slice(-6)}`,
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
      shortTitle: 'Home',
      path: '/vendor/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Products & Inventory',
      shortTitle: 'Catalog',
      path: '/vendor/products',
      icon: Package,
    },
    {
      title: 'Orders & Shipments',
      shortTitle: 'Orders',
      path: '/vendor/orders',
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} NEW` : null,
      badgeColor: 'bg-rose-500 text-white animate-pulse',
    },
    {
      title: 'Promote & Earn',
      shortTitle: 'Promote',
      path: '/vendor/promote',
      icon: Sparkles,
      badge: '50% Cut',
    },
    {
      title: 'Wallet & Bank Payouts',
      shortTitle: 'Wallet',
      path: '/vendor/wallet',
      icon: Wallet,
    },
    {
      title: 'Store Profile & Bank',
      shortTitle: 'Profile',
      path: '/vendor/profile',
      icon: Store,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-amber-50/20 text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900 relative pb-16 lg:pb-0">
      {/* Decorative ambient background mesh blobs */}
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-1/3 w-80 h-80 bg-amber-200/15 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 1. Top Vendor Header - Modern, Clean & Fully Responsive */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-white/90 sticky top-0 z-40 px-3.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-3 shadow-[0_2px_15px_rgba(0,0,0,0.03)]">
        {/* Left: Mobile Toggle + Logo + Motto */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden p-1.5 rounded-xl text-slate-600 hover:bg-slate-100/80 transition cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/vendor/dashboard" className="flex items-center gap-2 group">
            <div className="relative flex items-center">
              <img
                src="/logo.png"
                alt="SR Logo"
                className="h-9 sm:h-10 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.45)] group-hover:scale-105 transition-transform"
              />
            </div>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 shadow-2xs">
              Vendor Hub
            </span>
          </Link>

          <div className="hidden xl:flex items-center gap-2 text-xs font-semibold text-slate-500 border-l border-slate-200/80 pl-4">
            <span className="text-[#0c2a5e]">Sell Products</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-600 font-bold">Promote &amp; Earn</span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-600 font-bold">Grow Together</span>
          </div>
        </div>

        {/* Right: Quick Actions, Wallet Pill, Notifications & Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Quick Add Product Button */}
          <Link
            to="/vendor/products"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold shadow-xs transition cursor-pointer"
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
            <span className="font-extrabold text-xs">₹{walletBalance.toLocaleString('en-IN', { maximumFractionDigits: 1 })}</span>
          </Link>

          {/* Store Settings Button (Direct Page) */}
          <Link
            to="/vendor/profile"
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/90 border border-slate-200/80 text-slate-700 hover:bg-slate-50 transition cursor-pointer font-bold shadow-2xs"
            title="Store Profile & Settings"
          >
            <Store className="w-3.5 h-3.5 text-[#0c2a5e]" />
            <span>Store Profile</span>
          </Link>

          {/* Real-time Notification Bell Dropdown */}
          <NotificationDropdown variant="light" role="vendor" />

          {/* Vendor Profile Avatar Pill */}
          <Link
            to="/vendor/profile"
            className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-slate-200 hover:opacity-80 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0c2a5e] to-[#174896] text-white flex items-center justify-center shadow-xs overflow-hidden shrink-0 font-bold text-xs border border-slate-200">
              {(user?.avatar || store?.logo) ? (
                <img src={user?.avatar || store?.logo} alt="Avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                (storeName || user?.name || 'V').slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="hidden lg:block text-left leading-tight">
              <div className="font-bold text-slate-900 text-xs truncate max-w-[120px]">{storeName}</div>
              <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Verified Merchant</span>
              </div>
            </div>
          </Link>
        </div>
      </header>

      {/* 2. Body Container: Light Frosted Glass Sidebar + Main Content Area */}
      <div className="flex-1 flex min-w-0 items-start">
        {/* Light Frosted Glass Left Sidebar (Desktop) */}
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
            <div
              className={`p-3 rounded-2xl bg-white/70 border border-slate-200/80 shadow-2xs backdrop-blur-xs flex items-center ${
                sidebarCollapsed ? 'justify-center' : 'gap-3'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
                {store?.logo ? (
                  <img
                    src={store.logo}
                    alt={storeName}
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
                  <div className="font-bold text-xs text-slate-900 truncate">{storeName}</div>
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
                    {!sidebarCollapsed && (
                      <span className="truncate flex-1 flex items-center justify-between">
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ml-1.5 shadow-2xs ${
                            item.badgeColor || 'bg-amber-400 text-slate-950'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Plan Status & Renewal Card */}
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
                      to={`/stores/${store.vendor?._id || store.vendor || store._id}`}
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
                  <div className="flex items-center gap-2">
                    <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-amber-400 text-slate-950">
                      Vendor Hub
                    </span>
                  </div>
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
                        <span className="flex-1 flex items-center justify-between">
                          <span>{item.title}</span>
                          {item.badge && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                              {item.badge}
                            </span>
                          )}
                        </span>
                      </Link>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      openRenewModal();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-emerald-700 bg-emerald-50 text-left font-bold cursor-pointer"
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
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {/* Header Title & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-200/80">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {title}
              </h1>
              {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 sm:gap-3 shrink-0">{actions}</div>}
          </div>

          {children}
        </main>
      </div>

      {/* 3. Mobile Vendor Bottom Navigation Bar */}
      <nav
        aria-label="Vendor Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden flex items-center justify-around px-2 py-1.5"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all rounded-xl relative ${
                isActive
                  ? 'text-amber-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[58px]">
                {item.shortTitle || item.title.split(' ')[0]}
              </span>
            </Link>
          );
        })}
      </nav>

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
                    <label className="font-bold text-slate-700 block mb-1">Category</label>
                    <select
                      value={storeFormData.category}
                      onChange={(e) => setStoreFormData({ ...storeFormData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Fashion">Fashion &amp; Apparel</option>
                      <option value="Footwear">Footwear</option>
                      <option value="Home &amp; Kitchen">Home &amp; Kitchen</option>
                      <option value="Beauty">Beauty &amp; Personal Care</option>
                      <option value="General">General Store</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Support Phone *</label>
                    <input
                      type="tel"
                      required
                      value={storeFormData.phone}
                      onChange={(e) => setStoreFormData({ ...storeFormData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Dispatch Address */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] block">2. Dispatch &amp; Return Address</span>
                <div className="space-y-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Street Address, Unit / Shop No. *"
                    value={storeFormData.address.street}
                    onChange={(e) =>
                      setStoreFormData({
                        ...storeFormData,
                        address: { ...storeFormData.address, street: e.target.value },
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      required
                      placeholder="City *"
                      value={storeFormData.address.city}
                      onChange={(e) =>
                        setStoreFormData({
                          ...storeFormData,
                          address: { ...storeFormData.address, city: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                    <input
                      type="text"
                      required
                      placeholder="State *"
                      value={storeFormData.address.state}
                      onChange={(e) =>
                        setStoreFormData({
                          ...storeFormData,
                          address: { ...storeFormData.address, state: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Postal PIN *"
                      value={storeFormData.address.zipCode}
                      onChange={(e) =>
                        setStoreFormData({
                          ...storeFormData,
                          address: { ...storeFormData.address, zipCode: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                </div>
              </div>

              {/* Settlement Bank Details */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <span className="font-black text-slate-800 uppercase tracking-wider text-[11px] block">3. Settlement Bank Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Holder Name *</label>
                    <input
                      type="text"
                      required
                      value={storeFormData.bankDetails.accountHolder}
                      onChange={(e) =>
                        setStoreFormData({
                          ...storeFormData,
                          bankDetails: { ...storeFormData.bankDetails, accountHolder: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bank Name *</label>
                    <input
                      type="text"
                      required
                      value={storeFormData.bankDetails.bankName}
                      onChange={(e) =>
                        setStoreFormData({
                          ...storeFormData,
                          bankDetails: { ...storeFormData.bankDetails, bankName: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Number *</label>
                    <input
                      type="text"
                      required
                      value={storeFormData.bankDetails.accountNumber}
                      onChange={(e) =>
                        setStoreFormData({
                          ...storeFormData,
                          bankDetails: { ...storeFormData.bankDetails, accountNumber: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">IFSC Code *</label>
                    <input
                      type="text"
                      required
                      value={storeFormData.bankDetails.ifscCode}
                      onChange={(e) =>
                        setStoreFormData({
                          ...storeFormData,
                          bankDetails: { ...storeFormData.bankDetails, ifscCode: e.target.value.toUpperCase() },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 block mb-1">UPI ID (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. storename@okaxis"
                      value={storeFormData.bankDetails.upiId}
                      onChange={(e) =>
                        setStoreFormData({
                          ...storeFormData,
                          bankDetails: { ...storeFormData.bankDetails, upiId: e.target.value },
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                  className="px-6 py-2.5 rounded-xl bg-[#0c2a5e] hover:bg-[#174896] text-white font-black shadow-md transition cursor-pointer disabled:bg-slate-400"
                >
                  {savingStore ? 'Saving Changes...' : 'Save Store Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          STORE SUBSCRIPTION PLAN RENEWAL MODAL
         ===================================================================== */}
      {renewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/80 shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Renew Store Listing Plan</h3>
                  <p className="text-xs text-slate-500">Keep your products active on the SR Marketplace portal</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRenewModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {plansLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading available plans...</div>
            ) : plans.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plans.map((p) => {
                    const isSelected = selectedPlan?._id === p._id;
                    return (
                      <div
                        key={p._id}
                        onClick={() => setSelectedPlan(p)}
                        className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
                          isSelected
                            ? 'border-[#0c2a5e] bg-blue-50/50 shadow-xs'
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
