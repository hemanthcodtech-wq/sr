import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Calendar,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Clock,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import VendorLayout from '../../components/vendor/VendorLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const statusOptions = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const VendorOrders = () => {
  const { success, error, info } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/vendor/orders');
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('Failed to load vendor orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, itemId, newStatus) => {
    setUpdatingId(itemId);
    try {
      const res = await api.put(`/orders/${orderId}/items/${itemId}/delivery-status`, {
        status: newStatus,
      });

      if (res.data.success) {
        if (newStatus === 'Delivered') {
          success(`Marked as Delivered! Net order earnings credited directly to your vendor wallet.`);
        } else {
          info(`Order item delivery status updated to ${newStatus}`);
        }
        fetchOrders();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Could not update delivery status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <VendorLayout
      title="Orders & Shipments"
      subtitle="Check customer delivery addresses, prepare packages, and dispatch directly to buyers."
    >
      <div className="space-y-6">

      {/* Settlement Info Notice */}
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">Automated Order Settlement Protocol:</span>
          <p className="text-slate-600 leading-relaxed">
            Customer payments are held securely by Admin. Once you deliver the product and mark its status as <strong>"Delivered"</strong>, your net earnings (after 10% platform commission) are immediately transferred into your Vendor Wallet, ready for bank withdrawal!
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bright-card p-6 rounded-2xl h-44 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="bright-card rounded-2xl overflow-hidden border border-slate-200">
              {/* Order Header */}
              <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-4 text-slate-600">
                  <div>
                    <span className="text-slate-400">Invoice: </span>
                    <strong className="text-slate-900 font-mono">#{order.invoiceNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Date: </span>
                    <strong>{new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Payment: </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      PAID (Razorpay Escrow)
                    </span>
                  </div>
                </div>

                <div className="text-sm font-extrabold text-slate-900">
                  Your Store Subtotal: ₹{order.vendorSubtotal?.toLocaleString('en-IN')}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                {/* Left: Line Items & Status Updater */}
                <div className="lg:col-span-7 p-5 space-y-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Products To Deliver</h3>
                  <div className="divide-y divide-slate-100">
                    {order.items?.map((item) => (
                      <div key={item._id} className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80'}
                            alt={item.title}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                          />
                          <div>
                            <div className="font-bold text-sm text-slate-900">{item.title}</div>
                            <div className="text-xs text-slate-500">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</div>
                          </div>
                        </div>

                        {/* Status Change Selector */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-semibold">Delivery:</span>
                          <select
                            value={item.deliveryStatus}
                            onChange={(e) => handleStatusChange(order._id, item._id, e.target.value)}
                            disabled={updatingId === item._id}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border focus:outline-none cursor-pointer ${
                              item.deliveryStatus === 'Delivered'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : item.deliveryStatus === 'Shipped' || item.deliveryStatus === 'Out for Delivery'
                                ? 'bg-blue-50 text-blue-700 border-blue-300'
                                : 'bg-slate-50 text-slate-700 border-slate-300'
                            }`}
                          >
                            {statusOptions.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Customer Shipping Address */}
                <div className="lg:col-span-5 p-5 bg-slate-50/40 space-y-3 text-xs">
                  <h3 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span>Customer Delivery Destination</span>
                  </h3>

                  <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200">
                    <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.shippingAddress?.fullName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.shippingAddress?.phone}</span>
                    </div>
                    <div className="text-slate-600 pt-1 leading-relaxed border-t border-slate-100 mt-2">
                      {order.shippingAddress?.street},<br />
                      {order.shippingAddress?.city}, {order.shippingAddress?.state} - <strong>{order.shippingAddress?.zipCode}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bright-card p-12 text-center rounded-2xl space-y-3">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No orders awaiting delivery</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When customers order your products, delivery shipping addresses will display here automatically.
          </p>
        </div>
      )}
      </div>
    </VendorLayout>
  );
};

export default VendorOrders;
