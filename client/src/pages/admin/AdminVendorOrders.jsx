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
  User,
  Store,
  Wallet,
  Check,
  X,
  Package,
  MapPin,
  Phone,
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  CreditCard,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminVendorOrders = () => {
  const { success, error, info } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [settlingItemId, setSettlingItemId] = useState(null);

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
      error('Failed to load marketplace orders');
    } finally {
      setLoading(false);
    }
  };

  // Settle vendor item payout to vendor wallet
  const handleSettleToVendor = async (orderId, itemId, vendorName, earning) => {
    try {
      setSettlingItemId(itemId);
      const res = await api.post(`/orders/${orderId}/items/${itemId}/settle-vendor`);
      if (res.data?.success) {
        success(`✓ Settled ₹${earning} directly to ${vendorName}'s wallet!`);
        fetchOrders();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to settle order item');
    } finally {
      setSettlingItemId(null);
    }
  };

  // Filter only items that belong to third-party vendors (not admin dropshipped items)
  // An item is a vendor item if it is NOT dropshipped or if it belongs to a registered vendor store
  const vendorOrdersList = orders.map((order) => {
    const vendorItems = (order.items || []).filter((item) => {
      // Third-party vendor items: not dropshipped OR uploaded by vendor
      return !item.isDropshipped || (item.vendor && item.vendor.role === 'vendor') || item.sourcePlatform === 'in_house';
    });

    const vendorTotal = vendorItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const commission = Math.round((vendorTotal * 10) / 100);
    const vendorPayout = vendorTotal - commission;

    return {
      ...order,
      vendorItems,
      vendorTotal,
      commission,
      vendorPayout,
    };
  }).filter((order) => order.vendorItems.length > 0);

  // Extract unique vendors for filtering
  const vendorOptions = [];
  vendorOrdersList.forEach((order) => {
    order.vendorItems.forEach((item) => {
      const vName = item.store?.storeName || item.vendor?.name || 'Third-Party Vendor';
      const vId = (item.vendor?._id || item.vendor || '').toString();
      if (vId && !vendorOptions.some((v) => v.id === vId)) {
        vendorOptions.push({ id: vId, name: vName });
      }
    });
  });

  const filteredOrders = vendorOrdersList.filter((order) => {
    const invoice = (order.invoiceNumber || order._id || '').toLowerCase();
    const custName = (order.customer?.name || order.shippingAddress?.fullName || '').toLowerCase();
    const matchesSearch = invoice.includes(searchQuery.toLowerCase()) || custName.includes(searchQuery.toLowerCase());

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'settled' && order.vendorItems.every((i) => i.vendorSettled)) ||
      (selectedStatus === 'unsettled' && order.vendorItems.some((i) => !i.vendorSettled)) ||
      order.vendorItems.some((i) => i.deliveryStatus?.toLowerCase() === selectedStatus.toLowerCase());

    const matchesVendor =
      selectedVendor === 'all' ||
      order.vendorItems.some((i) => (i.vendor?._id || i.vendor || '').toString() === selectedVendor);

    return matchesSearch && matchesStatus && matchesVendor;
  });

  // Calculate Financial Aggregates
  const totalVolume = vendorOrdersList.reduce((sum, o) => sum + o.vendorTotal, 0);
  const totalCommission = Math.round((totalVolume * 10) / 100);
  const totalPayouts = totalVolume - totalCommission;

  const totalSettledAmount = vendorOrdersList.reduce((sum, o) => {
    const settledSum = o.vendorItems
      .filter((i) => i.vendorSettled)
      .reduce((iSum, i) => iSum + (i.price * i.quantity * 0.9), 0);
    return sum + settledSum;
  }, 0);

  const pendingSettlementCount = vendorOrdersList.reduce((count, o) => {
    return count + o.vendorItems.filter((i) => !i.vendorSettled).length;
  }, 0);

  return (
    <AdminLayout
      title="Marketplace Vendor Orders & Payouts"
      subtitle="Track customer orders for third-party merchant products, 10% platform commissions, and vendor wallet settlements"
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
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-[#0c2a5e] text-white shadow-sm flex items-center gap-2"
            >
              <Store className="w-4 h-4 text-amber-300" />
              <span>Vendor Marketplace Orders &amp; Payouts</span>
              <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full ml-1">
                {vendorOrdersList.length}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-2 px-2">
            <span className="text-[11px] font-bold text-slate-500">Platform Commission:</span>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              10% Retained by Admin
            </span>
          </div>
        </div>

        {/* HERO BANNER */}
        <div className="bg-gradient-to-r from-[#071d42] via-[#0c2a5e] to-[#153e85] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner flex-shrink-0">
                <Store className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">Independent Vendor Orders</h2>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Separate Transaction Accounting
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl">
                  These orders contain products owned and fulfilled by registered sellers. Admin receives 10% marketplace commission, and 90% is settled to the vendor's wallet balance.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchOrders}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/90 hover:text-white border border-white/15 backdrop-blur-md transition cursor-pointer"
                title="Refresh Vendor Orders"
              >
                <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-300' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* 4 FINANCIAL METRICS TILES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">VENDOR ORDERS</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{vendorOrdersList.length}</div>
              <span className="text-[11px] text-slate-500 block">Third-party items</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0c2a5e] flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">GROSS VENDOR VOLUME</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">₹{totalVolume.toLocaleString('en-IN')}</div>
              <span className="text-[11px] text-emerald-600 font-bold block">Customer payments</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ADMIN 10% COMMISSION</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">₹{totalCommission.toLocaleString('en-IN')}</div>
              <span className="text-[11px] text-slate-500 block">Platform revenue</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PENDING SETTLEMENTS</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">{pendingSettlementCount}</div>
              <span className="text-[11px] text-amber-600 font-bold block">Items awaiting payout</span>
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
            {/* Vendor Filter */}
            {vendorOptions.length > 0 && (
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]/20"
              >
                <option value="all">All Vendors</option>
                {vendorOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            )}

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
              <option value="settled">Settled in Wallet</option>
              <option value="unsettled">Pending Settlement</option>
            </select>
          </div>
        </div>

        {/* VENDOR ORDERS LIST */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
            <RotateCcw className="w-8 h-8 text-[#0c2a5e] animate-spin mx-auto" />
            <div className="text-sm font-bold text-slate-700">Loading Vendor Orders...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Store className="w-8 h-8" />
            </div>
            <div className="text-base font-black text-slate-900">No Vendor Orders Found</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Orders placed by customers for products uploaded by independent vendors will be tracked separately here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden transition hover:shadow-md"
              >
                {/* Order Top Header */}
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
                    <a
                      href={`http://localhost:5000/api/orders/${order._id}/invoice-preview`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <span>Invoice</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Vendor Subtotal</span>
                      <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                        ₹{order.vendorTotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items in this Order */}
                <div className="divide-y divide-slate-100">
                  {order.vendorItems.map((item, idx) => {
                    const itemTotal = item.price * item.quantity;
                    const comm = Math.round((itemTotal * 10) / 100);
                    const vendorPayable = itemTotal - comm;
                    const vendorName = item.store?.storeName || item.vendor?.name || 'Registered Merchant';

                    return (
                      <div key={item._id || idx} className="p-4 sm:p-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        {/* Left: Product Info & Vendor Tag */}
                        <div className="flex items-start gap-4">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                            alt={item.title}
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 shadow-2xs flex-shrink-0"
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                                <Store className="w-3 h-3" />
                                <span>{vendorName}</span>
                              </span>
                              {item.vendor?.email && (
                                <span className="text-[11px] text-slate-400 font-mono">
                                  ({item.vendor.email})
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 max-w-xl">
                              {item.title}
                            </h4>

                            <div className="text-xs text-slate-500 flex items-center gap-3">
                              <span>Qty: <strong>{item.quantity}</strong></span>
                              <span>Customer Price: <strong>₹{item.price.toLocaleString('en-IN')}</strong></span>
                              <span>Item Total: <strong>₹{itemTotal.toLocaleString('en-IN')}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Middle: Commission & Payout Accounting Breakdown */}
                        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex items-center gap-4 text-xs font-mono">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase font-sans">10% Platform Fee</span>
                            <span className="font-bold text-emerald-600">+₹{comm.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="h-6 w-px bg-slate-200" />
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase font-sans">90% Vendor Payout</span>
                            <span className="font-bold text-[#0c2a5e]">₹{vendorPayable.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="h-6 w-px bg-slate-200" />
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 block uppercase font-sans">Settlement</span>
                            {item.vendorSettled ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Settled
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Pending
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Fulfillment & Settle Action */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto justify-end">
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase">Vendor Delivery Status</span>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              item.deliveryStatus === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.deliveryStatus === 'Shipped'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.deliveryStatus || 'Processing'}
                            </span>
                            {item.trackingNumber && (
                              <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                                AWB: {item.trackingNumber}
                              </span>
                            )}
                          </div>

                          {!item.vendorSettled && (
                            <button
                              onClick={() => handleSettleToVendor(order._id, item._id, vendorName, vendorPayable)}
                              disabled={settlingItemId === item._id}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              <span>{settlingItemId === item._id ? 'Settling...' : '1-Click Settle Payout'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom Footer: Shipping Address Details */}
                <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>
                      Deliver to: <strong>{order.shippingAddress?.fullName || order.customer?.name}</strong>,{' '}
                      {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}
                      {order.shippingAddress?.phone && ` (Phone: ${order.shippingAddress.phone})`}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">
                    Order ID: {order._id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminVendorOrders;
