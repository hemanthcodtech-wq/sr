import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit3,
  Eye,
  CheckCircle2,
  XCircle,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Layers,
  ArrowRight,
  RefreshCw,
  Sliders,
  Check,
  X,
  AlertCircle,
  Flame,
  Tag,
  Link2,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const QUICK_LINKS = [
  { label: 'All Products', path: '/products' },
  { label: 'Electronics', path: '/products?category=Electronics' },
  { label: 'Fashion', path: '/products?category=Fashion' },
  { label: 'Footwear', path: '/products?category=Footwear' },
  { label: 'Home & Kitchen', path: '/products?category=Home%20%26%20Kitchen' },
  { label: 'Beauty', path: '/products?category=Beauty' },
  { label: 'Featured Stores', path: '/stores' },
  { label: "Today's Deals", path: '/products?tag=Deals' },
];

const THEMES = [
  { id: 'gold', name: 'Festive Gold', bg: 'from-amber-500 via-amber-400 to-yellow-300', text: 'text-amber-950' },
  { id: 'blue', name: 'Tech Blue', bg: 'from-blue-600 via-indigo-500 to-sky-400', text: 'text-white' },
  { id: 'emerald', name: 'Emerald Green', bg: 'from-emerald-700 via-emerald-600 to-teal-500', text: 'text-white' },
  { id: 'rose', name: 'Ruby Rose', bg: 'from-rose-600 via-pink-600 to-rose-400', text: 'text-white' },
  { id: 'dark', name: 'Midnight Dark', bg: 'from-slate-900 via-slate-800 to-indigo-950', text: 'text-white' },
];

