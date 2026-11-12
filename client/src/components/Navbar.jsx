import React, { useState, useEffect, useRef } from 'react';
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
  Info,
  Headphones,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import Logo from './Logo';
import api from '../services/api';
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
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const navigate = useNavigate();

  // Debounced live search suggestions
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const params = { keyword: query, limit: 6 };
        if (selectedCategory && selectedCategory !== 'All') {
          params.category = selectedCategory;
        }
        const res = await api.get('/products', { params });
        if (res.data && Array.isArray(res.data.products)) {
          setSuggestions(res.data.products);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.error('Error fetching search suggestions:', err);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory]);

  // Dismiss suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInsideDesktop = desktopSearchRef.current && desktopSearchRef.current.contains(event.target);
      const isInsideMobile = mobileSearchRef.current && mobileSearchRef.current.contains(event.target);
      if (!isInsideDesktop && !isInsideMobile) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setShowSuggestions(false);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('keyword', searchQuery.trim());
    if (selectedCategory && selectedCategory !== 'All') params.append('category', selectedCategory);
    navigate(`/products${params.toString() ? `?${params.toString()}` : ''}`);
    setMobileMenuOpen(false);
  };

  const handleSelectProduct = (product) => {
    setShowSuggestions(false);
    setMobileMenuOpen(false);
    navigate(`/products/${product._id}`);
  };

  const handleSelectCategorySearch = (cat) => {
    setShowSuggestions(false);
    setMobileMenuOpen(false);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append('keyword', searchQuery.trim());
    if (cat && cat !== 'All') params.append('category', cat);
    navigate(`/products${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        e.preventDefault();
        handleSelectProduct(suggestions[activeSuggestionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const renderSuggestionsDropdown = () => {
    if (!showSuggestions || !searchQuery.trim()) return null;

    return (
      <div className="absolute left-0 right-0 top-full mt-2 bg-white text-slate-800 rounded-2xl shadow-2xl border border-slate-200/95 overflow-hidden z-50 text-left">
        {/* Quick Search Action */}
        <div
          onClick={() => handleSelectCategorySearch(selectedCategory)}
          className="flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-emerald-50 border-b border-slate-100 cursor-pointer text-xs font-semibold text-slate-700 transition"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="truncate">
              Search for <span className="text-emerald-700 font-bold">"{searchQuery}"</span>
              {selectedCategory && selectedCategory !== 'All' ? (
                <span className="text-slate-500 font-normal">
                  {' '}in <span className="font-semibold text-slate-700">{selectedCategory}</span>
                </span>
              ) : (
                <span className="text-slate-500 font-normal"> in all categories</span>
              )}
            </span>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        </div>

        {/* Loading indicator */}
        {loadingSuggestions && suggestions.length === 0 && (
          <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            <span>Finding matching products...</span>
          </div>
        )}

        {/* Matching products list */}
        {suggestions.length > 0 && (
          <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
            <div className="px-4 py-1.5 bg-slate-50/70 text-[10px] uppercase font-bold tracking-wider text-slate-400">
              Matching Products ({suggestions.length})
            </div>
            {suggestions.map((item, idx) => (
              <div
                key={item._id}
                onClick={() => handleSelectProduct(item)}
                onMouseEnter={() => setActiveSuggestionIndex(idx)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition ${
                  activeSuggestionIndex === idx ? 'bg-emerald-50/80' : 'hover:bg-slate-50'
                }`}
              >
                {/* Product thumbnail */}
                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {item.images?.[0] ? (
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Package className="w-5 h-5 text-slate-400" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {item.category || 'General'}
                    </span>
                    {item.store?.storeName && (
                      <span className="text-[10px] text-slate-400 truncate">
                        by {item.store.storeName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <span className="text-xs font-black text-[#0f8a48]">
                    ₹{(item.price || 0).toLocaleString()}
                  </span>
                  {item.discountPrice && item.discountPrice > item.price && (
                    <div className="text-[10px] text-slate-400 line-through">
                      ₹{item.discountPrice.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loadingSuggestions && suggestions.length === 0 && (
          <div className="py-6 px-4 text-center">
            <p className="text-xs text-slate-600 font-medium">
              No direct products found for <span className="font-bold text-slate-800">"{searchQuery}"</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Press Enter or click below to search across descriptions and tags
            </p>
          </div>
        )}

        {/* Bottom footer */}
        <div
          onClick={handleSearchSubmit}
          className="p-2.5 bg-slate-50 border-t border-slate-100 text-center hover:bg-emerald-50 cursor-pointer transition text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5"
        >
          <span>See all results for "{searchQuery}"</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-[#051527] text-white shadow-lg select-none w-full">
      {/* 1. Main Navigation Bar */}
      <div className="w-full px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
        <div className="flex items-center justify-between gap-2.5 sm:gap-6 md:gap-8 min-h-[50px] sm:min-h-[54px]">
          
          {/* Left: Mobile Hamburger / Desktop Logo */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 z-20">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-white md:hidden rounded-lg hover:bg-white/10 active:scale-95 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
            </button>

            {/* Desktop Brand Logo */}
            <div className="hidden md:flex items-center flex-shrink-0">
              <Logo theme="dark" variant="brand" size="lg" showTagline={false} />
            </div>
          </div>

          {/* Mobile Centered Brand Logo (Increased size: lg) */}
          <div className="absolute left-1/2 -translate-x-1/2 md:hidden flex items-center justify-center z-10 pointer-events-auto">
            <Logo theme="dark" variant="brand" size="lg" showTagline={false} />
          </div>

          {/* Center: Search Bar (Desktop) - Expands across full width covering all empty space */}
          <div ref={desktopSearchRef} className="relative hidden md:flex flex-1 px-3 lg:px-8">
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center w-full bg-white rounded-full p-0.5 shadow-sm border border-slate-200/80 focus-within:ring-2 focus-within:ring-[#0f8a48] transition-all"
            >
              {/* Category Selector Prefix (like Amazon) to cover empty space and enable quick filtering */}
              <div className="hidden lg:flex items-center pl-3.5 pr-2.5 border-r border-slate-200 flex-shrink-0">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer py-1.5 pr-1 hover:text-emerald-700 transition"
                >
                  <option value="All">All Categories</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Home & Kitchen">Home &amp; Kitchen</option>
                  <option value="Beauty">Beauty</option>
                  <option value="Toys">Toys</option>
                  <option value="Footwear">Footwear</option>
                </select>
              </div>

              {/* Main Search Input: Stretches to fill entire available width */}
              <div className="relative flex-1 flex items-center min-w-0">
                <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 pointer-events-none flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search for products, brands and vendors..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                    setActiveSuggestionIndex(-1);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0) setShowSuggestions(true);
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-9 pr-3 py-2 bg-transparent text-slate-900 text-xs sm:text-sm placeholder-slate-400 focus:outline-none font-medium truncate"
                />
              </div>

              {/* Search Submit Action Button */}
              <button
                type="submit"
                className="px-6 py-2 bg-[#0f8a48] hover:bg-[#0c723b] text-white rounded-full text-xs font-bold transition flex items-center justify-center cursor-pointer shadow-xs active:scale-95 flex-shrink-0"
              >
                <span>Search</span>
              </button>
            </form>

            {/* Desktop Autocomplete Suggestions Dropdown */}
            {renderSuggestionsDropdown()}
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-3 sm:gap-5 lg:gap-6 flex-shrink-0 text-white">
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

            {/* About link */}
            <Link
              to="/about"
              className="hidden xl:flex flex-col items-center text-slate-200 hover:text-emerald-400 transition group text-center cursor-pointer"
            >
              <Info className="w-5 h-5 text-slate-300 group-hover:text-emerald-400 transition" />
              <span className="text-[11px] font-semibold mt-0.5 leading-none">About</span>
            </Link>

            {/* Contact link */}
            <Link
              to="/contact"
              className="hidden xl:flex flex-col items-center text-slate-200 hover:text-emerald-400 transition group text-center cursor-pointer"
            >
              <Headphones className="w-5 h-5 text-slate-300 group-hover:text-emerald-400 transition" />
              <span className="text-[11px] font-semibold mt-0.5 leading-none">Contact</span>
            </Link>

            {/* Shopping Cart */}
            <Link
              to="/cart"
              className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 text-white transition cursor-pointer relative"
              aria-label="Shopping Cart"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5.5 h-5.5 stroke-[1.9]" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#e11d48] text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-[#051527] shadow-xs">
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
                  className="px-4.5 py-1.5 rounded-full text-xs font-bold bg-[#0f8a48] hover:bg-[#0c723b] text-white transition shadow-xs active:scale-95"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Input Row */}
        <div ref={mobileSearchRef} className="relative pt-2 pb-1 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search for products, brands and vendors..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
                setActiveSuggestionIndex(-1);
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-20 py-2 bg-white text-slate-900 rounded-full text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f8a48] shadow-sm transition font-medium"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-3 bg-[#0f8a48] text-white text-[11px] font-black rounded-full active:scale-95 transition"
            >
              Search
            </button>
          </form>

          {/* Mobile Autocomplete Suggestions Dropdown */}
          {renderSuggestionsDropdown()}
        </div>
      </div>

      {/* 2. Desktop Sub-Navbar: Original Dark Navy Theme with About & Contact links */}
      <div className="hidden md:block bg-[#020b14] border-t border-slate-800/80 py-2.5 px-4 sm:px-6 lg:px-8 text-xs font-semibold">
        <div className="w-full flex items-center justify-between">
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
            <Link to="/about" className="hover:text-emerald-400 transition flex items-center gap-1 text-white font-bold whitespace-nowrap">
              <Info className="w-3.5 h-3.5 text-sky-400" />
              <span>About Us</span>
            </Link>
            <Link to="/contact" className="hover:text-emerald-400 transition flex items-center gap-1 text-white font-bold whitespace-nowrap">
              <Headphones className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contact Us</span>
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
              className="px-4 py-1 rounded-full bg-[#0f8a48] hover:bg-[#0c723b] text-white font-bold transition flex items-center gap-1.5 shadow-xs whitespace-nowrap active:scale-95"
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
                  <span className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </span>
                  <span>Browse Stores</span>
                </Link>

                {/* About Us link in mobile drawer */}
                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition"
                >
                  <span className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <Info className="w-4 h-4" />
                  </span>
                  <span>About Us</span>
                </Link>

                {/* Contact Us link in mobile drawer */}
                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition"
                >
                  <span className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                    <Headphones className="w-4 h-4" />
                  </span>
                  <span>Contact &amp; Support</span>
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