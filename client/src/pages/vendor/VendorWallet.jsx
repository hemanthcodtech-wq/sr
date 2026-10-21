import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Gift,
  Copy,
  Check,
  TrendingUp,
  CreditCard,
  Building,
  Users,
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import VendorLayout from '../../components/vendor/VendorLayout';
import { PageLoader } from '../../components/LoadingScreen';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const VendorWallet = () => {
  const { user, refreshUser } = useAuth();
  const { success, error, info } = useToast();

  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Settlement Request Modal State
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const res = await api.get('/vendors/wallet');
      if (res.data.success) {
        setWalletData(res.data);
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const referralCode = walletData?.referralCode || user?.referralCode || '';
  const referralLink = `${window.location.origin}/vendor/register?ref=${referralCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    info('Referral Code copied!');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    info('Referral Link copied!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(payoutAmount);

    if (!amount || amount < 500) {
      error('Minimum settlement payout request is ₹500');
      return;
    }

    if (amount > (walletData?.walletBalance || 0)) {
      error('Cannot request more than your current wallet balance');
      return;
    }

    setSubmittingPayout(true);
    try {
      const res = await api.post('/vendors/request-payout', { amount });
      if (res.data.success) {
        success('Settlement payout request submitted! Admin will process transfer to your bank.');
        setPayoutModalOpen(false);
        setPayoutAmount('');
        fetchWallet();
        refreshUser();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to submit settlement request');
    } finally {
      setSubmittingPayout(false);
    }
  };

  if (loading) {
    return (
      <VendorLayout title="Vendor Wallet & Referral Hub" subtitle="Track referral bonuses, delivered order revenues, and submit bank settlement requests.">
        <PageLoader text="Loading ledger & wallet balance..." />
      </VendorLayout>
    );
  }

  const walletBalance = walletData?.walletBalance || 0;
  const transactions = walletData?.transactions || [];
  const referrals = walletData?.referrals || [];
  const bonusPerVendor = walletData?.referralBonusPerStore || 500;

  return (
    <VendorLayout
      title="Vendor Wallet & Referral Hub"
      subtitle="Track referral bonuses, delivered order revenues, and submit bank settlement requests."
    >
      <div className="space-y-6">

      {/* Main Wallet & Referral Hero Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Wallet Balance Card */}
        <div className="lg:col-span-5 bright-card p-6 sm:p-8 rounded-3xl border-emerald-200 bg-white flex flex-col justify-between space-y-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Available For Bank Settlement
            </span>
            <Wallet className="w-6 h-6 text-emerald-600" />
          </div>

          <div className="space-y-1">
            <div className="text-xs text-slate-500 font-semibold">Total Wallet Balance</div>
            <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              ₹{walletBalance.toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-slate-500 pt-1">
              Earned from completed order sales + referral rewards.
            </p>
          </div>

          <button
            onClick={() => setPayoutModalOpen(true)}
            disabled={walletBalance < 500}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Request Bank Settlement Payout</span>
          </button>
        </div>

        {/* Vendor Referral Program Card */}
        <div className="lg:col-span-7 bright-card p-6 sm:p-8 rounded-3xl border-blue-200 bg-blue-50/60 flex flex-col justify-between space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
              <Gift className="w-4 h-4" />
              <span>Admin Referral Program</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
              Earn <span className="text-blue-600">₹{bonusPerVendor}</span> For Every Verified Store You Refer
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              When fellow merchants register their store using your referral code and purchase an active subscription plan, ₹{bonusPerVendor} is credited instantly to your wallet!
            </p>
          </div>

          {/* Referral Code & Copy Controls */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center justify-between px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl">
                <span className="text-xs text-slate-500">Your Code:</span>
                <span className="font-mono font-black text-sm text-blue-700">{referralCode}</span>
              </div>
              <button
                onClick={copyCode}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyLink}
                className="w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Shareable Link Copied' : 'Copy Direct Referral Link'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Referred Vendors List & Transaction Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Referred Stores */}
        <div className="lg:col-span-5 bright-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Your Referred Vendors ({referrals.length})</h3>
            </div>
            <span className="text-xs font-bold text-emerald-600">
              Total Bonus: ₹{(referrals.length * bonusPerVendor).toLocaleString('en-IN')}
            </span>
          </div>

          {referrals.length > 0 ? (
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {referrals.map((ref) => (
                <div key={ref._id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{ref.store?.storeName || ref.name}</div>
                    <div className="text-slate-400">Joined: {new Date(ref.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    +₹{bonusPerVendor} Credited
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
              <Gift className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No referrals yet. Share your code to start collecting ₹{bonusPerVendor} rewards!</p>
            </div>
          )}
        </div>

        {/* Right: Wallet Transaction Ledger */}
        <div className="lg:col-span-7 bright-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Wallet Transaction History</h3>
            <span className="text-xs text-slate-500">{transactions.length} Records</span>
          </div>

          {transactions.length > 0 ? (
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
              {transactions.map((tx) => {
                const isCredit = tx.amount > 0;
                return (
                  <div key={tx._id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">{tx.description}</div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • Status: {tx.status}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-black text-sm ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                        {isCredit ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">Bal: ₹{tx.balanceAfter?.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">
              No transactions recorded yet in your vendor wallet.
            </div>
          )}
        </div>
      </div>

      {/* Payout Modal */}
      {payoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bright-card max-w-md w-full p-6 sm:p-8 rounded-3xl border-slate-200 shadow-2xl space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">Request Bank Settlement Payout</h2>
              <p className="text-xs text-slate-500">Available Wallet Balance: ₹{walletBalance.toLocaleString('en-IN')}</p>
            </div>

            <form onSubmit={handlePayoutSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Withdrawal Amount (₹) (Min ₹500) *</label>
                <input
                  type="number"
                  min={500}
                  max={walletBalance}
                  required
                  placeholder="e.g. 1500"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1 text-slate-600">
                <span className="font-bold text-slate-800">Direct Bank Transfer</span>
                <p className="text-[11px] leading-relaxed">
                  Admin will review and execute this settlement payout to the bank account configured on your store profile.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition disabled:bg-slate-300"
                >
                  {submittingPayout ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </VendorLayout>
  );
};

export default VendorWallet;
