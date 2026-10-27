import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  X,
  Check,
  TrendingUp,
  Tag,
  DollarSign,
  Globe,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Sliders,
  Percent,
  Truck,
  ShieldCheck,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminProducts = () => {
  const { success, error, info } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [guideOpen, setGuideOpen] = useState(false);

  // DeoDap Auto-Sync & Multi-Category State
  const [syncing, setSyncing] = useState(false);
  const [syncLimit, setSyncLimit] = useState(60);
  const [profitMarginPercent, setProfitMarginPercent] = useState(30);
  const [syncCategory, setSyncCategory] = useState('all');
  const [savingMargin, setSavingMargin] = useState(false);
  const [deodapStats, setDeodapStats] = useState(null);

  // Quick Margin Edit Modal for individual product
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editSourcePrice, setEditSourcePrice] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    fetchProductsAndStats();
  }, []);

  const fetchProductsAndStats = async () => {
    try {
      setLoading(true);
      const [prodRes, statsRes] = await Promise.all([
        api.get('/products?limit=250').catch(() => null),
        api.get('/deodap/stats').catch(() => null),
      ]);

      if (prodRes?.data?.products) {
        setProducts(prodRes.data.products);
      }
      if (statsRes?.data?.stats) {
        setDeodapStats(statsRes.data.stats);
        if (statsRes.data.stats.profitMarginPercent) {
          setProfitMarginPercent(statsRes.data.stats.profitMarginPercent);
        }
      }
    } catch (err) {
      console.error(err);
      error('Failed to load catalog');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Auto-Fetch across All Categories from DeoDap
  const handleAutoFetchDeoDap = async () => {
    try {
      setSyncing(true);
      const categoryLabel = syncCategory === 'all' ? 'All Diverse Categories (Electronics, Kitchen, Toys, Beauty, Fitness, Fashion, Auto)' : syncCategory;
      info(`Fetching ~${syncLimit} products for ${categoryLabel} from DeoDap with +${profitMarginPercent}% profit margin...`);
      
      const res = await api.post('/deodap/sync', {
        limit: Number(syncLimit),
        profitMarginPercent: Number(profitMarginPercent),
        category: syncCategory,
      });

      if (res.data?.success) {
        success(res.data.message || `Successfully synchronized ${res.data.data?.totalFetched} DeoDap products!`);
        await fetchProductsAndStats();
      }
    } catch (err) {
      console.error(err);
      error(err.response?.data?.message || 'Failed to auto-fetch products from DeoDap');
    } finally {
      setSyncing(false);
    }
  };

  // Global Profit Margin update
  const handleApplyGlobalMargin = async (newMargin) => {
    const marginToApply = newMargin !== undefined ? newMargin : profitMarginPercent;
    try {
      setSavingMargin(true);
      const res = await api.put('/deodap/profit-margin', {
        profitMarginPercent: Number(marginToApply),
      });
      if (res.data?.success) {
        success(`Applied +${marginToApply}% profit margin across all DeoDap products!`);
        setProfitMarginPercent(marginToApply);
        await fetchProductsAndStats();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update profit margin');
    } finally {
      setSavingMargin(false);
    }
  };

  // Open Quick Edit for individual product
  const handleOpenEditModal = (prod) => {
    setSelectedProduct(prod);
    setEditSourcePrice(prod.sourcePrice || 0);
    setEditPrice(prod.price || 0);
    setEditModalOpen(true);
  };

  const handleSaveIndividualProduct = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      setSavingProduct(true);
      const sPrice = Number(editSourcePrice) || 0;
      const cPrice = Number(editPrice) || 0;
      const margin = Math.max(0, cPrice - sPrice);

      const res = await api.put(`/products/${selectedProduct._id}`, {
        price: cPrice,
        sourcePrice: sPrice,
        profitMargin: margin,
        discountPrice: Math.round(cPrice * 1.35),
      });

      if (res.data?.success) {
        success(`Updated price & margin for "${selectedProduct.title}"`);
        setEditModalOpen(false);
        fetchProductsAndStats();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update product');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove "${name}" from catalog?`)) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      success(`"${name}" removed from catalog`);
    } catch (err) {
      error('Failed to remove product');
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      (product.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStock =
      selectedFilter === 'all' ||
      (selectedFilter === 'in_stock' && product.stock > 0) ||
      (selectedFilter === 'out_of_stock' && product.stock === 0);

    const matchesCategory =
      selectedCategory === 'all' ||
      (product.category || '').toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesStock && matchesCategory;
  });

  const deodapProducts = products.filter((p) => p.sourcePlatform === 'deodap');
  const inStockCount = deodapProducts.filter((p) => p.stock > 0).length;
  const totalWholesaleCost = deodapProducts.reduce((sum, p) => sum + (p.sourcePrice || 0), 0);
  const totalMarginPotential = deodapProducts.reduce((sum, p) => sum + (p.profitMargin || 0), 0);
  const avgMargin = deodapProducts.length > 0 ? Math.round(totalMarginPotential / deodapProducts.length) : 0;

  // Category counts and styles
  const categoryCounts = {};
  products.forEach((p) => {
    const cat = p.category || 'General';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoryColors = {
    'Electronics': 'bg-indigo-100 text-indigo-900 border-indigo-200',
    'Home & Kitchen': 'bg-amber-100 text-amber-900 border-amber-200',
    'Toys': 'bg-purple-100 text-purple-900 border-purple-200',
    'Beauty': 'bg-rose-100 text-rose-900 border-rose-200',
    'Fitness': 'bg-emerald-100 text-emerald-900 border-emerald-200',
    'Fashion': 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200',
    'Automotive': 'bg-slate-100 text-slate-800 border-slate-300',
    'General': 'bg-blue-100 text-blue-900 border-blue-200',
  };

  const majorCategories = ['all', 'Electronics', 'Home & Kitchen', 'Toys', 'Beauty', 'Fitness', 'Fashion', 'Automotive'];

  return (
    <AdminLayout
      title="DeoDap Dropship Catalog & Multi-Category Sourcing Center"
      subtitle="Automatically fetch wholesale products across all categories from DeoDap, configure profit margins, and fulfill orders with Delhivery"
      onRefresh={fetchProductsAndStats}
    >
      <div className="space-y-6 animate-fadeIn pb-12 font-sans">
        {/* HERO BANNER: DeoDap Live Dropshipping Connection */}
        <div className="bg-gradient-to-r from-[#071d42] via-[#0c2a5e] to-[#153e85] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300 shadow-inner flex-shrink-0">
                <Globe className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">Multi-Category DeoDap Dropshipping Engine</h2>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Live Connected (deodap.in)
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl leading-relaxed">
                  Fetches <strong>all types of products</strong>: Electronics, Kitchen Appliances, Toys, Beauty Care, Fitness Gear, Home Decor, Fashion &amp; Hardware Tools with your automated profit margin. Orders are <strong>automatically delivered by DeoDap</strong> via Delhivery!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={fetchProductsAndStats}
                disabled={loading}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/90 hover:text-white border border-white/15 backdrop-blur-md transition cursor-pointer"
                title="Refresh Catalog"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-300' : ''}`} />
              </button>

              <button
                onClick={handleAutoFetchDeoDap}
                disabled={syncing}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-400/25 active:scale-98 transition cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 stroke-[3] ${syncing ? 'animate-bounce text-slate-900' : ''}`} />
                <span>{syncing ? 'Fetching from DeoDap...' : '⚡ Auto-Fetch Products from DeoDap'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* NOTICE: Multi-Category Active */}
        <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 text-emerald-950">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-black">Multi-Category Dropship Active:</span>
              <span className="text-emerald-800 ml-1">
                Products are fetched across all product categories. Sourced wholesale price + profit margin = Customer retail price. When customer buys, DeoDap handles packaging and courier delivery.
              </span>
            </div>
          </div>
          <span className="hidden sm:inline-flex text-[11px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg">
            7 Major Categories Synced
          </span>
        </div>

        {/* PROFIT MARGIN & AUTO-SYNC CONTROL PANEL */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-2xs space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <Percent className="w-4 h-4 text-emerald-600" />
                <span>Multi-Category Auto-Fetch &amp; Profit Engine</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose sourcing category, batch size, and profit margin. Customer selling price = Wholesale cost + Profit margin.
              </p>
            </div>

            {/* Quick Profit Margin Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500">Margin Presets:</span>
              {[20, 25, 30, 40, 50].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => {
                    setProfitMarginPercent(pct);
                    handleApplyGlobalMargin(pct);
                  }}
                  disabled={savingMargin}
                  className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer ${
                    profitMarginPercent === pct
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  +{pct}%
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Sourcing Selector */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Sourcing Category Target</label>
              <select
                value={syncCategory}
                onChange={(e) => setSyncCategory(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">🌐 All Categories (Diverse Mix)</option>
                <option value="Electronics">📱 Electronics &amp; Gadgets</option>
                <option value="Home & Kitchen">🍳 Kitchen &amp; Home Living</option>
                <option value="Toys">🧸 Toys &amp; Kids Games</option>
                <option value="Beauty">💄 Beauty &amp; Personal Care</option>
                <option value="Fitness">🏋️ Fitness &amp; Sports Gear</option>
                <option value="Fashion">👜 Fashion, Bags &amp; Jewellery</option>
                <option value="Automotive">🔧 Automotive &amp; Hardware Tools</option>
              </select>
              <span className="text-[10px] text-slate-400 block">
                {syncCategory === 'all'
                  ? 'Fetches balanced items from every category'
                  : `Focuses on ${syncCategory} wholesale items`}
              </span>
            </div>

            {/* Custom Profit Margin Input */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Profit Margin Markup (%)</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={profitMarginPercent}
                    onChange={(e) => setProfitMarginPercent(Number(e.target.value) || 0)}
                    className="w-full pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                </div>
                <button
                  onClick={() => handleApplyGlobalMargin()}
                  disabled={savingMargin}
                  className="px-4 py-2 bg-[#0c2a5e] hover:bg-[#153e85] text-white rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 whitespace-nowrap"
                >
                  {savingMargin ? 'Updating...' : 'Apply'}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 block">
                Profit margin added on top of DeoDap wholesale price
              </span>
            </div>

            {/* Fetch Batch Quantity */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">Auto-Fetch Batch Size</label>
              <div className="grid grid-cols-3 gap-2">
                {[35, 60, 100].map((qty) => (
                  <button
                    key={qty}
                    type="button"
                    onClick={() => setSyncLimit(qty)}
                    className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      syncLimit === qty
                        ? 'bg-white border-[#0c2a5e] text-[#0c2a5e] shadow-2xs font-black'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                    }`}
                  >
                    {qty} Items
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 block">
                Total products fetched and synced
              </span>
            </div>
          </div>

          {/* Current Category Distribution in Catalog */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
            <span className="font-bold text-slate-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Catalog Diversity:</span>
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {Object.entries(categoryCounts).map(([cat, count]) => (
                <span
                  key={cat}
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${categoryColors[cat] || 'bg-slate-100 text-slate-700'}`}
                >
                  {cat}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 4 KPI METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL CATALOG</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{deodapProducts.length}</div>
              <span className="text-[11px] text-slate-400 block">Across 7 Categories</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0c2a5e] flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">IN STOCK READY</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">{inStockCount}</div>
              <span className="text-[11px] text-emerald-700 font-semibold block">Available for order</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SOURCED WHOLESALE POOL</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-700 font-mono">
                ₹{totalWholesaleCost.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-slate-400 block">DeoDap cost price</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PROFIT COMMISSION POOL</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
                ₹{totalMarginPotential.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold block">Avg +₹{avgMargin}/item profit</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* WORKFLOW ACCORDION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setGuideOpen(!guideOpen)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>How Does Multi-Product Dropshipping &amp; Delivery Work?</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    4-Step Automation
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {guideOpen ? 'Click to minimize guide' : 'Click to see how automatic product sync, customer buying, DeoDap delivery, and profit commissions work'}
                </p>
              </div>
            </div>
            <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
              {guideOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {guideOpen && (
            <div className="p-5 border-t border-slate-100 bg-gradient-to-b from-slate-50/60 to-white grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#0c2a5e] text-white font-mono font-bold text-xs flex items-center justify-center">1</span>
                  <span className="font-bold text-slate-800 text-xs">All Products Auto-Fetched</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Products across Electronics, Kitchen, Toys, Beauty, Fitness, Fashion &amp; Hardware are fetched automatically from <strong>DeoDap</strong> with automated profit margins.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">2</span>
                  <span className="font-bold text-slate-800 text-xs">Customer Orders</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Customer shops on your store and pays via Razorpay or Cash on Delivery. Order and shipping details are confirmed immediately.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-mono font-bold text-xs flex items-center justify-center">3</span>
                  <span className="font-bold text-slate-800 text-xs">Delivery by DeoDap</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  The order is <strong>automatically dispatched to DeoDap</strong>. DeoDap's logistics warehouse packs and delivers the parcel straight to the customer via Delhivery courier.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono font-bold text-xs flex items-center justify-center">4</span>
                  <span className="font-bold text-slate-800 text-xs">Commission Secured</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  You keep the full difference between customer price and DeoDap cost as your <strong>guaranteed profit commission</strong>!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* SEARCH & CATEGORY FILTER PILLS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search products by title or DeoDap SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
              <span className="text-slate-400 font-bold mr-1">Filter:</span>
              {majorCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap capitalize ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-[#0c2a5e] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? `All (${products.length})` : `${cat} (${categoryCounts[cat] || 0})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PRODUCTS CATALOG TABLE */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Product Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">DeoDap SKU</th>
                  <th className="py-3.5 px-4">DeoDap Cost</th>
                  <th className="py-3.5 px-4">Profit Margin</th>
                  <th className="py-3.5 px-4">Customer Selling Price</th>
                  <th className="py-3.5 px-4">Stock Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-600">No products found in this category</p>
                      <p className="text-xs text-slate-400">
                        Click "⚡ Auto-Fetch Products from DeoDap" above to synchronize products across all categories.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const sPrice = p.sourcePrice || 0;
                    const margin = p.profitMargin || (sPrice > 0 ? Math.max(0, p.price - sPrice) : 0);
                    const marginPct = sPrice > 0 ? Math.round((margin / sPrice) * 100) : 0;
                    const img = p.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80';
                    const catName = p.category || 'General';

                    return (
                      <tr key={p._id} className="hover:bg-slate-50/80 transition">
                        {/* Title & Image */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                              <img src={img} alt={p.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="max-w-[260px]">
                              <div className="font-bold text-slate-900 line-clamp-1" title={p.title}>
                                {p.title}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {p.sourceUrl && (
                                  <a
                                    href={p.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] text-emerald-700 hover:underline inline-flex items-center gap-0.5 font-bold"
                                  >
                                    <span>View on DeoDap.in</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${categoryColors[catName] || 'bg-slate-100 text-slate-800'}`}>
                            {catName}
                          </span>
                        </td>

                        {/* DeoDap SKU */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 max-w-[130px] truncate" title={p.sku}>
                          {p.sku || `DEO-${p._id.toString().slice(-6)}`}
                        </td>

                        {/* Wholesale Cost */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          ₹{sPrice.toLocaleString('en-IN')}
                        </td>

                        {/* Profit Margin */}
                        <td className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold font-mono">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                            <span>+₹{margin.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-emerald-600 font-normal">({marginPct}%)</span>
                          </div>
                        </td>

                        {/* Customer Price */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-black text-slate-900 text-sm">
                            ₹{p.price?.toLocaleString('en-IN')}
                          </div>
                          {p.discountPrice > p.price && (
                            <div className="text-[10px] text-slate-400 line-through font-mono">
                              ₹{p.discountPrice.toLocaleString('en-IN')} MRP
                            </div>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              p.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {p.stock > 0 ? `${p.stock} units` : 'Out of Stock'}
                          </span>
                        </td>

                        {/* Actions: Quick Margin Edit & Delete */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                              title="Tweak Price / Margin"
                            >
                              <Edit2 className="w-3 h-3 text-slate-400" />
                              <span>Margin</span>
                            </button>
                            <button
                              onClick={() => handleDelete(p._id, p.title)}
                              className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                              title="Remove Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* QUICK MARGIN / PRICE ADJUST MODAL */}
      {editModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Adjust Selling Price &amp; Margin</h4>
                  <p className="text-[11px] text-slate-400 truncate max-w-[240px]">{selectedProduct.title}</p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIndividualProduct} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">DeoDap Wholesale Sourced Cost (₹)</label>
                <input
                  type="number"
                  min={1}
                  value={editSourcePrice}
                  onChange={(e) => setEditSourcePrice(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">Customer Retail Selling Price (₹)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full p-2.5 bg-white border border-emerald-500 rounded-xl font-mono font-black text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Calculated profit */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="font-bold text-emerald-900">Calculated Profit Margin:</span>
                <span className="font-mono font-black text-emerald-700 text-sm">
                  +₹{Math.max(0, (Number(editPrice) || 0) - (Number(editSourcePrice) || 0)).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 py-2 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {savingProduct ? 'Saving...' : 'Save Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProducts;
