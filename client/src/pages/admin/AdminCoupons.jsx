import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Search,
  Sparkles,
  Copy,
  Check,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Gift,
  Users,
  Percent,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  X,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const AdminCoupons = () => {
  const { success, error, info } = useToast();

  const [coupons, setCoupons] = useState([]);
  const [metrics, setMetrics] = useState({
    total: 0,
    active: 0,
    adminGenerated: 0,
    referralRewards: 0,
    totalUsed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'admin' | 'referral' | 'active' | 'expired'

  // Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // New Coupon Form
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'flat', // 'flat' | 'percent'
    discountAmount: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    description: '',
    badge: 'Admin Special',
    targetType: 'public', // 'public' | 'customer'
    targetEmail: '',
    expiresInDays: '30',
    usageLimit: '',
  });

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/coupons/admin/all', {
        params: { search: searchQuery, type: activeTab },
      });
      if (res.data?.success) {
        setCoupons(res.data.coupons || []);
        if (res.data.metrics) {
          setMetrics(res.data.metrics);
        }
      }
    } catch (err) {
      console.error('Failed to load coupons:', err);
      error(err.response?.data?.message || 'Could not load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCoupons();
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success(`Coupon code ${code} copied!`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await api.put(`/coupons/admin/${id}/toggle`);
      if (res.data?.success) {
        success(res.data.message);
        setCoupons((prev) =>
          prev.map((c) => (c._id === id ? { ...c, isActive: !c.isActive } : c))
        );
        fetchCoupons();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to toggle status');
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) {
      return;
    }
    try {
      const res = await api.delete(`/coupons/admin/${id}`);
      if (res.data?.success) {
        success(`Coupon ${code} deleted successfully`);
        setCoupons((prev) => prev.filter((c) => c._id !== id));
        fetchCoupons();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  const handleAutoGenerateCode = () => {
    const amount = newCoupon.discountAmount || '200';
    const prefix = newCoupon.discountType === 'percent' ? `SAVE${amount}` : `FLAT${amount}`;
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    setNewCoupon((prev) => ({
      ...prev,
      code: `${prefix}-${rand}`,
    }));
  };

  const handleCreateCouponSubmit = async (e) => {
    e.preventDefault();
    if (!newCoupon.discountAmount || Number(newCoupon.discountAmount) <= 0) {
      error('Please enter a valid discount amount');
      return;
    }

    try {
      setCreating(true);
      const res = await api.post('/coupons/admin/create', newCoupon);
      if (res.data?.success) {
        success(res.data.message || 'Coupon generated successfully!');
        setShowCreateModal(false);
        setNewCoupon({
          code: '',
          discountType: 'flat',
          discountAmount: '',
          minOrderAmount: '',
          maxDiscountAmount: '',
          description: '',
          badge: 'Admin Special',
          targetType: 'public',
          targetEmail: '',
          expiresInDays: '30',
          usageLimit: '',
        });
        fetchCoupons();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Could not generate coupon');
    } finally {
      setCreating(false);
    }
  };

  return (
    <AdminLayout
      title="Coupons & Promotional Discounts"
      subtitle="Generate marketing discount vouchers, manage referral reward coupons & track customer redemptions"
      onRefresh={fetchCoupons}
    >
      <div className="space-y-6 select-none max-w-[1920px] mx-auto pb-12">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Coupons</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0c2a5e] flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
            </div>
            <strong className="text-2xl font-black text-slate-900 block">{metrics.total}</strong>
            <span className="text-[10px] text-slate-400 font-semibold block">All active &amp; historical vouchers</span>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Active &amp; Valid</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <strong className="text-2xl font-black text-emerald-600 block">{metrics.active}</strong>
            <span className="text-[10px] text-emerald-700 font-bold block">Ready for checkout discount</span>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Admin Generated</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <strong className="text-2xl font-black text-purple-700 block">{metrics.adminGenerated}</strong>
            <span className="text-[10px] text-slate-400 font-semibold block">Marketing promos &amp; flash deals</span>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Referral Rewards</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Gift className="w-4 h-4" />
              </div>
            </div>
            <strong className="text-2xl font-black text-amber-600 block">{metrics.referralRewards}</strong>
            <span className="text-[10px] text-slate-400 font-semibold block">Earned by referring friends</span>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-2xs space-y-2 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Redemptions</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <strong className="text-2xl font-black text-indigo-700 block">{metrics.totalUsed}</strong>
            <span className="text-[10px] text-slate-400 font-semibold block">Coupons successfully applied</span>
          </div>
        </div>

        {/* Action Bar: Search, Tabs & Create Button */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Coupons' },
              { id: 'admin', label: 'Admin Promos' },
              { id: 'referral', label: 'Referral Rewards' },
              { id: 'active', label: 'Active' },
              { id: 'expired', label: 'Expired / Redeemed' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#0c2a5e] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & New Coupon CTA */}
          <div className="flex items-center gap-2.5">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
              <input
                type="text"
                placeholder="Search coupon code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </form>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#0c2a5e] hover:bg-[#153e85] text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer flex items-center gap-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Coupon</span>
            </button>
          </div>
        </div>

        {/* Coupons List / Cards */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading coupon records...</div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-2xs space-y-3">
            <Tag className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No coupons found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {activeTab === 'referral'
                ? 'No customer referral reward coupons have been earned yet. When customers invite friends who register, reward coupons will appear here.'
                : 'No promotional coupons match this filter. Click "Generate Coupon" to create one.'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 px-5 py-2.5 bg-[#0c2a5e] text-white text-xs font-bold rounded-xl hover:bg-[#153e85] cursor-pointer inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Generate First Admin Coupon</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {coupons.map((coupon) => {
              const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
              const isReady = coupon.isActive && !coupon.isUsed && !isExpired;

              return (
                <div
                  key={coupon._id}
                  className={`bg-white rounded-3xl border transition shadow-2xs p-5 space-y-4 flex flex-col justify-between ${
                    coupon.isReferralReward
                      ? 'border-amber-200/90 hover:border-amber-300'
                      : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  {/* Top Header */}
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10.5px] font-black uppercase tracking-wider ${
                            coupon.isReferralReward
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {coupon.isReferralReward ? (
                            <>
                              <Gift className="w-3 h-3" /> Referral Reward
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" /> {coupon.badge || 'Admin Promo'}
                            </>
                          )}
                        </span>
                        <div className="flex items-center gap-2 pt-1">
                          <strong className="font-mono text-base font-black text-slate-900 tracking-tight">
                            {coupon.code}
                          </strong>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(coupon.code)}
                            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                            title="Copy code"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10.5px] font-extrabold flex items-center gap-1 ${
                          coupon.isUsed
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : isExpired
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : coupon.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {coupon.isUsed
                          ? '● Redeemed'
                          : isExpired
                          ? '● Expired'
                          : coupon.isActive
                          ? '● Active'
                          : '● Disabled'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{coupon.description}</p>
                  </div>

                  {/* Value / Terms Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Discount Benefit:</span>
                      <strong className="text-slate-900 font-extrabold">
                        {coupon.discountType === 'percent'
                          ? `${coupon.discountAmount}% OFF`
                          : `₹${coupon.discountAmount.toLocaleString('en-IN')} OFF`}
                      </strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Min Cart Value:</span>
                      <strong className="text-slate-700">
                        {coupon.minOrderAmount > 0
                          ? `₹${coupon.minOrderAmount.toLocaleString('en-IN')}`
                          : 'No Minimum'}
                      </strong>
                    </div>

                    {/* Target Recipient */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Target Audience:</span>
                      <span className="text-slate-800 font-bold truncate max-w-[170px]">
                        {coupon.assignedTo ? (
                          <span className="text-blue-700">
                            👤 {coupon.assignedTo.name || coupon.assignedTo.email}
                          </span>
                        ) : (
                          <span className="text-emerald-700">🌐 Public (All Customers)</span>
                        )}
                      </span>
                    </div>

                    {/* Referral Info */}
                    {coupon.isReferralReward && coupon.referredUser && (
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 text-[11px]">
                        <span className="text-slate-500">Referred Friend:</span>
                        <span className="text-amber-800 font-bold">
                          {coupon.referredUser.name || coupon.referredUser.email}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
                      <span>Redemptions:</span>
                      <span className="font-bold text-slate-600">
                        {coupon.timesUsed || (coupon.isUsed ? 1 : 0)} times
                      </span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        Expires{' '}
                        {coupon.expiresAt
                          ? new Date(coupon.expiresAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Never'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(coupon._id, coupon.isActive)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          coupon.isActive
                            ? 'text-emerald-700 hover:bg-emerald-50'
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title={coupon.isActive ? 'Disable Coupon' : 'Enable Coupon'}
                      >
                        {coupon.isActive ? (
                          <ToggleRight className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-slate-400" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(coupon._id, coupon.code)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: GENERATE NEW COUPON */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#0c2a5e] text-white flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Generate Promotional Coupon</h3>
                    <p className="text-xs text-slate-500">Create discount voucher for marketplace or specific customers</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCouponSubmit} className="space-y-4 text-xs">
                {/* 1. Code & Auto-generator */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700">Coupon Promo Code *</label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateCode}
                      className="text-[11px] font-extrabold text-[#0c2a5e] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" /> Auto Generate Code
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DIWALI500, SAVE20"
                    value={newCoupon.code}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                  />
                </div>

                {/* 2. Discount Type & Value */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Discount Type *</label>
                    <select
                      value={newCoupon.discountType}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    >
                      <option value="flat">Flat Cash Off (₹)</option>
                      <option value="percent">Percentage Off (%)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">
                      {newCoupon.discountType === 'percent' ? 'Discount Percentage (%) *' : 'Discount Amount (₹) *'}
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder={newCoupon.discountType === 'percent' ? 'e.g. 15' : 'e.g. 200'}
                      value={newCoupon.discountAmount}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discountAmount: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                </div>

                {/* 3. Min Order Value & Max Cap */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Minimum Order Cart Value (₹)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 499 (0 for any order)"
                      value={newCoupon.minOrderAmount}
                      onChange={(e) => setNewCoupon({ ...newCoupon, minOrderAmount: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Valid For (Days) *</label>
                    <select
                      value={newCoupon.expiresInDays}
                      onChange={(e) => setNewCoupon({ ...newCoupon, expiresInDays: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    >
                      <option value="7">7 Days</option>
                      <option value="15">15 Days</option>
                      <option value="30">30 Days (1 Month)</option>
                      <option value="60">60 Days (2 Months)</option>
                      <option value="90">90 Days (3 Months)</option>
                      <option value="180">180 Days (6 Months)</option>
                      <option value="365">365 Days (1 Year)</option>
                    </select>
                  </div>
                </div>

                {/* 4. Target Audience */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Target Audience *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewCoupon({ ...newCoupon, targetType: 'public', targetEmail: '' })}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        newCoupon.targetType === 'public'
                          ? 'border-[#0c2a5e] bg-blue-50/70 text-[#0c2a5e] font-extrabold'
                          : 'border-slate-200 text-slate-600 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>Public (All Customers)</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Available for everyone at checkout</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewCoupon({ ...newCoupon, targetType: 'customer' })}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        newCoupon.targetType === 'customer'
                          ? 'border-[#0c2a5e] bg-blue-50/70 text-[#0c2a5e] font-extrabold'
                          : 'border-slate-200 text-slate-600 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Gift className="w-4 h-4" />
                        <span>Specific Customer</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Assigned to a specific user email</p>
                    </button>
                  </div>
                </div>

                {/* Customer Email if targetType is customer */}
                {newCoupon.targetType === 'customer' && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Customer Registered Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. customer@example.com"
                      value={newCoupon.targetEmail}
                      onChange={(e) => setNewCoupon({ ...newCoupon, targetEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                )}

                {/* 5. Badge & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Promotion Badge Label</label>
                    <input
                      type="text"
                      placeholder="e.g. Festive Special, Flash Sale"
                      value={newCoupon.badge}
                      onChange={(e) => setNewCoupon({ ...newCoupon, badge: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Description / Note</label>
                    <input
                      type="text"
                      placeholder="e.g. Flat ₹500 off on festive orders"
                      value={newCoupon.description}
                      onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-6 py-2.5 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-extrabold shadow-sm cursor-pointer disabled:bg-slate-300"
                  >
                    {creating ? 'Generating Coupon...' : 'Create & Activate Coupon'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCoupons;
