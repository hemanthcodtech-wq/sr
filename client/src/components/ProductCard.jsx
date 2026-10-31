import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Store } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const ProductCard = ({ product, showVendorBadge = true }) => {
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
    product.images && product.images.length > 0
      ? product.images[0]
      : product.image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80';

  const vendorName =
    product.vendorName ||
    product.store?.storeName ||
    product.vendor?.store?.storeName ||
    product.vendor?.name ||
    'Verified Seller';

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
    <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300 flex flex-col justify-between p-2.5 sm:p-3 group relative select-none">
      {/* Top Header: Vendor Mini Badge (left) & Red Discount Badge / Wishlist (right) */}
      <div className="flex items-center justify-between w-full mb-1.5 gap-1.5 min-h-[22px]">
        {showVendorBadge ? (
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold text-slate-700 max-w-[65%] truncate">
            <Store className="w-2.5 h-2.5 text-slate-500 flex-shrink-0" />
            <span className="truncate">{vendorName}</span>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1 flex-shrink-0">
          {discountPercent > 0 && (
            <span className="bg-[#e11d48] text-white text-[9px] sm:text-[9.5px] font-black px-1.5 py-0.5 rounded-full shadow-2xs leading-none">
              {discountPercent}% OFF
            </span>
          )}
          <button
            type="button"
            onClick={handleToggleWishlist}
            className={`w-5.5 h-5.5 rounded-full flex items-center justify-center transition cursor-pointer ${
              inWishlist
                ? 'bg-rose-50 text-rose-600'
                : 'text-slate-400 hover:text-rose-500 hover:bg-slate-50'
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-3 h-3 ${inWishlist ? 'fill-rose-600 text-rose-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Product Image */}
      <div className="w-full aspect-square max-h-36 sm:max-h-44 overflow-hidden rounded-lg sm:rounded-xl bg-slate-50/80 flex items-center justify-center mb-1.5 sm:mb-2 p-1.5 sm:p-2">
        <Link to={`/products/${product._id}`} className="w-full h-full flex items-center justify-center">
          <img
            src={imageSrc}
            alt={product.title}
            className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-300 filter drop-shadow-xs"
            loading="lazy"
          />
        </Link>
      </div>

      {/* Product Information */}
      <div className="flex flex-col flex-1 justify-between text-left space-y-1.5">
        <div>
          <Link
            to={`/products/${product._id}`}
            className="text-xs sm:text-[13px] font-bold text-slate-900 hover:text-[#0f8a48] line-clamp-1 transition block"
            title={product.title}
          >
            {product.title}
          </Link>

          {/* Pricing Row: Green bold price + line-through original price */}
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xs sm:text-sm md:text-base font-extrabold text-[#0f8a48]">
              ₹{displayPrice.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <span className="text-[10px] sm:text-[11px] text-slate-400 line-through font-medium">
                ₹{price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button (Vibrant Emerald Green rounded button) */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={`w-full py-1.5 sm:py-2 px-2.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs ${
            product.stock === 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-[#0f8a48] hover:bg-[#0c723b] text-white active:scale-98'
          }`}
        >
          <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
