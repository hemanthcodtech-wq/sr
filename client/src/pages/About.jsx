import React from 'react';
import {
  ShieldCheck,
  Store,
  Users,
  Award,
  Truck,
  HeartHandshake,
  CheckCircle2,
  Building2,
  ArrowRight,
  TrendingUp,
  CreditCard,
  FileCheck2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 font-sans select-none">
      {/* Hero Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-black uppercase tracking-wider text-[#0c2a5e] bg-blue-50 px-3.5 py-1.5 rounded-full border border-blue-200">
          Our Purpose &amp; Marketplace Mission
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Empowering Independent Merchants <span className="text-[#0c2a5e]">Across India</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
          <strong className="text-slate-900">Amezon.online</strong> is an ethical, technology-first multi-vendor ecommerce platform founded in Bhimavaram, Andhra Pradesh. We connect verified local manufacturers and independent retailers directly with conscious consumers nationwide.
        </p>
      </div>

      {/* 4 Key Platform Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bright-card p-6 rounded-2xl text-center space-y-1 border-slate-200 shadow-xs">
          <div className="text-2xl sm:text-3xl font-black text-[#0c2a5e]">500+</div>
          <div className="text-xs font-bold text-slate-600">Verified Stores</div>
        </div>
        <div className="bright-card p-6 rounded-2xl text-center space-y-1 border-slate-200 shadow-xs">
          <div className="text-2xl sm:text-3xl font-black text-emerald-600">100%</div>
          <div className="text-xs font-bold text-slate-600">Aadhaar &amp; PAN Audited</div>
        </div>
        <div className="bright-card p-6 rounded-2xl text-center space-y-1 border-slate-200 shadow-xs">
          <div className="text-2xl sm:text-3xl font-black text-amber-600">₹500</div>
          <div className="text-xs font-bold text-slate-600">Partner Referral Bonus</div>
        </div>
        <div className="bright-card p-6 rounded-2xl text-center space-y-1 border-slate-200 shadow-xs">
          <div className="text-2xl sm:text-3xl font-black text-blue-600">Pan-India</div>
          <div className="text-xs font-bold text-slate-600">Fast Courier Delivery</div>
        </div>
      </div>

      {/* Pillars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bright-card p-6 rounded-3xl space-y-3 border-slate-200 hover:border-blue-300 transition shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Store className="w-6 h-6 animate-soft-pulse" />
          </div>
          <h2 className="text-base font-black text-slate-900">Direct From Verified Sellers</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Every product on Amezon.online is packaged and dispatched directly by the creator or verified retail merchant, eliminating excessive middleman markups and guaranteeing genuine authenticity.
          </p>
        </div>

        <div className="bright-card p-6 rounded-3xl space-y-3 border-slate-200 hover:border-emerald-300 transition shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6 animate-soft-pulse" />
          </div>
          <h2 className="text-base font-black text-slate-900">Collaborative Referral Rewards</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            We believe merchants thrive when supporting each other. Existing merchants earn a guaranteed ₹500 referral reward directly credited to their vendor wallet the moment a referred store is approved by Admin.
          </p>
        </div>

        <div className="bright-card p-6 rounded-3xl space-y-3 border-slate-200 hover:border-purple-300 transition shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 animate-soft-pulse" />
          </div>
          <h2 className="text-base font-black text-slate-900">Escrow Security &amp; Fast Payouts</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Customer payments are secured via Razorpay escrow protection until verified delivery. Following fulfillment, sales proceeds are credited to vendor wallets for direct bank settlement.
          </p>
        </div>
      </div>

      {/* Merchant Journey & Governance Section */}
      <div className="bright-card p-8 sm:p-12 rounded-3xl border-slate-200 space-y-8 shadow-sm">
        <div className="max-w-2xl">
          <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">The Amezon.online Model</span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Built for Transparency, Trust, and Long-Term Seller Growth
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FileCheck2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Mandatory KYC Verification</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every merchant undergoes strict compliance verification. Aadhaar and PAN documents are verified by platform administration before any storefront is allowed to go live.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Fixed Platform Enrollment Fee</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  With predictable enrollment fees set by administration (e.g. ₹999 for 365 days), merchants enjoy uninterrupted dashboard access and official storefront visibility for their full paid duration.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Empowering Local Commerce</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unlike traditional conglomerates charging 30-40% commission, Amezon.online operates on a modest 10% platform fee, allowing sellers to reinvest in superior product quality and faster customer delivery.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Rooted in Bhimavaram, AP</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Headquartered at Amezon Commercial Complex, Main Road, Bhimavaram (AP – 534201), our operations and support desks maintain direct, personal relationships with every registered merchant.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center gap-6 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Pan-India Courier Network</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Razorpay 256-Bit Encrypted Payments</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Automated Tax Invoicing</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Bank Account Settlements</span>
          </div>
        </div>
      </div>

      {/* Dual CTA Banner */}
      <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#0c2a5e] to-blue-900 text-white text-center space-y-6 shadow-xl">
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Ready to Expand Your Reach on Amezon.online?
        </h2>
        <p className="text-sm text-blue-100 max-w-xl mx-auto leading-relaxed">
          Register your official store today with Aadhaar and PAN verification, unlock your Merchant Dashboard, and sell directly to thousands of customers.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link
            to="/vendor/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition"
          >
            <span>Register Storefront Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/stores"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/20 transition"
          >
            <Store className="w-4 h-4" />
            <span>Browse Official Stores</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default About;
