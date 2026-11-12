import React from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Headphones,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
} from 'lucide-react';
import Logo from '../components/Logo';

const About = () => {
  // Customer Commitments (Mirroring svworks.com.in/about "What you can hold us to")
  const commitments = [
    {
      title: 'Dispatched within 24 hours',
      body: 'Tracked delivery straight to your doorstep across India. Orders are packaged securely and dispatched rapidly.',
      icon: Truck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200/80',
    },
    {
      title: 'Made in India, every item',
      body: 'Sourced from authentic Indian manufacturers and verified merchants. Country of origin is transparently displayed on every product page.',
      icon: ShieldCheck,
      color: 'text-amber-600 bg-amber-50 border-amber-200/80',
    },
    {
      title: 'Honest about returns',
      body: 'Defects or transit damages are replaced or refunded within 7 days with a quick photo verification. Hassle-free resolution with no hidden red tape.',
      icon: RotateCcw,
      color: 'text-blue-600 bg-blue-50 border-blue-200/80',
    },
    {
      title: 'A real person answers',
      body: 'Dedicated WhatsApp and direct phone support 9:00 AM – 9:00 PM, usually within 10 minutes. Reach our team anytime from the contact page.',
      icon: Headphones,
      color: 'text-purple-600 bg-purple-50 border-purple-200/80',
    },
  ];

  // Core Pillars & Values
  const coreValues = [
    {
      title: 'Quality',
      desc: 'Delivering top-grade verified retail products that pass strict multi-point inspections before dispatch.',
      badge: 'Uncompromising Standard',
    },
    {
      title: 'Integrity',
      desc: 'Transparent pricing, genuine product descriptions, and zero hidden charges or surprise checkout markups.',
      badge: '100% Honest',
    },
    {
      title: 'Customer Satisfaction',
      desc: 'Personalized assistance, quick query resolution, and doorstep support for every shopper across India.',
      badge: 'Customer First',
    },
    {
      title: 'Innovation',
      desc: 'Continuous improvement in catalog curation, logistics tracking, and seamless multi-vendor shopping experiences.',
      badge: 'Modern Commerce',
    },
  ];

  // Featured Categories Showcase (Mirroring "What we sell")
  const categories = [
    {
      name: 'Home & Kitchen',
      img: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=300&auto=format&fit=crop&q=80',
      query: 'Home & Kitchen',
    },
    {
      name: 'Electronics & Mobiles',
      img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80',
      query: 'Electronics',
    },
    {
      name: 'Fashion & Apparel',
      img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&auto=format&fit=crop&q=80',
      query: 'Fashion',
    },
    {
      name: 'Toys & Games',
      img: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=300&auto=format&fit=crop&q=80',
      query: 'Toys',
    },
    {
      name: 'Fitness & Sports',
      img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80',
      query: 'Fitness',
    },
    {
      name: 'Beauty & Personal Care',
      img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
      query: 'Beauty',
    },
  ];

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 select-none font-sans min-h-screen py-4 sm:py-8">
      <div className="max-w-[1240px] mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium px-1">
          <Link to="/" className="hover:text-emerald-700 transition">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-semibold">About Us</span>
        </nav>

        {/* 1. Hero Banner: Deep Brand Gradient (Matching svworks.com.in .sf-ab-hero) */}
        <section className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#051527] via-[#092542] to-[#0c3866] text-white p-6 sm:p-10 md:p-12 overflow-hidden shadow-md border border-slate-800">
          {/* Subtle ambient lighting */}
          <div className="absolute -right-20 -bottom-24 w-80 h-80 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-black uppercase tracking-widest shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ABOUT SR MARKETPLACE</span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="SR Marketplace Logo"
                className="w-12 h-12 sm:w-16 sm:h-16 object-contain filter drop-shadow-md"
              />
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white font-serif">
                SR Marketplace
              </h1>
            </div>

            <p className="text-sm sm:text-base md:text-lg text-slate-200 leading-relaxed font-normal">
              Founded in <strong>2020</strong>, <strong className="text-white">SR Marketplace</strong> is an ethical, technology-first multi-vendor E-commerce platform. We specialize in Retail and marketplace commerce, connecting verified local manufacturers, artisans, and independent brand outlets directly with consumers nationwide.
            </p>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pt-1">
              Our mission is to deliver quality Retail products at fair prices, offer seamless shopping experiences, support sustainable vendor practices, and eliminate unnecessary middleman markups while building long-term trust with our customers.
            </p>

            {/* Fact Pills */}
            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-white border border-white/20 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Established in 2020</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-white border border-white/20 font-semibold">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pan-India Delivery</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-white border border-white/20 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                <span>500+ Verified Stores</span>
              </span>
            </div>
          </div>
        </section>

        {/* 2. A Note from the Founder (Matching svworks.com.in .sf-ab-founder) */}
        <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-10 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center gap-6 md:gap-8">
          <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl sm:rounded-3xl overflow-hidden flex-shrink-0 border-2 border-emerald-500/30 shadow-sm bg-[#051527] flex items-center justify-center p-3">
            <img
              src="/logo.png"
              alt="SR Marketplace Founder Emblem"
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>

          <div className="space-y-2.5 flex-1 text-center md:text-left">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              A NOTE FROM THE FOUNDER
            </span>
            <blockquote className="text-sm sm:text-base text-slate-700 italic leading-relaxed font-serif">
              “We are guided by our core values: Quality, Integrity, Customer Satisfaction, and Innovation. These values define how we work, how we serve our customers, and how we empower our vendor community. Our vision is to make Retail accessible, redefine the customer experience, and become India’s most trusted multi-vendor marketplace.”
            </blockquote>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold pt-1">
              <strong className="text-slate-900">Founder &amp; Leadership Team</strong> · SR Marketplace
            </p>
          </div>
        </section>

        {/* 3. What You Can Hold Us To (Commitments Grid) */}
        <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              WHAT YOU CAN HOLD US TO
            </span>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Our 4 Uncompromising Promises
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
            {commitments.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-slate-200 hover:shadow-xs transition-all flex items-start gap-3.5"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="text-[11.5px] sm:text-xs text-slate-600 leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Core Values & Vision Pillars */}
        <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                OUR GUIDING PRINCIPLES
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                Built on Trust, Quality &amp; Transparency
              </h2>
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              Our vision is to make high-grade retail accessible, redefine the shopping experience, and remain the trusted choice.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {coreValues.map((v) => (
              <div
                key={v.title}
                className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200/80 hover:border-emerald-300 transition-all shadow-2xs space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                    {v.badge}
                  </span>
                  <h3 className="text-sm font-black text-slate-900">
                    {v.title}
                  </h3>
                  <p className="text-[11.5px] text-slate-600 leading-relaxed">
                    {v.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. What We Sell (Category Showcase with All Products link) */}
        <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                CURATED SELECTIONS
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                What We Sell
              </h2>
            </div>
            <Link
              to="/products"
              className="text-xs font-bold text-[#0f8a48] hover:text-[#0c723b] flex items-center gap-1 transition group"
            >
              <span>All Products</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
            {categories.map((c) => (
              <Link
                key={c.name}
                to={`/products?category=${encodeURIComponent(c.query)}`}
                className="group rounded-xl sm:rounded-2xl border border-slate-200/80 overflow-hidden bg-slate-50 hover:bg-white hover:border-emerald-300 hover:shadow-xs transition-all p-2.5 flex flex-col items-center text-center space-y-2"
              >
                <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-full overflow-hidden bg-white border border-slate-200 p-1 flex items-center justify-center group-hover:scale-108 transition-transform">
                  <img
                    src={c.img}
                    alt={c.name}
                    className="w-full h-full object-cover rounded-full"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 group-hover:text-[#0f8a48] transition-colors leading-tight line-clamp-1">
                    {c.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium">Shop now</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 6. Official Store & Business Details (dl facts matching website) */}
        <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
            STORE DETAILS
          </span>
          <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                Legal Entity
              </dt>
              <dd className="font-bold text-slate-900 mt-0.5 text-xs sm:text-sm">
                SR Marketplace
              </dd>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                Business Type
              </dt>
              <dd className="font-bold text-slate-900 mt-0.5 text-xs sm:text-sm">
                Multi-Vendor Retail E-Commerce Platform
              </dd>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                Fulfillment Network
              </dt>
              <dd className="font-bold text-slate-900 mt-0.5 text-xs sm:text-sm">
                Direct Merchant &amp; Factory Hubs
              </dd>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                Support Hours
              </dt>
              <dd className="font-bold text-slate-900 mt-0.5 text-xs sm:text-sm">
                9:00 AM – 9:00 PM IST (Mon – Sun)
              </dd>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                Customer &amp; Partner Desk
              </dt>
              <dd className="font-bold text-emerald-700 mt-0.5 text-xs sm:text-sm">
                <Link to="/contact" className="hover:underline">
                  support@amezon.online · +91 98765 43210 →
                </Link>
              </dd>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <dt className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                Store Policies
              </dt>
              <dd className="font-medium text-slate-700 mt-0.5 text-xs">
                <span>Shipping Policy</span> · <span>7-Day Return Policy</span> · <span>FAQ</span>
              </dd>
            </div>
          </dl>
        </section>

        {/* 7. Bottom Call To Action Banner (Matching svworks.com.in .sf-ab-cta) */}
        <section className="rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 p-8 sm:p-12 text-center shadow-xs space-y-3">
          <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
            See what people order most
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
            Browse our full catalogue and find high-quality products you’ll love, delivered straight to your door across India.
          </p>
          <div className="pt-2">
            <Link
              to="/products"
              className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-[#0f8a48] hover:bg-[#0c723b] text-white font-black text-xs sm:text-sm transition-all shadow-sm active:scale-95"
            >
              Shop bestsellers
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
};

export default About;
