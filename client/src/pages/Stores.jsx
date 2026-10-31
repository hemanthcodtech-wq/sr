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
  Sparkles,
  Phone,
  Mail,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans select-none">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0c2a5e] text-xs font-black uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Public Merchant Directory</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Official Merchant <span className="text-[#0c2a5e]">Storefronts</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse verified, KYC-audited sellers operating with active platform subscriptions on Amezon.online.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stores or cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0c2a5e] shadow-xs"
          />
        </div>
      </div>

      {/* Category Pills */}
      {categories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0c2a5e] text-white shadow-xs'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bright-card p-6 rounded-3xl animate-pulse space-y-4">
              <div className="h-32 bg-slate-200 rounded-2xl"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="text-center py-16 space-y-3 bright-card p-12 rounded-3xl border-slate-200 max-w-lg mx-auto">
          <Store className="w-12 h-12 text-slate-400 mx-auto" />
          <h2 className="text-lg font-black text-slate-900">No Stores Found</h2>
          <p className="text-xs text-slate-500">
            {searchQuery
              ? `No official stores match your search "${searchQuery}".`
              : 'There are currently no active merchant stores published.'}
          </p>
        </div>
      ) : (
        /* Storefront Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <div
              key={store._id}
              className="bright-card rounded-3xl overflow-hidden border-slate-200 hover:border-blue-300 transition shadow-xs flex flex-col group"
            >
              {/* Banner */}
              <div className="h-32 w-full bg-slate-100 relative overflow-hidden">
                <img
                  src={store.banner || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80'}
                  alt={store.storeName}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-[10px] font-black backdrop-blur-xs">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>KYC Verified</span>
                </div>

                <div className="absolute bottom-3 left-4 text-white text-xs font-semibold flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-amber-300" />
                  <span>{store.productCount || 0} Products Listed</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs shrink-0 -mt-8 relative z-10">
                      <img
                        src={store.logo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80'}
                        alt={store.storeName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h2 className="text-sm font-black text-slate-900 truncate">
                          {store.storeName}
                        </h2>
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 shrink-0">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{store.rating || '4.9'}</span>
                        </div>
                      </div>
                      <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md mt-0.5">
                        {store.category || 'General Merchant'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {store.description || 'Verified merchant storefront operating under active marketplace standards.'}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{store.address?.city || 'Bhimavaram'}, {store.address?.state || 'AP'}</span>
                    </span>
                    <span className="font-semibold text-emerald-700">Official Store</span>
                  </div>
                </div>

                {/* Footer Action */}
                <Link
                  to={`/store/${store._id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0f8a48] hover:bg-[#0c723b] active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <span>Visit Shop</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
