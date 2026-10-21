import React from 'react';
import { Truck } from 'lucide-react';

const Shipping = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-slate-200 pb-4 space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
          <Truck className="w-4 h-4" />
          <span>Fulfillment Information</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Shipping & Delivery Policy</h1>
        <p className="text-xs text-slate-500">Effective Date: October 2026</p>
      </div>

      <div className="bright-card p-8 rounded-3xl border-slate-200 space-y-6 text-sm text-slate-600 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Direct Vendor Dispatch</h2>
          <p>
            On NexMart, items are packaged and dispatched directly by the respective independent merchant operating the store. This direct fulfillment model eliminates depot holding delays.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Processing & Dispatch Timelines</h2>
          <p>
            Merchants are required to dispatch orders within 24 to 48 hours of order confirmation. Once dispatched, tracking details and courier consignment numbers are updated on the customer's order tracking dashboard.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Estimated Delivery Times</h2>
          <p>
            Standard transit typically takes 2 to 5 business days for major metropolitan areas and 4 to 7 business days for regional destinations across India.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Free Marketplace Shipping</h2>
          <p>
            Standard shipping is provided free on all catalog orders across India, with platform charges subsidized for customer convenience.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Shipping;
