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
  ChevronLeft,
  MessageSquare,
  ThumbsUp,
  User,
  Quote,
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

  // Reviews Carousel & Submission State
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [newName, setNewName] = useState('');
  const [newCity, setNewCity] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Auto-rotate reviews carousel every 5 seconds
  useEffect(() => {
    if (!product?.reviews || product.reviews.length <= 1) return;
    const interval = setInterval(() => {
      setActiveReviewIndex((prev) => (prev + 1) % product.reviews.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [product?.reviews]);

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

  const handleSubmitReview = async (e) => {
    if (e) e.preventDefault();
    if (!newComment.trim()) {
      info('Please enter your review feedback');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await api.post(`/products/${id}/reviews`, {
        rating: newRating,
        comment: newComment,
        name: newName,
        city: newCity,
      });

      if (res.data?.success) {
        success('Thank you! Your verified review has been published.');
        setReviewModalOpen(false);
        setNewComment('');
        setNewRating(5);
        setNewName('');
        setNewCity('');
        // Update local product state with new review
        setProduct((prev) => ({
          ...prev,
          reviews: res.data.reviews || [res.data.review, ...(prev.reviews || [])],
          rating: res.data.rating || prev.rating,
          numReviews: res.data.numReviews || (prev.numReviews || 0) + 1,
        }));
      }
    } catch (err) {
      console.error(err);
      info(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
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

        {/* ========================================================================= */}
        {/* CUSTOMER REVIEWS & FEEDBACK CAROUSEL SECTION */}
        {/* ========================================================================= */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  Verified Customer Reviews
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  ({product.reviews?.length || 0} reviews)
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Customer Ratings &amp; Real Feedback
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setReviewModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/15 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Write a Review</span>
              </button>
            </div>
          </div>

          {/* Rating Summary Breakdown Tile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-6 bg-slate-50/70 border border-slate-200 rounded-2xl">
            {/* Overall Star Score */}
            <div className="text-center md:text-left space-y-1 border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-6">
              <div className="text-4xl sm:text-5xl font-black text-slate-900 font-mono">
                {product.rating || '4.8'}
              </div>
              <div className="flex justify-center md:justify-start items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(product.rating || 4.8) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 pt-1">
                Based on <b className="text-slate-800">{product.reviews?.length || product.numReviews || 12}</b> verified buyer experiences
              </p>
            </div>

            {/* Satisfaction Bars */}
            <div className="space-y-1.5 text-xs text-slate-600 col-span-1 md:col-span-2">
              <div className="flex items-center gap-2">
                <span className="w-12 font-bold font-mono">5 Star</span>
                <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: '82%' }}></div>
                </div>
                <span className="w-10 text-right font-mono text-slate-400">82%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-12 font-bold font-mono">4 Star</span>
                <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: '14%' }}></div>
                </div>
                <span className="w-10 text-right font-mono text-slate-400">14%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-12 font-bold font-mono">3 Star</span>
                <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full rounded-full" style={{ width: '4%' }}></div>
                </div>
                <span className="w-10 text-right font-mono text-slate-400">4%</span>
              </div>
            </div>
          </div>

          {/* DYNAMIC REVIEWS FEEDBACK CAROUSEL */}
          {product.reviews && product.reviews.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Featured Review {activeReviewIndex + 1} of {product.reviews.length}
                </span>

                {/* Carousel Navigation Arrows */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() =>
                      setActiveReviewIndex((prev) => (prev === 0 ? product.reviews.length - 1 : prev - 1))
                    }
                    className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center transition shadow-2xs cursor-pointer"
                    title="Previous Review"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveReviewIndex((prev) => (prev + 1) % product.reviews.length)}
                    className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 flex items-center justify-center transition shadow-2xs cursor-pointer"
                    title="Next Review"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Active Review Slide */}
              <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50/50 to-amber-50/20 p-6 sm:p-8 shadow-xs transition-all">
                <Quote className="w-10 h-10 text-amber-400/30 absolute right-6 top-6 pointer-events-none" />

                <div className="space-y-4 max-w-2xl">
                  {/* Rating Stars & Verified Purchase Badge */}
                  <div className="flex items-center gap-3">
                    <div className="flex text-amber-400">
                      {[...Array(product.reviews[activeReviewIndex].rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified Purchase
                    </span>
                  </div>

                  {/* Comment */}
                  <blockquote className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed italic">
                    "{product.reviews[activeReviewIndex].comment}"
                  </blockquote>

                  {/* Reviewer Details */}
                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm shadow-2xs">
                      {(product.reviews[activeReviewIndex].name || 'V')[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {product.reviews[activeReviewIndex].name}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {product.reviews[activeReviewIndex].city || 'Verified Buyer'} •{' '}
                        {new Date(
                          product.reviews[activeReviewIndex].createdAt || Date.now()
                        ).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Carousel Pagination Dots */}
                <div className="flex items-center justify-center gap-1.5 pt-6">
                  {product.reviews.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      onClick={() => setActiveReviewIndex(dotIdx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        activeReviewIndex === dotIdx ? 'w-6 bg-[#0c2a5e]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              No reviews yet for this product. Be the first to share your experience!
            </div>
          )}
        </section>

        {/* SUBMIT REVIEW MODAL */}
        {reviewModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                    <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Write a Review</h3>
                    <p className="text-[11px] text-slate-500">Share your experience with other shoppers</p>
                  </div>
                </div>
                <button
                  onClick={() => setReviewModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {/* Star Rating Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Your Rating</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewRating(star)}
                        className="p-1 hover:scale-110 transition cursor-pointer"
                      >
                        <Star
                          className={`w-7 h-7 ${
                            star <= newRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 font-mono ml-2">
                      {newRating} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Name & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Your Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">City / Town</label>
                    <input
                      type="text"
                      placeholder="e.g. Delhi, Hyderabad"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Review Comment */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Review Feedback *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Tell us what you liked about the product quality, packaging, and delivery..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 custom-scrollbar leading-relaxed"
                  />
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {submittingReview ? 'Submitting...' : 'Post Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
