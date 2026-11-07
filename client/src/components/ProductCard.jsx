import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Store } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const categoryFallbacks = {
  'Fitness': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=80',
  'Home & Kitchen': 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&auto=format&fit=crop&q=80',
  'Toys': 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&auto=format&fit=crop&q=80',
  'Electronics': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&auto=format&fit=crop&q=80',
  'Fashion': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop&q=80',
  'Beauty': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&auto=format&fit=crop&q=80',
  'Footwear': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&auto=format&fit=crop&q=80',
};
const defaultFallback = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80';

const ProductCard = ({ product, showVendorBadge = true, mobileCols = 4 }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { showToast } = useToast();

  const price = product.price || 0;
  const discountPrice = product.discountPrice || 0;
  const hasDiscount = discountPrice > 0 && discountPrice < price;
  const displayPrice = hasDiscount ? discountPrice : price;
  const discountPercent = hasDiscount
    ? Math.round(((price - discountPrice) / price) * 100)
    : product.discountPercent || 0;

  const inWishlist = isInWishlist(product._id);

  const imageSrc =
    product.images && product.images.length > 0 && product.images[0]
      ? product.images[0]
      : product.image || categoryFallbacks[product.category] || defaultFallback;

  const vendorName =
    product.vendorName ||
    product.store?.storeName ||
    product.vendor?.store?.storeName ||
    product.vendor?.name ||
    'Shoppinest';

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    if (showToast) {
      showToast(`${product.title} added to your cart!`, 'success');
    }
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="bg-white rounded-md sm:rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all duration-200 p-1 sm:p-2 flex flex-col justify-between group relative select-none">
      {/* Top Header: Vendor Mini Badge (left) & Discount Badge / Wishlist (right) */}
      <div className="flex items-center justify-between w-full mb-0.5 gap-0.5 leading-none">
        {showVendorBadge ? (
          <div className="flex items-center gap-0.5 bg-slate-50 border border-slate-100 px-1 py-0.2 rounded text-[6.5px] sm:text-[8px] font-bold text-slate-500 max-w-[55%] truncate">
            <Store className="w-2 h-2 text-slate-400 flex-shrink-0" />
            <span className="truncate">{vendorName}</span>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-0.5 flex-shrink-0">
          {discountPercent > 0 && (
            <span className="bg-[#e11d48] text-white text-[6.5px] sm:text-[7.5px] font-black px-1 py-0.2 rounded leading-none shadow-2xs">
              {discountPercent}% OFF
            </span>
          )}
          <button
            type="button"
            onClick={handleToggleWishlist}
            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-500 transition cursor-pointer"
            aria-label="Wishlist"
          >
            <Heart className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${inWishlist ? 'fill-rose-600 text-rose-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Product Image: Ultra-compact fixed height */}
      <div className="w-full h-16 sm:h-24 md:h-32 overflow-hidden rounded bg-[#f8fafc] flex items-center justify-center p-0.5 sm:p-1 relative mb-0.5 sm:mb-1">
        <Link to={`/products/${product._id}`} className="w-full h-full flex items-center justify-center">
          <img
            src={imageSrc}
            alt={product.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 filter drop-shadow-xs"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = categoryFallbacks[product.category] || defaultFallback;
            }}
          />
        </Link>
      </div>

      {/* Product Information */}
      <div className="space-y-0.5 mb-0.5 flex-1 flex flex-col justify-between text-left">
        <Link
          to={`/products/${product._id}`}
          className="text-[8.5px] sm:text-xs font-semibold text-slate-800 hover:text-[#0f8a48] line-clamp-2 transition block leading-tight h-[22px] sm:h-[28px] overflow-hidden"
          title={product.title}
        >
          {product.title}
        </Link>

        {/* Pricing & Rating Row */}
        <div className="flex items-center justify-between gap-0.5 pt-0.5 leading-none">
          <div className="flex items-baseline gap-0.5">
            <span className="text-[10px] sm:text-xs md:text-sm font-extrabold text-slate-900 leading-none">
              ₹{displayPrice.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <span className="text-[6.5px] sm:text-[8.5px] text-slate-400 line-through font-medium hidden xs:inline">
                ₹{price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-0.5 bg-[#0f8a48] text-white text-[6.5px] sm:text-[8px] font-bold px-0.5 py-0.2 rounded flex-shrink-0 leading-none">
            <span>★</span>
            <span>{Number(product.rating) || 4.8}</span>
          </span>
        </div>

        {/* Free Delivery Tag */}
        <div className="flex items-center justify-between text-[6.5px] sm:text-[8px] pt-0.5 leading-none">
          <span className="font-bold text-emerald-700 bg-emerald-50 px-0.5 py-0.2 rounded">
            Free Delivery
          </span>
          <span className="text-slate-400 truncate max-w-[45%] hidden sm:inline">
            {vendorName}
          </span>
        </div>
      </div>

      {/* Compact Add to Cart Button */}
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={product.stock === 0}
        className={`w-full h-5 sm:h-6.5 rounded font-bold flex items-center justify-center gap-0.5 transition cursor-pointer shadow-2xs mt-0.5 ${
          product.stock === 0
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed text-[7px] sm:text-[9.5px]'
            : 'bg-[#0f8a48] hover:bg-[#0c723b] text-white active:scale-95 text-[7.5px] sm:text-[10.5px]'
        }`}
      >
        <ShoppingCart className="w-2.5 h-2.5 flex-shrink-0" />
        <span className="sm:hidden">{mobileCols === 4 ? 'Add' : 'Add to Cart'}</span>
        <span className="hidden sm:inline">{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
      </button>
    </div>
  );
};

export default ProductCard;
