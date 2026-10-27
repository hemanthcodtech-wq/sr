import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Calendar,
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
  ArrowRight,
  Store,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminDropshipOrders = () => {
  const { success, error, info } = useToast();
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

  // Filter ONLY dropship orders (items with isDropshipped or sourced from amazon, flipkart, meesho, deodap)
  const dropshipOrdersList = orders.map((order) => {
    const dropshipItems = (order.items || []).filter(
      (item) => item.isDropshipped || ['amazon', 'flipkart', 'meesho', 'deodap', 'other'].includes(item.sourcePlatform)
    );
    const dropshipTotal = dropshipItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const dropshipCost = dropshipItems.reduce((sum, i) => sum + (i.sourcePrice || 0) * i.quantity, 0);
    const dropshipMargin = dropshipItems.reduce((sum, i) => sum + (i.profitMargin || 0), 0);

    return {
      ...order,
      dropshipItems,
      dropshipTotal,
      dropshipCost,
      dropshipMargin,
    };
  }).filter((order) => order.dropshipItems.length > 0);

  const filteredOrders = dropshipOrdersList.filter((order) => {
    const orderNum = (order.invoiceNumber || order._id || '').toLowerCase();
    const custName = (order.customer?.name || order.shippingAddress?.fullName || '').toLowerCase();
    const matchesSearch = orderNum.includes(searchQuery.toLowerCase()) || custName.includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === 'all' ||
      (order.dropshipItems && order.dropshipItems.some((i) => i.deliveryStatus?.toLowerCase() === selectedStatus.toLowerCase()));

    const matchesSource =
      selectedSource === 'all' ||
      (order.dropshipItems && order.dropshipItems.some((i) => (i.sourcePlatform || 'deodap') === selectedSource));

    return matchesSearch && matchesStatus && matchesSource;
  });

  // Calculate Aggregates
  const totalGross = dropshipOrdersList.reduce((sum, o) => sum + o.dropshipTotal, 0);
  const totalMarginEarned = dropshipOrdersList.reduce((sum, o) => sum + o.dropshipMargin, 0);
  const totalSourceCost = dropshipOrdersList.reduce((sum, o) => sum + o.dropshipCost, 0);

  const pendingFulfillCount = dropshipOrdersList.reduce((count, o) => {
    const unfulfilledItems = (o.dropshipItems || []).filter(
      (i) => i.fulfillmentStatus === 'unfulfilled' || !i.fulfillmentStatus
    );
    return count + unfulfilledItems.length;
  }, 0);

  const platformBadges = {
    amazon: 'bg-amber-100 text-amber-900 border-amber-300',
    flipkart: 'bg-blue-100 text-blue-900 border-blue-300',
    meesho: 'bg-pink-100 text-pink-900 border-pink-300',
    deodap: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    other: 'bg-purple-100 text-purple-900 border-purple-300',
  };

  return (
    <AdminLayout
      title="Dropshipping Sourcing & Fulfillment Hub"
      subtitle="Fulfill customer orders via Amazon, Meesho & DeoDap with automated 1-click address copy and source tracking"
      onRefresh={fetchOrders}
    >
      <div className="space-y-6 animate-fadeIn pb-12 font-sans">
        {/* TOP NAVIGATION TOGGLE (Dropship vs Vendor Orders) */}
        <div className="bg-white rounded-2xl p-1.5 border border-slate-200/90 shadow-2xs flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              to="/admin/dropshipping"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-[#0c2a5e] text-white shadow-sm flex items-center gap-2"
            >
              <Truck className="w-4 h-4 text-amber-300" />
              <span>Dropshipping Orders (Amazon/Meesho/DeoDap)</span>
              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full ml-1">
                {dropshipOrdersList.length}
              </span>
            </Link>
            <Link
              to="/admin/vendor-orders"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition flex items-center gap-2"
            >
              <Store className="w-4 h-4 text-slate-500" />
              <span>Vendor Marketplace Orders &amp; Payouts</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 px-2">
            <span className="text-[11px] font-bold text-slate-500">DeoDap Auto-Dispatch:</span>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <Zap className="w-3 h-3 text-emerald-600" />
              API Ready
            </span>
          </div>
        </div>

        {/* HERO BANNER */}
        <div className="bg-gradient-to-r from-[#071d42] via-[#0c2a5e] to-[#153e85] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner flex-shrink-0">
                <Truck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">Assisted Supplier Dropship Fulfillment</h2>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Auto-Address Copy Active
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl">
                  When a customer orders an item sourced from Meesho or DeoDap, 1-click copy their address, order on the wholesale platform, and pocket your gross margin!
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
                  Click <strong>"Open Product"</strong> to go straight to the supplier item on Amazon, Meesho, or DeoDap. Paste customer address as delivery address &amp; pay the wholesale cost.
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
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">DROPSHIP ORDERS</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{dropshipOrdersList.length}</div>
              <span className="text-[11px] text-slate-400 block">External supplier items</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0c2a5e] flex items-center justify-center font-bold">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">GROSS CUSTOMER REVENUE</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">₹{totalGross.toLocaleString('en-IN')}</div>
              <span className="text-[11px] text-emerald-600 font-bold block">Paid by customers</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">NET DROPSHIP MARGIN</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">₹{totalMarginEarned.toLocaleString('en-IN')}</div>
              <span className="text-[11px] text-emerald-600 font-bold block">Profit retained</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PENDING DISPATCH</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">{pendingFulfillCount}</div>
              <span className="text-[11px] text-amber-600 font-bold block">Requires supplier order</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* SEARCH & FILTERS BAR */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search invoice number, customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]/20 focus:border-[#0c2a5e]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Source Platform Filter */}
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]/20"
            >
              <option value="all">All Sources</option>
              <option value="deodap">DeoDap Wholesale</option>
              <option value="meesho">Meesho</option>
              <option value="amazon">Amazon</option>
              <option value="flipkart">Flipkart</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]/20"
            >
              <option value="all">All Statuses</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>

        {/* DROPSHIP ORDERS LIST */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
            <RotateCcw className="w-8 h-8 text-[#0c2a5e] animate-spin mx-auto" />
            <div className="text-sm font-bold text-slate-700">Loading Dropship Orders...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Truck className="w-8 h-8" />
            </div>
            <div className="text-base font-black text-slate-900">No Dropship Orders Found</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Orders containing products from Meesho, DeoDap, Amazon, or Flipkart will appear here for supplier fulfillment.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden transition hover:shadow-md"
              >
                {/* Header: Invoice + Payment + Copy Address */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-xs sm:text-sm font-black text-[#0c2a5e] bg-blue-50 px-3 py-1 rounded-xl border border-blue-100">
                      {order.invoiceNumber || order._id}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Payment: {order.paymentStatus} ({order.paymentMethod || 'Razorpay'})
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCopyCustomerAddress(order)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0c2a5e] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-blue-200"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Customer Address</span>
                    </button>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Order Total</span>
                      <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                        ₹{order.dropshipTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items in this Order */}
                <div className="divide-y divide-slate-100">
                  {order.dropshipItems.map((item, idx) => {
                    const unitMargin = (item.sourcePrice || 0) > 0 ? Math.max(0, item.price - item.sourcePrice) : 0;
                    const totalItemMargin = unitMargin * (item.quantity || 1);
                    const source = item.sourcePlatform || 'deodap';

                    return (
                      <div key={item._id || idx} className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        {/* Left: Product Info */}
                        <div className="flex items-start gap-4">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                            alt={item.title}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 shadow-2xs flex-shrink-0"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                  platformBadges[source] || 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {source.toUpperCase()}
                              </span>
                              {item.isAffiliateSale && (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-purple-600" />
                                  <span>50/50 Vendor Affiliate Split</span>
                                </span>
                              )}
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  item.fulfillmentStatus === 'ordered_on_source'
                                    ? 'bg-blue-100 text-blue-800'
                                    : item.fulfillmentStatus === 'shipped_by_source'
                                    ? 'bg-amber-100 text-amber-800'
                                    : item.fulfillmentStatus === 'delivered_to_customer'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800 animate-pulse'
                                }`}
                              >
                                ● {item.fulfillmentStatus === 'ordered_on_source'
                                  ? 'Ordered on Source'
                                  : item.fulfillmentStatus === 'shipped_by_source'
                                  ? 'Shipped by Supplier'
                                  : item.fulfillmentStatus === 'delivered_to_customer'
                                  ? 'Delivered to Customer'
                                  : 'Action Required: Place on Source'}
                              </span>
                            </div>

                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 max-w-xl">
                              {item.title}
                            </h4>

                            <div className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                              <span>Qty: <strong>{item.quantity}</strong></span>
                              <span>Customer Price: <strong>₹{item.price.toLocaleString('en-IN')}</strong></span>
                              <span>Source Cost: <strong>₹{item.sourcePrice || 0}</strong></span>
                              <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                Commission Margin: +₹{totalItemMargin.toLocaleString('en-IN')}
                              </span>
                              {item.sourceOrderId && (
                                <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                  DeoDap Order: {item.sourceOrderId}
                                </span>
                              )}
                              {item.sourceTrackingNumber && (
                                <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  Delhivery AWB: {item.sourceTrackingNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Actions (Auto-Dispatch DeoDap / Fulfill Modal) */}
                        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
                          {source === 'deodap' && (
                            <button
                              onClick={() => handleAutoDispatchDeoDap(order, item)}
                              disabled={dispatchingDeoDap || item.fulfillmentStatus === 'ordered_on_source'}
                              className={`px-3.5 py-2 rounded-xl text-xs font-black shadow-sm transition flex items-center gap-1.5 cursor-pointer ${
                                item.fulfillmentStatus === 'ordered_on_source'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              }`}
                            >
                              <Zap className="w-3.5 h-3.5" />
                              <span>{item.fulfillmentStatus === 'ordered_on_source' ? 'DeoDap Dispatched' : 'Auto-Dispatch DeoDap'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenFulfillment(order, item)}
                            className="px-4 py-2 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                          >
                            <Package className="w-3.5 h-3.5 text-amber-300" />
                            <span>Fulfill via {source.toUpperCase()}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Footer: Delivery Address Info */}
                <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>
                      Deliver to: <strong>{order.shippingAddress?.fullName}</strong>,{' '}
                      {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}
                      {order.shippingAddress?.phone && ` (Phone: ${order.shippingAddress.phone})`}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    ID: {order._id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FULFILLMENT MODAL */}
        {fulfillModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0c2a5e] flex items-center justify-center font-bold">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Fulfill on {(fulfillModal.item.sourcePlatform || 'supplier').toUpperCase()}
                    </h3>
                    <p className="text-[11px] text-slate-500">Order #{fulfillModal.order.invoiceNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setFulfillModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer Address Preview & Copy */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">Customer Delivery Address</span>
                  <button
                    onClick={() => handleCopyCustomerAddress(fulfillModal.order)}
                    className="text-xs font-bold text-[#0c2a5e] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedAddress ? 'Copied!' : 'Copy Address'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-mono">
                  {fulfillModal.order.shippingAddress?.fullName}, {fulfillModal.order.shippingAddress?.phone}
                  <br />
                  {fulfillModal.order.shippingAddress?.street}, {fulfillModal.order.shippingAddress?.city},{' '}
                  {fulfillModal.order.shippingAddress?.state} - {fulfillModal.order.shippingAddress?.zipCode}
                </p>
              </div>

              {/* Source Product Link */}
              {fulfillModal.item.sourceUrl && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  <span>Product link on supplier website:</span>
                  <a
                    href={fulfillModal.item.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-amber-200/60 hover:bg-amber-200 font-bold flex items-center gap-1"
                  >
                    <span>Open Supplier Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Input: Source Order ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  {(fulfillModal.item.sourcePlatform || 'Supplier').toUpperCase()} Order ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. MEESHO-987654 or DEODAP-10294"
                  value={sourceOrderId}
                  onChange={(e) => setSourceOrderId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]/20"
                />
              </div>

              {/* Input: Source Tracking Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Courier Tracking / AWB Number</label>
                <input
                  type="text"
                  placeholder="e.g. DELHIVERY-9876543210"
                  value={sourceTrackingNumber}
                  onChange={(e) => setSourceTrackingNumber(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]/20"
                />
              </div>

              {/* Select: Fulfillment Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Fulfillment Status</label>
                <select
                  value={fulfillmentStatus}
                  onChange={(e) => setFulfillmentStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]/20"
                >
                  <option value="unfulfilled">Unfulfilled (Need to Order)</option>
                  <option value="ordered_on_source">Ordered on Source Supplier</option>
                  <option value="shipped_by_source">Shipped by Supplier Courier</option>
                  <option value="delivered_to_customer">Delivered to Customer</option>
                </select>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setFulfillModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDropshipFulfillment}
                  disabled={submittingFulfillment}
                  className="px-5 py-2 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                >
                  {submittingFulfillment ? 'Saving...' : 'Save Fulfillment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminDropshipOrders;
