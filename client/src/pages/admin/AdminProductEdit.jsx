import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Package,
  Layers,
  FileSpreadsheet,
  Globe,
  Tag,
  DollarSign,
  Truck,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Eye,
  Plus,
  Trash2,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Building,
  Box,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'pricing' | 'inventory' | 'seo' | 'csv' | 'images'

  // Editable Form Fields (Covering core fields + all CSV columns)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    productType: '',
    status: 'active',
    // Pricing
    costPrice: '',
    sellingPrice: '',
    discountPrice: '',
    deliveryChargeIncluded: 30,
    isFreeDelivery: true,
    profitMargin: 0,
    // Inventory & Logistics
    sku: '',
    barcode: '',
    stock: 25,
    weightGrams: 0,
    vendorName: '',
    deodapHandle: '',
    // SEO & Meta
    seoTitle: '',
    seoDescription: '',
    tags: '',
    // Images
    images: [],
    // Full CSV Key-Value pairs
    csvData: {},
  });

  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${id}`);
      const p = res.data?.product || res.data;

      if (!p) {
        error('Product not found');
        navigate('/admin/products');
        return;
      }

      setProduct(p);

      // Populate form data
      setFormData({
        title: p.title || '',
        description: p.description || '',
        category: p.category || '',
        productType: p.productType || p.csvData?.type || p.csvData?.Type || '',
        status: p.status || p.csvData?.status || p.csvData?.Status || 'active',
        costPrice: p.costPrice ?? p.sourcePrice ?? p.csvData?.costperitem ?? p.csvData?.['Cost per item'] ?? 0,
        sellingPrice: p.sellingPrice ?? p.price ?? 0,
        discountPrice: p.discountPrice ?? p.csvData?.variantcompareatprice ?? p.csvData?.['Variant Compare At Price'] ?? 0,
        deliveryChargeIncluded: p.deliveryChargeIncluded ?? 30,
        isFreeDelivery: p.isFreeDelivery !== undefined ? p.isFreeDelivery : true,
        profitMargin: p.profitMargin ?? 0,
        sku: p.sku || p.csvData?.variantsku || p.csvData?.['Variant SKU'] || '',
        barcode: p.barcode || p.csvData?.variantbarcode || p.csvData?.['Variant Barcode'] || '',
        stock: p.stock ?? 25,
        weightGrams: p.weightGrams ?? p.csvData?.variantgrams ?? p.csvData?.['Variant Grams'] ?? 0,
        vendorName: p.vendorName || p.csvData?.vendor || p.csvData?.Vendor || 'DeoDap',
        deodapHandle: p.deodapHandle || p.csvData?.handle || p.csvData?.Handle || '',
        seoTitle: p.seoTitle || p.csvData?.seotitle || p.csvData?.['SEO Title'] || '',
        seoDescription: p.seoDescription || p.csvData?.seodescription || p.csvData?.['SEO Description'] || '',
        tags: Array.isArray(p.tags) ? p.tags.join(', ') : p.tags || '',
        images: Array.isArray(p.images) ? [...p.images] : [],
        csvData: p.csvData ? { ...p.csvData } : {},
      });
    } catch (err) {
      console.error('Failed to fetch product:', err);
      error(err.response?.data?.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };

      // Auto-recalculate profit margin if costPrice or sellingPrice changed
      if (field === 'costPrice' || field === 'sellingPrice') {
        const cost = Number(field === 'costPrice' ? value : next.costPrice) || 0;
        const sell = Number(field === 'sellingPrice' ? value : next.sellingPrice) || 0;
        next.profitMargin = Math.max(0, sell - cost);
      }

      return next;
    });
  };

  const handleCsvDataChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      csvData: {
        ...prev.csvData,
        [key]: value,
      },
    }));
  };

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, newImageUrl.trim()],
    }));
    setNewImageUrl('');
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);

      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        productType: formData.productType,
        status: formData.status,
        price: Number(formData.sellingPrice) || 0,
        sellingPrice: Number(formData.sellingPrice) || 0,
        costPrice: Number(formData.costPrice) || 0,
        sourcePrice: Number(formData.costPrice) || 0,
        discountPrice: Number(formData.discountPrice) || 0,
        deliveryChargeIncluded: Number(formData.deliveryChargeIncluded) || 0,
        isFreeDelivery: !!formData.isFreeDelivery,
        profitMargin: Number(formData.profitMargin) || 0,
        sku: formData.sku,
        barcode: formData.barcode,
        stock: Number(formData.stock) || 0,
        weightGrams: Number(formData.weightGrams) || 0,
        vendorName: formData.vendorName,
        deodapHandle: formData.deodapHandle,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        images: formData.images,
        csvData: formData.csvData,
      };

      const res = await api.put(`/products/${id}`, payload);
      success('Product updated successfully!');
      if (res.data?.product) {
        setProduct(res.data.product);
      }
    } catch (err) {
      console.error('Update failed:', err);
      error(err.response?.data?.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  // Grouped CSV attributes for presentation
  const csvEntries = Object.entries(formData.csvData || {}).filter(
    ([key]) => !key.toLowerCase().includes('_id')
  );

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* Breadcrumb & Top Bar */}
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
                <span className="text-slate-800 font-bold">Edit Product</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {loading ? 'Loading Product...' : formData.title || 'Edit Product'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/product/${id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition shadow-2xs"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              <span>Live Store View</span>
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving || loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0c2a5e] hover:bg-[#091f44] text-white font-bold text-xs shadow-md shadow-blue-900/15 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save All Changes</span>
                </>
              )}
            </button>
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
            {/* Product Header Card with Live Image & Price Margin Details */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 shrink-0 relative group">
                  <img
                    src={formData.images?.[0] || '/logo.png'}
                    alt={formData.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = formData.images?.[1] || '/logo.png';
                    }}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition cursor-pointer" onClick={() => setActiveTab('images')}>
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                      SKU: {formData.sku || 'N/A'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {formData.category || 'DeoDap'}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug line-clamp-2">
                    {formData.title}
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{formData.images?.length || 0} media assets</span>
                    <span>•</span>
                    <span>Stock: <b className="text-slate-800 font-mono">{formData.stock} units</b></span>
                  </div>
                </div>
              </div>

              {/* Exact Formula & Margin Details Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4 sm:gap-6 self-stretch md:self-auto justify-around font-mono text-center">
                <div>
                  <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider block">Wholesale Cost</span>
                  <span className="text-base sm:text-lg font-black text-slate-800">
                    {Number(formData.costPrice || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] font-sans text-slate-400 block mt-0.5">As per CSV</span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <span className="text-[10px] font-sans font-bold text-emerald-600 uppercase tracking-wider block">Our Selling Price</span>
                  <span className="text-base sm:text-lg font-black text-emerald-700">
                    {Number(formData.sellingPrice || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] font-sans text-emerald-600 block mt-0.5">+30% + 30 Deliv.</span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <span className="text-[10px] font-sans font-bold text-blue-600 uppercase tracking-wider block">Admin Margin</span>
                  <span className="text-base sm:text-lg font-black text-blue-700">
                    +{Number(formData.profitMargin || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[9px] font-sans text-blue-600 block mt-0.5">Auto-Credit</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Wholesale Cost</span>
                <div className="text-xl font-black text-slate-900 mt-1 font-mono">
                  {Number(formData.costPrice || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-slate-400">From DeoDap CSV</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-2xs bg-emerald-50/20">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Selling Price</span>
                <div className="text-xl font-black text-emerald-700 mt-1 font-mono">
                  {Number(formData.sellingPrice || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">Free Delivery included</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-blue-200 shadow-2xs bg-blue-50/20">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">Net Profit Margin</span>
                <div className="text-xl font-black text-blue-700 mt-1 font-mono">
                  +{Number(formData.profitMargin || 0).toLocaleString('en-IN')}
                </div>
                <span className="text-[10px] text-blue-600 font-medium">Customer - Wholesale</span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Stock Quantity</span>
                <div className="text-xl font-black text-slate-900 mt-1 font-mono">
                  {formData.stock}
                </div>
                <span className="text-[10px] text-slate-400">Units in inventory</span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-2xs flex items-center gap-1 overflow-x-auto scrollbar-none">
              {[
                { id: 'general', label: 'General & Description', icon: Box },
                { id: 'pricing', label: 'Pricing & Delivery', icon: DollarSign },
                { id: 'inventory', label: 'Inventory & Variants', icon: Package },
                { id: 'images', label: `Product Images (${formData.images?.length || 0})`, icon: ImageIcon },
                { id: 'seo', label: 'SEO & Meta Tags', icon: Globe },
                { id: 'csv', label: `All CSV Columns (${csvEntries.length})`, icon: FileSpreadsheet },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[#0c2a5e] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: General Info */}
            {activeTab === 'general' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
                <div>
                  <h2 className="text-base font-black text-slate-900">Product Identification & Information</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Basic title, category, and catalog description</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                      >
                        <option value="Home & Kitchen">Home & Kitchen</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Beauty">Beauty</option>
                        <option value="Toys">Toys</option>
                        <option value="Fitness">Fitness</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Automotive">Automotive</option>
                        <option value="General">General</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Product Type (from CSV)</label>
                      <input
                        type="text"
                        value={formData.productType}
                        onChange={(e) => handleInputChange('productType', e.target.value)}
                        placeholder="e.g. Sports, Fitness & Outdoors"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Catalog Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                      >
                        <option value="active">Active (Visible in Store)</option>
                        <option value="draft">Draft / Inactive</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Product Description</label>
                    <textarea
                      rows={6}
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 leading-relaxed custom-scrollbar"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">DeoDap Handle / Slug</label>
                      <input
                        type="text"
                        value={formData.deodapHandle}
                        onChange={(e) => handleInputChange('deodapHandle', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Vendor Name</label>
                      <input
                        type="text"
                        value={formData.vendorName}
                        onChange={(e) => handleInputChange('vendorName', e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Pricing & Delivery */}
            {activeTab === 'pricing' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
                <div>
                  <h2 className="text-base font-black text-slate-900">Commercial Pricing & Shipping Rules</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Wholesale cost price, selling price, delivery charges, and strike-through MRP
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Wholesale Cost (Cost per item)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.costPrice}
                      onChange={(e) => handleInputChange('costPrice', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Wholesale cost from DeoDap</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-emerald-700 block">Customer Selling Price *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={formData.sellingPrice}
                      onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-xs font-mono font-bold text-emerald-900 focus:bg-white focus:outline-none focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-emerald-600">Final price shown to customer</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">MRP / Compare At Price</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.discountPrice}
                      onChange={(e) => handleInputChange('discountPrice', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Strike-through reference price</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Delivery Charge Included</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.deliveryChargeIncluded}
                      onChange={(e) => handleInputChange('deliveryChargeIncluded', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">Built into selling price</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="free-delivery-checkbox"
                      checked={formData.isFreeDelivery}
                      onChange={(e) => handleInputChange('isFreeDelivery', e.target.checked)}
                      className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
                    />
                    <label htmlFor="free-delivery-checkbox" className="cursor-pointer">
                      <span className="text-xs font-black text-slate-900 block">Free Delivery Badge</span>
                      <span className="text-[11px] text-slate-500">
                        Display "Free Delivery" to shoppers on the product page and checkout
                      </span>
                    </label>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Net Admin Margin</span>
                    <span className="text-base font-black text-blue-700 font-mono">
                      +{Number(formData.profitMargin || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Inventory & Variants */}
            {activeTab === 'inventory' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
                <div>
                  <h2 className="text-base font-black text-slate-900">Inventory & Logistics</h2>
                  <p className="text-xs text-slate-500 mt-0.5">SKU code, Barcode, Stock units, and weight measurements</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Variant SKU</label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Variant Barcode</label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => handleInputChange('barcode', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Stock Inventory (Qty)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Weight (Grams)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.weightGrams}
                      onChange={(e) => handleInputChange('weightGrams', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Images */}
            {activeTab === 'images' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
                <div>
                  <h2 className="text-base font-black text-slate-900">Product Media & Gallery</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    All image URLs aggregated from DeoDap CSV rows for this handle
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    placeholder="Add Image URL (https://cdn.shopify.com/...)"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Image</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {formData.images?.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 aspect-square shadow-2xs flex flex-col"
                    >
                      <img
                        src={img}
                        alt={`Product ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/logo.png';
                        }}
                      />
                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-mono font-bold backdrop-blur-xs">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs opacity-0 group-hover:opacity-100 transition cursor-pointer"
                        title="Delete image"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: SEO & Meta */}
            {activeTab === 'seo' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
                <div>
                  <h2 className="text-base font-black text-slate-900">SEO & Search Engine Attributes</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Metadata and comma-separated search keywords</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">SEO Title (Page Title)</label>
                    <input
                      type="text"
                      value={formData.seoTitle}
                      onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">SEO Meta Description</label>
                    <textarea
                      rows={3}
                      value={formData.seoDescription}
                      onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none custom-scrollbar"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Tags (Comma-Separated)</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => handleInputChange('tags', e.target.value)}
                      placeholder="e.g. swimming goggles, anti-fog, outdoor, waterproof"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: All Raw CSV Columns */}
            {activeTab === 'csv' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      All CSV Columns & Values
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Every single header preserved directly from your DeoDap / Shopify CSV. Edit any value below to update.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl self-start sm:self-auto">
                    {csvEntries.length} attributes stored
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {csvEntries.map(([colName, colVal]) => (
                    <div
                      key={colName}
                      className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3 space-y-1 hover:border-slate-300 transition"
                    >
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate" title={colName}>
                        {colName}
                      </label>
                      <input
                        type="text"
                        value={colVal ?? ''}
                        onChange={(e) => handleCsvDataChange(colName, e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-semibold text-slate-800 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Save Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Link
                to="/admin/products"
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition text-xs"
              >
                Cancel &amp; Return
              </Link>
              <button
                onClick={handleSubmit}
                disabled={saving || loading}
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#0c2a5e] hover:bg-[#091f44] text-white font-bold text-xs shadow-md shadow-blue-900/15 active:scale-98 transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save All Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminProductEdit;

