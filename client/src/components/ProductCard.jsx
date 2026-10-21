import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const ProductCard = ({ product }) => {
  const { addToCart, toggleWishlist, isInWishlist } = useCart();

  const price = product.price || 0;
  const discountPrice = product.discountPrice || 0;
  const hasDiscount = discountPrice > 0 && discountPrice < price;
  const displayPrice = hasDiscount ? discountPrice : price;
  const discountPercent = hasDiscount
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  const inWishlist = isInWishlist(product._id);

  const imageSrc =
    product.images && product.images.length > 0
      ? product.images[0]
      : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80';

  const handleAddToCart = () => {
    addToCart(product, 1);
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between p-3.5 group relative">
      {/* Top Badges: Discount Pill + Wishlist Icon */}
      <div className="flex items-center justify-between w-full mb-2">
        {hasDiscount ? (
          <span className="bg-[#dc2626] text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
            {discountPercent}% OFF
          </span>
        ) : (
          <div></div>
        )}
        <button
          type="button"
          onClick={handleToggleWishlist}
          className={`w-7 h-7 rounded-full border flex items-center justify-center transition cursor-pointer ${
            inWishlist
              ? 'bg-rose-50 border-rose-300 text-rose-600 shadow-2xs'
              : 'bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 border-slate-200'
          }`}
          aria-label={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          title={inWishlist ? 'In your Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 transition-transform duration-200 hover:scale-110 ${inWishlist ? 'fill-rose-600 text-rose-600' : ''}`} />
        </button>
      </div>

      {/* Product Image */}
      <div className="w-full aspect-square overflow-hidden rounded-xl bg-slate-50 flex items-center justify-center mb-3">
        <Link to={`/products/${product._id}`} className="w-full h-full flex items-center justify-center p-2">
          <img
            src={imageSrc}
            alt={product.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </Link>
      </div>

      {/* Product Details */}
      <div className="flex flex-col flex-1 justify-between text-left space-y-2">
        <div>
          <Link
            to={`/products/${product._id}`}
            className="text-xs sm:text-sm font-bold text-slate-900 hover:text-[#0c2a5e] line-clamp-1 transition"
            title={product.title}
          >
            {product.title}
          </Link>

          {/* Rating Stars */}
          <div className="flex items-center gap-1 mt-1">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400" />
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-base sm:text-lg font-black text-slate-900">
              ₹{displayPrice.toLocaleString('en-IN')}
            </span>
            {hasDiscount && (
              <span className="text-xs text-slate-400 line-through font-medium">
                ₹{price.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Add to Cart Button (Amezon Solid Blue Button matching original design) */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
            product.stock === 0
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-[#0066cc] hover:bg-[#0052a3] text-white shadow-xs active:scale-98'
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
