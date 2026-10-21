import React, { useState, useEffect } from 'react';
import {
  Plus,
  Package,
  Edit2,
  Trash2,
  Image,
  Upload,
  Check,
  X,
  AlertCircle,
  Tag,
  ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import VendorLayout from '../../components/vendor/VendorLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const categories = ['Electronics', 'Fashion', 'Footwear', 'Accessories', 'General'];

const VendorProducts = () => {
  const { success, error, info } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    discountPrice: '',
    category: 'Electronics',
    stock: 10,
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'],
    tags: '',
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products/vendor/mine');
      if (res.data.success) {
        setProducts(res.data.products);
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
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'],
      tags: '',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice || '',
      category: product.category,
      stock: product.stock,
      images: product.images || [],
      tags: product.tags ? product.tags.join(', ') : '',
    });
    setModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Upload image to Cloudinary endpoint
  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);

    setUploadingImage(true);
    try {
      const res = await api.post('/products/upload-image', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setFormData((prev) => ({
          ...prev,
          images: [res.data.url, ...prev.images.slice(0, 3)],
        }));
        success('Product image uploaded successfully!');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.price || !formData.description) {
      error('Please fill in product title, price, and description');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : 0,
        stock: Number(formData.stock),
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : [],
      };

      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct._id}`, payload);
        if (res.data.success) {
          success('Product updated successfully!');
          fetchProducts();
          setModalOpen(false);
        }
      } else {
        const res = await api.post('/products', payload);
        if (res.data.success) {
          success('Product published to catalog successfully!');
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
      if (res.data.success) {
        success(`Product "${title}" deleted`);
        setProducts((prev) => prev.filter((p) => p._id !== id));
      }
    } catch (err) {
      error('Failed to delete product');
    }
  };

  return (
    <VendorLayout
      title="Store Products & Inventory"
      subtitle="Manage catalog listings, pricing, discounts, and inventory counts"
      actions={
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      }
    >
      <div className="space-y-6">

      {/* Product List Table / Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bright-card h-64 rounded-2xl animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="bright-card rounded-2xl overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Product Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price / Discount</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((prod) => (
                  <tr key={prod._id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80'}
                          alt={prod.title}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                        />
                        <div>
                          <div className="font-bold text-sm text-slate-900 line-clamp-1">{prod.title}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{prod.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {prod.category}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900">₹{prod.price?.toLocaleString('en-IN')}</div>
                      {prod.discountPrice > 0 && prod.discountPrice < prod.price && (
                        <div className="text-[11px] text-rose-600 font-bold">
                          Discount: ₹{prod.discountPrice?.toLocaleString('en-IN')}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`font-bold px-2.5 py-1 rounded-full text-[11px] ${
                        prod.stock > 5 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {prod.stock} units
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          aria-label="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(prod._id, prod.title)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bright-card p-12 text-center rounded-2xl space-y-4">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Your store has no listed products</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add items with images, pricing, and stock to start generating customer orders.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="px-5 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Create First Product
          </button>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bright-card max-w-2xl w-full p-6 sm:p-8 rounded-3xl border-slate-200 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900">
                {editingProduct ? 'Edit Product Listing' : 'Publish New Product'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Product Title *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="e.g. Wireless Ergonomic Gaming Mouse"
                  value={formData.title}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Stock Quantity *</label>
                  <input
                    type="number"
                    name="stock"
                    required
                    min={0}
                    value={formData.stock}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Regular Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    required
                    min={1}
                    placeholder="e.g. 2999"
                    value={formData.price}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Discounted Price (₹) (Optional)</label>
                  <input
                    type="number"
                    name="discountPrice"
                    min={0}
                    placeholder="e.g. 2499"
                    value={formData.discountPrice}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description *</label>
                <textarea
                  name="description"
                  required
                  rows={3}
                  placeholder="Detailed specifications, features, warranty, and package contents..."
                  value={formData.description}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Cloudinary Image Upload */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Product Image (Cloudinary Supported)</span>
                  {uploadingImage && <span className="text-blue-600 text-[11px] animate-pulse">Uploading to Cloudinary...</span>}
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 transition">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Upload Image File</span>
                    <input type="file" accept="image/*" onChange={handleImageFileChange} className="hidden" />
                  </label>
                  <span className="text-[11px] text-slate-400">or enter image URL below:</span>
                </div>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.images[0] || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, images: [e.target.value] }))}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="py-2.5 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:bg-slate-300"
                >
                  {submitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Publish Product'}
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
