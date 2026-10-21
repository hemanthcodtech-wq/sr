import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowRight, ArrowLeft, Star, Check, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Wishlist = () => {
  const { wishlistItems, removeFromWishlist, moveToCart, clearWishlist } = useCart();

  if (wishlistItems.length === 0) {
    return (
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-14 py-16 sm:py-24">
        <div className="max-w-md mx-auto text-center space-y-5 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200/90 shadow-sm">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-2xs">
            <Heart className="w-10 h-10 animate-soft-pulse fill-rose-100" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Your Wishlist is Empty</h1>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
              Explore thousands of products across Electronics, Fashion, Home &amp; Grocery and save your favorites here.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-bold text-sm shadow-md transition active:scale-98"
          >
            <span>Explore Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-14 py-8 space-y-8 select-none">
      {/* Wishlist Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Wishlist</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-xs font-bold">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Items saved to your personal account. Move them to your shopping bag whenever you're ready to order.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0c2a5e] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>

          <button
            onClick={clearWishlist}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Wishlist</span>
          </button>
        </div>
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {wishlistItems.map((product) => {
          const price = product.price || 0;
          const discountPrice = product.discountPrice || 0;
          const hasDiscount = discountPrice > 0 && discountPrice < price;
          const displayPrice = hasDiscount ? discountPrice : price;
          const discountPercent = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : 0;
          const imageSrc =
            product.images && product.images.length > 0
              ? product.images[0]
              : 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80';

          return (
            <div
              key={product._id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between p-4 group relative"
            >
              {/* Top Badges */}
              <div className="flex items-center justify-between w-full mb-2">
                {hasDiscount ? (
                  <span className="bg-[#dc2626] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                    {discountPercent}% OFF
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    {product.category || 'General'}
                  </span>
                )}

                <button
                  onClick={() => removeFromWishlist(product._id)}
                  className="w-7 h-7 rounded-full bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 flex items-center justify-center transition cursor-pointer"
                  title="Remove from wishlist"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="w-3.5 h-3.5" />
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

              {/* Details & Actions */}
              <div className="flex flex-col flex-1 justify-between space-y-3">
                <div className="space-y-1">
                  <Link
                    to={`/products/${product._id}`}
                    className="text-xs sm:text-sm font-bold text-slate-900 hover:text-[#0c2a5e] line-clamp-1 transition"
                    title={product.title}
                  >
                    {product.title}
                  </Link>

                  <div className="flex items-center gap-1">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[11px] text-slate-400 ml-1">
                      {product.stock > 0 ? (
                        <span className="text-emerald-600 font-bold inline-flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> In Stock
                        </span>
                      ) : (
                        <span className="text-rose-500 font-bold">Out of Stock</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 pt-1">
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

                {/* Move to Cart Button */}
                <button
                  onClick={() => moveToCart(product)}
                  disabled={product.stock === 0}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs ${
                    product.stock === 0
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-[#0066cc] hover:bg-[#0052a3] text-white active:scale-98'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{product.stock === 0 ? 'Out of Stock' : 'Move to Shopping Bag'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Wishlist;
