import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, Search, ArrowRight } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16">
      <div className="bright-card max-w-md w-full p-8 sm:p-10 rounded-3xl text-center space-y-6 border-slate-200 shadow-md">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto">
          <Compass className="w-10 h-10 animate-soft-pulse" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-wider text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            Error 404
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Page Not Found</h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            The page or product link you followed may have moved or no longer exists in our catalog.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            to="/"
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return Home</span>
          </Link>

          <Link
            to="/products"
            className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4 text-blue-600" />
            <span>Search Shop</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
