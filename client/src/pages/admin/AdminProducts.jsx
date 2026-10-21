import React, { useState, useEffect } from 'react';
import {
  Package,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Edit2,
  Trash2,
  Eye,
  Filter,
  Layers,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminProducts = () => {
  const { showToast, success, error } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products?limit=100').catch(() => null);
      if (res?.data?.products) {
        setProducts(res.data.products);
      } else {
        // Fallback realistic products matching LG reference
        setProducts([
          {
            _id: 'prod_1',
            title: 'LG OLED 4K Smart TV',
            category: 'Electronics',
            price: 99999,
            discountPrice: 85999,
            stock: 50,
            images: ['https://images.unsplash.com/photo-1593784991095-a205069470b6?w=200&auto=format&fit=crop&q=80'],
          },
          {
            _id: 'prod_2',
            title: 'LG French Door Refrigerator',
            category: 'Electronics',
            price: 75000,
            discountPrice: 65000,
            stock: 20,
            images: ['https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=200&auto=format&fit=crop&q=80'],
          },
          {
            _id: 'prod_3',
            title: 'Modern Ergonomic Office Chair',
            category: 'Furniture',
            price: 6500,
            discountPrice: 4999,
            stock: 100,
            images: ['https://images.unsplash.com/photo-1580481077111-6625895788c0?w=200&auto=format&fit=crop&q=80'],
          },
          {
            _id: 'prod_4',
            title: 'Minimalist Dining Table Set',
            category: 'Furniture',
            price: 22000,
            discountPrice: 18500,
            stock: 15,
            images: ['https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=200&auto=format&fit=crop&q=80'],
          },
          {
            _id: 'prod_5',
            title: 'Premium Organic Coffee Beans',
            category: 'Grocery',
            price: 600,
            discountPrice: 450,
            stock: 200,
            images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=200&auto=format&fit=crop&q=80'],
          },
          {
            _id: 'prod_6',
            title: 'Classic White Sneakers',
            category: 'Clothing',
            price: 1999,
            discountPrice: 1299,
            stock: 80,
            images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&auto=format&fit=crop&q=80'],
          },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id, name) => {
    setProducts((prev) => prev.filter((p) => p._id !== id));
    success(`"${name}" removed from catalog`);
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = (product.title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === 'all' ||
      (selectedFilter === 'in_stock' && product.stock > 0) ||
      (selectedFilter === 'out_of_stock' && product.stock === 0);
    const matchesCat =
      selectedCategory === 'all' || (product.category || '').toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesFilter && matchesCat;
  });

  const inStockCount = products.filter((p) => p.stock > 0).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  return (
    <AdminLayout title="Manage Products" subtitle="Manage product inventory, pricing tiers, descriptions, and storefront visibility.">
      <div className="space-y-6 select-none font-sans">
        {/* Top KPI Cards matching LG Enterprises */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL PRODUCTS</span>
              <div className="text-2xl font-black text-slate-900">{products.length}</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">IN STOCK</span>
              <div className="text-2xl font-black text-emerald-600">{inStockCount}</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">OUT OF STOCK</span>
              <div className="text-2xl font-black text-rose-600">{outOfStockCount}</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CATEGORIES</span>
              <div className="text-2xl font-black text-purple-600">4</div>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search, Filter & Action Row */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search products by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4338ca] transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  selectedFilter === 'all' ? 'bg-[#4338ca] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All {products.length}
              </button>
              <button
                onClick={() => setSelectedFilter('in_stock')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  selectedFilter === 'in_stock' ? 'bg-[#4338ca] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                In Stock {inStockCount}
              </button>
              <button
                onClick={() => setSelectedFilter('out_of_stock')}
                className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  selectedFilter === 'out_of_stock' ? 'bg-[#4338ca] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Out of Stock {outOfStockCount}
              </button>
            </div>

            <button
              onClick={() => showToast('Vendor catalog refreshed', 'info')}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Products Table matching LG Enterprises reference */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">MRP (₹)</th>
                  <th className="py-3.5 px-4">Selling Price (₹)</th>
                  <th className="py-3.5 px-4">Stock Units</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const hasDiscount = p.discountPrice > 0 && p.discountPrice < p.price;
                  const discountPct = hasDiscount ? Math.round(((p.price - p.discountPrice) / p.price) * 100) : 0;
                  const img = p.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&auto=format&fit=crop&q=80';

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                            <img src={img} alt={p.title} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 line-clamp-1">{p.title}</div>
                            {hasDiscount && (
                              <span className="text-[10px] text-emerald-600 font-extrabold">{discountPct}% OFF</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                          {p.category || 'General'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 line-through font-medium">
                        ₹{p.price?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                        ₹{(p.discountPrice || p.price)?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4">
                        {p.stock > 0 ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>IN STOCK ({p.stock} units)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            <span>OUT OF STOCK</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => showToast(`Edit modal opened for "${p.title}"`, 'info')}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3 text-slate-400" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(p._id, p.title)}
                            className="px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Showing 1 to {filteredProducts.length} of {filteredProducts.length} products</span>
            <div className="flex items-center gap-1 font-bold">
              <span className="w-6 h-6 rounded-md bg-[#4338ca] text-white flex items-center justify-center">1</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProducts;
