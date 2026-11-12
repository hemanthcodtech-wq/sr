import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Store,
  ShieldCheck,
  Star,
  Package,
  Phone,
  Mail,
  CheckCircle2,
  ShoppingCart,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Heart,
  Crown,
  Truck,
  RotateCcw,
  Sparkles,
  Share2,
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const StoreDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { success } = useToast();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  const handleShare = () => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        success('Store link copied to clipboard!');
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchStore = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/vendors/public-stores/${id}`);
        if (!isMounted) return;

        if (res.data?.success) {
          const storeData = res.data.store;
          setStore(storeData);

          const vendorId = storeData?.vendor?._id || storeData?.vendor;
          const storeId = storeData?._id;

          // If accessed via store ID or slug, seamlessly rewrite browser route to vendor ID
          if (vendorId && id !== vendorId.toString()) {
            navigate(`/stores/${vendorId}`, { replace: true });
          }

          // Show strictly only this vendor's products
          const rawProducts = res.data.products || [];
          const vendorOnlyProducts = rawProducts.filter((p) => {
            const pVendorId = (p.vendor?._id || p.vendor || '').toString();
            const pStoreId = (p.store?._id || p.store || '').toString();
            if (vendorId && pVendorId === vendorId.toString()) return true;
            if (storeId && pStoreId === storeId.toString()) return true;
            return false;
          });

          setProducts(vendorOnlyProducts);
        }
      } catch (err) {
        if (!isMounted) return;
        if (err.response?.status === 403 && err.response?.data?.isExpired) {
          setIsExpired(true);
        }
        console.error('Error fetching store details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStore();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="bright-card p-12 max-w-xl mx-auto rounded-3xl animate-pulse space-y-4">
          <div className="h-48 bg-slate-200 rounded-2xl"></div>
          <div className="h-6 bg-slate-200 rounded w-2/3 mx-auto"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4 select-none">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Store Subscription Renewal Required</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          This merchant storefront is temporarily offline while the seller completes their platform subscription renewal.
        </p>
        <Link
          to="/stores"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0c2a5e] text-white text-xs font-bold shadow-md hover:bg-blue-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Browse Active Official Stores</span>
        </Link>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4 select-none">
        <Store className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-2xl font-black text-slate-900">Store Not Found</h2>
        <p className="text-xs text-slate-600">The store you are looking for does not exist or has been removed.</p>
        <Link
          to="/stores"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0c2a5e] text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Stores</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans select-none">
      {/* Breadcrumb & Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/stores"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-[#0c2a5e] hover:border-slate-300 font-bold text-xs shadow-2xs transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Official Stores</span>
        </Link>

        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Open for Orders</span>
        </span>
      </div>

      {/* Store Header Banner Card */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm transition hover:shadow-md">
        {/* Banner Area */}
        <div className="h-48 sm:h-64 md:h-72 w-full bg-slate-900 relative overflow-hidden">
          <img
            src={store.banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80'}
            alt={store.storeName}
            className="w-full h-full object-cover"
          />
          {/* Subtle multi-layer gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 pointer-events-none"></div>

          {/* Top Badges inside Banner */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-bold border border-white/20">
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Verified Brand Store</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-600/90 backdrop-blur-md text-white text-[11px] font-extrabold shadow-md border border-emerald-400/40">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>KYC Verified &amp; Approved Merchant</span>
            </div>
          </div>
        </div>

        {/* Profile Details Body */}
        <div className="p-6 sm:p-8 pt-0 relative">
          {/* Identity Header Row */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-14 sm:-mt-18 mb-6">
            {/* Avatar & Store Info */}
            <div className="flex items-end gap-4 sm:gap-5">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-1 shadow-xl border-2 border-white ring-1 ring-slate-200/80 overflow-hidden shrink-0 relative group">
                <img
                  src={store.logo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80'}
                  alt={store.storeName}
                  className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition duration-300"
                />
                <div className="absolute bottom-1 right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-white" title="Active Verified Merchant">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <div className="space-y-2 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                    {store.storeName}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                    <Crown className="w-3 h-3 text-amber-500 fill-amber-400" />
                    <span>Official Flagship</span>
                  </span>
                </div>

                {/* Metadata Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-lg">
                    {store.category || 'General Store'}
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{store.rating || '4.9'} ({store.numReviews || 12} reviews)</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>100% Verified Merchant</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-lg">
                    <Package className="w-3.5 h-3.5 text-slate-500" />
                    <span>{products.length} Products</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
              {store.phone && (
                <a
                  href={`tel:${store.phone}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0c2a5e] hover:bg-[#081c40] text-white font-bold text-xs transition shadow-sm active:scale-98"
                >
                  <Phone className="w-3.5 h-3.5 text-amber-300" />
                  <span>{store.phone}</span>
                </a>
              )}
              {store.email && (
                <a
                  href={`mailto:${store.email}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition active:scale-98"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Email Store</span>
                </a>
              )}
              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition shadow-2xs active:scale-98 cursor-pointer"
                title="Share Storefront"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>

          {/* Store Description / Bio Card */}
          <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-100 mb-6">
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {store.description || 'Welcome to our official merchant storefront. All orders are packed and dispatched directly under SR Marketplace verified seller protection with Pan-India delivery.'}
            </p>
          </div>

          {/* Trust & Guarantee Highlights Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">100% Genuine</div>
                <div className="text-[10px] text-slate-500">Audited catalog products</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Direct Dispatch</div>
                <div className="text-[10px] text-slate-500">Pan-India express shipping</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Easy Returns</div>
                <div className="text-[10px] text-slate-500">7-day replacement guarantee</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-100 shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Verified Seller</div>
                <div className="text-[10px] text-slate-500">SR Marketplace certified</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#0c2a5e]" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Products From This Vendor ({products.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">Direct Merchant Shipping</span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-12 bright-card rounded-3xl p-8 border-slate-200">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No Products Listed Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              This merchant has not added any products to their catalog yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {products.map((product) => {
              const hasDiscount = product.discountPrice > 0 && product.discountPrice < product.price;
              const displayPrice = hasDiscount ? product.discountPrice : product.price;
              const inWishlist = isInWishlist(product._id);

              return (
                <div
                  key={product._id}
                  className="bright-card rounded-2xl overflow-hidden border-slate-200 hover:border-blue-300 transition flex flex-col justify-between group shadow-xs relative"
                >
                  <div className="relative aspect-square bg-slate-50 overflow-hidden">
                    <Link to={`/products/${product._id}`} className="block w-full h-full">
                      <img
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80'}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    </Link>
                    {hasDiscount && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black">
                        SALE
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleWishlist(product);
                      }}
                      className={`absolute top-2 right-2 w-7 h-7 rounded-full border flex items-center justify-center transition cursor-pointer ${
                        inWishlist
                          ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-2xs'
                          : 'bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-500 border-slate-200 shadow-xs'
                      }`}
                      aria-label="Wishlist"
                      title={inWishlist ? 'In your Wishlist' : 'Add to Wishlist'}
                    >
                      <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-rose-600 text-rose-600' : ''}`} />
                    </button>
                  </div>

                  <div className="p-3.5 space-y-2">
                    <Link to={`/products/${product._id}`}>
                      <h3 className="text-xs font-bold text-slate-900 line-clamp-2 hover:text-blue-700 transition">
                        {product.title}
                      </h3>
                    </Link>

                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-black text-slate-900">
                        ₹{displayPrice?.toLocaleString('en-IN')}
                      </span>
                      {hasDiscount && (
                        <span className="text-[11px] text-slate-400 line-through">
                          ₹{product.price?.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(product, 1)}
                      className="w-full py-2 px-3 rounded-xl bg-[#0f8a48] hover:bg-[#0c723b] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreDetail;
