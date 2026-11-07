import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Search, RotateCcw, Package } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import api from '../services/api';

const categoriesList = ['All', 'Electronics', 'Home & Kitchen', 'Toys', 'Beauty', 'Fitness', 'Fashion', 'Automotive'];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters state initialized from query params
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [sortBy, setSortBy] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [mobileCols, setMobileCols] = useState(() => {
    const saved = localStorage.getItem('shoppinest_catalog_cols');
    return saved ? Number(saved) : 4;
  });

  const handleSetMobileCols = (cols) => {
    setMobileCols(cols);
    try {
      localStorage.setItem('shoppinest_catalog_cols', cols);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    // Sync URL params
    const categoryParam = searchParams.get('category');
    if (categoryParam) setSelectedCategory(categoryParam);
    const keywordParam = searchParams.get('keyword');
    if (keywordParam !== null) setKeyword(keywordParam);
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, keyword, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'All') params.append('category', selectedCategory);
      if (keyword) params.append('keyword', keyword);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      if (sortBy === 'price-asc') params.append('sort', 'price-asc');
      else if (sortBy === 'price-desc') params.append('sort', 'price-desc');
      else if (sortBy === 'rating') params.append('sort', 'rating');

      const res = await api.get(`/products?${params.toString()}`);
      if (res.data && res.data.success) {
        setProducts(res.data.products);
        setTotal(res.data.total || res.data.products.length);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setKeyword('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setSearchParams({});
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto px-1.5 sm:px-6 lg:px-10 2xl:px-14 py-3 sm:py-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-6 mb-3 sm:mb-6 border-b border-slate-200 gap-2 sm:gap-4 px-1">
        <div>
          <h1 className="text-lg sm:text-3xl font-black text-slate-900 tracking-tight">Marketplace Catalog</h1>
          <p className="text-[10px] sm:text-sm text-slate-500 mt-0.5">
            Showing <span className="font-bold text-slate-800">{total}</span> verified products
            {keyword && <span> for "<strong className="text-emerald-700">{keyword}</strong>"</span>}
            {selectedCategory !== 'All' && <span> in <strong className="text-emerald-700">{selectedCategory}</strong></span>}
          </p>
        </div>

        {/* Sort, Mobile Density Switcher & Mobile Filter Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-between sm:justify-end">
          {/* Mobile Density Switcher: 3 or 4 per row */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 sm:hidden">
            <button
              type="button"
              onClick={() => handleSetMobileCols(3)}
              className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold transition cursor-pointer ${
                mobileCols === 3
                  ? 'bg-[#0f8a48] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Display 3 products per row on mobile"
            >
              3 / row
            </button>
            <button
              type="button"
              onClick={() => handleSetMobileCols(4)}
              className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold transition cursor-pointer ${
                mobileCols === 4
                  ? 'bg-[#0f8a48] text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Display 4 products per row on mobile"
            >
              4 / row
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden flex items-center gap-1 px-2.5 py-1 sm:py-2 rounded-lg sm:rounded-xl bg-white border border-slate-300 text-[10px] sm:text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
            >
              <SlidersHorizontal className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-700" />
              <span>Filters</span>
            </button>

            <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg sm:rounded-xl px-2 py-1 sm:py-1.5 shadow-2xs">
              <span className="hidden xs:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer text-[10px] sm:text-xs"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sidebar Filters - Desktop & Mobile Drawer */}
        <aside
          className={`bright-card p-6 rounded-2xl space-y-6 ${
            mobileFilterOpen ? 'block fixed inset-x-4 top-20 z-50 shadow-2xl bg-white max-h-[85vh] overflow-y-auto' : 'hidden lg:block sticky top-24'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Filter Catalog</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Department</label>
            <div className="space-y-1">
              {categoriesList.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setMobileFilterOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#0f8a48] text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Price Range (₹)</label>
            <form onSubmit={handlePriceApply} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Apply Range
              </button>
            </form>
          </div>

          {mobileFilterOpen && (
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-xl mt-4"
            >
              Done Filtering
            </button>
          )}
        </aside>

        {/* Products Grid: 3 or 4 items per row on mobile matching svworks.com.in ultra-dense compact style */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className={`grid ${mobileCols === 4 ? 'grid-cols-4' : 'grid-cols-3'} sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-1 sm:gap-2.5`}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                <div key={i} className="h-32 sm:h-44 rounded-md sm:rounded-xl bg-slate-100 animate-pulse border border-slate-200/60" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className={`grid ${mobileCols === 4 ? 'grid-cols-4' : 'grid-cols-3'} sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-1 sm:gap-2.5`}>
              {products.map((product) => (
                <ProductCard key={product._id} product={product} mobileCols={mobileCols} />
              ))}
            </div>
          ) : (
            <div className="bright-card p-12 text-center rounded-2xl space-y-3">
              <Package className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-lg font-bold text-slate-800">No products match your criteria</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Try clearing selected filters, adjusting the price threshold, or searching for a different keyword.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Products;
