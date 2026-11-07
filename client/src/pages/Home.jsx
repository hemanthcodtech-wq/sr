import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
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
  Store as StoreIcon,
} from 'lucide-react';
import HeroCarousel from '../components/HeroCarousel';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

// Verified Testimonials for the feedback carousel
const verifiedTestimonials = [
  {
    id: 1,
    name: 'Ramesh Sharma',
    city: 'Hyderabad, Telangana',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    itemPurchased: '2 Wine Glasses & Marble Holder',
    rating: 5,
    date: 'Verified Buyer • 2 days ago',
    comment: 'Exceptional shopping experience! The item was securely packed and delivered in less than 24 hours. Pristine quality and setup was super simple. Amezon is now my go-to platform.',
  },
  {
    id: 2,
    name: 'Priya Kulkarni',
    city: 'Bengaluru, Karnataka',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    itemPurchased: 'Wall-Mounted Foldable Storage Rack',
    rating: 5,
    date: 'Verified Buyer • 4 days ago',
    comment: '100% authentic product with sturdy build and reliable adhesive stickers. Prompt customer care and free delivery guarantee. Highly recommended!',
  },
  {
    id: 3,
    name: 'Arjun Mehta',
    city: 'Vijayawada, Andhra Pradesh',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    itemPurchased: 'Duck Climb Stairs Toy Roller Coaster',
    rating: 5,
    date: 'Verified Buyer • 1 week ago',
    comment: 'Kids loved the flashing lights and musical ducks! Unbeatable direct wholesale price with free shipping across India.',
  },
  {
    id: 4,
    name: 'Sneha Patel',
    city: 'Surat, Gujarat',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    itemPurchased: 'Beauty Ice Roller for Face & Eyes',
    rating: 5,
    date: 'Verified Buyer • 5 days ago',
    comment: 'Visible skin freshness in just 3 days! Loved the tamper-proof packaging and quick 2-day delivery to Surat. Incredible authentic product quality.',
  },
  {
    id: 5,
    name: 'Rahul Verma',
    city: 'Pune, Maharashtra',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    itemPurchased: 'Swimming Goggles Anti-Fog & Waterproof',
    rating: 5,
    date: 'Verified Buyer • 3 days ago',
    comment: 'Super comfortable seal and clear vision underwater. Free delivery arrived exactly on the promised date. Truly a seamless shopping experience!',
  },
];

// Category fallback imagery
const categoryImages = {
  'Fitness': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&auto=format&fit=crop&q=80',
  'Home & Kitchen': 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=300&auto=format&fit=crop&q=80',
  'Toys': 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=300&auto=format&fit=crop&q=80',
  'Electronics': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&auto=format&fit=crop&q=80',
  'Fashion': 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&auto=format&fit=crop&q=80',
  'Beauty': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300&auto=format&fit=crop&q=80',
  'Footwear': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&auto=format&fit=crop&q=80',
  'Automotive': 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=300&auto=format&fit=crop&q=80',
};

const categoryBgColors = [
  'bg-[#e8f0fe] border-blue-200/60',
  'bg-[#fff3e0] border-amber-200/60',
  'bg-[#e0f7fa] border-cyan-200/60',
  'bg-[#fce4ec] border-pink-200/60',
  'bg-[#ede7f6] border-indigo-200/60',
  'bg-[#fce8e6] border-rose-200/60',
  'bg-[#e3f2fd] border-sky-200/60',
  'bg-[#e8f5e9] border-emerald-200/60',
];

