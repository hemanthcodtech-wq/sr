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
  ArrowRight,
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

      {/* Store Header Card (Clean Store Profile) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
        {/* Identity Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar & Store Info */}
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1 shadow-md border-2 border-slate-100 ring-1 ring-slate-200/80 overflow-hidden shrink-0 relative group">
              <img
                src={store.logo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80'}
                alt={store.storeName}
                className="w-full h-full object-cover rounded-xl"
              />
              <div className="absolute bottom-1 right-1 bg-emerald-500 rounded-full p-0.5 border-2 border-white" title="Active Verified Merchant">
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {store.storeName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80">
                  <Crown className="w-3 h-3 text-amber-500 fill-amber-400" />
                  <span>Official Flagship</span>
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>KYC Verified &amp; Approved</span>
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
      </div>

      {/* One-Line Bar with Clean Product Catalog Link */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:px-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0c2a5e] to-slate-900 text-white shadow-sm border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10">
            <Package className="w-4 h-4 text-amber-300" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-extrabold tracking-wide flex items-center gap-2">
              <span>Official Product Collection</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                Verified Catalog
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              Explore our complete range of certified products with Pan-India express delivery
            </p>
          </div>
        </div>

        <Link
          to="/admin/products"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold text-xs shadow-md transition transform active:scale-98 cursor-pointer shrink-0"
        >
          <span>View All Products</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
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
