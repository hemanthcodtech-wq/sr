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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminSettlements = () => {
  const { success, error, info } = useToast();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

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
      const res = await api.get('/settlements/admin');
      if (res.data.success) {
        setSettlements(res.data.settlements);
      }
    } catch (err) {
      console.error('Failed to load settlements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProcess = (settlement) => {
    setActiveSettlement(settlement);
    setTransRef(`UTR-${Date.now().toString().slice(-8)}`);
    setAdminNotes('Bank NEFT / IMPS transfer processed by platform admin');
  };

  const handleProcessSubmit = async (status) => {
    if (!activeSettlement) return;

    setSubmitting(true);
    try {
      const res = await api.put(`/settlements/${activeSettlement._id}/process`, {
        status,
        transactionReference: transRef,
        adminNotes,
      });

      if (res.data.success) {
        success(`Settlement #${activeSettlement._id.slice(0, 8)} marked as ${status}`);
        setActiveSettlement(null);
        fetchSettlements();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Could not process settlement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Payment & Settlements" subtitle="Admin disburses held customer revenues and referral bonus payouts to vendor bank accounts">
      <div className="space-y-6 select-none font-sans">
        <div className="pb-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Vendor Settlement Disbursements</h2>
          <p className="text-xs text-slate-500">
            Admin disburses held customer revenues and referral bonus payouts to vendor bank accounts.
          </p>
        </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bright-card p-6 rounded-2xl h-36 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : settlements.length > 0 ? (
        <div className="bright-card rounded-2xl overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Vendor & Store</th>
                  <th className="p-4">Payout Amount</th>
                  <th className="p-4">Bank Transfer Info</th>
                  <th className="p-4">Date Requested</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Disburse Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settlements.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4">
                      <div className="font-bold text-sm text-slate-900">{s.store?.storeName || s.vendor?.name}</div>
                      <div className="text-slate-400">{s.vendor?.email}</div>
                    </td>

                    <td className="p-4">
                      <div className="text-base font-black text-slate-900">
                        ₹{s.amount?.toLocaleString('en-IN')}
                      </div>
                    </td>

                    <td className="p-4 space-y-0.5 text-slate-600">
                      <div>Holder: <strong>{s.bankDetails?.accountHolder || 'N/A'}</strong></div>
                      <div>A/C: <span className="font-mono">{s.bankDetails?.accountNumber || 'N/A'}</span></div>
                      <div>IFSC: <span className="font-mono uppercase">{s.bankDetails?.ifscCode || 'N/A'}</span></div>
                    </td>

                    <td className="p-4 text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        s.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : s.status === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {s.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span>{s.status.toUpperCase()}</span>
                      </span>
                      {s.transactionReference && (
                        <div className="text-[10px] text-slate-400 font-mono mt-1">Ref: {s.transactionReference}</div>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      {s.status !== 'completed' && s.status !== 'rejected' ? (
                        <button
                          onClick={() => handleOpenProcess(s)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                        >
                          Process Payout
                        </button>
                      ) : (
                        <span className="text-slate-400 font-medium">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bright-card p-12 text-center rounded-2xl space-y-3">
          <CreditCard className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No vendor settlement requests</h3>
          <p className="text-xs text-slate-500">When vendors request payouts from their wallet, they will appear here.</p>
        </div>
      )}

      {/* Process Settlement Modal */}
      {activeSettlement && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bright-card max-w-md w-full p-6 sm:p-8 rounded-3xl border-slate-200 shadow-2xl space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-black text-slate-900">Execute Settlement Payout</h2>
              <p className="text-xs text-slate-500">
                Vendor: {activeSettlement.store?.storeName} • Amount: ₹{activeSettlement.amount.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div>Bank: <strong>{activeSettlement.bankDetails?.bankName || 'Direct Transfer'}</strong></div>
                <div>Account: <strong>{activeSettlement.bankDetails?.accountNumber}</strong></div>
                <div>IFSC: <strong>{activeSettlement.bankDetails?.ifscCode}</strong></div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Bank UTR / Reference ID *</label>
                <input
                  type="text"
                  required
                  value={transRef}
                  onChange={(e) => setTransRef(e.target.value)}
                  placeholder="e.g. UTR-98218372"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Admin Notes</label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveSettlement(null)}
                  className="flex-1 py-2 text-xs font-bold rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessSubmit('rejected')}
                  disabled={submitting}
                  className="py-2 px-3 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                >
                  Reject & Refund
                </button>
                <button
                  type="button"
                  onClick={() => handleProcessSubmit('completed')}
                  disabled={submitting}
                  className="flex-1 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
                >
                  {submitting ? 'Disbursing...' : 'Mark Completed'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default AdminSettlements;
