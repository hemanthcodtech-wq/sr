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
  Sparkles,
  Share2,
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
      if (res.data?.success) {
        setWalletData(res.data);
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const referralCode = walletData?.referralCode || user?.referralCode || 'VEND-BZUWC5';
  const referralLink = `${window.location.origin}/vendor/register?ref=${referralCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    info('Referral Code copied to clipboard!');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    info('Vendor invitation link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(payoutAmount);

    if (!amount || amount < 50) {
      error('Minimum settlement payout request is ₹50');
      return;
    }

    if (amount > (walletData?.walletBalance || 0)) {
      error('Cannot request more than your current wallet balance');
      return;
    }

    setSubmittingPayout(true);
    try {
      const res = await api.post('/vendors/request-payout', { amount });
      if (res.data?.success) {
        success('Settlement payout request submitted! Admin will transfer funds to your store bank account.');
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
      <VendorLayout
        title="Vendor Wallet & Referral Hub"
        subtitle="Track referral bonuses, delivered order revenues, and submit bank settlement requests."
      >
        <PageLoader text="Loading ledger & wallet balance..." />
      </VendorLayout>
    );
  }

  const walletBalance = walletData?.walletBalance || 0;
  const transactions = walletData?.transactions || [];
  const referrals = walletData?.referrals || [];
  const bonusPerVendor = walletData?.referralBonusPerStore || 200;

  return (
    <VendorLayout
      title="Vendor Wallet & Referral Hub"
      subtitle="Track referral bonuses, delivered order revenues, and submit bank settlement requests."
    >
      <div className="space-y-6">

        {/* Main Wallet & Referral Hero Cards - Light Morphism */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Wallet Balance Card */}
          <div className="lg:col-span-5 bg-white/80 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-300">
                Ready For Bank Transfer
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Available Balance</div>
              <div className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                ₹{walletBalance.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500 font-medium pt-1">
                Accumulated from delivered order sales + vendor referral bonuses.
              </p>
            </div>

            <button
              onClick={() => setPayoutModalOpen(true)}
              disabled={walletBalance < 50}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#0c2a5e] to-[#174896] hover:from-[#091f45] hover:to-[#123978] text-white font-extrabold text-xs shadow-md transition cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Request Payout from Admin</span>
            </button>
          </div>

          {/* Vendor Referral Program Card */}
          <div className="lg:col-span-7 bg-gradient-to-br from-blue-50/80 via-white/80 to-indigo-50/60 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-blue-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between space-y-5">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100/80 text-blue-700 text-xs font-bold">
                <Gift className="w-3.5 h-3.5" />
                <span>Partner Referral Program</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug tracking-tight">
                Earn <span className="text-blue-600">₹{bonusPerVendor} Bonus</span> for every verified merchant you invite!
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl font-medium">
                When fellow sellers onboard using your referral link and activate their store subscription, ₹{bonusPerVendor} is credited directly into your wallet.
              </p>
            </div>

            {/* Referral Code & Copy Controls */}
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex items-center justify-between px-4 py-2.5 bg-white/90 border border-slate-200 rounded-2xl">
                  <span className="text-xs font-semibold text-slate-400">Your Code:</span>
                  <span className="font-mono font-black text-sm text-blue-700">{referralCode}</span>
                </div>
                <button
                  onClick={copyCode}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <div>
                <button
                  onClick={copyLink}
                  className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-blue-600" />}
                  <span>{copiedLink ? 'Shareable Link Copied to Clipboard!' : 'Copy Shareable Referral Registration Link'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Referred Vendors List & Transaction Ledger */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left: Referred Stores */}
          <div className="lg:col-span-5 bg-white/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="font-black text-xs uppercase tracking-wider text-slate-900">
                  Referred Merchants ({referrals.length})
                </h3>
              </div>
              <span className="text-xs font-black text-emerald-600">
                Total: ₹{(referrals.length * bonusPerVendor).toLocaleString('en-IN')}
              </span>
            </div>

            {referrals.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {referrals.map((ref) => (
                  <div key={ref._id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{ref.store?.storeName || ref.name}</div>
                      <div className="text-[11px] text-slate-400">
                        Joined: {new Date(ref.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                    <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      +₹{bonusPerVendor} Credited
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 space-y-2">
                <Gift className="w-8 h-8 text-slate-300 mx-auto" />
                <p>No referrals yet. Share your referral link to earn ₹{bonusPerVendor} per merchant!</p>
              </div>
            )}
          </div>

          {/* Right: Wallet Transaction Ledger */}
          <div className="lg:col-span-7 bg-white/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-900">
                Wallet Transaction History
              </h3>
              <span className="text-xs text-slate-400 font-semibold">{transactions.length} Records</span>
            </div>

            {transactions.length > 0 ? (
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
                {transactions.map((tx) => {
                  const isCredit = tx.amount > 0;
                  return (
                    <div key={tx._id} className="py-3 flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                            isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900">{tx.description}</div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            • Status: <span className="capitalize font-bold text-slate-600">{tx.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`font-black text-sm ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {isCredit ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold">
                          Bal: ₹{tx.balanceAfter?.toLocaleString('en-IN')}
                        </div>
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

        {/* Payout Modal - Light Morphism */}
        {payoutModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-2xl max-w-md w-full p-6 sm:p-7 rounded-3xl border border-white/80 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-black text-slate-900">Request Payout from Admin</h2>
                <p className="text-xs text-slate-500 mt-0.5">Available Wallet Balance: ₹{walletBalance.toLocaleString('en-IN')}</p>
              </div>

              <form onSubmit={handlePayoutSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Withdrawal Amount (₹) (Min ₹50) *</label>
                  <input
                    type="number"
                    min={50}
                    max={walletBalance}
                    required
                    placeholder="e.g. 50"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-bold text-slate-900"
                  />
                </div>

                <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs space-y-1 text-slate-700">
                  <span className="font-bold text-[#0c2a5e] flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" />
                    <span>Admin Disbursed Bank Settlement</span>
                  </span>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Once submitted, a settlement request is sent to the Administrator. The Admin will verify and transfer the funds to your registered store bank account / UPI, and your wallet balance will be deducted upon settlement.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayoutModalOpen(false)}
                    className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPayout}
                    className="flex-1 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md transition disabled:bg-slate-200 disabled:text-slate-400"
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
