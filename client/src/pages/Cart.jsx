import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Trash2,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Store,
  Heart,
  Sparkles,
  Truck,
  RotateCcw,
  Percent,
} from 'lucide-react';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal, toggleWishlist, isInWishlist } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-24 h-24 bg-gradient-to-tr from-purple-100 to-indigo-50 text-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-purple-200">
          <ShoppingBag className="w-12 h-12 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Your Shopping Cart is Empty</h1>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Discover trending products directly from independent verified vendors across India and add them to your cart.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-black text-sm shadow-md transition hover:scale-[1.02] active:scale-95"
          >
            <span>Explore All Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/wishlist"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm transition"
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>View My Wishlist</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-14 py-8 space-y-8 select-none">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/" className="hover:text-purple-600">Home</Link>
            <span>/</span>
            <span className="text-slate-900 font-bold">Shopping Cart</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Shopping Cart</span>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
              {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items
            </span>
          </h1>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-bold text-rose-600 hover:text-rose-800 transition flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cartItems.map(({ product, quantity, store }) => {
            const itemPrice = product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price;
            const originalPrice = product.price > itemPrice ? product.price : null;
            const itemSubtotal = itemPrice * quantity;
            const image = product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80';
            const inWish = isInWishlist ? isInWishlist(product._id) : false;

            return (
              <div
                key={product._id}
                className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 glow-card transition duration-200 flex flex-col sm:flex-row items-center gap-4 justify-between"
              >
                {/* Item Thumbnail & Basic Info */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 shadow-inner">
                    <img src={image} alt={product.title} className="w-full h-full object-cover hover:scale-105 transition" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Store className="w-3 h-3 text-purple-600" />
                      <span className="font-bold text-slate-700">{product.store?.storeName || store?.storeName || 'Verified Merchant'}</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.2 rounded border border-emerald-200">
                        Verified
                      </span>
                    </div>
                    <Link
                      to={`/products/${product._id}`}
                      className="font-bold text-sm text-slate-900 hover:text-purple-600 line-clamp-1 transition"
                    >
                      {product.title}
                    </Link>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-extrabold text-slate-900 text-sm">₹{itemPrice.toLocaleString('en-IN')}</span>
                      {originalPrice && (
                        <span className="text-slate-400 line-through text-[11px]">₹{originalPrice.toLocaleString('en-IN')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quantity Adjustment & Subtotal */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 shadow-2xs overflow-hidden">
                    <button
                      onClick={() => updateQuantity(product._id, quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 font-black text-sm cursor-pointer transition active:scale-95"
                    >
                      -
                    </button>
                    <span className="w-9 text-center text-xs font-black text-slate-900">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(product._id, quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-200 font-black text-sm cursor-pointer transition active:scale-95"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[90px]">
                    <div className="text-xs text-slate-400 font-medium">Subtotal</div>
                    <div className="text-base font-black text-slate-900">
                      ₹{itemSubtotal.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        toggleWishlist(product);
                        removeFromCart(product._id);
                      }}
                      className={`p-2 rounded-xl transition cursor-pointer border ${
                        inWish
                          ? 'bg-rose-50 text-rose-600 border-rose-200'
                          : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-200'
                      }`}
                      title="Move to Wishlist"
                      aria-label="Move to Wishlist"
                    >
                      <Heart className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => removeFromCart(product._id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition cursor-pointer"
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-xs font-extrabold text-purple-700 hover:text-purple-900 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping for More Items</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="lg:col-span-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 glow-card space-y-5 sticky top-24">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900">Order Summary</h2>
              <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                Secure Checkout
              </span>
            </div>

            {/* Prepaid Discount Tip */}
            <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-center gap-2 text-xs text-emerald-800">
              <Percent className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Prepaid orders get an instant extra discount during checkout!</span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-extrabold text-slate-900">₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Standard Delivery</span>
                </span>
                <span className="font-black text-emerald-600">FREE</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Platform &amp; Handling</span>
                <span className="font-bold text-emerald-600">₹0 Free</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-base font-black text-slate-900">
                <span>Estimated Total</span>
                <span className="text-2xl text-purple-700">₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-black text-sm shadow-md transition hover:scale-[1.01] active:scale-95 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Trust Badges */}
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Protected by Razorpay &amp; Escrow Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>7-Day Easy Return on eligible items</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
