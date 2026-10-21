import React from 'react';
import { Lock, ShieldCheck } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="border-b border-slate-200 pb-4 space-y-1">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
          <Lock className="w-4 h-4" />
          <span>Security & Data Compliance</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
        <p className="text-xs text-slate-500">Effective Date: October 2026</p>
      </div>

      <div className="bright-card p-8 rounded-3xl border-slate-200 space-y-6 text-sm text-slate-600 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">1. Information We Collect</h2>
          <p>
            We collect personal information necessary to deliver our marketplace services, including account registration details (name, email, encrypted password, phone), shipping destination addresses, and merchant bank account numbers for settlement disbursements.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">2. Payment Gateway Security (Razorpay)</h2>
          <p>
            NexMart does not store complete debit or credit card details on its servers. All payments and subscription transactions are processed directly via Razorpay's PCI-DSS Level 1 compliant gateway utilizing industry-standard 256-bit SSL encryption.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">3. Vendor Data Sharing for Fulfillment</h2>
          <p>
            When a customer places an order, the relevant delivery address, customer name, and contact phone number are shared solely with the specific merchant whose product was purchased to enable doorstep packaging, shipping, and delivery fulfillment.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">4. Cloud Storage (Cloudinary)</h2>
          <p>
            Merchant storefront banners, logos, product media, and digital tax invoices are stored securely on Cloudinary's redundant global infrastructure.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900">5. Contact Data Protection Officer</h2>
          <p>
            For privacy queries or data deletion requests, contact our legal compliance team at <strong>privacy@nexmart.com</strong>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Privacy;
