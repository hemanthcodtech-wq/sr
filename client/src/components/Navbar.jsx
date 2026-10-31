import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Heart,
  Bell,
  Package,
  User,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Flame,
  LayoutGrid,
  LogOut,
  Store,
  Truck,
  Phone,
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

const mockNotifications = [
  { id: 1, title: 'Mega Vendor Flash Sale!', desc: 'Up to 45% off on Electronics & Fashion today.', time: '5m ago' },
  { id: 2, title: 'Partner Referral Bonus', desc: '₹1000 credit available for new merchant signups.', time: '1h ago' },
  { id: 3, title: 'Order Dispatched', desc: 'Your recent order is out for fast doorstep delivery.', time: '3h ago' },
];

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount, wishlistCount } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
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
    <header className="sticky top-0 z-40 bg-[#06182c] text-white shadow-md select-none">
      {/* Top Main Navigation Header */}
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 pt-2.5 pb-2">
        <div className="flex items-center justify-between gap-2 sm:gap-6">
          {/* Mobile Hamburger / Desktop Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white md:hidden rounded-xl hover:bg-white/10 active:scale-95 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Desktop Brand Logo */}
            <div className="hidden md:flex flex-shrink-0">
              <Logo theme="dark" variant="brand" size="lg" showTagline={false} />
            </div>
          </div>

          {/* Mobile Centered Brand Logo (Large, Prominent, Crystal Clear) */}
          <div className="flex md:hidden flex-1 justify-center items-center py-0.5">
            <Logo theme="dark" variant="brand" size="lg" showTagline={false} />
          </div>

          {/* Desktop Centered Search Bar */}
          <div className="hidden md:flex flex-col flex-1 max-w-xl lg:max-w-2xl">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search for products, brands and vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-24 py-2.5 bg-white text-slate-900 rounded-full text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f8a48] transition shadow-xs"
              />
              <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-[#0f8a48] hover:bg-[#0c723b] text-white rounded-full text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <span>Search</span>
              </button>
            </form>

            {/* Popular Search Suggestions */}
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-300 overflow-hidden whitespace-nowrap">
              <span className="font-bold text-amber-300">Popular:</span>
              {['Smartphones', "Men's Shirts", 'Air Fryer', 'Skincare', 'Sports Shoes'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickSearch(tag)}
                  className="hover:text-emerald-300 hover:underline cursor-pointer transition text-slate-300 mr-1.5"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Right Action Icons (Notifications + Cart) */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop Navigation Links */}
            <Link
              to="/products"
              className="hidden lg:flex flex-col items-center text-slate-200 hover:text-white transition group text-center"
            >
              <Package className="w-5 h-5 text-slate-300 group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-200" />
              <span className="text-xs font-semibold mt-0.5">Products</span>
            </Link>

            <Link
              to="/stores"
              className="hidden lg:flex flex-col items-center text-slate-200 hover:text-white transition group text-center"
            >
              <Store className="w-5 h-5 text-slate-300 group-hover:text-emerald-400 group-hover:scale-110 transition-all duration-200" />
              <span className="text-xs font-semibold mt-0.5">Vendors</span>
            </Link>

            {/* Notification Bell with Red Badge "3" (Both Mobile & Desktop) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition cursor-pointer relative"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="w-6 h-6 stroke-[1.9]" />
                <span className="absolute top-0 right-0 bg-[#e11d48] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-[#06182c] shadow-xs animate-pulse">
                  3
                </span>
              </button>

              {/* Notification Dropdown */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-2xl py-3 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#0f8a48]" />
                      <span className="font-bold text-sm text-slate-900">Notifications</span>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                      3 New
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {mockNotifications.map((n) => (
                      <div key={n.id} className="p-3 hover:bg-slate-50 transition cursor-pointer flex gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 text-xs">{n.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.desc}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 px-3 border-t border-slate-100 text-center">
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-bold text-[#0f8a48] hover:underline cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Shopping Cart with Red Badge (Exact Match to Screenshot) */}
            <Link
              to="/cart"
              className="p-1.5 rounded-full hover:bg-white/10 text-white transition cursor-pointer relative"
              aria-label="Shopping Cart"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-6 h-6 stroke-[1.9]" />
              <span className="absolute top-0 right-0 bg-[#e11d48] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-[#06182c] shadow-xs">
                {cartCount > 0 ? cartCount : 2}
              </span>
            </Link>

            {/* Desktop User Avatar Dropdown */}
            {isAuthenticated ? (
              <div className="relative hidden md:block">
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
                  <div className="absolute right-0 mt-2 w-60 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs">
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
                      to="/orders"
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
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-white hover:bg-white/10 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#0f8a48] hover:bg-[#0c723b] text-white transition shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Input Row (Exact match to screenshot) */}
        <div className="pt-2 pb-1.5 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search for products, brands and vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white text-slate-900 rounded-full text-xs sm:text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f8a48] shadow-md transition font-medium"
            />
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </form>
        </div>
      </div>

      {/* Desktop Sub-Navbar */}
      <div className="hidden md:block bg-[#04101e] border-t border-slate-700/60 py-2 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-[1440px] mx-auto flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-6">
            <Link to="/products" className="hover:text-emerald-400 transition flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
              <span>All Products</span>
            </Link>
            <Link to="/stores" className="hover:text-emerald-400 transition flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-blue-400" />
              <span>Featured Vendors</span>
            </Link>
            <Link to="/products?category=Electronics" className="hover:text-emerald-400 transition">
              Mobiles &amp; Accessories
            </Link>
            <Link to="/products?category=Fashion" className="hover:text-emerald-400 transition">
              Fashion &amp; Apparel
            </Link>
            <Link to="/products?category=Footwear" className="hover:text-emerald-400 transition">
              Footwear
            </Link>
            <Link to="/products?category=Home & Kitchen" className="hover:text-emerald-400 transition">
              Home &amp; Kitchen
            </Link>
            <Link to="/products?category=Beauty" className="hover:text-emerald-400 transition">
              Beauty &amp; Personal Care
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/products"
              className="flex items-center gap-1 text-amber-300 hover:text-amber-200 transition"
            >
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>Top Deals</span>
            </Link>
            <Link
              to="/vendor/register"
              className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1 shadow-xs"
            >
              <Sparkles className="w-3 h-3" />
              <span>Join &amp; Earn ₹1000</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-4/5 max-w-sm bg-white text-slate-900 h-full overflow-y-auto p-5 shadow-2xl z-10 flex flex-col justify-between animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <Logo theme="light" variant="brand" size="md" showTagline={false} />
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
                  <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </span>
                  <span>Featured Vendors</span>
                </Link>

                <Link
                  to="/track-order"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition"
                >
                  <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </span>
                  <span>Track Order</span>
                </Link>

                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition"
                >
                  <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </span>
                  <span>Customer Support</span>
                </Link>
              </div>

              <Link
                to="/vendor/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block p-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span className="font-black text-xs uppercase tracking-wide">Join &amp; Earn ₹1000</span>
                </div>
                <p className="text-[11px] text-emerald-100">Become a certified seller and list your store on RS Marketplace.</p>
              </Link>
            </div>

            <div className="pt-4 border-t border-slate-100">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      {getUserInitials(user?.name)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{user?.name}</p>
                      <p className="text-[10px] text-slate-400">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 text-center bg-[#06182c] text-white rounded-xl font-bold text-xs shadow-xs"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 text-center border border-slate-300 text-slate-700 rounded-xl font-bold text-xs"
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
