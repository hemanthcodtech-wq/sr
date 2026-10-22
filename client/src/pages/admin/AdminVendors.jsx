import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Store,
  User,
  Phone,
  Mail,
  ShieldCheck,
  Check,
  X,
  Clock,
  Wallet,
  FileText,
  MapPin,
  ExternalLink,
  AlertCircle,
  Eye,
  CheckCircle2,
  Gift,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Calendar,
  AlertTriangle,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  CreditCard,
  Building,
  Package,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownLeft,
  Tag,
  Layers,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminVendors = () => {
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  // State
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'active' | 'approved_pending_payment' | 'expired' | 'suspended'
  const [applications, setApplications] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // Modals
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [vendorDetails, setVendorDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [modalActiveTab, setModalActiveTab] = useState('overview'); // 'overview' | 'products' | 'orders' | 'transactions'
  const [selectedDocModal, setSelectedDocModal] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [extendExpiryModal, setExtendExpiryModal] = useState(null); // store object

  // Filter & Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [feeFilter, setFeeFilter] = useState('all'); // 'all' | 'paid' | 'unpaid'
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'expiry_soon' | 'expiry_far'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appRes, vendRes] = await Promise.all([
        api.get('/admin/applications'),
        api.get('/admin/vendors'),
      ]);

      if (appRes.data?.success) {
        setApplications(appRes.data.applications || []);
      }
      if (vendRes.data?.success) {
        setVendors(vendRes.data.vendors || []);
      }
    } catch (err) {
      console.error('Error fetching vendor data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Open vendor details page (full page with store slug or ID)
  const openVendorDetails = (store) => {
    const slugOrId = store.slug || (store.storeName ? store.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : null) || store._id;
    if (slugOrId) {
      navigate(`/admin/vendors/${slugOrId}`);
    }
  };

  // Merge & normalize all applications and vendor stores into a unified list
  const allStores = useMemo(() => {
    const storeMap = new Map();

    // 1. Add all from applications endpoint
    applications.forEach((app) => {
      if (app && app._id) {
        storeMap.set(app._id.toString(), {
          ...app,
          source: 'application',
          vendorUser: app.vendor || null,
        });
      }
    });

    // 2. Supplement from vendors endpoint
    vendors.forEach((vend) => {
      if (vend.store && vend.store._id) {
        const id = vend.store._id.toString();
        const existing = storeMap.get(id);
        storeMap.set(id, {
          ...(existing || {}),
          ...vend.store,
          vendorUser: vend,
          walletBalance: vend.walletBalance || existing?.walletBalance || 0,
          referralCode: vend.referralCode || existing?.referralCode || '',
          referredBy: vend.referredBy || existing?.referredBy || null,
        });
      }
    });

    return Array.from(storeMap.values()).filter(
      (s) => (s.enrollmentFeePaid || 0) > 0 || ['active', 'rejected', 'suspended'].includes(s.status)
    );
  }, [applications, vendors]);

  // Review (Approve, Approve & Activate, Reject)
  const handleReview = async (storeId, action, notes) => {
    setProcessingId(storeId);
    try {
      const res = await api.put(`/admin/applications/${storeId}/review`, {
        action,
        notes: notes || adminNotes || (
          action === 'approve' || action === 'approve_and_activate'
            ? 'KYC verification proofs and platform fee payment confirmed. Store approved & live!'
            : 'Document proofs could not be verified. Please submit clear copies.'
        ),
      });

      if (res.data?.success) {
        success(res.data.message || `Application updated successfully`);
        setSelectedApplication(null);
        setAdminNotes('');
        fetchData();
        window.dispatchEvent(new Event('vendor-approvals-changed'));
      }
    } catch (err) {
      error(err.response?.data?.message || `Failed to review application`);
    } finally {
      setProcessingId(null);
    }
  };

  // Toggle store status or extend expiry
  const handleUpdateStatus = async (storeId, status, extendDays = null) => {
    setProcessingId(storeId);
    try {
      const payload = {};
      if (status) payload.status = status;
      if (extendDays) payload.extendDays = extendDays;

      const res = await api.put(`/admin/vendors/${storeId}/status`, payload);
      if (res.data?.success) {
        success(res.data.message || 'Store status updated');
        setExtendExpiryModal(null);
        fetchData();
        window.dispatchEvent(new Event('vendor-approvals-changed'));
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update store status');
    } finally {
      setProcessingId(null);
    }
  };

  // Helper calculations
  const calculateDaysRemaining = (expiryDate) => {
    if (!expiryDate) return null;
    const diffTime = new Date(expiryDate).getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Stats Counters
  const pendingCount = allStores.filter((s) => s.status === 'pending_admin_approval').length;
  const approvedPendingFeeCount = allStores.filter((s) => s.status === 'approved_pending_payment').length;
  const activeCount = allStores.filter((s) => {
    const days = calculateDaysRemaining(s.planExpiresAt);
    return s.status === 'active' && (days === null || days > 0);
  }).length;
  const expiredCount = allStores.filter((s) => {
    const days = calculateDaysRemaining(s.planExpiresAt);
    return days !== null && days <= 0;
  }).length;
  const totalFeesCollected = allStores.reduce((sum, s) => sum + (s.enrollmentFeePaid || 0), 0);

  // Filtering & Sorting
  const filteredStores = useMemo(() => {
    return allStores.filter((store) => {
      const days = calculateDaysRemaining(store.planExpiresAt);
      const isExpired = days !== null && days <= 0;

      // Tab filter
      if (activeTab === 'pending' && store.status !== 'pending_admin_approval') return false;
      if (activeTab === 'approved_pending_payment' && store.status !== 'approved_pending_payment') return false;
      if (activeTab === 'active' && (store.status !== 'active' || isExpired)) return false;
      if (activeTab === 'expired' && !isExpired) return false;
      if (activeTab === 'suspended' && !['suspended', 'rejected'].includes(store.status)) return false;

      // Category filter
      if (categoryFilter !== 'all' && store.category !== categoryFilter) return false;

      // Fee filter
      const isPaid = (store.enrollmentFeePaid || 0) > 0;
      if (feeFilter === 'paid' && !isPaid) return false;
      if (feeFilter === 'unpaid' && isPaid) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const storeName = (store.storeName || '').toLowerCase();
        const ownerName = (store.vendorUser?.name || store.vendor?.name || '').toLowerCase();
        const email = (store.email || store.vendorUser?.email || store.vendor?.email || '').toLowerCase();
        const phone = (store.phone || store.vendorUser?.phone || '').toLowerCase();
        const city = (store.address?.city || '').toLowerCase();
        const refCode = (store.referralCodeUsed || store.vendorUser?.referralCode || '').toLowerCase();

        return (
          storeName.includes(query) ||
          ownerName.includes(query) ||
          email.includes(query) ||
          phone.includes(query) ||
          city.includes(query) ||
          refCode.includes(query)
        );
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === 'expiry_soon') {
        const daysA = calculateDaysRemaining(a.planExpiresAt) ?? 99999;
        const daysB = calculateDaysRemaining(b.planExpiresAt) ?? 99999;
        return daysA - daysB;
      }
      if (sortBy === 'expiry_far') {
        const daysA = calculateDaysRemaining(a.planExpiresAt) ?? -99999;
        const daysB = calculateDaysRemaining(b.planExpiresAt) ?? -99999;
        return daysB - daysA;
      }
      return 0;
    });
  }, [allStores, activeTab, categoryFilter, feeFilter, searchQuery, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredStores.length / itemsPerPage) || 1;
  const paginatedStores = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStores.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStores, currentPage, itemsPerPage]);

  const categories = useMemo(() => {
    const set = new Set();
    allStores.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return Array.from(set);
  }, [allStores]);

  return (
    <AdminLayout
      title="Vendor Management"
      subtitle="Verify KYC documents, approve registrations, monitor active merchant storefronts & validity"
    >
      <div className="space-y-6 select-none font-sans pb-16">
        {/* =====================================================================
            1. QUICK KPI METRIC CARDS
           ===================================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {/* Total Stores */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Total Stores</span>
              <Store className="w-4 h-4 text-[#0c2a5e]" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{allStores.length}</div>
            <span className="text-[11px] text-slate-400 font-medium">All registered merchants</span>
          </div>

          {/* Pending Approval (Pulse Attention) */}
          <div
            onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
            className="bg-amber-50/80 p-4 sm:p-5 rounded-2xl border border-amber-300 shadow-2xs cursor-pointer hover:bg-amber-100/70 transition"
          >
            <div className="flex items-center justify-between text-amber-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-pulse text-amber-600" />
                <span>Pending KYC</span>
              </span>
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full animate-bounce">
                  Action Req
                </span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-900">{pendingCount}</div>
            <span className="text-[11px] text-amber-700 font-semibold">Requires admin verification</span>
          </div>

          {/* Active Stores (Fees Paid) */}
          <div
            onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
            className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-2xs cursor-pointer hover:bg-emerald-100/60 transition"
          >
            <div className="flex items-center justify-between text-emerald-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Active (Live)</span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-950">{activeCount}</div>
            <span className="text-[11px] text-emerald-700 font-medium">Fees paid &amp; valid access</span>
          </div>

          {/* Expired Access */}
          <div
            onClick={() => { setActiveTab('expired'); setCurrentPage(1); }}
            className="bg-rose-50/70 p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-2xs cursor-pointer hover:bg-rose-100/60 transition"
          >
            <div className="flex items-center justify-between text-rose-800 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Expired Stores</span>
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-950">{expiredCount}</div>
            <span className="text-[11px] text-rose-700 font-medium">Renewal required</span>
          </div>

          {/* Fees Collected */}
          <div className="col-span-2 lg:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Fees Collected</span>
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              ₹{totalFeesCollected.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold">Store onboarding revenue</span>
          </div>
        </div>

        {/* =====================================================================
            2. PRIMARY NAVIGATION TABS
           ===================================================================== */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
          {[
            { id: 'all', label: 'All Merchants', count: allStores.length },
            { id: 'pending', label: 'KYC Requests', count: pendingCount, highlight: pendingCount > 0 },
            { id: 'approved_pending_payment', label: 'Approved (Awaiting Fee)', count: approvedPendingFeeCount },
            { id: 'active', label: 'Active & Paid', count: activeCount },
            { id: 'expired', label: 'Expired Validity', count: expiredCount, alert: expiredCount > 0 },
            { id: 'suspended', label: 'Suspended / Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition whitespace-nowrap cursor-pointer flex items-center gap-2 border-b-2 -mb-[2px] ${
                activeTab === tab.id
                  ? 'border-[#0c2a5e] text-[#0c2a5e] bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    tab.highlight
                      ? 'bg-amber-500 text-white'
                      : tab.alert
                      ? 'bg-rose-500 text-white'
                      : activeTab === tab.id
                      ? 'bg-[#0c2a5e] text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* =====================================================================
            3. FILTER TOOLBAR & SEARCH
           ===================================================================== */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search store, owner, phone, email, city..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap justify-end text-xs">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold hidden sm:inline">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Fee Paid Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold hidden sm:inline">Fee:</span>
              <select
                value={feeFilter}
                onChange={(e) => { setFeeFilter(e.target.value); setCurrentPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="all">All Fees</option>
                <option value="paid">✓ Fees Paid</option>
                <option value="unpaid">✕ Unpaid</option>
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 font-medium text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="expiry_soon">Expiry Soonest</option>
                <option value="expiry_far">Expiry Furthest</option>
              </select>
            </div>

            {/* Refresh */}
            <button
              onClick={fetchData}
              title="Refresh Data"
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* =====================================================================
            4. VENDOR & APPLICATION LISTING (RESPONSIVE TABLE + MOBILE CARDS)
           ===================================================================== */}
        {loading ? (
          /* Skeleton Loader */
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-5 rounded-2xl h-24 animate-pulse border border-slate-200/90 shadow-2xs" />
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          /* Empty State */
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <Store className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No merchant stores found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || categoryFilter !== 'all' || feeFilter !== 'all' || activeTab !== 'all'
                ? 'No stores match your current filters. Try resetting your search or tab filters.'
                : 'When new vendors submit registration or KYC documents, they will appear right here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden lg:block bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Store &amp; Merchant</th>
                    <th className="p-4">Contact &amp; KYC</th>
                    <th className="p-4">Fees &amp; Access Expiry</th>
                    <th className="p-4">Store Status</th>
                    <th className="p-4">Referral &amp; Wallet</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStores.map((store) => {
                    const daysRemaining = calculateDaysRemaining(store.planExpiresAt);
                    const isExpired = daysRemaining !== null && daysRemaining <= 0;
                    const isExpiringSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 30;
                    const isPaid = (store.enrollmentFeePaid || 0) > 0;
                    const isPending = store.status === 'pending_admin_approval';
                    const isApprovedAwaitingFee = store.status === 'approved_pending_payment';
                    const isActive = store.status === 'active' && !isExpired;
                    const isSuspended = store.status === 'suspended';
                    const isRejected = store.status === 'rejected';

                    return (
                      <tr key={store._id} className="hover:bg-slate-50/70 transition">
                        {/* Store & Merchant */}
                        <td className="p-4">
                          <div>
                            <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                              <Link
                                to={`/admin/vendors/${store.slug || (store.storeName ? store.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : store._id)}`}
                                className="hover:text-[#0c2a5e] hover:underline"
                              >
                                {store.storeName}
                              </Link>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                {store.category || 'General'}
                              </span>
                            </div>
                            <div className="text-slate-500 text-[11px] mt-0.5">
                              Owner: <strong className="text-slate-800">{store.vendorUser?.name || store.vendor?.name || 'Authorized Seller'}</strong>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Registered: {new Date(store.createdAt || Date.now()).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                        </td>

                        {/* Contact & KYC Proofs */}
                        <td className="p-4 space-y-1">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate max-w-[160px]">{store.email || store.vendorUser?.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{store.phone || store.vendorUser?.phone || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-1 pt-0.5 text-[11px]">
                            {store.documents?.aadhaarNumber ? (
                              <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold">
                                <Check className="w-3 h-3" /> Aadhaar
                              </span>
                            ) : (
                              <span className="text-slate-400">No Aadhaar</span>
                            )}
                            <span className="text-slate-300">•</span>
                            {store.documents?.panNumber ? (
                              <span className="inline-flex items-center gap-0.5 text-emerald-700 font-semibold">
                                <Check className="w-3 h-3" /> PAN
                              </span>
                            ) : (
                              <span className="text-slate-400">No PAN</span>
                            )}
                          </div>
                        </td>

                        {/* Fees & Access Expiry */}
                        <td className="p-4 space-y-1.5">
                          {/* Fee Status */}
                          <div>
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Paid ₹{store.enrollmentFeePaid?.toLocaleString('en-IN')}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Fee Unpaid (₹999)</span>
                              </span>
                            )}
                          </div>

                          {/* Access Expiration Date */}
                          <div className="text-[11px]">
                            {store.planExpiresAt ? (
                              <div>
                                <div className="text-slate-700 font-bold flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>Expires {new Date(store.planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                </div>
                                <div className="mt-0.5">
                                  {isExpired ? (
                                    <span className="text-rose-600 font-bold text-[10px] inline-flex items-center gap-1">
                                      <AlertTriangle className="w-2.5 h-2.5" /> Access Expired
                                    </span>
                                  ) : isExpiringSoon ? (
                                    <span className="text-amber-600 font-bold text-[10px]">
                                      {daysRemaining} days remaining (Expiring Soon)
                                    </span>
                                  ) : (
                                    <span className="text-emerald-700 font-medium text-[10px]">
                                      {daysRemaining} days access left
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[10px] italic">No validity date set</span>
                            )}
                          </div>
                        </td>

                        {/* Store Status Pill */}
                        <td className="p-4">
                          {isPending && (
                            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-black text-[11px] inline-flex items-center gap-1.5 animate-pulse border border-amber-300">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Pending KYC</span>
                            </span>
                          )}
                          {isApprovedAwaitingFee && (
                            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-black text-[11px] inline-flex items-center gap-1.5 border border-blue-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Approved • Wait Fee</span>
                            </span>
                          )}
                          {isActive && (
                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px] inline-flex items-center gap-1.5 border border-emerald-200">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Active (Live)</span>
                            </span>
                          )}
                          {isExpired && store.status === 'active' && (
                            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-black text-[11px] inline-flex items-center gap-1.5 border border-rose-300">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Expired</span>
                            </span>
                          )}
                          {isSuspended && (
                            <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-800 font-bold text-[11px] inline-flex items-center gap-1.5">
                              <X className="w-3.5 h-3.5" />
                              <span>Suspended</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-bold text-[11px] inline-flex items-center gap-1.5">
                              <X className="w-3.5 h-3.5" />
                              <span>Rejected</span>
                            </span>
                          )}
                        </td>

                        {/* Referral & Wallet */}
                        <td className="p-4 space-y-1">
                          <div className="font-black text-sm text-emerald-700">
                            ₹{(store.walletBalance || 0).toLocaleString('en-IN')}
                          </div>
                          {store.referralCodeUsed && (
                            <div className="text-[10px] text-slate-500">
                              Ref: <strong className="font-mono text-[#0c2a5e]">{store.referralCodeUsed}</strong>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right whitespace-nowrap">
                          {isPending ? (
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => openVendorDetails(store)}
                                className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                title="View Application Details"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>View</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReview(store._id, 'approve_and_activate')}
                                disabled={processingId === store._id}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer inline-flex items-center gap-1 shadow-2xs disabled:opacity-50"
                                title="Approve & Activate Live Store"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>{processingId === store._id ? 'Approving...' : 'Approve'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReview(store._id, 'reject')}
                                disabled={processingId === store._id}
                                className="px-2.5 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold text-xs transition cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                                title="Reject Application"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => openVendorDetails(store)}
                                className="px-3.5 py-1.5 rounded-xl bg-[#0c2a5e] text-white hover:bg-[#153e85] font-bold text-xs transition cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                                title="View Complete Application Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Card View */}
            <div className="lg:hidden grid grid-cols-1 gap-4">
              {paginatedStores.map((store) => {
                const daysRemaining = calculateDaysRemaining(store.planExpiresAt);
                const isExpired = daysRemaining !== null && daysRemaining <= 0;
                const isPaid = (store.enrollmentFeePaid || 0) > 0;
                const isPending = store.status === 'pending_admin_approval';

                return (
                  <div
                    key={store._id}
                    className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{store.storeName}</h4>
                        <span className="text-[10px] text-slate-500">
                          Owner: <strong className="text-slate-800">{store.vendorUser?.name || store.vendor?.name}</strong>
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {store.phone || store.vendorUser?.phone} • {store.address?.city || 'India'}
                        </div>
                      </div>

                      {/* Status badge */}
                      <div>
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-black text-[10px] animate-pulse">
                            Pending
                          </span>
                        )}
                        {!isPending && store.status === 'active' && !isExpired && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-black text-[10px]">
                            Active
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[10px]">
                            Expired
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expiry & Fees Row */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Fee Status</span>
                        {isPaid ? (
                          <span className="font-black text-emerald-700 text-xs">✓ Paid ₹{store.enrollmentFeePaid}</span>
                        ) : (
                          <span className="font-bold text-amber-700 text-xs">✕ Unpaid (₹999)</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Access Expiry</span>
                        {store.planExpiresAt ? (
                          <span className={`font-bold text-xs ${isExpired ? 'text-rose-600' : 'text-slate-800'}`}>
                            {new Date(store.planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Not set</span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApplication(store);
                              setAdminNotes(store.adminNotes || '');
                            }}
                            className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReview(store._id, 'approve_and_activate')}
                            disabled={processingId === store._id}
                            className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-2xs disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReview(store._id, 'reject')}
                            disabled={processingId === store._id}
                            className="px-3 py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openVendorDetails(store)}
                          className="w-full py-2 bg-[#0c2a5e] hover:bg-[#153e85] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Application</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* =====================================================================
                5. PAGINATION CONTROLS
               ===================================================================== */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="text-slate-500 font-medium text-center sm:text-left">
                Showing{' '}
                <strong className="text-slate-900">
                  {filteredStores.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
                </strong>{' '}
                to{' '}
                <strong className="text-slate-900">
                  {Math.min(currentPage * itemsPerPage, filteredStores.length)}
                </strong>{' '}
                of <strong className="text-slate-900">{filteredStores.length}</strong> merchants
              </div>

              <div className="flex items-center gap-3">
                {/* Per Page Selector */}
                <div className="flex items-center gap-1 text-slate-500">
                  <span>Show:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Page Navigation */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="px-3 py-1 font-bold text-slate-800">
                    Page {currentPage} of {totalPages}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            MODAL 1: COMPLETE VENDOR APPLICATION DOSSIER (APPROVE / REJECT)
           ===================================================================== */}
        {selectedApplication && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="bg-white max-w-4xl w-full rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-fadeIn">
              {/* Modal Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-[#071d42] via-[#0c2a5e] to-[#153e85] text-white flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                  {/* Vendor Profile Avatar / Store Logo */}
                  <div className="relative">
                    {vendorDetails?.profilePic || selectedApplication.logo || selectedApplication.vendorUser?.avatar ? (
                      <img
                        src={vendorDetails?.profilePic || selectedApplication.logo || selectedApplication.vendorUser?.avatar}
                        alt={selectedApplication.storeName}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-white/30 shadow-md bg-white"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-amber-300 flex-shrink-0 shadow-inner font-black text-xl">
                        {(selectedApplication.storeName || 'S').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0c2a5e]" title="Merchant Account" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg sm:text-xl font-black tracking-tight">{selectedApplication.storeName}</h3>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                        {selectedApplication.category}
                      </span>
                    </div>
                    <p className="text-xs text-blue-200 mt-1 flex items-center gap-2 flex-wrap">
                      <span>Owner: <strong className="text-white">{vendorDetails?.vendor?.name || selectedApplication.vendorUser?.name || selectedApplication.vendor?.name || 'Store Owner'}</strong></span>
                      <span>•</span>
                      <span>Joined {new Date(selectedApplication.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {loadingDetails && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-300 font-bold animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Fetching live metrics...
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedApplication(null);
                    setVendorDetails(null);
                  }}
                  className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Metrics Bar: Wallet, Sales, Orders, Products */}
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs flex-shrink-0">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-emerald-600" />
                    <span>Wallet Amount</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-emerald-700 mt-0.5">
                    ₹{(vendorDetails?.walletBalance ?? selectedApplication.walletBalance ?? 0).toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3 text-[#0c2a5e]" />
                    <span>Order Values</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    ₹{(vendorDetails?.totalSalesValue ?? 0).toLocaleString('en-IN')}
                    <span className="text-[10px] text-slate-500 font-medium ml-1">({vendorDetails?.ordersCount ?? 0} orders)</span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Package className="w-3 h-3 text-indigo-600" />
                    <span>Catalog Products</span>
                  </div>
                  <div className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                    {vendorDetails?.productsCount ?? 0}
                    <span className="text-[10px] text-slate-500 font-medium ml-1">Live Items</span>
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-amber-600" />
                    <span>Store Status</span>
                  </div>
                  <div className="text-xs sm:text-sm font-black text-slate-900 mt-1 capitalize truncate">
                    {selectedApplication.status?.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-white flex-shrink-0 overflow-x-auto text-xs">
                <button
                  type="button"
                  onClick={() => setModalActiveTab('overview')}
                  className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    modalActiveTab === 'overview'
                      ? 'border-[#0c2a5e] text-[#0c2a5e]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Overview &amp; KYC</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalActiveTab('orders')}
                  className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    modalActiveTab === 'orders'
                      ? 'border-[#0c2a5e] text-[#0c2a5e]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Orders &amp; Values ({vendorDetails?.ordersCount ?? 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalActiveTab('products')}
                  className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    modalActiveTab === 'products'
                      ? 'border-[#0c2a5e] text-[#0c2a5e]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Products Catalog ({vendorDetails?.productsCount ?? 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalActiveTab('transactions')}
                  className={`py-3 px-3.5 font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    modalActiveTab === 'transactions'
                      ? 'border-[#0c2a5e] text-[#0c2a5e]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Payouts &amp; Transactions ({vendorDetails?.settlements?.length ?? 0})</span>
                </button>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-700 flex-1">
                {/* ================= TAB 1: OVERVIEW & KYC ================= */}
                {modalActiveTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Status & Plan Info */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Application Status</span>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <strong className="text-sm font-black text-slate-900 capitalize">
                            {selectedApplication.status?.replace(/_/g, ' ')}
                          </strong>
                          {(selectedApplication.enrollmentFeePaid || 0) > 0 ? (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                              ✓ Fee Paid (₹{selectedApplication.enrollmentFeePaid})
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                              Fee Awaiting (₹{selectedApplication.activePlan?.price || 999})
                            </span>
                          )}
                          {selectedApplication.activePlan && (
                            <span className="text-[11px] font-bold text-[#0c2a5e] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                              Plan: {selectedApplication.activePlan.title} ({selectedApplication.activePlan.durationDays}d)
                            </span>
                          )}
                        </div>
                      </div>

                      {selectedApplication.planExpiresAt && (
                        <div className="text-left sm:text-right">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Access Expiry</span>
                          <strong className="text-sm font-bold text-slate-900">
                            {new Date(selectedApplication.planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </strong>
                        </div>
                      )}
                    </div>

                    {/* Grid: Merchant Profile, Store Location, Bank Details & KYC Proofs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Left Column */}
                      <div className="space-y-4">
                        {/* Merchant Owner Profile */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                          <div className="font-bold text-slate-900 flex items-center justify-between pb-1 border-b border-slate-200/60">
                            <div className="flex items-center gap-1.5">
                              <User className="w-4 h-4 text-[#0c2a5e]" />
                              <span>Merchant Owner Profile</span>
                            </div>
                            {vendorDetails?.profilePic && (
                              <img
                                src={vendorDetails.profilePic}
                                alt="Vendor Avatar"
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-2xs"
                              />
                            )}
                          </div>
                          <div className="space-y-1 text-slate-600 text-xs">
                            <p>Name: <strong className="text-slate-900">{vendorDetails?.vendor?.name || selectedApplication.vendorUser?.name || selectedApplication.vendor?.name}</strong></p>
                            <p>Email: <span className="font-mono text-slate-800">{vendorDetails?.vendor?.email || selectedApplication.email || selectedApplication.vendorUser?.email}</span></p>
                            <p>Phone: <span className="font-mono text-slate-800">{vendorDetails?.vendor?.phone || selectedApplication.phone || selectedApplication.vendorUser?.phone}</span></p>
                            <p>Live Wallet: <strong className="text-emerald-700 font-mono">₹{(vendorDetails?.walletBalance ?? selectedApplication.walletBalance ?? 0).toLocaleString('en-IN')}</strong></p>
                            {selectedApplication.referralCodeUsed && (
                              <p className="text-emerald-700 font-bold flex items-center gap-1 pt-1">
                                <Gift className="w-3.5 h-3.5" />
                                <span>Referral Code Used: {selectedApplication.referralCodeUsed}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Store Dispatch Address */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-200/60">
                            <MapPin className="w-4 h-4 text-[#0c2a5e]" />
                            <span>Store Location &amp; Dispatch Hub</span>
                          </div>
                          <div className="text-slate-600 leading-relaxed text-xs">
                            <p>Street: {selectedApplication.address?.street || 'N/A'}</p>
                            {selectedApplication.address?.landmark && <p>Landmark: {selectedApplication.address.landmark}</p>}
                            <p>City &amp; State: {selectedApplication.address?.city || 'Hyderabad'}, {selectedApplication.address?.state || 'Andhra Pradesh'}</p>
                            <p>PIN Code: <span className="font-mono font-bold text-slate-900">{selectedApplication.address?.zipCode || '534201'}</span></p>
                          </div>
                        </div>

                        {/* Bank Settlement Details */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-200/60">
                            <Building className="w-4 h-4 text-[#0c2a5e]" />
                            <span>Payout Bank Details</span>
                          </div>
                          <div className="text-slate-600 space-y-1 text-xs">
                            <p>A/C Holder: <strong className="text-slate-900">{selectedApplication.bankDetails?.accountHolder || 'N/A'}</strong></p>
                            <p>Bank Name: {selectedApplication.bankDetails?.bankName || 'State Bank of India'}</p>
                            <p>Account Number: <span className="font-mono font-bold text-slate-900">{selectedApplication.bankDetails?.accountNumber || 'Pending'}</span></p>
                            <p>IFSC Code: <span className="font-mono uppercase font-bold text-slate-900">{selectedApplication.bankDetails?.ifscCode || 'N/A'}</span></p>
                            {selectedApplication.bankDetails?.upiId && (
                              <p>UPI ID: <span className="font-mono text-[#0c2a5e]">{selectedApplication.bankDetails.upiId}</span></p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Column: Verified KYC Document Proofs */}
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5 pb-1 border-b border-slate-200/60">
                            <FileText className="w-4 h-4 text-[#0c2a5e]" />
                            <span>Verified KYC Document Proofs</span>
                          </div>

                          {/* Aadhaar Card Proof */}
                          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">Aadhaar Card</span>
                              <span className="font-mono font-bold text-slate-900">
                                {selectedApplication.documents?.aadhaarNumber || 'Not provided'}
                              </span>
                            </div>
                            {selectedApplication.documents?.aadhaarDocument ? (
                              <div className="relative group rounded-lg overflow-hidden border border-slate-200 max-h-40 bg-slate-100 flex items-center justify-center">
                                <img
                                  src={selectedApplication.documents.aadhaarDocument}
                                  alt="Aadhaar"
                                  loading="lazy"
                                  className="w-full h-36 object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={() => setSelectedDocModal({ title: 'Aadhaar Document Proof', url: selectedApplication.documents.aadhaarDocument })}
                                  className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold gap-1 text-xs cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" /> Click to Zoom
                                </button>
                              </div>
                            ) : (
                              <p className="text-slate-400 italic text-[11px]">No document scan uploaded</p>
                            )}
                          </div>

                          {/* PAN Card Proof */}
                          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">PAN Card</span>
                              <span className="font-mono font-bold text-slate-900">
                                {selectedApplication.documents?.panNumber || 'Not provided'}
                              </span>
                            </div>
                            {selectedApplication.documents?.panDocument ? (
                              <div className="relative group rounded-lg overflow-hidden border border-slate-200 max-h-40 bg-slate-100 flex items-center justify-center">
                                <img
                                  src={selectedApplication.documents.panDocument}
                                  alt="PAN Card"
                                  loading="lazy"
                                  className="w-full h-36 object-contain"
                                />
                                <button
                                  type="button"
                                  onClick={() => setSelectedDocModal({ title: 'PAN Card Document Proof', url: selectedApplication.documents.panDocument })}
                                  className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold gap-1 text-xs cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" /> Click to Zoom
                                </button>
                              </div>
                            ) : (
                              <p className="text-slate-400 italic text-[11px]">No document scan uploaded</p>
                            )}
                          </div>

                          {/* GST Proof */}
                          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-800">GSTIN</span>
                              <span className="font-mono font-bold text-slate-900">
                                {selectedApplication.documents?.gstNumber || 'Unregistered / Exempt'}
                              </span>
                            </div>
                            {selectedApplication.documents?.gstDocument && (
                              <button
                                type="button"
                                onClick={() => setSelectedDocModal({ title: 'GST Document', url: selectedApplication.documents.gstDocument })}
                                className="text-blue-600 hover:underline inline-flex items-center gap-1 text-xs pt-1 font-semibold"
                              >
                                <Eye className="w-3.5 h-3.5" /> View GST Certificate
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Admin Review & Decision Notes Area (Only shown for unapproved stores) */}
                    {selectedApplication.status !== 'active' && (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">Administrator Evaluation Notes</span>
                          <span className="text-[11px] text-slate-400">Will be recorded in store audit logs</span>
                        </div>
                        <textarea
                          rows={2}
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Enter approval notes, document feedback, or reason for rejection..."
                          className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* ================= TAB 2: ORDERS & VALUES ================= */}
                {modalActiveTab === 'orders' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Store Orders &amp; Revenue Share</h4>
                        <p className="text-xs text-slate-500">All customer orders fulfilled through {selectedApplication.storeName}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block font-bold">Total Vendor Sales Value</span>
                        <strong className="text-emerald-700 font-mono text-base font-black">
                          ₹{(vendorDetails?.totalSalesValue ?? 0).toLocaleString('en-IN')}
                        </strong>
                      </div>
                    </div>

                    {loadingDetails ? (
                      <div className="text-center py-12 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0c2a5e]" />
                        <span>Loading order records...</span>
                      </div>
                    ) : !vendorDetails?.orders || vendorDetails.orders.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-600">No Orders Received Yet</p>
                        <p className="text-[11px] text-slate-400">Orders placed by customers for this store will appear here.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-3">Invoice #</th>
                              <th className="p-3">Customer</th>
                              <th className="p-3">Items</th>
                              <th className="p-3">Order Share (₹)</th>
                              <th className="p-3">Payment</th>
                              <th className="p-3">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {vendorDetails.orders.map((ord) => (
                              <tr key={ord._id} className="hover:bg-slate-50/70 transition">
                                <td className="p-3 font-mono font-bold text-[#0c2a5e]">
                                  {ord.invoiceNumber || ord._id.slice(-8).toUpperCase()}
                                </td>
                                <td className="p-3">
                                  <div className="font-semibold text-slate-800">{ord.customerName}</div>
                                  {ord.customerCity && <div className="text-[10px] text-slate-400">{ord.customerCity}</div>}
                                </td>
                                <td className="p-3">
                                  <span className="font-bold text-slate-700">{ord.itemsCount} item(s)</span>
                                </td>
                                <td className="p-3 font-black text-emerald-700">
                                  ₹{(ord.orderShare || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    ord.paymentStatus === 'completed' || ord.paymentStatus === 'paid'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {ord.paymentStatus || 'paid'}
                                  </span>
                                </td>
                                <td className="p-3 text-slate-500 whitespace-nowrap">
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
                {modalActiveTab === 'products' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">Merchant Products Catalog</h4>
                        <p className="text-xs text-slate-500">Live inventory listed by {selectedApplication.storeName}</p>
                      </div>
                      <span className="font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full">
                        {vendorDetails?.productsCount ?? 0} Catalog Items
                      </span>
                    </div>

                    {loadingDetails ? (
                      <div className="text-center py-12 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0c2a5e]" />
                        <span>Loading product inventory...</span>
                      </div>
                    ) : !vendorDetails?.products || vendorDetails.products.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-600">No Products Listed Yet</p>
                        <p className="text-[11px] text-slate-400">Merchant has not uploaded any product catalog items to this store.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {vendorDetails.products.map((prod) => (
                          <div key={prod._id} className="p-3 bg-white border border-slate-200 rounded-2xl flex gap-3 shadow-2xs hover:shadow-xs transition">
                            <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200 flex items-center justify-center">
                              {prod.images && prod.images[0] ? (
                                <img
                                  src={prod.images[0]}
                                  alt={prod.title}
                                  className="w-full h-full object-cover"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              ) : (
                                <Package className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="font-bold text-slate-900 text-xs truncate" title={prod.title}>{prod.title}</h5>
                              <div className="text-[11px] text-slate-400 capitalize mt-0.5">{prod.category || 'General'}</div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="font-black text-slate-900 text-xs">₹{prod.price?.toLocaleString('en-IN')}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  (prod.stock || 0) <= 5
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {prod.stock || 0} in stock
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ================= TAB 4: PAYOUTS & TRANSACTIONS ================= */}
                {modalActiveTab === 'transactions' && (
                  <div className="space-y-5">
                    {/* Settlement Summary Header */}
                    <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Current Wallet Amount</span>
                        <div className="text-2xl font-black text-emerald-800 mt-0.5 font-mono">
                          ₹{(vendorDetails?.walletBalance ?? selectedApplication.walletBalance ?? 0).toLocaleString('en-IN')}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-600 block">Bank Account:</span>
                        <strong className="text-slate-900 font-mono text-xs">
                          {selectedApplication.bankDetails?.bankName || 'SBI'} ••••{selectedApplication.bankDetails?.accountNumber?.slice(-4) || 'N/A'}
                        </strong>
                      </div>
                    </div>

                    {/* Admin Payouts / Settlements Made */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                          <span>Admin Disbursements &amp; Bank Settlements</span>
                        </h4>
                        <span className="text-xs text-slate-400 font-medium">
                          {vendorDetails?.settlements?.length ?? 0} record(s)
                        </span>
                      </div>

                      {loadingDetails ? (
                        <div className="text-center py-8 text-slate-400">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-[#0c2a5e]" />
                          <span>Loading transaction ledger...</span>
                        </div>
                      ) : !vendorDetails?.settlements || vendorDetails.settlements.length === 0 ? (
                        <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500">
                          <Wallet className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                          <p className="font-bold text-xs">No Direct Settlements Recorded Yet</p>
                          <p className="text-[11px] text-slate-400">When admin processes bank payouts to this vendor, records appear here.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                              <tr>
                                <th className="p-3">Reference / Txn ID</th>
                                <th className="p-3">Amount Settled</th>
                                <th className="p-3">Disbursed To</th>
                                <th className="p-3">Notes</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {vendorDetails.settlements.map((st) => (
                                <tr key={st._id} className="hover:bg-slate-50/70 transition">
                                  <td className="p-3 font-mono font-bold text-slate-900">
                                    {st.transactionReference || st._id.slice(-8).toUpperCase()}
                                  </td>
                                  <td className="p-3 font-black text-emerald-700">
                                    ₹{(st.amount || 0).toLocaleString('en-IN')}
                                  </td>
                                  <td className="p-3 text-slate-600">
                                    {st.bankDetails?.bankName || 'Bank'} ({st.bankDetails?.accountNumber?.slice(-4) ? `••••${st.bankDetails.accountNumber.slice(-4)}` : 'A/C'})
                                  </td>
                                  <td className="p-3 text-slate-500 text-[11px] max-w-[200px] truncate" title={st.adminNotes}>
                                    {st.adminNotes || 'Admin payout settlement'}
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                      {st.status || 'completed'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-slate-500 whitespace-nowrap">
                                    {new Date(st.settledAt || st.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Full Ledger Transactions */}
                    {vendorDetails?.transactions && vendorDetails.transactions.length > 0 && (
                      <div className="space-y-3 pt-3 border-t border-slate-200">
                        <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-[#0c2a5e]" />
                          <span>Wallet Transactions Ledger</span>
                        </h4>
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                              <tr>
                                <th className="p-3">Type</th>
                                <th className="p-3">Description</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Balance After</th>
                                <th className="p-3">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {vendorDetails.transactions.map((tx) => (
                                <tr key={tx._id} className="hover:bg-slate-50/70 transition">
                                  <td className="p-3">
                                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                                      {tx.type?.replace(/_/g, ' ')}
                                    </span>
                                  </td>
                                  <td className="p-3 text-slate-700">{tx.description}</td>
                                  <td className="p-3 font-mono font-bold">
                                    <span className={tx.amount >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                                      {tx.amount >= 0 ? `+₹${tx.amount.toLocaleString('en-IN')}` : `-₹${Math.abs(tx.amount).toLocaleString('en-IN')}`}
                                    </span>
                                  </td>
                                  <td className="p-3 font-mono text-slate-600">
                                    ₹{(tx.balanceAfter || 0).toLocaleString('en-IN')}
                                  </td>
                                  <td className="p-3 text-slate-500 whitespace-nowrap">
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

              {/* Modal Footer (Action Buttons) */}
              <div className="p-5 sm:p-6 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
                <div className="text-xs text-slate-500 text-center sm:text-left">
                  Application ID: <span className="font-mono font-bold">{selectedApplication._id}</span>
                </div>

                {selectedApplication.status === 'active' ? (
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Approved &amp; Active Merchant</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedApplication(null)}
                      className="px-5 py-2.5 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white text-xs font-bold transition cursor-pointer shadow-sm"
                    >
                      Close Details
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                    {/* Reject button */}
                    <button
                      type="button"
                      onClick={() => handleReview(selectedApplication._id, 'reject', adminNotes)}
                      disabled={processingId === selectedApplication._id}
                      className="px-4 py-2.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition cursor-pointer"
                    >
                      Reject Application
                    </button>

                    {/* Standard Approve (Awaiting Fee if unpaid) */}
                    <button
                      type="button"
                      onClick={() => handleReview(selectedApplication._id, 'approve', adminNotes)}
                      disabled={processingId === selectedApplication._id}
                      className="px-4 py-2.5 rounded-xl border border-emerald-400 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Approve KYC (Require Fee)</span>
                    </button>

                    {/* Approve & Direct Activate (Grants immediate 1-yr access) */}
                    <button
                      type="button"
                      onClick={() => handleReview(selectedApplication._id, 'approve_and_activate', adminNotes)}
                      disabled={processingId === selectedApplication._id}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-md active:scale-98"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{processingId === selectedApplication._id ? 'Activating...' : 'Approve & Activate Live Store'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            MODAL 2: EXTEND / RENEW STORE ACCESS EXPIRATION DATE
           ===================================================================== */}
        {extendExpiryModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white max-w-md w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-black text-base text-slate-900">Renew &amp; Extend Store Access</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{extendExpiryModal.storeName}</p>
                </div>
                <button
                  onClick={() => setExtendExpiryModal(null)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <p>Current Status: <strong className="text-slate-900 capitalize">{extendExpiryModal.status}</strong></p>
                <p>
                  Current Expiry:{' '}
                  <strong className="text-slate-900">
                    {extendExpiryModal.planExpiresAt
                      ? new Date(extendExpiryModal.planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                      : 'No expiry date currently set'}
                  </strong>
                </p>
              </div>

              {/* Quick Extension Buttons */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Select Extension Validity:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(extendExpiryModal._id, 'active', 30)}
                    disabled={processingId === extendExpiryModal._id}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-center cursor-pointer font-bold text-xs transition"
                  >
                    <span className="text-amber-600 block text-base font-black">+30</span>
                    <span className="text-[10px] text-slate-500">Days Access</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(extendExpiryModal._id, 'active', 90)}
                    disabled={processingId === extendExpiryModal._id}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-center cursor-pointer font-bold text-xs transition"
                  >
                    <span className="text-[#0c2a5e] block text-base font-black">+90</span>
                    <span className="text-[10px] text-slate-500">Days Access</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(extendExpiryModal._id, 'active', 365)}
                    disabled={processingId === extendExpiryModal._id}
                    className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-center cursor-pointer font-bold text-xs transition"
                  >
                    <span className="text-emerald-700 block text-base font-black">+1 Year</span>
                    <span className="text-[10px] text-emerald-800">Annual Pass</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                {/* Toggle status */}
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(extendExpiryModal._id, extendExpiryModal.status === 'suspended' ? 'active' : 'suspended')}
                  disabled={processingId === extendExpiryModal._id}
                  className={`text-xs font-bold underline cursor-pointer ${
                    extendExpiryModal.status === 'suspended' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {extendExpiryModal.status === 'suspended' ? 'Reactivate Store' : 'Suspend Store Access'}
                </button>

                <button
                  type="button"
                  onClick={() => setExtendExpiryModal(null)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            MODAL 3: HIGH-RES DOCUMENT VIEWER / ZOOM MODAL
           ===================================================================== */}
        {selectedDocModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white max-w-2xl w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">{selectedDocModal.title}</h3>
                <div className="flex items-center gap-2">
                  <a
                    href={selectedDocModal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold mr-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                  </a>
                  <button
                    onClick={() => setSelectedDocModal(null)}
                    className="p-1 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-[70vh] flex items-center justify-center p-2">
                <img
                  src={selectedDocModal.url}
                  alt="Document Proof Preview"
                  className="max-h-[65vh] w-full object-contain"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedDocModal(null)}
                  className="px-5 py-2 bg-[#0c2a5e] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminVendors;
