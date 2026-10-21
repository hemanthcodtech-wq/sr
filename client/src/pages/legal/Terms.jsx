import React from 'react';
import { Shield, FileText } from 'lucide-react';

const Terms = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-slate-200 pb-4 space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
          <FileText className="w-4 h-4" />
          <span>Platform Agreement</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Terms of Service</h1>
        <p className="text-xs text-slate-500">Last updated: October 2026</p>
      </div>

      <div className="bright-card p-8 rounded-3xl border-slate-200 space-y-6 text-sm text-slate-600 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            By accessing, browsing, registering an account, or transacting on the NexMart Multi-Vendor Marketplace ("Platform"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must refrain from using the Platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Multi-Vendor Platform Structure</h2>
          <p>
            NexMart acts as an intermediary facilitating sales between verified independent third-party merchants ("Vendors") and buyers ("Customers"). Product packaging, manufacturing warranties, and shipping dispatch are the responsibility of the individual vendor.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Vendor Store Registration & Subscription Plans</h2>
          <p>
            To list products on the Platform, vendors must submit their store registration details and pay the designated subscription fee set by Platform Administration for a chosen validity period (e.g., 30, 90, or 365 days). Subscription fees are non-refundable once the store catalog has been activated.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Vendor Referral Program</h2>
          <p>
            Each registered vendor receives a unique referral code. When a new merchant successfully registers an approved store using this referral code and purchases an active plan, a fixed referral reward (determined by Admin, standard ₹500) will be credited to the referring vendor's wallet balance.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Payments, Escrow & Settlements</h2>
          <p>
            Customer payments are processed via Razorpay and securely held by Platform Administration until delivery is confirmed. Upon the vendor marking delivery as completed, net sales earnings (less platform commission) are credited to the vendor wallet, available for bank settlement withdrawal.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">6. Prohibited Activities</h2>
          <p>
            Merchants may not list counterfeit items, hazardous goods, or deceptive descriptions. Any breach will result in immediate store suspension and forfeiture of wallet balances.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
