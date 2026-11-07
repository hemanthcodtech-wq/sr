import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  ExternalLink,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  MapPin,
  Mail,
  Phone,
  BarChart3,
  RefreshCw,
  FileSpreadsheet,
  Edit2,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminProductAnalytics = () => {
  const { id } = useParams();
  const { error } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, [id]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${id}/analytics`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch product analytics:', err);
      error(err.response?.data?.message || 'Failed to load product analytics');
    } finally {
      setLoading(false);
    }
  };

  const product = data?.product;
  const analytics = data?.analytics;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/admin/products"
              className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition shadow-2xs"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <Link to="/admin/products" className="hover:text-blue-600 transition">
                  DeoDap Products
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-800 font-bold">Sales &amp; Orders Analytics</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {loading ? 'Loading Product Analytics...' : product?.title || 'Product Report'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <Link
              to={`/admin/products/edit/${id}`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition shadow-2xs"
            >
              <Edit2 className="w-4 h-4 text-slate-500" />
              <span>Edit Product</span>
            </Link>
            <Link
              to={`/product/${id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0c2a5e] text-white font-bold text-xs hover:bg-[#091f44] transition shadow-2xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Storefront View</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 animate-pulse space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 mx-auto" />
            <div className="h-4 bg-slate-100 rounded w-48 mx-auto" />
            <div className="h-3 bg-slate-100 rounded w-64 mx-auto" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Product Overview Card with Image & Margin Calculations */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                  <img
                    src={product?.images?.[0] || '/logo.png'}
                    alt={product?.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = product?.images?.[1] || '/logo.png';
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                      SKU: {product?.sku || 'N/A'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {product?.category || 'DeoDap'}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    {product?.title}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Source: <span className="font-bold text-slate-700">DeoDap Dropship</span> • Available Stock:{' '}
                    <span className="font-bold text-slate-900 font-mono">{product?.stock ?? 0} units</span>
                  </p>
                </div>
              </div>

              {/* Price & Margin Breakdown Pill */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-6 self-stretch md:self-auto justify-around font-mono">
                <div className="text-center">
                  <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider block">CSV Cost</span>
                  <span className="text-sm sm:text-base font-black text-slate-700">
                    {Number(product?.costPrice || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-center">
                  <span className="text-[10px] font-sans font-bold text-emerald-600 uppercase tracking-wider block">Selling Price</span>
                  <span className="text-sm sm:text-base font-black text-emerald-700">
                    {Number(product?.sellingPrice || product?.price || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-center">
                  <span className="text-[10px] font-sans font-bold text-blue-600 uppercase tracking-wider block">Net Margin</span>
                  <span className="text-sm sm:text-base font-black text-blue-700">
                    +{Number(product?.profitMargin || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Performance KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Orders</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {analytics?.totalOrders || 0}
                </div>
                <span className="text-[10px] text-slate-400">Customer transactions</span>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Units Sold</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  {analytics?.totalUnitsSold || 0}
                </div>
                <span className="text-[10px] text-slate-400">Total items shipped</span>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-emerald-200 bg-emerald-50/20 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-emerald-700">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Sales</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-700 font-mono">
                  {Number(analytics?.totalRevenue || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">Gross customer revenue</span>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-blue-200 bg-blue-50/20 shadow-2xs space-y-1">
                <div className="flex items-center justify-between text-blue-700">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Profit Earned</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-blue-700 font-mono">
                  +{Number(analytics?.totalProfit || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-blue-600 font-medium">Net profit credited</span>
              </div>
            </div>

            {/* Complete Orders History Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Orders &amp; Buyer Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Complete log of all customer purchases, who ordered, quantity, and sales margin
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-100 text-slate-700 rounded-xl self-start sm:self-auto">
                  {analytics?.recentOrders?.length || 0} order records
                </span>
              </div>

              {analytics?.recentOrders?.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">No Orders Placed Yet</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-0.5">
                      When customers purchase this product through the storefront, detailed buyer data, delivery status, and profit breakdown will appear here.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="py-3.5 px-4">Invoice / Date</th>
                        <th className="py-3.5 px-4">Customer Details</th>
                        <th className="py-3.5 px-4">Location</th>
                        <th className="py-3.5 px-4 text-center">Qty</th>
                        <th className="py-3.5 px-4 text-right">Unit Price</th>
                        <th className="py-3.5 px-4 text-right">Total Sale</th>
                        <th className="py-3.5 px-4 text-right">Profit</th>
                        <th className="py-3.5 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {analytics.recentOrders.map((ord, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-slate-900 block">{ord.invoiceNumber}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(ord.orderDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-800 block">{ord.customer.name}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {ord.customer.email}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-slate-700 font-medium block">
                              {ord.customer.city}, {ord.customer.state}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {ord.customer.phone}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                            {ord.quantity}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                            {Number(ord.unitSellingPrice || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-700">
                            {Number(ord.itemRevenue || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-blue-700">
                            +{Number(ord.itemProfit || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              {ord.deliveryStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProductAnalytics;

