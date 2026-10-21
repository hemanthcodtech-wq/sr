import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, Calendar, Store, FileText, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import api from '../services/api';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/my-orders');
        if (res.data && res.data.success) {
          setOrders(res.data.orders);
        }
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Out for Delivery':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Shipped':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Order History</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Track fulfillment & package delivery from individual store merchants
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bright-card p-6 rounded-2xl h-48 animate-pulse bg-slate-100" />
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
                    <span className="text-slate-400">Order ID: </span>
                    <strong className="text-slate-900 font-mono">#{order.invoiceNumber || order._id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Placed on: </span>
                    <strong className="text-slate-800">{new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Payment: </span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase">
                      {order.paymentStatus} via {order.paymentMethod}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`http://localhost:5000/api/orders/${order._id}/invoice-preview`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-blue-600 hover:border-blue-300 font-semibold transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>View / Print Invoice</span>
                  </a>
                </div>
              </div>

              {/* Order Items List */}
              <div className="p-5 divide-y divide-slate-100">
                {order.items?.map((item) => (
                  <div key={item._id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80'}
                        alt={item.title}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Store className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-semibold text-slate-700">{item.store?.storeName || 'Merchant'}</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                        <div className="text-xs text-slate-500">
                          Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:items-end gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(item.deliveryStatus)}`}>
                        <Truck className="w-3.5 h-3.5" />
                        <span>Status: {item.deliveryStatus}</span>
                      </span>
                      {item.trackingNumber && (
                        <span className="text-[11px] text-slate-500 font-mono">
                          Tracking: {item.trackingNumber}
                        </span>
                      )}
                      <div className="text-sm font-extrabold text-slate-900">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address Footer */}
              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-between text-xs text-slate-500">
                <div>
                  <span className="font-bold text-slate-700">Delivering to: </span>
                  {order.shippingAddress?.fullName}, {order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zipCode}
                </div>
                <div className="font-extrabold text-slate-900 text-sm mt-2 sm:mt-0">
                  Total Order Amount: ₹{order.totalAmount?.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bright-card p-12 text-center rounded-2xl space-y-4">
          <Package className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">You haven't placed any orders yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Discover thousands of authentic items from independent registered vendors.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition"
          >
            <span>Explore Marketplace</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyOrders;
