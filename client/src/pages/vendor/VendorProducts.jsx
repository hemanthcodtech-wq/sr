import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Search & Filter
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

  useEffect(() => {
    fetchProducts();
  }, []);

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
      title="Store Products & Inventory"
      subtitle="Publish product listings with multiple Cloudinary images, manage pricing, promotions & stock"
      actions={
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      }
    >
      <div className="space-y-6">
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
                          {discountPercent && (
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
                  : 'Add items with multiple Cloudinary images, pricing, and stock to start selling on Amezon.'}
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

        {/* =====================================================================
            ADD / EDIT PRODUCT MODAL (MULTIPLE CLOUDINARY IMAGES SUPPORT)
           ===================================================================== */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white/95 backdrop-blur-2xl max-w-3xl w-full p-6 sm:p-8 rounded-3xl border border-white/80 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-[#0c2a5e]">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      {editingProduct ? 'Edit Product Listing' : 'Publish New Product to Catalog'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Upload multiple high-resolution product photos and set inventory parameters
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-5 text-xs">
                {/* Title */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Product Title *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="e.g. Sony WH-1000XM5 Noise Cancelling Headphones"
                    value={formData.title}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                  />
                </div>

                {/* Category & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Department / Category *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    >
                      {categories.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Stock / Inventory Units *</label>
                    <input
                      type="number"
                      name="stock"
                      required
                      min={0}
                      value={formData.stock}
                      onChange={handleFormChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                </div>

                {/* Pricing: MRP and Discount Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Original MRP (₹) *</label>
                    <input
                      type="number"
                      name="price"
                      required
                      min={1}
                      placeholder="e.g. 2999"
                      value={formData.price}
                      onChange={handleFormChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">
                      Discounted Selling Price (₹) <span className="font-normal text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      name="discountPrice"
                      min={0}
                      placeholder="e.g. 2499"
                      value={formData.discountPrice}
                      onChange={handleFormChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Product Description &amp; Specifications *</label>
                  <textarea
                    name="description"
                    required
                    rows={3}
                    placeholder="Describe key features, box contents, manufacturer warranty, and material specs..."
                    value={formData.description}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                  />
                </div>

                {/* Multiple Images Upload via Cloudinary */}
                <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-b from-blue-50/50 to-slate-50 border border-blue-200/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-slate-800 text-xs block">
                        Product Gallery Images (Stored in Cloudinary) *
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Upload multiple photos. The first image will be used as the primary storefront thumbnail.
                      </p>
                    </div>
                    {uploadingImages && (
                      <span className="text-blue-700 font-bold text-[11px] flex items-center gap-1.5 animate-pulse">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Uploading to Cloudinary...</span>
                      </span>
                    )}
                  </div>

                  {/* Thumbnail Preview Grid */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
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
                            className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer shadow-xs"
                            title="Remove image"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Trigger Input */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <label className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-2xs">
                      <Upload className="w-4 h-4 text-blue-600" />
                      <span>{formData.images.length > 0 ? '+ Upload More Photos' : 'Select Product Photos (Multiple)'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        disabled={uploadingImages}
                        onChange={handleMultipleImagesChange}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Supports JPG, PNG, WEBP (up to 8 images per product, max 10MB each)
                    </span>
                  </div>
                </div>

                {/* Promotion Toggle: Feature on Homepage */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label htmlFor="is-featured-chk" className="font-extrabold text-amber-950 flex items-center gap-1.5 cursor-pointer">
                      <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
                      <span>Promote as Featured Deal Item</span>
                    </label>
                    <p className="text-[11px] text-slate-600">
                      Featured products are showcased on the Amezon marketplace homepage deal carousels.
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

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || uploadingImages}
                    className="px-7 py-2.5 bg-gradient-to-r from-[#0c2a5e] to-[#174896] hover:from-[#092048] hover:to-[#123875] text-white font-black rounded-xl shadow-md transition cursor-pointer disabled:bg-slate-400"
                  >
                    {submitting ? 'Saving to Database...' : editingProduct ? 'Save Changes' : 'Publish Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
};

export default VendorProducts;
