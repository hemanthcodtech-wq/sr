import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Truck,
  Package,
  Search,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileText,
  AlertCircle,
  HelpCircle,
  Store,
  ChevronRight,
  ShieldCheck,
  Check,
  RotateCcw,
  Sparkles,
  Phone,
  MessageCircle,
  Layers,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const OrderTracking = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { wishlistCount } = useCart();

  const [query, setQuery] = useState(id || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (id) {
      setQuery(id);
      fetchTracking(id);
    } else {
      const params = new URLSearchParams(location.search);
      const q = params.get('q');
      if (q) {
        setQuery(q);
        fetchTracking(q);
      } else {
        // Auto fetch the most recent active/live order
        fetchLatestActiveOrder();
      }
    }
  }, [id, location]);

  const fetchLatestActiveOrder = async () => {
    try {
      const res = await api.get('/orders/my-orders');
      if (res.data?.success && res.data.orders?.length > 0) {
        // Find first order that is live (not delivered or cancelled)
        const liveOrder = res.data.orders.find(
          (o) => o.deliveryStatus !== 'Delivered' && o.deliveryStatus !== 'Cancelled'
        ) || res.data.orders[0];
        setOrder(liveOrder);
        setQuery(liveOrder.invoiceNumber || liveOrder._id);
      }
    } catch (_) {}
  };

  const fetchTracking = async (trackingRef) => {
    if (!trackingRef || !trackingRef.trim()) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get(`/orders/track/${encodeURIComponent(trackingRef.trim())}`);
      if (res.data?.success) {
        const fetchedOrder = res.data.order;
        // User rule: tracking should come ONLY for orders that are live placed and not delivered
        if (fetchedOrder.deliveryStatus === 'Delivered') {
          setErrorMsg('This order has already been Delivered. Tracking is completed.');
        }
        setOrder(fetchedOrder);
      } else {
        setErrorMsg('No tracking records found for this reference code.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Could not locate shipment for this tracking reference.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      fetchTracking(query.trim());
    }
  };

  // Steps for vertical tracker matching Screenshot 3
  const trackingSteps = [
    { id: 1, label: 'Order Placed', desc: 'Order confirmed and registered in database' },
    { id: 2, label: 'Confirmed', desc: 'Current status — order verified with merchant' },
    { id: 3, label: 'Packed', desc: 'Item packaged securely at seller hub' },
    { id: 4, label: 'Shipped', desc: 'Handed over to Delhivery Express / logistics partner' },
    { id: 5, label: 'Out for Delivery', desc: 'Delivery agent en route to your address' },
    { id: 6, label: 'Delivered', desc: 'Package delivered to customer' },
  ];

  // Helper to determine active step index
  const getActiveStepIndex = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered')) return 6;
    if (s.includes('out')) return 5;
    if (s.includes('shipped')) return 4;
    if (s.includes('packed')) return 3;
    if (s.includes('confirmed')) return 2;
    return 1;
  };

  const [selectedPackageIndex, setSelectedPackageIndex] = useState(0);

  // Group items by fulfillment package (Split Fulfillment Architecture)
  const packages = React.useMemo(() => {
    if (!order || !order.items || order.items.length === 0) return [];
    const vendorItems = order.items.filter((i) => i.sourceType !== 'admin_catalog' && i.fulfillmentType !== 'admin_central');
    const centralItems = order.items.filter((i) => i.sourceType === 'admin_catalog' || i.fulfillmentType === 'admin_central');

    const pkgs = [];
    if (vendorItems.length > 0) {
      pkgs.push({
        id: 'pkg_vendor',
        label: 'Package 1 • Merchant Direct Dispatch',
        origin: vendorItems[0]?.store?.storeName || 'Merchant Store',
        hub: 'Merchant Warehouse Hub',
        type: 'vendor',
        status: vendorItems[0]?.deliveryStatus || order.deliveryStatus || 'Confirmed',
        trackingNumber: vendorItems[0]?.trackingNumber || order.trackingNumber || '',
        courierName: vendorItems[0]?.courierName || order.courierName || 'Merchant Logistics Partner',
        items: vendorItems,
      });
    }
    if (centralItems.length > 0) {
      pkgs.push({
        id: 'pkg_central',
        label: `Package ${pkgs.length + 1} • SR Central Warehouse`,
        origin: 'SR Marketplace Central Logistics Hub',
        hub: 'Central Warehouse (Pan-India Logistics)',
        type: 'central',
        status: centralItems[0]?.deliveryStatus || 'Processing',
        trackingNumber: centralItems[0]?.sourceTrackingNumber || centralItems[0]?.trackingNumber || '',
        courierName: centralItems[0]?.courierName || 'SR Express Central Logistics',
        items: centralItems,
      });
    }

    return pkgs.length > 0 ? pkgs : [{
      id: 'pkg_single',
      label: 'Package 1 • Standard Delivery',
      origin: order.items[0]?.store?.storeName || 'SR Marketplace',
      hub: 'Central Facility',
      type: 'standard',
      status: order.deliveryStatus || 'Confirmed',
      trackingNumber: order.trackingNumber || '',
      courierName: order.courierName || 'Delhivery Express',
      items: order.items,
    }];
  }, [order]);

  const activePackage = packages[selectedPackageIndex] || packages[0];
  const currentStep = getActiveStepIndex(activePackage?.status || order?.deliveryStatus || order?.items?.[0]?.deliveryStatus || 'Confirmed');
  const isDelivered = ((activePackage?.status || order?.deliveryStatus) || '').toLowerCase() === 'delivered';

  return (
    <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 select-none font-sans">
      {/* 3-Column Layout matching Screenshot 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Customer Status & Nav Menu (lg:col-span-3) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Top User Phone Pill */}
          <div className="glow-card p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0f8a48] text-white flex items-center justify-center font-black text-xl shadow-md flex-shrink-0">
                +
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-sm text-slate-900 truncate">
                  {user?.phone ? `+91 ${user.phone}` : user?.name || '+918978239929'}
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Verified
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-center">
              <Link to="/orders" className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition">
                <div className="text-lg font-black text-slate-900 leading-none">1</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-1">Orders</div>
              </Link>
              <Link to="/wishlist" className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 transition group">
                <div className="text-lg font-black text-slate-900 group-hover:text-rose-600 leading-none">{wishlistCount}</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-1">Wishlist</div>
              </Link>
            </div>
          </div>

          {/* Navigation Links Group */}
          <div className="glow-card p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4 text-xs font-semibold">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Overview</span>
              <Link
                to="/profile"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <Package className="w-4 h-4 text-slate-400" />
                <span>Dashboard</span>
              </Link>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Orders</span>
              <Link
                to="/orders"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <Package className="w-4 h-4 text-slate-400" />
                <span>My Orders</span>
              </Link>
              <Link
                to="/track-order"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60 shadow-2xs"
              >
                <div className="flex items-center gap-2.5">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Order Tracking</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
              </Link>
              <Link
                to="/profile?tab=returns"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <RotateCcw className="w-4 h-4 text-blue-500" />
                <span>Returns &amp; Refunds</span>
              </Link>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2">Shopping</span>
              <Link
                to="/wishlist"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <Heart className="w-4 h-4 text-rose-500" />
                <span>Wishlist</span>
              </Link>
              <Link
                to="/stores"
                className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <Store className="w-4 h-4 text-purple-500" />
                <span>Followed Stores</span>
              </Link>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Order Tracking Card & Timeline (lg:col-span-6 matching Screenshot 3) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Order Tracking</h1>
            {order && (
              <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-mono font-bold text-xs">
                {order.invoiceNumber || order._id} • {order.deliveryStatus || 'Confirmed'}
              </span>
            )}
          </div>

          {/* If order is delivered, show note as requested: tracking only for live placed & not delivered */}
          {isDelivered && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>This order has already been successfully delivered to your address!</span>
              </div>
              <Link to="/orders" className="font-bold underline hover:text-emerald-950">
                View in Orders
              </Link>
            </div>
          )}

          {/* Main Tracking Details Card */}
          {order ? (
            <div className="glow-card p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
              {/* Top Header Row with Status Badge */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    Order {order.invoiceNumber || order._id}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Placed{' '}
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                  <div className="text-xl font-black text-slate-900 mt-2">
                    ₹{order.totalAmount?.toLocaleString('en-IN')}
                  </div>
                </div>

                <span className="px-3 py-1 rounded-md bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300">
                  {order.deliveryStatus || 'Confirmed'}
                </span>
              </div>

              {/* Split Package Selector Tabs if Order has Multiple Fulfillment Packages */}
              {packages.length > 1 && (
                <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-blue-950 flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <span>Split Fulfillment ({packages.length} Independent Packages)</span>
                    </span>
                    <span className="text-[10px] text-blue-800 font-bold bg-white px-2 py-0.5 rounded-md border border-blue-200">
                      Dispatched Independently
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {packages.map((pkg, idx) => (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedPackageIndex(idx)}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          selectedPackageIndex === idx
                            ? 'bg-white border-[#0c2a5e] shadow-sm ring-2 ring-blue-100'
                            : 'bg-white/60 hover:bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-black text-slate-900">{pkg.label}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                            {pkg.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1 truncate">
                          Origin: <strong className="text-slate-800">{pkg.origin}</strong>
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-100">
                          <span>{pkg.items.length} item{pkg.items.length > 1 ? 's' : ''}</span>
                          {pkg.trackingNumber && <span className="font-mono">AWB: {pkg.trackingNumber}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Package Items Card */}
              {activePackage && (
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {activePackage.type === 'central' ? (
                        <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
                          <Layers className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                          <Store className="w-4 h-4" />
                        </span>
                      )}
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">{activePackage.label}</h4>
                        <p className="text-[11px] text-slate-500">
                          Fulfilled by: <strong>{activePackage.origin}</strong> • Courier: {activePackage.courierName}
                        </p>
                      </div>
                    </div>

                    {activePackage.trackingNumber && (
                      <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-mono text-[11px] text-slate-700 font-bold shadow-2xs">
                        AWB: {activePackage.trackingNumber}
                      </span>
                    )}
                  </div>

                  {/* Items list inside this active package */}
                  <div className="divide-y divide-slate-200/60 pt-1">
                    {activePackage.items.map((it, idx) => (
                      <div key={it._id || idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={it.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                            alt={it.title}
                            className="w-10 h-10 rounded-lg object-contain bg-white border border-slate-200 flex-shrink-0 p-0.5"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-800 truncate">{it.title}</p>
                            <span className="text-[10px] text-slate-500">Qty: {it.quantity || 1} • ₹{((it.price || 0) * (it.quantity || 1)).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-700 flex-shrink-0">
                          {it.deliveryStatus || activePackage.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3 Metric Summary Pillars matching Screenshot 3 */}
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Items</span>
                  <strong className="text-slate-900 text-sm font-black">{order.items?.length || 1}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Payment</span>
                  <strong className="text-slate-900 text-xs font-bold uppercase">{order.paymentMethod || 'COD'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Delivery</span>
                  <strong className="text-emerald-700 text-xs font-bold">In Transit</strong>
                </div>
              </div>

              {/* Stepper Timeline matching Screenshot 3 */}
              <div className="space-y-4 pt-1">
                <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">Tracking Timeline</h3>

                <div className="relative pl-7 space-y-6">
                  {/* Vertical Guide Line */}
                  <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-slate-200" />

                  {trackingSteps.map((step) => {
                    const isPassed = currentStep > step.id;
                    const isCurrent = currentStep === step.id;

                    return (
                      <div key={step.id} className="relative flex items-start gap-4">
                        {/* Circle Bullet with Check or Number */}
                        <div
                          className={`absolute -left-7 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-xs transition-all ${
                            isPassed || isCurrent
                              ? 'bg-purple-600 text-white ring-4 ring-purple-100'
                              : 'bg-white border-2 border-slate-300 text-slate-400'
                          }`}
                        >
                          {isPassed ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : isCurrent ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            step.id
                          )}
                        </div>

                        {/* Step Details */}
                        <div className="space-y-0.5 min-w-0">
                          <p
                            className={`text-xs sm:text-sm font-extrabold leading-tight ${
                              isCurrent ? 'text-purple-700' : isPassed ? 'text-slate-900' : 'text-slate-400'
                            }`}
                          >
                            {step.label}
                          </p>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-purple-600 block">Current status</span>
                          )}
                          <p className="text-[11px] text-slate-400 leading-snug">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* View Full Order Details Link */}
              <div className="pt-2 border-t border-slate-100">
                <Link
                  to="/orders"
                  className="text-xs font-bold text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1"
                >
                  <span>View full order details</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="glow-card p-12 text-center space-y-3 bg-white">
              <Truck className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Live Active Orders</h3>
              <p className="text-xs text-slate-400">Live order tracking is displayed only for active non-delivered orders.</p>
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0c2a5e] text-white font-bold text-xs"
              >
                <span>Shop Marketplace</span>
              </Link>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Edit Profile Card, Need Help & Status (lg:col-span-3 matching Screenshot 3) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Gradient User Card with Edit Profile */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg space-y-3">
            <div>
              <span className="text-[10px] text-purple-200 block uppercase font-bold tracking-wider">Signed in as</span>
              <strong className="text-sm font-extrabold block truncate">
                {user?.phone ? `+91 ${user.phone}` : user?.name || '+918978239929'}
              </strong>
            </div>
            <Link
              to="/profile"
              className="block w-full text-center py-2 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md transition shadow-xs"
            >
              Edit Profile
            </Link>
          </div>

          {/* Quick Links */}
          <div className="glow-card p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3 text-xs">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">Quick Links</h4>
            <div className="space-y-2">
              <Link to="/orders" className="flex items-center gap-2.5 text-slate-700 hover:text-purple-700 transition">
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <span>My Orders</span>
              </Link>
              <Link to="/profile?tab=addresses" className="flex items-center gap-2.5 text-slate-700 hover:text-purple-700 transition">
                <MapPin className="w-3.5 h-3.5 text-rose-500" />
                <span>Saved Addresses</span>
              </Link>
              <Link to="/wishlist" className="flex items-center gap-2.5 text-slate-700 hover:text-purple-700 transition">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span>Wishlist</span>
              </Link>
              <Link to="/profile?tab=returns" className="flex items-center gap-2.5 text-slate-700 hover:text-purple-700 transition">
                <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                <span>Returns &amp; Refunds</span>
              </Link>
            </div>
          </div>

          {/* Need Help Card matching Screenshot 3 */}
          <div className="glow-card p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3 text-xs">
            <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">Need Help?</h4>
            <div className="space-y-2.5">
              <Link to="/contact" className="flex items-center gap-2.5 text-slate-700 hover:text-purple-700 transition">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Contact Support</span>
              </Link>
              <Link to="/profile?tab=returns" className="flex items-center gap-2.5 text-slate-700 hover:text-purple-700 transition">
                <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
                <span>Return an Order</span>
              </Link>
              <Link to="/track-order" className="flex items-center gap-2.5 text-slate-700 hover:text-purple-700 transition">
                <Truck className="w-3.5 h-3.5 text-amber-500" />
                <span>Track Your Order</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