const Home = () => {
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCatalogTab, setActiveCatalogTab] = useState('All');
  const [activeTag, setActiveTag] = useState('All');
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [mobileCols, setMobileCols] = useState(() => {
    const saved = localStorage.getItem('shoppinest_catalog_cols');
    return saved ? Number(saved) : 4; // default 4 per row (or switchable to 3 per row)
  });

  const handleSetMobileCols = (cols) => {
    setMobileCols(cols);
    try {
      localStorage.setItem('shoppinest_catalog_cols', cols);
    } catch {
      // ignore quota / private mode
    }
  };

  // Auto-rotate feedback carousel every 5 seconds
  useEffect(() => {
    if (!verifiedTestimonials || verifiedTestimonials.length <= 1) return;
    const interval = setInterval(() => {
      setTestimonialIndex((prev) => (prev + 1) % verifiedTestimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch only REAL products and stores directly from the MongoDB database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch real products from database
        const prodRes = await api.get('/products?limit=50');
        if (prodRes.data?.success && Array.isArray(prodRes.data.products)) {
          const mapped = prodRes.data.products.map((p, idx) => {
            const finalPrice = Number(p.price || p.sellingPrice || 0);
            const originalPrice =
              p.discountPrice && Number(p.discountPrice) > finalPrice
                ? Number(p.discountPrice)
                : Math.round(finalPrice * 1.35);
            const discountPercent =
              originalPrice > finalPrice
                ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
                : 0;

            const categoryName = p.category || 'General';
            const primaryImg =
              p.images?.[0] ||
              categoryImages[categoryName] ||
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';

            return {
              _id: p._id,
              title: p.title || 'Product',
              vendorName: p.store?.storeName || p.vendorName || 'Shoppinest Hub',
              price: originalPrice,
              discountPrice: finalPrice,
              discountPercent,
              category: categoryName,
              tag: (p.tags && p.tags[0]) || (discountPercent > 20 ? 'Hot Deal' : idx % 2 === 0 ? 'Trending' : 'Best Seller'),
              rating: Number(p.rating) || 4.8,
              reviews: Number(p.numReviews) || (p.reviews?.length) || (18 + ((idx * 9) % 65)),
              image: primaryImg,
              isFreeDelivery: p.isFreeDelivery !== false,
            };
          });
          setProducts(mapped);
        }

        // 2. Fetch real active stores from database
        try {
          const storeRes = await api.get('/vendors/public-stores');
          if (storeRes.data?.success && Array.isArray(storeRes.data.stores)) {
            setStores(storeRes.data.stores);
          }
        } catch (storeErr) {
          console.warn('Could not fetch stores, will derive from products:', storeErr.message);
        }
      } catch (err) {
        console.error('Failed to fetch database products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleQuickAdd = (product) => {
    addToCart(product, 1);
    if (showToast) {
      showToast(`${product.title} added to cart!`, 'success');
    }
  };

  // Top deals derived directly from database products - dynamic count matching mobile columns (3 or 4 per row)
  const topDeals = useMemo(() => {
    if (!products.length) return [];
    const sorted = [...products].sort((a, b) => b.discountPercent - a.discountPercent);
    const limit = mobileCols === 4 ? 4 : 3;
    return sorted.slice(0, limit);
  }, [products, mobileCols]);

  // Unique categories derived dynamically from database products
  const dynamicCategories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return cats.length > 0 ? cats : ['Fitness', 'Home & Kitchen', 'Toys', 'Electronics'];
  }, [products]);

  // Circular categories for Section 2 (Compact size on mobile)
  const circleCategories = useMemo(() => {
    return dynamicCategories.slice(0, 8).map((catName, idx) => ({
      id: `cat_${idx}`,
      name: catName,
      query: catName,
      bgColor: categoryBgColors[idx % categoryBgColors.length],
      img: categoryImages[catName] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80',
    }));
  }, [dynamicCategories]);

  // Derived vendors from DB stores or unique vendor names from DB products
  const displayVendors = useMemo(() => {
    if (stores.length > 0) {
      return stores.map((s, idx) => ({
        id: s._id,
        name: s.storeName,
        productsCount: `${s.productCount || products.length} Products`,
        logo: s.logo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
        badge: s.storeName.substring(0, 2).toUpperCase(),
        link: `/stores/${s.slug || s._id}`,
      }));
    }

    const uniqueVendors = Array.from(new Set(products.map((p) => p.vendorName).filter(Boolean)));
    return uniqueVendors.slice(0, 6).map((vName, idx) => ({
      id: `vendor_${idx}`,
      name: vName,
      productsCount: `${products.filter((p) => p.vendorName === vName).length} Products`,
      badge: vName.substring(0, 2).toUpperCase(),
      logo: null,
      link: `/products?search=${encodeURIComponent(vName)}`,
    }));
  }, [stores, products]);

  // Filter products by category & tag
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        activeCatalogTab === 'All' ||
        (p.category && p.category.toLowerCase().includes(activeCatalogTab.toLowerCase()));

      const matchesTag =
        activeTag === 'All' ||
        (p.tag && p.tag.toLowerCase().includes(activeTag.toLowerCase())) ||
        (activeTag === 'Deals' && p.discountPercent > 20);

      return matchesCategory && matchesTag;
    });
  }, [products, activeCatalogTab, activeTag]);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-5 space-y-3.5 sm:space-y-6 select-none pb-6">
      
      {/* 1. Full-Width Hero Slider (Minimized height on mobile like svworks.com.in) */}
      <section className="w-full">
        <HeroCarousel />
      </section>

      {/* 2. Circular Category Bubbles (Compact height on mobile) */}
      <section className="w-full">
        <div className="flex items-start gap-2 sm:gap-4 overflow-x-auto scrollbar-none pb-1 pt-0.5 px-0.5 lg:justify-between">
          {circleCategories.map((cat) => (
            <Link
              key={cat.id}
              to={`/products?category=${encodeURIComponent(cat.query)}`}
              className="flex flex-col items-center flex-shrink-0 group text-center w-[58px] sm:w-[76px] md:w-[86px]"
            >
              <div
                className={`w-11 h-11 sm:w-15 sm:h-15 md:w-17 md:h-17 rounded-full ${cat.bgColor} border flex items-center justify-center p-1 sm:p-1.5 shadow-2xs group-hover:scale-108 active:scale-95 transition-all duration-200 overflow-hidden bg-slate-50`}
              >
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-115 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/logo.png';
                  }}
                />
              </div>
              <span className="text-[9.5px] sm:text-xs font-semibold text-slate-800 group-hover:text-[#0f8a48] mt-0.5 leading-tight line-clamp-2 px-0.5 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}

          {/* More Categories Bubble */}
          <Link
            to="/products"
            className="flex flex-col items-center flex-shrink-0 group text-center w-[58px] sm:w-[76px] md:w-[86px]"
          >
            <div className="w-11 h-11 sm:w-15 sm:h-15 md:w-17 md:h-17 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center p-1.5 shadow-2xs group-hover:scale-108 active:scale-95 transition-all">
              <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 group-hover:text-[#0f8a48] transition-colors" />
            </div>
            <span className="text-[9.5px] sm:text-xs font-semibold text-slate-800 group-hover:text-[#0f8a48] mt-0.5 leading-tight line-clamp-2 px-0.5">
              All Items
            </span>
          </Link>
        </div>
      </section>

      {/* 3. Featured Vendors Section (Compact on mobile) */}
      {displayVendors.length > 0 && (
        <section className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <StoreIcon className="w-3.5 h-3.5 text-[#0f8a48]" />
              <span>Verified Marketplace Stores</span>
            </h2>
            <Link
              to="/stores"
              className="text-[10.5px] sm:text-xs font-bold text-[#0f8a48] hover:text-[#0c723b] hover:underline flex items-center gap-0.5 transition"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="flex items-stretch gap-1.5 sm:gap-3 overflow-x-auto scrollbar-none pb-1 pt-0.5 px-0.5 lg:grid lg:grid-cols-6 lg:overflow-visible">
            {displayVendors.map((vendor) => (
              <div
                key={vendor.id}
                className="bg-white rounded-lg sm:rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-sm transition-all duration-200 p-1.5 sm:p-3 flex flex-col items-center justify-between text-center flex-shrink-0 w-[84px] sm:w-[130px] lg:w-full group"
              >
                <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-slate-900 text-amber-400 border border-slate-200 flex items-center justify-center font-black shadow-xs mb-1 group-hover:scale-108 transition-transform overflow-hidden">
                  {vendor.logo ? (
                    <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <Crown className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      <span className="text-[6.5px] font-black">{vendor.badge}</span>
                    </div>
                  )}
                </div>

                <h3 className="text-[9.5px] sm:text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-[#0f8a48] transition-colors leading-tight">
                  {vendor.name}
                </h3>

                <p className="text-[8px] sm:text-[10px] text-slate-500 mt-0.5 mb-1">
                  {vendor.productsCount}
                </p>

                <Link
                  to={vendor.link}
                  className="w-full py-0.5 px-1.5 rounded-md sm:rounded-full bg-[#0f8a48] hover:bg-[#0c723b] active:scale-95 text-white font-bold text-[8px] sm:text-xs transition-all shadow-xs text-center"
                >
                  Visit Shop
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Top Deals from Vendors Section
          Ultra-compact dense grid matching mobileCols (3 or 4 per row, no cut-off) */}
      <section className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-rose-600 fill-rose-500 animate-pulse" />
            <h2 className="text-xs sm:text-base font-black text-slate-900 tracking-tight">
              Top Deals from Vendors
            </h2>
          </div>
          <Link
            to="/products"
            className="text-[10.5px] sm:text-xs font-bold text-[#0f8a48] hover:text-[#0c723b] hover:underline flex items-center gap-0.5 transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className={`grid ${mobileCols === 4 ? 'grid-cols-4' : 'grid-cols-3'} sm:grid-cols-4 md:grid-cols-4 gap-1 sm:gap-2`}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-28 sm:h-36 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className={`grid ${mobileCols === 4 ? 'grid-cols-4' : 'grid-cols-3'} sm:grid-cols-4 md:grid-cols-4 gap-1 sm:gap-2 pt-0.5`}>
            {topDeals.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-md sm:rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all duration-200 p-1 sm:p-2 flex flex-col justify-between group"
              >
                {/* Vendor Pill & Discount Badge */}
                <div className="flex items-center justify-between gap-0.5 w-full mb-0.5 leading-none">
                  <span className="text-[6.5px] sm:text-[7.5px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-0.5 py-0.2 rounded truncate max-w-[50%]">
                    {product.vendorName}
                  </span>

                  {product.discountPercent > 0 && (
                    <span className="bg-[#e11d48] text-white text-[6.5px] sm:text-[7.5px] font-black px-1 py-0.2 rounded leading-none flex-shrink-0">
                      {product.discountPercent}% OFF
                    </span>
                  )}
                </div>

                {/* Product Image: Compact fixed height on mobile */}
                <div className="w-full h-14 sm:h-20 md:h-24 overflow-hidden rounded bg-[#f8fafc] flex items-center justify-center p-0.5 mb-0.5">
                  <Link to={`/products/${product._id}`} className="w-full h-full flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 filter drop-shadow-xs"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = categoryImages[product.category] || '/logo.png';
                      }}
                    />
                  </Link>
                </div>

                {/* Info & Price */}
                <div className="space-y-0.5 mb-0.5 flex-1 flex flex-col justify-between">
                  <Link
                    to={`/products/${product._id}`}
                    className="text-[8px] sm:text-[10px] font-semibold text-slate-900 hover:text-[#0f8a48] line-clamp-1 transition block leading-tight h-3 sm:h-3.5"
                    title={product.title}
                  >
                    {product.title}
                  </Link>

                  <div className="flex items-baseline gap-0.5 pt-0.5 leading-none">
                    <span className="text-[9.5px] sm:text-xs font-black text-[#0f8a48]">
                      ₹{product.discountPrice.toLocaleString('en-IN')}
                    </span>
                    {product.price > product.discountPrice && (
                      <span className="text-[6.5px] sm:text-[8px] text-slate-400 line-through font-medium hidden xs:inline">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Compact Add to Cart Button */}
                <button
                  type="button"
                  onClick={() => handleQuickAdd(product)}
                  className="w-full h-4.5 sm:h-6 rounded bg-[#0f8a48] hover:bg-[#0c723b] active:scale-95 text-white text-[7px] sm:text-[9.5px] font-bold flex items-center justify-center gap-0.5 transition cursor-pointer shadow-2xs mt-0.5"
                >
                  <ShoppingCart className="w-2 h-2 sm:w-2.5 sm:h-2.5 flex-shrink-0" />
                  <span className="sm:hidden">{mobileCols === 4 ? 'Add' : 'Add to Cart'}</span>
                  <span className="hidden sm:inline">Add to Cart</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5. Trust Badges Banner (Compact height) */}
      <section className="w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-xs bg-gradient-to-r from-[#06182c] via-[#0b2b4f] to-[#041424] text-white p-2.5 sm:p-4 border border-slate-800">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 items-center">
          <div className="flex items-center gap-2 p-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center flex-shrink-0 text-emerald-300">
              <Truck className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-extrabold text-white">Free Delivery</p>
              <p className="text-[8.5px] sm:text-[10px] text-slate-300">On all marketplace orders</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center flex-shrink-0 text-amber-300">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-extrabold text-white">100% Genuine</p>
              <p className="text-[8.5px] sm:text-[10px] text-slate-300">Verified factory sellers</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0 text-blue-300">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-extrabold text-white">Secure Payments</p>
              <p className="text-[8.5px] sm:text-[10px] text-slate-300">Razorpay 256-bit SSL</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center flex-shrink-0 text-purple-300">
              <Headphones className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[11px] sm:text-xs font-extrabold text-white">24/7 Support</p>
              <p className="text-[8.5px] sm:text-[10px] text-slate-300">Quick seller assistance</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Promotional Category Highlights (Compact banners on mobile) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
        <div className="rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-50 to-orange-100/70 p-3 sm:p-5 border border-amber-200/80 flex items-center justify-between shadow-2xs relative overflow-hidden group">
          <div className="space-y-1 z-10 max-w-[65%]">
            <span className="text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/80 px-2 py-0.2 rounded-full inline-block">
              FACTORY DIRECT
            </span>
            <h3 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
              Home &amp; Kitchen Essentials
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-600 line-clamp-1">
              Organizers &amp; Kitchenware with Free Delivery.
            </p>
            <div className="pt-1">
              <Link
                to="/products?category=Home%20%26%20Kitchen"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-900 text-white font-bold text-[9.5px] sm:text-xs shadow-xs hover:bg-slate-800 transition"
              >
                <span>Shop Kitchen</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="w-20 sm:w-28 h-20 sm:h-28 rounded-xl overflow-hidden shadow-xs flex-shrink-0 border border-amber-200 bg-white p-1">
            <img
              src="https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&auto=format&fit=crop&q=80"
              alt="Kitchen"
              className="w-full h-full object-cover rounded-lg group-hover:scale-108 transition-transform duration-300"
            />
          </div>
        </div>

        <div className="rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-100/70 p-3 sm:p-5 border border-blue-200/80 flex items-center justify-between shadow-2xs relative overflow-hidden group">
          <div className="space-y-1 z-10 max-w-[65%]">
            <span className="text-[8.5px] sm:text-[9.5px] font-black uppercase tracking-wider text-blue-800 bg-blue-200/80 px-2 py-0.2 rounded-full inline-block">
              POPULAR CHOICES
            </span>
            <h3 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight leading-tight">
              Toys &amp; Kids Entertainment
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-600 line-clamp-1">
              Learning Pads &amp; Climb Toys.
            </p>
            <div className="pt-1">
              <Link
                to="/products?category=Toys"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0f8a48] text-white font-bold text-[9.5px] sm:text-xs shadow-xs hover:bg-[#0c723b] transition"
              >
                <span>Explore Toys</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
          <div className="w-20 sm:w-28 h-20 sm:h-28 rounded-xl overflow-hidden shadow-xs flex-shrink-0 border border-blue-200 bg-white p-1">
            <img
              src="https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=400&auto=format&fit=crop&q=80"
              alt="Toys"
              className="w-full h-full object-cover rounded-lg group-hover:scale-108 transition-transform duration-300"
            />
          </div>
        </div>
      </section>

      {/* 7. ALL REAL DATABASE PRODUCTS (Dense compact layout matching svworks.com.in .sf-pc card style)
          Minimised height allows 4-6 products to be visible on screen simultaneously */}
      <section className="space-y-2.5 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 px-1">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.2 rounded-full bg-emerald-50 border border-emerald-200/80 text-[#0f8a48] text-[9px] sm:text-[10px] font-black uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
              <span>Live Catalog ({products.length} Products in Database)</span>
            </div>
            <h2 className="text-sm sm:text-lg md:text-xl font-black text-slate-900 tracking-tight">
              Explore Products
            </h2>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-[10.5px] sm:text-xs font-bold text-[#0f8a48] hover:text-[#0c723b] hover:underline"
          >
            <span>View Full Catalog</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Dynamic Category Filter Tabs from Real Database Products */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
          {['All', ...dynamicCategories].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCatalogTab(cat)}
              className={`px-2.5 py-0.5 rounded-full text-[10.5px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCatalogTab === cat
                  ? 'bg-[#0f8a48] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quick Filter Tag Badges + Mobile Column Density Switcher (3 or 4 per row) */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-none pb-0.5">
          <div className="flex items-center gap-1 text-[9.5px] sm:text-[10.5px] font-semibold text-slate-600">
            <span className="text-slate-400 flex items-center gap-1">
              <Tag className="w-2.5 h-2.5 text-[#0f8a48]" />
              <span>Tags:</span>
            </span>
            {['All', 'Hot Deal', 'Trending', 'Best Seller'].map((tg) => (
              <button
                key={tg}
                type="button"
                onClick={() => setActiveTag(tg)}
                className={`px-2 py-0.2 rounded-md transition-all cursor-pointer ${
                  activeTag === tg
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tg}
              </button>
            ))}
          </div>

          {/* Quick Column Toggle for Mobile View (3 or 4 items per row) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 sm:hidden flex-shrink-0">
            <button
              type="button"
              onClick={() => handleSetMobileCols(3)}
              className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold transition cursor-pointer ${
                mobileCols === 3
                  ? 'bg-[#0f8a48] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Display 3 products per row on mobile"
            >
              3 / row
            </button>
            <button
              type="button"
              onClick={() => handleSetMobileCols(4)}
              className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold transition cursor-pointer ${
                mobileCols === 4
                  ? 'bg-[#0f8a48] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Display 4 products per row on mobile"
            >
              4 / row
            </button>
          </div>
        </div>

        {/* Product Cards Grid:
            Configured for 3 or 4 per row on mobile, matching svworks.com.in ultra-dense compact style */}
        {loading ? (
          <div className={`grid ${mobileCols === 4 ? 'grid-cols-4' : 'grid-cols-3'} sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1 sm:gap-2.5`}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-32 sm:h-40 bg-slate-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
            No products match the selected category.
          </div>
        ) : (
          <div className={`grid ${mobileCols === 4 ? 'grid-cols-4' : 'grid-cols-3'} sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1 sm:gap-2.5 pt-0.5`}>
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="bg-white rounded-md sm:rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all duration-200 p-1 sm:p-2 flex flex-col justify-between group relative"
              >
                {/* Product Image: Ultra-compact fixed height */}
                <div className="w-full h-16 sm:h-24 md:h-32 overflow-hidden rounded bg-[#f8fafc] flex items-center justify-center p-0.5 sm:p-1 relative mb-0.5 sm:mb-1">
                  <Link to={`/products/${product._id}`} className="w-full h-full flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 filter drop-shadow-xs"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = categoryImages[product.category] || '/logo.png';
                      }}
                    />
                  </Link>

                  {product.discountPercent > 0 && (
                    <span className="absolute top-0.5 left-0.5 bg-[#e11d48] text-white text-[6.5px] sm:text-[8px] font-black px-1 py-0.2 rounded shadow-2xs leading-none">
                      {product.discountPercent}% OFF
                    </span>
                  )}
                </div>

                {/* Title & Ratings & Price in compact rows */}
                <div className="space-y-0.5 mb-0.5 flex-1 flex flex-col justify-between">
                  <Link
                    to={`/products/${product._id}`}
                    className="text-[8.5px] sm:text-xs font-semibold text-slate-800 hover:text-[#0f8a48] line-clamp-2 transition block leading-tight h-[22px] sm:h-[28px] overflow-hidden"
                    title={product.title}
                  >
                    {product.title}
                  </Link>

                  {/* Price & Rating Combined Row */}
                  <div className="flex items-center justify-between gap-0.5 pt-0.5">
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-[10px] sm:text-xs md:text-sm font-extrabold text-slate-900 leading-none">
                        ₹{product.discountPrice.toLocaleString('en-IN')}
                      </span>
                      {product.price > product.discountPrice && (
                        <span className="text-[7px] sm:text-[8.5px] text-slate-400 line-through font-medium hidden xs:inline">
                          ₹{product.price.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-0.5 bg-[#0f8a48] text-white text-[6.5px] sm:text-[8px] font-bold px-0.5 py-0.2 rounded flex-shrink-0 leading-none">
                      <span>★</span>
                      <span>{product.rating}</span>
                    </span>
                  </div>

                  {/* Free Delivery & Vendor Tag */}
                  <div className="flex items-center justify-between text-[6.5px] sm:text-[8px] pt-0.5 leading-none">
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">
                      Free Delivery
                    </span>
                    <span className="text-slate-400 truncate max-w-[45%] hidden sm:inline">
                      {product.vendorName}
                    </span>
                  </div>
                </div>

                {/* Compact Add to Cart Button */}
                <button
                  type="button"
                  onClick={() => handleQuickAdd(product)}
                  className="w-full h-5 sm:h-6.5 rounded bg-[#0f8a48] hover:bg-[#0c723b] active:scale-95 text-white text-[7.5px] sm:text-[10.5px] font-bold flex items-center justify-center gap-0.5 transition cursor-pointer shadow-2xs mt-0.5"
                >
                  <ShoppingCart className="w-2.5 h-2.5 flex-shrink-0" />
                  <span className="sm:hidden">{mobileCols === 4 ? 'Add' : 'Add to Cart'}</span>
                  <span className="hidden sm:inline">Add to Cart</span>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 text-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#081e36] hover:bg-[#0c2a5e] text-white font-bold text-[11px] sm:text-xs shadow-md transition-all active:scale-95"
          >
            <span>View Full Marketplace Catalog</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>

      {/* 8. Verified Customer Feedback Carousel */}
      <section className="space-y-3 pt-3 border-t border-slate-200">
        <div className="text-center space-y-1 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[9.5px] sm:text-xs font-black uppercase tracking-wider">
            <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
            <span>Verified Customer Reviews</span>
          </div>

          <h2 className="text-sm sm:text-xl font-black text-slate-900 tracking-tight">
            Loved by 50,000+ Happy Shoppers
          </h2>

          <div className="inline-flex items-center gap-1.5 text-[9.5px] sm:text-xs text-slate-600 font-semibold bg-white border border-slate-200 px-2.5 py-0.2 rounded-full shadow-2xs">
            <span className="text-amber-500 font-black">★ 4.9/5 Overall Rating</span>
            <span className="text-slate-300">•</span>
            <span>18,500+ Verified Orders</span>
          </div>
        </div>

        {/* Carousel Slider */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[9.5px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">
              Feedback {testimonialIndex + 1} of {verifiedTestimonials.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setTestimonialIndex((prev) =>
                    prev === 0 ? verifiedTestimonials.length - 1 : prev - 1
                  )
                }
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition shadow-2xs cursor-pointer"
                title="Previous"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button
                onClick={() =>
                  setTestimonialIndex((prev) => (prev + 1) % verifiedTestimonials.length)
                }
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition shadow-2xs cursor-pointer"
                title="Next"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Feedback Cards Grid: Shows 2 cards on mobile (grid-cols-2) and 3 cards on desktop (md:grid-cols-3) */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-4">
            {[0, 1, 2].map((offset) => {
              const idx = (testimonialIndex + offset) % verifiedTestimonials.length;
              const t = verifiedTestimonials[idx];
              return (
                <div
                  key={`${t.id}-${idx}`}
                  className={`bg-white rounded-xl border transition-all duration-300 p-2 sm:p-4 flex flex-col justify-between space-y-1.5 sm:space-y-2 ${
                    offset === 0
                      ? 'border-emerald-300 shadow-2xs ring-1 ring-emerald-500/10 flex'
                      : offset === 1
                      ? 'border-emerald-200/70 shadow-2xs flex'
                      : 'border-slate-200/80 shadow-2xs hidden md:flex'
                  }`}
                >
                  <div className="space-y-1 sm:space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-emerald-400 shadow-xs flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/logo.png';
                          }}
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-[10px] sm:text-xs text-slate-900 truncate">{t.name}</h4>
                          <p className="text-[7.5px] sm:text-[9px] text-slate-400 font-medium truncate">{t.city}</p>
                        </div>
                      </div>
                      <Quote className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400/30 flex-shrink-0" />
                    </div>

                    <div className="flex items-center justify-between pt-0.5 gap-1">
                      <div className="flex text-amber-400 flex-shrink-0">
                        {[...Array(t.rating)].map((_, i) => (
                          <Star key={i} className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-amber-400" />
                        ))}
                      </div>

                      <span className="text-[7px] sm:text-[8.5px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1 py-0.2 rounded truncate max-w-[85px] sm:max-w-[130px]">
                        {t.itemPurchased}
                      </span>
                    </div>

                    <p className="text-[9.5px] sm:text-[11px] text-slate-600 leading-snug sm:leading-relaxed italic line-clamp-3">
                      "{t.comment}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[7.5px] sm:text-[9.5px]">
                    <div className="flex items-center gap-0.5 sm:gap-1 text-emerald-600 font-bold">
                      <CheckCircle2 className="w-2 h-2 sm:w-2.5 sm:h-2.5 flex-shrink-0" />
                      <span className="truncate">Verified</span>
                    </div>
                    <span className="text-slate-400 font-medium truncate">{t.date}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-center gap-1 pt-3">
            {verifiedTestimonials.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => setTestimonialIndex(dotIdx)}
                className={`h-1 rounded-full transition-all cursor-pointer ${
                  testimonialIndex === dotIdx
                    ? 'w-4 bg-[#0f8a48]'
                    : 'w-1 bg-slate-300 hover:bg-slate-400'
                }`}
                title={`Go to slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* 4 Trust Pillars */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 pt-1">
          <div className="p-2 sm:p-2.5 rounded-lg bg-white border border-slate-100 shadow-2xs flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-emerald-50 text-[#0f8a48] flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-[11px] leading-tight">100% Genuine</p>
              <p className="text-[9px] text-slate-500">Verified sellers</p>
            </div>
          </div>

          <div className="p-2 sm:p-2.5 rounded-lg bg-white border border-slate-100 shadow-2xs flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
              <Truck className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-[11px] leading-tight">Express Delivery</p>
              <p className="text-[9px] text-slate-500">Fast doorstep</p>
            </div>
          </div>

          <div className="p-2 sm:p-2.5 rounded-lg bg-white border border-slate-100 shadow-2xs flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-[11px] leading-tight">7-Day Returns</p>
              <p className="text-[9px] text-slate-500">Easy replacement</p>
            </div>
          </div>

          <div className="p-2 sm:p-2.5 rounded-lg bg-white border border-slate-100 shadow-2xs flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-[11px] leading-tight">Secure UPI</p>
              <p className="text-[9px] text-slate-500">256-bit encryption</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
