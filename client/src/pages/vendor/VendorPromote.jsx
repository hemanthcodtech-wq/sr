import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Share2,
  Copy,
  Check,
  TrendingUp,
  DollarSign,
  Package,
  Search,
  Filter,
  ExternalLink,
  RotateCcw,
  ShoppingBag,
  Zap,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import VendorLayout from '../../components/vendor/VendorLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const VendorPromote = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();

  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    totalSalesCount: 0,
    totalProfitEarned: 0,
    promotedOrders: [],
    walletBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    fetchPromotionData();
  }, []);

  const fetchPromotionData = async () => {
    try {
      setLoading(true);
      const [prodRes, statsRes] = await Promise.all([
        api.get('/vendors/dropship-promotions').catch(() => ({ data: { products: [] } })),
        api.get('/vendors/my-promotions-stats').catch(() => ({ data: { totalSalesCount: 0, totalProfitEarned: 0, promotedOrders: [] } })),
      ]);

      if (prodRes.data?.success) {
        setProducts(prodRes.data.products || []);
      }
      if (statsRes.data?.success) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error(err);
      error('Failed to load dropship promotion products');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (product) => {
    const link = product.promoLink || `${window.location.origin}/products/${product._id}?refVendor=${user?._id}`;
    navigator.clipboard.writeText(link);
    setCopiedId(product._id);
    success(`Promotion link for "${product.title.slice(0, 24)}..." copied!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleShareWhatsApp = (product) => {
    const link = product.promoLink || `${window.location.origin}/products/${product._id}?refVendor=${user?._id}`;
    const text = encodeURIComponent(
      `🔥 Special Offer! Check out "${product.title}" on Amezon.online for just ₹${product.sellingPrice}!\n\nBuy now securely here:\n${link}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPlatform = selectedPlatform === 'all' || (p.sourcePlatform || 'deodap') === selectedPlatform;

    return matchesSearch && matchesPlatform;
  });

  const platformBadges = {
    amazon: 'bg-amber-100 text-amber-900 border-amber-300',
    flipkart: 'bg-blue-100 text-blue-900 border-blue-300',
    meesho: 'bg-pink-100 text-pink-900 border-pink-300',
    deodap: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    other: 'bg-purple-100 text-purple-900 border-purple-300',
  };

  return (
    <VendorLayout
      title="Promote & Earn | Dropship Affiliate Hub"
      subtitle="Promote admin dropshipped products with your unique links and earn 50% profit margin on every sale"
    >
      <div className="space-y-6 animate-fadeIn pb-12 font-sans">
        {/* HERO BANNER */}
        <div className="bg-gradient-to-r from-[#071d42] via-[#0c2a5e] to-[#153e85] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg flex-shrink-0">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">50% Profit Share Affiliate Hub</h2>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    Instant Wallet Credit
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl">
                  Promote dropshipped products sourced by Admin from Meesho and DeoDap. When a buyer orders using your link, the product profit margin is split <strong>50% to Admin and 50% directly to you</strong>!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchPromotionData}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/90 hover:text-white border border-white/15 backdrop-blur-md transition cursor-pointer"
                title="Refresh Products"
              >
                <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-300' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* HOW AFFILIATE 50/50 PROFIT SHARING WORKS ACCORDION */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setGuideOpen(!guideOpen)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>How Does the 50/50 Profit Share Work?</span>
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                    Zero Inventory Required
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  {guideOpen ? 'Click to hide explanation' : 'Learn how you earn half the profit without buying inventory or handling couriers'}
                </p>
              </div>
            </div>
            <div className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
              {guideOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {guideOpen && (
            <div className="p-5 border-t border-slate-100 bg-gradient-to-b from-slate-50/60 to-white grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn text-xs">
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#0c2a5e] text-white font-mono font-bold text-xs flex items-center justify-center">1</span>
                  <span className="font-bold text-slate-800">Copy or Share Link</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Pick any product below and click <strong>"Copy Promotion Link"</strong> or <strong>"WhatsApp Share"</strong>. Post it on WhatsApp status, Instagram, Telegram, or Facebook.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-mono font-bold text-xs flex items-center justify-center">2</span>
                  <span className="font-bold text-slate-800">Customer Places Order</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  When a customer clicks your link and buys the item, the system tags your vendor account as the promoter. Admin fulfills the product via DeoDap / Meesho.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-white font-mono font-bold text-xs flex items-center justify-center">3</span>
                  <span className="font-bold text-slate-800">50% Profit Credited to Wallet</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Example: If Selling Price is ₹499 and Source Cost is ₹199, Total Margin is ₹300. <strong>You receive ₹150 (50%) directly in your Vendor Wallet!</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 4 PERFORMANCE STAT TILES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">YOUR 50% PROFIT</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
                ₹{stats.totalProfitEarned.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-emerald-600 font-bold block">Earned via promotions</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PROMOTED SALES</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {stats.totalSalesCount}
              </div>
              <span className="text-[11px] text-slate-400 block">Orders through your links</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0c2a5e] flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AVAILABLE PRODUCTS</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {products.length}
              </div>
              <span className="text-[11px] text-slate-400 block">Ready to promote</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">WALLET BALANCE</span>
              <div className="text-2xl sm:text-3xl font-black text-[#0c2a5e] font-mono">
                ₹{(user?.walletBalance || stats.walletBalance || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-slate-400 block">Available for bank payout</span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* SEARCH & SOURCE PLATFORM FILTER */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search product title or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]/20"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]/20"
            >
              <option value="all">All Sourcing Suppliers</option>
              <option value="deodap">DeoDap Products</option>
              <option value="meesho">Meesho Products</option>
              <option value="amazon">Amazon Products</option>
              <option value="flipkart">Flipkart Products</option>
            </select>
          </div>
        </div>

        {/* PRODUCT CATALOG GRID */}
        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
            <RotateCcw className="w-8 h-8 text-[#0c2a5e] animate-spin mx-auto" />
            <div className="text-sm font-bold text-slate-700">Loading Dropship Products to Promote...</div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-2xs space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Package className="w-8 h-8" />
            </div>
            <div className="text-base font-black text-slate-900">No Dropship Products Found</div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Admin has not added any external dropship items yet. Check back soon for exciting products to promote!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredProducts.map((p) => {
              const isCopied = copiedId === p._id;
              const source = p.sourcePlatform || 'deodap';

              return (
                <div
                  key={p._id}
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Image & Supplier Badge */}
                    <div className="relative aspect-video w-full bg-slate-100 overflow-hidden">
                      <img
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
                        alt={p.title}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border shadow-xs ${
                            platformBadges[source] || 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {source.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white backdrop-blur-xs">
                          {p.category}
                        </span>
                      </div>

                      {/* 50% Profit Banner Overlay */}
                      <div className="absolute bottom-2 right-2 bg-emerald-600 text-white px-3 py-1 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>You Earn: ₹{p.vendorShare50} / sale</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-3">
                      <h3 className="text-sm font-black text-slate-900 line-clamp-2 leading-snug" title={p.title}>
                        {p.title}
                      </h3>

                      {/* Pricing Breakdown Box */}
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Selling Price</span>
                          <span className="font-black text-slate-800 font-mono">₹{p.sellingPrice}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 block uppercase">Wholesale</span>
                          <span className="font-bold text-slate-500 font-mono">₹{p.sourcePrice}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 block uppercase">50% Profit Cut</span>
                          <span className="font-black text-emerald-600 font-mono text-sm">+₹{p.vendorShare50}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Promotion Action Buttons */}
                  <div className="p-5 pt-0 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleCopyLink(p)}
                        className={`w-full py-2.5 px-3 rounded-xl text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#0c2a5e] hover:bg-[#153e85] text-white'
                        }`}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-amber-300" />}
                        <span>{isCopied ? 'Copied Link!' : 'Copy Link'}</span>
                      </button>

                      <button
                        onClick={() => handleShareWhatsApp(p)}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    </div>

                    <a
                      href={`/products/${p._id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-1.5 text-center text-[11px] font-bold text-slate-500 hover:text-[#0c2a5e] transition flex items-center justify-center gap-1"
                    >
                      <span>Preview Product Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* AFFILIATE PROMOTION SALES HISTORY TABLE */}
        {stats.promotedOrders && stats.promotedOrders.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 sm:p-8 space-y-5 mt-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>Your Affiliate Sales &amp; 50% Profit History</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Every order generated via your promotion links automatically earns 50% of the product profit margin
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                ● {stats.promotedOrders.length} Sales Credited
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-3 px-2">Order Invoice</th>
                    <th className="py-3 px-2">Date</th>
                    <th className="py-3 px-2">Product</th>
                    <th className="py-3 px-2">Customer Price</th>
                    <th className="py-3 px-2">Your 50% Profit Cut</th>
                    <th className="py-3 px-2">Delivery Status</th>
                    <th className="py-3 px-2">Wallet Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.promotedOrders.map((ord, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-2 font-mono font-bold text-[#0c2a5e]">
                        {ord.invoiceNumber || ord.orderId}
                      </td>
                      <td className="py-3.5 px-2 text-slate-500">
                        {new Date(ord.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </td>
                      <td className="py-3.5 px-2 max-w-xs font-medium text-slate-800 truncate">
                        {ord.productTitle}
                      </td>
                      <td className="py-3.5 px-2 font-mono font-bold text-slate-800">
                        ₹{ord.sellingPrice} (x{ord.quantity})
                      </td>
                      <td className="py-3.5 px-2 font-mono font-black text-emerald-600 text-sm">
                        +₹{ord.vendorProfitShare}
                      </td>
                      <td className="py-3.5 px-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {ord.deliveryStatus || 'Processing'}
                        </span>
                      </td>
                      <td className="py-3.5 px-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Credited to Wallet
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </VendorLayout>
  );
};

export default VendorPromote;
