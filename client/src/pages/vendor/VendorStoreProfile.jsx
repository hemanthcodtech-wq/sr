import React, { useState, useEffect, useRef } from 'react';
import {
  Store,
  Building,
  CreditCard,
  MapPin,
  Phone,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  User,
  ArrowRight,
  Sparkles,
  Camera,
  Image as ImageIcon,
  UploadCloud,
  Check,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import VendorLayout from '../../components/vendor/VendorLayout';
import { PageLoader } from '../../components/LoadingScreen';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const STORE_CATEGORIES = [
  'General',
  'Fashion',
  'Electronics',
  'Footwear',
  'Home & Kitchen',
  'Beauty',
  'Handicrafts',
  'Grocery',
];

const VendorStoreProfile = () => {
  const { success, error, info } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeData, setStoreData] = useState(null);

  // Cloudinary upload states
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const bannerInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const [formData, setFormData] = useState({
    storeName: '',
    category: 'General',
    phone: '',
    description: '',
    logo: '',
    banner: '',
    address: {
      street: '',
      landmark: '',
      city: '',
      state: 'Andhra Pradesh',
      zipCode: '',
    },
    bankDetails: {
      accountHolder: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      upiId: '',
    },
  });

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const res = await api.get('/vendors/my-store');
      if (res.data?.success) {
        setStoreData(res.data);
        const s = res.data.store;
        if (s) {
          setFormData({
            storeName: s.storeName || '',
            category: s.category || 'General',
            phone: s.phone || '',
            description: s.description || '',
            logo: s.logo || '',
            banner: s.banner || '',
            address: {
              street: s.address?.street || '',
              landmark: s.address?.landmark || '',
              city: s.address?.city || '',
              state: s.address?.state || 'Andhra Pradesh',
              zipCode: s.address?.zipCode || '',
            },
            bankDetails: {
              accountHolder: s.bankDetails?.accountHolder || '',
              bankName: s.bankDetails?.bankName || '',
              accountNumber: s.bankDetails?.accountNumber || '',
              ifscCode: s.bankDetails?.ifscCode || '',
              upiId: s.bankDetails?.upiId || '',
            },
          });
        }
      }
    } catch (err) {
      console.error('Failed to load store profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Please select a valid image file (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      error('Image size must be less than 8MB');
      return;
    }

    const data = new FormData();
    data.append('image', file);

    if (type === 'banner') setUploadingBanner(true);
    if (type === 'logo') setUploadingLogo(true);

    try {
      info(`Uploading ${type} to Cloudinary...`);
      const res = await api.post('/products/upload-image', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.url) {
        setFormData((prev) => ({
          ...prev,
          [type]: res.data.url,
        }));
        success(`${type === 'banner' ? 'Store Banner' : 'Store Logo'} uploaded to Cloudinary!`);
      } else {
        error(`Failed to upload ${type}`);
      }
    } catch (err) {
      console.error(`Upload error for ${type}:`, err);
      error(err.response?.data?.message || `Failed to upload ${type} to Cloudinary`);
    } finally {
      if (type === 'banner') setUploadingBanner(false);
      if (type === 'logo') setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.storeName.trim()) {
      error('Store name is required');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/vendors/my-store', formData);
      if (res.data?.success) {
        success('Store Profile, Banner & Bank Details saved successfully!');
        fetchStore();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update store profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <VendorLayout
        title="Store Profile & Settlement Bank"
        subtitle="Update your store details, banner branding, physical dispatch hub address, and payout bank account."
      >
        <PageLoader text="Loading store credentials & bank setup..." />
      </VendorLayout>
    );
  }

  const store = storeData?.store;

  return (
    <VendorLayout
      title="Store Profile & Settlement Bank"
      subtitle="Update your store details, banner branding, physical dispatch hub address, and payout bank account."
      actions={
        store?._id && (
          <Link
            to={`/store/${store._id}`}
            target="_blank"
            className="px-4 py-2 rounded-2xl bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition"
          >
            <span>View Public Store</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
          </Link>
        )
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
        {/* Verification Status Banner */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-white/80 border border-emerald-300/80 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="font-black text-sm text-slate-900 flex items-center gap-2">
                <span>KYC &amp; Verified Merchant Setup</span>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                  Official Merchant
                </span>
              </div>
              <p className="text-slate-600 mt-0.5">
                Bank details provided below are used exclusively by Admin for settlement transfers after delivered shipments.
              </p>
            </div>
          </div>
        </div>

        {/* 1. STORE BANNER & LOGO BRANDING (CLOUDINARY) */}
        <div className="bg-white/85 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <ImageIcon className="w-5 h-5 text-amber-500" />
              <div>
                <h2 className="text-base font-black text-slate-900">Store Banner &amp; Brand Logo</h2>
                <p className="text-xs text-slate-500 font-medium">Uploaded to Cloudinary CDN &amp; showcased on your storefront</p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Cloudinary Synced
            </span>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'banner');
            }}
          />
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileUpload(e.target.files[0], 'logo');
            }}
          />

          {/* Banner Container with Overlay Logo */}
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 group">
            {/* Banner Image */}
            <div className="h-44 sm:h-56 md:h-64 w-full relative">
              {formData.banner ? (
                <img
                  src={formData.banner}
                  alt="Store Banner"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-950 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <UploadCloud className="w-10 h-10 mb-2 text-slate-500" />
                  <span className="text-xs font-bold text-slate-300">No banner uploaded yet</span>
                  <span className="text-[11px] text-slate-500 mt-0.5">Recommended size: 1200 × 400 px</span>
                </div>
              )}

              {/* Banner Upload Button Pill */}
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="absolute top-3.5 right-3.5 px-3.5 py-2 rounded-2xl bg-white/95 hover:bg-white text-slate-800 text-xs font-bold shadow-md backdrop-blur-md border border-white/80 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {uploadingBanner ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                    <span>Uploading Banner...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-amber-500" />
                    <span>{formData.banner ? 'Change Store Banner' : 'Upload Store Banner'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Logo Avatar Positioned at bottom-left */}
            <div className="absolute bottom-3 left-4 sm:bottom-4 sm:left-6 flex items-end gap-3.5">
              <div className="relative group/logo">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 shadow-lg border-2 border-white overflow-hidden bg-slate-50">
                  <img
                    src={formData.logo || '/logo.png'}
                    onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
                    alt="Store Logo"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="absolute inset-0 bg-black/50 rounded-2xl opacity-0 group-hover/logo:opacity-100 transition flex flex-col items-center justify-center text-white text-[10px] font-bold cursor-pointer"
                  title="Upload Brand Logo"
                >
                  {uploadingLogo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mb-0.5" />
                      <span>Edit</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/80 shadow-xs mb-1">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {formData.storeName || 'Your Store Name'}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {formData.category} Merchant
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-500 font-medium pt-1">
            <span>Supported image formats: JPG, PNG, WEBP. Files are auto-optimized and delivered via Cloudinary CDN.</span>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Custom Store Logo (Square 1:1)</span>
            </button>
          </div>
        </div>

        {/* 2. STORE PROFILE & CONTACT */}
        <div className="bg-white/85 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <Store className="w-5 h-5 text-[#0c2a5e]" />
            <h2 className="text-base font-black text-slate-900">2. Store Profile &amp; Contact</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Store Name *</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                placeholder="e.g. Ramstorer Electronics"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f8a48]/30 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Store Phone *</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="10-digit mobile number"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f8a48]/30 transition"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Store Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f8a48]/30 transition cursor-pointer"
              >
                {STORE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Store Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Authorized retailer of genuine components, fashion, or lifestyle products with warranty."
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f8a48]/30 transition resize-none"
              />
            </div>
          </div>
        </div>

        {/* 3. PHYSICAL DISPATCH HUB ADDRESS */}
        <div className="bg-white/85 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-black text-slate-900">3. Physical Dispatch Hub Address</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Street / Shop Address *</label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) =>
                  setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })
                }
                placeholder="Shop 14, Commercial Market Complex, Main Bazaar"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f8a48]/30 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">City / Town *</label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) =>
                  setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })
                }
                placeholder="e.g. Hyderabad / Bhimavaram"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f8a48]/30 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">State *</label>
              <input
                type="text"
                value={formData.address.state}
                onChange={(e) =>
                  setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })
                }
                placeholder="e.g. Andhra Pradesh / Telangana"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f8a48]/30 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Postal Pin Code *</label>
              <input
                type="text"
                value={formData.address.zipCode}
                onChange={(e) =>
                  setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })
                }
                placeholder="6-digit pincode"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f8a48]/30 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Landmark (Optional)</label>
              <input
                type="text"
                value={formData.address.landmark}
                onChange={(e) =>
                  setFormData({ ...formData, address: { ...formData.address, landmark: e.target.value } })
                }
                placeholder="Near Clock Tower"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f8a48]/30 transition"
              />
            </div>
          </div>
        </div>

        {/* 4. SETTLEMENT BANK ACCOUNT DETAILS */}
        <div className="bg-white/85 backdrop-blur-xl p-6 sm:p-7 rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <CreditCard className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-black text-slate-900">4. Settlement Bank Account Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Account Holder Name *</label>
              <input
                type="text"
                value={formData.bankDetails.accountHolder}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, accountHolder: e.target.value },
                  })
                }
                placeholder="e.g. Rama Raju K"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f8a48]/30 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Bank Name *</label>
              <input
                type="text"
                value={formData.bankDetails.bankName}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, bankName: e.target.value },
                  })
                }
                placeholder="e.g. State Bank of India"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f8a48]/30 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Account Number *</label>
              <input
                type="text"
                value={formData.bankDetails.accountNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, accountNumber: e.target.value },
                  })
                }
                placeholder="Bank account number"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f8a48]/30 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">IFSC Code *</label>
              <input
                type="text"
                value={formData.bankDetails.ifscCode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, ifscCode: e.target.value.toUpperCase() },
                  })
                }
                placeholder="e.g. SBIN0001234"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 uppercase focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f8a48]/30 transition font-mono"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">UPI ID / VPA (Optional)</label>
              <input
                type="text"
                value={formData.bankDetails.upiId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bankDetails: { ...formData.bankDetails, upiId: e.target.value },
                  })
                }
                placeholder="e.g. vendor@okhdfcbank"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f8a48]/30 transition"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/vendor/dashboard"
            className="px-5 py-2.5 rounded-2xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || uploadingBanner || uploadingLogo}
            className="px-6 py-2.5 rounded-2xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Store Details'}</span>
          </button>
        </div>
      </form>
    </VendorLayout>
  );
};

export default VendorStoreProfile;
