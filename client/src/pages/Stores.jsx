import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  ShieldCheck,
  Star,
  Package,
  MapPin,
  Search,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import api from '../services/api';

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const res = await api.get('/vendors/public-stores');
        if (res.data?.success) {
          setStores(res.data.stores || []);
        }
      } catch (err) {
        console.error('Error fetching public stores:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  const categories = ['All', ...new Set(stores.map((s) => s.category).filter(Boolean))];

  const filteredStores = stores.filter((s) => {
    const matchesSearch =
      s.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.address?.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 font-sans select-none">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#0f8a48] text-[10px] sm:text-xs font-black uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0f8a48]" />
            <span>Verified Merchant Directory</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Official Merchant <span className="text-[#0f8a48]">Storefronts</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
            Browse verified, KYC-audited sellers operating with active platform subscriptions.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stores or cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0f8a48] shadow-xs"
          />
        </div>
      </div>

      {/* Category Filter Pills (Horizontal Scroll) */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0f8a48] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-3 rounded-2xl border border-slate-200 animate-pulse space-y-3">
              <div className="h-20 sm:h-28 bg-slate-200 rounded-xl"></div>
              <div className="h-3 bg-slate-200 rounded w-2/3"></div>
              <div className="h-2.5 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="text-center py-12 space-y-2 bg-white p-8 rounded-3xl border border-slate-200 max-w-sm mx-auto">
          <Store className="w-10 h-10 text-slate-400 mx-auto" />
          <h2 className="text-base font-black text-slate-900">No Stores Found</h2>
          <p className="text-xs text-slate-500">
            {searchQuery
              ? `No official stores match your search "${searchQuery}".`
              : 'There are currently no active merchant stores published.'}
          </p>
        </div>
      ) : (
        /* Storefront Grid: 2 CARDS PER ROW on mobile (grid-cols-2), 3 on tablet, 4 on desktop */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 items-stretch">
          {filteredStores.map((store) => (
            <div
              key={store._id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-emerald-300 transition-all duration-200 shadow-2xs hover:shadow-md flex flex-col justify-between group"
            >
              <div>
                {/* Store Banner */}
                <div className="h-20 sm:h-28 w-full bg-slate-100 relative overflow-hidden">
                  <img
                    src={store.banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80'}
                    alt={store.storeName}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>

                  {/* KYC Badge */}
                  <div className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-600/90 text-white text-[8px] sm:text-[9px] font-black backdrop-blur-xs shadow-xs">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span className="hidden xs:inline">KYC</span>
                    <span>Verified</span>
                  </div>

                  {/* Products count pill */}
                  <div className="absolute bottom-1.5 left-2 text-white text-[9px] sm:text-[10px] font-bold flex items-center gap-1 drop-shadow-xs">
                    <Package className="w-3 h-3 text-amber-300" />
                    <span>{store.productCount || 0} Products</span>
                  </div>
                </div>

                {/* Store Info Body */}
                <div className="p-2.5 sm:p-3.5 space-y-2">
                  <div className="flex items-start gap-2">
                    {/* Store Logo overlapping banner */}
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200 overflow-hidden shadow-xs shrink-0 -mt-5 relative z-10">
                      <img
                        src={store.logo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80'}
                        alt={store.storeName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-[#0f8a48] transition-colors">
                        {store.storeName}
                      </h2>
                      <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{store.rating || '5.0'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Category Pill */}
                  <div>
                    <span className="inline-block text-[9px] sm:text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded truncate max-w-full">
                      {store.category || 'General Store'}
                    </span>
                  </div>

                  {/* Description: subtle and clamped */}
                  <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {store.description || 'Verified merchant storefront operating under active marketplace standards.'}
                  </p>

                  {/* Location & Status */}
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400">
                    <span className="flex items-center gap-0.5 truncate max-w-[65%]">
                      <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                      <span className="truncate">{store.address?.city || 'Bhimavaram'}, {store.address?.state || 'AP'}</span>
                    </span>
                    <span className="font-bold text-emerald-700 shrink-0">Official</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-2.5 sm:p-3.5 pt-0">
                <Link
                  to={`/stores/${store._id}`}
                  className="w-full py-1.5 sm:py-2 px-2 rounded-xl bg-[#0f8a48] hover:bg-[#0c723b] active:scale-95 text-white font-bold text-[10px] sm:text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow-xs"
                >
                  <span>Visit Shop</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Stores;
