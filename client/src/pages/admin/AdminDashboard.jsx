import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Download,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Zap,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Building,
  Store,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminDashboard = () => {
  const { showToast, success, error } = useToast();

  // Live state from backend
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    commissions: 0,
    netRevenue: 0,
    grossSales: 0,
    planRevenue: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Controls
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [chartMode, setChartMode] = useState('daily'); // 'daily' | 'monthly'
  const [activeHoverPoint, setActiveHoverPoint] = useState(null);

  // Pagination for orders table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async (from = dateFrom, to = dateTo) => {
    try {
      setLoading(true);
      const params = {};
      if (from) params.dateFrom = from;
      if (to) params.dateTo = to;

      const res = await api.get('/admin/dashboard-stats', { params });
      if (res.data?.success) {
        if (res.data.stats) {
          setStats(res.data.stats);
        }
        setRecentOrders(res.data.recentOrders || []);
        setInventoryAlerts(res.data.inventoryAlerts || []);
        setChartData(res.data.chartData || []);
      }
    } catch (err) {
      console.error('Error loading live dashboard metrics:', err);
      error('Failed to synchronize live dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDateFilter = (e) => {
    e.preventDefault();
    fetchDashboardData(dateFrom, dateTo);
    showToast('Applied date range filter', 'info');
  };

  const handleResetFilter = () => {
    setDateFrom('');
    setDateTo('');
    fetchDashboardData('', '');
    showToast('Reset to all-time live metrics', 'info');
  };

  const handleRefresh = async () => {
    await fetchDashboardData(dateFrom, dateTo);
    success('Dashboard analytics synchronized with live database');
  };

  // Export orders to CSV
  const handleExportCSV = () => {
    if (!recentOrders || recentOrders.length === 0) {
      showToast('No orders available to export', 'info');
      return;
    }

    const headers = ['Order ID', 'Customer Name', 'Email', 'Amount (INR)', 'Payment Status', 'Fulfillment', 'Date'];
    const rows = recentOrders.map((o) => [
      `"${o.id}"`,
      `"${o.customer}"`,
      `"${o.email}"`,
      o.amount,
      `"${o.payment}"`,
      `"${o.status}"`,
      `"${o.date}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Amazon_Orders_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('Live order data exported to Excel/CSV successfully');
  };

  // Dynamic Chart Calculations
  const chartMetrics = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        points: [],
        maxVal: 10000,
        indigoPath: '',
        areaPath: '',
        cyanPath: '',
        rosePath: '',
      };
    }

    // Determine max value for Y-axis scaling
    const maxVal = Math.max(
      ...chartData.map((d) => Math.max(d.totalRevenue || 0, d.netRevenue || 0, d.commission || 0)),
      1000
    );
    // Round up to clean ceiling
    const roundedMax = Math.ceil(maxVal / 1000) * 1000;

    const width = 500;
    const height = 200;
    const leftPad = 45;
    const rightPad = 480;
    const bottomY = 175;
    const topY = 30;
    const plotHeight = bottomY - topY;

    const step = (rightPad - leftPad) / Math.max(chartData.length - 1, 1);

    const points = chartData.map((d, i) => {
      const x = leftPad + i * step;
      const yRev = bottomY - ((d.totalRevenue || 0) / roundedMax) * plotHeight;
      const yNet = bottomY - ((d.netRevenue || 0) / roundedMax) * plotHeight;
      const yCom = bottomY - ((d.commission || 0) / roundedMax) * plotHeight;
      return { ...d, x, yRev, yNet, yCom };
    });

    // Build SVG paths using smooth curves
    const buildPath = (key) => {
      if (points.length === 0) return '';
      if (points.length === 1) return `M ${points[0].x} ${points[0][key]} L 480 ${points[0][key]}`;

      return points.reduce((acc, pt, i) => {
        if (i === 0) return `M ${pt.x} ${pt[key]}`;
        const prev = points[i - 1];
        const cx1 = prev.x + (pt.x - prev.x) / 2;
        const cy1 = prev[key];
        const cx2 = prev.x + (pt.x - prev.x) / 2;
        const cy2 = pt[key];
        return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt[key]}`;
      }, '');
    };

    const indigoPath = buildPath('yRev');
    const cyanPath = buildPath('yNet');
    const rosePath = buildPath('yCom');
    const areaPath = points.length > 0 ? `${indigoPath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z` : '';
    const hasAnySales = chartData.some((d) => (d.totalRevenue || 0) > 0);

    return { points, maxVal: roundedMax, indigoPath, areaPath, cyanPath, rosePath, hasAnySales };
  }, [chartData]);

  // Paginated Orders
  const totalPages = Math.ceil(recentOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return recentOrders.slice(start, start + itemsPerPage);
  }, [recentOrders, currentPage]);

  return (
    <AdminLayout
      title="Dashboard Overview"
      subtitle="Real-time business performance, live revenue, and fulfillment analytics"
      onRefresh={handleRefresh}
    >
      <div className="space-y-6 sm:space-y-8 select-none font-sans relative">
        {/* Top Header & Dynamic Date Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-gradient-to-br from-[#0c2a5e] to-indigo-700 text-amber-300 shadow-sm">
                <TrendingUp className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Executive Dashboard Overview</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Live database sync • Real-time commerce metrics and multi-vendor orders
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Date Range Filter Form */}
            <form onSubmit={handleApplyDateFilter} className="flex flex-wrap items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200/90 shadow-2xs text-xs text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer text-xs font-semibold"
                title="From Date"
              />
              <span className="text-slate-400 font-bold">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="bg-transparent focus:outline-none cursor-pointer text-xs font-semibold"
                title="To Date"
              />
              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="text-[10px] font-bold text-rose-600 hover:underline ml-1"
                >
                  Clear
                </button>
              )}
            </form>

            {/* Live Indicator Pill */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>LIVE DATA</span>
            </span>

            {/* Manual Sync Button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0c2a5e] via-indigo-900 to-indigo-700 hover:from-indigo-950 hover:to-indigo-800 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-98 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-300' : 'text-amber-400'}`} />
              <span>{loading ? 'Syncing...' : 'Sync Live'}</span>
            </button>
          </div>
        </div>

        {/* Six Main Live KPI Cards (Responsive: 2-col on mobile, 3-col on tablet, 6-col on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Card 1: Total Revenue */}
          <div className="bg-white/85 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_4px_20px_rgba(12,42,94,0.04)] hover:shadow-[0_12px_30px_rgba(12,42,94,0.08)] hover:-translate-y-0.5 transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-black text-base shadow-2xs">
              ₹
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block font-sans">
                TOTAL REVENUE
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
                ₹{Number(stats.totalRevenue || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Sales + Plans</span>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="bg-white/85 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_4px_20px_rgba(12,42,94,0.04)] hover:shadow-[0_12px_30px_rgba(12,42,94,0.08)] hover:-translate-y-0.5 transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shadow-2xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block font-sans">
                TOTAL ORDERS
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
                {stats.totalOrders || 0}
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Live Fulfillment</span>
            </div>
          </div>

          {/* Card 3: Customers */}
          <div className="bg-white/85 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_4px_20px_rgba(12,42,94,0.04)] hover:shadow-[0_12px_30px_rgba(12,42,94,0.08)] hover:-translate-y-0.5 transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center shadow-2xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block font-sans">
                CUSTOMERS
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
                {stats.totalCustomers || 0}
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Verified Accounts</span>
            </div>
          </div>

          {/* Card 4: Live Products */}
          <div className="bg-white/85 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_4px_20px_rgba(12,42,94,0.04)] hover:shadow-[0_12px_30px_rgba(12,42,94,0.08)] hover:-translate-y-0.5 transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shadow-2xs">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block font-sans">
                LIVE PRODUCTS
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
                {stats.totalProducts || 0}
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Active Catalog</span>
            </div>
          </div>

          {/* Card 5: Number of Stores */}
          <div className="bg-white/85 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_4px_20px_rgba(12,42,94,0.04)] hover:shadow-[0_12px_30px_rgba(12,42,94,0.08)] hover:-translate-y-0.5 transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center shadow-2xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block font-sans">
                NO. OF STORES
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
                {stats.totalStores || stats.totalVendors || 1}
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Active Storefronts</span>
            </div>
          </div>

          {/* Card 6: Verified Vendors */}
          <div className="bg-white/85 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-[0_4px_20px_rgba(12,42,94,0.04)] hover:shadow-[0_12px_30px_rgba(12,42,94,0.08)] hover:-translate-y-0.5 transition-all space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100 flex items-center justify-center shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block font-sans">
                MERCHANTS
              </span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 tracking-tight">
                {stats.totalVendors || 1}
              </div>
              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">Verified Vendors</span>
            </div>
          </div>
        </div>

        {/* Middle Section: Live Dynamic Sales Chart (8 cols) + Real Inventory Alerts (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Dynamic Sales Trend Curve */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white/85 backdrop-blur-xl p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(12,42,94,0.04)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Sales &amp; Orders Trend</span>
                  <span className="text-[11px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md">Live Sync</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Dynamic store revenue and order fulfillment timeline across marketplace
                </p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl text-xs font-bold self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setChartMode('daily')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    chartMode === 'daily' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Daily Timeline
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('monthly')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    chartMode === 'monthly' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Monthly Group
                </button>
              </div>
            </div>

            {/* Dynamic Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold pt-1">
              <span className="flex items-center gap-1.5 text-indigo-700">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4338ca]"></span> Total Sales (₹)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Active Store Orders
              </span>
            </div>

            {/* Live Dynamic SVG Chart */}
            <div className="h-60 w-full pt-2 relative">
              {!chartMetrics.hasAnySales && (
                <div className="absolute inset-x-0 top-1/3 flex flex-col items-center justify-center text-slate-400 pointer-events-none z-10 space-y-1">
                  <span className="text-xs font-bold text-slate-500">No Sales in Selected Timeline</span>
                  <span className="text-[11px] text-slate-400">Live marketplace order transactions will dynamically plot on this baseline</span>
                </div>
              )}
              <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="liveIndigoArea" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4338ca" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#4338ca" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                <line x1="40" y1="30" x2="480" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="78" x2="480" y2="78" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="126" x2="480" y2="126" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="40" y1="175" x2="480" y2="175" stroke="#e2e8f0" strokeWidth="1" />

                {/* Dynamic Y Axis Values */}
                <text x="5" y="34" fill="#94a3b8" fontSize="9.5" fontWeight="600">
                  ₹{Math.round(chartMetrics.maxVal).toLocaleString('en-IN')}
                </text>
                <text x="5" y="82" fill="#94a3b8" fontSize="9.5" fontWeight="600">
                  ₹{Math.round(chartMetrics.maxVal * 0.66).toLocaleString('en-IN')}
                </text>
                <text x="5" y="130" fill="#94a3b8" fontSize="9.5" fontWeight="600">
                  ₹{Math.round(chartMetrics.maxVal * 0.33).toLocaleString('en-IN')}
                </text>
                <text x="25" y="179" fill="#94a3b8" fontSize="9.5" fontWeight="600">
                  ₹0
                </text>

                {/* Dynamic Area & Lines */}
                {chartMetrics.areaPath && (
                  <path d={chartMetrics.areaPath} fill="url(#liveIndigoArea)" />
                )}

                {chartMetrics.indigoPath && (
                  <path
                    d={chartMetrics.indigoPath}
                    fill="none"
                    stroke="#4338ca"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                )}

                {chartMetrics.cyanPath && (
                  <path
                    d={chartMetrics.cyanPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                )}

                {/* Interactive Data Nodes */}
                {chartMetrics.points.map((pt, idx) => (
                  <g
                    key={idx}
                    className="cursor-pointer group"
                    onMouseEnter={() => setActiveHoverPoint(pt)}
                    onMouseLeave={() => setActiveHoverPoint(null)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.yRev}
                      r="4.5"
                      className="fill-white stroke-[#4338ca] stroke-2 group-hover:r-6 transition-all"
                    />
                  </g>
                ))}
              </svg>

              {/* Dynamic Bottom Date Labels */}
              <div className="flex justify-between text-[11px] font-semibold text-slate-400 px-6 sm:px-8 pt-1">
                {chartMetrics.points.map((pt, idx) => (
                  <span key={idx} className="truncate">
                    {pt.label || pt.date}
                  </span>
                ))}
              </div>

              {/* Hover Tooltip Popup */}
              {activeHoverPoint && (
                <div
                  className="absolute bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs pointer-events-none z-20"
                  style={{
                    left: `${(activeHoverPoint.x / 500) * 100}%`,
                    top: `${Math.max(10, (activeHoverPoint.yRev / 200) * 100 - 35)}%`,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  <strong className="block text-amber-300 font-extrabold">{activeHoverPoint.label || activeHoverPoint.date}</strong>
                  <div className="text-[11px] space-y-0.5 mt-0.5 font-medium">
                    <div>Sales: ₹{activeHoverPoint.totalRevenue?.toLocaleString('en-IN')}</div>
                    <div>Orders: {activeHoverPoint.ordersCount || 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Real Live Inventory Alerts (4 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white/85 backdrop-blur-xl p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(12,42,94,0.04)] space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Inventory Alerts</span>
                </h3>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                  {inventoryAlerts.length} Critical
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Real-time low stock items requiring merchant restock</p>
            </div>

            {inventoryAlerts.length > 0 ? (
              <div className="space-y-3 pt-1">
                {inventoryAlerts.map((item) => (
                  <div
                    key={item._id}
                    className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/90 flex items-center justify-between gap-3 hover:bg-white transition"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 border border-rose-100">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          ₹{item.price?.toLocaleString('en-IN')} • <span className="text-indigo-600 font-semibold">{item.storeName}</span>
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full font-black text-[10px] whitespace-nowrap flex-shrink-0 ${
                        (item.stock || 0) <= 2
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.stock} left
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">All Inventory Healthy</p>
                <p className="text-[11px] text-slate-400">No products are currently under critical stock limits.</p>
              </div>
            )}

            <Link
              to="/admin/products"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-100/90 hover:bg-slate-200 text-slate-800 text-xs font-bold transition shadow-2xs"
            >
              <span>Manage Product Inventory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Bottom Section: Real Live Customer Orders Table */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl border border-slate-200/90 shadow-[0_4px_20px_rgba(12,42,94,0.04)] overflow-hidden">
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Recent Customer Orders</span>
                <span className="text-xs text-slate-400 font-semibold">({recentOrders.length} recorded)</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">Real-time marketplace transactions and fulfillment tracking</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-98"
                title="Download CSV report of orders"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export to Excel</span>
              </button>

              <Link
                to="/admin/orders"
                className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-[#4338ca] text-xs font-bold flex items-center gap-1 transition shadow-2xs"
              >
                <span>View All Orders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/90 text-slate-500 font-extrabold uppercase tracking-wider text-[10.5px]">
                <tr>
                  <th className="py-3 px-4">ORDER ID</th>
                  <th className="py-3 px-4">CUSTOMER</th>
                  <th className="py-3 px-4">AMOUNT</th>
                  <th className="py-3 px-4">PAYMENT</th>
                  <th className="py-3 px-4">FULFILLMENT</th>
                  <th className="py-3 px-4">DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((ord) => {
                    const initial = (ord.customer || 'C').charAt(0).toUpperCase();

                    return (
                      <tr key={ord._id || ord.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {ord.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[#0c2a5e] text-amber-300 font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                              {initial}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 capitalize">{ord.customer}</div>
                              <div className="text-[11px] text-slate-400 font-medium">{ord.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-black text-slate-900 text-xs sm:text-sm">
                          ₹{Number(ord.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-600">
                          {ord.payment}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold ${
                              ord.status === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : ord.status === 'Shipped'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                ord.status === 'Delivered'
                                  ? 'bg-emerald-500'
                                  : ord.status === 'Shipped'
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500 animate-pulse'
                              }`}
                            />
                            <span>{ord.status}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                          {ord.date}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <span className="font-bold text-slate-700 text-xs">No Customer Orders Yet</span>
                        <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                          Live marketplace transactions will automatically appear here as customers place storefront orders.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Dynamic Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {recentOrders.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, recentOrders.length)} of {recentOrders.length} orders
            </span>

            <div className="flex items-center gap-1 font-bold">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-6 h-6 rounded-md text-xs font-bold transition cursor-pointer ${
                    currentPage === page
                      ? 'bg-[#0c2a5e] text-white shadow-xs'
                      : 'hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md text-slate-400 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
