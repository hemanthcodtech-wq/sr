import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Truck,
  Headphones,
  LayoutGrid,
  Crown,
  ShoppingCart,
  Star,
  CheckCircle2,
  Quote,
  Sparkles,
  Flame,
  RotateCcw,
  Tag,
  Zap,
} from 'lucide-react';
import HeroCarousel from '../components/HeroCarousel';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

// 8 Circular Categories (Exact Match to Screenshot)
const circleCategories = [
  {
    id: 'mobiles',
    name: 'Mobiles & Accessories',
    query: 'Electronics',
    bgColor: 'bg-[#e8f0fe] border-blue-200/60',
    img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'mens-fashion',
    name: "Men's Fashion",
    query: 'Fashion',
    bgColor: 'bg-[#e3f2fd] border-sky-200/60',
    img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'womens-fashion',
    name: "Women's Fashion",
    query: 'Fashion',
    bgColor: 'bg-[#fce4ec] border-pink-200/60',
    img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'footwear',
    name: 'Footwear',
    query: 'Footwear',
    bgColor: 'bg-[#e0f7fa] border-cyan-200/60',
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'home-kitchen',
    name: 'Home & Kitchen',
    query: 'Home & Kitchen',
    bgColor: 'bg-[#fff3e0] border-amber-200/60',
    img: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'beauty',
    name: 'Beauty & Personal Care',
    query: 'Beauty',
    bgColor: 'bg-[#fce8e6] border-rose-200/60',
    img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'electronics',
    name: 'Electronics',
    query: 'Electronics',
    bgColor: 'bg-[#ede7f6] border-indigo-200/60',
    img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80',
  },
  {
    id: 'more',
    name: 'More Categories',
    query: '',
    bgColor: 'bg-slate-100 border-slate-200',
    isIcon: true,
  },
];

// 6 Featured Vendors (Exact Match to Screenshot)
const featuredVendorsList = [
  {
    id: 'store_sv_fashion',
    name: 'SV Fashion',
    productsCount: '125 Products',
    badgeType: 'sv',
    bg: 'bg-black text-amber-400',
  },
  {
    id: 'store_tech_world',
    name: 'Tech World',
    productsCount: '98 Products',
    badgeType: 'tw',
    bg: 'bg-[#004e92] text-white',
  },
  {
    id: 'store_home_needs',
    name: 'Home Needs',
    productsCount: '76 Products',
    badgeType: 'home',
    bg: 'bg-[#ff9900] text-white',
  },
  {
    id: 'store_green_life',
    name: 'Green Life',
    productsCount: '64 Products',
    badgeType: 'leaf',
    bg: 'bg-[#0f8a48] text-white',
  },
  {
    id: 'store_beauty_zone',
    name: 'Beauty Zone',
    productsCount: '52 Products',
    badgeType: 'beauty',
    bg: 'bg-[#e91e63] text-white',
  },
  {
    id: 'store_sports_hub',
    name: 'Sports Hub',
    productsCount: '48 Products',
    badgeType: 'sports',
    bg: 'bg-[#0d2137] text-white',
  },
];

// 5 Top Deals from Vendors (Exact Match to Screenshot)
const topDealsList = [
  {
    _id: 'prod_mens_shirt',
    title: "Men's Shirt",
    vendorName: 'SV Fashion',
    price: 899,
    discountPrice: 499,
    discountPercent: 40,
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80',
  },
  {
    _id: 'prod_smartphone',
    title: 'Smartphone',
    vendorName: 'Tech World',
    price: 19999,
    discountPrice: 14999,
    discountPercent: 25,
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
  },
  {
    _id: 'prod_air_fryer',
    title: 'Air Fryer',
    vendorName: 'Home Needs',
    price: 5999,
    discountPrice: 3899,
    discountPercent: 35,
    image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&auto=format&fit=crop&q=80',
  },
  {
    _id: 'prod_skincare_combo',
    title: 'Skincare Combo',
    vendorName: 'Beauty Zone',
    price: 999,
    discountPrice: 699,
    discountPercent: 30,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80',
  },
  {
    _id: 'prod_sports_shoes',
    title: 'Sports Shoes',
    vendorName: 'Sports Hub',
    price: 1999,
    discountPrice: 1099,
    discountPercent: 45,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
  },
];

