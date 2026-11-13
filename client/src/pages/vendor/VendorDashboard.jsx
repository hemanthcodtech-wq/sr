import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Share2,
  Gift,
  Award,
  Wallet,
  Copy,
  Check,
  Plus,
  ArrowRight,
  TrendingUp,
  ExternalLink,
  Sparkles,
  Truck,
  Store,
  Layers,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
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
  const totalReferrals = analytics?.totalReferrals ?? 0;
  const referralBonusPerStore = analytics?.referralBonusPerStore || 500;
  const referralBonusEarned = analytics?.referralBonusEarned ?? (totalReferrals * referralBonusPerStore);
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

  const maxWeeklySale = Math.max(...weeklyChart.map((w) => w.sales || 0), 100);

  return (
    <VendorLayout
      title="Merchant Dashboard"
      subtitle={`Welcome back, ${storeName}! Real-time sales metrics, customer orders, and store operations.`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/vendor/products"
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#071d42] border border-blue-200/90 font-extrabold rounded-xl text-xs flex items-center gap-1.5 transition shadow-2xs"
          >
            <Layers className="w-3.5 h-3.5 text-[#071d42]" />
            <span>Admin Catalog</span>
          </Link>
          <Link
            to="/vendor/products"
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
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

          {/* 1. Official Store Status & Public Storefront Link Banner */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs ${
              storeData?.isPlanActive !== false && (storeData?.daysRemaining || 180) > 0
                ? 'bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-white border-emerald-300/80 text-emerald-950'
                : 'bg-rose-500/10 border-rose-300/80 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div>
                <div className="font-black text-sm flex flex-wrap items-center gap-2">
                  <span>{(storeData?.daysRemaining || 180) > 0 ? 'Official Store Active & Live' : 'Store Plan Expired'}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-white border border-emerald-200 text-emerald-800 shadow-2xs">
                    {storeData?.daysRemaining || 180} days remaining
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  {(storeData?.daysRemaining || 180) > 0
                    ? `Your storefront is live across India. Subscription valid until ${
                        storeData?.store?.planExpiresAt
                          ? new Date(storeData.store.planExpiresAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '12 May 2027'
                      }. Orders and catalog items are synced in real time.`
                    : 'Your paid listing period has expired. Products are temporarily hidden. Renew your plan to restore public visibility.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
              {storeData?.store?._id && (
                <Link
                  to={`/stores/${storeData.store.vendor?._id || storeData.store.vendor || storeData.store._id}`}
                  target="_blank"
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                >
                  <span>View Public Shop</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#071d42]" />
                </Link>
              )}
            </div>
          </div>

          {/* 2. Executive Merchant Command Deck & Wallet Deck */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Merchant Command Deck (Left 8 cols) */}
            <div className="lg:col-span-8 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between gap-5">
              <div className="flex items-center gap-4">
                {(user?.avatar || store?.logo) ? (
                  <img
                    src={user?.avatar || store?.logo}
                    alt="Store Logo"
                    className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-lg tracking-wider shadow-xs border border-amber-300 shrink-0">
                    {(storeName || user?.name || 'V').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                      {storeName}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Verified Merchant</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Store ID: <span className="font-mono text-slate-700 font-bold">VND-{store?._id ? store._id.slice(-6).toUpperCase() : 'PORTAL'}</span> • <strong className="text-slate-800">{liveProductsCount}</strong> catalog products • <strong className="text-slate-800">{pendingShipments}</strong> orders in fulfillment
                  </p>
                </div>
              </div>

              {/* Harmonized Operational Quick Actions */}
              <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 text-xs font-bold">
                <Link
                  to="/vendor/products"
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl flex items-center gap-1.5 transition shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </Link>
                <Link
                  to="/vendor/products"
                  className="px-4 py-2.5 bg-[#071d42] hover:bg-[#0c2a5e] text-white rounded-xl flex items-center gap-1.5 transition shadow-xs"
                >
                  <Layers className="w-4 h-4 text-amber-400" />
                  <span>Admin Sourced Catalog</span>
                </Link>
                <Link
                  to="/vendor/orders"
                  className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl flex items-center gap-1.5 transition shadow-2xs"
                >
                  <ShoppingBag className="w-4 h-4 text-[#071d42]" />
                  <span>Customer Orders ({vendorOrders.length})</span>
                </Link>
                <Link
                  to="/vendor/wallet"
                  className="px-4 py-2.5 bg-indigo-50/80 hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-xl flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Share2 className="w-4 h-4 text-indigo-600" />
                  <span>Referral Rewards</span>
                </Link>
              </div>
            </div>

            {/* Wallet Balance & Instant Payout Deck (Right 4 cols) */}
            <div className="lg:col-span-4 bg-gradient-to-br from-white via-slate-50 to-blue-50/40 p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Available Wallet Balance</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-100/70 border border-blue-200 text-[#071d42] flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight font-sans">
                    ₹ {Number(walletBalance).toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>{walletBalance > 0 ? 'Ready for instant bank settlement' : 'Delivered sales credit directly here'}</span>
                  </div>
                </div>
              </div>

              <Link
                to="/vendor/wallet"
                className="mt-5 w-full py-2.5 bg-[#071d42] hover:bg-[#0c2a5e] text-white text-xs font-black rounded-xl text-center transition shadow-xs flex items-center justify-center gap-1.5"
              >
                <span>Request Withdrawal Payout</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </Link>
            </div>
          </div>

          {/* 3. Five KPI Stat Metric Tiles (Balanced, Clean & Fully Responsive) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {/* Tile 1: Total Sales */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Sales</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-lg font-black text-slate-900">₹ {Number(totalVendorSales).toLocaleString('en-IN')}</div>
                <div className="text-[10.5px] text-emerald-600 font-bold mt-0.5">Live Store Orders</div>
              </div>
            </div>

            {/* Tile 2: My Earnings */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Net Earnings</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-lg font-black text-slate-900">₹ {Number(myEarnings).toLocaleString('en-IN')}</div>
                <div className="text-[10.5px] text-blue-600 font-bold mt-0.5">After 10% Platform Fee</div>
              </div>
            </div>

            {/* Tile 3: Referral Bonus */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Referral Rewards</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-lg font-black text-slate-900">₹ {Number(referralBonusEarned).toLocaleString('en-IN')}</div>
                <div className="text-[10.5px] text-purple-600 font-bold mt-0.5">{totalReferrals} Store(s) Referred</div>
              </div>
            </div>

            {/* Tile 4: Active Catalog */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Active Catalog</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-lg font-black text-slate-900">{liveProductsCount} Items</div>
                <div className="text-[10.5px] text-amber-600 font-bold mt-0.5">Cloudinary Synced</div>
              </div>
            </div>

            {/* Tile 5: Fulfillments */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Fulfillments</span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-lg font-black text-slate-900">{vendorOrders.length} Orders</div>
                <div className="text-[10.5px] text-teal-600 font-bold mt-0.5">{pendingShipments} Pending Dispatch</div>
              </div>
            </div>
          </div>

          {/* 4. Luxury Referral Promotion Banner & 1-Click Link Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left Promotional Banner */}
            <div className="lg:col-span-7 bg-gradient-to-r from-[#071d42] via-[#0c2a5e] to-[#1e3a8a] text-white rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm relative overflow-hidden">
              <div className="space-y-3 z-10 max-w-lg">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Merchant Partner Referral Desk</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black leading-snug tracking-tight text-white">
                  Invite Fellow Merchants &amp; <br />
                  Earn <span className="text-amber-400">₹{referralBonusPerStore}</span> Per Active Store
                </h3>
                <p className="text-xs text-blue-100/90 leading-relaxed">
                  When a merchant sets up their digital storefront using your referral code and activates their plan, ₹{referralBonusPerStore} is credited directly into your wallet with instant withdrawal access.
                </p>
                <div>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{copied ? '✓ Referral Link Copied!' : 'Copy Referral Invite Link →'}</span>
                  </button>
                </div>
              </div>

              {/* Right Reward Badge */}
              <div className="hidden sm:flex flex-col items-center justify-center p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-center shrink-0 w-36">
                <Gift className="w-10 h-10 text-amber-300 mb-1" />
                <span className="text-xs font-black text-white">Instant Credit</span>
                <span className="text-xs font-black text-amber-300">₹{referralBonusPerStore} / Store</span>
              </div>
            </div>

            {/* Right Referral Link Box */}
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
                  <Share2 className="w-4 h-4 text-[#071d42]" />
                  <span>Your Unique Merchant Referral Link</span>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    readOnly
                    value={referralUrl}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-700 transition shrink-0 cursor-pointer"
                    title="Copy Link"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copied ? 'Link Copied to Clipboard!' : 'Share Referral Link'}</span>
                </button>
              </div>

              {/* Bottom Referral Counters */}
              <div className="grid grid-cols-3 gap-2 text-center pt-4 border-t border-slate-100 mt-4 text-xs">
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

          {/* 5. Live Customer Orders Table & 7-Day Revenue Performance Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Live Orders Table */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Recent Customer Orders</h3>
                  <p className="text-[11px] text-slate-500">Direct sales placed for your store products</p>
                </div>
                <Link to="/vendor/orders" className="text-xs font-bold text-[#071d42] hover:underline flex items-center gap-1">
                  <span>Manage All ({vendorOrders.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto text-xs">
                {recentOrdersList.length > 0 ? (
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/70 text-slate-500 font-bold border-b border-slate-100 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-4">Invoice</th>
                        <th className="py-2.5 px-3">Product Details</th>
                        <th className="py-2.5 px-3">Customer Destination</th>
                        <th className="py-2.5 px-3">Subtotal</th>
                        <th className="py-2.5 px-3">Fulfillment</th>
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
                        const isCentral = firstItem.fulfillmentType === 'admin_central' || firstItem.sourceType === 'admin_catalog';

                        return (
                          <tr key={order._id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3 px-4 font-bold font-mono text-slate-900">
                              #{invoice}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800 max-w-[180px]">
                              <span className="truncate block font-bold text-slate-900">{title}</span>
                              <span className="text-[10px] text-slate-500">Qty: {firstItem.quantity || 1}</span>
                            </td>
                            <td className="py-3 px-3 text-slate-600">
                              <span className="font-bold text-slate-800 block">{customer}</span>
                              <span className="text-[10px] text-slate-400">{city}{city && state ? ', ' : ''}{state}</span>
                            </td>
                            <td className="py-3 px-3 font-black text-slate-900 font-sans">
                              ₹{Number(subtotal).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                                  status === 'Delivered'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : status === 'Shipped' || status === 'Out for Delivery'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}
                              >
                                {status}
                              </span>
                              {isCentral && (
                                <span className="block mt-1 text-[9px] font-black uppercase text-blue-700">
                                  Central Dispatch
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No orders placed yet. When customers purchase your items, shipments will appear here in real-time.
                  </div>
                )}
              </div>
            </div>

            {/* Sales Performance Chart (Live 7-Day Performance) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Weekly Revenue Analysis</h3>
                  <div className="flex items-center gap-3 text-[10.5px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#071d42]"></span> Total Sales
                    </span>
                    <span className="flex items-center gap-1 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Net Earnings
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
                  Last 7 Days
                </span>
              </div>

              {/* Bar Chart Visualization */}
              <div className="h-48 w-full flex items-end justify-between gap-2 pt-4 px-2">
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
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full flex items-end justify-center gap-1 h-36">
                        <div
                          style={{ height: `${salesHeightPct}%` }}
                          className="w-3 sm:w-4 bg-[#071d42] rounded-t-lg transition-all"
                          title={`Sales: ₹${bar.sales || 0}`}
                        />
                        <div
                          style={{ height: `${earningsHeightPct}%` }}
                          className="w-3 sm:w-4 bg-emerald-500 rounded-t-lg transition-all"
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
