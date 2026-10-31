import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  Truck,
  RotateCcw,
  Headphones,
  Sparkles,
  Store,
  CheckCircle2,
} from 'lucide-react';
import Logo from './Logo';

const Footer = () => {
  return (
    <footer className="bg-[#04101e] text-slate-300 text-xs border-t border-slate-800 select-none">
      {/* 1. Top Value Propositions Banner */}
      <div className="border-b border-slate-800/80 bg-[#06182c]/80 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs sm:text-sm">Fast Doorstep Delivery</p>
              <p className="text-[10.5px] text-slate-400">Over 19,000+ pin codes covered</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs sm:text-sm">100% Genuine Products</p>
              <p className="text-[10.5px] text-slate-400">Audited &amp; verified merchants</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs sm:text-sm">7-Day Easy Returns</p>
              <p className="text-[10.5px] text-slate-400">Hassle-free doorstep pickup</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white text-xs sm:text-sm">24x7 Customer Support</p>
              <p className="text-[10.5px] text-slate-400">Instant chat &amp; phone assistance</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Navigation Columns */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          
          {/* Column 1: Brand Info */}
          <div className="space-y-4 lg:col-span-1">
            <div className="flex flex-col items-start">
              <Logo theme="dark" variant="brand" size="lg" showTagline={false} />
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              Your premier multi-vendor marketplace connecting you directly with trusted local stores, verified brand outlets, and artisans across India.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl w-fit">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>500+ Verified Merchant Stores</span>
            </div>
            {/* Social Links */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-[#0f8a48] hover:text-white flex items-center justify-center text-slate-400 transition"
                aria-label="Facebook"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-[#0f8a48] hover:text-white flex items-center justify-center text-slate-400 transition"
                aria-label="Twitter"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.936 9.936 0 0024 4.59z"/>
                </svg>
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-[#0f8a48] hover:text-white flex items-center justify-center text-slate-400 transition"
                aria-label="Instagram"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-[#0f8a48] hover:text-white flex items-center justify-center text-slate-400 transition"
                aria-label="YouTube"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Popular Categories */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Top Categories</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link to="/products?category=Electronics" className="hover:text-emerald-400 flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Mobiles &amp; Gadgets
                </Link>
              </li>
              <li>
                <Link to="/products?category=Fashion" className="hover:text-emerald-400 flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Men's &amp; Women's Fashion
                </Link>
              </li>
              <li>
                <Link to="/products?category=Footwear" className="hover:text-emerald-400 flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Footwear &amp; Sports Shoes
                </Link>
              </li>
              <li>
                <Link to="/products?category=Home & Kitchen" className="hover:text-emerald-400 flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Kitchen &amp; Home Appliances
                </Link>
              </li>
              <li>
                <Link to="/products?category=Beauty" className="hover:text-emerald-400 flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Beauty &amp; Skincare
                </Link>
              </li>
              <li>
                <Link to="/products?category=Grocery" className="hover:text-emerald-400 flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Farm Fresh Groceries
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Customer Care</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link to="/track-order" className="hover:text-emerald-400 flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Track Order Status
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-emerald-400 flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> My Account &amp; Orders
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="hover:text-emerald-400 flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Saved Wishlist
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-emerald-400 flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> View Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/return-refund" className="hover:text-emerald-400 flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Returns &amp; Replacement
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-emerald-400 flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Help &amp; Support Desk
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Vendor & Merchant Hub */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Merchant Hub</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <Link to="/stores" className="hover:text-emerald-400 flex items-center gap-1.5 transition">
                  <Store className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-white font-semibold">Official Stores Directory</span>
                </Link>
              </li>
              <li>
                <Link to="/vendor/register" className="hover:text-emerald-400 flex items-center gap-1.5 transition text-amber-300 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sell on RS &amp; Earn ₹1000</span>
                </Link>
              </li>
              <li>
                <Link to="/vendor/dashboard" className="hover:text-emerald-400 flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Vendor Panel Login
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-emerald-400 flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> About RS Marketplace
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-emerald-400 flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-emerald-500" /> Seller Code of Conduct
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Contact Info & Support Reach */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-white border-b border-slate-800 pb-2">Contact Us</h4>
            <div className="space-y-3 text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>RS Commercial Complex, Whitefield Main Road, Bengaluru, KA - 560066</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="text-white font-bold">+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>support@rsmarketplace.online</span>
              </div>
              <div className="pt-2 text-[11px] text-slate-500">
                Operating Hours: Mon - Sat, 9:00 AM - 9:00 PM IST
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Bottom Legal & Payment Badges Bar */}
      <div className="border-t border-slate-800 bg-[#030b15] py-4 pb-28 md:pb-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div>
            © 2026 RS Multi-Vendor Marketplace • <strong className="text-amber-400">SHOP • SUPPORT • GROW</strong>. All Rights Reserved.
          </div>

          {/* Payment Badges */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400">100% Secure Checkout:</span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 rounded font-bold text-[10px]">UPI</span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 rounded font-bold text-[10px]">RuPay</span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 rounded font-bold text-[10px]">Visa</span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 rounded font-bold text-[10px]">Mastercard</span>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-200 border border-slate-700 rounded font-bold text-[10px]">COD</span>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/privacy-policy" className="hover:text-white transition">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-white transition">Terms of Service</Link>
            <span>•</span>
            <Link to="/shipping-policy" className="hover:text-white transition">Shipping Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
