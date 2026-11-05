import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Heart,
  Package,
  User,
  Menu,
  X,
  ChevronDown,
  Flame,
  LayoutGrid,
  LogOut,
  Store,
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const getUserInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || 'U').slice(0, 2).toUpperCase();
};

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount, wishlistCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleQuickSearch = (keyword) => {
    setSearchQuery(keyword);
    navigate(`/products?keyword=${encodeURIComponent(keyword)}`);
  };

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#051527] text-white shadow-lg select-none w-full">
      {/* 1. Main Navigation Bar */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-3 sm:gap-6 md:gap-8 min-h-[46px]">
          
          {/* Left: Mobile Hamburger / Desktop Logo */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 z-20">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-white md:hidden rounded-lg hover:bg-white/10 active:scale-95 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Desktop Brand Logo */}
            <div className="hidden md:flex items-center flex-shrink-0">
              <Logo theme="dark" variant="brand" size="md" showTagline={false} />
            </div>
          </div>

          {/* Mobile Centered Brand Logo (Big, Centered on mobile) */}
          <div className="absolute left-1/2 -translate-x-1/2 md:hidden flex items-center justify-center z-10 pointer-events-auto">
            <Logo theme="dark" variant="brand" size="lg" showTagline={false} />
          </div>

          {/* Center: Search Bar with Full Flexible Width covering empty spaces */}
          <div className="hidden md:flex flex-col flex-1 px-4 lg:px-8">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center w-full">
              <input
                type="text"
                placeholder="Search for products, brands and vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-24 py-2.5 bg-white text-slate-900 rounded-full text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f8a48] transition shadow-xs font-medium"
              />
              <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 px-5 bg-[#0f8a48] hover:bg-[#0c723b] text-white rounded-full text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-xs"
              >
                <span>Search</span>
              </button>
            </form>

            {/* Popular quick searches aligned directly below the search bar */}
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300 overflow-hidden whitespace-nowrap pl-3">
              <span className="font-bold text-amber-300">Popular:</span>
              {['Smartphones', "Men's Shirts", 'Air Fryer', 'Skincare', 'Sports Shoes', 'Laptops', 'Festive Sarees'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickSearch(tag)}
                  className="hover:text-emerald-300 hover:underline cursor-pointer transition text-slate-300 mr-2"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
            {/* Products link */}
            <Link
              to="/products"
              className="hidden lg:flex flex-col items-center text-slate-200 hover:text-emerald-400 transition group text-center cursor-pointer"
            >
              <Package className="w-5 h-5 text-slate-300 group-hover:text-emerald-400 transition" />
              <span className="text-[11px] font-semibold mt-0.5 leading-none">Products</span>
            </Link>

            {/* Stores link */}
            <Link
              to="/stores"
              className="hidden lg:flex flex-col items-center text-slate-200 hover:text-emerald-400 transition group text-center cursor-pointer"
            >
              <Store className="w-5 h-5 text-slate-300 group-hover:text-emerald-400 transition" />
              <span className="text-[11px] font-semibold mt-0.5 leading-none">Stores</span>
            </Link>

            {/* Shopping Cart */}
            <Link
              to="/cart"
              className="p-1.5 rounded-full hover:bg-white/10 text-white transition cursor-pointer relative"
              aria-label="Shopping Cart"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5.5 h-5.5 stroke-[1.9]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#e11d48] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-[#051527] shadow-xs">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth Buttons / User Dropdown */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:bg-white/10 transition cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    {getUserInitials(user?.name)}
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-300 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-bold text-slate-900 truncate">{user?.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-emerald-50 hover:text-[#0f8a48] transition"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>My Profile</span>
                    </Link>

                    <Link
                      to="/my-orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-emerald-50 hover:text-[#0f8a48] transition"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>My Orders</span>
                    </Link>

                    <Link
                      to="/wishlist"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center justify-between px-4 py-2 text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <Heart className="w-3.5 h-3.5" />
                        <span>Wishlist</span>
                      </div>
                      {wishlistCount > 0 && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          {wishlistCount}
                        </span>
                      )}
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 transition cursor-pointer font-medium border-t border-slate-100 mt-1"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white hover:text-emerald-400 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4.5 py-1.5 rounded-full text-xs font-bold bg-[#0f8a48] hover:bg-[#0c723b] text-white transition shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Input Row */}
        <div className="pt-2 pb-1 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search for products, brands and vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-20 py-2 bg-white text-slate-900 rounded-full text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f8a48] shadow-sm transition font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-3 bg-[#0f8a48] text-white text-[11px] font-black rounded-full"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* 2. Desktop Sub-Navbar: Expanded evenly across the entire screen */}
      <div className="hidden md:block bg-[#020b14] border-t border-slate-800/80 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="w-full flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center justify-between flex-1 pr-8 gap-4 lg:gap-6 overflow-x-auto scrollbar-none">
            <Link to="/products" className="hover:text-emerald-400 transition flex items-center gap-1.5 text-white whitespace-nowrap">
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
              <span>All Products</span>
            </Link>
            <Link to="/stores" className="hover:text-emerald-400 transition flex items-center gap-1.5 text-white whitespace-nowrap">
              <Store className="w-3.5 h-3.5 text-blue-400" />
              <span>Featured Vendors</span>
            </Link>
            <Link to="/products?category=Electronics" className="text-slate-300 hover:text-emerald-400 transition whitespace-nowrap">
              Mobiles &amp; Accessories
            </Link>
            <Link to="/products?category=Fashion" className="text-slate-300 hover:text-emerald-400 transition whitespace-nowrap">
              Fashion &amp; Apparel
            </Link>
            <Link to="/products?category=Footwear" className="text-slate-300 hover:text-emerald-400 transition whitespace-nowrap">
              Footwear
            </Link>
            <Link to="/products?category=Home & Kitchen" className="text-slate-300 hover:text-emerald-400 transition whitespace-nowrap">
              Home &amp; Kitchen
            </Link>
            <Link to="/products?category=Beauty" className="text-slate-300 hover:text-emerald-400 transition whitespace-nowrap">
              Beauty &amp; Personal Care
            </Link>
            <Link to="/products?category=Grocery" className="text-slate-300 hover:text-emerald-400 transition whitespace-nowrap">
              Grocery &amp; Gourmet
            </Link>
            <Link to="/vendor/pricing" className="text-slate-300 hover:text-emerald-400 transition whitespace-nowrap">
              Sell on Amezon
            </Link>
          </div>

          <div className="flex items-center gap-4 flex-shrink-0 border-l border-slate-800 pl-4">
            <Link
              to="/products"
              className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 transition font-bold whitespace-nowrap"
            >
              <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Top Deals</span>
            </Link>
            <Link
              to="/stores"
              className="px-4 py-1 rounded-full bg-[#0f8a48] hover:bg-[#0c723b] text-white font-bold transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Browse Stores</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm bg-white text-slate-900 h-full overflow-y-auto p-5 shadow-2xl z-10 flex flex-col justify-between animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <Logo theme="light" variant="brand" size="sm" showTagline={false} />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1 text-sm font-semibold text-slate-700">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition"
                >
                  <span className="w-7 h-7 rounded-lg bg-emerald-50 text-[#0f8a48] flex items-center justify-center">
                    <Package className="w-4 h-4" />
                  </span>
                  <span>Home</span>
                </Link>

                <Link
                  to="/products"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition"
                >
                  <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4" />
                  </span>
                  <span>All Products</span>
                </Link>

                <Link
                  to="/stores"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition"
                >
                  <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </span>
                  <span>Browse Stores</span>
                </Link>

                <Link
                  to="/cart"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4" />
                    </span>
                    <span>Shopping Cart</span>
                  </div>
                  {cartCount > 0 && (
                    <span className="text-xs font-bold bg-[#e11d48] text-white px-2 py-0.5 rounded-full">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {isAuthenticated && (
                  <Link
                    to="/my-orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition"
                  >
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </span>
                    <span>My Orders</span>
                  </Link>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 text-center rounded-xl border border-slate-200 text-xs font-bold text-slate-700"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 text-center rounded-xl bg-[#0f8a48] text-white text-xs font-bold"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
