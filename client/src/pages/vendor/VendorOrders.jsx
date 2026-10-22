import React, { useState, useEffect, useRef } from 'react';
import {
  Truck,
  Package,
  Calendar,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Clock,
  ArrowLeft,
  AlertCircle,
  Search,
  Filter,
  Copy,
  Check,
  Send,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  FileText,
  Bell,
  Eye,
  X,
  Volume2,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import VendorLayout from '../../components/vendor/VendorLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const statusOptions = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const popularCouriers = [
  'Delhivery Express',
  'BlueDart Logistics',
  'DTDC Express',
  'India Post Speed Post',
  'Shadowfax',
  'Ecom Express',
  'Self / Local Delivery',
];

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20];

const VendorOrders = () => {
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [dateFilter, setDateFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Notification for incoming / new orders
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const previousOrderCount = useRef(null);

  // Modal for tracking / courier assignment
  const [dispatchModal, setDispatchModal] = useState({
    open: false,
    orderId: null,
    itemId: null,
    itemTitle: '',
    targetStatus: 'Shipped',
    courierName: 'Delhivery Express',
    trackingNumber: '',
  });
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders(true);
    // Poll for new orders every 12 seconds to trigger live notification
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await api.get('/orders/vendor/orders');
      if (res.data?.success) {
        const fetchedOrders = res.data.orders || [];

        // Check if new order arrived compared to last poll
        if (
          previousOrderCount.current !== null &&
          fetchedOrders.length > previousOrderCount.current
        ) {
          const newest = fetchedOrders[0];
          setNewOrderAlert({
            invoice: newest.invoiceNumber,
            customer: newest.shippingAddress?.fullName || 'Customer',
            amount: newest.vendorSubtotal || newest.totalAmount,
            time: new Date(),
          });
          info(`🔔 New Order Received! Invoice #${newest.invoiceNumber}`);
        }

        previousOrderCount.current = fetchedOrders.length;
        setOrders(fetchedOrders);
      }
    } catch (err) {
      console.error('Failed to load vendor orders:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const openDispatchModal = (e, orderId, item, targetStatus) => {
    e.stopPropagation();
    setDispatchModal({
      open: true,
      orderId,
      itemId: item._id,
      itemTitle: item.title,
      targetStatus,
      courierName: item.courierName || 'Delhivery Express',
      trackingNumber: item.trackingNumber || `AWB${Math.floor(100000000 + Math.random() * 900000000)}`,
    });
  };

  const handleStatusUpdate = async (e, orderId, itemId, newStatus, courierName = null, trackingNumber = null) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setUpdatingId(itemId);
    try {
      const payload = { status: newStatus };
      if (courierName) payload.courierName = courierName;
      if (trackingNumber) payload.trackingNumber = trackingNumber;

      const res = await api.put(`/orders/${orderId}/items/${itemId}/delivery-status`, payload);

      if (res.data?.success) {
        if (newStatus === 'Delivered') {
          success(`Marked as Delivered! Net order earnings credited directly to your Vendor Wallet.`);
        } else {
          info(`Order item status updated to "${newStatus}"!`);
        }
        setDispatchModal({ ...dispatchModal, open: false });
        fetchOrders(false);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Could not update delivery status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopyAddress = (e, orderId, address) => {
    e.stopPropagation();
    if (!address) return;
    const text = `${address.fullName}\n${address.phone}\n${address.street}, ${address.city}, ${address.state} - ${address.zipCode}`;
    navigator.clipboard.writeText(text);
    setCopiedId(orderId);
    info('Customer shipping address copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Filter orders by search, status, and date range
  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (order.invoiceNumber && order.invoiceNumber.toLowerCase().includes(q)) ||
      (order.shippingAddress?.fullName && order.shippingAddress.fullName.toLowerCase().includes(q)) ||
      (order.shippingAddress?.phone && order.shippingAddress.phone.toLowerCase().includes(q)) ||
      (order.shippingAddress?.city && order.shippingAddress.city.toLowerCase().includes(q)) ||
      (order.items && order.items.some((i) => i.title?.toLowerCase().includes(q)));

    if (!matchesSearch) return false;

    // Status filter
    if (activeTab !== 'All') {
      const hasStatus = order.items?.some((i) => i.deliveryStatus?.toLowerCase() === activeTab.toLowerCase());
      if (!hasStatus) return false;
    }

    // Date filter
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.createdAt).getTime();
      const now = Date.now();
      if (dateFilter === 'today') {
        const oneDay = 24 * 60 * 60 * 1000;
        if (now - orderDate > oneDay) return false;
      } else if (dateFilter === 'week') {
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (now - orderDate > oneWeek) return false;
      } else if (dateFilter === 'month') {
        const oneMonth = 30 * 24 * 60 * 60 * 1000;
        if (now - orderDate > oneMonth) return false;
      }
    }

    return true;
  });

  // Pagination calculation
  const totalOrders = filteredOrders.length;
  const totalPages = Math.ceil(totalOrders / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + pageSize);

  // Reset page when search or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, dateFilter, pageSize]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-300';
      case 'Shipped':
        return 'bg-blue-500/10 text-blue-700 border-blue-300';
      case 'Out for Delivery':
        return 'bg-indigo-500/10 text-indigo-700 border-indigo-300';
      case 'Processing':
        return 'bg-amber-500/10 text-amber-700 border-amber-300';
      case 'Cancelled':
        return 'bg-rose-500/10 text-rose-700 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <VendorLayout
      title="Orders & Shipments"
      subtitle="View incoming customer orders, access delivery shipping addresses, assign courier tracking, and mark deliveries to claim earnings."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchOrders(true)}
            className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 font-bold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Live Incoming Order Alert Toast / Notification Card */}
        {newOrderAlert && (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 text-white shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300 border border-emerald-400/40">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 animate-bounce">
                <Bell className="w-5 h-5 text-amber-300" />
              </div>
              <div className="space-y-0.5">
                <div className="font-black text-sm flex items-center gap-2">
                  <span>🔔 New Order Received!</span>
                  <span className="font-mono bg-white/20 px-2 py-0.5 rounded-lg text-xs">#{newOrderAlert.invoice}</span>
                </div>
                <p className="text-xs text-emerald-100">
                  Buyer <strong>{newOrderAlert.customer}</strong> placed an order worth <strong>₹{newOrderAlert.amount?.toLocaleString('en-IN')}</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={`/vendor/orders/${newOrderAlert.invoice}`}
                className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs shadow-sm hover:bg-slate-100 transition"
              >
                View Order
              </Link>
              <button
                onClick={() => setNewOrderAlert(null)}
                className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Settlement Info Notice - Frosted Morphism */}
        <div className="p-5 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span>Vendor Direct Doorstep Fulfillment</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Instant Wallet Settlement
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                Click any order card to open full details, print tax invoices, and manage dispatch. When marking <strong>"Delivered"</strong>, your net profit is credited straight into your Vendor Wallet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/vendor/wallet"
              className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition"
            >
              View Wallet Balance
            </Link>
          </div>
        </div>

        {/* Filter Bar, Status Tabs & Search Controls */}
        <div className="bg-white/80 backdrop-blur-md border border-white/90 p-4 rounded-3xl shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl overflow-x-auto">
              {['All', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    activeTab === tab
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Right: Date Filter & Search Input */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Date Filter */}
              <div className="flex items-center gap-1.5 bg-slate-100/80 px-3 py-1.5 rounded-2xl border border-slate-200/50 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Past 24 Hours</option>
                  <option value="week">Past 7 Days</option>
                  <option value="month">Past 30 Days</option>
                </select>
              </div>

              {/* Search Input */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search invoice, customer, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]/30 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Result summary row */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1 border-t border-slate-100">
            <span>
              Showing <strong>{paginatedOrders.length}</strong> of <strong>{totalOrders}</strong> matching orders
            </span>
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-slate-100 px-2 py-0.5 rounded-lg font-bold text-slate-700 cursor-pointer"
              >
                {ITEMS_PER_PAGE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Orders Listing */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-3xl bg-white/60 backdrop-blur-md border border-white/80 h-48 animate-pulse" />
            ))}
          </div>
        ) : paginatedOrders.length > 0 ? (
          <div className="space-y-5">
            {paginatedOrders.map((order) => (
              <div
                key={order._id}
                onClick={() => navigate(`/vendor/orders/${order._id}`)}
                className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden transition duration-200 hover:shadow-lg hover:border-blue-200/80 cursor-pointer group"
              >
                {/* Header bar */}
                <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3.5 text-slate-600">
                    <div>
                      <span className="text-slate-400 font-medium">Invoice: </span>
                      <strong className="text-[#0c2a5e] font-mono font-bold group-hover:underline">
                        #{order.invoiceNumber}
                      </strong>
                    </div>
                    <div className="h-3 w-px bg-slate-200 hidden sm:block" />
                    <div>
                      <span className="text-slate-400 font-medium">Order Date: </span>
                      <strong className="text-slate-800">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </strong>
                    </div>
                    <div className="h-3 w-px bg-slate-200 hidden sm:block" />
                    <div>
                      <span className="text-slate-400 font-medium">Payment: </span>
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {order.paymentMethod === 'Wallet' ? 'Amezon Wallet' : 'Escrow Secured'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 font-semibold block sm:inline mr-1">Your Store Share:</span>
                      <strong className="text-base font-black text-slate-900">
                        ₹{(order.vendorSubtotal || order.totalAmount)?.toLocaleString('en-IN')}
                      </strong>
                    </div>

                    {/* View Invoice button */}
                    <a
                      href={`http://localhost:5000/api/orders/${order._id}/invoice-preview`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[#0c2a5e] font-bold text-xs hover:bg-blue-50 transition shadow-2xs"
                      title="View & Download PDF Invoice"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Invoice</span>
                    </a>

                    <span className="p-1 rounded-xl bg-slate-100 group-hover:bg-[#0c2a5e] group-hover:text-white transition text-slate-500">
                      <Eye className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Compact Order Body: Product Thumbnails, Status, Destination City & Action */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Product preview */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="flex -space-x-2 overflow-hidden shrink-0">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <img
                          key={idx}
                          src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80'}
                          alt={item.title}
                          className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-2xs"
                        />
                      ))}
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {order.items?.[0]?.title || 'Order Product'}
                        {order.items?.length > 1 && (
                          <span className="text-xs text-slate-400 font-medium ml-1.5">
                            +{order.items.length - 1} more
                          </span>
                        )}
                      </h4>
                      <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                        <span>{order.items?.length || 1} item(s)</span>
                        <span>•</span>
                        <span className="text-slate-700 font-bold">
                          Qty: {order.items?.reduce((sum, i) => sum + (i.quantity || 1), 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Customer Recipient & Destination city */}
                  <div className="flex items-center gap-6 text-xs text-slate-600 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
                    <div className="space-y-0.5">
                      <span className="text-[10.5px] uppercase font-bold text-slate-400 block tracking-wider">
                        Recipient
                      </span>
                      <strong className="text-slate-900 font-bold block truncate max-w-[140px]">
                        {order.shippingAddress?.fullName || 'Customer'}
                      </strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10.5px] uppercase font-bold text-slate-400 block tracking-wider flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-600" />
                        <span>Destination</span>
                      </span>
                      <strong className="text-slate-800 font-semibold block truncate max-w-[150px]">
                        {order.shippingAddress?.city ? `${order.shippingAddress.city}, ${order.shippingAddress.state || ''}` : 'India'}
                      </strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10.5px] uppercase font-bold text-slate-400 block tracking-wider">
                        Stage
                      </span>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${getStatusBadge(order.items?.[0]?.deliveryStatus || 'Processing')}`}>
                        {order.items?.[0]?.deliveryStatus || 'Processing'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Quick CTA */}
                  <div className="flex items-center gap-2 justify-end pt-2 md:pt-0">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 group-hover:bg-[#0c2a5e] text-white font-bold text-xs transition shadow-2xs">
                      <span>View Details</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-white/80 backdrop-blur-md border border-white/90 shadow-xs text-xs">
                <span className="text-slate-500 font-medium">
                  Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({totalOrders} total orders)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        onClick={() => setCurrentPage(num)}
                        className={`w-8 h-8 rounded-xl font-bold transition text-xs cursor-pointer ${
                          currentPage === num
                            ? 'bg-[#0c2a5e] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 transition"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-16 text-center rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-900">No orders match the selected filters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Try adjusting your search keywords, status filter, or date range to locate specific orders.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveTab('All');
                setDateFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Dispatch & Tracking Modal */}
        {dispatchModal.open && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-2xl max-w-md w-full p-6 sm:p-7 rounded-3xl border border-white/80 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">Dispatch Package</h3>
                  <p className="text-xs text-slate-500 font-medium truncate max-w-xs">{dispatchModal.itemTitle}</p>
                </div>
                <button
                  onClick={() => setDispatchModal({ ...dispatchModal, open: false })}
                  className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Courier Partner *</label>
                  <select
                    value={dispatchModal.courierName}
                    onChange={(e) => setDispatchModal({ ...dispatchModal, courierName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  >
                    {popularCouriers.map((courier) => (
                      <option key={courier} value={courier}>
                        {courier}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tracking / AWB Number *</label>
                  <input
                    type="text"
                    required
                    value={dispatchModal.trackingNumber}
                    onChange={(e) => setDispatchModal({ ...dispatchModal, trackingNumber: e.target.value })}
                    placeholder="e.g. AWB123456789"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  <p className="text-[11px] text-slate-400">This tracking number is sent to the customer for live tracking.</p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDispatchModal({ ...dispatchModal, open: false })}
                    className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={(e) =>
                      handleStatusUpdate(
                        e,
                        dispatchModal.orderId,
                        dispatchModal.itemId,
                        'Shipped',
                        dispatchModal.courierName,
                        dispatchModal.trackingNumber
                      )
                    }
                    className="flex-1 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md transition"
                  >
                    Confirm Dispatch
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
};

export default VendorOrders;
