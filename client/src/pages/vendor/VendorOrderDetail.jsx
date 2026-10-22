import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  Calendar,
  CreditCard,
  User,
  Phone,
  FileText,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Send,
  ExternalLink,
  ShieldCheck,
  Building,
  Store,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const statusOptions = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
const popularCouriers = [
  'Delhivery Express',
  'BlueDart Logistics',
  'DTDC Express',
  'India Post Speed Post',
  'Shadowfax',
  'Ecom Express',
  'Self / Local Delivery',
];

const VendorOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  // Dispatch modal
  const [dispatchModal, setDispatchModal] = useState({
    open: false,
    itemId: null,
    itemTitle: '',
    courierName: 'Delhivery Express',
    trackingNumber: '',
  });

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/${id}`);
      if (res.data?.success) {
        setOrder(res.data.order);
      } else {
        error('Order details not found');
      }
    } catch (err) {
      console.error('Failed to load order details:', err);
      error(err.response?.data?.message || 'Could not fetch order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAddress = () => {
    if (!order?.shippingAddress) return;
    const addr = order.shippingAddress;
    const text = `${addr.fullName}\nPhone: ${addr.phone}\n${addr.street}, ${addr.city}, ${addr.state} - ${addr.zipCode}`;
    navigator.clipboard.writeText(text);
    setCopiedAddr(true);
    info('Customer shipping address copied!');
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleStatusUpdate = async (itemId, newStatus, courierName = null, trackingNumber = null) => {
    setUpdatingId(itemId);
    try {
      const payload = { status: newStatus };
      if (courierName) payload.courierName = courierName;
      if (trackingNumber) payload.trackingNumber = trackingNumber;

      const res = await api.put(`/orders/${order._id}/items/${itemId}/delivery-status`, payload);
      if (res.data?.success) {
        if (newStatus === 'Delivered') {
          success('Marked as Delivered! Net order revenue settled in your Vendor Wallet.');
        } else {
          info(`Delivery status updated to "${newStatus}"!`);
        }
        setDispatchModal({ ...dispatchModal, open: false });
        fetchOrderDetail();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const openDispatch = (item) => {
    setDispatchModal({
      open: true,
      itemId: item._id,
      itemTitle: item.title,
      courierName: item.courierName || 'Delhivery Express',
      trackingNumber: item.trackingNumber || `AWB${Math.floor(100000000 + Math.random() * 900000000)}`,
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-300';
      case 'Shipped':
        return 'bg-blue-500/10 text-blue-700 border-blue-300';
      case 'Out for Delivery':
        return 'bg-indigo-500/10 text-indigo-700 border-indigo-300';
      case 'Processing':
        return 'bg-amber-500/10 text-amber-700 border-amber-300';
      case 'Cancelled':
        return 'bg-rose-500/10 text-rose-700 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <VendorLayout
      title={`Order #${order?.invoiceNumber || id}`}
      subtitle="Complete merchant order breakdown, shipping destination, tax invoice, and delivery management."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/vendor/orders')}
            className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 font-bold text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Orders</span>
          </button>
          {order && (
            <a
              href={`http://localhost:5000/api/orders/${order._id}/invoice-preview`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-[#0c2a5e] to-[#174896] hover:from-[#091e42] hover:to-[#123875] text-white font-black text-xs transition shadow-sm flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>Print Tax Invoice (PDF)</span>
            </a>
          )}
        </div>
      }
    >
      {loading ? (
        <div className="space-y-4">
          <div className="p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 h-64 animate-pulse" />
          <div className="p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 h-96 animate-pulse" />
        </div>
      ) : !order ? (
        <div className="p-16 text-center rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-lg font-black text-slate-900">Order not found</h3>
          <p className="text-xs text-slate-500">The requested order ID does not exist or you do not have permission to view it.</p>
          <button
            onClick={() => navigate('/vendor/orders')}
            className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-bold text-xs"
          >
            Return to Orders
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Order Summary Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-6 sm:p-7 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Tax Compliant Order</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {order.paymentStatus || 'Paid'}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 font-mono">#{order.invoiceNumber}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Placed on {new Date(order.createdAt).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={`http://localhost:5000/api/orders/${order._id}/invoice-preview`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-2xl bg-blue-50 hover:bg-blue-100 text-[#0c2a5e] font-black text-xs border border-blue-200 flex items-center gap-1.5 transition shadow-2xs"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Download / Print GST Invoice</span>
                </a>
                <Link
                  to={`/order/${order._id}`}
                  className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-1.5 transition shadow-sm"
                >
                  <Truck className="w-4 h-4 text-amber-400" />
                  <span>Track Live Package</span>
                </Link>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 block">Payment Method</span>
                <strong className="text-sm font-bold text-slate-900 block truncate">
                  {order.paymentMethod || 'Online'}
                </strong>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 block">Total Items</span>
                <strong className="text-sm font-bold text-slate-900 block">
                  {order.items?.length || 0} Products
                </strong>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 block">Grand Total</span>
                <strong className="text-sm font-black text-slate-900 block">
                  ₹{order.totalAmount?.toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-1">
                <span className="text-[11px] font-semibold text-emerald-700 block">Store Share</span>
                <strong className="text-sm font-black text-emerald-800 block">
                  ₹{(order.vendorSubtotal || order.totalAmount)?.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>
          </div>

          {/* Main 2 Column Layout: Left items list / Right customer & shipping destination */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Products & Fulfillment Management (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span>Order Items &amp; Fulfillment</span>
                  </h3>
                  <span className="text-xs text-slate-400 font-bold">{order.items?.length || 0} product(s)</span>
                </div>

                <div className="divide-y divide-slate-100 space-y-4">
                  {order.items?.map((item) => (
                    <div key={item._id} className="pt-4 first:pt-0 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80'}
                            alt={item.title}
                            className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{item.title}</h4>
                            <div className="text-xs text-slate-500 font-medium mt-1">
                              Quantity: <strong className="text-slate-800">{item.quantity}</strong> × ₹{item.price?.toLocaleString('en-IN')}
                            </div>
                            {(item.courierName || item.trackingNumber) && (
                              <div className="text-[11px] text-blue-600 font-semibold mt-1 flex items-center gap-1.5">
                                <Truck className="w-3.5 h-3.5" />
                                <span>{item.courierName || 'Courier'}: {item.trackingNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border block mb-1 ${getStatusBadge(item.deliveryStatus)}`}>
                            {item.deliveryStatus}
                          </span>
                          <strong className="text-sm font-black text-slate-900">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </strong>
                        </div>
                      </div>

                      {/* Status Transition Control Strip */}
                      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/60 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Dispatch Action:</span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {item.deliveryStatus === 'Processing' && (
                            <button
                              onClick={() => openDispatch(item)}
                              disabled={updatingId === item._id}
                              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Dispatch / Ship Package</span>
                            </button>
                          )}

                          {item.deliveryStatus === 'Shipped' && (
                            <button
                              onClick={() => handleStatusUpdate(item._id, 'Out for Delivery')}
                              disabled={updatingId === item._id}
                              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Mark Out for Delivery</span>
                            </button>
                          )}

                          {(item.deliveryStatus === 'Shipped' || item.deliveryStatus === 'Out for Delivery') && (
                            <button
                              onClick={() => handleStatusUpdate(item._id, 'Delivered')}
                              disabled={updatingId === item._id}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Delivered (Claim ₹)</span>
                            </button>
                          )}

                          {item.deliveryStatus === 'Delivered' && (
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Delivered &amp; Settled in Wallet</span>
                            </span>
                          )}

                          {/* Override dropdown */}
                          <select
                            value={item.deliveryStatus}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val === 'Shipped') openDispatch(item);
                              else handleStatusUpdate(item._id, val);
                            }}
                            disabled={updatingId === item._id}
                            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold text-xs focus:outline-none cursor-pointer"
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Customer & Delivery Destination (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Shipping Address Box */}
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/90 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>Customer Shipping Address</span>
                  </h3>
                  <button
                    onClick={handleCopyAddress}
                    className="px-3 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
                  >
                    {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copiedAddr ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/60 space-y-3 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 font-black text-sm flex items-center justify-center shrink-0">
                      {(order.shippingAddress?.fullName || 'C').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">
                        {order.shippingAddress?.fullName || order.customer?.name || 'Customer'}
                      </div>
                      <div className="text-[11px] text-slate-400">Recipient Name</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-bold">{order.shippingAddress?.phone || order.customer?.phone || 'N/A'}</span>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 leading-relaxed text-slate-600 font-medium">
                    <div className="text-slate-900 font-bold">{order.shippingAddress?.street}</div>
                    <div>
                      {order.shippingAddress?.city}, {order.shippingAddress?.state}
                    </div>
                    <div className="text-slate-900 font-black mt-1">
                      Postal PIN: {order.shippingAddress?.zipCode}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax Invoice Direct Card */}
              <div className="bg-gradient-to-br from-[#0c2a5e] to-[#174896] text-white rounded-3xl p-6 shadow-md border border-blue-900 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white">Tax Compliant GST Invoice</h4>
                    <p className="text-xs text-blue-200">Invoice: #{order.invoiceNumber}</p>
                  </div>
                </div>
                <p className="text-xs text-blue-100/90 leading-relaxed">
                  Includes complete merchant GST breakdown, CGST 9% + SGST 9%, HSN details, and digital authorization seal.
                </p>
                <a
                  href={`http://localhost:5000/api/orders/${order._id}/invoice-preview`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition shadow-sm text-center flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View &amp; Print Full Invoice</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white/95 backdrop-blur-2xl max-w-md w-full p-6 sm:p-7 rounded-3xl border border-white/80 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="border-b border-slate-100 pb-3 flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Dispatch Package</h3>
                <p className="text-xs text-slate-500 font-medium truncate max-w-xs">{dispatchModal.itemTitle}</p>
              </div>
              <button
                onClick={() => setDispatchModal({ ...dispatchModal, open: false })}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Courier Partner *</label>
                <select
                  value={dispatchModal.courierName}
                  onChange={(e) => setDispatchModal({ ...dispatchModal, courierName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  {popularCouriers.map((courier) => (
                    <option key={courier} value={courier}>
                      {courier}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Tracking / AWB Number *</label>
                <input
                  type="text"
                  required
                  value={dispatchModal.trackingNumber}
                  onChange={(e) => setDispatchModal({ ...dispatchModal, trackingNumber: e.target.value })}
                  placeholder="e.g. AWB123456789"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                </input>
                <p className="text-[11px] text-slate-400">This tracking number is sent to the customer for live tracking.</p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDispatchModal({ ...dispatchModal, open: false })}
                  className="flex-1 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleStatusUpdate(
                      dispatchModal.itemId,
                      'Shipped',
                      dispatchModal.courierName,
                      dispatchModal.trackingNumber
                    )
                  }
                  className="flex-1 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md transition"
                >
                  Confirm Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </VendorLayout>
  );
};

export default VendorOrderDetail;
