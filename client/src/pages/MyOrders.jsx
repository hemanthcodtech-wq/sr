import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Truck,
  Calendar,
  Store,
  FileText,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Search,
  ChevronRight,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import api from '../services/api';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        if (res.data && res.data.success) {
          setOrders(res.data.orders);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Out for Delivery':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesFilter =
      statusFilter === 'all' ||
      order.items?.some((i) => i.deliveryStatus?.toLowerCase() === statusFilter.toLowerCase());
    const matchesSearch =
      !searchQuery.trim() ||
      (order.invoiceNumber && order.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      order.items?.some((i) => i.title?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-14 py-8 space-y-8 select-none">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0c2a5e] to-[#174896] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
            <span>Buyer Protection Guaranteed</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">My Orders &amp; Invoices</h1>
          <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Track package delivery in real time, view tax-compliant GST invoices, and manage purchases from verified merchant stores.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Link
            to="/profile?tab=referrals"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white text-xs font-bold border border-white/20 transition flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Rewards &amp; Wallet</span>
          </Link>
          <Link
            to="/products"
            className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-black transition shadow-sm flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4 text-slate-900" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by Order ID, Product Name, or AWB..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium focus:outline-none focus:border-[#0c2a5e] focus:bg-white transition"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'processing', 'shipped', 'out for delivery', 'delivered'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition cursor-pointer ${
                statusFilter === filter
                  ? 'bg-[#0c2a5e] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Order List Display */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-3xl h-44 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-md transition"
            >
              {/* Order Header */}
              <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4 text-slate-600">
                  <div>
                    <span className="text-slate-400">Invoice: </span>
                    <strong className="text-slate-900 font-mono font-bold">#{order.invoiceNumber || order._id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Order Placed: </span>
                    <strong className="text-slate-800">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Payment: </span>
                    <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase text-[10.5px]">
                      {order.paymentStatus} via {order.paymentMethod}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to={`/order/${order._id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-bold text-xs transition shadow-xs"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Track Shipment</span>
                  </Link>

                  <a
                    href={`http://localhost:5000/api/orders/${order._id}/invoice-preview`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-blue-700 font-bold text-xs transition shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Tax Invoice (PDF)</span>
                  </a>
                </div>
              </div>

              {/* Order Items List */}
              <div className="p-5 divide-y divide-slate-100">
                {order.items?.map((item) => (
                  <div
                    key={item._id}
                    className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&auto=format&fit=crop&q=80'}
                        alt={item.title}
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Store className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-semibold text-slate-700">{item.store?.storeName || 'Merchant Store'}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{item.title}</h4>
                        <div className="text-xs text-slate-500 font-medium">
                          Quantity: <strong className="text-slate-800">{item.quantity}</strong> × ₹{item.price?.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(item.deliveryStatus)}`}>
                        <Truck className="w-3.5 h-3.5" />
                        <span>{item.deliveryStatus}</span>
                      </span>
                      {item.trackingNumber && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          AWB: {item.trackingNumber}
                        </span>
                      )}
                      <div className="text-sm font-black text-slate-900">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address & Grand Total Footer */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                <div className="max-w-xl">
                  <span className="font-bold text-slate-800">Delivering To: </span>
                  {order.shippingAddress?.fullName}, {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}
                </div>
                <div className="font-black text-slate-900 text-sm">
                  Grand Total: ₹{order.totalAmount?.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No orders match your criteria</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Discover quality products from independent registered merchants and enjoy ₹200 referral bonuses.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0c2a5e] hover:bg-[#153e85] text-white font-bold text-xs rounded-xl transition shadow-xs"
          >
            <span>Explore Marketplace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
