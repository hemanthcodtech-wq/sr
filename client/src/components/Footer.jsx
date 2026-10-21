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
  Heart,
} from 'lucide-react';
import Logo from './Logo';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-16 text-slate-700 text-xs select-none">
      {/* Main Footer Columns */}
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-14 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Column 1: Brand Info */}
          <div className="space-y-4 lg:col-span-1">
            <Logo />
            <p className="text-slate-500 leading-relaxed text-xs">
              Your trusted multi-vendor marketplace for Electronics, Furniture, Grocery, Fashion & more. Quality verified products delivered straight to your doorstep.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-2 pt-1">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#0c2a5e] hover:text-white flex items-center justify-center text-slate-600 transition"
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
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#0c2a5e] hover:text-white flex items-center justify-center text-slate-600 transition"
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
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#0c2a5e] hover:text-white flex items-center justify-center text-slate-600 transition"
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
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-[#0c2a5e] hover:text-white flex items-center justify-center text-slate-600 transition"
                aria-label="YouTube"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Quick Links</h4>
            <ul className="space-y-2 text-slate-600">
              <li>
                <Link to="/" className="hover:text-[#0c2a5e] flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-slate-400" /> Home
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-[#0c2a5e] flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-slate-400" /> All Products
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#0c2a5e] flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-slate-400" /> About Us
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#0c2a5e] flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-slate-400" /> Contact Us
                </Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-[#0c2a5e] flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-slate-400" /> Limited Deals
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Service */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Customer Service</h4>
            <ul className="space-y-2 text-slate-600">
              <li>
                <Link to="/track-order" className="hover:text-[#0c2a5e] flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-slate-400" /> Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-[#0c2a5e] flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-slate-400" /> My Account
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-[#0c2a5e] flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-slate-400" /> Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/vendor/register" className="hover:text-[#0c2a5e] flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-slate-400" /> Bulk / Wholesale Orders
                </Link>
              </li>
              <li>
                <Link to="/return-refund" className="hover:text-[#0c2a5e] flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-slate-400" /> Returns & Policies
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Categories */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Categories</h4>
            <ul className="space-y-2 text-slate-600">
              <li>
                <Link to="/products?category=Electronics" className="hover:text-[#0c2a5e] flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-slate-400" /> Electronics
                </Link>
              </li>
              <li>
                <Link to="/products?category=Furniture" className="hover:text-[#0c2a5e] flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-slate-400" /> Furniture
                </Link>
              </li>
              <li>
                <Link to="/products?category=Grocery" className="hover:text-[#0c2a5e] flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-slate-400" /> Grocery
                </Link>
              </li>
              <li>
                <Link to="/products?category=Fashion" className="hover:text-[#0c2a5e] flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-slate-400" /> Clothing
                </Link>
              </li>
              <li>
                <Link to="/vendor/register" className="text-emerald-700 font-bold hover:text-emerald-800 flex items-center gap-1.5 transition">
                  <ChevronRight className="w-3 h-3 text-emerald-600" /> Sell on Amezon.online
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Contact Info */}
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-2">Contact Info</h4>
            <div className="space-y-2.5 text-slate-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#0c2a5e] flex-shrink-0 mt-0.5" />
                <span>Amezon Commercial Complex, Main Road, Bhimavaram, AP – 534201</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#0c2a5e] flex-shrink-0" />
                <span>+91 9876543210</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#0c2a5e] flex-shrink-0" />
                <span>support@amezon.online</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Copyright & Payment Badges */}
      <div className="border-t border-slate-200 bg-slate-50 py-4 px-4 sm:px-6 lg:px-10 2xl:px-14">
        <div className="w-full max-w-[1920px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div>
            © 2026 SR Multi-Vendor Marketplace • Dream • Grow • Together. All Rights Reserved.
          </div>

          <div className="flex items-center gap-3">
            <span>Secure Payments:</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-800">UPI</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-800">Cards</span>
            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-800">COD</span>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="hover:text-slate-800 transition">Privacy Policy</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-slate-800 transition">Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
