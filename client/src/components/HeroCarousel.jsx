import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShieldCheck, ArrowRight, ShoppingCart } from 'lucide-react';

const slides = [
  {
    id: 1,
    titleSmall: 'Shop from',
    titleMain: 'Your Favorite',
    titleAccent: 'Vendors',
    subLine1: 'Wide Range | Best Prices',
    subLine2: 'Trusted Sellers',
    ctaText: 'Shop Now',
    ctaLink: '/products',
  },
  {
    id: 2,
    titleSmall: 'Mega Savings',
    titleMain: 'Top Electronics &',
    titleAccent: 'Smartphones',
    subLine1: 'Up to 45% OFF | Brand Warranty',
    subLine2: 'Fast Doorstep Express Delivery',
    ctaText: 'Explore Deals',
    ctaLink: '/products?category=Electronics',
  },
];

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const slide = slides[current];

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-md select-none group">
      {/* Emerald to Forest Green Gradient Background */}
      <div className="relative w-full min-h-[220px] sm:min-h-[260px] md:min-h-[300px] bg-gradient-to-r from-[#035b36] via-[#047743] to-[#024a2b] p-4 sm:p-7 md:p-8 flex items-center justify-between overflow-hidden">
        
        {/* Subtle Ambient Radial Lighting */}
        <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full bg-yellow-400/10 blur-3xl pointer-events-none" />

        {/* Left Column: Text & Yellow CTA Button */}
        <div className="relative z-10 flex-1 max-w-[210px] sm:max-w-sm md:max-w-md text-white space-y-1 sm:space-y-2">
          <div>
            <span className="block text-sm sm:text-base md:text-lg font-bold text-white/95 tracking-tight">
              {slide.titleSmall}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-black tracking-tight leading-[1.08]">
              <span className="text-white block">{slide.titleMain}</span>
              <span className="text-[#ffde17] block font-black drop-shadow-sm">{slide.titleAccent}</span>
            </h2>
          </div>

          <div className="pt-0.5 text-[10.5px] sm:text-xs md:text-sm text-emerald-50/90 font-medium space-y-0.5 leading-snug">
            <p>{slide.subLine1}</p>
            <p className="font-semibold">{slide.subLine2}</p>
          </div>

          {/* Yellow Rounded Pill CTA Button (Exact match) */}
          <div className="pt-2 sm:pt-3">
            <Link
              to={slide.ctaLink}
              className="inline-flex items-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#ffde17] hover:bg-[#fed600] active:scale-95 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all group/btn"
            >
              <span>{slide.ctaText}</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
            </Link>
          </div>
        </div>

        {/* Right Column: Visual Graphics Composition */}
        <div className="relative z-10 flex items-center justify-end flex-shrink-0 w-[150px] sm:w-[260px] md:w-[320px]">
          {/* SAFE SECURE SHOPPING Badge */}
          <div className="hidden sm:flex absolute right-1 top-0 items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-400/40 text-emerald-100 text-[10px] font-extrabold tracking-wider backdrop-blur-xs shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <div className="text-left leading-tight">
              <span className="block text-[8px] text-emerald-300">SAFE SECURE</span>
              <span className="block font-black text-white">SHOPPING</span>
            </div>
          </div>

          {/* Artwork: Smartphone + Shopping Cart + Bags */}
          <div className="relative flex items-center justify-center transform hover:scale-105 transition-transform duration-300 pt-3 sm:pt-6">
            {/* Background Smartphone */}
            <div className="w-16 sm:w-24 md:w-28 h-28 sm:h-44 md:h-48 bg-slate-900 border-2 sm:border-3 border-slate-700 rounded-xl sm:rounded-2xl shadow-xl overflow-hidden transform rotate-6 -translate-x-3 sm:-translate-x-6">
              <div className="w-full h-full bg-[#081e36] p-1.5 flex flex-col justify-between">
                <div className="w-6 h-1 bg-slate-700 rounded-full mx-auto" />
                <div className="text-center py-1 sm:py-2">
                  <img src="/logo.png" alt="SR Logo" className="h-7 sm:h-9 w-auto object-contain mx-auto filter drop-shadow-sm" />
                  <span className="text-[6px] sm:text-[7.5px] text-amber-300 font-bold block mt-0.5">DREAM • GROW • TOGETHER</span>
                </div>
                <div className="w-full bg-emerald-600/40 rounded-lg p-1 text-center">
                  <span className="text-[7px] sm:text-[9px] text-emerald-200 font-bold">Verified Vendors</span>
                </div>
              </div>
            </div>

            {/* Shopping Cart with Bags */}
            <div className="absolute -bottom-1 right-0 sm:right-2 flex flex-col items-center">
              {/* Colorful Shopping Bags inside Cart */}
              <div className="flex items-end gap-1 -mb-1">
                <div className="w-5 sm:w-7 h-7 sm:h-10 bg-gradient-to-t from-amber-500 to-yellow-400 rounded-t-md shadow flex items-center justify-center text-[7px] font-black text-slate-950">RS</div>
                <div className="w-6 sm:w-8 h-9 sm:h-12 bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t-md shadow"></div>
                <div className="w-5 sm:w-7 h-8 sm:h-11 bg-gradient-to-t from-sky-500 to-cyan-400 rounded-t-md shadow"></div>
              </div>
              {/* Cart Container */}
              <div className="px-2.5 py-1.5 bg-white/20 backdrop-blur-xs rounded-xl border border-white/40 text-white shadow-lg flex items-center justify-center">
                <ShoppingCart className="w-7 h-7 sm:w-11 sm:h-11 text-white drop-shadow-md" />
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Indicators (Exact match: 4 dots at bottom center) */}
        <div className="absolute bottom-2.5 sm:bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
          <span className="w-5 h-1.5 rounded-full bg-white shadow-xs" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
          <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
        </div>

        {/* Desktop Previous/Next Arrows */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/50 text-white items-center justify-center backdrop-blur-xs opacity-0 group-hover:opacity-100 transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/20 hover:bg-black/50 text-white items-center justify-center backdrop-blur-xs opacity-0 group-hover:opacity-100 transition cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default HeroCarousel;
