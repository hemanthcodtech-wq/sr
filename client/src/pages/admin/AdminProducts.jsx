import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  Eye,
  Filter,
  Layers,
  ExternalLink,
  Sparkles,
  X,
  Check,
  TrendingUp,
  Tag,
  DollarSign,
  Globe,
  ShoppingBag,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminProducts = () => {
  const { showToast, success, error } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [guideOpen, setGuideOpen] = useState(false);

  // Sourcing & Product Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    price: '', // Customer Selling Price
    discountPrice: '', // Strikethrough original MRP
    stock: 50,
    images: '',
    sourcePlatform: 'meesho', // 'amazon' | 'flipkart' | 'meesho' | 'deodap' | 'in_house'
    sourceUrl: '',
    sourcePrice: '', // What admin pays to source
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products?limit=100').catch(() => null);
      if (res?.data?.products) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      description: '',
      category: 'Electronics',
      price: '',
      discountPrice: '',
      stock: 50,
      images: '',
      sourcePlatform: 'meesho',
      sourceUrl: '',
      sourcePrice: '',
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      title: prod.title || '',
      description: prod.description || '',
      category: prod.category || 'General',
      price: prod.price || '',
      discountPrice: prod.discountPrice || '',
      stock: prod.stock || 50,
      images: Array.isArray(prod.images) ? prod.images.join(', ') : prod.images || '',
      sourcePlatform: prod.sourcePlatform || 'in_house',
      sourceUrl: prod.sourceUrl || '',
      sourcePrice: prod.sourcePrice || '',
    });
    setDrawerOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      error('Please provide a product title');
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      error('Please enter a valid customer selling price');
      return;
    }

    try {
      setSubmitting(true);
      const imageUrls = formData.images
        ? formData.images.split(',').map((u) => u.trim()).filter(Boolean)
        : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'];

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() || `${formData.title} - Quality product sourced for fast delivery.`,
        category: formData.category,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : 0,
        stock: Number(formData.stock) || 20,
        images: imageUrls,
        sourcePlatform: formData.sourcePlatform,
        sourceUrl: formData.sourceUrl.trim(),
        sourcePrice: Number(formData.sourcePrice) || 0,
      };

      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct._id}`, payload);
        if (res.data?.success) {
          success(`Product "${payload.title}" updated successfully!`);
          setDrawerOpen(false);
          fetchProducts();
        }
      } else {
        const res = await api.post('/products', payload);
        if (res.data?.success) {
          success(`Product "${payload.title}" listed successfully!`);
          setDrawerOpen(false);
          fetchProducts();
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Permanently delete "${name}" from catalog?`)) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      success(`"${name}" deleted from catalog`);
    } catch (err) {
      error('Failed to delete product');
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = (product.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStock =
      selectedFilter === 'all' ||
      (selectedFilter === 'in_stock' && product.stock > 0) ||
      (selectedFilter === 'out_of_stock' && product.stock === 0);
    const matchesPlatform =
      selectedPlatform === 'all' ||
      (product.sourcePlatform || 'in_house').toLowerCase() === selectedPlatform.toLowerCase();

    return matchesSearch && matchesStock && matchesPlatform;
  });

  const inStockCount = products.filter((p) => p.stock > 0).length;
  const dropshipCount = products.filter((p) => ['amazon', 'flipkart', 'meesho', 'deodap'].includes(p.sourcePlatform)).length;
  const totalMarginPotential = products.reduce((sum, p) => sum + (p.profitMargin || (p.sourcePrice ? Math.max(0, p.price - p.sourcePrice) : 0)), 0);

  // Platform badges styling
  const platformColors = {
    amazon: 'bg-amber-100 text-amber-900 border-amber-300',
    flipkart: 'bg-blue-100 text-blue-900 border-blue-300',
    meesho: 'bg-pink-100 text-pink-900 border-pink-300',
    deodap: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    in_house: 'bg-slate-100 text-slate-800 border-slate-200',
    other: 'bg-purple-100 text-purple-900 border-purple-300',
  };

  const calculatedMargin = formData.price && formData.sourcePrice
    ? Math.max(0, Number(formData.price) - Number(formData.sourcePrice))
    : 0;

  return (
    <AdminLayout
      title="Product Catalog & Dropship Sourcing"
      subtitle="Source & list products from Amazon, Flipkart, Meesho & DeoDap with automated profit margins"
      onRefresh={fetchProducts}
    >
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* HERO BANNER: Multi-Channel Dropship Banner */}
        <div className="bg-gradient-to-r from-[#071d42] via-[#0c2a5e] to-[#153e85] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner flex-shrink-0">
                <Globe className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">Multi-Source Catalog Manager</h2>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Amazon • Flipkart • Meesho • DeoDap
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl">
                  List items with your custom selling prices. When customers buy, order directly on the source platform and pocket the commission margin!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={fetchProducts}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/90 hover:text-white border border-white/15 backdrop-blur-md transition cursor-pointer"
                title="Refresh Products"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-300' : ''}`} />
              </button>

              <button
                onClick={handleOpenAdd}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-400/25 active:scale-98 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ List Sourced Product</span>
              </button>
            </div>
          </div>
        </div>

        {/* DROPSHIPPING WORKFLOW EXPLAINER ACCORDION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setGuideOpen(!guideOpen)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>How Does Multi-Platform Dropshipping & Sourcing Work?</span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                    4-Step Process Guide
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {guideOpen ? 'Click to minimize guide' : 'Click to view the end-to-end customer ordering, fulfillment, and commission flow'}
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
                  <span className="font-bold text-slate-800 text-xs">Source & List</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Paste product link from <strong>Meesho, DeoDap, Amazon, or Flipkart</strong>. The system auto-extracts images, title &amp; wholesale cost. Set your selling price to lock in your profit margin.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">2</span>
                  <span className="font-bold text-slate-800 text-xs">Customer Buys</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Customer shops on your marketplace and pays the retail price. Their order and full delivery address appear immediately in your <strong>Orders Hub</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-mono font-bold text-xs flex items-center justify-center">3</span>
                  <span className="font-bold text-slate-800 text-xs">1-Click Fulfill</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Click <strong>"Copy Address"</strong> &amp; <strong>"Open Product"</strong>. Place order on the source platform using customer address. For DeoDap, 1-Click Auto-Dispatch via API!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono font-bold text-xs flex items-center justify-center">4</span>
                  <span className="font-bold text-slate-800 text-xs">Platform Delivers</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  The supplier ships directly to the customer's doorstep. You keep <strong>100% of the price difference (Commission Profit)</strong> on every sale!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 4 KPI METRICS: Total Products, Dropshipped, In Stock, Margin Scope */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL CATALOG</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{products.length}</div>
              <span className="text-[11px] text-slate-400 block">Listed items</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0c2a5e] flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">DROPSHIP SOURCED</span>
              <div className="text-2xl sm:text-3xl font-black text-indigo-700 font-mono">{dropshipCount}</div>
              <span className="text-[11px] text-indigo-600 font-semibold block">Amazon / Meesho / DeoDap</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
              <Globe className="w-5 h-5" />
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
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">UNIT MARGIN POOL</span>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
                ₹{totalMarginPotential.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-amber-700 font-semibold block">Profit margin capability</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* SEARCH, FILTER PILLS & PLATFORM SELECTION */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search catalog by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* Platform Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs">
              <span className="text-slate-400 font-bold mr-1">Platform:</span>
              {[
                { id: 'all', label: 'All Sources' },
                { id: 'meesho', label: 'Meesho' },
                { id: 'deodap', label: 'DeoDap' },
                { id: 'amazon', label: 'Amazon' },
                { id: 'flipkart', label: 'Flipkart' },
                { id: 'in_house', label: 'In-House' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                    selectedPlatform === p.id
                      ? 'bg-[#0c2a5e] text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* PRODUCTS CATALOG TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Product Details</th>
                  <th className="py-3.5 px-4">Source Platform</th>
                  <th className="py-3.5 px-4">Source Cost</th>
                  <th className="py-3.5 px-4">Customer Price</th>
                  <th className="py-3.5 px-4">Your Commission Margin</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-600">No products found</p>
                      <p className="text-xs text-slate-400">Click "+ List Sourced Product" above to add products from Amazon, Meesho, or DeoDap.</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const platform = p.sourcePlatform || 'in_house';
                    const sPrice = p.sourcePrice || 0;
                    const margin = p.profitMargin || (sPrice > 0 ? Math.max(0, p.price - sPrice) : 0);
                    const marginPct = sPrice > 0 ? Math.round((margin / p.price) * 100) : 0;
                    const img = p.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80';

                    return (
                      <tr key={p._id} className="hover:bg-slate-50/80 transition">
                        {/* Title & Image */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                              <img src={img} alt={p.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="max-w-[220px]">
                              <div className="font-bold text-slate-900 line-clamp-1" title={p.title}>{p.title}</div>
                              <span className="text-[10px] text-slate-400 capitalize">{p.category || 'General'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Source Platform Badge */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${platformColors[platform] || platformColors.other}`}>
                              {platform}
                            </span>
                            {p.sourceUrl && (
                              <div>
                                <a
                                  href={p.sourceUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-1 font-semibold"
                                >
                                  <span>View Item</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Source Cost */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          {sPrice > 0 ? `₹${sPrice.toLocaleString('en-IN')}` : <span className="text-slate-400 italic">Self-stock</span>}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3.5 px-4 font-mono font-black text-slate-900 text-sm">
                          ₹{p.price?.toLocaleString('en-IN')}
                        </td>

                        {/* Commission Margin */}
                        <td className="py-3.5 px-4">
                          {margin > 0 ? (
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold font-mono">
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                              <span>+₹{margin.toLocaleString('en-IN')}</span>
                              <span className="text-[10px] text-emerald-600 font-normal">({marginPct}%)</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">N/A</span>
                          )}
                        </td>

                        {/* Stock */}
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            p.stock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {p.stock > 0 ? `${p.stock} units` : 'Out of Stock'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3 text-slate-400" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDelete(p._id, p.title)}
                              className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                              title="Delete Product"
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

      {/* DROPSHIP SOURCING DRAWER / MODAL */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          drawerOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
        }`}
      >
        <div
          onClick={() => setDrawerOpen(false)}
          className={`fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 ${
            drawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div
          className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out transform ${
            drawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-[#071d42] to-[#153e85] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner flex-shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight">
                  {editingProduct ? 'Edit Sourced Product' : 'List Dropshipped Product'}
                </h3>
                <p className="text-xs text-blue-200">Amazon, Meesho, Flipkart, DeoDap sourcing</p>
              </div>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form id="dropship-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
            {/* Source Platform Selector */}
            <div className="space-y-1.5">
              <label className="font-black text-slate-800 uppercase tracking-wider block">
                Sourcing Supplier Platform *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'meesho', label: 'Meesho', color: 'border-pink-300 hover:bg-pink-50' },
                  { id: 'deodap', label: 'DeoDap', color: 'border-emerald-300 hover:bg-emerald-50' },
                  { id: 'amazon', label: 'Amazon', color: 'border-amber-300 hover:bg-amber-50' },
                  { id: 'flipkart', label: 'Flipkart', color: 'border-blue-300 hover:bg-blue-50' },
                ].map((plat) => (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, sourcePlatform: plat.id })}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs capitalize transition cursor-pointer ${
                      formData.sourcePlatform === plat.id
                        ? 'bg-[#0c2a5e] text-white border-[#0c2a5e] shadow-2xs'
                        : `bg-slate-50 text-slate-700 ${plat.color}`
                    }`}
                  >
                    {plat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Supplier Product URL */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Supplier Product URL</label>
              <input
                type="url"
                placeholder="Paste link: https://www.meesho.com/... or Amazon/DeoDap link"
                value={formData.sourceUrl}
                onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0c2a5e] rounded-xl outline-none font-mono text-xs"
              />
            </div>

            {/* Product Title */}
            <div className="space-y-1">
              <label className="font-bold text-slate-800 block">Product Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Wireless Noise Cancelling Earbuds"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0c2a5e] rounded-xl outline-none font-semibold text-slate-900"
              />
            </div>

            {/* Price & Margin Calculation Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/50 border border-emerald-200 space-y-3">
              <div className="font-bold text-emerald-900 flex items-center justify-between">
                <span>Commission &amp; Pricing Calculator</span>
                <span className="text-[10px] uppercase font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  Profit Engine
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Cost Price */}
                <div>
                  <label className="font-bold text-slate-600 text-[11px] block">Source Cost Price (₹)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 399"
                    value={formData.sourcePrice}
                    onChange={(e) => setFormData({ ...formData, sourcePrice: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 focus:border-emerald-600 rounded-xl outline-none font-mono font-bold mt-1"
                  />
                  <span className="text-[10px] text-slate-400">What you pay supplier</span>
                </div>

                {/* Selling Price */}
                <div>
                  <label className="font-bold text-slate-800 text-[11px] block">Your Customer Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    placeholder="e.g. 699"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full p-2 bg-white border border-slate-200 focus:border-emerald-600 rounded-xl outline-none font-mono font-black text-slate-900 mt-1"
                  />
                  <span className="text-[10px] text-slate-400">Customer pays you this</span>
                </div>
              </div>

              {/* Profit Display */}
              <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900">Your Net Commission Margin:</span>
                <strong className="text-emerald-700 font-mono text-base font-black">
                  +₹{calculatedMargin.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* Category & Stock */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none mt-1"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Fashion">Fashion &amp; Apparel</option>
                  <option value="Home & Kitchen">Home &amp; Kitchen</option>
                  <option value="Beauty">Beauty &amp; Personal Care</option>
                  <option value="Jewellery">Jewellery</option>
                  <option value="Toys & Baby">Toys &amp; Baby</option>
                  <option value="General">General Merchandise</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block">Available Stock</label>
                <input
                  type="number"
                  min={1}
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none mt-1 font-mono"
                />
              </div>
            </div>

            {/* Image URLs */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Product Image URLs (Comma-separated)</label>
              <textarea
                rows={2}
                placeholder="https://...image1.jpg, https://...image2.jpg"
                value={formData.images}
                onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl outline-none font-mono text-[11px]"
              />
              <span className="text-[10px] text-slate-400">Copy image link from supplier item and paste here</span>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="font-bold text-slate-700 block">Description (Optional)</label>
              <textarea
                rows={3}
                placeholder="Enter product features, specifications, and details..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:bg-white rounded-xl outline-none"
              />
            </div>
          </form>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="dropship-form"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-bold transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{submitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Publish Sourced Product'}</span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
