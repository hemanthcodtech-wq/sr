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
  Eye,
  EyeOff,
  Tag,
  IndianRupee,
  Zap,
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

  // Simplified form state: Only Title, Price, DurationDays, and Active Status
  // (Product Limit, Badge Tag, Description, and Features are removed)
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
    if (!formData.title || !formData.price || !formData.durationDays) {
      error('Please provide plan title, fee amount, and duration days');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        price: Number(formData.price),
        durationDays: Number(formData.durationDays),
        isActive: Boolean(formData.isActive),
      };

      if (editingPlan) {
        const res = await api.put(`/plans/${editingPlan._id}`, payload);
        if (res.data?.success) {
          success(`Subscription plan "${payload.title}" updated!`);
          fetchPlans();
          handleCloseDrawer();
        }
      } else {
        const res = await api.post('/plans', payload);
        if (res.data?.success) {
          success(`New subscription plan "${payload.title}" published!`);
          fetchPlans();
          handleCloseDrawer();
        }
      }
    } catch (err) {
      error(err.response?.data?.message || 'Could not save subscription plan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (plan) => {
    try {
      const nextStatus = !plan.isActive;
      const res = await api.put(`/plans/${plan._id}`, { isActive: nextStatus });
      if (res.data?.success) {
        success(`Plan "${plan.title}" is now ${nextStatus ? 'Active' : 'Draft / Inactive'}`);
        setPlans((prev) =>
          prev.map((p) => (p._id === plan._id ? { ...p, isActive: nextStatus } : p))
        );
      }
    } catch (err) {
      error('Failed to change plan status');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete subscription plan "${title}"?`)) return;

    try {
      const res = await api.delete(`/plans/${id}`);
      if (res.data?.success) {
        success(`Plan "${title}" deleted`);
        setPlans((prev) => prev.filter((p) => p._id !== id));
        if (editingPlan?._id === id) {
          handleCloseDrawer();
        }
      }
    } catch (err) {
      error('Could not delete plan');
    }
  };

  // Preset validity durations
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
      subtitle="Configure storefront listing durations, enrollment fees, and validity packages"
    >
      <div className="space-y-6 sm:space-y-8 select-none font-sans relative">
        {/* Ambient Gradient Glass Blurs in the Background */}
        <div className="pointer-events-none absolute -top-10 -left-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        <div className="pointer-events-none absolute top-1/3 -right-12 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl -z-10" />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl -z-10" />

        {/* Top Header & Action Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200/80 gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-gradient-to-br from-[#0c2a5e] to-indigo-700 text-amber-300 shadow-md">
                <CreditCard className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Marketplace Subscription Plans</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Define subscription pricing and duration for merchant store registrations
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchPlans}
              className="p-2.5 rounded-2xl bg-white/80 hover:bg-white text-slate-600 hover:text-indigo-600 border border-white/80 shadow-xs backdrop-blur-md transition cursor-pointer"
              title="Refresh Plans"
              aria-label="Refresh Plans"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#0c2a5e] via-indigo-900 to-indigo-700 hover:from-indigo-950 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-900/20 active:scale-98 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Create New Plan</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Enterprise Glass Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_20px_rgba(12,42,94,0.04)] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">Total Configured Plans</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">{plans.length}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-indigo-700 shadow-2xs">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_20px_rgba(12,42,94,0.04)] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">Active For Vendors</p>
              <h3 className="text-3xl font-extrabold text-emerald-600 mt-1 tracking-tight">{activePlansCount}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-[0_4px_20px_rgba(12,42,94,0.04)] rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-sans">Storefront Listing Duration</p>
              <h3 className="text-3xl font-extrabold text-amber-600 mt-1 tracking-tight">
                {plans.length > 0
                  ? Math.min(...plans.map((p) => p.durationDays)) === Math.max(...plans.map((p) => p.durationDays))
                    ? `${Math.min(...plans.map((p) => p.durationDays))} Days`
                    : `${Math.min(...plans.map((p) => p.durationDays))} - ${Math.max(...plans.map((p) => p.durationDays))} Days`
                  : '0 Days'}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50/80 border border-amber-100 flex items-center justify-center text-amber-700 shadow-2xs">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* PLAN CARDS CATALOG (LARGE ENTERPRISE DESIGN & TYPOGRAPHY) */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>Enterprise Subscription Tiers</span>
                <span className="text-xs text-slate-400 font-semibold lowercase">({plans.length} tier{plans.length === 1 ? '' : 's'})</span>
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Commercial marketplace store packages and listing terms</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-72 rounded-2xl bg-white/50 backdrop-blur-md border border-slate-200/60 animate-pulse shadow-xs"
                />
              ))}
            </div>
          ) : plans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan._id}
                  className="bg-white/85 backdrop-blur-xl border border-slate-200/90 hover:border-indigo-400/60 shadow-[0_4px_24px_rgba(12,42,94,0.06)] hover:shadow-[0_16px_40px_rgba(12,42,94,0.12)] hover:-translate-y-1 transition-all duration-300 rounded-2xl p-6 sm:p-7 relative overflow-hidden group flex flex-col justify-between"
                >
                  {/* Subtle Enterprise Ambient Accent on Hover */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-indigo-600/0 group-hover:via-indigo-600/60 to-transparent transition-all duration-300" />
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br from-indigo-500/10 via-amber-400/5 to-transparent rounded-full blur-2xl pointer-events-none" />

                  {/* Header: Tier Emblem, Title & Official Status */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0c2a5e] to-indigo-800 text-amber-300 flex items-center justify-center shadow-sm border border-indigo-900/10 flex-shrink-0">
                          <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-xl text-slate-900 tracking-tight capitalize group-hover:text-indigo-950 transition">
                            {plan.title ? plan.title.charAt(0).toUpperCase() + plan.title.slice(1) : 'Standard Tier'}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                            <span>Commercial Storefront License</span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full border shadow-2xs transition ${
                          plan.isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/90'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            plan.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        <span>{plan.isActive ? 'ACTIVE' : 'DRAFT'}</span>
                      </span>
                    </div>

                    {/* Financial Terms & Breakdown */}
                    <div className="py-4 my-2 border-y border-slate-100/90 bg-gradient-to-r from-slate-50/50 via-white/80 to-slate-50/50 -mx-6 px-6 sm:-mx-7 sm:px-7">
                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Registration / Access Fee
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-bold text-slate-400">₹</span>
                            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-sans">
                              {plan.price.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs font-semibold text-slate-400 ml-1">/ cycle</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50/90 text-indigo-700 border border-indigo-100/80 font-bold text-[11px] shadow-2xs">
                            <Zap className="w-3 h-3 text-amber-500" />
                            <span>₹{(plan.price / Math.max(1, plan.durationDays)).toFixed(1)}/day</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Enterprise Specifications Metric Grid */}
                    <div className="grid grid-cols-2 gap-2.5 my-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 backdrop-blur-xs flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white text-indigo-600 flex items-center justify-center border border-slate-200/60 shadow-2xs flex-shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden leading-tight">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Validity Period</span>
                          <span className="font-extrabold text-slate-800 text-xs whitespace-nowrap block">{plan.durationDays} Days Active</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 backdrop-blur-xs flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white text-emerald-600 flex items-center justify-center border border-slate-200/60 shadow-2xs flex-shrink-0">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden leading-tight">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Store Access</span>
                          <span className="font-extrabold text-slate-800 text-xs truncate block">Full Commercial</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Enterprise Status Toggle & Actions */}
                  <div className="pt-4 mt-2 border-t border-slate-100/90 flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleToggleStatus(plan)}
                      className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                        plan.isActive
                          ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/90 shadow-2xs'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200 shadow-2xs'
                      }`}
                      title={plan.isActive ? 'Deactivate Tier' : 'Activate Tier'}
                    >
                      <span className={`w-2 h-2 rounded-full ${plan.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      <span>{plan.isActive ? 'Active Tier' : 'Set Active'}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(plan)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-indigo-50/80 text-slate-700 hover:text-indigo-700 border border-slate-200/80 shadow-2xs text-xs font-bold transition cursor-pointer"
                        title="Edit Plan Configuration"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(plan._id, plan.title)}
                        className="p-2 rounded-xl bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/80 shadow-2xs transition cursor-pointer"
                        title="Delete Plan"
                        aria-label="Delete Plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-12 text-center rounded-3xl space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
                <CreditCard className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-800">No subscription plans created yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Create vendor subscription plans so merchants can choose their storefront listing validity upon enrollment.
                </p>
              </div>
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#0c2a5e] to-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-900/20 hover:from-indigo-900 hover:to-indigo-800 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>Create First Plan</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT-SIDE SLIDE-OVER CARD DRAWER (GETTING FROM THE RIGHT SIDE WITH GLASSMORPHISM) */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          drawerOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
        }`}
      >
        {/* Frosted Glass Backdrop Mask */}
        <div
          onClick={handleCloseDrawer}
          className={`fixed inset-0 bg-slate-900/35 backdrop-blur-xs transition-opacity duration-300 ${
            drawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* The Right-Side Glassmorphic Card Panel (Responsive for all devices) */}
        <div
          className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-md md:max-w-lg bg-white/85 backdrop-blur-3xl border-l border-white/80 shadow-[-25px_0_80px_rgba(12,42,94,0.22)] flex flex-col justify-between transition-transform duration-300 ease-out transform overflow-hidden ${
            drawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Ambient Colorful Diffused Glow Orbs inside the card for authentic glassmorphism */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 -left-16 w-72 h-72 bg-amber-400/15 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-10 w-72 h-72 bg-blue-400/15 rounded-full blur-3xl" />

          {/* Card Drawer Header (Clean, Glassmorphic - NO gradient line) */}
          <div className="p-4 sm:p-6 border-b border-white/70 bg-white/40 backdrop-blur-xl flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-[#0c2a5e] via-indigo-900 to-indigo-700 text-amber-300 flex items-center justify-center shadow-md shadow-indigo-950/20 border border-white/20">
                  <CreditCard className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[9px] shadow-xs">
                  {editingPlan ? <Edit2 className="w-2.5 h-2.5" /> : <Plus className="w-2.5 h-2.5 stroke-[3]" />}
                </span>
              </div>
              <div className="overflow-hidden">
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight truncate">
                  {editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                </h3>
                <p className="text-xs text-slate-500 font-medium truncate">
                  {editingPlan ? editingPlan.title : 'Configure listing validity and registration fee'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseDrawer}
              className="p-2 sm:p-2.5 rounded-2xl text-slate-400 hover:text-slate-800 hover:bg-white/80 transition cursor-pointer flex-shrink-0 border border-white/60 shadow-2xs"
              title="Close Panel (Esc)"
              aria-label="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Card Drawer Body (Scrollable Form with Rich Glassmorphism & Inputs with Icons) */}
          <form id="plan-drawer-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 relative z-10">
            {/* 1. Plan Title Input with Icon */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>Plan Title *</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-indigo-50/90 text-indigo-600 flex items-center justify-center border border-indigo-100/70 shadow-2xs pointer-events-none">
                  <Tag className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starter 30-Day Pass, Gold Annual"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full pl-14 pr-4 py-3 sm:py-3.5 bg-white/60 backdrop-blur-md border border-white/80 focus:border-indigo-500 focus:bg-white/95 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl text-base sm:text-sm font-semibold text-slate-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Displayed to vendors during onboarding</p>
            </div>

            {/* 2. Fee Amount Input with Icon */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
                <span>Fee Amount (₹) *</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-amber-50/90 text-amber-700 flex items-center justify-center border border-amber-100/70 shadow-2xs pointer-events-none">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  required
                  min={0}
                  placeholder="e.g. 999"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full pl-14 pr-4 py-3 sm:py-3.5 bg-white/60 backdrop-blur-md border border-white/80 focus:border-indigo-500 focus:bg-white/95 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl text-base sm:text-sm font-semibold text-slate-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium">One-time registration fee charged to vendor</p>
            </div>

            {/* 3. Validity (Days) Input with Icon */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Storefront Validity (Days) *</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-blue-50/90 text-blue-600 flex items-center justify-center border border-blue-100/70 shadow-2xs pointer-events-none">
                  <Clock className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  required
                  min={1}
                  placeholder="e.g. 90"
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                  className="w-full pl-14 pr-4 py-3 sm:py-3.5 bg-white/60 backdrop-blur-md border border-white/80 focus:border-indigo-500 focus:bg-white/95 focus:ring-4 focus:ring-indigo-500/10 rounded-2xl text-base sm:text-sm font-semibold text-slate-900 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Storefront access days before renewal</p>
            </div>

            {/* Quick Duration Preset Chips with Glassmorphism & Icons */}
            <div className="p-4 sm:p-5 rounded-3xl bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-3">
              <div className="flex items-center gap-2 text-xs font-black text-slate-700 uppercase tracking-wider">
                <CalendarDays className="w-4 h-4 text-indigo-600" />
                <span>Quick Duration Presets</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {durationPresets.map((preset) => {
                  const isSelected = Number(formData.durationDays) === preset.days;
                  return (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => setFormData({ ...formData, durationDays: preset.days })}
                      className={`flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 px-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#0c2a5e] to-indigo-800 text-amber-300 border-[#0c2a5e] shadow-md shadow-indigo-950/20 scale-[1.02]'
                          : 'bg-white/70 hover:bg-white text-slate-700 border-white/90 hover:border-indigo-200 shadow-2xs hover:shadow-xs'
                      }`}
                    >
                      <Calendar className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-slate-400'}`} />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Active Status Toggle Card with Glassmorphism & Icon */}
            <div
              className="p-4 sm:p-5 rounded-3xl bg-white/50 backdrop-blur-xl border border-white/80 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center justify-between gap-4 cursor-pointer hover:bg-white/60 transition"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-2xs transition flex-shrink-0 ${
                    formData.isActive
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <strong className="text-xs sm:text-sm font-bold text-slate-900 block">
                    Active for Vendors
                  </strong>
                  <p className="text-[11px] text-slate-500">
                    When enabled, merchants can select this plan during registration
                  </p>
                </div>
              </div>

              {/* iOS-Style Glass Toggle Switch */}
              <div
                className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out flex items-center flex-shrink-0 ${
                  formData.isActive ? 'bg-[#0c2a5e]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                    formData.isActive ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </form>

          {/* Card Drawer Footer (Sticky Bottom Action Bar with Glassmorphism) */}
          <div className="p-4 sm:p-5 border-t border-white/70 bg-white/60 backdrop-blur-xl flex items-center justify-end gap-3 relative z-10">
            <button
              type="button"
              onClick={handleCloseDrawer}
              className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-2xl bg-white/80 hover:bg-white text-slate-600 font-bold text-xs sm:text-sm border border-slate-200 shadow-2xs transition cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-400" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              form="plan-drawer-form"
              disabled={submitting}
              className="inline-flex items-center gap-2 py-2.5 px-6 rounded-2xl bg-gradient-to-r from-[#0c2a5e] via-indigo-900 to-indigo-700 hover:from-indigo-950 hover:to-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-900/20 disabled:opacity-50 active:scale-98 transition cursor-pointer"
            >
              <Check className="w-4 h-4 text-amber-400" />
              <span>
                {submitting
                  ? 'Saving...'
                  : editingPlan
                  ? 'Update Subscription Plan'
                  : 'Save & Publish Plan'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPlans;
