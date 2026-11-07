import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  ChevronDown,
  ChevronUp,
  Truck,
  Filter,
  Plus,
  Image as ImageIcon,
  UploadCloud,
  FileSpreadsheet,
  Download,
  Upload,
  Loader2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  BarChart2,
  Store,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminProducts = () => {
  const { success, error, info } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const limit = 12;

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

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

  // DeoDap CSV Upload Modal & State
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvProfitMargin, setCsvProfitMargin] = useState(30);
  const [csvDeliveryCharge, setCsvDeliveryCharge] = useState(30);
  const [csvDefaultStock, setCsvDefaultStock] = useState(25);
  const [csvUpdateExisting, setCsvUpdateExisting] = useState(true);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState(null);

  // Quick Edit Modal
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
  }, [page, selectedCategory, selectedStockFilter, sortBy]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchProducts();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      // DeoDap / Admin Dropship items only
      params.append('sourcePlatform', 'deodap');
      params.append('page', page);
      params.append('limit', limit);

      if (searchQuery.trim()) params.append('keyword', searchQuery.trim());
      if (selectedCategory !== 'all') params.append('category', selectedCategory);

      if (sortBy === 'newest') params.append('sort', 'createdAt');
      else if (sortBy === 'price-low') params.append('sort', 'price-asc');
      else if (sortBy === 'price-high') params.append('sort', 'price-desc');
      else if (sortBy === 'stock-low') params.append('sort', 'stock-asc');

      const res = await api.get(`/products?${params.toString()}`);
      if (res?.data?.products) {
        let items = res.data.products;
        if (selectedStockFilter === 'in_stock') {
          items = items.filter((p) => p.stock > 0);
        } else if (selectedStockFilter === 'out_of_stock') {
          items = items.filter((p) => !p.stock || p.stock === 0);
        }
        setProducts(items);
        setTotalProducts(res.data.total || 0);
        setTotalPages(res.data.pages || 1);
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
          images: [res.data.url, ...prev.images.filter(Boolean).slice(1)],
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

    const validImages = newProductForm.images.filter((img) => img && img.trim().length > 0);
    if (validImages.length === 0) {
      error('Please provide at least one valid image URL');
      return;
    }

    try {
      setSubmittingProduct(true);
      const sPrice = Number(newProductForm.sourcePrice) || 0;
      const cPrice = Number(newProductForm.price) || 0;
      const margin = Math.max(0, cPrice - sPrice);

      const payload = {
        title: newProductForm.title,
        description: newProductForm.description || `${newProductForm.title} - High quality dropshipping product.`,
        price: cPrice,
        discountPrice: newProductForm.discountPrice ? Number(newProductForm.discountPrice) : Math.round(cPrice * 1.35),
        sourcePrice: sPrice,
        profitMargin: margin,
        category: newProductForm.category,
        stock: Number(newProductForm.stock) || 10,
        images: validImages,
        tags: newProductForm.tags ? newProductForm.tags.split(',').map((t) => t.trim()) : ['deodap', 'dropship'],
        isFeatured: newProductForm.isFeatured,
        sourcePlatform: 'deodap',
        isDropshipped: true,
      };

      const res = await api.post('/products', payload);
      if (res.data?.success) {
        success('Product successfully added to catalog!');
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

  // Handle DeoDap CSV Upload & Synchronization
  const handleUploadCsv = async (e) => {
    e.preventDefault();
    if (!csvFile) {
      error('Please select a CSV file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('profitMarginPercent', csvProfitMargin);
    formData.append('deliveryCharge', csvDeliveryCharge);
    formData.append('defaultStock', csvDefaultStock);
    formData.append('updateExisting', csvUpdateExisting);

    try {
      setCsvUploading(true);
      setCsvResult(null);
      info('Parsing DeoDap CSV and updating database...');

      const res = await api.post('/deodap/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        success(res.data.message || 'DeoDap products imported successfully!');
        setCsvResult(res.data.data);
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
      error(err.response?.data?.message || 'Failed to process DeoDap CSV');
    } finally {
      setCsvUploading(false);
    }
  };

  // Generate and download sample DeoDap CSV template
  const handleDownloadSampleCsv = () => {
    const sampleHeaders = [
      'Handle',
      'Title',
      'Body (HTML)',
      'Product Category',
      'Type',
      'Tags',
      'Variant SKU',
      'Variant Price',
      'Variant Compare At Price',
      'Variant Inventory Qty',
      'Image Src',
    ];

    const sampleRow1 = [
      '0399_swim_goggles',
      'Swimming Goggles with Ear & Nose Plugs, Adjustable, Anti-Fog & Waterproof',
      '<p>Leak-proof swim goggles with cushioned double seal design.</p>',
      'Sports & Outdoors',
      'Fitness Gear',
      'swim, goggles, fitness',
      '0399_swim_goggles',
      '66',
      '299',
      '45',
      'https://cdn.shopify.com/s/files/1/0782/3284/6646/products/02_41272156-14fc-4918-b226-1cd77257d90c.jpg',
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [sampleHeaders.join(','), sampleRow1.map((f) => `"${f.replace(/"/g, '""')}"`).join(',')].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'deodap_wholesale_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenEditModal = (p) => {
    setSelectedProduct(p);
    setEditTitle(p.title);
    setEditPrice(p.price || 0);
    setEditSourcePrice(p.sourcePrice || 0);
    setEditStock(p.stock || 0);
    setEditCategory(p.category || 'Electronics');
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
      setTotalProducts((prev) => Math.max(0, prev - 1));
      success(`"${name}" removed from catalog`);
    } catch (err) {
      error('Failed to remove product');
    }
  };

  const categoryColors = {
    Electronics: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Home & Kitchen': 'bg-amber-50 text-amber-700 border-amber-200',
    Toys: 'bg-purple-50 text-purple-700 border-purple-200',
    Beauty: 'bg-rose-50 text-rose-700 border-rose-200',
    Fitness: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Fashion: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
    Automotive: 'bg-slate-100 text-slate-800 border-slate-300',
    General: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <AdminLayout
      title="DeoDap Wholesale Dropship Catalog"
      subtitle="Import, auto-markup (+30% + 30 delivery), and manage DeoDap products directly for customer orders"
      onRefresh={fetchProducts}
    >
      <div className="space-y-6 animate-fadeIn pb-12 font-sans">
        {/* HERO BANNER */}
        <div className="bg-gradient-to-r from-[#071d42] via-[#0c2a5e] to-[#153e85] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner flex-shrink-0">
                <Package className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">DeoDap Dropship Catalog &amp; CSV Sourcing</h2>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Admin Controlled
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl leading-relaxed">
                  Bulk import DeoDap wholesale products using standard Shopify CSV exports. Selling price is automatically marked up (+30% + 30 delivery) and rendered with Free Delivery for customers.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
              <Link
                to="/admin/vendor-products"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/90 hover:text-white border border-white/15 backdrop-blur-md transition text-xs font-bold"
              >
                <Store className="w-4 h-4 text-purple-300" />
                <span>Vendor Products</span>
              </Link>

              <button
                onClick={() => {
                  setCsvFile(null);
                  setCsvResult(null);
                  setCsvModalOpen(true);
                }}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-bold text-xs shadow-lg backdrop-blur-md active:scale-98 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span>Upload DeoDap CSV</span>
              </button>

              <button
                onClick={() => setAddModalOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-400/25 active:scale-98 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Add Product</span>
              </button>
            </div>
          </div>
        </div>

        {/* RESPONSIVE FILTER & SEARCH BAR */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, SKU, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Sourcing Categories</option>
                <option value="Home & Kitchen">Home & Kitchen</option>
                <option value="Electronics">Electronics</option>
                <option value="Beauty">Beauty & Personal Care</option>
                <option value="Toys">Toys & Baby</option>
                <option value="Fitness">Fitness & Sports</option>
                <option value="Fashion">Fashion & Jewelry</option>
                <option value="Automotive">Automotive & Tools</option>
              </select>
            </div>

            {/* Stock status */}
            <div>
              <select
                value={selectedStockFilter}
                onChange={(e) => {
                  setSelectedStockFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Inventory Status</option>
                <option value="in_stock">In Stock (&gt;0)</option>
                <option value="out_of_stock">Out of Stock (0)</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="newest">Sort: Newly Imported</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="stock-low">Stock: Low Inventory First</option>
              </select>
            </div>
          </div>
        </div>

        {/* RESPONSIVE MODERN PRODUCT CARDS GRID (WITH LAZY LOADING) */}
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
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">No DeoDap Products in Catalog</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Upload your DeoDap CSV file to import products with automatic +30% markup and 30 delivery charge included.
              </p>
            </div>
            <button
              onClick={() => {
                setCsvFile(null);
                setCsvResult(null);
                setCsvModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition"
            >
              <Upload className="w-4 h-4" />
              <span>Import DeoDap CSV Now</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <div
                key={p._id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-blue-200 transition group flex flex-col justify-between"
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

                    <span
                      className={`absolute top-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-md ${
                        categoryColors[p.category] || 'bg-white/90 text-slate-700 border-slate-200'
                      }`}
                    >
                      {p.category || 'DeoDap'}
                    </span>

                    <span className="absolute bottom-2.5 left-2.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-2xs">
                      Free Delivery
                    </span>

                    {p.stock <= 5 && (
                      <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500 text-white">
                        {p.stock === 0 ? 'Out of Stock' : `Low: ${p.stock}`}
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    {p.sku && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold inline-block">
                        {p.sku}
                      </span>
                    )}

                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug" title={p.title}>
                      {p.title}
                    </h4>

                    {/* Price Breakdown */}
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-medium">CSV Cost:</span>
                        <span className="font-mono font-bold text-slate-700">
                          {(p.sourcePrice || p.costPrice || 0)?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 font-bold">Selling Price:</span>
                        <span className="font-mono font-black text-slate-900">
                          {p.price?.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-emerald-600 font-bold pt-0.5 border-t border-slate-200/60">
                        <span>Margin (+30% + 30):</span>
                        <span>+{(p.profitMargin || 0)?.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="px-3.5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/product/${p._id}`}
                      target="_blank"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white transition"
                      title="View Product Page"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/admin/products/analytics/${p._id}`}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-[11px] font-bold transition cursor-pointer"
                      title="View Sales, Buyers & Order Analytics"
                    >
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>Report</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      to={`/admin/products/edit/${p._id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#0c2a5e] text-slate-700 hover:text-white text-[11px] font-bold transition cursor-pointer"
                      title="Edit All CSV Columns & Details on Dedicated Page"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(p._id, p.title)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Showing page <b className="text-slate-800">{page}</b> of <b className="text-slate-800">{totalPages}</b> ({totalProducts} total items)
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
                        page === num ? 'bg-[#0c2a5e] text-white shadow-2xs' : 'text-slate-600 hover:bg-slate-100'
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

        {/* MODAL 1: DeoDap CSV Upload */}
        {csvModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col custom-scrollbar overflow-hidden">
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">Import DeoDap Wholesale CSV</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500">Auto-applies markup &amp; delivery charge</p>
                  </div>
                </div>
                <button
                  onClick={() => setCsvModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto custom-scrollbar pr-1 sm:pr-2 pt-4 space-y-4 flex-1">
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      Standard Shopify / DeoDap Columns Supported
                    </span>
                    <p className="text-[11px] text-emerald-700 leading-snug">
                      Stores all columns into database and calculates customer selling price with Free Delivery.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadSampleCsv}
                    className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-white text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-100/50 transition cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Sample CSV</span>
                  </button>
                </div>

                <form id="csv-upload-form" onSubmit={handleUploadCsv} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Select DeoDap CSV File *</label>
                    <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/70 hover:bg-emerald-50/30 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition text-center group">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white shadow-2xs border border-slate-200 group-hover:border-emerald-300 flex items-center justify-center text-slate-500 group-hover:text-emerald-600 transition">
                        <UploadCloud className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      {csvFile ? (
                        <div className="px-2">
                          <div className="text-xs font-black text-emerald-700 break-all">{csvFile.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {(csvFile.size / 1024).toFixed(1)} KB • Click to choose different file
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-xs font-bold text-slate-700">Click to browse or drag &amp; drop CSV</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">Supports .csv exported from DeoDap / Shopify</div>
                        </div>
                      )}
                      <input
                        type="file"
                        accept=".csv,text/csv,application/vnd.ms-excel"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setCsvFile(e.target.files[0]);
                            setCsvResult(null);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Profit Margin Markup <span className="text-emerald-600 font-mono font-black">(x %)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="500"
                        value={csvProfitMargin}
                        onChange={(e) => setCsvProfitMargin(e.target.value)}
                        placeholder="e.g. 30"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono transition"
                      />
                      <span className="text-[10px] text-slate-400">Adds {csvProfitMargin || 0}% of CSV wholesale cost</span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">
                        Delivery Charge Included <span className="text-emerald-600 font-mono font-black">(y rupees)</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={csvDeliveryCharge}
                        onChange={(e) => setCsvDeliveryCharge(e.target.value)}
                        placeholder="e.g. 30"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-500 font-mono transition"
                      />
                      <span className="text-[10px] text-slate-400">Adds {csvDeliveryCharge || 0} rupees to price for free delivery</span>
                    </div>
                  </div>

                  {/* Formula Preview Helper */}
                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs font-mono text-emerald-900 flex items-center justify-between">
                    <span>Formula:</span>
                    <span className="font-bold">
                      Selling Price = CSV Cost + {csvProfitMargin || 0}%(CSV Cost) + {csvDeliveryCharge || 0}
                    </span>
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
                    <input
                      type="checkbox"
                      checked={csvUpdateExisting}
                      onChange={(e) => setCsvUpdateExisting(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-slate-800 block">Update Existing Products</span>
                      <span className="text-slate-500 text-[11px]">
                        If product SKU or handle exists, update title, cost, selling price and stock.
                      </span>
                    </div>
                  </label>

                  {csvResult && (
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-2 animate-fadeIn">
                      <div className="flex items-center gap-2 text-emerald-900 font-black text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        DeoDap Import Completed Successfully!
                      </div>
                      <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
                        <div className="bg-white rounded-xl p-2 border border-emerald-200/60 shadow-2xs">
                          <div className="text-base font-black text-emerald-600">+{csvResult.createdCount}</div>
                          <div className="text-[10px] font-sans text-slate-500 font-semibold uppercase">Created</div>
                        </div>
                        <div className="bg-white rounded-xl p-2 border border-emerald-200/60 shadow-2xs">
                          <div className="text-base font-black text-blue-600">{csvResult.updatedCount}</div>
                          <div className="text-[10px] font-sans text-slate-500 font-semibold uppercase">Updated</div>
                        </div>
                        <div className="bg-white rounded-xl p-2 border border-emerald-200/60 shadow-2xs">
                          <div className="text-base font-black text-slate-700">{csvResult.uniqueProductsInCSV}</div>
                          <div className="text-[10px] font-sans text-slate-500 font-semibold uppercase">Unique Items</div>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3.5 border-t border-slate-100 shrink-0 mt-2">
                <button
                  type="button"
                  onClick={() => setCsvModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition text-xs cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  form="csv-upload-form"
                  disabled={!csvFile || csvUploading}
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-98 transition disabled:opacity-50 cursor-pointer"
                >
                  {csvUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing CSV...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload &amp; Save Products</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: Add Manual Product */}
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col custom-scrollbar overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">Add Dropship Product Manually</h3>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto custom-scrollbar pr-1 sm:pr-2 pt-4 flex-1">
                <form id="manual-product-form" onSubmit={handleCreateProduct} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Product Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rechargeable Electric Vegetable Chopper"
                      value={newProductForm.title}
                      onChange={(e) => setNewProductForm({ ...newProductForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Wholesale Cost</label>
                      <input
                        type="number"
                        placeholder="e.g. 150"
                        value={newProductForm.sourcePrice}
                        onChange={(e) => setNewProductForm({ ...newProductForm, sourcePrice: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Selling Price *</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 225"
                        value={newProductForm.price}
                        onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Category *</label>
                      <select
                        value={newProductForm.category}
                        onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
                      >
                        <option value="Home & Kitchen">Home & Kitchen</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Beauty">Beauty</option>
                        <option value="Toys">Toys</option>
                        <option value="Fitness">Fitness</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Automotive">Automotive</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Stock Inventory *</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={newProductForm.stock}
                        onChange={(e) => setNewProductForm({ ...newProductForm, stock: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Image URL *</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/..."
                        value={newProductForm.images[0] || ''}
                        onChange={(e) => setNewProductForm({ ...newProductForm, images: [e.target.value] })}
                        className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                      />
                      <label className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer transition flex items-center justify-center gap-1.5 shrink-0">
                        <UploadCloud className="w-4 h-4" />
                        <span>{uploadingImage ? '...' : 'Upload'}</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                </form>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 shrink-0 mt-2">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="manual-product-form"
                  disabled={submittingProduct}
                  className="px-5 py-2.5 rounded-xl bg-[#0c2a5e] hover:bg-[#091f44] text-white font-bold text-xs shadow-md disabled:opacity-50 transition cursor-pointer"
                >
                  {submittingProduct ? 'Saving...' : 'Add to Catalog'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: Quick Edit */}
        {editModalOpen && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl sm:rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col custom-scrollbar overflow-hidden space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <h3 className="text-base font-black text-slate-900">Edit DeoDap Product</h3>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto custom-scrollbar pr-1 flex-1">
                <form id="edit-product-form" onSubmit={handleSaveIndividualProduct} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Title</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Wholesale Cost</label>
                      <input
                        type="number"
                        value={editSourcePrice}
                        onChange={(e) => setEditSourcePrice(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Selling Price</label>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Stock Inventory</label>
                      <input
                        type="number"
                        min={0}
                        value={editStock}
                        onChange={(e) => setEditStock(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Category</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
                      >
                        <option value="Home & Kitchen">Home & Kitchen</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Beauty">Beauty</option>
                        <option value="Toys">Toys</option>
                        <option value="Fitness">Fitness</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Automotive">Automotive</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 shrink-0 mt-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-product-form"
                  disabled={savingProduct}
                  className="px-5 py-2 rounded-xl bg-[#0c2a5e] hover:bg-[#091f44] text-white font-bold text-xs shadow-sm disabled:opacity-50 cursor-pointer transition"
                >
                  {savingProduct ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
