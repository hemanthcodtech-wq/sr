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
import api from '../services/api';

const defaultBannerSlides = [
  {
    id: 'default_1',
    isDefault: true,
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
    id: 'default_2',
    isDefault: true,
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
  const [activeSlides, setActiveSlides] = useState(defaultBannerSlides);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Fetch active custom Cloudinary banners from backend
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await api.get('/banners');
        if (res.data?.success && res.data.banners?.length > 0) {
          const mappedBanners = res.data.banners.map((b) => ({
            id: b._id,
            isCustom: true,
            imageUrl: b.imageUrl,
            title: b.title,
            subtitle: b.subtitle,
            badge: b.badge,
            ctaText: b.ctaText || 'SHOP NOW',
            ctaLink: b.link || '/products',
            theme: b.theme || 'gold',
          }));
          setActiveSlides(mappedBanners);
          setCurrent(0);
        }
      } catch (err) {
        console.warn('Using default hero carousel fallback:', err.message);
      }
    };
    fetchBanners();
  }, []);

  // Auto-advance slides every 6 seconds unless hovered
  useEffect(() => {
    if (isPaused || activeSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % activeSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, activeSlides.length]);

  const slide = activeSlides[current] || activeSlides[0];

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-4 items-stretch select-none">
      {/* Main Banner Hero Slider (Minimized height on mobile for maximum product visibility) */}
      <div
        className="col-span-1 lg:col-span-9 relative rounded-xl sm:rounded-3xl overflow-hidden border border-amber-200/90 shadow-sm group flex flex-col justify-between"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* If Custom Cloudinary Banner Uploaded by Admin */}
        {slide?.isCustom ? (
          <div className="relative w-full min-h-[135px] sm:min-h-[200px] md:min-h-[260px] lg:min-h-[300px] aspect-[2.4/1] sm:aspect-auto flex items-center overflow-hidden bg-slate-950">
            {/* Cloudinary Background Banner Image */}
            <img
              src={slide.imageUrl}
              alt={slide.title || 'Promotional Banner'}
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              loading="eager"
            />

            {/* Gradient shadow for readable overlay text */}
            {(slide.title || slide.subtitle || slide.badge) && (
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/45 to-transparent pointer-events-none" />
            )}

            {/* Slide Content Overlay */}
            <div className="relative z-10 p-3.5 sm:p-7 md:p-9 max-w-lg text-white space-y-1 sm:space-y-2.5">
              {slide.badge && (
                <div className="inline-block">
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[8.5px] sm:text-xs font-black uppercase tracking-wider shadow-sm">
                    ✦ {slide.badge} ✦
                  </span>
                </div>
              )}

              {slide.title && (
                <h2 className="text-sm sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-tight drop-shadow-md text-white font-serif line-clamp-1 sm:line-clamp-2">
                  {slide.title}
                </h2>
              )}

              {slide.subtitle && (
                <p className="hidden sm:block text-xs sm:text-sm text-slate-200 font-medium line-clamp-2 drop-shadow-xs max-w-md">
                  {slide.subtitle}
                </p>
              )}

              <div className="pt-1 sm:pt-2">
                <Link
                  to={slide.ctaLink}
                  className="inline-flex items-center gap-1 sm:gap-1.5 px-3.5 sm:px-6 py-1 sm:py-2 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black text-[10px] sm:text-xs shadow-md transition-all active:scale-95 border border-amber-500/50"
                >
                  <span>{slide.ctaText || 'SHOP NOW'}</span>
                  <ChevronRight className="w-3.5 h-3.5 font-black" />
                </Link>
              </div>
            </div>

            {/* Full-card link for banners without text overlay */}
            {!slide.title && !slide.subtitle && !slide.badge && (
              <Link to={slide.ctaLink} className="absolute inset-0 z-10" />
            )}
          </div>
        ) : (
          /* Default Fallback Festive Banner - Minimized height on mobile */
          <div
            className={`relative w-full min-h-[135px] sm:min-h-[200px] md:min-h-[260px] lg:min-h-[300px] bg-gradient-to-r ${slide.bgGradient} p-3 sm:p-6 md:p-8 flex items-center justify-between overflow-hidden transition-all duration-700`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200/40 via-transparent to-transparent pointer-events-none" />

            {/* Left Side Cutout (Desktop/Tablet only) */}
            <div className="hidden sm:flex items-end gap-1.5 z-10 flex-shrink-0 w-28 md:w-40 lg:w-44 h-full">
              <div className="relative w-full h-40 md:h-56 rounded-2xl overflow-hidden shadow-md border-2 border-amber-300/80 transform -rotate-2 hover:rotate-0 transition duration-300">
                <img
                  src={slide.models?.[0]?.img}
                  alt={slide.models?.[0]?.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Center Content */}
            <div className="relative z-10 flex-1 max-w-sm sm:max-w-md mx-auto text-center px-1 sm:px-4 py-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/90 border border-amber-300 shadow-2xs mb-1">
                <img src="/logo.png" alt="Brand Logo" className="h-4 sm:h-5 w-auto object-contain" />
                <span className="text-[9px] sm:text-xs font-black tracking-wider text-slate-800 uppercase">
                  MULTI-VENDOR MARKETPLACE
                </span>
              </div>

              <div className="space-y-0.5">
                <span className="hidden sm:block text-xs sm:text-sm font-extrabold text-amber-700 italic font-serif">
                  {slide.titlePrefix}
                </span>
                <h2 className="text-lg sm:text-3xl md:text-4xl font-black text-rose-800 tracking-tight leading-none drop-shadow-xs font-serif">
                  {slide.titleMain}
                </h2>

                <div className="py-0.5">
                  <div className="inline-block px-3 sm:px-5 py-0.5 rounded-md bg-gradient-to-r from-purple-800 via-indigo-900 to-purple-800 text-amber-300 font-black text-[9px] sm:text-xs tracking-wider uppercase shadow-xs border-y border-amber-300">
                    ✦ {slide.titleAccent} ✦
                  </div>
                </div>

                <div className="inline-block">
                  <span className="text-base sm:text-2xl md:text-3xl font-black text-rose-600 drop-shadow-xs tracking-tight">
                    {slide.discountBadge}
                  </span>
                </div>
              </div>

              <div className="pt-1.5">
                <Link
                  to={slide.ctaLink}
                  className="inline-flex items-center gap-1 px-4 sm:px-6 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black text-[10px] sm:text-xs shadow-md transition-all active:scale-95 border border-amber-500/50"
                >
                  <span>{slide.ctaText}</span>
                  <ChevronRight className="w-3.5 h-3.5 font-black" />
                </Link>
              </div>
            </div>

            {/* Right Side Cutout (Desktop only) */}
            <div className="hidden md:flex items-end gap-2 z-10 flex-shrink-0 w-32 lg:w-40 h-full">
              <div className="relative w-full h-44 md:h-56 rounded-2xl overflow-hidden shadow-md border-2 border-amber-300/80 transform rotate-2 hover:rotate-0 transition duration-300">
                <img
                  src={slide.models?.[1]?.img || slide.models?.[0]?.img}
                  alt={slide.models?.[1]?.name || "Collection"}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        )}

        {/* Carousel Navigation Arrows (Desktop/Tablet only to avoid covering text on mobile) */}
        <button
          onClick={() =>
            setCurrent((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1))
          }
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/50 hover:bg-black/70 text-white items-center justify-center transition shadow-md z-20 cursor-pointer"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={() => setCurrent((prev) => (prev + 1) % activeSlides.length)}
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-black/50 hover:bg-black/70 text-white items-center justify-center transition shadow-md z-20 cursor-pointer"
          aria-label="Next slide"
        >
          <ChevronRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
        </button>

        {/* Slide Pagination Dots */}
        <div className="absolute bottom-1.5 sm:bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
          {activeSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1 sm:h-1.5 rounded-full transition-all cursor-pointer ${
                current === i ? 'w-4 sm:w-6 bg-amber-400 shadow-xs' : 'w-1 sm:w-1.5 bg-white/70 hover:bg-white'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Right Column: Desktop-only side promotion cards to prevent vertical mobile crowding */}
      <div className="hidden lg:flex lg:col-span-3 flex-col gap-3 justify-between">
        {/* Card 1: FOR SELLERS */}
        <div className="flex-1 rounded-2xl bg-gradient-to-br from-[#0c5949] to-[#083e33] text-white p-4 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div className="space-y-1 z-10">
            <span className="text-[9.5px] font-black uppercase tracking-wider text-emerald-300">
              FOR SELLERS
            </span>
            <h3 className="text-base font-black tracking-tight leading-tight">
              Sell on Amezon
            </h3>
            <p className="text-[11px] text-emerald-100/90 leading-relaxed line-clamp-2">
              Join 50,000+ vendors. 0% commission on your first 3 months.
            </p>
          </div>

          <div className="pt-2 z-10">
            <Link
              to="/vendor/pricing"
              className="inline-block px-3.5 py-1.5 rounded-xl bg-white text-[#0c5949] hover:bg-emerald-50 text-[11px] font-black transition shadow-xs"
            >
              Register Free
            </Link>
          </div>
        </div>

        {/* Card 2: LIMITED TIME */}
        <div className="flex-1 rounded-2xl bg-gradient-to-br from-[#dc2626] to-[#b91c1c] text-white p-4 flex flex-col justify-between shadow-xs relative overflow-hidden group">
          <div className="space-y-1 z-10">
            <span className="text-[9.5px] font-black uppercase tracking-wider text-amber-200">
              LIMITED TIME
            </span>
            <h3 className="text-base font-black tracking-tight leading-tight flex items-center gap-1.5">
              <span>Today's Deals</span>
              <Flame className="w-4 h-4 text-amber-300 fill-amber-300 animate-pulse" />
            </h3>
            <p className="text-[11px] text-rose-100/90 leading-relaxed line-clamp-2">
              Flash deals ending soon. Up to 70% off on trending goods.
            </p>
          </div>

          <div className="pt-2 z-10">
            <Link
              to="/products"
              className="inline-block px-3.5 py-1.5 rounded-xl bg-white text-[#dc2626] hover:bg-rose-50 text-[11px] font-black transition shadow-xs"
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
