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
  RotateCcw,
  XCircle,
  HelpCircle,
  User,
  Heart,
  MapPin,
  Lock,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const MyOrders = () => {
  const { user } = useAuth();
  const { wishlistCount } = useCart();
  const { info, success, error } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const tabs = ['All', 'Pending', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Refunded'];

  const filteredOrders = orders.filter((order) => {
    const status = (order.deliveryStatus || order.items?.[0]?.deliveryStatus || 'Confirmed').toLowerCase();
    const matchesTab =
      activeTab === 'All' ||
      (activeTab === 'Pending' && (status.includes('pending') || status.includes('processing') || status.includes('confirmed'))) ||
      status === activeTab.toLowerCase();

    const matchesSearch =
      !searchQuery.trim() ||
      (order.invoiceNumber && order.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.trackingNumber && order.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      order.items?.some((i) => i.title?.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await api.put(`/orders/${orderId}/cancel`);
      if (res.data?.success) {
        success('Order cancelled successfully.');
        fetchOrders();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Could not cancel order.');
    }
  };

  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 select-none font-sans">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/" className="hover:text-[#0c2a5e] transition">Home</Link>
        <ChevronRight className="w-3 h-3 text-slate-400" />
        <span className="text-slate-800 font-bold">My Orders</span>
      </div>

      {/* 3-Column Modern Portal Grid (matching uploaded screenshot 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Customer Profile Badge & Navigation Menu (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Top User Card with Emerald Icon and Stats */}
          <div className="glow-card p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0f8a48] text-white flex items-center justify-center font-black text-xl shadow-md flex-shrink-0">
                +
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-sm text-slate-900 truncate">
                  {user?.phone ? `+91 ${user.phone}` : user?.name || '+918978239929'}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Verified
                </span>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-center">
              <div className="p-2 rounded-xl bg-slate-50">
                <div className="text-lg font-black text-slate-900 leading-none">{orders.length}</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-1">Orders</div>
              </div>
              <Link to="/wishlist" className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 transition group">
                <div className="text-lg font-black text-slate-900 group-hover:text-rose-600 leading-none">{wishlistCount}</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-1">Wishlist</div>
              </Link>
            </div>
          </div>

          {/* Navigation Links Group */}
          <div className="glow-card p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4 text-xs font-semibold">
            {/* Overview */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Overview</span>
              <Link
                to="/profile"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <Package className="w-4 h-4 text-slate-400" />
                <span>Dashboard</span>
              </Link>
            </div>

            {/* Orders */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Orders</span>
              <Link
                to="/orders"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60 shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>My Orders</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
              </Link>

              <Link
                to="/track-order"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <Truck className="w-4 h-4 text-amber-500" />
                <span>Order Tracking</span>
              </Link>

              <Link
                to="/profile?tab=returns"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <RotateCcw className="w-4 h-4 text-blue-500" />
                <span>Returns &amp; Refunds</span>
              </Link>
            </div>

            {/* Shopping */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Shopping</span>
              <Link
                to="/wishlist"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Wishlist ({wishlistCount})</span>
              </Link>
              <Link
                to="/stores"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <Store className="w-4 h-4 text-purple-500" />
                <span>Followed Stores</span>
              </Link>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: My Orders List & Filter Tabs (lg:col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Header & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">My Orders</h1>
            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white rounded-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0f8a48] shadow-2xs font-medium"
              />
            </div>
          </div>

          {/* Filter Tabs matching Screenshot 2 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition cursor-pointer ${
                  activeTab === tab
                    ? 'bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Orders Cards List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="glow-card p-6 h-36 bg-white animate-pulse" />
              ))}
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const item = order.items?.[0] || {};
                const isPaid = order.paymentStatus === 'Completed' || order.paymentStatus === 'paid';
                const isLivePlaced =
                  order.deliveryStatus !== 'Delivered' &&
                  order.deliveryStatus !== 'Cancelled' &&
                  order.deliveryStatus !== 'Returned';

                return (
                  <div
                    key={order._id}
                    className="glow-card rounded-2xl p-4 sm:p-5 bg-white border border-slate-200/90 shadow-sm space-y-3 transition-all hover:border-slate-300"
                  >
                    {/* Header: Invoice ID, Date, Item Count, Payment Status & Confirmed Tag */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 text-xs">
                      <div className="flex flex-wrap items-center gap-2 text-slate-500 text-[11px]">
                        <span className="font-mono font-bold text-slate-800">
                          {order.invoiceNumber || order._id}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span>•</span>
                        <span>{order.items?.length || 1} Item</span>
                        <span>•</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            isPaid
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          Payment: {isPaid ? 'Paid' : 'Pending'}
                        </span>
                      </div>

                      <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black">
                        {order.deliveryStatus || 'Confirmed'}
                      </span>
                    </div>

                    {/* Order Item Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={
                            item.image ||
                            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80'
                          }
                          alt={item.title}
                          className="w-16 h-16 rounded-xl object-contain bg-slate-50 border border-slate-200 flex-shrink-0 p-1"
                        />
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {item.title}
                          </h3>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Sold by:{' '}
                            <span className="text-purple-700 font-semibold">
                              {item.store?.storeName || 'Internet Cafe & Mobile Accesories'}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-base sm:text-lg font-black text-slate-900">
                          ₹{order.totalAmount?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons: View Invoice (Only after payment) & Cancel or Track */}
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-2 text-xs">
                      {/* Tracking button ONLY if order is live placed and not delivered */}
                      {isLivePlaced && (
                        <Link
                          to={`/order/${order._id}`}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition shadow-xs flex items-center gap-1.5"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Track Live Order</span>
                        </Link>
                      )}

                      {/* INVOICE ONLY AFTER PAYMENT IS COMPLETED */}
                      {isPaid ? (
                        <a
                          href={`http://localhost:5000/api/orders/${order._id}/invoice-preview`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition flex items-center gap-1.5 border border-slate-200"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span>View Invoice</span>
                        </a>
                      ) : (
                        <span
                          className="px-3 py-1.5 rounded-xl bg-slate-50 text-slate-400 font-semibold text-[11px] border border-slate-100 cursor-not-allowed"
                          title="Invoice available after payment confirmation"
                        >
                          Invoice on Payment
                        </span>
                      )}

                      {order.deliveryStatus !== 'Cancelled' && order.deliveryStatus !== 'Delivered' && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition cursor-pointer border border-rose-200"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glow-card p-12 text-center space-y-3 bg-white">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Orders Found</h3>
              <p className="text-xs text-slate-400">You do not have any orders matching the "{activeTab}" filter.</p>
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0c2a5e] text-white font-bold text-xs"
              >
                <span>Shop Marketplace</span>
              </Link>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Quick Links, Account Status & Edit Profile (lg:col-span-3 - matching screenshot 2) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Gradient User Card with Edit Profile */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg space-y-3">
            <div>
              <span className="text-[10px] text-purple-200 block uppercase font-bold tracking-wider">Signed in as</span>
              <strong className="text-sm font-extrabold block truncate">
                {user?.phone ? `+91 ${user.phone}` : user?.name || '+918978239929'}
              </strong>
            </div>
            <Link
              to="/profile"
              className="block w-full text-center py-2 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md transition shadow-xs"
            >
              Edit Profile
            </Link>
          </div>

          {/* Quick Links Menu */}
          <div className="glow-card p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3 text-xs">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">Quick Links</h4>
            <div className="space-y-2">
              <Link to="/orders" className="flex items-center gap-2.5 text-slate-700 hover:text-purple-700 transition">
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <span>My Orders</span>
              </Link>
              <Link to="/profile?tab=addresses" className="flex items-center gap-2.5 text-slate-700 hover:text-purple-700 transition">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Saved Addresses</span>
              </Link>
              <Link to="/wishlist" className="flex items-center gap-2.5 text-slate-700 hover:text-purple-700 transition">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>Wishlist ({wishlistCount})</span>
              </Link>
              <Link to="/profile?tab=returns" className="flex items-center gap-2.5 text-slate-700 hover:text-purple-700 transition">
                <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                <span>Returns &amp; Refunds</span>
              </Link>
            </div>
          </div>

          {/* Account Status Card */}
          <div className="glow-card p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3 text-xs">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">Account Status</h4>
            <div className="space-y-2 text-slate-600">
              <div className="flex items-center justify-between">
                <span>Email</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">Verified</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Account</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px] border border-emerald-200">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Member since</span>
                <span className="font-bold text-slate-800">Nov 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
