import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
  Package,
  Wallet,
  Banknote,
  Tag,
  MapPin,
  ChevronRight,
  FileText,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const Checkout = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, refreshUser } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  // Selected Saved Address index or 'custom'
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    phone: user?.phone || '',
    street: user?.savedAddresses?.[0]?.street || user?.address || '',
    city: user?.savedAddresses?.[0]?.city || '',
    state: user?.savedAddresses?.[0]?.state || '',
    zipCode: user?.savedAddresses?.[0]?.zipCode || '',
    country: 'India',
  });

  // Autofill when user addresses load
  useEffect(() => {
    if (user?.savedAddresses && user.savedAddresses.length > 0) {
      const defaultAddr = user.savedAddresses.find((a) => a.isDefault) || user.savedAddresses[0];
      setShippingAddress({
        fullName: defaultAddr.fullName || user.name || '',
        phone: defaultAddr.phone || user.phone || '',
        street: defaultAddr.street || '',
        city: defaultAddr.city || '',
        state: defaultAddr.state || '',
        zipCode: defaultAddr.zipCode || '',
        country: defaultAddr.country || 'India',
      });
    }
  }, [user]);

  // Payment method: 'Razorpay' | 'Wallet' | 'Cash on Delivery'
  const [paymentMethod, setPaymentMethod] = useState('Razorpay');

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);

  // Calculate final payable amount after coupon
  const finalPayable = Math.max(0, cartTotal - couponDiscount);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'REF200' || code.startsWith('REF200-') || code.startsWith('CUST-')) {
      const disc = Math.min(200, cartTotal);
      setCouponDiscount(disc);
      setAppliedCoupon({ code: code, discount: disc, desc: '₹200 Referral Shopping Reward' });
      success(`Referral Coupon ${code} applied! ₹${disc} deducted.`);
    } else if (code === 'TWO15') {
      if (cartTotal < 20000) {
        error('Coupon TWO15 requires a minimum cart value of ₹20,000');
        return;
      }
      setCouponDiscount(1500);
      setAppliedCoupon({ code: 'TWO15', discount: 1500, desc: '₹1,500 Special Savings' });
      success('Promo TWO15 applied! ₹1,500 deducted.');
    } else if (code === 'DASARA20') {
      const disc = Math.min(1000, cartTotal);
      setCouponDiscount(disc);
      setAppliedCoupon({ code: 'DASARA20', discount: disc, desc: 'Festive ₹1,000 Discount' });
      success('Promo DASARA20 applied! ₹1,000 deducted.');
    } else if (code === 'AMEZON10') {
      const disc = Math.round((cartTotal * 10) / 100);
      setCouponDiscount(disc);
      setAppliedCoupon({ code: 'AMEZON10', discount: disc, desc: '10% Instant Marketplace Discount' });
      success('Promo AMEZON10 applied! 10% deducted.');
    } else {
      error('Invalid promo code. Try REF200, DASARA20, or TWO15');
    }
  };

  const handleSelectSavedAddress = (addr, index) => {
    setSelectedAddressIndex(index);
    setShippingAddress({
      fullName: addr.fullName || user?.name || '',
      phone: addr.phone || user?.phone || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      zipCode: addr.zipCode || '',
      country: addr.country || 'India',
    });
  };

  const handleInputChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();

    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.street || !shippingAddress.city || !shippingAddress.zipCode) {
      error('Please complete all required shipping address fields');
      return;
    }

    // Check wallet balance if paying with Amezon Wallet
    if (paymentMethod === 'Wallet') {
      if ((user?.walletBalance || 0) < finalPayable) {
        error(`Insufficient wallet balance (₹${user?.walletBalance || 0}). Please select Razorpay or COD.`);
        return;
      }
    }

    setLoading(true);

    // If Wallet or COD: Call dedicated backend route
    if (paymentMethod === 'Wallet' || paymentMethod === 'Cash on Delivery') {
      try {
        const res = await api.post('/orders/cod-or-wallet-checkout', {
          items: cartItems,
          shippingAddress,
          totalAmount: finalPayable,
          paymentMethod,
        });

        if (res.data?.success) {
          clearCart();
          setOrderSuccess(res.data.order);
          success(`Order confirmed via ${paymentMethod}!`);
          if (refreshUser) refreshUser();

          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } catch (err) {
        error(err.response?.data?.message || 'Could not place order');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Default: Razorpay Payment Flow
    try {
      const res = await api.post('/orders/initiate-checkout', {
        items: cartItems,
        shippingAddress,
      });

      if (!res.data.success) {
        throw new Error(res.data.message || 'Could not initiate checkout');
      }

      const { order, razorpayKeyId, isMock, validatedItems, totalAmount } = res.data;

      if (!isMock && window.Razorpay && razorpayKeyId && !razorpayKeyId.includes('placeholder')) {
        const options = {
          key: razorpayKeyId,
          amount: Math.round(finalPayable * 100),
          currency: 'INR',
          name: 'Amezon.online Marketplace',
          description: `Checkout for ${cartItems.length} items`,
          image: '/favicon.svg',
          order_id: order.id,
          prefill: {
            name: shippingAddress.fullName,
            email: user?.email || 'customer@example.com',
            contact: shippingAddress.phone,
          },
          theme: {
            color: '#0c2a5e',
          },
          handler: async (response) => {
            await finalizeOrder({
              items: validatedItems,
              shippingAddress,
              totalAmount: finalPayable,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
              info('Checkout cancelled');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Simulated / Sandbox test checkout mode
        setPendingPaymentData({
          items: validatedItems,
          shippingAddress,
          totalAmount: finalPayable,
          orderId: order.id,
        });
        setShowSimulatedModal(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      error(err.response?.data?.message || err.message || 'Checkout failed');
      setLoading(false);
    }
  };

  const finalizeOrder = async (orderPayload) => {
    try {
      setLoading(true);
      const res = await api.post('/orders/verify-and-create', orderPayload);
      if (res.data?.success) {
        clearCart();
        setOrderSuccess(res.data.order);
        success('Order placed successfully! Merchants notified.');
        if (refreshUser) refreshUser();

        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      error(err.response?.data?.message || 'Could not confirm order');
    } finally {
      setLoading(false);
      setShowSimulatedModal(false);
    }
  };

  const handleSimulatedSuccess = async () => {
    if (!pendingPaymentData) return;
    await finalizeOrder({
      items: pendingPaymentData.items,
      shippingAddress: pendingPaymentData.shippingAddress,
      totalAmount: pendingPaymentData.totalAmount,
      razorpayOrderId: pendingPaymentData.orderId,
      razorpayPaymentId: `pay_mock_${Date.now()}`,
      razorpaySignature: 'simulated_valid_signature',
    });
  };

  // SUCCESS SCREEN
  if (orderSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6 select-none">
        <div className="bg-white p-8 sm:p-12 rounded-3xl border border-emerald-200 space-y-6 shadow-xl">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-12 h-12 animate-soft-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Order Confirmed &amp; Verified
            </span>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Order Placed Successfully!</h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Your order <strong className="text-slate-900 font-mono">#{orderSuccess.invoiceNumber}</strong> has been transmitted to independent store merchants for fulfillment.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-2.5">
            <div className="flex justify-between items-center">
              <span>Customer Name:</span>
              <strong className="text-slate-900">{orderSuccess.shippingAddress?.fullName}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Payment Mode:</span>
              <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase text-[10px]">
                {orderSuccess.paymentMethod} • {orderSuccess.paymentStatus}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Delivery Courier:</span>
              <strong className="text-blue-900">{orderSuccess.courierName || 'Delhivery Express Logistics'}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Tracking AWB Code:</span>
              <strong className="font-mono text-slate-900">{orderSuccess.trackingNumber || 'AWB892110293'}</strong>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-black text-slate-900">
              <span>Grand Total Paid:</span>
              <span>₹{orderSuccess.totalAmount?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to={`/order/${orderSuccess._id}`}
              className="flex-1 py-3 px-4 bg-[#0c2a5e] hover:bg-[#153e85] text-white font-extrabold text-xs sm:text-sm rounded-2xl transition shadow-md flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" />
              <span>Track Order Live</span>
            </Link>
            <Link
              to="/profile?tab=orders"
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs sm:text-sm rounded-2xl transition"
            >
              My Order History
            </Link>
            <a
              href={`http://localhost:5000/api/orders/${orderSuccess._id}/invoice-preview`}
              target="_blank"
              rel="noreferrer"
              className="py-3 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl transition flex items-center justify-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Tax Invoice</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // EMPTY CART SCREEN
  if (cartItems.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Package className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Your shopping cart is empty</h2>
        <Link to="/products" className="inline-block px-5 py-2.5 bg-[#0c2a5e] text-white text-xs font-bold rounded-xl">
          Start Exploring Products
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-14 py-8 space-y-8 select-none">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Checkout &amp; Delivery</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Review saved delivery addresses, apply discount coupons, and complete payment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Delivery Address & Payment Method Form */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleCheckoutSubmit} className="space-y-6">
            {/* 1. SAVED ADDRESS SELECTION */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#0c2a5e]" />
                  <h2 className="text-base font-black text-slate-900">1. Select Delivery Address</h2>
                </div>
                <Link to="/profile?tab=settings" className="text-xs font-bold text-[#0c2a5e] hover:underline">
                  Manage Addresses
                </Link>
              </div>

              {user?.savedAddresses && user.savedAddresses.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                  {user.savedAddresses.map((addr, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSavedAddress(addr, idx)}
                      className={`p-4 rounded-2xl border text-xs cursor-pointer transition flex flex-col justify-between ${
                        selectedAddressIndex === idx
                          ? 'border-[#0c2a5e] bg-blue-50/50 shadow-2xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-[10px] uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            {addr.tag || 'Home'}
                          </span>
                          {selectedAddressIndex === idx && (
                            <span className="text-[11px] font-bold text-[#0c2a5e] flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                            </span>
                          )}
                        </div>
                        <strong className="text-sm font-bold text-slate-900 block">{addr.fullName}</strong>
                        <p className="text-slate-600 line-clamp-2 mt-0.5">
                          {addr.street}, {addr.city} - {addr.zipCode}
                        </p>
                      </div>
                      <span className="text-slate-500 text-[11px] mt-2 block font-medium">Phone: {addr.phone}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Editable Shipping Address Fields */}
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Recipient Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      value={shippingAddress.fullName}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Contact Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={shippingAddress.phone}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label className="font-bold text-slate-700">Street Address &amp; House Number *</label>
                  <input
                    type="text"
                    name="street"
                    required
                    value={shippingAddress.street}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">City *</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">State *</label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={shippingAddress.state}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">PIN Code *</label>
                    <input
                      type="text"
                      name="zipCode"
                      required
                      value={shippingAddress.zipCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. PAYMENT METHOD SELECTION */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <CreditCard className="w-5 h-5 text-[#0c2a5e]" />
                <h2 className="text-base font-black text-slate-900">2. Payment Method</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Method 1: Online Payment (Cards, UPI, NetBanking, Wallets) */}
                <div
                  onClick={() => setPaymentMethod('Razorpay')}
                  className={`p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    paymentMethod === 'Razorpay'
                      ? 'border-[#0c2a5e] bg-blue-50/70 shadow-xs ring-2 ring-[#0c2a5e]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#0c2a5e] text-white flex items-center justify-center shadow-xs">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-sm font-extrabold text-slate-900 block">Online Payment</strong>
                      <p className="text-[11.5px] text-slate-500 mt-1 leading-relaxed">
                        UPI (GPay, PhonePe, Paytm), Credit / Debit Cards &amp; NetBanking
                      </p>
                    </div>
                  </div>
                  <span className="text-[10.5px] text-emerald-700 font-extrabold mt-3 inline-flex items-center gap-1">
                    ✓ Instant Confirmation &amp; Fast Dispatch
                  </span>
                </div>

                {/* Method 2: Cash on Delivery */}
                <div
                  onClick={() => setPaymentMethod('Cash on Delivery')}
                  className={`p-5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    paymentMethod === 'Cash on Delivery'
                      ? 'border-[#0c2a5e] bg-blue-50/70 shadow-xs ring-2 ring-[#0c2a5e]'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="text-sm font-extrabold text-slate-900 block">Cash on Delivery</strong>
                      <p className="text-[11.5px] text-slate-500 mt-1 leading-relaxed">
                        Pay cash or scan UPI QR code upon doorstep delivery
                      </p>
                    </div>
                  </div>
                  <span className="text-[10.5px] text-amber-700 font-extrabold mt-3 inline-flex items-center gap-1">
                    ● Pay at Doorstep
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>256-Bit Encrypted Secure Checkout</span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="py-3 px-8 rounded-2xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-extrabold text-sm shadow-md transition cursor-pointer disabled:bg-slate-300"
                >
                  {loading
                    ? 'Processing Order...'
                    : paymentMethod === 'Cash on Delivery'
                    ? `Place COD Order (₹${finalPayable.toLocaleString('en-IN')})`
                    : `Pay Online (₹${finalPayable.toLocaleString('en-IN')})`}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Column: Order Summary & Coupon Card */}
        <div className="lg:col-span-5 space-y-5">
          {/* Promo Coupon Application */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Tag className="w-4 h-4 text-amber-600" />
              <span>Have a Promo Coupon?</span>
            </div>

            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="Try DASARA20 or TWO15"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl uppercase font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#0c2a5e] text-white font-bold rounded-xl hover:bg-[#153e85] transition cursor-pointer"
              >
                Apply
              </button>
            </form>

            {appliedCoupon && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-bold flex justify-between items-center">
                <span>✓ {appliedCoupon.desc}</span>
                <span>-₹{appliedCoupon.discount.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          {/* Cart Items Summary */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 pb-3 border-b border-slate-100">
              Order Summary ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
            </h3>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
              {cartItems.map(({ product, quantity }) => {
                const itemPrice = product.discountPrice && product.discountPrice < product.price ? product.discountPrice : product.price;
                return (
                  <div key={product._id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&auto=format&fit=crop&q=80'}
                        alt={product.title}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 line-clamp-1 max-w-[170px]">{product.title}</h4>
                        <span className="text-slate-500">Qty: {quantity}</span>
                      </div>
                    </div>
                    <strong className="text-slate-900 font-extrabold">
                      ₹{(itemPrice * quantity).toLocaleString('en-IN')}
                    </strong>
                  </div>
                );
              })}
            </div>

            {/* Price Calculations */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount:</span>
                  <span>-₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Standard Delivery:</span>
                <span className="text-emerald-600 font-bold uppercase">FREE</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-black text-slate-900">
                <span>Total Payable:</span>
                <span className="text-base text-[#0c2a5e]">₹{finalPayable.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: SIMULATED TEST PAYMENT POPUP (SANDBOX MODE) */}
      {showSimulatedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0c2a5e] flex items-center justify-center mx-auto">
              <CreditCard className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="font-black text-slate-900 text-lg">Razorpay Sandbox Gateway</h3>
              <p className="text-xs text-slate-500">
                Simulating verified payment for ₹{pendingPaymentData?.totalAmount?.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <strong className="font-mono text-slate-800">{pendingPaymentData?.orderId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Items:</span>
                <strong className="text-slate-800">{pendingPaymentData?.items?.length} products</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <strong className="text-slate-800">{pendingPaymentData?.shippingAddress?.fullName}</strong>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSimulatedModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulatedSuccess}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm"
              >
                Authorize &amp; Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
