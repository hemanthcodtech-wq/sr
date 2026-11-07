import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  ExternalLink,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Store,
  Tag,
  Eye,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpDown,
  Building,
  User,
  ShoppingBag,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminVendorProducts = () => {
  const { success, error, info } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const limit = 12;

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStockStatus, setSelectedStockStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Quick Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  useEffect(() => {
    fetchVendorProducts();
  }, [page, selectedCategory, selectedStockStatus, sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchVendorProducts();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchVendorProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('vendorType', 'vendor');
      params.append('page', page);
      params.append('limit', limit);

      if (searchQuery.trim()) params.append('keyword', searchQuery.trim());
      if (selectedCategory !== 'all') params.append('category', selectedCategory);

      if (sortBy === 'newest') params.append('sort', 'createdAt');
      else if (sortBy === 'price-low') params.append('sort', 'price-asc');
      else if (sortBy === 'price-high') params.append('sort', 'price-desc');
      else if (sortBy === 'stock-low') params.append('sort', 'stock-asc');

      const res = await api.get(`/products?${params.toString()}`);
      if (res.data?.products) {
        let items = res.data.products;
        if (selectedStockStatus === 'in_stock') {
          items = items.filter((p) => p.stock > 0);
        } else if (selectedStockStatus === 'out_of_stock') {
          items = items.filter((p) => !p.stock || p.stock === 0);
        }
        setProducts(items);
        setTotalProducts(res.data.total || 0);
        setTotalPages(res.data.pages || 1);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load vendor products');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Remove vendor product "${title}" from the marketplace?`)) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setTotalProducts((prev) => Math.max(0, prev - 1));
      success(`"${title}" deleted from catalog`);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleOpenEdit = (p) => {
    setSelectedProduct(p);
    setEditPrice(p.price || '');
    setEditStock(p.stock || 0);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      setSavingProduct(true);
      const res = await api.put(`/products/${selectedProduct._id}`, {
        price: Number(editPrice) || selectedProduct.price,
        stock: Number(editStock) || 0,
      });
      if (res.data?.success) {
        success(`Updated "${selectedProduct.title}"`);
        setEditModalOpen(false);
        fetchVendorProducts();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update product');
    } finally {
      setSavingProduct(false);
    }
  };

  return (
    <AdminLayout
      title="Vendor Marketplace Products"
      subtitle="Oversee, moderate, and inspect products uploaded directly by independent registered merchants"
      onRefresh={fetchVendorProducts}
    >
      <div className="space-y-6 pb-12 font-sans animate-fadeIn">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-purple-950 via-[#1e1b4b] to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-purple-500/20">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-inner flex-shrink-0">
                <Store className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">Independent Vendor Products</h2>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    Vendor Sourced
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-purple-200 mt-1 max-w-2xl leading-relaxed">
                  Dedicated directory for items uploaded directly by registered third-party merchants. DeoDap wholesale dropship products are separated into the Admin Dropship Catalog.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/admin/products"
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white/90 hover:text-white border border-white/15 backdrop-blur-md transition text-xs font-bold flex items-center gap-2"
              >
                <Package className="w-4 h-4 text-amber-300" />
                <span>Go to DeoDap Catalog</span>
              </Link>
              <button
                onClick={fetchVendorProducts}
                disabled={loading}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/90 hover:text-white border border-white/15 backdrop-blur-md transition cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-300' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search vendor products, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Category */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="Electronics">Electronics</option>
                <option value="Home & Kitchen">Home & Kitchen</option>
                <option value="Fashion">Fashion</option>
                <option value="Beauty">Beauty</option>
                <option value="Fitness">Fitness</option>
                <option value="Toys">Toys</option>
                <option value="Automotive">Automotive</option>
              </select>
            </div>

            {/* Stock status */}
            <div>
              <select
                value={selectedStockStatus}
                onChange={(e) => {
                  setSelectedStockStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="all">All Stock Levels</option>
                <option value="in_stock">In Stock Only</option>
                <option value="out_of_stock">Out of Stock Only</option>
              </select>
            </div>

            {/* Sorting */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="newest">Sort: Newly Listed</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="stock-low">Stock: Low Inventory First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid with Responsive Layout & Lazy Images */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-3">
                <div className="h-44 bg-slate-100 rounded-xl w-full" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="flex justify-between pt-2">
                  <div className="h-5 bg-slate-100 rounded w-1/3" />
                  <div className="h-5 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-slate-900">No Vendor Products Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When approved merchant vendors list their inventory on their store fronts, their products will automatically appear here for moderation.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <div
                key={p._id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-purple-200 transition group flex flex-col justify-between"
              >
                <div>
                  {/* Image with Lazy Loading */}
                  <div className="relative h-48 bg-slate-50 overflow-hidden">
                    <img
                      src={p.images?.[0] || p.image || '/logo.png'}
                      alt={p.title}
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/logo.png';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-md">
                      {p.category || 'General'}
                    </span>
                    {p.stock <= 5 && (
                      <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                        {p.stock === 0 ? 'Out of Stock' : `Low: ${p.stock}`}
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    {/* Store / Merchant Pill */}
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-700">
                      <Building className="w-3.5 h-3.5" />
                      <span className="truncate">{p.store?.storeName || p.vendor?.name || 'Independent Vendor'}</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug" title={p.title}>
                      {p.title}
                    </h4>

                    {/* Price and Stock Status */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <div className="text-base font-black font-mono text-slate-900">
                          {p.price?.toLocaleString('en-IN')}
                        </div>
                        {p.discountPrice > p.price && (
                          <div className="text-[10px] font-mono text-slate-400 line-through">
                            {p.discountPrice?.toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-mono font-bold text-slate-600 block">
                          Stock: {p.stock}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold block">
                          Free Delivery
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    to={`/product/${p._id}`}
                    target="_blank"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white transition"
                    title="View Public Storefront Page"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-white transition cursor-pointer"
                      title="Quick Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p._id, p.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Showing page <b className="text-slate-800">{page}</b> of <b className="text-slate-800">{totalPages}</b> ({totalProducts} total products)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  const num = idx + 1;
                  return (
                    <button
                      key={num}
                      onClick={() => setPage(num)}
                      className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                        page === num
                          ? 'bg-purple-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900">Moderate Vendor Product</h3>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="text-xs text-slate-600 font-bold line-clamp-2">
                {selectedProduct.title}
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Selling Price</label>
                  <input
                    type="number"
                    min="1"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Available Stock Inventory</label>
                  <input
                    type="number"
                    min="0"
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingProduct}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
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

export default AdminVendorProducts;