const AdminBanners = () => {
  const { showToast } = useToast();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // File upload state
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badge: 'FESTIVE MEGA OFFER',
    link: '/products',
    ctaText: 'SHOP NOW',
    order: 0,
    isActive: true,
    theme: 'gold',
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await api.get('/banners/admin');
      if (res.data?.success) {
        setBanners(res.data.banners || []);
      }
    } catch (err) {
      console.error('Failed to load banners:', err);
      showToast('Failed to load banners. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Handle file select
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WEBP).', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image file size must be less than 10MB.', 'error');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreviewUrl(objectUrl);
  };

  const handleOpenAddModal = () => {
    setEditingBanner(null);
    setSelectedFile(null);
    setImagePreviewUrl('');
    setFormData({
      title: '',
      subtitle: '',
      badge: 'FESTIVE MEGA OFFER',
      link: '/products',
      ctaText: 'SHOP NOW',
      order: banners.length,
      isActive: true,
      theme: 'gold',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (banner) => {
    setEditingBanner(banner);
    setSelectedFile(null);
    setImagePreviewUrl(banner.imageUrl);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      badge: banner.badge || '',
      link: banner.link || '/products',
      ctaText: banner.ctaText || 'SHOP NOW',
      order: banner.order || 0,
      isActive: banner.isActive !== false,
      theme: banner.theme || 'gold',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editingBanner && !selectedFile && !imagePreviewUrl) {
      showToast('Please choose a banner image to upload to Cloudinary.', 'warning');
      return;
    }

    try {
      setUploading(true);
      const formPayload = new FormData();
      if (selectedFile) {
        formPayload.append('image', selectedFile);
      }
      formPayload.append('title', formData.title);
      formPayload.append('subtitle', formData.subtitle);
      formPayload.append('badge', formData.badge);
      formPayload.append('link', formData.link);
      formPayload.append('ctaText', formData.ctaText);
      formPayload.append('order', String(formData.order));
      formPayload.append('isActive', String(formData.isActive));
      formPayload.append('theme', formData.theme);

      if (editingBanner) {
        // Update existing banner
        const res = await api.put(`/banners/${editingBanner._id}`, formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data?.success) {
          showToast('Hero banner updated and saved to Cloudinary!', 'success');
          setModalOpen(false);
          fetchBanners();
        }
      } else {
        // Create new banner
        const res = await api.post('/banners', formPayload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        if (res.data?.success) {
          showToast('Hero banner uploaded to Cloudinary successfully!', 'success');
          setModalOpen(false);
          fetchBanners();
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      showToast(err.response?.data?.message || 'Failed to upload banner to Cloudinary.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      const res = await api.patch(`/banners/${banner._id}/toggle`);
      if (res.data?.success) {
        showToast(res.data.message || 'Banner status updated', 'success');
        setBanners((prev) =>
          prev.map((b) => (b._id === banner._id ? { ...b, isActive: !b.isActive } : b))
        );
      }
    } catch (err) {
      showToast('Failed to toggle banner status', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/banners/${id}`);
      if (res.data?.success) {
        showToast('Banner deleted and removed from Cloudinary.', 'success');
        setDeleteConfirmId(null);
        setBanners((prev) => prev.filter((b) => b._id !== id));
      }
    } catch (err) {
      showToast('Failed to delete banner', 'error');
    }
  };

  const activeBanners = banners.filter((b) => b.isActive);

  return (
    <AdminLayout
      title="Hero Carousel & Banners"
      subtitle="Upload high-res promotional slides to Cloudinary and control homepage carousel visibility."
      onRefresh={fetchBanners}
    >
      <div className="space-y-6">
        {/* Top Metric Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Slides
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {banners.length}
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active on Homepage
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
                {activeBanners.length}
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Cloudinary Synced
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">
                {banners.filter((b) => b.cloudinaryId || b.imageUrl?.includes('cloudinary')).length}
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <UploadCloud className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Homepage Preview
            </span>
            <Link
              to="/"
              target="_blank"
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition shadow-2xs"
            >
              <span>View Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Action Header */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Carousel Slides Manager</span>
            </h3>
            <p className="text-xs text-slate-500">
              Drag or upload images. When uploaded, pictures are stored directly in Cloudinary cloud storage and rendered live in the homepage hero section.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchBanners}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition cursor-pointer"
              title="Refresh Slides"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/15 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Carousel Banner</span>
            </button>
          </div>
        </div>

        {/* Live Carousel Preview Card (If slides exist) */}
        {activeBanners.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Live Homepage Carousel Preview ({previewSlideIndex + 1} of {activeBanners.length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setPreviewSlideIndex((prev) =>
                      prev === 0 ? activeBanners.length - 1 : prev - 1
                    )
                  }
                  className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    setPreviewSlideIndex((prev) => (prev + 1) % activeBanners.length)
                  }
                  className="w-8 h-8 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Simulated Banner Container */}
            {activeBanners[previewSlideIndex] && (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 aspect-[21/9] sm:aspect-[24/8] max-h-[360px] shadow-sm flex items-center group">
                <img
                  src={activeBanners[previewSlideIndex].imageUrl}
                  alt={activeBanners[previewSlideIndex].title || 'Banner'}
                  className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent" />

                {/* Overlay Text Details if configured */}
                <div className="relative z-10 p-6 sm:p-10 max-w-xl text-white space-y-2">
                  {activeBanners[previewSlideIndex].badge && (
                    <span className="inline-block px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                      ✦ {activeBanners[previewSlideIndex].badge} ✦
                    </span>
                  )}
                  {activeBanners[previewSlideIndex].title && (
                    <h2 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight drop-shadow-md">
                      {activeBanners[previewSlideIndex].title}
                    </h2>
                  )}
                  {activeBanners[previewSlideIndex].subtitle && (
                    <p className="text-xs sm:text-sm text-slate-200 font-medium line-clamp-2">
                      {activeBanners[previewSlideIndex].subtitle}
                    </p>
                  )}
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-md">
                      <span>{activeBanners[previewSlideIndex].ctaText || 'SHOP NOW'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Banners Grid / List */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading Cloudinary carousel banners...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">No Custom Carousel Banners Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Currently the homepage displays default festive fallback banners. Upload your first custom promotional slide to Cloudinary to display it on the store!
              </p>
            </div>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload First Banner to Cloudinary</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {banners.map((banner, index) => (
              <div
                key={banner._id}
                className={`bg-white rounded-3xl border overflow-hidden transition-all duration-300 shadow-2xs flex flex-col justify-between ${
                  banner.isActive
                    ? 'border-slate-200 hover:border-emerald-500/50 hover:shadow-md'
                    : 'border-slate-200/60 opacity-70 bg-slate-50/50'
                }`}
              >
                <div>
                  {/* Banner Image Preview Container */}
                  <div className="relative aspect-[16/9] w-full bg-slate-900 overflow-hidden">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || 'Slide'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Active Status Badge */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 ${
                          banner.isActive
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {banner.isActive ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            Active on Home
                          </>
                        ) : (
                          'Draft / Inactive'
                        )}
                      </span>
                    </div>

                    {/* Order Pill */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono font-bold">
                        #{banner.order ?? index}
                      </span>
                    </div>

                    {/* Cloudinary Indicator */}
                    {banner.cloudinaryId && (
                      <div className="absolute bottom-2 right-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-600/90 text-white text-[9px] font-bold flex items-center gap-1">
                          <UploadCloud className="w-2.5 h-2.5" />
                          Cloudinary
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Banner Info */}
                  <div className="p-5 space-y-2.5">
                    {banner.badge && (
                      <span className="text-[10px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block">
                        {banner.badge}
                      </span>
                    )}

                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1">
                      {banner.title || 'Promotional Banner'}
                    </h4>

                    {banner.subtitle && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {banner.subtitle}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-600">
                      <Link2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate font-mono font-semibold">{banner.link || '/products'}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 bg-slate-50/50">
                  {/* Status Toggle Button */}
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                      banner.isActive
                        ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {banner.isActive ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5" />
                        <span>Inactive</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(banner)}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-white text-slate-600 hover:text-slate-900 transition cursor-pointer"
                      title="Edit Slide"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(banner._id)}
                      className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                      title="Delete from Cloudinary"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* UPLOAD / EDIT MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-fadeIn my-8">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {editingBanner ? 'Edit Carousel Banner' : 'Upload Hero Carousel Banner'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Images are uploaded directly to Cloudinary and displayed in the homepage slider.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Image Upload Drop Area */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Banner Graphic Image <span className="text-rose-500">*</span>
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {imagePreviewUrl ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 aspect-[21/9] bg-slate-950 group">
                      <img
                        src={imagePreviewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-md hover:bg-slate-100 transition cursor-pointer"
                        >
                          Change Image
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setImagePreviewUrl('');
                          }}
                          className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md hover:bg-rose-700 transition cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                      <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        {selectedFile ? 'Ready to upload to Cloudinary' : 'Current Cloudinary Image'}
                      </span>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition hover:bg-emerald-50/20 group"
                    >
                      <UploadCloud className="w-10 h-10 text-slate-400 group-hover:text-emerald-600 transition-colors mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-800">
                        Click to select banner graphic (or drag and drop)
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Recommended size: 1600 × 600 or 1920 × 700 (JPG, PNG, WEBP, max 10MB)
                      </p>
                    </div>
                  )}
                </div>

                {/* Slide Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Badge Pill (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. FESTIVE MEGA OFFER"
                      value={formData.badge}
                      onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Display Order #
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Main Headline Title (Optional overlay)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dhanteras & Diwali Mega Sale"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Subtitle / Description (Optional overlay)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Flat 50% Off on Selected Collections & Direct Factory Vendors"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>

                {/* Target Link & CTA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Target Link Destination <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="/products?category=Electronics"
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500 font-mono"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Button Text (CTA)
                    </label>
                    <input
                      type="text"
                      placeholder="SHOP NOW"
                      value={formData.ctaText}
                      onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Quick Link Presets */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 block">
                    Quick Preset Links:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_LINKS.map((preset) => (
                      <button
                        type="button"
                        key={preset.path}
                        onClick={() => setFormData({ ...formData, link: preset.path })}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                          formData.link === preset.path
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Checkbox */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Publish immediately to Homepage Carousel
                    </span>
                  </label>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={uploading}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Uploading to Cloudinary...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>{editingBanner ? 'Save Changes' : 'Upload to Cloudinary'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-slate-900">Delete Carousel Slide?</h3>
                <p className="text-xs text-slate-500">
                  This will remove the slide from the homepage carousel and permanently delete the image from your Cloudinary storage account.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBanners;

