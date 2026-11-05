import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Star,
  ShoppingCart,
  Truck,
  ShieldCheck,
  RotateCcw,
  Store,
  Check,
  ArrowLeft,
  Share2,
  Phone,
  Mail,
  Zap,
  Heart,
  ChevronRight,
  Sparkles,
  MapPin,
  Clock,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const ProductDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const refVendor = searchParams.get('refVendor');
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { info, success } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState('');
  const [pincodeChecked, setPincodeChecked] = useState(false);
  const [pincodeMsg, setPincodeMsg] = useState('');

  // Capture affiliate vendor parameter
  useEffect(() => {
    if (refVendor && id) {
      sessionStorage.setItem('amezon_ref_vendor_' + id, refVendor);
    }
  }, [refVendor, id]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        if (res.data && res.data.success) {
          setProduct(res.data.product);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="glow-card p-12 max-w-xl mx-auto rounded-3xl animate-pulse space-y-4">
          <div className="h-72 bg-slate-100 rounded-2xl"></div>
          <div className="h-6 bg-slate-100 rounded-md w-3/4 mx-auto"></div>
          <div className="h-4 bg-slate-100 rounded-md w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-800">Product Not Found</h2>
        <p className="text-sm text-slate-500">The product you are looking for may have been removed or discontinued.</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#0c2a5e] text-white rounded-2xl text-sm font-bold shadow-md hover:bg-[#153e85] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Catalog</span>
        </Link>
      </div>
    );
  }

  const price = product.price || 0;
  const discountPrice = product.discountPrice || 0;
  const hasDiscount = discountPrice > 0 && discountPrice < price;
  const displayPrice = hasDiscount ? discountPrice : price;
  const originalPrice = hasDiscount ? price : Math.round(price * 1.35);
  const discountPercent = hasDiscount
    ? Math.round(((price - discountPrice) / price) * 100)
    : 25;
  const savedAmount = Math.max(0, originalPrice - displayPrice);
  const prepaidPrice = Math.round(displayPrice * 0.9);

  const images =
    product.images && product.images.length > 0
      ? product.images
      : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'];

  const inWishlist = product ? isInWishlist(product._id) : false;

  const handleAddToCart = () => {
    const activeRefVendor =
      refVendor || (typeof window !== 'undefined' ? sessionStorage.getItem('amezon_ref_vendor_' + id) : null) || null;
    addToCart(product, quantity, activeRefVendor);
  };

  const handleBuyNow = () => {
    const activeRefVendor =
      refVendor || (typeof window !== 'undefined' ? sessionStorage.getItem('amezon_ref_vendor_' + id) : null) || null;
    const success = addToCart(product, quantity, activeRefVendor);
    if (success) {
      navigate('/cart');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      info('Product link copied to clipboard!');
    }
  };

  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (!pincode.trim() || pincode.trim().length !== 6) {
      setPincodeMsg('Please enter a valid 6-digit PIN code.');
      setPincodeChecked(true);
      return;
    }
    setPincodeChecked(true);
    setPincodeMsg(`Express delivery available to PIN ${pincode.trim()} in 2-3 business days.`);
  };

  const storeName =
    product.store?.storeName ||
    product.vendor?.store?.storeName ||
    product.vendorName ||
    'Internet Cafe & Mobile Accesories';

  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 select-none font-sans">
      {/* Top Breadcrumb & Photos pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link to="/" className="hover:text-[#0c2a5e] transition">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link to="/products" className="hover:text-[#0c2a5e] transition">
            {product.category || 'Electronics'}
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-800 font-bold truncate max-w-[200px] sm:max-w-xs">{product.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-bold text-[11px]">
            Photos ({images.length})
          </span>
          <button
            onClick={() => navigate(-1)}
            className="hidden sm:inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 transition cursor-pointer font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* 3-Column Modern Grid (matching uploaded screenshot 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-start">
        {/* Left Column: Image Gallery & Badges (lg:col-span-4 xl:col-span-4) */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4">
          <div className="glow-card p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden group">
            {/* Main Stage Image */}
            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-50 relative flex items-center justify-center">
              <img
                src={images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
              />

              {/* Floating Wishlist Button */}
              <button
                onClick={() => toggleWishlist(product)}
                aria-label="Wishlist"
                className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md shadow-md transition cursor-pointer ${
                  inWishlist
                    ? 'bg-rose-50 text-rose-600 border border-rose-200 shadow-rose-200'
                    : 'bg-white/80 hover:bg-white text-slate-600 hover:text-rose-600 border border-slate-200'
                }`}
              >
                <Heart className={`w-4 h-4 ${inWishlist ? 'fill-rose-600' : ''}`} />
              </button>

              {/* Feature Pills overlay */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
                <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-bold">
                  ★ {product.rating || '4.8'} High Quality
                </span>
                {hasDiscount && (
                  <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Row */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pt-4 scrollbar-none">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer bg-slate-50 ${
                      selectedImage === idx
                        ? 'border-emerald-600 ring-2 ring-emerald-200 shadow-sm scale-105'
                        : 'border-slate-200 hover:border-slate-300 opacity-80'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Column: Title, Store Seller, Description & Pincode Checker (lg:col-span-4 xl:col-span-4) */}
        <div className="lg:col-span-4 xl:col-span-4 space-y-4">
          {/* Title & Category */}
          <div className="space-y-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug tracking-tight">
              {product.title}
            </h1>
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {product.description || 'Premium quality multi-vendor listing with direct manufacturer dispatch.'}
            </p>
            <div className="text-[11px] text-slate-400">
              No ratings yet • SKU: <span className="font-mono text-slate-700 font-bold">{product._id.slice(-8).toUpperCase()}</span> •{' '}
              <span className="text-emerald-600 font-bold">● In Stock ({product.stock || 10} left)</span>
            </div>
          </div>

          {/* Pricing Row matching screenshot */}
          <div className="py-2 border-y border-slate-100 space-y-1">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900">
                ₹{displayPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-slate-400 line-through">
                ₹{originalPrice.toLocaleString('en-IN')}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-black">
                {discountPercent}% OFF
              </span>
              {savedAmount > 0 && (
                <span className="text-xs font-bold text-emerald-700">Save ₹{savedAmount.toLocaleString('en-IN')}</span>
              )}
            </div>

            <p className="text-[11px] text-amber-700 font-bold bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-200/60 inline-block">
              ₹{prepaidPrice} with prepaid order • Extra 10% off on prepaid
            </p>
          </div>

          {/* Sold by Store Pill */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Sold by</span>
            <Link
              to={product.store?._id ? `/stores/${product.store._id}` : '/stores'}
              className="font-bold text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1"
            >
              <span>{storeName}</span>
            </Link>
            <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black border border-purple-200">
              Verified
            </span>
          </div>

          {/* Check Delivery Pincode */}
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              <span>Check Delivery</span>
            </label>
            <form onSubmit={handleCheckPincode} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter pincode"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 px-3.5 py-2 bg-white rounded-xl border border-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                Check
              </button>
            </form>
            {pincodeChecked && (
              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{pincodeMsg}</span>
              </p>
            )}
          </div>

          {/* Wishlist and Share Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => toggleWishlist(product)}
              className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                inWishlist
                  ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-rose-600' : ''}`} />
              <span>{inWishlist ? 'Saved in Wishlist' : 'Wishlist'}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Right Column: Checkout Action Card (lg:col-span-3 xl:col-span-3 - exact match to screenshot 1) */}
        <div className="lg:col-span-3 xl:col-span-3">
          <div className="glow-card rounded-3xl overflow-hidden border border-slate-200/90 shadow-xl bg-white sticky top-24">
            {/* Dark Emerald Header Bar */}
            <div className="bg-[#035b36] p-5 text-white space-y-1.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black">₹{displayPrice.toLocaleString('en-IN')}</span>
                <span className="text-sm text-emerald-200/80 line-through">₹{originalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-700/80 text-[10px] font-black uppercase text-white">
                  {discountPercent}% OFF
                </span>
                <span className="text-xs font-bold text-emerald-200">Save ₹{savedAmount.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-[10px] text-emerald-100 font-semibold pt-1">
                ₹{prepaidPrice} with prepaid order • Extra 10% off on prepaid
              </p>
              <div className="text-[11px] text-emerald-300 font-bold flex items-center gap-1.5 pt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>In Stock — {product.stock || 10} left</span>
              </div>
            </div>

            {/* Body: Quantity + Buttons */}
            <div className="p-5 space-y-4 text-xs">
              {/* Quantity Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <span>Quantity</span>
                  <span className="text-slate-400 font-normal">Max 10</span>
                </div>
                <div className="flex items-center border border-slate-300 rounded-xl bg-white overflow-hidden w-28 shadow-2xs">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer transition text-sm"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-bold text-slate-900 text-sm">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 font-bold cursor-pointer transition text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons with Glowing Hover Effects */}
              <div className="space-y-2.5 pt-1">
                <button
                  onClick={handleAddToCart}
                  className="w-full py-3 px-4 rounded-xl border-2 border-emerald-600 hover:bg-emerald-50 text-emerald-700 font-extrabold text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                <button
                  onClick={handleBuyNow}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#035b36] to-[#047743] hover:from-[#024a2b] hover:to-[#035b36] text-white font-black text-sm transition cursor-pointer flex items-center justify-center gap-2 shadow-lg glow-emerald active:scale-98"
                >
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Buy Now</span>
                </button>

                <button
                  onClick={() => toggleWishlist(product)}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-rose-600 text-rose-600' : ''}`} />
                  <span>{inWishlist ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="pt-3 border-t border-slate-100 space-y-2.5 text-slate-600">
                <div className="flex items-start gap-2.5">
                  <Truck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-slate-900 block font-bold">Standard delivery</strong>
                    <span className="text-[11px] text-slate-500">Usually arrives in 2-3 days</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <RotateCcw className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-slate-900 block font-bold">7-Day Returns</strong>
                    <span className="text-[11px] text-slate-500">Easy return on eligible orders</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-slate-900 block font-bold">Secure checkout</strong>
                    <span className="text-[11px] text-slate-500">Protected payments on RS Marketplace</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
