import React, { useState, useEffect } from 'react';
import {
  Settings,
  Gift,
  DollarSign,
  ShieldCheck,
  ArrowLeft,
  Save,
  Sparkles,
  Ticket,
  TrendingUp,
  CreditCard,
  Building,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminSettings = () => {
  const { success, error } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    referralBonusAmount: 500,
    commissionRatePercent: 10,
    minWithdrawalAmount: 500,
    platformName: 'SR Multi-Vendor Marketplace',
    supportEmail: 'support@srmarketplace.online',
    customerReferralDiscountAmount: 100,
    customerReferralMinSpend: 499,
    deodapAffiliateCommissionPercent: 10,
    enrollmentFee: 999,
    planDurationDays: 365,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/admin/settings');
      if (res.data.success && res.data.settings) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/admin/settings', settings);
      if (res.data.success) {
        success('Platform configuration saved successfully!');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Platform Settings" subtitle="Administer fixed vendor referral rewards, sales commissions, and operational parameters">
      <div className="space-y-6 select-none font-sans max-w-4xl">
        <div className="pb-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Platform Configuration &amp; Policies</h2>
          <p className="text-xs text-slate-500">
            Administer fixed vendor referral rewards, platform sales commissions, and marketplace thresholds.
          </p>
        </div>

      <form onSubmit={handleSubmit} className="bright-card p-6 sm:p-10 rounded-3xl space-y-6">
        {/* Referral Reward Rule */}
        <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-sm text-blue-950">Fixed Vendor Referral Reward (₹)</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Whenever an existing vendor invites another merchant, and the invited merchant completes their store registration with an active plan, this exact fixed amount is credited to the referring vendor's wallet balance.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs w-full">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
              <input
                type="number"
                min={0}
                required
                value={settings.referralBonusAmount}
                onChange={(e) => setSettings({ ...settings, referralBonusAmount: e.target.value })}
                className="w-full pl-8 pr-3 py-2 text-sm font-black bg-white border border-blue-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs font-bold text-blue-700">INR per registered store</span>
          </div>
        </div>

        {/* Platform Order Commission */}
        <div className="p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-sm text-emerald-950">Platform Order Commission Rate (%)</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The percentage deducted by the platform when an order item is delivered. The remaining amount is credited into the vendor's wallet for settlement payout.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs w-full">
              <input
                type="number"
                min={0}
                max={100}
                required
                value={settings.commissionRatePercent}
                onChange={(e) => setSettings({ ...settings, commissionRatePercent: e.target.value })}
                className="w-full pr-8 pl-3 py-2 text-sm font-black bg-white border border-emerald-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
            </div>
            <span className="text-xs font-bold text-emerald-700">Platform fee on fulfilled item total</span>
          </div>
        </div>

        {/* Store Registration Enrollment Fee (Fixed by Admin) */}
        <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-sm text-amber-950">Fixed Store Enrollment Fee &amp; Plan Validity (₹)</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The mandatory enrollment fee payable by an approved merchant to activate their store storefront and gain full vendor dashboard access for the specified time period.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Enrollment Fee (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min={0}
                  required
                  value={settings.enrollmentFee || 999}
                  onChange={(e) => setSettings({ ...settings, enrollmentFee: Number(e.target.value) })}
                  className="w-full pl-8 pr-3 py-2 text-sm font-black bg-white border border-amber-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Plan Time Period (Days) *</label>
              <input
                type="number"
                min={1}
                required
                value={settings.planDurationDays || 365}
                onChange={(e) => setSettings({ ...settings, planDurationDays: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm font-black bg-white border border-amber-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Customer-to-Customer Referral Discount Vouchers */}
        <div className="p-5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-purple-600" />
            <h2 className="font-bold text-sm text-purple-950">Customer Referral Discount Vouchers (₹)</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            When a registered customer refers friends with their referral invite link/code, they receive an automatic discount coupon voucher stored in the database. Configure the voucher discount and minimum cart spend below.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Referral Discount Voucher (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min={10}
                  required
                  value={settings.customerReferralDiscountAmount || 100}
                  onChange={(e) => setSettings({ ...settings, customerReferralDiscountAmount: Number(e.target.value) })}
                  className="w-full pl-8 pr-3 py-2 text-sm font-black bg-white border border-purple-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Min Cart Value to Redeem Voucher (₹) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min={50}
                  required
                  value={settings.customerReferralMinSpend || 499}
                  onChange={(e) => setSettings({ ...settings, customerReferralMinSpend: Number(e.target.value) })}
                  className="w-full pl-8 pr-3 py-2 text-sm font-black bg-white border border-purple-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vendor DeoDap Affiliate Promotion Commission */}
        <div className="p-5 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            <h2 className="font-bold text-sm text-teal-950">Vendor DeoDap Affiliate Commission (%)</h2>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Merchants can promote platform DeoDap dropship products with their unique affiliate link. When customers order through that link, the promoter vendor receives this commission rate credited to their wallet upon order delivery.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs w-full">
              <input
                type="number"
                min={0}
                max={100}
                required
                value={settings.deodapAffiliateCommissionPercent || 10}
                onChange={(e) => setSettings({ ...settings, deodapAffiliateCommissionPercent: Number(e.target.value) })}
                className="w-full pr-8 pl-3 py-2 text-sm font-black bg-white border border-teal-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
            </div>
            <span className="text-xs font-bold text-teal-700">Promoter vendor commission on DeoDap sales</span>
          </div>
        </div>

        {/* Centralized Razorpay Gateway Escrow Model */}
        <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl space-y-3 shadow-md border border-slate-700">
          <div className="flex items-center gap-2 text-amber-400">
            <CreditCard className="w-5 h-5" />
            <h2 className="font-bold text-sm">Centralized Admin Razorpay Gateway &amp; Settlements</h2>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            All customer checkout payments and merchant store plan subscription fees are deposited directly into your central Admin Razorpay account. Vendor wallet balances (from store product sales, DeoDap promotions, and vendor referrals) are tracked in real-time, and you disburse payouts directly to their bank accounts via the Settlements queue.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-300">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-emerald-400 border border-slate-700">✓ 100% Admin Escrow</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-400 border border-slate-700">✓ Manual / Bank NEFT Settlement Payouts</span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-sky-400 border border-slate-700">✓ Real-time Dual Ledger Logging</span>
          </div>
        </div>

        {/* Minimum Settlement Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Minimum Withdrawal Payout (₹)</label>
            <input
              type="number"
              min={100}
              required
              value={settings.minWithdrawalAmount}
              onChange={(e) => setSettings({ ...settings, minWithdrawalAmount: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Support Contact Email</label>
            <input
              type="email"
              required
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="py-3 px-8 rounded-xl bg-[#4338ca] hover:bg-[#3730a3] text-white font-bold text-sm shadow-md transition cursor-pointer flex items-center gap-2 disabled:bg-slate-300"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration Changes'}</span>
          </button>
        </div>
      </form>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
