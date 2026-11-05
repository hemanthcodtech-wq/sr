import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Flame,
  Zap,
  Sparkles,
  Store,
  Tag,
  CheckCircle2,
} from 'lucide-react';

const bannerSlides = [
  {
    id: 1,
    badge: "FESTIVE MEGA OFFER",
    titlePrefix: "Happy",
    titleMain: "Dhanteras & Diwali",
    titleAccent: "SPECIAL OFFER",
    discountBadge: "Up to 50% OFF",
    subText: "On Selected Festive Collections & Direct Factory Vendors",
    ctaText: "SHOP NOW",
    ctaLink: "/products?category=Fashion",
    bgGradient: "from-[#fff7ed] via-[#fef3c7] to-[#fffbeb]",
    borderCol: "border-amber-300",
    theme: "gold",
    models: [
      {
        name: "Banarasi Silk Saree",
        img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80",
        tag: "Silk Saree",
      },
      {
        name: "Designer Embroidered Kurti",
        img: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80",
        tag: "Kurti",
      },
      {
        name: "Bridal Festive Wear",
        img: "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80",
        tag: "Festive",
      },
    ],
  },
  {
    id: 2,
    badge: "DIRECT FACTORY DEALS",
    titlePrefix: "Shop From",
    titleMain: "Verified Vendors",
    titleAccent: "MEGA ELECTRONICS SALE",
    discountBadge: "Flat 40% OFF",
    subText: "Mobiles, Smart Watches & High-Speed Gadgets",
    ctaText: "EXPLORE DEALS",
    ctaLink: "/products?category=Electronics",
    bgGradient: "from-[#eff6ff] via-[#e0f2fe] to-[#f0fdf4]",
    borderCol: "border-blue-300",
    theme: "blue",
    models: [
      {
        name: "Smartphones & 5G",
        img: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80",
        tag: "5G Mobiles",
      },
      {
        name: "Noise Cancelling Audio",
        img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
        tag: "Audio",
      },
      {
        name: "Smart Watches",
        img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
        tag: "Wearables",
      },
    ],
  },
];

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % bannerSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused]);

  const slide = bannerSlides[current];

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-stretch select-none">
      {/* Main Banner Hero Slider (Left Col - 9 cols on desktop) */}
      <div
        className="lg:col-span-9 relative rounded-2xl sm:rounded-3xl overflow-hidden border border-amber-200/90 shadow-md group flex flex-col justify-between"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Banner Canvas */}
        <div
          className={`relative w-full min-h-[220px] sm:min-h-[260px] md:min-h-[300px] lg:min-h-[330px] bg-gradient-to-r ${slide.bgGradient} p-4 sm:p-6 md:p-8 flex items-center justify-between overflow-hidden transition-all duration-700`}
        >
          {/* Subtle Decorative Arch / Mandap Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200/40 via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-96 h-36 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Left Side: Festive Female Model Cutouts */}
          <div className="hidden sm:flex items-end gap-1.5 z-10 flex-shrink-0 w-32 md:w-44 lg:w-48 h-full">
            <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden shadow-lg border-2 border-amber-300/80 transform -rotate-2 hover:rotate-0 transition duration-300">
              <img
                src={slide.models[0].img}
                alt={slide.models[0].name}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-black bg-black/70 backdrop-blur-xs text-amber-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                {slide.models[0].tag}
              </span>
            </div>
          </div>

          {/* Center: Royal Arch Frame with Typography & CTAs (Exact match to reference style) */}
          <div className="relative z-10 flex-1 max-w-sm sm:max-w-md mx-auto text-center px-2 sm:px-4 py-2">
            {/* Top Brand Logo Emblem */}
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/90 border border-amber-300 shadow-2xs mb-2">
              <img src="/logo.png" alt="Brand Logo" className="h-5 w-auto object-contain" />
              <span className="text-[10px] sm:text-xs font-black tracking-wider text-slate-800 uppercase">
                INDIA'S MULTI-VENDOR MARKETPLACE
              </span>
            </div>

            {/* Main Festive Header */}
            <div className="space-y-0.5">
              <span className="block text-xs sm:text-sm md:text-base font-extrabold text-amber-700 italic font-serif">
                {slide.titlePrefix}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-rose-800 tracking-tight leading-none drop-shadow-xs font-serif">
                {slide.titleMain}
              </h2>

              {/* Purple Ribbon Bar for SPECIAL OFFER */}
              <div className="py-1">
                <div className="inline-block px-4 sm:px-6 py-1 rounded-md bg-gradient-to-r from-purple-800 via-indigo-900 to-purple-800 text-amber-300 font-black text-[10px] sm:text-xs tracking-widest uppercase shadow-md border-y border-amber-300">
                  ✦ {slide.titleAccent} ✦
                </div>
              </div>

              {/* Red Discount Pill (Up to 50% OFF) */}
              <div className="inline-block mt-1">
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-rose-600 drop-shadow-xs tracking-tight">
                  {slide.discountBadge}
                </span>
              </div>

              <p className="text-[11px] sm:text-xs font-bold text-slate-700 pt-0.5">
                {slide.subText}
              </p>
            </div>

            {/* Glowing Golden "SHOP NOW >" Pill Button */}
            <div className="pt-3">
              <Link
                to={slide.ctaLink}
                className="inline-flex items-center gap-1.5 px-6 sm:px-8 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 border border-amber-500/50"
              >
                <span>{slide.ctaText}</span>
                <ChevronRight className="w-4 h-4 font-black" />
              </Link>
            </div>
          </div>

          {/* Right Side: Second Model Cutout / Products */}
          <div className="hidden md:flex items-end gap-2 z-10 flex-shrink-0 w-36 lg:w-44 h-full">
            <div className="relative w-full h-52 md:h-64 rounded-2xl overflow-hidden shadow-lg border-2 border-amber-300/80 transform rotate-2 hover:rotate-0 transition duration-300">
              <img
                src={slide.models[1]?.img || slide.models[0].img}
                alt={slide.models[1]?.name || "Collection"}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-black bg-black/70 backdrop-blur-xs text-amber-300 px-2 py-0.5 rounded-full whitespace-nowrap">
                {slide.models[1]?.tag || "Trending"}
              </span>
            </div>
          </div>

          {/* Carousel Arrows */}
          <button
            onClick={() => setCurrent((prev) => (prev === 0 ? bannerSlides.length - 1 : prev - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition shadow-md z-20 cursor-pointer"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrent((prev) => (prev + 1) % bannerSlides.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition shadow-md z-20 cursor-pointer"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Slide dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
            {bannerSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  current === i ? 'w-5 bg-amber-600' : 'w-1.5 bg-amber-400/60'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: 2 Static Promotion Cards (Exact Match to Screenshot) */}
      <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col gap-3 sm:gap-4 justify-between">
        {/* Card 1: FOR SELLERS (Teal Card) */}
        <div className="flex-1 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0c5949] to-[#083e33] text-white p-5 sm:p-6 flex flex-col justify-between shadow-md relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-emerald-400/20 blur-xl pointer-events-none" />

          <div className="space-y-1.5 z-10">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
              FOR SELLERS
            </span>
            <h3 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
              Sell on Amezon
            </h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              Join 50,000+ vendors. 0% commission on your first 3 months with our subscription plan.
            </p>
          </div>

          <div className="pt-4 z-10">
            <Link
              to="/vendor/pricing"
              className="inline-block px-5 py-2 rounded-xl bg-white text-[#0c5949] hover:bg-emerald-50 text-xs font-black transition shadow-sm hover:scale-105 active:scale-95"
            >
              Register Free
            </Link>
          </div>
        </div>

        {/* Card 2: LIMITED TIME (Vibrant Red Card) */}
        <div className="flex-1 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#dc2626] to-[#b91c1c] text-white p-5 sm:p-6 flex flex-col justify-between shadow-md relative overflow-hidden group">
          <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-amber-400/20 blur-xl pointer-events-none" />

          <div className="space-y-1.5 z-10">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">
              LIMITED TIME
            </span>
            <h3 className="text-lg sm:text-xl font-black tracking-tight leading-tight flex items-center gap-1.5">
              <span>Today's Deals</span>
              <Flame className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
            </h3>
            <p className="text-xs text-rose-100/90 leading-relaxed">
              Flash deals ending soon. Up to 70% off on trending electronics, fashion &amp; footwear.
            </p>
          </div>

          <div className="pt-4 z-10">
            <Link
              to="/products"
              className="inline-block px-5 py-2 rounded-xl bg-white text-[#dc2626] hover:bg-rose-50 text-xs font-black transition shadow-sm hover:scale-105 active:scale-95"
            >
              View Deals
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;