// Popular Categories Squircles
const popularCategories = [
  { name: 'Mobiles', query: 'Electronics', img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80' },
  { name: "Men's Fashion", query: 'Fashion', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&auto=format&fit=crop&q=80' },
  { name: "Women's Fashion", query: 'Fashion', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&auto=format&fit=crop&q=80' },
  { name: 'Footwear', query: 'Footwear', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80' },
  { name: 'Home & Kitchen', query: 'Home & Kitchen', img: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=300&auto=format&fit=crop&q=80' },
  { name: 'Beauty', query: 'Beauty', img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80' },
  { name: 'Laptops', query: 'Electronics', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&auto=format&fit=crop&q=80' },
  { name: 'Handbags', query: 'Fashion', img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300&auto=format&fit=crop&q=80' },
];

// Remaining Tagged Products Fallback Catalog
const defaultTaggedProducts = [
  {
    _id: 'prod_smart_tv',
    title: '55-inch Ultra HD 4K Bezel-Less Smart Android TV',
    vendorName: 'Tech World',
    price: 45999,
    discountPrice: 32999,
    discountPercent: 28,
    category: 'Electronics',
    tag: 'Trending',
    rating: 4.9,
    reviews: 142,
    image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
  },
  {
    _id: 'prod_sony_xm5',
    title: 'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones',
    vendorName: 'Tech World',
    price: 29990,
    discountPrice: 26990,
    discountPercent: 10,
    category: 'Electronics',
    tag: 'Best Seller',
    rating: 4.9,
    reviews: 84,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  },
  {
    _id: 'prod_silk_saree',
    title: 'Handcrafted Banarasi Pure Silk Saree with Zari Border',
    vendorName: 'SV Fashion',
    price: 4999,
    discountPrice: 2499,
    discountPercent: 50,
    category: 'Fashion',
    tag: 'Hot Deal',
    rating: 4.9,
    reviews: 64,
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop&q=80',
  },
  {
    _id: 'prod_white_sneakers',
    title: 'Premium Classic Low-Top White Sneakers',
    vendorName: 'Sports Hub',
    price: 3999,
    discountPrice: 3299,
    discountPercent: 18,
    category: 'Footwear',
    tag: 'Popular',
    rating: 4.9,
    reviews: 78,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
  },
  {
    _id: 'prod_leather_backpack',
    title: 'Handcrafted Minimalist Italian Leather Backpack',
    vendorName: 'SV Fashion',
    price: 7499,
    discountPrice: 5999,
    discountPercent: 20,
    category: 'Fashion',
    tag: 'Premium',
    rating: 4.8,
    reviews: 39,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80',
  },
  {
    _id: 'prod_organic_rice',
    title: 'Royal Aged 1121 Basmati Rice (5kg Family Pack)',
    vendorName: 'Green Life',
    price: 899,
    discountPrice: 649,
    discountPercent: 27,
    category: 'Grocery',
    tag: 'Organic',
    rating: 4.8,
    reviews: 210,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop&q=80',
  },
  {
    _id: 'prod_face_serum',
    title: 'Pure 20% Vitamin C + Hyaluronic Acid Radiance Serum (30ml)',
    vendorName: 'Beauty Zone',
    price: 799,
    discountPrice: 499,
    discountPercent: 37,
    category: 'Beauty',
    tag: 'Dermatologist Tested',
    rating: 4.9,
    reviews: 168,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
  },
  {
    _id: 'prod_wooden_chair',
    title: 'Solid Teak Wood Ergonomic Dining & Study Armchair',
    vendorName: 'Home Needs',
    price: 5499,
    discountPrice: 3899,
    discountPercent: 29,
    category: 'Furniture',
    tag: 'Solid Wood',
    rating: 4.7,
    reviews: 45,
    image: 'https://images.unsplash.com/photo-1580481077194-e35b0b2e88cb?w=800&auto=format&fit=crop&q=80',
  },
];

// Rich Testimonials with Verified Purchases
const verifiedTestimonials = [
  {
    id: 1,
    name: 'Ramesh Sharma',
    city: 'Hyderabad, Telangana',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    initials: 'RS',
    itemPurchased: '55" Ultra HD 4K Smart Android TV',
    rating: 5,
    date: 'Verified Buyer • 2 days ago',
    comment: 'Exceptional shopping experience! The TV was securely packed and delivered in less than 24 hours. Screen quality is flawless and setup was super simple. RS Marketplace is now my go-to platform.',
  },
  {
    id: 2,
    name: 'Priya Kulkarni',
    city: 'Bengaluru, Karnataka',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    initials: 'PK',
    itemPurchased: 'Handcrafted Banarasi Silk Saree',
    rating: 5,
    date: 'Verified Buyer • 4 days ago',
    comment: 'The Banarasi silk saree from SV Fashion is 100% authentic pure silk with breathtaking zari work. I received endless compliments at the wedding. Transparent merchant pricing and prompt customer care!',
  },
  {
    id: 3,
    name: 'Arjun Mehta',
    city: 'Vijayawada, Andhra Pradesh',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    initials: 'AM',
    itemPurchased: 'Digital Touch Air Fryer 4.5L',
    rating: 5,
    date: 'Verified Buyer • 1 week ago',
    comment: 'Got an unbelievable 35% discount on the air fryer from Home Needs. Crispy French fries and snacks with zero excess oil. The seller tracking notifications kept me informed at every step.',
  },
];

const Home = () => {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [activeCatalogTab, setActiveCatalogTab] = useState('All');
  const [activeTag, setActiveTag] = useState('All');
  const [taggedProducts, setTaggedProducts] = useState(defaultTaggedProducts);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.get('/products?limit=30');
        if (res.data?.success && res.data.products?.length > 5) {
          // Exclude the 5 top deals from the remaining tagged products to avoid redundancy
          const topIds = topDealsList.map((d) => d._id);
          const remaining = res.data.products.filter((p) => !topIds.includes(p._id));
          if (remaining.length > 0) {
            const mapped = remaining.map((p, idx) => ({
              _id: p._id,
              title: p.title,
              vendorName: p.store?.storeName || p.vendorName || 'Verified Merchant',
              price: p.price || 999,
              discountPrice: p.discountPrice || p.price || 799,
              discountPercent: p.discountPrice && p.price ? Math.round(((p.price - p.discountPrice) / p.price) * 100) : 0,
              category: p.category || 'General',
              tag: (p.tags && p.tags[0]) || (idx % 2 === 0 ? 'Trending' : 'Best Seller'),
              rating: p.rating || 4.8,
              reviews: p.numReviews || 45,
              image: p.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
            }));
            setTaggedProducts(mapped);
          }
        }
      } catch (err) {
        console.warn('Using default tagged catalog fallback:', err);
      }
    };
    fetchCatalog();
  }, []);

  const handleQuickAdd = (product) => {
    addToCart(product, 1);
    if (showToast) {
      showToast(`${product.title} added to cart!`, 'success');
    }
  };

  // Filter tagged products by category & tag
  const filteredProducts = taggedProducts.filter((p) => {
    const matchesCategory =
      activeCatalogTab === 'All' ||
      (p.category && p.category.toLowerCase().includes(activeCatalogTab.toLowerCase()));

    const matchesTag =
      activeTag === 'All' ||
      (p.tag && p.tag.toLowerCase().includes(activeTag.toLowerCase())) ||
      (activeTag === 'Deals' && p.discountPercent > 20);

    return matchesCategory && matchesTag;
  });

  return (
    <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-7 sm:space-y-10 select-none">
      
      {/* 1. Full-Width Hero Slider */}
      <section className="w-full">
        <HeroCarousel />
      </section>

      {/* 2. Circular Category Bubbles (Exact Match to Screenshot) */}
      <section className="w-full">
        <div className="flex items-start gap-3 sm:gap-6 overflow-x-auto scrollbar-none pb-2 pt-1 px-1 lg:justify-between">
          {circleCategories.map((cat) => (
            <Link
              key={cat.id}
              to={cat.isIcon ? '/products' : `/products?category=${encodeURIComponent(cat.query)}`}
              className="flex flex-col items-center flex-shrink-0 group text-center w-[74px] sm:w-[86px] md:w-[94px]"
            >
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 rounded-full ${cat.bgColor} border flex items-center justify-center p-2 shadow-2xs group-hover:scale-110 active:scale-95 transition-all duration-200 overflow-hidden`}
              >
                {cat.isIcon ? (
                  <LayoutGrid className="w-6 h-6 text-slate-700 group-hover:text-[#0f8a48] transition-colors" />
                ) : (
                  <img
                    src={cat.img}
                    alt={cat.name}
                    className="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-115 transition-transform duration-300"
                    loading="lazy"
                  />
                )}
              </div>
              <span className="text-[11px] sm:text-xs font-semibold text-slate-800 group-hover:text-[#0f8a48] mt-1.5 leading-tight line-clamp-2 px-0.5 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Vendors Section (Exact Match to Screenshot) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 tracking-tight">
            Featured Vendors
          </h2>
          <Link
            to="/stores"
            className="text-xs sm:text-sm font-bold text-[#0f8a48] hover:text-[#0c723b] hover:underline flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 px-1 lg:grid lg:grid-cols-6 lg:overflow-visible">
          {featuredVendorsList.map((vendor) => (
            <div
              key={vendor.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 p-3.5 sm:p-4 flex flex-col items-center justify-between text-center flex-shrink-0 w-[130px] sm:w-[150px] lg:w-full group"
            >
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${vendor.bg} flex items-center justify-center font-black shadow-xs mb-2 group-hover:scale-108 transition-transform duration-200`}
              >
                {vendor.badgeType === 'sv' && (
                  <div className="flex flex-col items-center justify-center">
                    <Crown className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-[7px] font-black tracking-tight leading-none text-amber-400 mt-0.5">SV FASHION</span>
                  </div>
                )}
                {vendor.badgeType === 'tw' && (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-sm font-black tracking-tight">TW</span>
                    <span className="text-[6.5px] font-bold tracking-tight leading-none text-white/90">TECH WORLD</span>
                  </div>
                )}
                {vendor.badgeType === 'home' && (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-base">🏠</span>
                    <span className="text-[6.5px] font-bold tracking-tight leading-none text-white mt-0.5">Home Needs</span>
                  </div>
                )}
                {vendor.badgeType === 'leaf' && (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-base">🌿</span>
                    <span className="text-[6.5px] font-bold tracking-tight leading-none text-white mt-0.5">Green Life</span>
                  </div>
                )}
                {vendor.badgeType === 'beauty' && (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-base">🌸</span>
                    <span className="text-[6.5px] font-bold tracking-tight leading-none text-white mt-0.5">Beauty Zone</span>
                  </div>
                )}
                {vendor.badgeType === 'sports' && (
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-base">🏃</span>
                    <span className="text-[6.5px] font-bold tracking-tight leading-none text-white mt-0.5">Sports Hub</span>
                  </div>
                )}
              </div>

              <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-[#0f8a48] transition-colors">
                {vendor.name}
              </h3>

              <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 mb-2.5">
                {vendor.productsCount}
              </p>

              <Link
                to={`/stores/${vendor.id}`}
                className="w-full py-1.5 px-3 rounded-full bg-[#0f8a48] hover:bg-[#0c723b] active:scale-95 text-white font-bold text-[11px] sm:text-xs transition-all shadow-xs text-center"
              >
                Visit Shop
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Top Deals from Vendors Section (Exact Match to Screenshot) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 tracking-tight">
            Top Deals from Vendors
          </h2>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-bold text-[#0f8a48] hover:text-[#0c723b] hover:underline flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 px-1 lg:grid lg:grid-cols-5 lg:overflow-visible">
          {topDealsList.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 p-3 flex flex-col justify-between flex-shrink-0 w-[145px] sm:w-[170px] lg:w-full group"
            >
              <div className="flex items-center justify-between gap-1 w-full mb-2">
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-slate-700 truncate max-w-[65%]">
                  <span className="w-3 h-3 rounded-full bg-slate-800 text-amber-300 flex items-center justify-center text-[7px] flex-shrink-0">
                    ★
                  </span>
                  <span className="truncate">{product.vendorName}</span>
                </div>

                <span className="bg-[#e11d48] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full shadow-2xs leading-none">
                  {product.discountPercent}% OFF
                </span>
              </div>

              <div className="w-full aspect-square overflow-hidden rounded-xl bg-slate-50/70 flex items-center justify-center p-2 mb-2">
                <Link to={`/products/${product._id}`} className="w-full h-full flex items-center justify-center">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-300 filter drop-shadow-xs"
                    loading="lazy"
                  />
                </Link>
              </div>

              <div className="space-y-1.5 mb-2.5">
                <Link
                  to={`/products/${product._id}`}
                  className="text-xs sm:text-sm font-bold text-slate-900 hover:text-[#0f8a48] line-clamp-1 transition block"
                >
                  {product.title}
                </Link>

                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm sm:text-base font-extrabold text-[#0f8a48]">
                    ₹{product.discountPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400 line-through font-medium">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleQuickAdd(product)}
                className="w-full py-2 px-2.5 rounded-xl bg-[#0f8a48] hover:bg-[#0c723b] active:scale-95 text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Promotional "Join Today ₹1000/-" Banner (Exact Match to Screenshot) */}
      <section className="w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm bg-gradient-to-r from-[#035b36] via-[#047743] to-[#024a2b] text-white p-3.5 sm:p-6 md:p-8">
        <div className="grid grid-cols-12 items-center gap-2 sm:gap-4 md:gap-8">
          {/* Left: Businessman Avatar */}
          <div className="col-span-3 sm:col-span-3 md:col-span-3 flex justify-center">
            <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden border-2 sm:border-3 border-yellow-400 shadow-md bg-amber-100 flex-shrink-0">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80"
                alt="Partner Merchant"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>

          {/* Center: Join Today & ₹1000/- & Button */}
          <div className="col-span-5 sm:col-span-5 md:col-span-5 flex flex-col items-center sm:items-start text-center sm:text-left space-y-1 sm:space-y-2">
            <span className="text-sm sm:text-xl md:text-2xl font-black text-white leading-tight">
              Join Today
            </span>
            <div className="inline-block px-2.5 sm:px-4 py-0.5 sm:py-1 bg-[#ffde17] text-slate-950 font-black text-xs sm:text-lg md:text-xl rounded-md sm:rounded-lg shadow-xs">
              ₹1000/-
            </div>
            <Link
              to="/vendor/register"
              className="inline-flex items-center gap-1 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white hover:bg-slate-100 active:scale-95 text-slate-950 font-bold text-[9px] sm:text-xs shadow-xs transition-all mt-0.5"
            >
              <span className="truncate">Start Your Earning Journey</span>
            </Link>
          </div>

          {/* Right: 3 Trust Pillars */}
          <div className="col-span-4 sm:col-span-4 md:col-span-4 flex flex-col justify-center space-y-1.5 sm:space-y-2.5 pl-1.5 sm:pl-4 border-l border-emerald-500/30 text-[9.5px] sm:text-xs font-semibold text-emerald-100">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0">
                <Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              </div>
              <span className="text-white truncate">Fast Delivery</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              </div>
              <span className="text-white truncate">Secure Payment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0">
                <Headphones className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              </div>
              <span className="text-white truncate">24x7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Popular Categories Section (Exact Match to Screenshot) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 tracking-tight">
            Popular Categories
          </h2>
          <Link
            to="/products"
            className="text-xs sm:text-sm font-bold text-[#0f8a48] hover:text-[#0c723b] hover:underline flex items-center gap-1 transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4 overflow-x-auto scrollbar-none pb-2 pt-1 px-1 lg:grid lg:grid-cols-8 lg:overflow-visible">
          {popularCategories.map((cat, i) => (
            <Link
              key={i}
              to={`/products?category=${encodeURIComponent(cat.query)}`}
              className="bg-white rounded-2xl border border-slate-100 p-2 sm:p-3 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col items-center text-center flex-shrink-0 w-[78px] sm:w-[94px] lg:w-full group"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center mb-1.5 p-1">
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-slate-800 group-hover:text-[#0f8a48] line-clamp-1 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 7. REMAINING TAGGED PRODUCTS SHOWCASE (In a Good, Beautiful & Responsive Way) */}
      <section className="space-y-4 pt-4 border-t border-slate-200/90">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 px-1">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[#0f8a48] text-[10px] sm:text-xs font-black uppercase tracking-wider mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>Curated Marketplace Catalog</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Trending &amp; Tagged Products
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified goods with guaranteed merchant warranties, direct seller pricing &amp; express doorstep dispatch.
            </p>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0f8a48] hover:text-[#0c723b] hover:underline"
          >
            <span>Explore All 1,200+ Products</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 pt-1">
          {['All', 'Electronics', 'Fashion', 'Footwear', 'Grocery', 'Furniture', 'Beauty'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCatalogTab(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCatalogTab === cat
                  ? 'bg-[#0f8a48] text-white shadow-xs scale-105'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quick Filter Tag Badges */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 text-[11px] font-semibold text-slate-600">
          <span className="text-slate-400 flex items-center gap-1">
            <Tag className="w-3 h-3 text-[#0f8a48]" />
            <span>Filter Tags:</span>
          </span>
          {['All', 'Trending', 'Best Seller', 'Deals'].map((tg) => (
            <button
              key={tg}
              type="button"
              onClick={() => setActiveTag(tg)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeTag === tg
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {tg}
            </button>
          ))}
        </div>

        {/* Product Cards Grid: 2 cols on mobile, 3 on tablet, 5 on laptop, 6 on large desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 sm:gap-3.5 pt-1">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300 p-2.5 sm:p-3 flex flex-col justify-between group relative"
            >
              {/* Card Top: Vendor Name & Tag Pill */}
              <div className="flex items-center justify-between gap-1 w-full mb-1.5 min-h-[20px]">
                <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-full truncate max-w-[65%]">
                  {product.vendorName}
                </span>

                {product.tag && (
                  <span className="bg-amber-100 text-amber-900 border border-amber-200/80 text-[8.5px] sm:text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none flex-shrink-0">
                    {product.tag}
                  </span>
                )}
              </div>

              {/* Product Image: compact max-h for sleek look on laptop */}
              <div className="w-full aspect-square max-h-36 sm:max-h-44 overflow-hidden rounded-lg sm:rounded-xl bg-slate-50/70 flex items-center justify-center p-1.5 sm:p-2 mb-1.5 relative">
                <Link to={`/products/${product._id}`} className="w-full h-full flex items-center justify-center">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-300 filter drop-shadow-xs"
                    loading="lazy"
                  />
                </Link>

                {product.discountPercent > 0 && (
                  <span className="absolute top-1.5 left-1.5 bg-[#e11d48] text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-2xs leading-none">
                    {product.discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-1 mb-2">
                <Link
                  to={`/products/${product._id}`}
                  className="text-xs sm:text-[13px] font-bold text-slate-900 hover:text-[#0f8a48] line-clamp-2 transition block leading-snug"
                  title={product.title}
                >
                  {product.title}
                </Link>

                {/* Rating Stars & Reviews Count */}
                <div className="flex items-center gap-1">
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[9.5px] text-slate-400 font-medium">({product.reviews || 48})</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1.5 pt-0.5">
                  <span className="text-xs sm:text-sm md:text-base font-extrabold text-[#0f8a48]">
                    ₹{product.discountPrice.toLocaleString('en-IN')}
                  </span>
                  {product.discountPrice < product.price && (
                    <span className="text-[10px] sm:text-[11px] text-slate-400 line-through font-medium">
                      ₹{product.price.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              {/* Full Width Green Add to Cart Button */}
              <button
                type="button"
                onClick={() => handleQuickAdd(product)}
                className="w-full py-1.5 sm:py-2 px-2.5 rounded-lg sm:rounded-xl bg-[#0f8a48] hover:bg-[#0c723b] active:scale-95 text-white text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <ShoppingCart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Add to Cart</span>
              </button>
            </div>
          ))}
        </div>

        {/* Bottom Catalog Action */}
        <div className="pt-3 text-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#081e36] hover:bg-[#0c2a5e] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <span>View Full Marketplace Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 8. WORLD-CLASS CUSTOMER TESTIMONIALS & TRUST GUARANTEES */}
      <section className="space-y-6 pt-6 border-t border-slate-200">
        {/* Section Header */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] sm:text-xs font-black uppercase tracking-wider">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span>Verified Customer Reviews</span>
          </div>

          <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Loved by 50,000+ Happy Shoppers
          </h2>

          <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-semibold bg-white border border-slate-200 px-3.5 py-1 rounded-full shadow-2xs">
            <span className="text-amber-500 font-black">★ 4.9/5 Overall Rating</span>
            <span className="text-slate-300">•</span>
            <span>18,500+ Verified Orders Across India</span>
          </div>
        </div>

        {/* Testimonial Cards: Grid on desktop, smooth swipeable on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {verifiedTestimonials.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.04)] p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-all duration-300"
            >
              <div className="space-y-3">
                {/* User Top Row: Avatar + Name + Quote */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-11 h-11 rounded-full object-cover border-2 border-emerald-400 shadow-xs"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{t.name}</h4>
                      <p className="text-[10px] text-slate-400 font-medium">{t.city}</p>
                    </div>
                  </div>
                  <Quote className="w-6 h-6 text-amber-400/40" />
                </div>

                {/* Stars & Verified Item Chip */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>

                  <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                    {t.itemPurchased}
                  </span>
                </div>

                {/* Feedback Comment */}
                <p className="text-xs text-slate-600 leading-relaxed italic pt-1">
                  "{t.comment}"
                </p>
              </div>

              {/* Bottom Verification Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[10.5px]">
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verified Purchase</span>
                </div>
                <span className="text-slate-400 font-medium">{t.date}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 4 Pillars of Marketplace Trust Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#0f8a48] flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs">100% Genuine</p>
              <p className="text-[10px] text-slate-500">Verified seller guarantee</p>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs">Express Delivery</p>
              <p className="text-[10px] text-slate-500">Fast doorstep shipping</p>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs">7-Day Replacement</p>
              <p className="text-[10px] text-slate-500">Instant easy returns</p>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs">Secure UPI &amp; Cards</p>
              <p className="text-[10px] text-slate-500">256-bit bank encryption</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
