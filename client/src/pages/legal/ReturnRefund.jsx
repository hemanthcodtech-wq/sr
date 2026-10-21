import React from 'react';
import { RotateCcw } from 'lucide-react';

const ReturnRefund = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-slate-200 pb-4 space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
          <RotateCcw className="w-4 h-4" />
          <span>Customer Protection</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Return & Refund Policy</h1>
        <p className="text-xs text-slate-500">Effective Date: October 2026</p>
      </div>

      <div className="bright-card p-8 rounded-3xl border-slate-200 space-y-6 text-sm text-slate-600 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. 7-Day Replacement Guarantee</h2>
          <p>
            Customers may request a replacement or return within 7 calendar days of physical delivery if an item arrives damaged, defective, materially different from the seller's description, or incomplete.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Return Eligibility Criteria</h2>
          <p>
            Products must be returned in their original packaging with all tags, serial numbers, manuals, and accessories intact. Consumable goods or intimate apparel cannot be returned once opened.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Refund Processing</h2>
          <p>
            Upon the vendor receiving the returned merchandise and verifying its condition, Admin releases the refund back to the customer's original payment method via Razorpay within 3–5 business days.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Dispute Escalation</h2>
          <p>
            In the event of disagreement between a buyer and a vendor regarding an order, NexMart Marketplace Administration retains ultimate arbitration authority to ensure fair resolution.
          </p>
        </section>
      </div>
    </div>
  );
};

export default ReturnRefund;
