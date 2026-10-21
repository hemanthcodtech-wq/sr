import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingBag,
  CreditCard,
  Sliders,
  Settings,
  Bell,
  ChevronsLeft,
  ChevronsRight,
  Menu,
  X,
  LogOut,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Logo from '../Logo';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const AdminLayout = ({ children, title = 'Dashboard Overview', subtitle = '', onRefresh }) => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Sidebar collapse state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sr_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  // Mobile drawer open state
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Fetch pending applications count for live alerts & sidebar badges
  const fetchPendingApprovals = async () => {
    try {
      const res = await api.get('/admin/applications');
      if (res.data?.success) {
        const count = (res.data.applications || []).filter(
          (a) => a.status === 'pending_admin_approval' || a.status === 'pending'
        ).length;
        setPendingApprovalsCount(count);
      }
    } catch (err) {
      // Quiet fail if network glitch
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
    const interval = setInterval(fetchPendingApprovals, 12000);
    const handleUpdate = () => fetchPendingApprovals();
    window.addEventListener('vendor-approvals-changed', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('vendor-approvals-changed', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, []);

  const toggleSidebarCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('sr_admin_sidebar_collapsed', String(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    showToast('Signed out of Admin Console', 'info');
    navigate('/admin/login');
  };

  const handleRefreshClick = async () => {
    setRefreshing(true);
    await fetchPendingApprovals();
    if (onRefresh) {
      await onRefresh();
    } else {
      showToast('Admin data synchronized with live server', 'success');
    }
    setTimeout(() => setRefreshing(false), 500);
  };

  const navItems = [
    {
      title: 'Dashboard',
      path: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      title: 'Vendors',
      path: '/admin/vendors',
      icon: Store,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : null,
      badgeAlert: pendingApprovalsCount > 0,
    },
    {
      title: 'Products',
      path: '/admin/products',
      icon: Package,
    },
    {
      title: 'Order History',
      path: '/admin/orders',
      icon: ShoppingBag,
    },
    {
      title: 'Vendor Plans',
      path: '/admin/plans',
      icon: CreditCard,
    },
    {
      title: 'Settlements',
      path: '/admin/settlements',
      icon: Sliders,
    },
    {
      title: 'Settings',
      path: '/admin/settings',
      icon: Settings,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] text-slate-900 flex font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* 1. Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col justify-between bg-white border-r border-slate-200/90 shadow-2xs sticky top-0 h-screen z-30 transition-all duration-300 ease-in-out select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Top Branding & Collapse Button */}
        <div>
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
            {!isCollapsed ? (
              <div className="flex items-center overflow-hidden">
                <Logo variant="admin" size="sm" />
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <Logo variant="iconOnly" size="sm" />
              </div>
            )}

            <button
              onClick={toggleSidebarCollapse}
              className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer ${
                isCollapsed ? 'hidden' : 'block'
              }`}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Collapsed Expand Trigger */}
          {isCollapsed && (
            <div className="py-2 flex justify-center border-b border-slate-100">
              <button
                onClick={toggleSidebarCollapse}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* User Profile Card */}
          <div className={`p-4 border-b border-slate-100 ${isCollapsed ? 'px-2' : ''}`}>
            {!isCollapsed ? (
              <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-gradient-to-r from-slate-50 to-amber-50/40 border border-amber-200/50">
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-amber-400/50 p-1 flex items-center justify-center flex-shrink-0 shadow-xs">
                  <img src="/logo.png" alt="Admin Avatar" className="w-full h-full object-contain filter drop-shadow-xs" />
                </div>
                <div className="overflow-hidden leading-tight flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {user?.name || 'Amazon Administrator'}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || 'admin@amazon.com'}</p>
                </div>
              </div>
            ) : (
              <div className="flex justify-center" title={`${user?.name || 'Amazon Administrator'} (${user?.email})`}>
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-amber-400/50 p-1 flex items-center justify-center shadow-xs">
                  <img src="/logo.png" alt="Admin" className="w-full h-full object-contain" />
                </div>
              </div>
            )}
          </div>

          {/* Menu Section Label */}
          <div className="pt-3 px-4">
            {!isCollapsed ? (
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ENTERPRISE MENU</span>
            ) : (
              <div className="w-full h-px bg-slate-200 my-1" />
            )}
          </div>

          {/* Navigation Links with Live Badges */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? `${item.title} ${item.badge ? `(${item.badge} pending)` : ''}` : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-md shadow-indigo-700/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon
                    className={`w-4.5 h-4.5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-amber-300' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />

                  {!isCollapsed && (
                    <span className="truncate flex-1 tracking-tight text-xs font-bold">{item.title}</span>
                  )}

                  {/* Expanded Badge with Alert Indicator */}
                  {!isCollapsed && item.badge && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      {item.badgeAlert && (
                        <span className="relative flex h-2 w-2" title="Pending Actions">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                      )}
                      <span className="w-6 h-6 min-w-[24px] rounded-full bg-[#f59e0b] text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                        {item.badge}
                      </span>
                    </div>
                  )}

                  {/* Collapsed Pulsing Dot Indicator */}
                  {isCollapsed && item.badge && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex items-center justify-center rounded-full h-4 w-4 bg-[#f59e0b] text-[9px] font-black text-slate-950 ring-2 ring-white">
                        {item.badge}
                      </span>
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions: View Marketplace & Sign Out */}
        <div className="p-3 border-t border-slate-100 space-y-1">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-amber-700 hover:bg-amber-50/50 transition ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="View Public Marketplace"
          >
            <ExternalLink className="w-4 h-4 text-slate-400" />
            {!isCollapsed && <span>Storefront</span>}
          </Link>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* 2. Mobile Drawer Navigation */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl p-4 flex flex-col justify-between z-10 animate-slideRight">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <Logo variant="admin" size="sm" />
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Profile */}
              <div className="my-4 p-3 rounded-2xl bg-gradient-to-r from-slate-50 to-amber-50/30 border border-amber-200/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-amber-400/50 p-1 flex items-center justify-center">
                  <img src="/logo.png" alt="Admin" className="w-full h-full object-contain" />
                </div>
                <div className="overflow-hidden leading-tight">
                  <span className="font-bold text-xs text-slate-900">{user?.name || 'Amazon Administrator'}</span>
                  <p className="text-[11px] text-slate-500">{user?.email || 'admin@amazon.com'}</p>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? 'bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-md'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-amber-400" />
                        <span>{item.title}</span>
                      </div>
                      {item.badge && (
                        <div className="flex items-center gap-1.5">
                          {item.badgeAlert && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                          )}
                          <span className="w-6 h-6 min-w-[24px] rounded-full bg-[#f59e0b] text-slate-950 font-black text-xs flex items-center justify-center shadow-xs">
                            {item.badge}
                          </span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Link
                to="/"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-amber-700"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Return to Marketplace</span>
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

      {/* 3. Main Body Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200/90 shadow-2xs px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileDrawerOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-tight flex items-center gap-2">
                <span>{title}</span>
              </h1>
              {subtitle && <p className="text-[11px] text-slate-400 font-medium hidden sm:block">{subtitle}</p>}
            </div>
          </div>

          {/* Right Header Badges & Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live Indicator */}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>LIVE</span>
            </span>

            {/* Refresh Action */}
            <button
              onClick={handleRefreshClick}
              disabled={refreshing}
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
              title="Sync Analytics & Approvals"
              aria-label="Sync Analytics"
            >
              <RefreshCw className={`w-4.5 h-4.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* Notification Bell with Dropdown Alert */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                title="Notifications & Approval Alerts"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {pendingApprovalsCount > 0 && (
                  <span className="absolute top-1 right-1 bg-amber-500 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>

              {/* Notification Alert Popup Panel */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl p-4 z-50 animate-fadeIn space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-black text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-amber-500" />
                      <span>Alert Notifications</span>
                    </span>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {pendingApprovalsCount > 0 ? (
                    <div className="p-3.5 bg-amber-50/90 border border-amber-300/80 rounded-xl space-y-2">
                      <div className="flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0 animate-pulse" />
                        <div>
                          <strong className="text-xs font-bold text-amber-950 block">
                            {pendingApprovalsCount} Pending Merchant Approval{pendingApprovalsCount > 1 ? 's' : ''}
                          </strong>
                          <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                            New store registration and KYC proofs are waiting for your review.
                          </p>
                        </div>
                      </div>
                      <Link
                        to="/admin/vendors"
                        onClick={() => setNotificationsOpen(false)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0c2a5e] hover:underline pt-1"
                      >
                        <span>Go to Vendor Approvals →</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">
                      ✓ All merchant applications are reviewed. No pending alerts.
                    </div>
                  )}

                  <div className="pt-1 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Admin System Connected &amp; Synced</span>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile Pill */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900 border border-amber-400/60 p-1 flex items-center justify-center shadow-xs">
                <img src="/logo.png" alt="Admin" className="w-full h-full object-contain filter drop-shadow-xs" />
              </div>
              <div className="hidden md:block text-left leading-tight">
                <span className="font-bold text-xs text-slate-800 block">Amazon Administrator</span>
                <span className="text-[10px] text-amber-600 font-semibold">Master Level</span>
              </div>
            </div>
          </div>
        </header>


        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
