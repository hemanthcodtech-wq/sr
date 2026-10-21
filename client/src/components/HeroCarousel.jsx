import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';

const slides = [
  {
    id: 1,
    badge: 'Mega Sale — Up to 50% OFF',
    title: 'Everything You Need',
    titleHighlight: 'Under One Roof',
    subtitle: 'Electronics • Furniture • Grocery • Clothing & much more — delivered to your door.',
    primaryCta: 'Shop Now',
    primaryLink: '/products',
    secondaryCta: 'View Deals',
    secondaryLink: '/products?category=Electronics',
    bgImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 2,
    badge: 'Luxury Comfort',
    title: 'Transform Your Home with',
    titleHighlight: 'Premium Furniture',
    subtitle: 'Modern sofas, ergonomic office chairs & solid wood dining sets at wholesale rates.',
    primaryCta: 'Explore Furniture',
    primaryLink: '/products?category=Furniture',
    secondaryCta: 'View Catalog',
    secondaryLink: '/products',
    bgImage: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    badge: 'Daily Essentials',
    title: 'Farm Fresh Organic',
    titleHighlight: 'Grocery & Staples',
    subtitle: 'Premium basmati rice, cold-pressed oils, fresh spices & household staples with fast doorstep dispatch.',
    primaryCta: 'Shop Grocery',
    primaryLink: '/products?category=Grocery',
    secondaryCta: 'Special Bundles',
    secondaryLink: '/products',
    bgImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1600&auto=format&fit=crop&q=80',
  },
];

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % slides.length);
  };

  const slide = slides[current];

  return (
    <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm select-none group min-h-[380px] sm:min-h-[460px] flex items-center bg-slate-900">
      {/* Background Image with Dark Gradient Overlay matching lg-enterprises */}
      <div className="absolute inset-0 z-0">
        <img
          src={slide.bgImage}
          alt={slide.title}
          className="w-full h-full object-cover object-center filter brightness-[0.4] transition-all duration-700 ease-in-out"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
      </div>

      {/* Slide Content */}
      <div className="relative z-10 w-full max-w-[1920px] mx-auto px-6 sm:px-12 lg:px-16 2xl:px-20 py-12 sm:py-16 text-white space-y-5">
        {/* Badge Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-xs">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>{slide.badge}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none max-w-2xl">
          <span className="block text-white">{slide.title}</span>
          <span className="block text-[#f59e0b] mt-1.5">{slide.titleHighlight}</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
          {slide.subtitle}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            to={slide.primaryLink}
            className="px-6 py-3 rounded-full bg-[#0c2a5e] hover:bg-[#153e85] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 inline-flex items-center gap-2 border border-blue-400/30"
          >
            <span>{slide.primaryCta}</span>
            <span>&gt;</span>
          </Link>
          <Link
            to={slide.secondaryLink}
            className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-xs font-bold text-xs sm:text-sm transition-all inline-flex items-center gap-2"
          >
            <span>{slide.secondaryCta}</span>
          </Link>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center border border-white/20 backdrop-blur-xs transition cursor-pointer"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center border border-white/20 backdrop-blur-xs transition cursor-pointer"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide Indicators Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrent(idx)}
            aria-label={`Slide ${idx + 1}`}
            className={`h-2 rounded-full transition-all cursor-pointer ${
              current === idx ? 'w-6 bg-[#f59e0b]' : 'w-2 bg-white/50 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
