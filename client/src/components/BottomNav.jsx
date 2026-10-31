import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  LayoutGrid,
  Heart,
  User,
  MoreHorizontal,
  X,
  Store,
  Truck,
  Flame,
  Phone,
  Info,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { wishlistCount } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const [categoriesDrawerOpen, setCategoriesDrawerOpen] = useState(false);

  const currentPath = location.pathname;

  const isHomeActive = currentPath === '/';
  const isWishlistActive = currentPath === '/wishlist';
  const isAccountActive = currentPath === '/profile' || currentPath === '/login' || currentPath === '/register';
  const isCategoriesActive = currentPath.includes('/products') || categoriesDrawerOpen;

  const categoriesList = [
    { name: 'Mobiles & Accessories', query: 'Electronics', color: 'bg-blue-50 text-blue-600' },
    { name: "Men's Fashion", query: 'Fashion', color: 'bg-indigo-50 text-indigo-600' },
    { name: "Women's Fashion", query: 'Fashion', color: 'bg-rose-50 text-rose-600' },
    { name: 'Footwear & Sports', query: 'Footwear', color: 'bg-emerald-50 text-emerald-600' },
    { name: 'Home & Kitchen', query: 'Home & Kitchen', color: 'bg-amber-50 text-amber-600' },
    { name: 'Beauty & Personal Care', query: 'Beauty', color: 'bg-pink-50 text-pink-600' },
    { name: 'Electronics & Laptops', query: 'Electronics', color: 'bg-sky-50 text-sky-600' },
    { name: 'Groceries & Essentials', query: 'Grocery', color: 'bg-green-50 text-green-600' },
  ];

  const handleCategoryClick = (query) => {
    setCategoriesDrawerOpen(false);
    navigate(`/products?category=${encodeURIComponent(query)}`);
  };

  return (
    <>
      {/* Fixed Bottom Bar on Mobile/Tablet */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.07)] md:hidden transition-all"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1 max-w-lg mx-auto">
          {/* 1. HOME */}
          <Link
            to="/"
            className={`flex flex-col items-center justify-center py-1 transition-all ${
              isHomeActive ? 'text-[#0f8a48] font-bold scale-105' : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <Home className={`w-5 h-5 transition-transform duration-200 ${isHomeActive ? 'stroke-[2.5]' : ''}`} />
              {isHomeActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#0f8a48] rounded-full" />
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">Home</span>
          </Link>

          {/* 2. CATEGORIES */}
          <button
            type="button"
            onClick={() => setCategoriesDrawerOpen(true)}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              isCategoriesActive ? 'text-[#0f8a48] font-bold scale-105' : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <LayoutGrid className={`w-5 h-5 transition-transform duration-200 ${isCategoriesActive ? 'stroke-[2.5]' : ''}`} />
              {isCategoriesActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#0f8a48] rounded-full" />
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">Categories</span>
          </button>

          {/* 3. WISHLIST */}
          <Link
            to="/wishlist"
            className={`flex flex-col items-center justify-center py-1 transition-all relative ${
              isWishlistActive ? 'text-[#0f8a48] font-bold scale-105' : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <Heart className={`w-5 h-5 transition-transform duration-200 ${isWishlistActive ? 'stroke-[2.5] fill-[#0f8a48]/20' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
              {isWishlistActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#0f8a48] rounded-full" />
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">Wishlist</span>
          </Link>

          {/* 4. ACCOUNT */}
          <Link
            to={isAuthenticated ? '/profile' : '/login'}
            className={`flex flex-col items-center justify-center py-1 transition-all ${
              isAccountActive ? 'text-[#0f8a48] font-bold scale-105' : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <User className={`w-5 h-5 transition-transform duration-200 ${isAccountActive ? 'stroke-[2.5]' : ''}`} />
              {isAccountActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#0f8a48] rounded-full" />
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">Account</span>
          </Link>

          {/* 5. MORE */}
          <button
            type="button"
            onClick={() => setMoreDrawerOpen(true)}
            className={`flex flex-col items-center justify-center py-1 transition-all cursor-pointer ${
              moreDrawerOpen ? 'text-[#0f8a48] font-bold scale-105' : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
          >
            <div className="relative">
              <MoreHorizontal className="w-5 h-5" />
              {moreDrawerOpen && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#0f8a48] rounded-full" />
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* Categories Slide-Up Bottom Sheet */}
      {categoriesDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setCategoriesDrawerOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-[#0f8a48]" />
                <h3 className="text-base font-black text-slate-900">Explore All Categories</h3>
              </div>
              <button
                onClick={() => setCategoriesDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              {categoriesList.map((cat, i) => (
                <button
                  key={i}
                  onClick={() => handleCategoryClick(cat.query)}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 transition text-left cursor-pointer group"
                >
                  <span className={`w-9 h-9 rounded-xl ${cat.color} flex items-center justify-center font-bold text-sm shadow-2xs`}>
                    {cat.name[0]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-[#0f8a48] line-clamp-1">{cat.name}</p>
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      Explore <ChevronRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setCategoriesDrawerOpen(false);
                navigate('/products');
              }}
              className="w-full mt-5 py-3 rounded-xl bg-[#0f8a48] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs"
            >
              <span>View All Products in Catalog</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* "More" Slide-Up Bottom Sheet */}
      {moreDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMoreDrawerOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-8 shadow-2xl z-10 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">More Features &amp; Links</h3>
              <button
                onClick={() => setMoreDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 mt-3">
              <Link
                to="/stores"
                onClick={() => setMoreDrawerOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0f8a48] flex items-center justify-center">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Official Stores</p>
                    <p className="text-[11px] text-slate-400">Browse verified merchants &amp; vendors</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/products"
                onClick={() => setMoreDrawerOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Top Deals &amp; Discounts</p>
                    <p className="text-[11px] text-slate-400">Save up to 50% on trending items</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/track-order"
                onClick={() => setMoreDrawerOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Track Order</p>
                    <p className="text-[11px] text-slate-400">Real-time status of your shipments</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/vendor/register"
                onClick={() => setMoreDrawerOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-xs my-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">Join Today &amp; Earn ₹1000</p>
                    <p className="text-[11px] text-emerald-100">Become a certified seller partner</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white" />
              </Link>

              <Link
                to="/contact"
                onClick={() => setMoreDrawerOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">24x7 Customer Support</p>
                    <p className="text-[11px] text-slate-400">Help center, call &amp; instant chat</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/about"
                onClick={() => setMoreDrawerOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">About RS Marketplace</p>
                    <p className="text-[11px] text-slate-400">Our story, vision &amp; verified merchants</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>

            {isAuthenticated ? (
              <div className="pt-3 border-t border-slate-100 mt-3">
                <button
                  onClick={() => {
                    logout();
                    setMoreDrawerOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out ({user?.name || 'Account'})</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 mt-3">
                <Link
                  to="/login"
                  onClick={() => setMoreDrawerOpen(false)}
                  className="py-2.5 text-center bg-[#0c2340] text-white rounded-xl font-bold text-xs shadow-xs"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMoreDrawerOpen(false)}
                  className="py-2.5 text-center border border-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNav;

