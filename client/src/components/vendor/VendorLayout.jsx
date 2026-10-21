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
  Copy,
  Check,
  TrendingUp,
} from 'lucide-react';
import Logo from '../Logo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const VendorLayout = ({
  children,
  title = 'Vendor Portal',
  subtitle = 'Manage your store catalog, customer shipments, and earnings',
  actions = null,
}) => {
  const { user, logout } = useAuth();
  const { showToast, success, info } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [storeData, setStoreData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchStore = async () => {
      try {
        const res = await api.get('/vendors/my-store');
        if (res.data?.success && isMounted) {
          setStoreData(res.data);
        }
      } catch (e) {
        // Fallback gracefully to user object
      }
    };
    fetchStore();
    return () => {
      isMounted = false;
    };
  }, []);

  const store = storeData?.store || user?.store;
  const storeName = store?.storeName || 'SR Merchant Store';
  const referralCode = user?.referralCode || store?.referralCode || 'SR-VENDOR1';
  const referralUrl = `${window.location.origin}/vendor/register?ref=${referralCode}`;
  const walletBalance = user?.walletBalance || 5820;

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
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex flex-col font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* 1. Top Vendor Header */}
      <header className="bg-white border-b border-slate-200/90 sticky top-0 z-30 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 shadow-2xs">
        {/* Left: Mobile Toggle + Logo + Motto */}
        <div className="flex items-center gap-3 sm:gap-6">
          <button
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Logo variant="vendor" size="sm" />

          <div className="hidden xl:flex items-center gap-2 text-xs font-semibold text-slate-500 border-l border-slate-200 pl-4">
            <span className="text-[#0c2a5e]">Sell Products</span>
            <span className="text-slate-300">•</span>
            <span className="text-amber-600 font-bold">Promote & Earn</span>
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold hover:bg-emerald-100 transition"
            title="Available Wallet Balance"
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-extrabold">₹{walletBalance.toLocaleString('en-IN')}</span>
          </Link>

          {/* Notification Bell */}
          <button
            onClick={() => showToast('All merchant services operating nominally.', 'info')}
            className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 bg-amber-500 text-slate-950 text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white">
              3
            </span>
          </button>

          {/* Vendor Profile Avatar Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-900 border border-amber-400/50 p-0.5 flex items-center justify-center shadow-xs overflow-hidden flex-shrink-0">
              <img
                src={
                  store?.logo ||
                  user?.avatar ||
                  '/logo.png'
                }
                alt="Store Avatar"
                className="w-full h-full object-cover rounded-full"
                onError={(e) => {
                  e.target.src = '/logo.png';
                }}
              />
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

      {/* 2. Body Container: Left Navy Sidebar + Main Content Area */}
      <div className="flex-1 flex min-w-0">
        {/* Navy Left Sidebar (Desktop) */}
        <aside className="w-64 bg-[#071328] text-slate-300 hidden lg:flex flex-col justify-between py-5 px-3 flex-shrink-0 select-none border-r border-slate-800">
          <div>
            {/* Store Profile Card */}
            <div className="mb-4 p-3 rounded-2xl bg-slate-900/80 border border-amber-500/20 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-slate-950 border border-amber-400/50 p-1 flex items-center justify-center flex-shrink-0 shadow-inner">
                <img
                  src={store?.logo || '/logo.png'}
                  alt="Store Logo"
                  className="w-full h-full object-contain filter drop-shadow-xs"
                  onError={(e) => {
                    e.target.src = '/logo.png';
                  }}
                />
              </div>
              <div className="overflow-hidden leading-tight flex-1">
                <div className="font-extrabold text-xs text-white truncate">{storeName}</div>
                <div className="text-[10px] text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span>SR Verified</span>
                </div>
              </div>
            </div>

            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
              MERCHANT WORKSPACE
            </div>

            {/* Navigation Menu */}
            <nav className="space-y-1 text-xs font-semibold">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition duration-150 group ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md shadow-amber-500/20'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                        isActive ? 'text-slate-950' : 'text-amber-400/80 group-hover:text-amber-300'
                      }`}
                    />
                    <span className="truncate">{item.title}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Plan Status Card */}
            {storeData?.store?.planExpiresAt && (
              <div className="mt-5 p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/30 text-left space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-white">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Store Plan Active</span>
                  </span>
                  <span className="text-amber-400">{storeData?.daysRemaining || 30}d</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Public listing verified on SR Marketplace storefront.
                </p>
                {store?._id && (
                  <Link
                    to={`/store/${store._id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 hover:text-amber-200 mt-1"
                  >
                    <span>View Public Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Bottom Promote Banner & Sign Out */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            {/* Promote Our Store Mini Card */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 rounded-2xl p-3 text-center space-y-2 border border-amber-500/30 shadow-xs">
              <div className="w-9 h-9 rounded-full bg-slate-950 border border-amber-400/60 p-1 mx-auto flex items-center justify-center">
                <img src="/logo.png" alt="SR Brand" className="w-full h-full object-contain" />
              </div>
              <div className="text-[11px] font-black text-amber-300 leading-tight">
                Promote &amp; Earn Rewards
              </div>
              <p className="text-[9.5px] text-slate-400 leading-snug">
                Earn ₹500 referral bonus for each merchant onboarded.
              </p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-[10px] rounded-lg transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? 'Copied Link!' : 'Copy Referral Link'}</span>
              </button>
            </div>

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Drawer (Visible on < lg) */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 bg-[#071328] text-slate-200 shadow-2xl flex flex-col justify-between z-50 p-4">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <Logo variant="vendor" size="sm" theme="dark" />
                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 cursor-pointer"
                    aria-label="Close sidebar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Store Profile */}
                <div className="my-4 p-3 rounded-2xl bg-slate-900 border border-amber-500/30 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-950 border border-amber-400/50 p-1 flex items-center justify-center">
                    <img src={store?.logo || '/logo.png'} alt="Store" className="w-full h-full object-contain" />
                  </div>
                  <div className="overflow-hidden leading-tight">
                    <span className="font-extrabold text-xs text-white truncate block">{storeName}</span>
                    <span className="text-[10px] text-amber-400 font-semibold">Verified Merchant</span>
                  </div>
                </div>

                {/* Mobile Navigation */}
                <nav className="space-y-1 text-xs font-semibold">
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
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4 text-amber-400" />
                        <span>{item.title}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-2">
                <Link
                  to="/"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-amber-400"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Public Storefront</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {/* Header Title & Actions Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200">
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
    </div>
  );
};

export default VendorLayout;
