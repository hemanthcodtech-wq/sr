import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Building,
  CheckCircle2,
  Clock,
  ArrowLeft,
  XCircle,
  AlertCircle,
  ExternalLink,
  Search,
  Filter,
  Check,
  X,
  TrendingUp,
  Banknote,
  Send,
  ShieldCheck,
  RefreshCw,
  Copy,
  Sliders,
  DollarSign,
  User,
  Phone,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminSettlements = () => {
  const { success, error, info } = useToast();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'completed', 'rejected'
  const [searchQuery, setSearchQuery] = useState('');

  // Settlement processing modal
  const [activeSettlement, setActiveSettlement] = useState(null);
  const [transRef, setTransRef] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settlements/admin');
      if (res.data?.success) {
        setSettlements(res.data.settlements || []);
      }
    } catch (err) {
      console.error('Failed to load settlements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProcess = (settlement) => {
    setActiveSettlement(settlement);
    setTransRef(`UTR${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setAdminNotes(`Bank NEFT/IMPS settlement transferred to ${settlement.bankDetails?.bankName || 'Store Account'}`);
  };

  const handleProcessSubmit = async (status) => {
    if (!activeSettlement) return;

    if (status === 'completed' && !transRef.trim()) {
      error('Please provide a Bank UTR / Transaction Reference number');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.put(`/settlements/${activeSettlement._id}/process`, {
        status,
        transactionReference: transRef.trim(),
        adminNotes: adminNotes.trim(),
      });

      if (res.data?.success) {
        success(
          status === 'completed'
            ? `Payout of ₹${activeSettlement.amount?.toLocaleString('en-IN')} marked as Settled & Disbursed!`
            : `Settlement request rejected and ₹${activeSettlement.amount?.toLocaleString('en-IN')} refunded to vendor wallet.`
        );
        setActiveSettlement(null);
        fetchSettlements();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Could not process settlement');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter settlements
  const filteredSettlements = settlements.filter((s) => {
    const matchesTab =
      activeTab === 'all' || (s.status || '').toLowerCase() === activeTab.toLowerCase();

    const vendorName = s.store?.storeName || s.vendor?.name || '';
    const email = s.vendor?.email || '';
    const accNumber = s.bankDetails?.accountNumber || '';
    const matchesSearch =
      vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      accNumber.includes(searchQuery);

    return matchesTab && matchesSearch;
  });

  // Analytics Metrics
  const totalPayoutRequested = settlements.reduce((sum, s) => sum + (s.amount || 0), 0);
  const pendingCount = settlements.filter((s) => s.status === 'pending').length;
  const pendingAmount = settlements
    .filter((s) => s.status === 'pending')
    .reduce((sum, s) => sum + (s.amount || 0), 0);
  const completedAmount = settlements
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  return (
    <AdminLayout
      title="Vendor Wallet Settlements & Payouts"
      subtitle="Verify merchant withdrawal requests, transfer funds to store bank accounts, and disburse wallet balances"
      onRefresh={fetchSettlements}
    >
      <div className="space-y-6 font-sans select-none pb-12">
        {/* Top Header Hero */}
        <div className="bg-gradient-to-r from-[#0c2a5e] via-indigo-900 to-[#174896] rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner flex-shrink-0">
                <Banknote className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">Vendor Payouts &amp; Bank Disbursements</h2>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Live Escrow Settlement
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl">
                  Disburse accumulated delivered order revenues and vendor referral bonuses directly into merchants' verified bank accounts / UPI.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchSettlements}
                disabled={loading}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/90 hover:text-white border border-white/15 backdrop-blur-md transition cursor-pointer"
                title="Refresh Settlements"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-300' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL REQUESTED</span>
              <div className="text-2xl font-black text-slate-900 font-mono">
                ₹{totalPayoutRequested.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-slate-400 block">{settlements.length} settlement records</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0c2a5e] flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PENDING APPROVAL</span>
              <div className="text-2xl font-black text-amber-600 font-mono">
                {pendingCount}
              </div>
              <span className="text-[11px] text-amber-700 font-bold block">₹{pendingAmount.toLocaleString('en-IN')} pending</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">DISBURSED &amp; SETTLED</span>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                ₹{completedAmount.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-emerald-700 font-bold block">100% transferred</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PAYOUT METHOD</span>
              <div className="text-base font-black text-slate-900 leading-tight">
                NEFT / IMPS / UPI
              </div>
              <span className="text-[11px] text-slate-500 font-medium block">Direct bank transfer</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by store name, vendor email, or account number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {[
                { id: 'all', label: 'All Requests' },
                { id: 'pending', label: `Pending (${pendingCount})` },
                { id: 'completed', label: 'Completed' },
                { id: 'rejected', label: 'Rejected' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[#0c2a5e] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Settlements Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Merchant &amp; Store</th>
                  <th className="py-3.5 px-4">Withdrawal Amount</th>
                  <th className="py-3.5 px-4">Bank / UPI Transfer Details</th>
                  <th className="py-3.5 px-4">Requested On</th>
                  <th className="py-3.5 px-4">Payout Status</th>
                  <th className="py-3.5 px-4 text-right">Disburse Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                      <span>Loading vendor settlement requests...</span>
                    </td>
                  </tr>
                ) : filteredSettlements.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-700">No settlement requests found</p>
                      <p className="text-xs text-slate-400 mt-0.5">When vendors request wallet withdrawals, they will appear here</p>
                    </td>
                  </tr>
                ) : (
                  filteredSettlements.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/80 transition">
                      {/* Merchant */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                            {(s.store?.storeName || s.vendor?.name || 'V').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{s.store?.storeName || s.vendor?.name}</div>
                            <div className="text-[11px] text-slate-400">{s.vendor?.email || s.store?.phone}</div>
                          </div>
                        </div>
                      </td>

                      {/* Payout Amount */}
                      <td className="py-3.5 px-4">
                        <div className="text-sm font-black text-slate-900 font-mono">
                          ₹{s.amount?.toLocaleString('en-IN')}
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">Ready for payout</span>
                      </td>

                      {/* Bank Details */}
                      <td className="py-3.5 px-4 text-slate-600 space-y-0.5">
                        <div className="font-bold text-slate-800">
                          {s.bankDetails?.bankName || 'Direct Transfer'}
                        </div>
                        <div>
                          A/C: <span className="font-mono font-bold text-slate-900">{s.bankDetails?.accountNumber || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>IFSC: <strong className="font-mono uppercase">{s.bankDetails?.ifscCode || 'N/A'}</strong></span>
                          {s.bankDetails?.upiId && (
                            <span className="bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded font-mono">
                              UPI: {s.bankDetails?.upiId}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-500">
                        <div className="font-medium">
                          {new Date(s.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(s.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            s.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : s.status === 'rejected'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {s.status === 'completed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : s.status === 'rejected' ? (
                            <XCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          <span className="uppercase">{s.status}</span>
                        </span>
                        {s.transactionReference && (
                          <div className="text-[10px] text-slate-400 font-mono mt-1">
                            Ref: {s.transactionReference}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        {s.status !== 'completed' && s.status !== 'rejected' ? (
                          <button
                            onClick={() => handleOpenProcess(s)}
                            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Pay &amp; Settle</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 font-bold text-xs">
                            {s.status === 'completed' ? '✓ Settled' : '✕ Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Process Settlement Modal */}
        {activeSettlement && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Execute Settlement Payout</h3>
                    <p className="text-xs text-slate-500 font-medium">Disburse funds to vendor bank account</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSettlement(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Vendor & Amount Box */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">DISBURSEMENT AMOUNT</span>
                  <div className="text-2xl font-black text-emerald-900 font-mono">
                    ₹{activeSettlement.amount?.toLocaleString('en-IN')}
                  </div>
                  <span className="text-xs text-emerald-700 font-medium">
                    Store: {activeSettlement.store?.storeName || activeSettlement.vendor?.name}
                  </span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white text-emerald-700 flex items-center justify-center shadow-2xs font-bold text-lg">
                  ₹
                </div>
              </div>

              {/* Bank Details Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-700 block uppercase tracking-wider text-[10px]">
                  Beneficiary Bank Account
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-800">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Account Holder:</span>
                    <strong className="font-semibold">{activeSettlement.bankDetails?.accountHolder || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Bank Name:</span>
                    <strong className="font-semibold">{activeSettlement.bankDetails?.bankName || 'Direct'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Account Number:</span>
                    <strong className="font-mono font-bold text-slate-900">{activeSettlement.bankDetails?.accountNumber || 'N/A'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">IFSC Code:</span>
                    <strong className="font-mono uppercase font-bold text-slate-900">{activeSettlement.bankDetails?.ifscCode || 'N/A'}</strong>
                  </div>
                  {activeSettlement.bankDetails?.upiId && (
                    <div className="col-span-2 pt-1 border-t border-slate-200">
                      <span className="text-slate-400 text-[11px]">UPI ID: </span>
                      <strong className="font-mono text-purple-700">{activeSettlement.bankDetails.upiId}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Transaction Reference & Notes */}
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Bank Transfer Reference / UTR Number *</label>
                  <input
                    type="text"
                    required
                    value={transRef}
                    onChange={(e) => setTransRef(e.target.value)}
                    placeholder="e.g. UTR-98218372"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                  />
                  <span className="text-[10px] text-slate-400">
                    The bank transaction UTR reference is sent in vendor notifications and displayed on their ledger.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Admin Notes (Optional)</label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g. Transferred via NEFT"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveSettlement(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessSubmit('rejected')}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-bold transition cursor-pointer"
                >
                  Reject &amp; Refund
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessSubmit('completed')}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold transition shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{submitting ? 'Disbursing...' : 'Mark Disbursed & Settled'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSettlements;
