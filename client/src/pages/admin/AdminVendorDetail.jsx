import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Wallet,
  ShoppingBag,
  Package,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Gift,
  FileText,
  Eye,
  Check,
  X,
  RefreshCw,
  ArrowUpRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminVendorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const [loading, setLoading] = useState(true);
  const [vendorData, setVendorData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'orders' | 'products' | 'transactions'
  const [selectedDocModal, setSelectedDocModal] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchVendorDetails();
  }, [id]);

  const fetchVendorDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/vendors/${id}/full-details`);
      if (res.data?.success) {
        setVendorData(res.data);
        if (res.data.store?.adminNotes) {
          setAdminNotes(res.data.store.adminNotes);
        }
      } else {
        error(res.data?.message || 'Vendor not found');
      }
    } catch (err) {
      console.error('Error fetching vendor full details:', err);
      error(err.response?.data?.message || 'Failed to load vendor details');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (action) => {
    const storeId = vendorData?.store?._id || id;
    try {
      setProcessingAction(true);
      const res = await api.put(`/admin/applications/${storeId}/review`, {
        action,
        notes: adminNotes || (
          action === 'approve' || action === 'approve_and_activate'
            ? 'KYC verification proofs and store approval confirmed.'
            : 'Application rejected.'
        ),
      });

      if (res.data?.success) {
        success(res.data.message || 'Vendor status updated');
        fetchVendorDetails();
        window.dispatchEvent(new Event('vendor-approvals-changed'));
      }
    } catch (err) {
      error(err.response?.data?.message || 'Action failed');
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Vendor Details" subtitle="Loading vendor record...">
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-[#0c2a5e] mb-3" />
          <p className="text-sm font-semibold">Loading vendor dossier & live metrics...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!vendorData || !vendorData.store) {
    return (
      <AdminLayout title="Vendor Not Found" subtitle="Requested vendor does not exist">
        <div className="max-w-xl mx-auto text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-black text-slate-800">Vendor Record Not Found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            The requested vendor ID could not be located in active stores or registrations.
          </p>
          <button
            onClick={() => navigate('/admin/vendors')}
            className="px-5 py-2.5 bg-[#0c2a5e] text-white rounded-xl text-xs font-bold hover:bg-[#153e85] transition"
          >
            ← Return to Vendor Management
          </button>
        </div>
      </AdminLayout>
    );
  }

  const { store, vendor, profilePic, walletBalance, productsCount, products, ordersCount, totalSalesValue, orders, settlements, transactions } = vendorData;

  return (
    <AdminLayout
      title={store.storeName}
      subtitle={`Vendor Full Profile & Dossier • ${store.category || 'Retail'}`}
      onRefresh={fetchVendorDetails}
    >
      <div className="space-y-6 pb-12 animate-fadeIn">
        {/* Navigation Breadcrumb / Top Bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link
            to="/admin/vendors"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to All Vendors</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-black inline-flex items-center gap-1.5 border ${
              store.status === 'active'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : store.status === 'pending' || store.status === 'pending_admin_approval'
                ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                : 'bg-slate-100 text-slate-800 border-slate-300'
            }`}>
              {store.status === 'active' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Clock className="w-3.5 h-3.5 text-amber-600" />}
              <span className="capitalize">{store.status?.replace(/_/g, ' ')}</span>
            </span>

            <button
              onClick={fetchVendorDetails}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
              title="Refresh Live Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* HERO HEADER CARD: Profile Avatar, Store Name, Plan, Owner Info */}
        <div className="bg-gradient-to-r from-[#071d42] via-[#0c2a5e] to-[#153e85] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Profile Image */}
              <div className="relative flex-shrink-0">
                {profilePic || store.logo || vendor?.avatar ? (
                  <img
                    src={profilePic || store.logo || vendor?.avatar}
                    alt={store.storeName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-4 border-white/20 shadow-xl bg-white"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 border-4 border-white/20 flex items-center justify-center text-amber-300 font-black text-3xl shadow-xl">
                    {(store.storeName || 'V').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0c2a5e]" title="Merchant Status" />
              </div>

              {/* Title & Metadata */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{store.storeName}</h1>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/15 text-blue-100 border border-white/20">
                    {store.category || 'Retail Store'}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-blue-200 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-300" />
                    <span>Owner: <strong className="text-white">{vendor?.name || store.vendorUser?.name || 'Merchant Owner'}</strong></span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-300" />
                    <span className="font-mono">{vendor?.email || store.email}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-blue-300" />
                    <span className="font-mono">{vendor?.phone || store.phone || 'N/A'}</span>
                  </div>
                </div>

                <div className="text-xs text-blue-200/90 pt-1 flex items-center gap-3 flex-wrap">
                  <span>Store Registered: {new Date(store.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  {store.activePlan && (
                    <span className="bg-amber-400/20 text-amber-200 border border-amber-300/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                      Plan: {store.activePlan.title} ({store.activePlan.durationDays} days)
                    </span>
                  )}
                  {store.planExpiresAt && (
                    <span className="text-blue-100 text-[11px]">
                      Access Expiry: <strong className="text-white">{new Date(store.planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons for Unapproved Vendors */}
            {store.status !== 'active' && (
              <div className="flex items-center gap-2 flex-wrap md:flex-col md:items-end">
                <button
                  type="button"
                  onClick={() => handleReview('approve_and_activate')}
                  disabled={processingAction}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black shadow-lg transition cursor-pointer flex items-center gap-1.5 active:scale-98 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>{processingAction ? 'Processing...' : 'Approve & Activate Live'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReview('reject')}
                  disabled={processingAction}
                  className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/30 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  Reject Registration
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4 KEY KPI TILES: Wallet, Total Sales Value, Catalog Products, Orders */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tile 1: Wallet Balance */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Wallet Balance</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
              ₹{(walletBalance || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Available for merchant payout disbursement</p>
          </div>

          {/* Tile 2: Total Sales / Order Value */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Order Values</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0c2a5e] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              ₹{(totalSalesValue || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Total revenue generated ({ordersCount || 0} orders)</p>
          </div>

          {/* Tile 3: Live Products */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Live Products</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {productsCount || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Active catalog items uploaded by vendor</p>
          </div>

          {/* Tile 4: Paid Platform Fee */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Enrollment Fee</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              ₹{(store.enrollmentFeePaid || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
              {(store.enrollmentFeePaid || 0) > 0 ? '✓ Fee Confirmed & Paid' : 'Awaiting Enrollment Payment'}
            </p>
          </div>
        </div>

        {/* TABS NAVIGATION BAR */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="flex items-center gap-2 px-4 sm:px-6 border-b border-slate-200 overflow-x-auto text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-4 font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-[#0c2a5e] text-[#0c2a5e]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Overview &amp; KYC Verification</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`py-4 px-4 font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'border-[#0c2a5e] text-[#0c2a5e]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Orders &amp; Values ({ordersCount || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`py-4 px-4 font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'products'
                  ? 'border-[#0c2a5e] text-[#0c2a5e]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products Catalog ({productsCount || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-4 font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'transactions'
                  ? 'border-[#0c2a5e] text-[#0c2a5e]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Payouts &amp; Bank Ledger ({settlements?.length || 0})</span>
            </button>
          </div>

          {/* TAB CONTENT PANELS */}
          <div className="p-6">
            {/* ================= TAB 1: OVERVIEW & KYC ================= */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Merchant Profile & Dispatch & Bank Details */}
                  <div className="space-y-5">
                    {/* Merchant Owner Profile */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                          <User className="w-4 h-4 text-[#0c2a5e]" />
                          <span>Merchant Owner Profile</span>
                        </div>
                        {profilePic && (
                          <img
                            src={profilePic}
                            alt="Avatar"
                            className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                          />
                        )}
                      </div>
                      <div className="space-y-2 text-xs text-slate-600">
                        <p className="flex justify-between">
                          <span className="text-slate-400">Full Name:</span>
                          <strong className="text-slate-900">{vendor?.name || store.vendorUser?.name || 'N/A'}</strong>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Email Address:</span>
                          <span className="font-mono text-slate-800">{vendor?.email || store.email}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Contact Phone:</span>
                          <span className="font-mono text-slate-800">{vendor?.phone || store.phone || 'N/A'}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Live Wallet Balance:</span>
                          <strong className="text-emerald-700 font-mono text-sm">₹{(walletBalance || 0).toLocaleString('en-IN')}</strong>
                        </p>
                        {store.referralCodeUsed && (
                          <p className="flex justify-between pt-1 border-t border-slate-200/60 text-emerald-700 font-bold">
                            <span className="flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> Referral Code Used:</span>
                            <span className="font-mono">{store.referralCodeUsed}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Store Dispatch & Warehouse Address */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-2 border-b border-slate-200">
                        <MapPin className="w-4 h-4 text-[#0c2a5e]" />
                        <span>Store Location &amp; Dispatch Hub</span>
                      </div>
                      <div className="space-y-1.5 text-xs text-slate-600 leading-relaxed">
                        <p><span className="text-slate-400">Street Address:</span> {store.address?.street || 'N/A'}</p>
                        {store.address?.landmark && (
                          <p><span className="text-slate-400">Landmark:</span> {store.address.landmark}</p>
                        )}
                        <p><span className="text-slate-400">City &amp; State:</span> {store.address?.city || 'Hyderabad'}, {store.address?.state || 'Andhra Pradesh'}</p>
                        <p><span className="text-slate-400">Postal PIN Code:</span> <strong className="font-mono text-slate-900">{store.address?.zipCode || '534201'}</strong></p>
                      </div>
                    </div>

                    {/* Bank Settlement Account Details */}
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-2 border-b border-slate-200">
                        <Building className="w-4 h-4 text-[#0c2a5e]" />
                        <span>Disbursement Bank Details</span>
                      </div>
                      <div className="space-y-2 text-xs text-slate-600">
                        <p className="flex justify-between">
                          <span className="text-slate-400">Account Holder:</span>
                          <strong className="text-slate-900">{store.bankDetails?.accountHolder || 'N/A'}</strong>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Bank Name:</span>
                          <span className="text-slate-800">{store.bankDetails?.bankName || 'State Bank of India'}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">Account Number:</span>
                          <span className="font-mono font-bold text-slate-900">{store.bankDetails?.accountNumber || 'Pending'}</span>
                        </p>
                        <p className="flex justify-between">
                          <span className="text-slate-400">IFSC Code:</span>
                          <span className="font-mono uppercase font-bold text-slate-900">{store.bankDetails?.ifscCode || 'N/A'}</span>
                        </p>
                        {store.bankDetails?.upiId && (
                          <p className="flex justify-between">
                            <span className="text-slate-400">UPI ID:</span>
                            <span className="font-mono text-[#0c2a5e] font-semibold">{store.bankDetails.upiId}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Verified KYC Document Proofs */}
                  <div className="space-y-5">
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                          <FileText className="w-4 h-4 text-[#0c2a5e]" />
                          <span>Government KYC Verification Proofs</span>
                        </div>
                        <span className="text-xs text-slate-400">Official Merchant ID</span>
                      </div>

                      {/* Aadhaar Card Proof */}
                      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">Aadhaar Card</span>
                          <span className="font-mono font-bold text-slate-900">
                            {store.documents?.aadhaarNumber || 'Not provided'}
                          </span>
                        </div>
                        {store.documents?.aadhaarDocument ? (
                          <div className="relative group rounded-xl overflow-hidden border border-slate-200 max-h-52 bg-slate-100 flex items-center justify-center">
                            <img
                              src={store.documents.aadhaarDocument}
                              alt="Aadhaar Document"
                              loading="lazy"
                              className="w-full h-44 object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedDocModal({ title: 'Aadhaar Document Proof', url: store.documents.aadhaarDocument })}
                              className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold gap-2 text-xs cursor-pointer"
                            >
                              <Eye className="w-4 h-4" /> Click to Enlarge Proof
                            </button>
                          </div>
                        ) : (
                          <p className="text-slate-400 italic text-xs">No Aadhaar scan uploaded</p>
                        )}
                      </div>

                      {/* PAN Card Proof */}
                      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">PAN Card</span>
                          <span className="font-mono font-bold text-slate-900">
                            {store.documents?.panNumber || 'Not provided'}
                          </span>
                        </div>
                        {store.documents?.panDocument ? (
                          <div className="relative group rounded-xl overflow-hidden border border-slate-200 max-h-52 bg-slate-100 flex items-center justify-center">
                            <img
                              src={store.documents.panDocument}
                              alt="PAN Card Document"
                              loading="lazy"
                              className="w-full h-44 object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedDocModal({ title: 'PAN Card Document Proof', url: store.documents.panDocument })}
                              className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold gap-2 text-xs cursor-pointer"
                            >
                              <Eye className="w-4 h-4" /> Click to Enlarge Proof
                            </button>
                          </div>
                        ) : (
                          <p className="text-slate-400 italic text-xs">No PAN scan uploaded</p>
                        )}
                      </div>

                      {/* GST Details */}
                      <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">GSTIN Registration</span>
                          <span className="font-mono font-bold text-slate-900">
                            {store.documents?.gstNumber || 'Exempt / Not Provided'}
                          </span>
                        </div>
                        {store.documents?.gstDocument && (
                          <button
                            type="button"
                            onClick={() => setSelectedDocModal({ title: 'GST Document', url: store.documents.gstDocument })}
                            className="text-blue-600 hover:underline inline-flex items-center gap-1 text-xs pt-1 font-semibold cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> View GST Certificate
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Admin Review Notes (if unapproved) */}
                    {store.status !== 'active' && (
                      <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">Administrator Audit &amp; Evaluation Notes</span>
                          <span className="text-[11px] text-slate-400">Attached to merchant profile</span>
                        </div>
                        <textarea
                          rows={3}
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Enter administrative review notes or feedback..."
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 2: ORDERS & VALUES ================= */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h4 className="font-bold text-base text-slate-900">Store Orders &amp; Fulfillment Share</h4>
                    <p className="text-xs text-slate-500">Every customer order placed containing {store.storeName} catalog items</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-bold">Total Vendor Sales Value</span>
                    <strong className="text-emerald-700 font-mono text-xl font-black">
                      ₹{(totalSalesValue || 0).toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>

                {!orders || orders.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600 text-sm">No Orders Received Yet</p>
                    <p className="text-xs text-slate-400 mt-0.5">When customers purchase items from this merchant, orders appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3.5">Invoice #</th>
                          <th className="p-3.5">Customer Name</th>
                          <th className="p-3.5">Store Items</th>
                          <th className="p-3.5">Order Share Value</th>
                          <th className="p-3.5">Payment Method</th>
                          <th className="p-3.5">Payment Status</th>
                          <th className="p-3.5">Order Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {orders.map((ord) => (
                          <tr key={ord._id} className="hover:bg-slate-50/70 transition">
                            <td className="p-3.5 font-mono font-bold text-[#0c2a5e]">
                              {ord.invoiceNumber || ord._id.slice(-8).toUpperCase()}
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900">{ord.customerName}</div>
                              {ord.customerCity && <div className="text-[10px] text-slate-400">{ord.customerCity}</div>}
                            </td>
                            <td className="p-3.5">
                              <span className="font-bold text-slate-700">{ord.itemsCount} item(s)</span>
                            </td>
                            <td className="p-3.5 font-black text-emerald-700 text-sm">
                              ₹{(ord.orderShare || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="p-3.5 font-mono capitalize text-slate-600">
                              {ord.paymentMethod || 'Online'}
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                ord.paymentStatus === 'completed' || ord.paymentStatus === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {ord.paymentStatus || 'paid'}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-500 whitespace-nowrap">
                              {new Date(ord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 3: PRODUCTS CATALOG ================= */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-base text-slate-900">Merchant Products Catalog</h4>
                    <p className="text-xs text-slate-500">All live inventory items listed under {store.storeName}</p>
                  </div>
                  <span className="font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full">
                    {productsCount || 0} Listed Items
                  </span>
                </div>

                {!products || products.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600 text-sm">No Products Listed Yet</p>
                    <p className="text-xs text-slate-400 mt-0.5">Merchant has not created any product catalog items for this store.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((prod) => (
                      <div key={prod._id} className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between shadow-2xs hover:shadow-sm transition">
                        <div>
                          <div className="w-full h-36 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 mb-3 flex items-center justify-center">
                            {prod.images && prod.images[0] ? (
                              <img
                                src={prod.images[0]}
                                alt={prod.title}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <Package className="w-8 h-8 text-slate-400" />
                            )}
                          </div>
                          <h5 className="font-bold text-slate-900 text-xs line-clamp-2" title={prod.title}>{prod.title}</h5>
                          <div className="text-[11px] text-slate-400 capitalize mt-1">{prod.category || 'General'}</div>
                        </div>

                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                          <span className="font-black text-slate-900 text-sm">₹{prod.price?.toLocaleString('en-IN')}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            (prod.stock || 0) <= 5
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {prod.stock || 0} left
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 4: PAYOUTS & TRANSACTIONS ================= */}
            {activeTab === 'transactions' && (
              <div className="space-y-6">
                {/* Current Balance Banner */}
                <div className="p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Current Wallet Amount</span>
                    <div className="text-3xl font-black text-emerald-800 mt-1 font-mono">
                      ₹{(walletBalance || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-600 block">Bank Account for Payout:</span>
                    <strong className="text-slate-900 font-mono text-xs">
                      {store.bankDetails?.bankName || 'SBI'} ••••{store.bankDetails?.accountNumber?.slice(-4) || 'N/A'}
                    </strong>
                    <div className="text-[11px] text-slate-500 mt-0.5">IFSC: {store.bankDetails?.ifscCode || 'N/A'}</div>
                  </div>
                </div>

                {/* Section 1: Admin Bank Settlements Disbursed */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      <span>Admin Bank Disbursements &amp; Settlements</span>
                    </h4>
                    <span className="text-xs text-slate-400 font-medium">
                      {settlements?.length || 0} payout record(s)
                    </span>
                  </div>

                  {!settlements || settlements.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-500">
                      <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-xs">No Direct Settlements Recorded Yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">When admin processes bank payouts to this vendor, records will be listed here.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3.5">Reference / Txn ID</th>
                            <th className="p-3.5">Amount Disbursed</th>
                            <th className="p-3.5">Disbursed To</th>
                            <th className="p-3.5">Admin Notes</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5">Disbursement Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {settlements.map((st) => (
                            <tr key={st._id} className="hover:bg-slate-50/70 transition">
                              <td className="p-3.5 font-mono font-bold text-slate-900">
                                {st.transactionReference || st._id.slice(-8).toUpperCase()}
                              </td>
                              <td className="p-3.5 font-black text-emerald-700 text-sm">
                                ₹{(st.amount || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="p-3.5 text-slate-600">
                                {st.bankDetails?.bankName || 'Bank'} ({st.bankDetails?.accountNumber?.slice(-4) ? `••••${st.bankDetails.accountNumber.slice(-4)}` : 'A/C'})
                              </td>
                              <td className="p-3.5 text-slate-500 text-xs">
                                {st.adminNotes || 'Admin payout settlement'}
                              </td>
                              <td className="p-3.5">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  {st.status || 'completed'}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-500 whitespace-nowrap">
                                {new Date(st.settledAt || st.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section 2: Wallet Transactions Ledger */}
                {transactions && transactions.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#0c2a5e]" />
                        <span>Wallet Transactions Ledger</span>
                      </h4>
                      <span className="text-xs text-slate-400 font-medium">{transactions.length} transactions</span>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                          <tr>
                            <th className="p-3.5">Type</th>
                            <th className="p-3.5">Description</th>
                            <th className="p-3.5">Amount</th>
                            <th className="p-3.5">Balance After</th>
                            <th className="p-3.5">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {transactions.map((tx) => (
                            <tr key={tx._id} className="hover:bg-slate-50/70 transition">
                              <td className="p-3.5">
                                <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                                  {tx.type?.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td className="p-3.5 text-slate-700">{tx.description}</td>
                              <td className="p-3.5 font-mono font-bold">
                                <span className={tx.amount >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                                  {tx.amount >= 0 ? `+₹${tx.amount.toLocaleString('en-IN')}` : `-₹${Math.abs(tx.amount).toLocaleString('en-IN')}`}
                                </span>
                              </td>
                              <td className="p-3.5 font-mono text-slate-600">
                                ₹{(tx.balanceAfter || 0).toLocaleString('en-IN')}
                              </td>
                              <td className="p-3.5 text-slate-500 whitespace-nowrap">
                                {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DOCUMENT LIGHTBOX MODAL */}
      {selectedDocModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-black text-slate-900 text-base">{selectedDocModal.title}</h4>
              <button
                type="button"
                onClick={() => setSelectedDocModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto flex items-center justify-center bg-slate-50 rounded-2xl p-2 border border-slate-200">
              <img
                src={selectedDocModal.url}
                alt={selectedDocModal.title}
                className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-xs"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDocModal(null)}
                className="px-5 py-2 bg-[#0c2a5e] text-white rounded-xl text-xs font-bold hover:bg-[#153e85] transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminVendorDetail;
