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
  const [vendorOrders, setVendorOrders] = useState([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        const [storeRes, ordersRes] = await Promise.all([
          api.get('/vendors/my-store'),
          api.get('/orders/vendor/orders'),
        ]);

        if (storeRes.data?.success) {
          setStoreData(storeRes.data);
        }
        if (ordersRes.data?.success) {
          setVendorOrders(ordersRes.data.orders || []);
        }
      } catch (err) {
        console.warn('Could not fetch live vendor data, fallback active:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, []);

  const store = storeData?.store;
  const storeName = store?.storeName || user?.store?.storeName || 'Raju Traders';
  const referralCode = user?.referralCode || 'VEND-ARJUN1';
  const referralUrl = `https://amezon.online/register?ref=${referralCode}`;
  const walletBalance = user?.walletBalance || 5820;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    showToast('Referral link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <VendorLayout
      title="Merchant Dashboard"
      subtitle={`Welcome back, ${storeName}! Real-time sales metrics and fulfillment operations.`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/vendor/products"
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Link>
        </div>
      }
    >
      {loading ? (
        <PageLoader text="Loading live merchant analytics..." />
      ) : (
        <div className="space-y-6">
          {/* Plan Validity & Public Store Status Banner */}
          {storeData?.store?.planExpiresAt && (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs ${
              storeData?.isPlanActive !== false && storeData?.daysRemaining > 0
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${storeData?.daysRemaining > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                <div>
                  <span className="font-black text-sm">
                    {storeData?.daysRemaining > 0 ? 'Official Store Active & Live' : 'Store Plan Expired'}
                  </span>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {storeData?.daysRemaining > 0
                      ? `Your storefront is visible on the public panel. Paid subscription valid until ${new Date(storeData.store.planExpiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} (${storeData.daysRemaining} days remaining).`
                      : 'Your paid listing period has expired. Your store is temporarily hidden from the public panel. Please renew to restore visibility.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {storeData?.store?._id && (
                  <Link
                    to={`/store/${storeData.store._id}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-800 font-bold text-xs flex items-center gap-1 shadow-2xs transition"
                  >
                    <span>View Public Storefront</span>
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  </Link>
                )}
                {storeData?.daysRemaining <= 15 && (
                  <Link
                    to="/vendor/register"
                    className="px-3 py-1.5 rounded-lg bg-[#0c2a5e] text-white font-bold text-xs hover:bg-blue-800 transition"
                  >
                    Renew Plan
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Welcome Banner + Quick Action Buttons + Wallet Balance (Matching Image 2) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Welcome Greeting & Quick Action Buttons */}
            <div className="lg:col-span-8 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={
                    user?.avatar ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
                  }
                  alt="Avatar"
                  className="w-12 h-12 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900">
                    Welcome Back, {storeName} !
                  </h1>
                  <p className="text-xs text-slate-500">Your business is growing. Keep going!</p>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold pt-1">
                <Link
                  to="/vendor/products"
                  className="px-3.5 py-2 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </Link>
                <Link
                  to="/vendor/orders"
                  className="px-3.5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-lg flex items-center gap-1.5 transition shadow-2xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>View Orders</span>
                </Link>
                <Link
                  to="/vendor/wallet"
                  className="px-3.5 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Referral Link</span>
                </Link>
                <Link
                  to="/vendor/wallet"
                  className="px-3.5 py-2 bg-[#ea580c] hover:bg-[#c2410c] text-white rounded-lg flex items-center gap-1.5 transition shadow-2xs"
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>Get Voucher</span>
                </Link>
              </div>
            </div>

            {/* Wallet Balance Card (Matching Image 2 Top-Right) */}
            <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Wallet Balance</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    ₹ {walletBalance.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>

              <Link
                to="/vendor/wallet"
                className="mt-4 w-full py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg text-center transition shadow-2xs"
              >
                Request Withdrawal
              </Link>
            </div>
          </div>

          {/* 3. Five KPI Cards Row (Matching Image 2) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Total Sales */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Total Sales</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-base font-black text-slate-900 mt-1">₹ 1,24,580</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">↑ 18% this month</div>
            </div>

            {/* My Commission */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">My Commission</span>
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-base font-black text-slate-900 mt-1">₹ 8,450</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">↑ 12% this month</div>
            </div>

            {/* Referral Commission */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Referral Commission</span>
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Share2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-base font-black text-slate-900 mt-1">₹ 2,600</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">↑ 25% this month</div>
            </div>

            {/* Voucher Commission */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Voucher Commission</span>
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
              </div>
              <div className="text-base font-black text-slate-900 mt-1">₹ 1,200</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">↑ 10% this month</div>
            </div>

            {/* Turnover Incentive */}
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">Turnover Incentive</span>
                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="text-base font-black text-slate-900 mt-1">₹ 1,500</div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">↑ 8% this month</div>
            </div>
          </div>

          {/* 4. Large Referral Banner & Referral Link Box (Matching Image 2) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Blue Promotional Referral Banner */}
            <div className="lg:col-span-7 bg-[#155dfc] text-white rounded-xl p-5 flex items-center justify-between gap-4 shadow-sm relative overflow-hidden">
              <div className="space-y-2 z-10">
                <h3 className="text-lg sm:text-xl font-black leading-snug">
                  Share Your Referral Link <br /> and Earn More
                </h3>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-xs rounded-full text-xs font-bold">
                  <span>New Vendor Referral Commission</span>
                  <span className="text-amber-300 font-extrabold">₹500</span>
                </div>
                <div>
                  <button
                    onClick={handleCopyLink}
                    className="mt-2 px-4 py-2 bg-[#f59e0b] hover:bg-[#d97706] text-slate-950 font-black text-xs rounded-md shadow-xs transition"
                  >
                    Get Your Link →
                  </button>
                </div>
              </div>

              {/* Photo of smiling man pointing */}
              <div className="w-36 h-36 flex-shrink-0 hidden sm:block">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80"
                  alt="Referral partner"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </div>

            {/* Your Referral Link Card */}
            <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Share2 className="w-4 h-4 text-blue-600" />
                  <span>Your Referral Link</span>
                </div>

                {/* Referral Link Input */}
                <div className="flex items-center gap-1 mt-2">
                  <input
                    type="text"
                    readOnly
                    value={referralUrl}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md font-mono text-slate-700 focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="p-2 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600"
                    title="Copy"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="w-full mt-2 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded-md flex items-center justify-center gap-1.5 transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copied ? 'Link Copied!' : 'Share Link'}</span>
                </button>
              </div>

              {/* Bottom Referral Counters */}
              <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-slate-100 mt-3 text-xs">
                <div>
                  <div className="text-slate-400 text-[10px]">Referred</div>
                  <div className="font-black text-slate-900 text-sm">5</div>
                </div>
                <div>
                  <div className="text-emerald-600 text-[10px]">Approved</div>
                  <div className="font-black text-slate-900 text-sm">3</div>
                </div>
                <div>
                  <div className="text-amber-500 text-[10px]">Pending</div>
                  <div className="font-black text-slate-900 text-sm">2</div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Recent Orders Table (Your Products) & Sales Overview Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Recent Orders Table */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Recent Orders (Your Products)</h3>
                <Link to="/vendor/orders" className="text-[11px] font-bold text-blue-600 hover:underline">
                  View All →
                </Link>
              </div>
              <div className="overflow-x-auto text-[11px]">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="py-2 px-3">Order ID</th>
                      <th className="py-2 px-3">Product</th>
                      <th className="py-2 px-3">Customer</th>
                      <th className="py-2 px-3">Amount</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">#ORD4587</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">Sports Shoes</td>
                      <td className="py-2.5 px-3 text-slate-600">Ramesh Kumar</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">₹ 1,499</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Delivered
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">10 Oct 2025</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">#ORD4586</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">Smart Phone</td>
                      <td className="py-2.5 px-3 text-slate-600">Priya Sree</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">₹ 12,999</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          Shipped
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">09 Oct 2025</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">#ORD4585</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">T-Shirt</td>
                      <td className="py-2.5 px-3 text-slate-600">Suresh Babu</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">₹ 699</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          Processing
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">08 Oct 2025</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">#ORD4584</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">Handbag</td>
                      <td className="py-2.5 px-3 text-slate-600">Anitha Reddy</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">₹ 1,999</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Delivered
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">07 Oct 2025</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sales Overview Bar Chart */}
            <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Sales Overview</h3>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span> Total Sales
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Your Commission
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-1 bg-slate-50 rounded border border-slate-200 text-slate-600">
                  Last 7 Days
                </span>
              </div>

              {/* Bar Chart Visualization matching screenshot */}
              <div className="h-40 w-full flex items-end justify-between gap-2 pt-4 px-2">
                {[
                  { day: '03 Oct', salesH: '40%', commH: '20%' },
                  { day: '04 Oct', salesH: '55%', commH: '28%' },
                  { day: '05 Oct', salesH: '70%', commH: '35%' },
                  { day: '06 Oct', salesH: '65%', commH: '32%' },
                  { day: '07 Oct', salesH: '85%', commH: '42%' },
                  { day: '08 Oct', salesH: '75%', commH: '38%' },
                  { day: '09 Oct', salesH: '95%', commH: '48%' },
                ].map((bar, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div className="w-full flex items-end justify-center gap-1 h-28">
                      <div
                        style={{ height: bar.salesH }}
                        className="w-3 bg-blue-600 rounded-t-xs"
                      ></div>
                      <div
                        style={{ height: bar.commH }}
                        className="w-3 bg-emerald-500 rounded-t-xs"
                      ></div>
                    </div>
                    <span className="text-[9px] text-slate-400">{bar.day}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </VendorLayout>
  );
};

export default VendorDashboard;
