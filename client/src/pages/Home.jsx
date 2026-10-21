import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Zap,
  Flame,
  Trophy,
  Crown,
  ArrowRight,
  ChevronRight,
  Star,
  Quote,
  CheckCircle2,
} from 'lucide-react';
import HeroCarousel from '../components/HeroCarousel';
import ProductCard from '../components/ProductCard';
import api from '../services/api';

const topCategories = [
  {
    name: 'Electronics',
    query: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=700&auto=format&fit=crop&q=80',
  },
  {
    name: 'Furniture',
    query: 'Furniture',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=700&auto=format&fit=crop&q=80',
  },
  {
    name: 'Grocery',
    query: 'Grocery',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&auto=format&fit=crop&q=80',
  },
  {
    name: 'Clothing',
    query: 'Fashion',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=700&auto=format&fit=crop&q=80',
  },
];

const promoBanners = [
  {
    title: 'Latest Electronics',
    subtitle: 'Smart Technology for a Smarter Life',
    discount: 'Up to 50% OFF',
    ctaText: 'Shop Electronics →',
    link: '/products?category=Electronics',
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=700&auto=format&fit=crop&q=80',
  },
  {
    title: 'Premium Furniture',
    subtitle: 'Style Your Home Beautifully',
    discount: 'Up to 40% OFF',
    ctaText: 'Shop Furniture →',
    link: '/products?category=Furniture',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=700&auto=format&fit=crop&q=80',
  },
  {
    title: 'Fresh Groceries',
    subtitle: 'Daily Essentials at Best Prices',
    discount: 'Up to 30% OFF',
    ctaText: 'Shop Grocery →',
    link: '/products?category=Grocery',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=700&auto=format&fit=crop&q=80',
  },
];

const testimonials = [
  {
    name: 'Ramesh Sharma',
    city: 'Hyderabad',
    rating: 5,
    comment: 'Super fast delivery and authentic electronics. The TV was delivered with zero damage within 24 hours!',
  },
  {
    name: 'Kiran Patel',
    city: 'Bhimavaram',
    rating: 5,
    comment: 'Great quality furniture! Solid wooden dining table and ergonomic office chair at unbeatable wholesale prices.',
  },
  {
    name: 'Anitha Reddy',
    city: 'Vijayawada',
    rating: 5,
    comment: 'The vendor partner program is genuine. I referred two local stores and received ₹500 bonuses directly in my wallet.',
  },
];

const Home = () => {
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.get('/products?limit=36');
        if (res.data?.success) {
          setProducts(res.data.products || []);
        }
      } catch (err) {
        console.warn('Could not load products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Filter products by selected department tab
  const filteredProducts =
    activeTab === 'All'
      ? products
      : products.filter((p) => {
          const cat = (p.category || '').toLowerCase();
          const target = activeTab.toLowerCase();
          if (target === 'fashion') return cat === 'fashion' || cat === 'clothing';
          return cat === target;
        });

  return (
    <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-14 py-5 space-y-12">
      {/* 1. Full-Width Hero Slider */}
      <section className="w-full">
        <HeroCarousel />
      </section>

      {/* 2. TOP CATEGORY Section */}
      <section className="space-y-6">
        <h2 className="text-xl sm:text-2xl font-black text-center text-slate-900 uppercase tracking-wider">
          TOP CATEGORY
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {topCategories.map((cat) => (
            <Link
              key={cat.name}
              to={`/products?category=${encodeURIComponent(cat.query)}`}
              className="group relative aspect-4/3 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 block"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 filter brightness-[0.7]"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors"></div>
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <span className="text-white text-lg sm:text-xl font-black tracking-wide drop-shadow-md group-hover:text-amber-300 transition-colors">
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. ⚡ Deals of the Day */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900">Deals of the Day</h2>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-bold text-[#0c2a5e] hover:text-[#2563eb] flex items-center gap-1"
          >
            <span>View All Deals</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {loading
            ? [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
              ))
            : products.slice(0, 6).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
        </div>
      </section>

      {/* 4. 🔥 Trending Now */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500 fill-rose-500" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900">Trending Now</h2>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-bold text-[#0c2a5e] hover:text-[#2563eb] flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {loading
            ? [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
              ))
            : products.slice(1, 7).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
        </div>
      </section>

      {/* 5. 🏆 Top Selling */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900">Top Selling</h2>
          </div>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-bold text-[#0c2a5e] hover:text-[#2563eb] flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {loading
            ? [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
              ))
            : products.slice(2, 8).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
        </div>
      </section>

      {/* 6. Three Promotional Banners Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {promoBanners.map((promo, idx) => (
          <div
            key={idx}
            className="relative rounded-2xl overflow-hidden p-6 sm:p-7 min-h-[220px] flex flex-col justify-between shadow-xs group"
          >
            {/* Background Image */}
            <img
              src={promo.image}
              alt={promo.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter brightness-[0.4]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

            {/* Content */}
            <div className="relative z-10 space-y-1">
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                {promo.title}
              </h3>
              <p className="text-xs text-slate-300">{promo.subtitle}</p>
            </div>

            <div className="relative z-10 flex items-center gap-3 pt-4">
              <span className="px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-md shadow-xs">
                {promo.discount}
              </span>
              <Link
                to={promo.link}
                className="text-xs font-bold text-white hover:text-amber-300 transition"
              >
                {promo.ctaText}
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* 7. 👑 Featured Products with Filter Tabs */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg sm:text-xl font-black text-slate-900">Featured Products</h2>
          </div>

          {/* Department Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold">
            {['All', 'Electronics', 'Furniture', 'Grocery', 'Fashion', 'Footwear', 'Accessories'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[#0c2a5e] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {tab === 'Fashion' ? 'Clothing' : tab}
              </button>
            ))}
          </div>

          <Link
            to="/products"
            className="text-xs font-bold text-[#0c2a5e] hover:text-[#2563eb] hidden lg:flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {loading
            ? [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
              ))
            : filteredProducts.slice(0, 12).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
        </div>
      </section>



      {/* 9. 💬 "What Our Customers Say" */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">What Our Customers Say</h2>
          <p className="text-xs text-slate-500">Real feedback and experiences from our valued customers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#0c2a5e] text-white font-bold text-sm flex items-center justify-center">
                      {t.name[0]}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{t.name}</div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">{t.city}</div>
                    </div>
                  </div>
                  <Quote className="w-6 h-6 text-[#f59e0b]/40" />
                </div>

                <div className="flex text-amber-400 gap-0.5">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                  ))}
                </div>

                <p className="text-xs text-slate-600 italic leading-relaxed pt-1">
                  "{t.comment}"
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold pt-2 border-t border-slate-100">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Customer</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
