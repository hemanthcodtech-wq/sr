import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
} from 'lucide-react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { info, success } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

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
        <div className="bright-card p-12 max-w-xl mx-auto rounded-3xl animate-pulse space-y-4">
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
          <div className="h-6 bg-slate-200 rounded-md w-3/4 mx-auto"></div>
          <div className="h-4 bg-slate-200 rounded-md w-1/2 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-black text-slate-800">Product Not Found</h2>
        <p className="text-sm text-slate-500">The product you are looking for may have been removed or discontinued.</p>
        <Link to="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold">
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
  const discountPercent = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : 0;

  const images = product.images && product.images.length > 0 ? product.images : [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'
  ];

  const inWishlist = product ? isInWishlist(product._id) : false;

  const handleBuyNow = () => {
    const success = addToCart(product, quantity);
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

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-14 py-8 space-y-12">
      {/* Breadcrumb Back Button & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Results</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => toggleWishlist(product)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
              inWishlist
                ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-2xs'
                : 'border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
            }`}
            aria-label={inWishlist ? 'Remove from Wishlist' : 'Save to Wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-rose-600 text-rose-600' : ''}`} />
            <span>{inWishlist ? 'In Wishlist' : 'Add to Wishlist'}</span>
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Image Gallery */}
        <div className="lg:col-span-6 space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 shadow-sm relative">
            <img
              src={images[selectedImage]}
              alt={product.title}
              className="w-full h-full object-cover object-center"
            />
            {hasDiscount && (
              <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-extrabold px-2.5 py-1 rounded-lg shadow-sm">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                    selectedImage === idx ? 'border-blue-600 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Buy Info */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                {product.category}
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Verified Independent Seller</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {product.title}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-900">{product.rating || 4.8}</span>
              <span className="text-xs text-slate-500">({product.numReviews || 12} Verified Customer Ratings)</span>
            </div>
          </div>

          {/* Price Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-slate-900">
                ₹{displayPrice.toLocaleString('en-IN')}
              </div>
              {hasDiscount && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-slate-400 line-through">
                    ₹{price.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-bold text-rose-600">
                    Save ₹{(price - discountPrice).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>

            <div className="text-right">
              {product.stock > 0 ? (
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>In Stock ({product.stock} available)</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                  <span>Out of Stock</span>
                </div>
              )}
            </div>
          </div>

          {/* Short Description */}
          <p className="text-sm text-slate-600 leading-relaxed">
            {product.description}
          </p>

          {/* Quantity and Actions */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity:</label>
              <div className="flex items-center border border-slate-300 rounded-xl bg-white shadow-2xs">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-l-xl font-bold cursor-pointer"
                >
                  -
                </button>
                <span className="px-4 py-1.5 text-sm font-bold text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => (product.stock && q < product.stock ? q + 1 : q))}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-r-xl font-bold cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => addToCart(product, quantity)}
                disabled={product.stock === 0}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition cursor-pointer disabled:bg-slate-300"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Shopping Bag</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition cursor-pointer disabled:bg-slate-300"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Instant Checkout</span>
              </button>
            </div>
          </div>

          {/* Vendor Store Card */}
          <div className="bright-card p-5 rounded-2xl border-blue-200 bg-blue-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <Link
                to={product.store?._id ? `/store/${product.store._id}` : '/stores'}
                className="flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                  {product.store?.logo ? (
                    <img src={product.store.logo} alt="Store logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition">
                    {product.store?.storeName || 'Official Merchant Store'}
                  </h3>
                  <p className="text-xs text-slate-500">Registered Vendor &amp; Direct Shipper • Click to view storefront →</p>
                </div>
              </Link>
              <span className="text-xs font-bold text-blue-700 bg-white border border-blue-200 px-2.5 py-1 rounded-lg">
                ★ {product.store?.rating || '4.9'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-normal">
              {product.store?.description || 'This store is a verified partner operating under active marketplace seller standards.'}
            </p>

            <div className="pt-1 flex items-center justify-between text-xs text-slate-500 border-t border-blue-100">
              <span>Direct delivery handled by merchant</span>
              <span className="font-semibold text-slate-700">Fulfilled via Amezon.online</span>
            </div>
          </div>

          {/* Guarantees Box */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center space-y-1">
              <Truck className="w-4 h-4 text-blue-600 mx-auto" />
              <div className="text-[11px] font-bold text-slate-800">Free Delivery</div>
              <div className="text-[10px] text-slate-500">Pan India Shipping</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center space-y-1">
              <RotateCcw className="w-4 h-4 text-emerald-600 mx-auto" />
              <div className="text-[11px] font-bold text-slate-800">7-Day Returns</div>
              <div className="text-[10px] text-slate-500">Guaranteed Replacement</div>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl text-center space-y-1">
              <ShieldCheck className="w-4 h-4 text-purple-600 mx-auto" />
              <div className="text-[11px] font-bold text-slate-800">Razorpay Safe</div>
              <div className="text-[10px] text-slate-500">Escrow Protected</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
