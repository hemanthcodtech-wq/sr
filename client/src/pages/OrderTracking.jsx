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
} from 'lucide-react';
import api from '../services/api';

const OrderTracking = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [query, setQuery] = useState(id || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initial load if :id is provided in URL
  useEffect(() => {
    if (id) {
      setQuery(id);
      fetchTracking(id);
    } else {
      // Check query param ?q=
      const params = new URLSearchParams(location.search);
      const q = params.get('q');
      if (q) {
        setQuery(q);
        fetchTracking(q);
      }
    }
  }, [id, location]);

  const fetchTracking = async (trackingRef) => {
    if (!trackingRef || !trackingRef.trim()) return;

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get(`/orders/track/${encodeURIComponent(trackingRef.trim())}`);
      if (res.data?.success) {
        setOrder(res.data.order);
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Out for Delivery':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Processing':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const currentStatus = order?.items?.[0]?.deliveryStatus || 'Shipped';

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-14 py-8 space-y-8 select-none">
      {/* Top Header & Breadcrumb */}
      <div className="border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <Link to="/" className="hover:text-[#0c2a5e]">Home</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <Link to="/profile?tab=orders" className="hover:text-[#0c2a5e]">My Orders</Link>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-900 font-semibold">Live Order Tracking</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Live Logistics &amp; Courier Tracking
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Real-time delivery progress updates and milestone inspection
            </p>
          </div>
          <Link
            to="/profile?tab=orders"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Customer Portal</span>
          </Link>
        </div>
      </div>

      {/* Lookup Bar */}
      <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              placeholder="Enter AWB Tracking No., Order ID, or Invoice No. (e.g. AWB892110293)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-[#0c2a5e] hover:bg-[#153e85] text-white font-extrabold text-xs sm:text-sm rounded-2xl transition shadow-sm cursor-pointer disabled:bg-slate-300"
          >
            {loading ? 'Locating...' : 'Track Package'}
          </button>
        </form>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Shipment Details & Timeline */}
      {loading ? (
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-44 bg-slate-100 rounded-3xl animate-pulse" />
          <div className="h-80 bg-slate-100 rounded-3xl animate-pulse" />
        </div>
      ) : order ? (
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Main Courier Header Banner */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#0c2a5e] text-white flex items-center justify-center font-black">
                  <Truck className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[11px] font-extrabold text-blue-900 uppercase tracking-wider block">
                    {order.courierName || 'Delhivery Express Logistics'}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">AWB Tracking Code:</span>
                    <strong className="text-base font-mono font-black text-slate-900">
                      {order.trackingNumber || order.items?.[0]?.trackingNumber || 'AWB892110293'}
                    </strong>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Order Ref: #{order.invoiceNumber || order._id}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Estimated Delivery</span>
                  <strong className="text-sm text-slate-900 font-extrabold">
                    {order.estimatedDelivery
                      ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '2-3 Business Days'}
                  </strong>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusBadge(currentStatus)}`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{currentStatus}</span>
                </span>
              </div>
            </div>

            {/* Stepper Milestones */}
            <div className="py-2">
              <h3 className="text-sm font-extrabold text-slate-900 mb-6">Live Transit Milestones</h3>
              <div className="relative pl-6 sm:pl-8 border-l-2 border-blue-200 space-y-8 ml-3">
                {(order.trackingTimeline && order.trackingTimeline.length > 0
                  ? order.trackingTimeline
                  : [
                      {
                        status: 'Order Placed',
                        title: 'Order Confirmed & Payment Received',
                        description: 'Transaction settled and verified.',
                        location: 'Payment Gateway Facility',
                        timestamp: new Date(Date.now() - 2 * 86400000),
                      },
                      {
                        status: 'Processing',
                        title: 'Packed & Dispatched by Merchant',
                        description: 'Merchant completed packaging and manifest.',
                        location: 'Seller Warehouse Hub',
                        timestamp: new Date(Date.now() - 36 * 3600000),
                      },
                      {
                        status: 'Shipped',
                        title: 'In Transit with Express Logistics',
                        description: 'Consignment en route to local hub.',
                        location: 'Sorting Center',
                        timestamp: new Date(Date.now() - 12 * 3600000),
                      },
                    ]
                ).map((step, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-6 h-6 rounded-full bg-white border-4 border-[#0c2a5e] flex items-center justify-center shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0c2a5e]"></span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">{step.title}</h4>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(step.timestamp).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>
                      {step.location && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                          <MapPin className="w-3 h-3 text-[#0c2a5e]" />
                          <span>{step.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery Destination & Product Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            {/* Address */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm pb-2 border-b border-slate-100">
                <MapPin className="w-4 h-4 text-[#0c2a5e]" />
                <span>Delivery Address</span>
              </div>
              <div>
                <strong className="text-sm font-bold text-slate-900 block">
                  {order.shippingAddress?.fullName}
                </strong>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}
                </p>
                <p className="text-slate-500 mt-1">
                  Contact Phone: <span className="font-semibold text-slate-800">{order.shippingAddress?.phone}</span>
                </p>
              </div>
            </div>

            {/* Shipment Items */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                  <Package className="w-4 h-4 text-[#0c2a5e]" />
                  <span>Items in Shipment</span>
                </div>
                <a
                  href={`http://localhost:5000/api/orders/${order._id}/invoice-preview`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0c2a5e] hover:underline"
                >
                  <FileText className="w-3 h-3" />
                  <span>View Tax Invoice</span>
                </a>
              </div>

              <div className="divide-y divide-slate-100">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&auto=format&fit=crop&q=80'}
                        alt={item.title}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900 line-clamp-1 max-w-[180px]">{item.title}</div>
                        <div className="text-[11px] text-slate-500">Qty: {item.quantity}</div>
                      </div>
                    </div>
                    <strong className="text-slate-900 font-extrabold">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </strong>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center font-bold text-slate-900">
                <span>Grand Total Paid:</span>
                <span className="text-sm font-black">₹{order.totalAmount?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default OrderTracking;
