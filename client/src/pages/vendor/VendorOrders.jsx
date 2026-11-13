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
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Activity,
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

  // Live order incoming alerts
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const previousOrderCount = useRef(null);

  // Polling for live updates & alerts
  useEffect(() => {
    fetchOrders(true);
    const interval = setInterval(() => {
      fetchOrders(false);
    }, 10000); // 10s auto refresh for live notifications
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await api.get('/orders/vendor/orders');
      if (res.data?.success) {
        const fetchedOrders = res.data.orders || [];

        // Check if a new order arrived compared to last poll
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
          info(`🔔 New Customer Order Received! Invoice #${newest.invoiceNumber}`);
        }

        previousOrderCount.current = fetchedOrders.length;
        setOrders(fetchedOrders);
        window.dispatchEvent(new CustomEvent('orders-updated'));
      }
    } catch (err) {
      console.error('Failed to load vendor orders:', err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  // Live Quick Analytics computed across all vendor orders
  const totalVolume = orders.reduce((sum, o) => sum + (o.vendorSubtotal || o.totalAmount || 0), 0);
  const deliveredCount = orders.filter((o) =>
    o.items?.some((i) => i.deliveryStatus === 'Delivered')
  ).length;
  const inTransitCount = orders.filter((o) =>
    o.items?.some((i) => i.deliveryStatus === 'Shipped' || i.deliveryStatus === 'Out for Delivery')
  ).length;
  const pendingCount = orders.filter((o) =>
    o.items?.some((i) => i.deliveryStatus === 'Processing' || !i.deliveryStatus)
  ).length;

  // Filter orders by search query, status tab, and date range
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
      const hasStatus = order.items?.some(
        (i) => (i.deliveryStatus || 'Processing').toLowerCase() === activeTab.toLowerCase()
      );
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, dateFilter, pageSize]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-500/15 text-emerald-800 border-emerald-300 font-black';
      case 'Shipped':
        return 'bg-blue-500/15 text-blue-800 border-blue-300 font-black';
      case 'Out for Delivery':
        return 'bg-indigo-500/15 text-indigo-800 border-indigo-300 font-black';
      case 'Processing':
        return 'bg-amber-500/15 text-amber-800 border-amber-300 font-black';
      case 'Cancelled':
        return 'bg-rose-500/15 text-rose-800 border-rose-300 font-black';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 font-semibold';
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
            className="px-4 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 text-slate-700 hover:bg-white font-bold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh</span>
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Live Incoming Order Alert Toast */}
        {newOrderAlert && (
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 text-white shadow-xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300 border border-emerald-400/40">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 animate-bounce">
                <Bell className="w-5 h-5 text-amber-300" />
              </div>
              <div className="space-y-0.5">
                <div className="font-black text-sm flex items-center gap-2">
                  <span>🔔 Live Order Received!</span>
                  <span className="font-mono bg-white/20 px-2 py-0.5 rounded-lg text-xs">#{newOrderAlert.invoice}</span>
                </div>
                <p className="text-xs text-emerald-100">
                  Buyer <strong>{newOrderAlert.customer}</strong> ordered worth <strong>₹{newOrderAlert.amount?.toLocaleString('en-IN')}</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                to={`/vendor/orders/${newOrderAlert.invoice}`}
                className="px-3.5 py-1.5 rounded-xl bg-white text-slate-900 font-black text-xs shadow-sm hover:bg-slate-100 transition"
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

        {/* 1. Official Live Orders Analytics Strip (Morphism) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-white/90 shadow-2xs glow-card flex items-center justify-between">
            <div>
              <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider">Total Orders</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{orders.length}</div>
              <span className="text-[10px] text-emerald-600 font-bold">₹{totalVolume.toLocaleString('en-IN')} value</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-white/90 shadow-2xs glow-card flex items-center justify-between">
            <div>
              <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider">Pending Fulfillment</span>
              <div className="text-xl sm:text-2xl font-black text-amber-600 mt-0.5">{pendingCount}</div>
              <span className="text-[10px] text-amber-600 font-bold">Needs dispatch</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-white/90 shadow-2xs glow-card flex items-center justify-between">
            <div>
              <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider">In Transit</span>
              <div className="text-xl sm:text-2xl font-black text-blue-600 mt-0.5">{inTransitCount}</div>
              <span className="text-[10px] text-blue-600 font-bold">Courier active</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-4 rounded-3xl border border-white/90 shadow-2xs glow-card flex items-center justify-between">
            <div>
              <span className="text-[10.5px] uppercase font-bold text-slate-400 tracking-wider">Delivered &amp; Settled</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">{deliveredCount}</div>
              <span className="text-[10px] text-emerald-600 font-bold">100% Credited</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200/60 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* 2. Settlement Notice Card (Matching Screenshot) */}
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

        {/* 3. Filter Bar, Status Tabs & Search Controls (Matching Reference Screenshot) */}
        <div className="bg-white/80 backdrop-blur-md border border-white/90 p-3.5 sm:p-4 rounded-3xl shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl overflow-x-auto scrollbar-none">
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
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50/80 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f8a48]/30 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Result summary row with Rows Per Page selector */}
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

        {/* 4. Orders Listing */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-3xl bg-white/60 backdrop-blur-md border border-white/80 h-36 animate-pulse" />
            ))}
          </div>
        ) : paginatedOrders.length > 0 ? (
          <div className="space-y-4">
            {paginatedOrders.map((order) => (
              <div
                key={order._id}
                onClick={() => navigate(`/vendor/orders/${order._id}`)}
                className="bg-white/85 backdrop-blur-xl rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-emerald-300/80 cursor-pointer group"
              >
                {/* Header bar */}
                <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-3 text-slate-600">
                    <div>
                      <span className="text-slate-400 font-medium">Invoice: </span>
                      <strong className="text-slate-900 font-mono font-black group-hover:text-[#0f8a48] transition">
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
                        {order.paymentMethod === 'Wallet' ? 'SR Wallet' : 'Escrow Secured'}
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
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 hover:text-emerald-700 transition shadow-2xs"
                      title="View & Download PDF Invoice"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Invoice</span>
                    </a>

                    <span className="p-1.5 rounded-xl bg-slate-100 group-hover:bg-[#0f8a48] group-hover:text-white transition text-slate-500">
                      <Eye className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Compact Order Body matching reference screenshot */}
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-[#0f8a48] transition">
                          {order.items?.[0]?.title || 'Order Item'}
                          {order.items?.length > 1 && (
                            <span className="text-xs text-slate-400 font-medium ml-1.5">
                              +{order.items.length - 1} more
                            </span>
                          )}
                        </h4>
                        {order.items?.some((i) => i.sourceType === 'admin_catalog' || i.sourceAdminProduct) && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
                            Admin Central
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                        <span>{order.items?.length || 1} item(s)</span>
                        <span>•</span>
                        <span className="text-slate-700 font-bold">
                          Qty: {order.items?.reduce((sum, i) => sum + (i.quantity || 1), 0)}
                        </span>
                        {order.items?.[0]?.vendorProductCode && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-indigo-700 font-bold text-[11px]">
                              {order.items[0].vendorProductCode}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Recipient, Destination, Stage */}
                  <div className="flex items-center gap-6 text-xs text-slate-600 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-6">
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Recipient
                      </span>
                      <strong className="text-slate-900 font-bold block truncate max-w-[130px]">
                        {order.shippingAddress?.fullName || 'Customer'}
                      </strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-600" />
                        <span>Destination</span>
                      </span>
                      <strong className="text-slate-800 font-semibold block truncate max-w-[140px]">
                        {order.shippingAddress?.city ? `${order.shippingAddress.city}, ${order.shippingAddress.state || ''}` : 'India'}
                      </strong>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Stage
                      </span>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${getStatusBadge(order.items?.[0]?.deliveryStatus || 'Processing')}`}>
                        {order.items?.[0]?.deliveryStatus || 'Processing'}
                      </span>
                    </div>
                  </div>

                  {/* Right: Quick Action CTA */}
                  <div className="flex items-center gap-2 justify-end pt-2 md:pt-0">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 group-hover:bg-[#0f8a48] text-white font-black text-xs transition shadow-2xs">
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

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                      <button
                        key={num}
                        onClick={() => setCurrentPage(num)}
                        className={`w-8 h-8 rounded-xl font-bold transition text-xs cursor-pointer ${
                          currentPage === num
                            ? 'bg-[#0f8a48] text-white shadow-xs'
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
      </div>
    </VendorLayout>
  );
};

export default VendorOrders;
