import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, ShieldCheck, Store, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal, toggleWishlist, isInWishlist } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <ShoppingBag className="w-10 h-10 animate-soft-pulse" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Your Shopping Cart is Empty</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Explore products from independent merchants across India and add them to your cart.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-bold text-sm shadow-md transition"
          >
            <span>Start Exploring Products</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/wishlist"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm transition"
          >
            <Heart className="w-4 h-4 text-rose-500" />
            <span>View My Wishlist</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-14 py-8 space-y-8">
      {/* Page Title */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Shopping Bag</h1>
          <p className="text-xs text-slate-500">Review selected products and checkout securely</p>
        </div>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition flex items-center gap-1 cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear All</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {cartItems.map(({ product, quantity, store }) => {
            const itemPrice = product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price;
            const itemSubtotal = itemPrice * quantity;
            const image = product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80';

            return (
              <div
                key={product._id}
                className="bright-card p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 justify-between"
              >
                {/* Item Thumbnail & Basic Info */}
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                    <img src={image} alt={product.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Store className="w-3 h-3 text-blue-600" />
                      <span className="font-semibold">{product.store?.storeName || store?.storeName || 'Official Merchant'}</span>
                    </div>
                    <Link
                      to={`/products/${product._id}`}
                      className="font-bold text-sm text-slate-900 hover:text-blue-600 line-clamp-1 transition"
                    >
                      {product.title}
                    </Link>
                    <div className="text-xs text-slate-500">
                      Unit Price: <span className="font-bold text-slate-800">₹{itemPrice.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Quantity Adjustment & Subtotal */}
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="flex items-center border border-slate-300 rounded-lg bg-white shadow-2xs">
                    <button
                      onClick={() => updateQuantity(product._id, quantity - 1)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold text-sm cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-xs font-bold text-slate-900">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(product._id, quantity + 1)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 font-bold text-sm cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[90px]">
                    <div className="text-base font-extrabold text-slate-900">
                      ₹{itemSubtotal.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        toggleWishlist(product);
                        removeFromCart(product._id);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Move to Wishlist"
                      aria-label="Move to Wishlist"
                    >
                      <Heart className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => removeFromCart(product._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
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
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping for More Items</span>
            </Link>
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="lg:col-span-4">
          <div className="bright-card p-6 rounded-2xl space-y-5 sticky top-24">
            <h2 className="text-base font-black text-slate-900 pb-3 border-b border-slate-100">
              Order Summary
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Direct Merchant Delivery</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Estimated Taxes & Fees</span>
                <span className="text-xs text-slate-400">Included</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-base font-black text-slate-900">
                <span>Total Amount</span>
                <span className="text-xl text-blue-600">₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-slate-600">
              <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>Payment processed securely via Razorpay. Held safely in Admin escrow.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
