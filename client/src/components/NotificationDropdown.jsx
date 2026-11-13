import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  Truck,
  ShoppingBag,
  Users,
  Gift,
  CreditCard,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  Package,
  X,
  ExternalLink,
  CheckCheck,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.max(0, Math.floor((now - date) / 1000));

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

const getNotificationIcon = (type) => {
  switch (type) {
    case 'deodap_order':
      return {
        icon: Package,
        color: 'text-amber-600 bg-amber-50 border-amber-200',
      };
    case 'store_order':
      return {
        icon: ShoppingBag,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      };
    case 'vendor_referral':
      return {
        icon: Users,
        color: 'text-purple-600 bg-purple-50 border-purple-200',
      };
    case 'customer_referral':
      return {
        icon: Gift,
        color: 'text-sky-600 bg-sky-50 border-sky-200',
      };
    case 'settlement_payout':
      return {
        icon: CreditCard,
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      };
    case 'deodap_affiliate':
      return {
        icon: TrendingUp,
        color: 'text-emerald-700 bg-emerald-50 border-emerald-300',
      };
    case 'plan_activated':
      return {
        icon: ShieldCheck,
        color: 'text-amber-600 bg-amber-50 border-amber-300',
      };
    case 'order_status':
      return {
        icon: Truck,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
      };
    default:
      return {
        icon: Bell,
        color: 'text-slate-600 bg-slate-100 border-slate-200',
      };
  }
};

const NotificationDropdown = ({ variant = 'light', role = null }) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?unreadOnly=false');
      if (res.data?.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (_) {
      // Quiet fail on network blips
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 14000);
    const handleFocus = () => fetchNotifications();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('orders-updated', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('orders-updated', handleFocus);
    };
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (notif, e) => {
    e?.stopPropagation();
    try {
      if (!notif.isRead) {
        await api.put(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      if (notif.link) {
        setIsOpen(false);
        const targetLink = notif.link.startsWith('/admin/merchants')
          ? notif.link.replace('/admin/merchants', '/admin/vendors')
          : notif.link;
        navigate(targetLink);
      }
    } catch (_) {}
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const isDark = variant === 'dark';

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        title="View Notifications"
        className={`relative p-2 rounded-xl transition cursor-pointer flex items-center justify-center ${
          isDark
            ? 'text-white hover:bg-white/10'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <Bell className="w-5 h-5 stroke-[1.9]" />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-[#e11d48] text-white text-[10px] font-black min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl border z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden ${
            isDark
              ? 'bg-slate-900/95 border-slate-700/80 backdrop-blur-xl text-slate-100'
              : 'bg-white/95 border-slate-200/90 backdrop-blur-xl text-slate-900'
          }`}
        >
          {/* Header */}
          <div
            className={`p-3.5 px-4 flex items-center justify-between border-b ${
              isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Notifications</span>
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 border border-rose-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="text-[11px] font-bold text-indigo-500 hover:text-indigo-600 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List of Notifications */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <p className="text-xs font-semibold text-slate-500">All caught up!</p>
                <p className="text-[11px] text-slate-400">No new alerts or activity at this time.</p>
              </div>
            ) : (
              notifications.slice(0, 15).map((notif) => {
                const iconMeta = getNotificationIcon(notif.type);
                const IconComponent = iconMeta.icon;

                return (
                  <div
                    key={notif._id}
                    onClick={(e) => handleMarkAsRead(notif, e)}
                    className={`p-3.5 flex items-start gap-3 transition cursor-pointer ${
                      notif.isRead
                        ? isDark
                          ? 'hover:bg-slate-800/40 opacity-75'
                          : 'hover:bg-slate-50/70 opacity-75'
                        : isDark
                        ? 'bg-slate-800/60 hover:bg-slate-800 border-l-3 border-amber-400'
                        : 'bg-amber-50/30 hover:bg-amber-50/60 border-l-3 border-amber-500'
                    }`}
                  >
                    {/* Icon */}
                    <div
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${iconMeta.color}`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-xs font-bold leading-tight truncate ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {notif.title}
                        </p>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">
                          {formatTimeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] mt-1 leading-snug line-clamp-2 ${
                          isDark ? 'text-slate-300' : 'text-slate-600'
                        }`}
                      >
                        {notif.message}
                      </p>
                      {notif.link && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:underline mt-1.5">
                          <span>View details</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              className={`p-2.5 px-4 text-center border-t ${
                isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'
              }`}
            >
              <span className="text-[10px] text-slate-400">
                Live alerts for orders, referrals &amp; store settlements
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

