import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
  CreditCard,
  Check,
  X,
  Calendar,
  CalendarDays,
  Layers,
  ShieldCheck,
  RefreshCw,
  Tag,
  IndianRupee,
  Zap,
  TrendingUp,
  CheckCircle2,
  Store,
  ArrowRight,
} from 'lucide-react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const AdminPlans = () => {
  const { success, error } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    durationDays: 30,
    isActive: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && drawerOpen) {
        handleCloseDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawerOpen]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res = await api.get('/plans/admin');
      if (res.data?.success) {
        setPlans(res.data.plans || []);
      }
    } catch (err) {
      console.error('Error fetching admin plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setFormData({
      title: '',
      price: '',
      durationDays: 30,
      isActive: true,
    });
    setDrawerOpen(true);
  };

  const handleOpenEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      price: plan.price,
      durationDays: plan.durationDays,
      isActive: plan.isActive !== false,
    });
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingPlan(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      error('Plan title is required');
      return;
    }
    if (formData.price === '' || isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      error('Please provide a valid price');
      return;
    }
    if (!formData.durationDays || Number(formData.durationDays) < 1) {
      error('Duration must be at least 1 day');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        title: formData.title.trim(),
        price: Number(formData.price),
        durationDays: Number(formData.durationDays),
        isActive: formData.isActive,
      };

      if (editingPlan) {
        const res = await api.put(`/plans/admin/${editingPlan._id}`, payload);
        if (res.data?.success) {
          success(`"${payload.title}" updated successfully!`);
          handleCloseDrawer();
          fetchPlans();
        }
      } else {
        const res = await api.post('/plans/admin', payload);
        if (res.data?.success) {
          success(`"${payload.title}" created successfully!`);
          handleCloseDrawer();
          fetchPlans();
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save subscription plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${title}"?`)) {
      return;
    }
    try {
      const res = await api.delete(`/plans/admin/${id}`);
      if (res.data?.success) {
        success(`Plan "${title}" removed`);
        fetchPlans();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete plan');
    }
  };

  const handleToggleStatus = async (plan) => {
    try {
      const newStatus = !plan.isActive;
      const res = await api.put(`/plans/admin/${plan._id}`, {
        ...plan,
        isActive: newStatus,
      });
      if (res.data?.success) {
        success(`Plan marked as ${newStatus ? 'Active' : 'Draft'}`);
        fetchPlans();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update plan status');
    }
  };

  const durationPresets = [
    { label: '30 Days (1 Mo)', days: 30 },
    { label: '90 Days (3 Mo)', days: 90 },
    { label: '180 Days (6 Mo)', days: 180 },
    { label: '365 Days (1 Yr)', days: 365 },
  ];

  const activePlansCount = plans.filter((p) => p.isActive).length;

  return (
    <AdminLayout
      title="Vendor Subscription Plans"
      subtitle="Configure storefront listing packages, validity terms, and onboarding registration fees"
      onRefresh={fetchPlans}
    >
      <div className="space-y-8 animate-fadeIn pb-12">
        {/* HERO BANNER: Modern Gradient Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#071d42] via-[#0c2a5e] to-[#153e85] p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute right-0 top-0 -mt-8 -mr-8 w-60 h-60 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 -mb-8 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner flex-shrink-0">
                <CreditCard className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">Merchant Subscription Tiers</h2>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Live System
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl">
                  Set up vendor listing fees, billing durations, and commercial privileges required when sellers register on the platform.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={fetchPlans}
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white/90 hover:text-white border border-white/15 backdrop-blur-md transition cursor-pointer shadow-sm"
                title="Refresh Plans"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-300' : ''}`} />
              </button>

              <button
                onClick={handleOpenAdd}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-400/25 active:scale-98 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create New Plan</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3 STAT TILES: Total Plans, Active Status, Duration Spread */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">Configured Plans</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight font-mono">{plans.length}</h3>
              <span className="text-[11px] text-slate-500 block mt-0.5">Total registered pricing models</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0c2a5e] flex items-center justify-center shadow-2xs border border-blue-100">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">Active For Merchants</p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1 tracking-tight font-mono">{activePlansCount}</h3>
              <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">Visible on registration</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs border border-emerald-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">Validity Scope</p>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-600 mt-1 tracking-tight font-mono">
                {plans.length > 0
                  ? Math.min(...plans.map((p) => p.durationDays)) === Math.max(...plans.map((p) => p.durationDays))
                    ? `${Math.min(...plans.map((p) => p.durationDays))}d`
                    : `${Math.min(...plans.map((p) => p.durationDays))}d - ${Math.max(...plans.map((p) => p.durationDays))}d`
                  : '0d'}
              </h3>
              <span className="text-[11px] text-slate-500 block mt-0.5">Storefront duration terms</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs border border-amber-100">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* PLAN CARDS CATALOG SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span>Available Subscription Packages</span>
                <span className="text-xs text-slate-400 font-normal lowercase">({plans.length} total)</span>
              </h3>
              <p className="text-xs text-slate-500">Card plans presented to vendors during onboarding and plan extension</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 rounded-3xl bg-slate-100 border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const dailyRate = (plan.price / Math.max(1, plan.durationDays)).toFixed(1);
                return (
                  <div
                    key={plan._id}
                    className="bg-white rounded-3xl border border-slate-200/90 hover:border-[#0c2a5e]/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 p-6 flex flex-col justify-between relative group"
                  >
                    {/* Top Color Accent */}
                    <div className="absolute top-0 inset-x-6 h-1 rounded-b-full bg-gradient-to-r from-transparent via-[#0c2a5e]/40 to-transparent group-hover:via-[#0c2a5e] transition" />

                    <div className="space-y-5">
                      {/* Card Header: Icon, Title & Status */}
                      <div className="flex items-start justify-between gap-3 pt-1">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#071d42] to-[#153e85] text-amber-300 flex items-center justify-center shadow-md flex-shrink-0">
                            <CreditCard className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="font-black text-lg text-slate-900 tracking-tight capitalize group-hover:text-[#0c2a5e] transition">
                              {plan.title}
                            </h4>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Store License</span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full border shadow-2xs ${
                            plan.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${plan.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                          <span>{plan.isActive ? 'ACTIVE' : 'DRAFT'}</span>
                        </span>
                      </div>

                      {/* Pricing Display */}
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200/80">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Platform Enrollment Fee
                        </span>
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex items-baseline font-mono">
                            <span className="text-xl font-bold text-slate-400 mr-0.5">₹</span>
                            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                              {plan.price.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-slate-400 font-medium font-sans ml-1">/ cycle</span>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-[#0c2a5e] font-bold text-[11px] shadow-2xs font-mono">
                            <Zap className="w-3 h-3 text-amber-500" />
                            ₹{dailyRate}/day
                          </span>
                        </div>
                      </div>

                      {/* Key Terms Details */}
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>Validity Period:</span>
                          </span>
                          <strong className="text-slate-900 font-mono font-black">{plan.durationDays} Days Active</strong>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Storefront Access:</span>
                          </span>
                          <span className="font-bold text-emerald-700">Full Commercial</span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Merchant Dashboard:</span>
                          </span>
                          <span className="font-bold text-slate-800">Included</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleStatus(plan)}
                        className={`text-xs font-bold px-3 py-2 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                          plan.isActive
                            ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}
                        title={plan.isActive ? 'Deactivate Tier' : 'Activate Tier'}
                      >
                        <span className={`w-2 h-2 rounded-full ${plan.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{plan.isActive ? 'Deactivate' : 'Publish'}</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(plan)}
                          className="px-3.5 py-2 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="Edit Plan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(plan._id, plan.title)}
                          className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0c2a5e] flex items-center justify-center mx-auto shadow-xs border border-blue-100">
                <CreditCard className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900">No subscription plans created yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Create vendor subscription plans so merchants can choose their storefront listing validity upon enrollment.
                </p>
              </div>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>Create First Plan</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SLIDE-OVER DRAWER MODAL */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          drawerOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
        }`}
      >
        <div
          onClick={handleCloseDrawer}
          className={`fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 ${
            drawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        <div
          className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col justify-between transition-transform duration-300 ease-out transform ${
            drawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-[#071d42] to-[#153e85] text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner flex-shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {editingPlan ? 'Edit Subscription Plan' : 'Create New Plan'}
                </h3>
                <p className="text-xs text-blue-200">
                  {editingPlan ? editingPlan.title : 'Configure fee and validity days'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseDrawer}
              className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Form Body */}
          <form id="plan-drawer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="font-black text-slate-800 uppercase tracking-wider block">
                Plan Title *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Starter 30-Day Pass, Annual Gold"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 focus:border-[#0c2a5e] focus:bg-white rounded-xl text-xs font-semibold text-slate-900 shadow-2xs outline-none transition"
                />
                <Tag className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <label className="font-black text-slate-800 uppercase tracking-wider block">
                Registration Fee (₹) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="e.g. 999"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 focus:border-[#0c2a5e] focus:bg-white rounded-xl text-xs font-semibold text-slate-900 shadow-2xs outline-none transition"
                />
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-1.5">
              <label className="font-black text-slate-800 uppercase tracking-wider block">
                Storefront Validity (Days) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="e.g. 90"
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                  className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 focus:border-[#0c2a5e] focus:bg-white rounded-xl text-xs font-semibold text-slate-900 shadow-2xs outline-none transition"
                />
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Duration Presets */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="font-bold text-slate-700 block">Quick Duration Presets:</span>
              <div className="grid grid-cols-2 gap-2">
                {durationPresets.map((preset) => {
                  const isSelected = Number(formData.durationDays) === preset.days;
                  return (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => setFormData({ ...formData, durationDays: preset.days })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#0c2a5e] text-white border-[#0c2a5e] shadow-2xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Toggle */}
            <div
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/70 transition"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
            >
              <div>
                <strong className="font-bold text-slate-900 block text-xs">
                  Active for Merchant Onboarding
                </strong>
                <p className="text-[11px] text-slate-400">
                  Allow sellers to select this plan during registration
                </p>
              </div>

              <div
                className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-200 flex items-center flex-shrink-0 ${
                  formData.isActive ? 'bg-[#0c2a5e]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                    formData.isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </form>

          {/* Drawer Footer */}
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleCloseDrawer}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="plan-drawer-form"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white text-xs font-bold shadow-sm disabled:opacity-50 transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>
                {submitting
                  ? 'Saving...'
                  : editingPlan
                  ? 'Update Plan'
                  : 'Publish Plan'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPlans;
