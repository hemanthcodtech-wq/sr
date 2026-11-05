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
  Plus,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
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

  // Manual Add Product Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    title: '',
    description: '',
    price: '',
    discountPrice: '',
    sourcePrice: '',
    category: 'Electronics',
    stock: 25,
    images: [''],
    tags: '',
    isFeatured: false,
  });

  // Quick Edit Modal for individual product
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editSourcePrice, setEditSourcePrice] = useState('');
  const [editStock, setEditStock] = useState(10);
  const [editCategory, setEditCategory] = useState('Electronics');
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products?limit=250');
      if (res?.data?.products) {
        setProducts(res.data.products);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load catalog');
    } finally {
      setLoading(false);
    }
  };

  // Upload Product Image to Cloudinary
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Please select an image file (PNG, JPG, WEBP)');
      return;
    }

    const data = new FormData();
    data.append('image', file);
    setUploadingImage(true);

    try {
      info('Uploading product image to Cloudinary...');
      const res = await api.post('/products/upload-image', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.url) {
        setNewProductForm((prev) => ({
          ...prev,
          images: [res.data.url, ...(prev.images.filter(Boolean).slice(1))],
        }));
        success('Product image uploaded successfully!');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle Add Product Submit
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProductForm.title.trim()) {
      error('Product title is required');
      return;
    }
    if (!newProductForm.price || Number(newProductForm.price) <= 0) {
      error('Please provide a valid selling price');
      return;
    }

    setSubmittingProduct(true);
    try {
      const payload = {
        title: newProductForm.title.trim(),
        description: newProductForm.description.trim(),
        price: Number(newProductForm.price),
        discountPrice: newProductForm.discountPrice ? Number(newProductForm.discountPrice) : Math.round(Number(newProductForm.price) * 1.3),
        sourcePrice: newProductForm.sourcePrice ? Number(newProductForm.sourcePrice) : 0,
        category: newProductForm.category,
        stock: Number(newProductForm.stock) || 10,
        images: newProductForm.images.filter(Boolean).length > 0 ? newProductForm.images.filter(Boolean) : ['/logo.png'],
        tags: newProductForm.tags ? newProductForm.tags.split(',').map((t) => t.trim()) : [],
        isFeatured: Boolean(newProductForm.isFeatured),
        sourcePlatform: 'in_house',
      };

      const res = await api.post('/products', payload);
      if (res.data?.success) {
        success('Product added successfully to marketplace catalog!');
        setAddModalOpen(false);
        setNewProductForm({
          title: '',
          description: '',
          price: '',
          discountPrice: '',
          sourcePrice: '',
          category: 'Electronics',
          stock: 25,
          images: [''],
          tags: '',
          isFeatured: false,
        });
        fetchProducts();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Open Quick Edit for individual product
  const handleOpenEditModal = (prod) => {
    setSelectedProduct(prod);
    setEditTitle(prod.title || '');
    setEditSourcePrice(prod.sourcePrice || 0);
    setEditPrice(prod.price || 0);
    setEditStock(prod.stock ?? 10);
    setEditCategory(prod.category || 'Electronics');
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
        title: editTitle || selectedProduct.title,
        price: cPrice,
        sourcePrice: sPrice,
        stock: Number(editStock) || 0,
        category: editCategory,
        profitMargin: margin,
        discountPrice: Math.round(cPrice * 1.35),
      });

      if (res.data?.success) {
        success(`Updated product "${editTitle || selectedProduct.title}"`);
        setEditModalOpen(false);
        fetchProducts();
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

  const inStockCount = products.filter((p) => p.stock > 0).length;
  const outOfStockCount = products.filter((p) => !p.stock || p.stock === 0).length;
  const totalValue = products.reduce((sum, p) => sum + (p.price || 0) * (p.stock || 1), 0);

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

  const majorCategories = ['all', 'Electronics', 'Home & Kitchen', 'Toys', 'Beauty', 'Fitness', 'Fashion', 'Automotive', 'General'];

  return (
    <AdminLayout
      title="Store Product Catalog & Inventory Management"
      subtitle="Direct admin product publishing, pricing control, stock tracking, and multi-category marketplace catalog"
      onRefresh={fetchProducts}
    >
      <div className="space-y-6 animate-fadeIn pb-12 font-sans">
        {/* HERO BANNER: Admin Direct Product Center */}
        <div className="bg-gradient-to-r from-[#071d42] via-[#0c2a5e] to-[#153e85] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner flex-shrink-0">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">Admin Marketplace Catalog &amp; Products</h2>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Admin Controlled
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl leading-relaxed">
                  Publish and manage catalog products directly. Set custom customer selling prices, upload high-definition images to Cloudinary, track active stocks, and categorize items across the marketplace.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={fetchProducts}
                disabled={loading}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/90 hover:text-white border border-white/15 backdrop-blur-md transition cursor-pointer"
                title="Refresh Catalog"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-300' : ''}`} />
              </button>

              <button
                onClick={() => setAddModalOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-400/25 active:scale-98 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add New Product</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 KPI METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL PRODUCTS</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{products.length}</div>
              <span className="text-[11px] text-slate-400 block">Catalog items</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0c2a5e] flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">IN STOCK READY</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">{inStockCount}</div>
              <span className="text-[11px] text-emerald-700 font-semibold block">Available for purchase</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">OUT OF STOCK</span>
              <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">
                {outOfStockCount}
              </div>
              <span className="text-[11px] text-rose-500 font-medium block">Needs replenishment</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CATALOG VALUATION</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                ₹{totalValue.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-slate-500 font-medium block">Total retail stock</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTER PILLS */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search products by title or category..."
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
                  <th className="py-3.5 px-4">Selling Price</th>
                  <th className="py-3.5 px-4">MRP / Compare</th>
                  <th className="py-3.5 px-4">Stock Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                      <span>Loading store catalog...</span>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-bold text-slate-700">No products found matching filters</p>
                      <p className="text-xs text-slate-400 mt-1">Click "Add New Product" to create your first product</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition">
                      {/* Product details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0] || p.image || '/logo.png'}
                            onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
                            alt={p.title}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50 flex-shrink-0"
                          />
                          <div className="max-w-xs sm:max-w-md">
                            <div className="font-bold text-slate-900 line-clamp-1">{p.title}</div>
                            <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {p.description || 'No description provided'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-block ${categoryColors[p.category] || 'bg-slate-100 text-slate-700'}`}>
                          {p.category || 'General'}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          ₹{p.price?.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Compare / MRP */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-medium text-slate-400 line-through">
                          ₹{(p.discountPrice || Math.round(p.price * 1.35))?.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Stock */}
                      <td className="py-3.5 px-4">
                        {p.stock > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{p.stock} in stock</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span>Out of stock</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/product/${p._id}`}
                            target="_blank"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="View Public Product Page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                            title="Edit Product Price & Details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p._id, p.title)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL: ADD NEW PRODUCT (BY ADMIN) */}
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 sm:p-7 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Add Product to Store</h3>
                    <p className="text-xs text-slate-500 font-medium">Create a new item in the marketplace catalog</p>
                  </div>
                </div>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
                {/* Title */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Product Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wireless Noise Cancelling Headphones"
                    value={newProductForm.title}
                    onChange={(e) => setNewProductForm({ ...newProductForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] text-xs font-semibold text-slate-900"
                  />
                </div>

                {/* Category & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Category *</label>
                    <select
                      value={newProductForm.category}
                      onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] text-xs font-semibold text-slate-900 cursor-pointer"
                    >
                      {['Electronics', 'Home & Kitchen', 'Toys', 'Beauty', 'Fitness', 'Fashion', 'Automotive', 'General'].map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Inventory Stock Quantity *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newProductForm.stock}
                      onChange={(e) => setNewProductForm({ ...newProductForm, stock: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] text-xs font-semibold text-slate-900 font-mono"
                    />
                  </div>
                </div>

                {/* Prices */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Selling Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="e.g. 1499"
                      value={newProductForm.price}
                      onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] text-xs font-bold text-slate-900 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Compare MRP Price (₹)</label>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 2199 (optional)"
                      value={newProductForm.discountPrice}
                      onChange={(e) => setNewProductForm({ ...newProductForm, discountPrice: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] text-xs font-bold text-slate-900 font-mono"
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Product Image (Cloudinary Upload or URL)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Paste image URL or upload file below"
                      value={newProductForm.images[0] || ''}
                      onChange={(e) => setNewProductForm({ ...newProductForm, images: [e.target.value] })}
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                    <label className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition">
                      {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                      <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                  {newProductForm.images[0] && (
                    <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden mt-1.5">
                      <img src={newProductForm.images[0]} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Product Description</label>
                  <textarea
                    rows={3}
                    placeholder="Enter detailed product description and key specifications..."
                    value={newProductForm.description}
                    onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] text-xs text-slate-900 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingProduct || uploadingImage}
                    className="px-6 py-2 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-bold transition shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {submittingProduct ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Publishing Product...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Publish to Catalog</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT PRODUCT DETAILS */}
        {editModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0c2a5e] flex items-center justify-center font-bold">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Edit Product Details</h3>
                    <p className="text-xs text-slate-400 font-medium">Update title, price, or inventory count</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveIndividualProduct} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Product Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Selling Price (₹)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Stock Inventory</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    {['Electronics', 'Home & Kitchen', 'Toys', 'Beauty', 'Fitness', 'Fashion', 'Automotive', 'General'].map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProduct}
                    className="px-5 py-2 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {savingProduct ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
