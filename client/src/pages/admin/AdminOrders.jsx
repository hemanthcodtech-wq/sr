import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Calendar,
  Download,
  RotateCcw,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  Eye,
  Filter,
  DollarSign,
  TrendingUp,
  Globe,
  Copy,
  ExternalLink,
  Check,
  X,
  Package,
  MapPin,
  User,
  Phone,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Sparkles,
  Store,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminOrders = () => {
  const { showToast, success, error } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [guideOpen, setGuideOpen] = useState(false);
  const [dispatchingDeoDap, setDispatchingDeoDap] = useState(false);

  // Dropship Fulfillment Modal
  const [fulfillModal, setFulfillModal] = useState(null); // { order, item }
  const [sourceOrderId, setSourceOrderId] = useState('');
  const [sourceTrackingNumber, setSourceTrackingNumber] = useState('');
  const [fulfillmentStatus, setFulfillmentStatus] = useState('ordered_on_source');
  const [submittingFulfillment, setSubmittingFulfillment] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleAutoDispatchDeoDap = async (order, item) => {
    try {
      setDispatchingDeoDap(true);
      const res = await api.post(`/orders/${order._id}/items/${item._id}/auto-dispatch-deodap`);
      if (res.data?.success) {
        success(`⚡ Dispatched to DeoDap! Supplier Order #${res.data.sourceOrderId}`);
        fetchOrders();
        if (fulfillModal) {
          setSourceOrderId(res.data.sourceOrderId || '');
          setSourceTrackingNumber(res.data.sourceTrackingNumber || '');
          setFulfillmentStatus('ordered_on_source');
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to auto-dispatch to DeoDap');
    } finally {
      setDispatchingDeoDap(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/admin/all').catch(() => null);
      if (res?.data?.success && Array.isArray(res.data.orders)) {
        setOrders(res.data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFulfillment = (order, item) => {
    setFulfillModal({ order, item });
    setSourceOrderId(item.sourceOrderId || '');
    setSourceTrackingNumber(item.sourceTrackingNumber || '');
    setFulfillmentStatus(item.fulfillmentStatus || 'ordered_on_source');
    setCopiedAddress(false);
  };

  const handleCopyCustomerAddress = (order) => {
    const addr = order.shippingAddress;
    if (!addr) return;
    const formatted = `Name: ${addr.fullName}\nPhone: ${addr.phone}\nStreet: ${addr.street}\nCity: ${addr.city}\nState: ${addr.state}\nPIN: ${addr.zipCode}\nCountry: ${addr.country || 'India'}`;
    navigator.clipboard.writeText(formatted);
    setCopiedAddress(true);
    success('Customer shipping address copied to clipboard!');
    setTimeout(() => setCopiedAddress(false), 3000);
  };

  const handleSaveDropshipFulfillment = async () => {
    if (!fulfillModal) return;
    const { order, item } = fulfillModal;

    try {
      setSubmittingFulfillment(true);
      const res = await api.put(`/orders/${order._id}/items/${item._id}/dropship-fulfillment`, {
        sourceOrderId,
        sourceTrackingNumber,
        fulfillmentStatus,
      });

      if (res.data?.success) {
        success('Source fulfillment status updated!');
        setFulfillModal(null);
        fetchOrders();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update fulfillment');
    } finally {
      setSubmittingFulfillment(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const orderNum = (order.invoiceNumber || order.orderNumber || order._id || '').toLowerCase();
    const custName = (order.customer?.name || order.shippingAddress?.fullName || '').toLowerCase();
    const matchesSearch = orderNum.includes(searchQuery.toLowerCase()) || custName.includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === 'all' ||
      (order.items && order.items.some((i) => i.deliveryStatus?.toLowerCase() === selectedStatus.toLowerCase()));

    const matchesSource =
      selectedSource === 'all' ||
      (order.items && order.items.some((i) => (i.sourcePlatform || 'in_house') === selectedSource));

    return matchesSearch && matchesStatus && matchesSource;
  });

  // Calculate total gross revenue and dropship margin
  const totalGross = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalMarginEarned = orders.reduce((sum, o) => {
    const itemMargins = (o.items || []).reduce((iSum, i) => iSum + (i.profitMargin || 0), 0);
    return sum + itemMargins;
  }, 0);

  const pendingFulfillCount = orders.reduce((count, o) => {
    const unfulfilledItems = (o.items || []).filter(
      (i) => i.isDropshipped && (i.fulfillmentStatus === 'unfulfilled' || !i.fulfillmentStatus)
    );
    return count + unfulfilledItems.length;
  }, 0);

  const platformBadges = {
    amazon: 'bg-amber-100 text-amber-900 border-amber-300',
    flipkart: 'bg-blue-100 text-blue-900 border-blue-300',
    meesho: 'bg-pink-100 text-pink-900 border-pink-300',
    deodap: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    in_house: 'bg-slate-100 text-slate-800 border-slate-200',
    other: 'bg-purple-100 text-purple-900 border-purple-300',
  };

  return (
    <AdminLayout
      title="Orders & Dropship Fulfillment Hub"
      subtitle="Track customer orders, 1-click fulfill on Amazon/Meesho/DeoDap, and manage source tracking"
      onRefresh={fetchOrders}
    >
      <div className="space-y-6 animate-fadeIn pb-12 font-sans">
        {/* TOP NAVIGATION TOGGLE (Dropship vs Vendor Orders) */}
        <div className="bg-white rounded-2xl p-1.5 border border-slate-200/90 shadow-2xs flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              to="/admin/dropshipping"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-2"
            >
              <Truck className="w-4 h-4 text-slate-500" />
              <span>Dropshipping Orders (Amazon/Meesho/DeoDap)</span>
            </Link>
            <Link
              to="/admin/vendor-orders"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-2"
            >
              <Store className="w-4 h-4 text-slate-500" />
              <span>Vendor Marketplace Orders &amp; Payouts</span>
            </Link>
            <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-blue-50 text-[#0c2a5e] border border-blue-200">
              All Orders Master View
            </span>
          </div>
        </div>

        {/* HERO BANNER */}
        <div className="bg-gradient-to-r from-[#071d42] via-[#0c2a5e] to-[#153e85] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner flex-shrink-0">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">Assisted Order Fulfillment</h2>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Auto-Address Copy Active
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl">
                  When a customer orders an Amazon, Meesho, or DeoDap item, copy their shipping address with 1 click, order on the supplier site, and pocket your commission!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchOrders}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/90 hover:text-white border border-white/15 backdrop-blur-md transition cursor-pointer"
                title="Refresh Orders"
              >
                <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-300' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* DROPSHIP FULFILLMENT WORKFLOW GUIDE ACCORDION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setGuideOpen(!guideOpen)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0c2a5e] flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>How to Fulfill Orders on Amazon, Meesho &amp; DeoDap</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Live Dropshipping Flow
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {guideOpen ? 'Click to minimize fulfillment guide' : 'Click to see how customer orders are placed at wholesale cost and delivered directly to their address'}
                </p>
              </div>
            </div>
            <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
              {guideOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {guideOpen && (
            <div className="p-5 border-t border-slate-100 bg-gradient-to-b from-slate-50/60 to-white grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn text-xs">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#0c2a5e] text-white font-mono font-bold text-xs flex items-center justify-center">1</span>
                  <span className="font-bold text-slate-800">1-Click Copy Address</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Click <strong>"Copy Customer Address"</strong> on the order. Name, phone number, street, city, state, and pincode are copied to your clipboard formatted perfectly.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">2</span>
                  <span className="font-bold text-slate-800">Order on Source</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Click <strong>"Open Product"</strong> to go straight to the supplier item on Amazon, Meesho, or Flipkart. Paste customer address as delivery address &amp; pay the wholesale cost.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono font-bold text-xs flex items-center justify-center">3</span>
                  <span className="font-bold text-slate-800">DeoDap API Automation</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  For DeoDap sourced products, click <strong>"⚡ Auto-Dispatch DeoDap"</strong>. The system programmatically transmits the customer's order to DeoDap without manual ordering!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-mono font-bold text-xs flex items-center justify-center">4</span>
                  <span className="font-bold text-slate-800">Direct Delivery &amp; Profit</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Supplier platform ships the parcel directly to customer. Customer tracks live on your website, and you keep <strong>100% of the commission profit</strong>!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 4 KPI METRICS TILES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL ORDERS</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{orders.length}</div>
              <span className="text-[11px] text-slate-400 block">Customer purchases</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0c2a5e] flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">GROSS REVENUE</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">₹{totalGross.toLocaleString('en-IN')}</div>
              <span className="text-[11px] text-slate-400 block">Paid by customers</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">COMMISSION PROFIT</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
                ₹{totalMarginEarned.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold block">Net arbitrage profit</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AWAITING SOURCE ORDER</span>
              <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">{pendingFulfillCount}</div>
              <span className="text-[11px] text-rose-600 font-semibold block">Needs placement at source</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by invoice number, customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Source Platform Filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              <span className="text-slate-400 font-bold mr-1">Source:</span>
              {['all', 'meesho', 'deodap', 'amazon', 'flipkart'].map((src) => (
                <button
                  key={src}
                  onClick={() => setSelectedSource(src)}
                  className={`px-3 py-1.5 rounded-xl font-bold capitalize transition cursor-pointer ${
                    selectedSource === src
                      ? 'bg-[#0c2a5e] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ORDERS & DROPSHIP FULFILLMENT LIST */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-2xs">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No orders matching your filters</p>
              <p className="text-xs text-slate-400">When customer orders come in, they will appear here with fulfillment actions.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const addr = order.shippingAddress;
              const hasDropshipItem = (order.items || []).some((i) => i.isDropshipped || ['amazon', 'flipkart', 'meesho', 'deodap'].includes(i.sourcePlatform));

              return (
                <div key={order._id} className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                  {/* Order Top Bar */}
                  <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-black text-sm text-[#0c2a5e]">
                        {order.invoiceNumber || order.orderNumber || order._id}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        order.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Payment: {order.paymentStatus || 'paid'} ({order.paymentMethod || 'Online'})
                      </span>
                    </div>

                    {/* Customer 1-Click Address Copy Button */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyCustomerAddress(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition shadow-2xs cursor-pointer"
                        title="Copy Customer Shipping Address for Amazon / Meesho"
                      >
                        <Copy className="w-3.5 h-3.5 text-blue-600" />
                        <span>Copy Customer Address</span>
                      </button>

                      <div className="font-black text-slate-900 text-sm">
                        Total: ₹{(order.totalAmount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="divide-y divide-slate-100">
                    {(order.items || []).map((item) => {
                      const platform = item.sourcePlatform || 'in_house';
                      const isDropship = item.isDropshipped || ['amazon', 'flipkart', 'meesho', 'deodap'].includes(platform);
                      const sPrice = item.sourcePrice || 0;
                      const margin = item.profitMargin || (sPrice > 0 ? Math.max(0, item.price - sPrice) * item.quantity : 0);

                      return (
                        <div key={item._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                          {/* Item Thumbnail & Title */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                              {item.image ? (
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-6 h-6 text-slate-300 m-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-slate-900 text-sm truncate" title={item.title}>{item.title}</h5>
                              <div className="flex items-center gap-2 text-slate-500 mt-1 flex-wrap">
                                <span>Qty: <strong className="text-slate-800">{item.quantity}</strong></span>
                                <span>•</span>
                                <span>Customer Price: <strong className="text-slate-900 font-mono">₹{item.price?.toLocaleString('en-IN')}</strong></span>
                                {isDropship && (
                                  <>
                                    <span>•</span>
                                    <span>Source Cost: <strong className="text-slate-600 font-mono">₹{sPrice.toLocaleString('en-IN')}</strong></span>
                                    <span>•</span>
                                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                      Your Margin: +₹{margin.toLocaleString('en-IN')}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Source Platform & Fulfillment Status */}
                          <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${platformBadges[platform] || platformBadges.other}`}>
                              {platform}
                            </span>

                            {/* Fulfillment Status Pill */}
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              item.fulfillmentStatus === 'delivered_to_customer'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.fulfillmentStatus === 'shipped_by_source'
                                ? 'bg-blue-100 text-blue-800'
                                : item.fulfillmentStatus === 'ordered_on_source'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-rose-100 text-rose-800 animate-pulse'
                            }`}>
                              {item.fulfillmentStatus === 'delivered_to_customer'
                                ? 'Delivered to Customer'
                                : item.fulfillmentStatus === 'shipped_by_source'
                                ? 'Shipped by Source'
                                : item.fulfillmentStatus === 'ordered_on_source'
                                ? 'Ordered on Source'
                                : '● Action Required: Place on Source'}
                            </span>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {platform === 'deodap' && item.fulfillmentStatus === 'unfulfilled' && (
                                <button
                                  type="button"
                                  disabled={dispatchingDeoDap}
                                  onClick={() => handleAutoDispatchDeoDap(order, item)}
                                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                                  title="Auto-Dispatch directly to DeoDap Dropshipping API"
                                >
                                  <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                                  <span>{dispatchingDeoDap ? 'Dispatching...' : '⚡ Auto-Dispatch DeoDap'}</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenFulfillment(order, item)}
                                className="px-3 py-1.5 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                              >
                                <Send className="w-3.5 h-3.5 text-amber-300" />
                                <span>Fulfill via {platform.toUpperCase()}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Customer Address Preview Footer */}
                  {addr && (
                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>Deliver to: <strong className="text-slate-800">{addr.fullName}</strong>, {addr.street}, {addr.city}, {addr.state} - {addr.zipCode} (Phone: {addr.phone})</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px]">ID: {order._id}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* DROPSHIP FULFILLMENT MODAL */}
      {fulfillModal && (() => {
        const item = fulfillModal.item;
        const order = fulfillModal.order;
        const platform = (item.sourcePlatform || 'in_house').toLowerCase();
        const qty = item.quantity || 1;
        const itemPrice = item.price || 0;
        const sPrice = item.sourcePrice || 0;
        const itemTotal = itemPrice * qty;
        const costTotal = sPrice * qty;
        const marginTotal = item.profitMargin !== undefined && item.profitMargin !== null
          ? item.profitMargin
          : Math.max(0, itemPrice - sPrice) * qty;
        const marginPct = itemTotal > 0 ? Math.round((marginTotal / itemTotal) * 100) : 0;
        const addr = order.shippingAddress || {};
        const itemImg = item.image || (item.images && item.images[0]) || '';

        const platformThemes = {
          meesho: {
            name: 'Meesho',
            headerBg: 'from-[#4a0026] via-[#800040] to-[#f43397]',
            badgeBg: 'bg-pink-100 text-pink-900 border-pink-300',
            accentText: 'text-pink-600',
            btnBg: 'bg-[#f43397] hover:bg-[#d6207f] text-white',
            pill: 'bg-pink-400 text-slate-950',
          },
          deodap: {
            name: 'DeoDap',
            headerBg: 'from-[#064e3b] via-[#047857] to-[#059669]',
            badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
            accentText: 'text-emerald-700',
            btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
            pill: 'bg-emerald-300 text-slate-950',
          },
          amazon: {
            name: 'Amazon',
            headerBg: 'from-[#131921] via-[#232f3e] to-[#37475a]',
            badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
            accentText: 'text-amber-600',
            btnBg: 'bg-[#ff9900] hover:bg-[#e68a00] text-slate-950',
            pill: 'bg-amber-400 text-slate-950',
          },
          flipkart: {
            name: 'Flipkart',
            headerBg: 'from-[#0c2340] via-[#1c3f94] to-[#2874f0]',
            badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
            accentText: 'text-blue-600',
            btnBg: 'bg-[#2874f0] hover:bg-[#1a5bc9] text-white',
            pill: 'bg-blue-300 text-slate-950',
          },
          in_house: {
            name: 'In-House',
            headerBg: 'from-[#071d42] via-[#0c2a5e] to-[#153e85]',
            badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
            accentText: 'text-[#0c2a5e]',
            btnBg: 'bg-[#0c2a5e] hover:bg-[#153e85] text-white',
            pill: 'bg-amber-400 text-slate-950',
          },
        };
        const theme = platformThemes[platform] || platformThemes.in_house;

        return (
          <div
            onClick={() => setFulfillModal(null)}
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 transition-all duration-200"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white w-full max-w-4xl max-h-[92vh] rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden my-auto animate-fadeIn text-slate-900"
            >
              {/* 1. Fixed Header */}
              <div className={`px-6 py-4.5 bg-gradient-to-r ${theme.headerBg} text-white flex items-center justify-between flex-shrink-0 border-b border-white/10`}>
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-amber-300 font-bold shadow-inner flex-shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-base sm:text-lg tracking-tight">Order Fulfillment Desk</h3>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${theme.pill}`}>
                        {theme.name} Dropship
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/80 font-mono mt-0.5">
                      <span>Invoice #{order.invoiceNumber || order._id}</span>
                      <span>•</span>
                      <span className="font-sans text-white/90">Customer: <strong className="text-white font-semibold">{addr.fullName || 'Direct Buyer'}</strong></span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFulfillModal(null)}
                  className="p-2 rounded-2xl text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 2. Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs font-sans">
                {/* A. Financial Arbitrage Metric Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Customer Paid</span>
                      <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                        ₹{itemTotal.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium block">
                        ₹{itemPrice.toLocaleString('en-IN')} × {qty} unit{qty > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0c2a5e] flex items-center justify-center font-bold">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Wholesale Sourcing Cost</span>
                      <div className="text-xl sm:text-2xl font-black text-slate-700 font-mono">
                        ₹{costTotal.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium block">
                        Paid to {theme.name}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-emerald-200 uppercase tracking-wider block">Net Profit Margin</span>
                        <span className="text-[9px] font-black uppercase bg-emerald-500/50 text-emerald-100 px-1.5 py-0.5 rounded">
                          {marginPct}% Profit
                        </span>
                      </div>
                      <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                        +₹{marginTotal.toLocaleString('en-IN')}
                      </div>
                      <span className="text-[11px] text-emerald-100 font-semibold block">
                        100% Commission Retained
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold">
                      <TrendingUp className="w-5 h-5 text-amber-300" />
                    </div>
                  </div>
                </div>

                {/* B. Two-Column Workstation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Left Column: Sourced Item & Shipping Destination */}
                  <div className="space-y-4">
                    {/* Item Card */}
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                          Item to Purchase on {theme.name}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${theme.badgeBg}`}>
                          {theme.name} Catalog
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-2xs">
                          {itemImg ? (
                            <img src={itemImg} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-8 h-8 text-slate-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug" title={item.title}>
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                            <span>Qty: <strong className="text-slate-900">{qty}</strong></span>
                            <span>•</span>
                            <span>Unit Cost: <strong className="text-slate-900 font-mono">₹{sPrice}</strong></span>
                          </div>
                        </div>
                      </div>

                      {item.sourceUrl ? (
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-2xs ${theme.btnBg}`}
                        >
                          <span>Open Product on {theme.name}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-100 text-slate-400 text-center text-xs italic">
                          No external supplier link provided for this item
                        </div>
                      )}
                    </div>

                    {/* Customer Shipping Label Card */}
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          <span>Customer Shipping Address</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyCustomerAddress(order)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer shadow-2xs ${
                            copiedAddress
                              ? 'bg-emerald-600 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          {copiedAddress ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedAddress ? 'Address Copied!' : '1-Click Copy Full Address'}</span>
                        </button>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-blue-100 font-mono text-xs space-y-1 text-slate-800">
                        <div className="flex items-center justify-between font-bold border-b border-slate-100 pb-1.5 mb-1.5 font-sans">
                          <span className="text-slate-900 text-sm">{addr.fullName || 'Customer'}</span>
                          <span className="text-blue-600 font-mono">{addr.phone || 'No Phone'}</span>
                        </div>
                        <div className="font-sans text-xs text-slate-600 leading-relaxed">
                          {addr.street && <div>{addr.street}</div>}
                          <div>
                            {addr.city && `${addr.city}, `}
                            {addr.state && `${addr.state} `}
                            {addr.zipCode && <strong className="font-mono text-slate-900 font-bold">- {addr.zipCode}</strong>}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">Country: {addr.country || 'India'}</div>
                        </div>
                      </div>
                      <p className="text-[11px] text-blue-800/80 leading-normal">
                        💡 Click <strong>"1-Click Copy Full Address"</strong> and paste as delivery address on {theme.name}.
                      </p>
                    </div>

                    {/* DeoDap Direct API Sync (if applicable) */}
                    {platform === 'deodap' && (
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white space-y-3 shadow-md">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-amber-300 font-bold flex-shrink-0">
                            <Zap className="w-5 h-5 fill-amber-300" />
                          </div>
                          <div>
                            <div className="font-bold text-xs flex items-center gap-2">
                              <span>DeoDap Direct API Dispatch</span>
                              <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded uppercase">
                                Automated
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-100 mt-0.5">
                              Auto-transmit customer address and SKU directly to DeoDap. No manual ordering needed!
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={dispatchingDeoDap}
                          onClick={() => handleAutoDispatchDeoDap(order, item)}
                          className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{dispatchingDeoDap ? 'Dispatching...' : '⚡ 1-Click Auto-Dispatch to DeoDap API'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Record Supplier Tracking & Delivery Status */}
                  <div className="space-y-4">
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div>
                          <h4 className="font-black text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                            Record Fulfillment &amp; Tracking
                          </h4>
                          <p className="text-[11px] text-slate-500">Live courier tracking and supplier reference</p>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                          <Truck className="w-4 h-4" />
                        </div>
                      </div>

                      {/* Fulfillment Status Selector */}
                      <div className="space-y-2">
                        <label className="font-bold text-slate-800 text-xs block">
                          Current Fulfillment Stage *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { id: 'unfulfilled', label: 'Action Required', sub: 'Not placed yet', color: 'border-rose-300 bg-rose-50/50 text-rose-800' },
                            { id: 'ordered_on_source', label: 'Placed on Supplier', sub: 'Address submitted', color: 'border-indigo-300 bg-indigo-50/50 text-indigo-800' },
                            { id: 'shipped_by_source', label: 'Dispatched / In Transit', sub: 'Courier AWB active', color: 'border-blue-300 bg-blue-50/50 text-blue-800' },
                            { id: 'delivered_to_customer', label: 'Delivered', sub: 'Customer received', color: 'border-emerald-300 bg-emerald-50/50 text-emerald-800' },
                          ].map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => setFulfillmentStatus(st.id)}
                              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                fulfillmentStatus === st.id
                                  ? 'bg-[#0c2a5e] text-white border-[#0c2a5e] shadow-xs'
                                  : `bg-white hover:bg-slate-100/80 ${st.color}`
                              }`}
                            >
                              <div className="font-bold text-xs">{st.label}</div>
                              <div className={`text-[10px] mt-0.5 ${fulfillmentStatus === st.id ? 'text-blue-200' : 'text-slate-500'}`}>
                                {st.sub}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Supplier Order ID */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-800 text-xs flex items-center justify-between">
                          <span>Supplier Order ID ({theme.name})</span>
                          <span className="text-[10px] text-slate-400 font-normal">Reference number</span>
                        </label>
                        <input
                          type="text"
                          placeholder={platform === 'meesho' ? 'e.g. MEE-984210' : platform === 'amazon' ? 'e.g. 405-1234567-8901234' : 'e.g. ORD-892182'}
                          value={sourceOrderId}
                          onChange={(e) => setSourceOrderId(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-300 focus:border-[#0c2a5e] focus:ring-1 focus:ring-[#0c2a5e] rounded-xl outline-none font-mono text-xs text-slate-900 transition"
                        />
                      </div>

                      {/* Courier AWB / Tracking */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-800 text-xs flex items-center justify-between">
                          <span>Courier AWB / Tracking Number</span>
                          <span className="text-[10px] text-slate-400 font-normal">Delhivery / Ekart / BlueDart</span>
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. DELHIVERY19827391 or EKART88921"
                          value={sourceTrackingNumber}
                          onChange={(e) => setSourceTrackingNumber(e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-300 focus:border-[#0c2a5e] focus:ring-1 focus:ring-[#0c2a5e] rounded-xl outline-none font-mono text-xs text-slate-900 transition"
                        />
                      </div>

                      {/* Customer Tracking Notice */}
                      <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900 block font-bold">Instant Customer Tracking Sync</strong>
                          Saving these details updates the customer's live tracking page on their account in real time.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Fixed Footer */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-shrink-0 text-xs">
                <div className="text-slate-500 font-mono text-[11px] flex items-center gap-2">
                  <span>Ordered: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600 font-sans">Payment: <strong className="capitalize">{order.paymentStatus || 'Paid'}</strong></span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFulfillModal(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDropshipFulfillment}
                    disabled={submittingFulfillment}
                    className="px-6 py-2.5 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-black transition shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                    <span>{submittingFulfillment ? 'Saving...' : 'Save Fulfillment Details'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </AdminLayout>
  );
};

export default AdminOrders;
