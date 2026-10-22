import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Heart,
  Package,
  Info,
  Phone,
  User,
  UserPlus,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Flame,
  Star,
  Laptop,
  Armchair,
  ShoppingBasket,
  Shirt,
  LayoutGrid,
  LogOut,
  Store,
  ShieldCheck,
  Truck,
  Settings,
  Wallet,
} from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const isRealAvatar = (avatar) => {
  if (!avatar || typeof avatar !== 'string') return false;
  if (avatar.includes('images.unsplash.com')) return false;
  return true;
};

const getUserInitials = (name) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || 'U').slice(0, 2).toUpperCase();
};

const Navbar = () => {
  const { user, isAuthenticated, logout, isAdmin, isVendor } = useAuth();
  const { cartCount, wishlistCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriesOpen, setCategoriesOpen] = useState(false);
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs select-none transition-all">
      {/* 2. Main Navigation Header - Full Width */}
      <div className="w-full px-4 sm:px-6 lg:px-10 2xl:px-14 py-3">
        <div className="flex items-center justify-between gap-4 lg:gap-8">
          {/* Brand Logo - Amezon.online */}
          <div className="flex-shrink-0">
            <Logo variant="marketplace" />
          </div>

          {/* Centered Search Bar with Popular Queries */}
          <div className="hidden md:flex flex-col flex-1 max-w-xl lg:max-w-2xl 2xl:max-w-3xl">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search products, brands, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-2.5 bg-white border border-slate-300 rounded-lg text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] focus:border-transparent transition shadow-2xs"
              />
              <button
                type="submit"
                className="group absolute right-1 top-1 bottom-1 px-3.5 bg-[#0c2a5e] hover:bg-[#153e85] text-white rounded-md flex items-center justify-center transition cursor-pointer"
                aria-label="Search"
              >
                <Search className="w-4 h-4 transition-transform duration-200 group-hover:scale-115" />
              </button>
            </form>

            {/* Popular Search Suggestions Underneath */}
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 overflow-hidden whitespace-nowrap">
              <span className="font-bold text-slate-600">Popular:</span>
              {['Samsung TV', 'Sofa Set', 'Rice 5kg', 'Laptop', 'Refrigerator'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickSearch(tag)}
                  className="hover:text-[#0c2a5e] hover:underline cursor-pointer transition text-slate-500 mr-1.5"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Right Action Icons with lively micro-animations */}
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              to="/products"
              className="hidden lg:flex flex-col items-center text-slate-700 hover:text-[#0c2a5e] transition group text-center"
            >
              <Package className="w-5 h-5 text-slate-600 group-hover:text-[#0c2a5e] group-hover:scale-120 group-hover:-translate-y-0.5 transition-all duration-200" />
              <span className="text-xs font-semibold mt-1">Products</span>
            </Link>

            <Link
              to="/stores"
              className="hidden lg:flex flex-col items-center text-slate-700 hover:text-[#0c2a5e] transition group text-center"
            >
              <Store className="w-5 h-5 text-slate-600 group-hover:text-[#0c2a5e] group-hover:scale-120 group-hover:-translate-y-0.5 transition-all duration-200" />
              <span className="text-xs font-semibold mt-1">Stores</span>
            </Link>

            {isVendor && (
              <Link
                to="/vendor/dashboard"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs shadow-2xs hover:brightness-105 transition"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Vendor Hub</span>
              </Link>
            )}

            <Link
              to="/about"
              className="hidden xl:flex flex-col items-center text-slate-700 hover:text-[#0c2a5e] transition group text-center"
            >
              <Info className="w-5 h-5 text-slate-600 group-hover:text-[#0c2a5e] group-hover:scale-120 group-hover:-translate-y-0.5 transition-all duration-200" />
              <span className="text-xs font-semibold mt-1">About</span>
            </Link>

            <Link
              to="/contact"
              className="hidden xl:flex flex-col items-center text-slate-700 hover:text-[#0c2a5e] transition group text-center"
            >
              <Phone className="w-5 h-5 text-slate-600 group-hover:text-[#0c2a5e] group-hover:scale-120 group-hover:-translate-y-0.5 transition-all duration-200" />
              <span className="text-xs font-semibold mt-1">Contact</span>
            </Link>

            <Link
              to="/wishlist"
              className="hidden sm:flex flex-col items-center text-slate-700 hover:text-[#0c2a5e] transition group text-center relative"
              title="My Wishlist"
            >
              <div className="relative">
                <Heart className="w-5 h-5 text-slate-600 group-hover:text-rose-500 group-hover:scale-125 group-hover:-translate-y-0.5 transition-all duration-200" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse shadow-2xs">
                    {wishlistCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold mt-1">Wishlist</span>
            </Link>

            {/* Cart Pill Button - Amezon Navy Blue with golden badge & micro-animation */}
            <Link
              to="/cart"
              className="group flex items-center gap-2 px-4.5 py-2.5 bg-[#0c2a5e] hover:bg-[#153e85] text-white rounded-full font-bold text-sm shadow-xs transition active:scale-95"
            >
              <ShoppingCart className="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-115 group-hover:-rotate-6" />
              <span>Cart</span>
              {cartCount > 0 && (
                <span className="bg-[#f59e0b] text-slate-950 text-xs font-black w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Auth Dropdown or Sign In / Register Buttons */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  id="user-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
                  aria-expanded={userDropdownOpen}
                >
                  {isRealAvatar(user?.avatar) ? (
                    <img
                      src={user.avatar}
                      alt={user?.name || 'User'}
                      className="w-8 h-8 rounded-full object-cover border border-slate-300 shadow-2xs"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0c2a5e] to-[#1a4b9c] text-white flex items-center justify-center font-black text-xs tracking-wider shadow-2xs border border-[#143d82]">
                      {getUserInitials(user?.name)}
                    </div>
                  )}
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs">
                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2.5">
                      {isRealAvatar(user?.avatar) ? (
                        <img
                          src={user.avatar}
                          alt={user?.name || 'User'}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-xs flex-shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0c2a5e] to-[#1a4b9c] text-white flex items-center justify-center font-black text-xs tracking-wider shadow-xs border border-[#143d82] flex-shrink-0">
                          {getUserInitials(user?.name)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 truncate">{user?.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                        <span className="inline-block mt-0.5 font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-[#0c2a5e] text-[10px]">
                          {user?.role}
                        </span>
                      </div>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="group flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-[#0c2a5e] transition"
                    >
                      <User className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0c2a5e] transition" />
                      <span className="font-medium">My Profile &amp; Portal</span>
                    </Link>

                    <Link
                      to="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="group flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-[#0c2a5e] transition"
                    >
                      <Package className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0c2a5e] transition" />
                      <span className="font-medium">My Orders</span>
                    </Link>

                    <Link
                      to="/track-order"
                      onClick={() => setUserDropdownOpen(false)}
                      className="group flex items-center justify-between px-4 py-2 text-slate-700 hover:bg-blue-50 hover:text-[#0c2a5e] transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <Truck className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0c2a5e] transition" />
                        <span className="font-medium">Track Order</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </Link>

                    <Link
                      to="/profile?tab=referrals"
                      onClick={() => setUserDropdownOpen(false)}
                      className="group flex items-center justify-between px-4 py-2 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <Wallet className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition" />
                        <span className="font-medium">Wallet &amp; Referrals</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">
                        ₹{(user?.walletBalance || 0).toLocaleString('en-IN')}
                      </span>
                    </Link>

                    <Link
                      to="/wishlist"
                      onClick={() => setUserDropdownOpen(false)}
                      className="group flex items-center justify-between px-4 py-2 text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <Heart className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-500 transition" />
                        <span className="font-medium">My Wishlist</span>
                      </div>
                      {wishlistCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 font-bold text-[10px] rounded-full">
                          {wishlistCount}
                        </span>
                      )}
                    </Link>

                    <Link
                      to="/profile?tab=settings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="group flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-[#0c2a5e] transition"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0c2a5e] transition" />
                      <span className="font-medium">Account Settings</span>
                    </Link>

                    {isVendor && (
                      <Link
                        to="/vendor/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="group flex items-center gap-2.5 px-4 py-2 text-emerald-700 font-semibold hover:bg-emerald-50 transition"
                      >
                        <Store className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition" />
                        <span>Vendor Panel</span>
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="group flex items-center gap-2.5 px-4 py-2 text-[#0c2a5e] font-semibold hover:bg-blue-50 transition"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0c2a5e] group-hover:scale-110 transition" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="group w-full flex items-center gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 transition cursor-pointer font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="hidden sm:flex flex-col items-center text-slate-700 hover:text-[#0c2a5e] transition group text-center"
                >
                  <User className="w-5 h-5 text-slate-600 group-hover:text-[#0c2a5e] group-hover:scale-120 transition-all" />
                  <span className="text-xs font-semibold mt-1">Sign In</span>
                </Link>

                <Link
                  to="/register"
                  className="hidden sm:flex flex-col items-center text-slate-700 hover:text-[#0c2a5e] transition group text-center"
                >
                  <UserPlus className="w-5 h-5 text-slate-600 group-hover:text-[#0c2a5e] group-hover:scale-120 transition-all" />
                  <span className="text-xs font-semibold mt-1">Register</span>
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 md:hidden rounded-lg hover:bg-slate-100 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-slate-800" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="pt-2 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 p-1" aria-label="Search">
              <Search className="w-4 h-4 text-slate-500" />
            </button>
          </form>
        </div>
      </div>

      {/* 3. Sub-Navigation Bar - Full Width with Animated React Icons */}
      <div className="bg-white border-t border-slate-200/90 py-2 px-4 sm:px-6 lg:px-10 2xl:px-14">
        <div className="w-full flex items-center justify-between gap-4">
          {/* Left Categories Menu */}
          <div className="flex items-center gap-5 text-sm font-semibold">
            {/* All Categories Button - Amezon Navy Blue */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoriesOpen(!categoriesOpen)}
                className="group flex items-center gap-2 px-4.5 py-2 bg-[#0c2a5e] hover:bg-[#153e85] text-white rounded-lg transition shadow-2xs text-sm font-bold cursor-pointer active:scale-95"
              >
                <LayoutGrid className="w-4.5 h-4.5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
                <span>All Categories</span>
                <ChevronDown className={`w-4 h-4 ml-0.5 transition-transform duration-200 ${categoriesOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu when clicked - React Animated Icons */}
              {categoriesOpen && (
                <div className="absolute left-0 mt-2 w-68 bg-white border border-slate-200 rounded-xl shadow-2xl py-2 z-50 divide-y divide-slate-100">
                  <Link
                    to="/products?category=Electronics"
                    onClick={() => setCategoriesOpen(false)}
                    className="group flex items-center gap-3 px-4.5 py-2.5 text-slate-700 hover:bg-blue-50 hover:text-[#0c2a5e] transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                      <Laptop className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 group-hover:text-[#0c2a5e]">Electronics</span>
                      <p className="text-xs text-slate-400 font-normal">Mobiles, Laptops & TVs</p>
                    </div>
                  </Link>

                  <Link
                    to="/products?category=Furniture"
                    onClick={() => setCategoriesOpen(false)}
                    className="group flex items-center gap-3 px-4.5 py-2.5 text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-600 group-hover:text-white transition-all duration-200">
                      <Armchair className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 group-hover:text-amber-900">Furniture</span>
                      <p className="text-xs text-slate-400 font-normal">Sofas, Beds & Tables</p>
                    </div>
                  </Link>

                  <Link
                    to="/products?category=Grocery"
                    onClick={() => setCategoriesOpen(false)}
                    className="group flex items-center gap-3 px-4.5 py-2.5 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-200">
                      <ShoppingBasket className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 group-hover:text-emerald-900">Grocery</span>
                      <p className="text-xs text-slate-400 font-normal">Daily Staples & Organics</p>
                    </div>
                  </Link>

                  <Link
                    to="/products?category=Fashion"
                    onClick={() => setCategoriesOpen(false)}
                    className="group flex items-center gap-3 px-4.5 py-2.5 text-slate-700 hover:bg-purple-50 hover:text-purple-900 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-200">
                      <Shirt className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 group-hover:text-purple-900">Clothing</span>
                      <p className="text-xs text-slate-400 font-normal">Men, Women & Kids Wear</p>
                    </div>
                  </Link>

                  <Link
                    to="/products"
                    onClick={() => setCategoriesOpen(false)}
                    className="group flex items-center gap-3 px-4.5 py-2.5 text-[#0c2a5e] font-bold text-sm hover:bg-blue-50 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#0c2a5e] flex items-center justify-center group-hover:scale-110 group-hover:bg-[#0c2a5e] group-hover:text-white transition-all duration-200">
                      <LayoutGrid className="w-4.5 h-4.5" />
                    </div>
                    <span>View All Departments</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Horizontal Department Links with React Animation Icons (No Soon badge!) */}
            <div className="hidden sm:flex items-center gap-6 lg:gap-7 text-slate-700">
              <Link
                to="/products?category=Electronics"
                className="group flex items-center gap-2 hover:text-[#0c2a5e] transition py-1"
              >
                <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center transition-all duration-200 group-hover:scale-115 group-hover:bg-blue-600 group-hover:text-white shadow-2xs">
                  <Laptop className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                </span>
                <span className="font-bold text-sm text-slate-800 group-hover:text-[#0c2a5e] transition">Electronics</span>
              </Link>

              <Link
                to="/products?category=Furniture"
                className="group flex items-center gap-2 hover:text-[#0c2a5e] transition py-1"
              >
                <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center transition-all duration-200 group-hover:scale-115 group-hover:bg-amber-600 group-hover:text-white shadow-2xs">
                  <Armchair className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                </span>
                <span className="font-bold text-sm text-slate-800 group-hover:text-amber-800 transition">Furniture</span>
              </Link>

              <Link
                to="/products?category=Grocery"
                className="group flex items-center gap-2 hover:text-[#0c2a5e] transition py-1"
              >
                <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center transition-all duration-200 group-hover:scale-115 group-hover:bg-emerald-600 group-hover:text-white shadow-2xs">
                  <ShoppingBasket className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                </span>
                <span className="font-bold text-sm text-slate-800 group-hover:text-emerald-800 transition">Grocery</span>
              </Link>

              <Link
                to="/products?category=Fashion"
                className="group flex items-center gap-2 hover:text-[#0c2a5e] transition py-1"
              >
                <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center transition-all duration-200 group-hover:scale-115 group-hover:bg-purple-600 group-hover:text-white shadow-2xs">
                  <Shirt className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                </span>
                <span className="font-bold text-sm text-slate-800 group-hover:text-purple-800 transition">Clothing</span>
              </Link>
            </div>
          </div>

          {/* Right Highlights (Deals, New Arrivals - Wholesale REMOVED) */}
          <div className="flex items-center gap-3 text-sm font-bold">
            <Link
              to="/products"
              className="group flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 transition shadow-2xs text-sm"
            >
              <Flame className="w-4 h-4 text-rose-500 fill-rose-500 transition-transform duration-300 group-hover:scale-125 group-hover:-translate-y-0.5" />
              <span>Deals</span>
            </Link>

            <Link
              to="/products"
              className="group flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-50 text-amber-800 hover:bg-amber-100 transition shadow-2xs text-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-45" />
              <span>New Arrivals</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer with React Animated Icons */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 text-sm shadow-xl">
          {/* Mobile Brand Top */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <Logo size="sm" variant="marketplace" />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <Link
            to="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 py-2 font-bold text-slate-900 border-b border-slate-100"
          >
            <Package className="w-4 h-4 text-[#0c2a5e]" />
            <span>All Products</span>
          </Link>

          <Link
            to="/products?category=Electronics"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 py-1.5 text-slate-700 hover:text-blue-600 transition"
          >
            <span className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
              <Laptop className="w-3.5 h-3.5" />
            </span>
            <span>Electronics</span>
          </Link>

          <Link
            to="/products?category=Furniture"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 py-1.5 text-slate-700 hover:text-amber-600 transition"
          >
            <span className="w-6 h-6 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
              <Armchair className="w-3.5 h-3.5" />
            </span>
            <span>Furniture</span>
          </Link>

          <Link
            to="/products?category=Grocery"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 py-1.5 text-slate-700 hover:text-emerald-600 transition"
          >
            <span className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBasket className="w-3.5 h-3.5" />
            </span>
            <span>Grocery</span>
          </Link>

          <Link
            to="/products?category=Fashion"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2.5 py-1.5 text-slate-700 hover:text-purple-600 transition"
          >
            <span className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center">
              <Shirt className="w-3.5 h-3.5" />
            </span>
            <span>Clothing</span>
          </Link>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-rose-50 text-rose-700 font-bold text-xs"
            >
              <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Deals</span>
            </Link>
            <Link
              to="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-50 text-amber-800 font-bold text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
              <span>New Arrivals</span>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <Link
              to="/stores"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1 py-2 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs hover:bg-slate-200 transition"
            >
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span>Stores</span>
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1 py-2 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs hover:bg-slate-200 transition"
            >
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>About</span>
            </Link>
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1 py-2 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs hover:bg-slate-200 transition"
            >
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Contact</span>
            </Link>
          </div>

          <Link
            to="/vendor/register"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 py-2 text-amber-800 font-bold text-xs bg-amber-50/80 px-3 rounded-lg border border-amber-200/50"
          >
            <Store className="w-4 h-4 text-amber-700" />
            <span>Become a Partner / Seller (Earn ₹500 Referral)</span>
          </Link>

          {isAuthenticated ? (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="block py-1 text-slate-700">
                My Orders
              </Link>
              <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between py-1 text-slate-700">
                <span>My Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <button onClick={handleLogout} className="block w-full text-left py-1 text-rose-600 font-bold cursor-pointer">
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 bg-[#0c2a5e] text-white rounded-lg font-bold text-xs"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 border border-slate-300 text-slate-700 rounded-lg font-bold text-xs"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
