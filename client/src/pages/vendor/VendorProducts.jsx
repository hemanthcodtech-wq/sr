import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Package,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Upload,
  Check,
  X,
  AlertCircle,
  Tag,
  ArrowLeft,
  Sparkles,
  Search,
  Filter,
  DollarSign,
  Layers,
  Star,
  Flame,
  ExternalLink,
  Lock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  CheckCheck,
  Copy,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import VendorLayout from '../../components/vendor/VendorLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const categories = [
  'All',
  'Electronics',
  'Fashion',
  'Footwear',
  'Grocery',
  'Furniture',
  'Beauty',
  'Jewelry',
  'General',
];

const VendorProducts = () => {
  const { success, error, info } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'my_products'); // 'my_products' | 'admin_catalog'

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Search & Filter (My Products)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    discountPrice: '',
    category: 'Electronics',
    stock: 15,
    images: [],
    tags: '',
    isFeatured: false,
  });

  // Admin Catalog Sourcing State & Full-Page Browser Controls
  const [adminCatalogLoading, setAdminCatalogLoading] = useState(false);
  const [adminCatalogData, setAdminCatalogData] = useState({ hasAccess: false, status: 'none', products: [] });
  const [requestingCatalogAccess, setRequestingCatalogAccess] = useState(false);
  const [sourcingProductId, setSourcingProductId] = useState(null);
  const [copiedCodeId, setCopiedCodeId] = useState(null);

  // Filters, Sorts, Searches, Pagination for Admin Catalog
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('All');
  const [catalogSortBy, setCatalogSortBy] = useState('newest'); // 'newest' | 'price_asc' | 'price_desc' | 'name_asc'
  const [catalogStatusFilter, setCatalogStatusFilter] = useState('all'); // 'all' | 'unadded' | 'added'
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPageSize, setCatalogPageSize] = useState(12);

  useEffect(() => {
    fetchProducts();
    const tabParam = searchParams.get('tab');
    if (tabParam === 'admin_catalog') {
      setActiveTab('admin_catalog');
      loadAdminCatalog();
    }
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products/vendor/mine');
      if (res.data?.success) {
        setProducts(res.data.products || []);
      }
    } catch (err) {
      console.error('Failed to load vendor products:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminCatalog = async () => {
    setAdminCatalogLoading(true);
    try {
      const res = await api.get('/vendors/admin-catalog');
      if (res.data?.success) {
        setAdminCatalogData(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin catalog:', err);
      error(err.response?.data?.message || 'Could not fetch admin catalog');
    } finally {
      setAdminCatalogLoading(false);
    }
  };

  const handleSwitchTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'admin_catalog') {
      setSearchParams({ tab: 'admin_catalog' });
      if (!adminCatalogData.products || adminCatalogData.products.length === 0) {
        loadAdminCatalog();
      }
    } else {
      setSearchParams({});
    }
  };

  const handleRequestCatalogAccess = async () => {
    setRequestingCatalogAccess(true);
    try {
      const res = await api.post('/vendors/request-catalog-access');
      if (res.data?.success) {
        success(res.data.message || 'Catalog access request sent to Admin!');
        setAdminCatalogData((prev) => ({
          ...prev,
          status: 'requested',
          message: 'Your request to access the Admin Catalog is pending Admin approval.',
        }));
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to submit catalog access request');
    } finally {
      setRequestingCatalogAccess(false);
    }
  };

  const handleSourceAdminProduct = async (adminProductId) => {
    setSourcingProductId(adminProductId);
    try {
      const res = await api.post('/vendors/source-admin-product', { adminProductId });
      if (res.data?.success) {
        success(res.data.message || 'Product successfully added to your store!');
        fetchProducts();
        setAdminCatalogData((prev) => ({
          ...prev,
          products: (prev.products || []).map((p) =>
            p._id === adminProductId
              ? { ...p, alreadySourced: true, vendorProductCode: res.data.vendorProductCode }
              : p
          ),
        }));
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to source product');
    } finally {
      setSourcingProductId(null);
    }
  };

  const handleCopyCode = (code, id) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    success(`Copied product code ${code}!`);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Computed Filters, Categories & Pagination for Admin Catalog
  const filteredCatalogProducts = useMemo(() => {
    let list = [...(adminCatalogData.products || [])];

    // Search query
    if (catalogSearchQuery.trim()) {
      const q = catalogSearchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.title || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.vendorProductCode || '').toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }

    // Category
    if (catalogCategory !== 'All') {
      list = list.filter((p) => (p.category || '').toLowerCase() === catalogCategory.toLowerCase());
    }

    // Status filter
    if (catalogStatusFilter === 'unadded') {
      list = list.filter((p) => !p.alreadySourced);
    } else if (catalogStatusFilter === 'added') {
      list = list.filter((p) => p.alreadySourced);
    }

    // Sort
    if (catalogSortBy === 'price_asc') {
      list.sort((a, b) => (a.discountPrice || a.price || 0) - (b.discountPrice || b.price || 0));
    } else if (catalogSortBy === 'price_desc') {
      list.sort((a, b) => (b.discountPrice || b.price || 0) - (a.discountPrice || a.price || 0));
    } else if (catalogSortBy === 'name_asc') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return list;
  }, [adminCatalogData.products, catalogSearchQuery, catalogCategory, catalogStatusFilter, catalogSortBy]);

  const catalogCategories = useMemo(() => {
    const set = new Set();
    (adminCatalogData.products || []).forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [adminCatalogData.products]);

  const catalogTotalPages = Math.ceil(filteredCatalogProducts.length / catalogPageSize) || 1;
  const paginatedCatalogProducts = useMemo(() => {
    const start = (catalogPage - 1) * catalogPageSize;
    return filteredCatalogProducts.slice(start, start + catalogPageSize);
  }, [filteredCatalogProducts, catalogPage, catalogPageSize]);

  const alreadySourcedCount = useMemo(() => {
    return (adminCatalogData.products || []).filter((p) => p.alreadySourced).length;
  }, [adminCatalogData.products]);

  const availableToSourceCount = useMemo(() => {
    return (adminCatalogData.products || []).filter((p) => !p.alreadySourced).length;
  }, [adminCatalogData.products]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      description: '',
      price: '',
      discountPrice: '',
      category: 'Electronics',
      stock: 15,
      images: [],
      tags: '',
      isFeatured: false,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title || '',
      description: product.description || '',
      price: product.price || '',
      discountPrice: product.discountPrice || '',
      category: product.category || 'General',
      stock: product.stock !== undefined ? product.stock : 10,
      images: Array.isArray(product.images) ? [...product.images] : [],
      tags: product.tags ? (Array.isArray(product.tags) ? product.tags.join(', ') : product.tags) : '',
      isFeatured: !!product.isFeatured,
    });
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Multiple Image Upload to Cloudinary
  const handleMultipleImagesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check size & formats
    const validFiles = files.filter((f) => {
      if (f.size > 10 * 1024 * 1024) {
        error(`File ${f.name} exceeds 10MB limit`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadData = new FormData();
      validFiles.forEach((f) => uploadData.append('images', f));

      // Attempt upload-images route
      let newUrls = [];
      try {
        const res = await api.post('/products/upload-images', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data?.success && Array.isArray(res.data.urls)) {
          newUrls = res.data.urls;
        }
      } catch (multiErr) {
        // Fallback: Upload sequentially via /products/upload-image
        for (const file of validFiles) {
          const singleData = new FormData();
          singleData.append('image', file);
          const singleRes = await api.post('/products/upload-image', singleData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          if (singleRes.data?.url) {
            newUrls.push(singleRes.data.url);
          }
        }
      }

      if (newUrls.length > 0) {
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...newUrls],
        }));
        success(`${newUrls.length} product image(s) uploaded to Cloudinary!`);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to upload product images');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleMakePrimaryImage = (index) => {
    setFormData((prev) => {
      const selected = prev.images[index];
      const remaining = prev.images.filter((_, idx) => idx !== index);
      return {
        ...prev,
        images: [selected, ...remaining],
      };
    });
    info('Selected image set as primary product thumbnail');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.price || !formData.description) {
      error('Please fill in product title, price, and description');
      return;
    }

    if (formData.images.length === 0) {
      error('Please upload at least 1 product image via Cloudinary');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : 0,
        category: formData.category,
        stock: Number(formData.stock),
        images: formData.images,
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        isFeatured: !!formData.isFeatured,
      };

      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct._id}`, payload);
        if (res.data?.success) {
          success('Product updated successfully!');
          fetchProducts();
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/products', payload);
        if (res.data?.success) {
          success('Product published to marketplace catalog!');
          fetchProducts();
          setModalOpen(false);
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'Could not save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await api.delete(`/products/${id}`);
      if (res.data?.success) {
        success(`Product "${title}" removed from catalog`);
        setProducts((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  // Filter products by search & category
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <VendorLayout
      title={activeTab === 'admin_catalog' ? 'Official Admin Sourced Catalog' : 'Store Products & Inventory'}
      subtitle={
        activeTab === 'admin_catalog'
          ? 'Browse and source official central warehouse products to sell in your store at fixed admin prices'
          : 'Publish product listings with multiple Cloudinary images, manage pricing, promotions & stock'
      }
      actions={
        <div className="flex flex-wrap items-center gap-2.5">
          {activeTab === 'admin_catalog' ? (
            <button
              type="button"
              onClick={() => handleSwitchTab('my_products')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-extrabold text-xs shadow-xs transition cursor-pointer"
            >
              <Package className="w-4 h-4 text-slate-700" />
              <span>Back to My Store Products</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleSwitchTab('admin_catalog')}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#0c2a5e] border border-blue-200/90 font-extrabold text-xs shadow-xs transition cursor-pointer"
            >
              <Layers className="w-4 h-4 text-[#0c2a5e]" />
              <span>Admin Sourced Catalog</span>
              {adminCatalogData.hasAccess && availableToSourceCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                  {availableToSourceCount}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Own Product</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top Tab Switcher Capsule */}
        <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl">
            <button
              type="button"
              onClick={() => handleSwitchTab('my_products')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'my_products'
                  ? 'bg-white text-[#0c2a5e] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>My Store Products</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  activeTab === 'my_products' ? 'bg-blue-100 text-[#0c2a5e]' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {products.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab('admin_catalog')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'admin_catalog'
                  ? 'bg-[#0c2a5e] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Admin Sourced Catalog</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  activeTab === 'admin_catalog' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {adminCatalogData.products ? adminCatalogData.products.length : '...'}
              </span>
            </button>
          </div>

          <div className="px-3 py-1 text-[11px] text-slate-500 font-semibold flex items-center gap-2">
            {activeTab === 'admin_catalog' ? (
              <span className="flex items-center gap-1.5 text-blue-900 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>Pan-India central fulfillment • Vendor-prefixed codes</span>
              </span>
            ) : (
              <span>Your self-added products and sourced items listed in your store</span>
            )}
          </div>
        </div>

        {activeTab === 'admin_catalog' ? (
          /* =====================================================================
             OFFICIAL ADMIN SOURCED CATALOG BROWSER (FULL-PAGE, RESPONSIVE, FILTERS)
             ===================================================================== */
          <div className="space-y-6">
            {adminCatalogLoading ? (
              <div className="p-16 text-center bg-white/80 rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 border-4 border-[#071d42] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-700">Loading Official Admin Catalog...</p>
              </div>
            ) : !adminCatalogData.hasAccess ? (
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center max-w-2xl mx-auto space-y-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 text-[#0c2a5e] flex items-center justify-center mx-auto shadow-sm">
                  <Lock className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-black uppercase tracking-wider">
                    Exclusive Merchant Sourcing
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Sell Official Admin Central Warehouse Products
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
                    Request access to browse, choose, and list verified admin catalog items in your store. When customers buy these products from your storefront, SR Marketplace dispatches them directly from central logistics—giving you effortless sales and zero fulfillment overhead!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0c2a5e] font-black text-xs flex items-center justify-center mb-2">1</div>
                    <p className="text-xs font-bold text-slate-900">Fixed Pricing</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Admin-locked standard fair prices across India.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0c2a5e] font-black text-xs flex items-center justify-center mb-2">2</div>
                    <p className="text-xs font-bold text-slate-900">Unique Store ID</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Auto-generated VND... prefix linked to your store.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0c2a5e] font-black text-xs flex items-center justify-center mb-2">3</div>
                    <p className="text-xs font-bold text-slate-900">Central Dispatch</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">SR Marketplace handles shipping, tracking & packaging.</p>
                  </div>
                </div>

                <div className="pt-2">
                  {adminCatalogData.status === 'requested' ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs font-bold inline-flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                      <span>Permission Request Pending: Admin is reviewing your catalog access application.</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestCatalogAccess}
                      disabled={requestingCatalogAccess}
                      className="px-8 py-3.5 bg-gradient-to-r from-[#0c2a5e] to-[#174896] hover:from-[#092048] hover:to-[#123875] text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-900/20 transition cursor-pointer disabled:opacity-50"
                    >
                      {requestingCatalogAccess ? 'Submitting Request...' : 'Request Admin Catalog Access Now →'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Hero Summary Capsule */}
                <div className="bg-gradient-to-r from-[#071d42] via-[#0c2a5e] to-[#174896] text-white rounded-3xl p-5 sm:p-6 shadow-md border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black tracking-wide uppercase">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Catalog Access Approved
                    </div>
                    <h3 className="text-lg sm:text-xl font-black">Official Admin Warehouse Catalog</h3>
                    <p className="text-xs text-blue-100 max-w-xl">
                      Select any product to list on your store. Sourced items inherit fixed official pricing and are automatically fulfilled by SR Marketplace Central Logistics.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/10 text-center">
                      <span className="text-lg font-black text-white">{alreadySourcedCount}</span>
                      <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">In Your Store</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xs px-4 py-2.5 rounded-2xl border border-white/10 text-center">
                      <span className="text-lg font-black text-amber-400">{availableToSourceCount}</span>
                      <p className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">Ready to Add</p>
                    </div>
                  </div>
                </div>

                {/* Search, Filter & Sort Toolbar */}
                <div className="bg-white/90 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 text-xs">
                  {/* Top Search + Status Filter Pills + Sort Dropdown */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search admin products by name, tag, SKU..."
                        value={catalogSearchQuery}
                        onChange={(e) => {
                          setCatalogSearchQuery(e.target.value);
                          setCatalogPage(1);
                        }}
                        className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                      />
                      {catalogSearchQuery && (
                        <button
                          type="button"
                          onClick={() => {
                            setCatalogSearchQuery('');
                            setCatalogPage(1);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Quick Status Filters */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
                      <button
                        type="button"
                        onClick={() => {
                          setCatalogStatusFilter('all');
                          setCatalogPage(1);
                        }}
                        className={`px-3 py-2 rounded-xl font-black text-xs transition cursor-pointer whitespace-nowrap ${
                          catalogStatusFilter === 'all'
                            ? 'bg-[#0c2a5e] text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All Items ({adminCatalogData.products?.length || 0})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCatalogStatusFilter('unadded');
                          setCatalogPage(1);
                        }}
                        className={`px-3 py-2 rounded-xl font-black text-xs transition cursor-pointer whitespace-nowrap ${
                          catalogStatusFilter === 'unadded'
                            ? 'bg-amber-500 text-slate-950 shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Not Yet Added ({availableToSourceCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCatalogStatusFilter('added');
                          setCatalogPage(1);
                        }}
                        className={`px-3 py-2 rounded-xl font-black text-xs transition cursor-pointer whitespace-nowrap ${
                          catalogStatusFilter === 'added'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        In My Store ({alreadySourcedCount})
                      </button>
                    </div>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[11px] font-bold text-slate-500">Sort:</span>
                        <select
                          value={catalogSortBy}
                          onChange={(e) => {
                            setCatalogSortBy(e.target.value);
                            setCatalogPage(1);
                          }}
                          className="bg-transparent border-none text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                        >
                          <option value="newest">Newest First</option>
                          <option value="price_asc">Price: Low to High</option>
                          <option value="price_desc">Price: High to Low</option>
                          <option value="name_asc">Name: A to Z</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Category Filter Pills (with item counts) */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 whitespace-nowrap flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Categories:
                    </span>
                    {catalogCategories.map((cat) => {
                      const count =
                        cat === 'All'
                          ? (adminCatalogData.products || []).length
                          : (adminCatalogData.products || []).filter(
                              (p) => (p.category || '').toLowerCase() === cat.toLowerCase()
                            ).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setCatalogCategory(cat);
                            setCatalogPage(1);
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer text-xs flex items-center gap-1.5 ${
                            catalogCategory === cat
                              ? 'bg-[#0c2a5e] text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          <span>{cat}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                              catalogCategory === cat ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}

                    {(catalogSearchQuery || catalogCategory !== 'All' || catalogStatusFilter !== 'all') && (
                      <button
                        type="button"
                        onClick={() => {
                          setCatalogSearchQuery('');
                          setCatalogCategory('All');
                          setCatalogStatusFilter('all');
                          setCatalogPage(1);
                        }}
                        className="px-2.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 whitespace-nowrap ml-auto"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Filters</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Product Cards Grid */}
                {paginatedCatalogProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                    {paginatedCatalogProducts.map((item) => (
                      <div
                        key={item._id}
                        className="bg-white rounded-3xl border border-slate-200/90 hover:border-slate-300 shadow-sm hover:shadow-md transition duration-200 overflow-hidden flex flex-col group"
                      >
                        {/* Product Image + Badges */}
                        <div className="relative aspect-4/3 bg-slate-100 overflow-hidden border-b border-slate-100">
                          <img
                            src={item.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                            <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[10px] font-black uppercase tracking-wider">
                              {item.category || 'General'}
                            </span>
                          </div>
                          <div className="absolute top-2.5 right-2.5">
                            {item.alreadySourced ? (
                              <span className="px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[10px] font-black shadow-xs flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" /> In Store
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-slate-950 text-[10px] font-black shadow-xs">
                                Available
                              </span>
                            )}
                          </div>
                          {item.images?.length > 1 && (
                            <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded-md">
                              +{item.images.length - 1} photos
                            </span>
                          )}
                        </div>

                        {/* Product Content */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-1.5">
                            <h4 className="font-extrabold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-[#0c2a5e] transition">
                              {item.title}
                            </h4>
                            {item.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}

                            {/* Pricing Details */}
                            <div className="pt-1 flex items-baseline gap-2">
                              <span className="text-base font-black text-[#0c2a5e]">
                                ₹{(item.discountPrice || item.price)?.toLocaleString('en-IN')}
                              </span>
                              {item.discountPrice && item.discountPrice < item.price && (
                                <span className="text-xs text-slate-400 line-through">
                                  ₹{item.price?.toLocaleString('en-IN')}
                                </span>
                              )}
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                                Fixed Admin Price
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                              <span>Stock: <strong className="text-slate-800">{item.stock ?? 25} units</strong></span>
                              <span className="text-[10px] text-slate-400">SR Central Warehouse</span>
                            </div>
                          </div>

                          {/* Action Area */}
                          <div className="pt-2 border-t border-slate-100">
                            {item.alreadySourced ? (
                              <div className="space-y-2">
                                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                                  <div className="min-w-0">
                                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                                      Vendor Store SKU
                                    </span>
                                    <span className="font-mono text-xs font-black text-emerald-950 truncate block">
                                      {item.vendorProductCode || 'VND-SOURCED'}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyCode(item.vendorProductCode, item._id)}
                                    className="p-1.5 rounded-lg bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs transition cursor-pointer"
                                    title="Copy unique vendor product code"
                                  >
                                    {copiedCodeId === item._id ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSwitchTab('my_products');
                                    setSearchQuery(item.vendorProductCode || item.title);
                                  }}
                                  className="w-full py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:text-[#0c2a5e] hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <span>View in My Products &rarr;</span>
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSourceAdminProduct(item._id)}
                                disabled={sourcingProductId === item._id}
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#0c2a5e] to-[#174896] hover:from-[#092048] hover:to-[#123875] text-white font-black text-xs shadow-sm hover:shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                {sourcingProductId === item._id ? (
                                  <>
                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Adding to Store...</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="w-4 h-4 stroke-[2.5]" />
                                    <span>Add to My Store</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/80 backdrop-blur-md p-12 text-center rounded-3xl border border-slate-200 shadow-sm space-y-4 max-w-lg mx-auto">
                    <Package className="w-14 h-14 text-slate-300 mx-auto" />
                    <div>
                      <h3 className="text-base font-black text-slate-800">No admin products match your filters</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Try broadening your search term or switching to &ldquo;All Items&rdquo; or a different category.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCatalogSearchQuery('');
                        setCatalogCategory('All');
                        setCatalogStatusFilter('all');
                        setCatalogPage(1);
                      }}
                      className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}

                {/* Pagination Controls */}
                {catalogTotalPages > 1 && (
                  <div className="p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="text-slate-600 font-semibold">
                      Showing{' '}
                      <strong className="text-slate-900">
                        {(catalogPage - 1) * catalogPageSize + 1}
                      </strong>{' '}
                      to{' '}
                      <strong className="text-slate-900">
                        {Math.min(catalogPage * catalogPageSize, filteredCatalogProducts.length)}
                      </strong>{' '}
                      of <strong className="text-slate-900">{filteredCatalogProducts.length}</strong> items
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Page Size Selector */}
                      <div className="flex items-center gap-1.5 pr-2 border-r border-slate-200">
                        <span className="text-[11px] text-slate-500">Show:</span>
                        <select
                          value={catalogPageSize}
                          onChange={(e) => {
                            setCatalogPageSize(Number(e.target.value));
                            setCatalogPage(1);
                          }}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 cursor-pointer"
                        >
                          <option value={8}>8</option>
                          <option value={12}>12</option>
                          <option value={24}>24</option>
                          <option value={48}>48</option>
                        </select>
                      </div>

                      {/* Prev */}
                      <button
                        type="button"
                        disabled={catalogPage <= 1}
                        onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                        className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {/* Pages */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: catalogTotalPages }, (_, i) => i + 1)
                          .filter((page) => {
                            if (catalogTotalPages <= 7) return true;
                            return page === 1 || page === catalogTotalPages || Math.abs(page - catalogPage) <= 1;
                          })
                          .map((page, idx, arr) => {
                            const prevPage = arr[idx - 1];
                            return (
                              <React.Fragment key={page}>
                                {prevPage && page - prevPage > 1 && (
                                  <span className="px-1 text-slate-400 font-black">...</span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setCatalogPage(page)}
                                  className={`w-8 h-8 rounded-xl font-bold text-xs transition cursor-pointer ${
                                    catalogPage === page
                                      ? 'bg-[#0c2a5e] text-white shadow-xs'
                                      : 'text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            );
                          })}
                      </div>

                      {/* Next */}
                      <button
                        type="button"
                        disabled={catalogPage >= catalogTotalPages}
                        onClick={() => setCatalogPage((p) => Math.min(catalogTotalPages, p + 1))}
                        className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* =====================================================================
             MY STORE PRODUCTS TAB (EXISTING INVENTORY & MANAGEMENT)
             ===================================================================== */
          <>
            {/* Search, Filter & Quick Stats Bar */}
            <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-md border border-white/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer text-xs ${
                  selectedCategory === cat
                    ? 'bg-[#0c2a5e] text-white shadow-xs'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Total Count */}
          <div className="text-slate-500 font-semibold whitespace-nowrap">
            Showing <strong className="text-slate-900">{filteredProducts.length}</strong> of {products.length} Items
          </div>
        </div>

        {/* Product List Table / Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-3xl bg-white/70 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="bg-white/85 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-extrabold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Product Details</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price &amp; Offer</th>
                    <th className="p-4">Stock Status</th>
                    <th className="p-4">Promotion</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map((prod) => {
                    const discountPercent =
                      prod.discountPrice && prod.discountPrice < prod.price
                        ? Math.round(((prod.price - prod.discountPrice) / prod.price) * 100)
                        : null;

                    return (
                      <tr key={prod._id} className="hover:bg-slate-50/60 transition group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 shadow-2xs">
                              {prod.images?.[0] ? (
                                <img
                                  src={prod.images[0]}
                                  alt={prod.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                  <ImageIcon className="w-6 h-6" />
                                </div>
                              )}
                              {prod.images?.length > 1 && (
                                <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 bg-black/70 text-white text-[9px] font-black rounded-md backdrop-blur-xs">
                                  +{prod.images.length - 1}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/products/${prod._id}`}
                                target="_blank"
                                className="font-extrabold text-sm text-slate-900 hover:text-[#0c2a5e] line-clamp-1 flex items-center gap-1"
                              >
                                <span>{prod.title}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                              </Link>
                              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                {prod.description}
                              </div>
                              <div className="flex items-center gap-1.5 mt-1">
                                {prod.sourceType === 'admin_catalog' || prod.isSourcedFromAdmin ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 text-[10px] font-black border border-blue-200">
                                    <Layers className="w-2.5 h-2.5 text-blue-700" />
                                    <span>Admin Sourced • {prod.vendorProductCode || `VND-${prod._id.slice(-6).toUpperCase()}`}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                                    <span>Own Product • Vendor Delivery</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-bold text-[#0c2a5e] bg-blue-50/90 border border-blue-200/80 px-2.5 py-1 rounded-xl text-[11px]">
                            {prod.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-black text-sm text-slate-900">
                              ₹{(prod.discountPrice || prod.price)?.toLocaleString('en-IN')}
                            </span>
                            {discountPercent && (
                              <span className="text-[11px] text-slate-400 line-through">
                                ₹{prod.price?.toLocaleString('en-IN')}
                              </span>
                            )}
                          </div>
                          {(prod.sourceType === 'admin_catalog' || prod.isSourcedFromAdmin) && (
                            <span className="inline-block mt-0.5 text-[10px] font-semibold text-slate-500">
                              🔒 Fixed Admin Price
                            </span>
                          )}
                          {discountPercent && !(prod.sourceType === 'admin_catalog' || prod.isSourcedFromAdmin) && (
                            <span className="inline-block mt-0.5 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              {discountPercent}% OFF
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span
                            className={`font-black px-2.5 py-1 rounded-full text-[10.5px] inline-flex items-center gap-1 ${
                              prod.stock > 5
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : prod.stock > 0
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                prod.stock > 5 ? 'bg-emerald-500' : prod.stock > 0 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                            />
                            <span>{prod.stock > 0 ? `${prod.stock} in stock` : 'Out of Stock'}</span>
                          </span>
                        </td>
                        <td className="p-4">
                          {prod.isFeatured ? (
                            <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100/80 border border-amber-200 px-2 py-0.5 rounded-full text-[10px]">
                              <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
                              <span>Featured Deal</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Standard</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(prod)}
                              className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod._id, prod.title)}
                              className="p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-md p-12 text-center rounded-3xl border border-white/80 shadow-sm space-y-4 max-w-lg mx-auto">
            <Package className="w-14 h-14 text-slate-300 mx-auto" />
            <div>
              <h3 className="text-base font-black text-slate-800">No products found</h3>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery || selectedCategory !== 'All'
                  ? 'No items matched your search filter. Try resetting the filters.'
                  : 'Add items with multiple Cloudinary images, pricing, and stock to start selling on SR Marketplace.'}
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition"
            >
              Add First Product
            </button>
          </div>
        )}
      </>
    )}

        {/* =====================================================================
            ADD / EDIT PRODUCT MODAL (MULTIPLE CLOUDINARY IMAGES SUPPORT)
           ===================================================================== */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
            {/* Modal Card */}
            <div className="bg-white w-full max-w-2xl sm:max-w-3xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden">
              {/* Sticky Header */}
              <div className="flex-shrink-0 bg-white border-b border-slate-100 px-5 sm:px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#0c2a5e] flex items-center justify-center flex-shrink-0 border border-blue-100">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                      {editingProduct ? 'Edit Product Listing' : 'Publish New Product'}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                      Fill product specs, pricing, and upload Cloudinary gallery photos
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer flex-shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form id="vendor-product-form" onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
                {/* 1. Basic Information */}
                <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-slate-800 font-black text-xs">
                    <Tag className="w-3.5 h-3.5 text-[#0c2a5e]" />
                    <span>Basic Details</span>
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Product Title *</label>
                    <input
                      type="text"
                      name="title"
                      required
                      placeholder="e.g. Premium Wireless Bluetooth Headphones with Mic"
                      value={formData.title}
                      onChange={handleFormChange}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>

                  {/* Category & Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Category / Department *</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleFormChange}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] cursor-pointer"
                      >
                        {categories.filter((c) => c !== 'All').map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Inventory Stock Units *</label>
                      <input
                        type="number"
                        name="stock"
                        required
                        min={0}
                        placeholder="15"
                        value={formData.stock}
                        onChange={handleFormChange}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Pricing & Offers */}
                <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-800 font-black text-xs">
                      <DollarSign className="w-3.5 h-3.5 text-[#0c2a5e]" />
                      <span>Pricing &amp; Discounts</span>
                    </div>
                    {(editingProduct?.sourceType === 'admin_catalog' || editingProduct?.isSourcedFromAdmin) && (
                      <span className="text-[10px] text-amber-800 font-bold bg-amber-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Fixed Admin Pricing
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Original MRP (₹) *</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          name="price"
                          required
                          min={1}
                          disabled={editingProduct?.sourceType === 'admin_catalog' || editingProduct?.isSourcedFromAdmin}
                          placeholder="e.g. 999"
                          value={formData.price}
                          onChange={handleFormChange}
                          className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Discounted Selling Price (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          name="discountPrice"
                          min={0}
                          disabled={editingProduct?.sourceType === 'admin_catalog' || editingProduct?.isSourcedFromAdmin}
                          placeholder="e.g. 499"
                          value={formData.discountPrice}
                          onChange={handleFormChange}
                          className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Discount Preview */}
                  {Number(formData.price) > 0 && Number(formData.discountPrice) > 0 && Number(formData.discountPrice) < Number(formData.price) && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        Selling at ₹{Number(formData.discountPrice).toLocaleString('en-IN')}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[10px]">
                        {Math.round(((Number(formData.price) - Number(formData.discountPrice)) / Number(formData.price)) * 100)}% OFF
                      </span>
                    </div>
                  )}

                  {(editingProduct?.sourceType === 'admin_catalog' || editingProduct?.isSourcedFromAdmin) && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
                      ⚠️ <strong>Admin Sourced Product:</strong> Selling price is fixed by Admin and cannot be modified. Centralized delivery is handled by SR Marketplace.
                    </div>
                  )}
                </div>

                {/* 3. Description & Tags */}
                <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                  <div className="flex items-center gap-2 text-slate-800 font-black text-xs">
                    <FileText className="w-3.5 h-3.5 text-[#0c2a5e]" />
                    <span>Description &amp; Search Keywords</span>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Product Description &amp; Specifications *</label>
                    <textarea
                      name="description"
                      required
                      rows={3}
                      placeholder="Describe key features, box contents, manufacturer warranty, and material specs..."
                      value={formData.description}
                      onChange={handleFormChange}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">
                      Search Tags <span className="text-slate-400 font-normal">(optional, comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      name="tags"
                      placeholder="e.g. wireless, bluetooth, bass, over-ear"
                      value={formData.tags}
                      onChange={handleFormChange}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                </div>

                {/* 4. Multiple Images Upload via Cloudinary */}
                <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-b from-blue-50/60 to-slate-50 border border-blue-200/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-slate-800 text-xs block">
                        Product Gallery Images (Cloudinary) *
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Upload multiple photos. The first photo is your storefront primary thumbnail.
                      </p>
                    </div>
                    {uploadingImages && (
                      <span className="text-blue-700 font-bold text-[11px] flex items-center gap-1.5 animate-pulse">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Uploading...</span>
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Preview Grid */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-1">
                      {formData.images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="relative group rounded-xl overflow-hidden border border-slate-300 bg-white shadow-2xs aspect-square"
                        >
                          <img src={imgUrl} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                          {idx === 0 ? (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-[#0c2a5e] text-white text-[9px] font-black shadow-xs">
                              Primary
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleMakePrimaryImage(idx)}
                              className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-white/90 hover:bg-white text-slate-800 text-[9px] font-bold opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                            >
                              Set Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer shadow-xs"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Trigger Dropzone */}
                  <label className="border-2 border-dashed border-blue-300 hover:border-[#0c2a5e] bg-white/80 hover:bg-white rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 shadow-2xs">
                    <Upload className="w-6 h-6 text-[#0c2a5e]" />
                    <span className="text-xs font-bold text-slate-800">
                      {formData.images.length > 0 ? '+ Click to Upload More Photos' : 'Click to Upload Product Photos'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Supports JPG, PNG, WEBP (up to 8 images per product, max 10MB each)
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploadingImages}
                      onChange={handleMultipleImagesChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* 5. Promotion Toggle */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label htmlFor="is-featured-chk" className="font-extrabold text-amber-950 flex items-center gap-1.5 cursor-pointer">
                      <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                      <span>Promote as Featured Deal Item</span>
                    </label>
                    <p className="text-[11px] text-slate-600">
                      Featured products are showcased on the SR Marketplace homepage deal carousels.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    id="is-featured-chk"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleFormChange}
                    className="w-5 h-5 accent-[#0c2a5e] cursor-pointer"
                  />
                </div>
              </form>

              {/* Sticky Footer */}
              <div className="flex-shrink-0 bg-slate-50/95 backdrop-blur-xs border-t border-slate-200/80 px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  * Required fields
                </span>
                <div className="flex items-center gap-2.5 ml-auto w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-white text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="vendor-product-form"
                    disabled={submitting || uploadingImages}
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-[#0c2a5e] to-[#174896] hover:from-[#092048] hover:to-[#123875] text-white font-black rounded-xl shadow-md text-xs transition cursor-pointer disabled:bg-slate-400 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : editingProduct ? (
                      'Save Changes'
                    ) : (
                      'Publish Product'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
};

export default VendorProducts;
