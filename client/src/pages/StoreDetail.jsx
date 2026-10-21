import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Store,
  ShieldCheck,
  Star,
  Package,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  ShoppingCart,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Heart,
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const StoreDetail = () => {
  const { id } = useParams();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { success } = useToast();

  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const res = await api.get(`/vendors/public-stores/${id}`);
        if (res.data?.success) {
          setStore(res.data.store);
          setProducts(res.data.products || []);
        }
      } catch (err) {
        if (err.response?.status === 403 && err.response?.data?.isExpired) {
          setIsExpired(true);
        }
        console.error('Error fetching store details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [id]);

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
      {/* Back button */}
      <div>
        <Link
          to="/stores"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0c2a5e] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Official Stores</span>
        </Link>
      </div>

      {/* Store Header Banner Card */}
      <div className="bright-card rounded-3xl overflow-hidden border-slate-200 shadow-sm">
        <div className="h-44 sm:h-64 w-full bg-slate-100 relative">
          <img
            src={store.banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80'}
            alt={store.storeName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

          <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black shadow-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>KYC Verified &amp; Approved Merchant</span>
          </div>
        </div>

        {/* Profile Info Row */}
        <div className="p-6 sm:p-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white border-2 border-white shadow-lg overflow-hidden shrink-0">
                <img
                  src={store.logo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80'}
                  alt={store.storeName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {store.storeName}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    {store.category || 'General'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {store.address?.city || 'Bhimavaram'}, {store.address?.state || 'AP'}
                  </span>
                  <span>•</span>
                  <div className="inline-flex items-center gap-1 text-amber-600 font-bold">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{store.rating || '4.9'} ({store.numReviews || 12} reviews)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {store.phone && (
                <a
                  href={`tel:${store.phone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>{store.phone}</span>
                </a>
              )}
              {store.email && (
                <a
                  href={`mailto:${store.email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Email Store</span>
                </a>
              )}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
            {store.description || 'Welcome to our official merchant storefront. All orders are packed and dispatched directly from our verified store location under Amezon.online standard delivery protection.'}
          </p>
        </div>
      </div>

      {/* Products Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#0c2a5e]" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Products From This Store ({products.length})
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
                      className="w-full py-2 px-3 rounded-xl bg-[#0c2a5e] hover:bg-blue-800 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add to Bag</span>
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
