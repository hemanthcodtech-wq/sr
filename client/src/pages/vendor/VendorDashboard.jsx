import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  Package,
  ShoppingBag,
  BarChart3,
  Megaphone,
  Share2,
  Gift,
  Award,
  Wallet,
  Headphones,
  Settings,
  Bell,
  Copy,
  Check,
  Plus,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Truck,
  RotateCcw,
  Store,
  Layers,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import Logo from '../../components/Logo';
import VendorLayout from '../../components/vendor/VendorLayout';
import { PageLoader } from '../../components/LoadingScreen';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const VendorDashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [storeData, setStoreData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [vendorOrders, setVendorOrders] = useState([]);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const [storeRes, analyticsRes, ordersRes, productsRes] = await Promise.all([
          api.get('/vendors/my-store'),
          api.get('/vendors/analytics').catch(() => ({ data: { success: false } })),
          api.get('/orders/vendor/orders'),
          api.get('/products/vendor/mine').catch(() => api.get('/products/vendor/my-products')),
        ]);

        if (storeRes.data?.success) {
          setStoreData(storeRes.data);
        }
        if (analyticsRes.data?.success) {
          setAnalytics(analyticsRes.data.stats);
        }
        if (ordersRes.data?.success) {
          setVendorOrders(ordersRes.data.orders || []);
        }
        if (productsRes.data?.success) {
          setVendorProducts(productsRes.data.products || []);
        }
      } catch (err) {
        console.warn('Could not fetch live vendor data, fallback active:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, []);

  const store = storeData?.store || (typeof user?.store === 'object' ? user.store : null);
  const storeName = store?.storeName || user?.store?.storeName || (user?.name ? `${user.name}'s Store` : 'My Merchant Store');
  const referralCode = user?.referralCode || store?.referralCode || 'VEND-BZUWC5';
  const referralUrl = `${window.location.origin}/vendor/register?ref=${referralCode}`;
  
  // Real stats from live database analytics
  const walletBalance = analytics?.walletBalance ?? user?.walletBalance ?? storeData?.vendor?.walletBalance ?? 0;
  const totalVendorSales = analytics?.totalSales ?? vendorOrders.reduce((acc, o) => acc + (o.vendorSubtotal || o.totalAmount || 0), 0);
  const myEarnings = analytics?.myEarnings ?? Math.round(totalVendorSales * 0.9);
  const liveProductsCount = analytics?.totalProducts ?? vendorProducts.length;
  const totalStock = analytics?.totalStock ?? 0;
  const totalReferrals = analytics?.totalReferrals ?? 0;
  const referralBonusEarned = analytics?.referralBonusEarned ?? (totalReferrals * 200);
  const referralBonusPerStore = analytics?.referralBonusPerStore || 200;
  const weeklyChart = analytics?.weeklyChart || [];
  const recentOrdersList = analytics?.recentOrders?.length ? analytics.recentOrders : vendorOrders.slice(0, 5);

  const pendingShipments = analytics?.pendingOrdersCount ?? vendorOrders.filter((o) =>
    o.items?.some((i) => i.deliveryStatus === 'Processing' || i.deliveryStatus === 'Shipped')
  ).length;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    showToast('Vendor referral link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  // Find max sales for weekly chart calculation
  const maxWeeklySale = Math.max(...weeklyChart.map((w) => w.sales || 0), 100);

  return (
    <VendorLayout
      title="Merchant Dashboard"
      subtitle={`Welcome back, ${storeName}! Real-time sales metrics, customer orders, and store operations.`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/vendor/products"
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-2xl text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      }
    >
      {loading ? (
        <PageLoader text="Loading live merchant analytics & store data..." />
      ) : (
        <div className="space-y-6">

          {/* 1. Plan Validity & Public Store Status Banner - Morphism */}
          <div
            className={`p-4 sm:p-5 rounded-3xl backdrop-blur-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-[0_8px_30px_rgb(0,0,0,0.02)] ${
              storeData?.isPlanActive !== false && (storeData?.daysRemaining || 180) > 0
                ? 'bg-emerald-500/10 border-emerald-300/80 text-emerald-950'
                : 'bg-rose-500/10 border-rose-300/80 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-3 h-3 rounded-full shrink-0 ${
                  (storeData?.daysRemaining || 180) > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <div>
                <div className="font-black text-sm flex items-center gap-2">
                  <span>{(storeData?.daysRemaining || 180) > 0 ? 'Official Store Active & Live' : 'Store Plan Expired'}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/80 border border-slate-200 text-slate-800">
                    {storeData?.daysRemaining || 180} days remaining
                  </span>
                </div>
                <p className="text-xs opacity-90 mt-0.5 leading-relaxed">
                  {(storeData?.daysRemaining || 180) > 0
                    ? `Your storefront is visible on the public panel. Paid subscription valid until ${
                        storeData?.store?.planExpiresAt
                          ? new Date(storeData.store.planExpiresAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '20 Apr 2027'
                      }.`
                    : 'Your paid listing period has expired. Your products are temporarily hidden. Please renew below to restore store visibility.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {storeData?.store?._id && (
                <Link
                  to={`/store/${storeData.store._id}`}
                  target="_blank"
                  className="px-3.5 py-2 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200/90 hover:bg-white text-slate-800 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
                >
                  <span>View Public Storefront</span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                </Link>
              )}
            </div>
          </div>

          {/* 2. Welcome Banner + Quick Action Buttons + Wallet Balance - Morphism */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Welcome Greeting & Action Buttons */}
            <div className="lg:col-span-8 bg-white/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between gap-5">
              <div className="flex items-center gap-3.5">
                {(user?.avatar || store?.logo) ? (
                  <img
                    src={user?.avatar || store?.logo}
                    alt="Profile Avatar"
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-lg tracking-wider shadow-sm border border-amber-300 shrink-0">
                    {(storeName || user?.name || 'V').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Welcome Back, {storeName} !
                  </h1>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Your store is running with {liveProductsCount} live catalog product(s) and {pendingShipments} orders in fulfillment.
                  </p>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold pt-1">
                <Link
                  to="/vendor/products"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center gap-1.5 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </Link>
                <Link
                  to="/vendor/orders"
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl flex items-center gap-1.5 transition shadow-sm"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>View Orders ({vendorOrders.length})</span>
                </Link>
                <Link
                  to="/vendor/wallet"
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl flex items-center gap-1.5 transition shadow-sm"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Referral Hub</span>
                </Link>
                <Link
                  to="/vendor/products"
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl flex items-center gap-1.5 transition shadow-sm"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Inventory ({liveProductsCount})</span>
                </Link>
              </div>
            </div>

            {/* Wallet Balance Card */}
            <div className="lg:col-span-4 bg-white/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wallet Balance</span>
                  <div className="text-3xl font-black text-slate-900 mt-1 tracking-tight">
                    ₹ {walletBalance.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold mt-1">
                    {walletBalance > 0 ? 'Ready for Bank Settlement' : 'Delivered sales credit directly here'}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>

              <Link
                to="/vendor/wallet"
                className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-2xl text-center transition shadow-sm"
              >
                Request Withdrawal Payout
              </Link>
            </div>
          </div>

          {/* 3. Five KPI Cards Row - Light Morphism (Live Database Values) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Total Sales */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Sales</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-black text-slate-900 mt-2">₹ {totalVendorSales.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-emerald-600 font-bold mt-1">Live from Store Orders</div>
            </div>

            {/* My Commission / Net Profit */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">My Earnings</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-black text-slate-900 mt-2">₹ {myEarnings.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-blue-600 font-bold mt-1">After 10% Platform Share</div>
            </div>

            {/* Referral Commission */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Referral Bonus</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-black text-slate-900 mt-2">₹ {referralBonusEarned.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-purple-600 font-bold mt-1">{totalReferrals} Store(s) Referred</div>
            </div>

            {/* Store Products */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Live Products</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-black text-slate-900 mt-2">{liveProductsCount} Items</div>
              <div className="text-[11px] text-amber-600 font-bold mt-1">Cloudinary CDN synced</div>
            </div>

            {/* Total Orders */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-4 border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.02)] col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Fulfillments</span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-black text-slate-900 mt-2">{vendorOrders.length} Orders</div>
              <div className="text-[11px] text-teal-600 font-bold mt-1">{pendingShipments} Pending Dispatch</div>
            </div>
          </div>

          {/* 4. Large Referral Banner & Referral Link Box (Refer Merchant and Get ₹200) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Blue Promotional Referral Banner */}
            <div className="lg:col-span-7 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-6 flex items-center justify-between gap-4 shadow-md relative overflow-hidden">
              <div className="space-y-2.5 z-10 max-w-xl">
                <h3 className="text-xl sm:text-2xl font-black leading-snug tracking-tight">
                  Share Your Referral Link <br /> and Earn ₹{referralBonusPerStore} Per Vendor
                </h3>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold">
                  <span>Merchant Referral Bonus:</span>
                  <span className="text-amber-300 font-black">₹{referralBonusPerStore} Instant Credit</span>
                </div>
                <p className="text-xs text-blue-100/90 leading-relaxed">
                  Invite other shop owners & merchants to set up their digital storefront. When they activate their store plan, ₹{referralBonusPerStore} is credited to your wallet instantly.
                </p>
                <div>
                  <button
                    onClick={handleCopyLink}
                    className="mt-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-xs rounded-2xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{copied ? 'Link Copied!' : 'Copy Referral Link →'}</span>
                  </button>
                </div>
              </div>

              {/* Verified Partner Badge */}
              <div className="hidden sm:flex flex-col items-center justify-center p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shrink-0 w-36">
                <Gift className="w-10 h-10 text-amber-300 mb-1" />
                <span className="text-xs font-black text-white">Direct Reward</span>
                <span className="text-[11px] text-amber-300 font-bold">₹{referralBonusPerStore} / Store</span>
              </div>
            </div>

            {/* Your Referral Link Card - Morphism */}
            <div className="lg:col-span-5 bg-white/80 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                  <Share2 className="w-4 h-4 text-blue-600" />
                  <span>Your Direct Referral Link</span>
                </div>

                {/* Referral Link Input */}
                <div className="flex items-center gap-1.5 mt-2.5">
                  <input
                    type="text"
                    readOnly
                    value={referralUrl}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-mono text-slate-700 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-2 border border-slate-200 rounded-2xl hover:bg-slate-50 text-slate-600 transition shrink-0 cursor-pointer"
                    title="Copy"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="w-full mt-2.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copied ? 'Link Copied to Clipboard!' : 'Share Referral Link'}</span>
                </button>
              </div>

              {/* Bottom Referral Counters */}
              <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-100 mt-3 text-xs">
                <div>
                  <div className="text-slate-400 text-[10px] font-bold uppercase">Referred</div>
                  <div className="font-black text-slate-900 text-base">{totalReferrals}</div>
                </div>
                <div>
                  <div className="text-emerald-600 text-[10px] font-bold uppercase">Active Stores</div>
                  <div className="font-black text-slate-900 text-base">{totalReferrals}</div>
                </div>
                <div>
                  <div className="text-amber-500 text-[10px] font-bold uppercase">Reward ₹</div>
                  <div className="font-black text-slate-900 text-base">₹{referralBonusEarned}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Live Orders Table & Sales Chart (Live Database Records) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Live Orders Table */}
            <div className="lg:col-span-7 bg-white/80 backdrop-blur-xl rounded-3xl border border-white/90 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Recent Customer Orders</h3>
                  <p className="text-[11px] text-slate-400">Direct orders placed for your store products</p>
                </div>
                <Link to="/vendor/orders" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                  Manage Shipments ({vendorOrders.length}) →
                </Link>
              </div>

              <div className="overflow-x-auto text-[11px]">
                {recentOrdersList.length > 0 ? (
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/70 text-slate-500 font-bold border-b border-slate-100">
                      <tr>
                        <th className="py-2.5 px-4">Invoice</th>
                        <th className="py-2.5 px-3">Product</th>
                        <th className="py-2.5 px-3">Customer & Destination</th>
                        <th className="py-2.5 px-3">Subtotal</th>
                        <th className="py-2.5 px-3">Delivery Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recentOrdersList.map((order) => {
                        const firstItem = order.items?.[0] || {};
                        const invoice = order.invoiceNumber;
                        const title = order.firstItemTitle || firstItem.title || 'Product Item';
                        const customer = order.customerName || order.shippingAddress?.fullName || 'Customer';
                        const city = order.customerCity || order.shippingAddress?.city || '';
                        const state = order.customerState || order.shippingAddress?.state || '';
                        const subtotal = order.subtotal || order.vendorSubtotal || order.totalAmount || 0;
                        const status = order.deliveryStatus || firstItem.deliveryStatus || 'Processing';

                        return (
                          <tr key={order._id} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 px-4 font-bold font-mono text-slate-900">
                              #{invoice}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              {title}
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              <span className="font-bold text-slate-800 block">{customer}</span>
                              <span className="text-[10px] text-slate-400">{city}{city && state ? ', ' : ''}{state}</span>
                            </td>
                            <td className="py-3 px-3 font-black text-slate-900">
                              ₹{Number(subtotal).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                  status === 'Delivered'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : status === 'Shipped' || status === 'Out for Delivery'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No orders placed yet for your products. When customers buy your items, orders will appear here in real-time.
                  </div>
                )}
              </div>
            </div>

            {/* Sales Overview Bar Chart (Live 7-Day Performance) */}
            <div className="lg:col-span-5 bg-white/80 backdrop-blur-xl p-5 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Live Weekly Revenue</h3>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span> Total Sales
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Net Earnings
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
                  Last 7 Days
                </span>
              </div>

              {/* Bar Chart Visualization */}
              <div className="h-44 w-full flex items-end justify-between gap-2 pt-4 px-2">
                {(weeklyChart.length > 0 ? weeklyChart : [
                  { day: 'Mon', sales: 0, earnings: 0 },
                  { day: 'Tue', sales: 0, earnings: 0 },
                  { day: 'Wed', sales: 0, earnings: 0 },
                  { day: 'Thu', sales: 0, earnings: 0 },
                  { day: 'Fri', sales: 0, earnings: 0 },
                  { day: 'Sat', sales: 0, earnings: 0 },
                  { day: 'Sun', sales: totalVendorSales, earnings: myEarnings },
                ]).map((bar, idx) => {
                  const salesHeightPct = maxWeeklySale > 0 ? Math.min(100, Math.max(12, Math.round((bar.sales / maxWeeklySale) * 90))) : 12;
                  const earningsHeightPct = maxWeeklySale > 0 ? Math.min(100, Math.max(8, Math.round((bar.earnings / maxWeeklySale) * 90))) : 8;

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1 h-32">
                        <div
                          style={{ height: `${salesHeightPct}%` }}
                          className="w-3 sm:w-3.5 bg-blue-600 rounded-t-lg transition-all"
                          title={`Sales: ₹${bar.sales || 0}`}
                        />
                        <div
                          style={{ height: `${earningsHeightPct}%` }}
                          className="w-3 sm:w-3.5 bg-emerald-500 rounded-t-lg transition-all"
                          title={`Net Earnings: ₹${bar.earnings || 0}`}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{bar.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </VendorLayout>
  );
};

export default VendorDashboard;
