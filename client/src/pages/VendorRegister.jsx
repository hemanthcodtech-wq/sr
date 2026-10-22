import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Store,
  CheckCircle2,
  CreditCard,
  Gift,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  FileText,
  AlertCircle,
  Eye,
  Check,
  RefreshCw,
  Landmark,
  BadgeCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Logo from '../components/Logo';
import { PageLoader } from '../components/LoadingScreen';
import api from '../services/api';

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Telangana',
  'Karnataka',
  'Tamil Nadu',
  'Kerala',
  'Maharashtra',
  'Gujarat',
  'Delhi',
  'Uttar Pradesh',
  'West Bengal',
  'Rajasthan',
  'Punjab',
  'Haryana',
  'Madhya Pradesh',
  'Bihar',
  'Odisha',
  'Assam',
];

const POPULAR_BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Union Bank of India',
  'Canara Bank',
  'IndusInd Bank',
];

const VendorRegister = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  // Status state from backend: 'pending_payment' | 'pending_admin_approval' | 'active' | 'rejected'
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [enrollmentFee, setEnrollmentFee] = useState(999);
  const [planDurationDays, setPlanDurationDays] = useState(365);
  const [existingStore, setExistingStore] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [formStep, setFormStep] = useState(1); // 1 = Store & Bank Info, 2 = Plan Selection & Payment

  // Admin Plans State & Selection
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plansLoading, setPlansLoading] = useState(true);

  // Simulated Razorpay Modal State for dev/test keys
  const [showSimulatedModal, setShowSimulatedModal] = useState(false);
  const [pendingPlanOrder, setPendingPlanOrder] = useState(null);

  const formatDurationDays = (days) => {
    if (!days) return '';
    if (days === 30) return '1 Month';
    if (days === 60) return '2 Months';
    if (days === 90) return '3 Months (Quarterly)';
    if (days === 180) return '6 Months (Half-Year)';
    if (days === 365) return '1 Year (Annual)';
    if (days % 30 === 0) return `${Math.round(days / 30)} Months`;
    return `${days} Days`;
  };

  const fetchPlans = async (storeActivePlan = null) => {
    try {
      setPlansLoading(true);
      const res = await api.get('/plans');
      if (res.data?.success && Array.isArray(res.data.plans)) {
        const activeOnly = res.data.plans.filter((p) => p.isActive !== false);
        setPlans(activeOnly);

        if (activeOnly.length > 0) {
          const targetPlanId = storeActivePlan?._id || (typeof storeActivePlan === 'string' ? storeActivePlan : null);
          const matched = targetPlanId ? activeOnly.find((p) => p._id === targetPlanId) : null;
          const chosen = matched || activeOnly[0];
          setSelectedPlan(chosen);
          setEnrollmentFee(chosen.price);
          setPlanDurationDays(chosen.durationDays);
        }
        return activeOnly;
      }
    } catch (err) {
      console.warn('Could not fetch active plans:', err);
    } finally {
      setPlansLoading(false);
    }
    return [];
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setEnrollmentFee(plan.price);
    setPlanDurationDays(plan.durationDays);
  };

  // Merchant Application Form Data
  const [formData, setFormData] = useState({
    ownerName: user?.name || '',
    phone: user?.phone || '',
    alternatePhone: '',
    email: user?.email || '',
    storeName: '',
    category: 'Electronics',
    description: '',
    referralCode: '',
    address: {
      street: '',
      landmark: '',
      city: 'Bhimavaram',
      state: 'Andhra Pradesh',
      zipCode: '534201',
      country: 'India',
    },
    documents: {
      aadhaarNumber: user?.aadhaarNumber || '',
      aadhaarDocument: user?.aadhaarDocument || '',
      panNumber: user?.panNumber || '',
      panDocument: user?.panDocument || '',
      gstNumber: '',
      gstDocument: '',
    },
    logo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&auto=format&fit=crop&q=80',
    bankDetails: {
      accountHolder: user?.name || '',
      bankName: 'State Bank of India',
      accountNumber: '',
      ifscCode: '',
      upiId: '',
    },
  });

  // Fetch current enrollment status
  const fetchStatus = async (isManualCheck = false) => {
    try {
      if (isManualCheck) setCheckingStatus(true);
      else setPageLoading(true);

      const res = await api.get('/vendors/enrollment-status');
      if (res.data?.success) {
        setEnrollmentStatus(res.data.status);
        if (res.data.activePlans && Array.isArray(res.data.activePlans) && res.data.activePlans.length > 0) {
          setPlans(res.data.activePlans);
        }
        setEnrollmentFee(res.data.enrollmentFee || 999);
        setPlanDurationDays(res.data.planDurationDays || 365);
        if (res.data.store) {
          setExistingStore(res.data.store);
          setFormData((prev) => ({
            ...prev,
            storeName: res.data.store.storeName || prev.storeName,
            category: res.data.store.category || prev.category,
            description: res.data.store.description || prev.description,
            phone: res.data.store.phone || user?.phone || prev.phone,
            email: res.data.store.email || user?.email || prev.email,
            address: {
              ...prev.address,
              ...(res.data.store.address || {}),
            },
            documents: {
              ...prev.documents,
              ...(res.data.store.documents || {}),
              aadhaarNumber: res.data.store.documents?.aadhaarNumber || user?.aadhaarNumber || prev.documents.aadhaarNumber,
              aadhaarDocument: res.data.store.documents?.aadhaarDocument || user?.aadhaarDocument || prev.documents.aadhaarDocument,
              panNumber: res.data.store.documents?.panNumber || user?.panNumber || prev.documents.panNumber,
              panDocument: res.data.store.documents?.panDocument || user?.panDocument || prev.documents.panDocument,
            },
            bankDetails: {
              ...prev.bankDetails,
              ...(res.data.store.bankDetails || {}),
            },
          }));
          if (res.data.store.bankDetails?.accountNumber) {
            setConfirmAccountNumber(res.data.store.bankDetails.accountNumber);
          }
        }

        await fetchPlans(res.data.store?.activePlan);

        if (isManualCheck) {
          if (res.data.status === 'active') {
            success('🎉 Congratulations! Your store has been approved by Admin and is now live!');
            confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
          } else if (res.data.status === 'pending_admin_approval') {
            info('Your application is still under compliance audit by the Admin.');
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch enrollment status:', err);
    } finally {
      setPageLoading(false);
      setCheckingStatus(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatus();
    } else {
      fetchPlans();
      setPageLoading(false);
    }
  }, [isAuthenticated]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [name]: value },
    }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [name]: value },
    }));
  };

  // Auto-fill demo details for quick setup testing
  const handleFillDemoData = () => {
    const demoAcc = '987654321012';
    setConfirmAccountNumber(demoAcc);
    setFormData((prev) => ({
      ...prev,
      storeName: 'Royal Electronics & Spares',
      category: 'Electronics',
      description: 'Authorized retailer of genuine electronic components, smartphones, accessories, and replacement spare parts with manufacturer warranty.',
      phone: prev.phone || user?.phone || '9876543210',
      alternatePhone: '9848012345',
      address: {
        street: 'Shop 14, Commercial Market Complex, Main Bazaar',
        landmark: 'Opposite Clock Tower Junction',
        city: 'Bhimavaram',
        state: 'Andhra Pradesh',
        zipCode: '534201',
        country: 'India',
      },
      documents: {
        ...prev.documents,
        aadhaarNumber: prev.documents?.aadhaarNumber || user?.aadhaarNumber || '543210987654',
        aadhaarDocument: prev.documents?.aadhaarDocument || user?.aadhaarDocument || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe',
        panNumber: prev.documents?.panNumber || user?.panNumber || 'ABCDE1234F',
        panDocument: prev.documents?.panDocument || user?.panDocument || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c',
      },
      bankDetails: {
        accountHolder: user?.name || 'Raju Merchant',
        bankName: 'State Bank of India',
        accountNumber: demoAcc,
        ifscCode: 'SBIN0001234',
        upiId: 'merchant@oksbi',
      },
    }));
    success('Store, address, and settlement bank details populated!');
  };

  // 1. Validate Store & Bank Form Fields
  const validateStoreDetails = () => {
    if (!formData.storeName.trim()) {
      error('Please enter your store name');
      return false;
    }

    if (!formData.phone.trim()) {
      error('Please provide a business contact phone number');
      return false;
    }

    if (
      !formData.address.street.trim() ||
      !formData.address.city.trim() ||
      !formData.address.state.trim() ||
      !formData.address.zipCode.trim()
    ) {
      error('Please complete all physical address fields (Street, City, State, PIN Code)');
      return false;
    }

    if (
      !formData.bankDetails.accountHolder.trim() ||
      !formData.bankDetails.bankName.trim() ||
      !formData.bankDetails.accountNumber.trim() ||
      !formData.bankDetails.ifscCode.trim()
    ) {
      error('Please fill in all mandatory settlement bank account details');
      return false;
    }

    if (formData.bankDetails.accountNumber.trim() !== confirmAccountNumber.trim()) {
      error('Bank account numbers do not match. Please verify.');
      return false;
    }

    const cleanIfsc = formData.bankDetails.ifscCode.trim().toUpperCase();
    if (cleanIfsc.length !== 11) {
      error('IFSC code must be exactly 11 characters (e.g. SBIN0001234)');
      return false;
    }

    return true;
  };

  // Step 1 Action: Save Store Details & Proceed to Next Step (Plan Selection)
  const handleProceedToPlans = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!isAuthenticated) {
      info('Please sign in to complete your store setup');
      navigate('/login', { state: { from: { pathname: '/vendor/register' } } });
      return;
    }

    if (!validateStoreDetails()) return;

    setSubmitting(true);
    try {
      const cleanIfsc = formData.bankDetails.ifscCode.trim().toUpperCase();
      const payload = {
        ...formData,
        phone: formData.phone.trim(),
        planId: selectedPlan?._id || undefined,
        bankDetails: {
          ...formData.bankDetails,
          accountNumber: formData.bankDetails.accountNumber.trim(),
          ifscCode: cleanIfsc,
        },
      };

      const saveRes = await api.post('/vendors/submit-application', payload);
      if (!saveRes.data?.success) {
        throw new Error(saveRes.data?.message || 'Failed to save store details');
      }

      setExistingStore(saveRes.data.store);
      success('Store details saved! Now select your membership plan to complete enrollment.');
      setFormStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Save error:', err);
      error(err.response?.data?.message || err.message || 'Failed to save store profile');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2 Action: Initiate Plan Payment & Submit Application
  const handleInitiatePayment = async () => {
    if (!isAuthenticated) {
      info('Please sign in to complete payment');
      navigate('/login', { state: { from: { pathname: '/vendor/register' } } });
      return;
    }

    if (!selectedPlan && plans.length > 0) {
      error('Please select an enrollment membership plan to proceed');
      return;
    }

    setSubmitting(true);
    try {
      const orderRes = await api.post('/vendors/initiate-enrollment-payment', {
        planId: selectedPlan?._id,
      });
      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.message || 'Payment initiation failed');
      }

      const { order, razorpayKeyId, isMock, amount } = orderRes.data;

      if (!isMock && window.Razorpay && razorpayKeyId && !razorpayKeyId.includes('placeholder')) {
        const options = {
          key: razorpayKeyId,
          amount: order.amount,
          currency: 'INR',
          name: 'Amezon.online Vendor Enrollment',
          description: selectedPlan ? `${selectedPlan.title} (${selectedPlan.durationDays} Days)` : `Store Enrollment Plan (${planDurationDays} Days)`,
          image: '/favicon.svg',
          order_id: order.id,
          prefill: {
            name: formData.bankDetails.accountHolder || user?.name,
            email: user?.email,
            contact: formData.phone || user?.phone,
          },
          theme: { color: '#0c2a5e' },
          handler: async (response) => {
            await finalizePayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              planId: selectedPlan?._id,
            });
          },
          modal: {
            ondismiss: () => {
              setSubmitting(false);
              info('Payment cancelled. Your store details are safely saved. You can pay anytime to submit for review.');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setPendingPlanOrder(order);
        setShowSimulatedModal(true);
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      error(err.response?.data?.message || err.message || 'Failed to initiate payment');
    } finally {
      setSubmitting(false);
    }
  };

  // Finalize Enrollment Fee Payment
  const finalizePayment = async (paymentDetails) => {
    try {
      setPaymentLoading(true);
      const res = await api.post('/vendors/verify-enrollment-payment', {
        ...paymentDetails,
        planId: selectedPlan?._id,
      });
      if (res.data?.success) {
        const planTitle = selectedPlan?.title || res.data.store?.activePlan?.title || 'Plan';
        success(`Payment of ₹${enrollmentFee} for "${planTitle}" received! Application submitted for Admin approval.`);
        setEnrollmentStatus('pending_admin_approval');
        if (res.data.store) {
          setExistingStore(res.data.store);
        }
        await refreshUser();
        await fetchStatus();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Payment verification failed');
    } finally {
      setPaymentLoading(false);
      setShowSimulatedModal(false);
    }
  };

  const handleSimulatedSuccess = async () => {
    await finalizePayment({
      razorpayOrderId: pendingPlanOrder?.id || `order_sim_${Date.now()}`,
      razorpayPaymentId: `pay_sim_${Date.now()}`,
      razorpaySignature: 'simulated_valid_signature',
      planId: selectedPlan?._id,
    });
  };

  if (pageLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <PageLoader text="Loading store setup details..." />
      </div>
    );
  }

  // Determine active step in onboarding lifecycle
  const isEmailVerified = user?.emailVerified !== false;
  const isDetailsAndFeePaid = ['pending_admin_approval', 'active'].includes(enrollmentStatus);
  const isStoreLive = enrollmentStatus === 'active';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 select-none">
      {/* Top Banner Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="flex justify-center mb-1">
          <Logo variant="vendor" size="lg" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold">
          <Store className="w-3.5 h-3.5 text-amber-600" />
          <span>SR Authorized Merchant Onboarding</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Store Setup &amp; Admin Enrollment
        </h1>
        <p className="text-xs sm:text-sm text-slate-600">
          Provide your store address, settlement bank details, and pay the platform enrollment fee to submit for Admin review.
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="flex items-center justify-center max-w-2xl mx-auto">
        <div className="flex items-center w-full">
          {/* Step 1: Email OTP */}
          <div className="flex flex-col items-center flex-1">
            <div className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-xs">
              ✓
            </div>
            <span className="text-[10px] font-bold text-slate-700 mt-1">1. Email Verified</span>
          </div>

          <div className="flex-1 h-1 rounded bg-emerald-600" />

          {/* Step 2: Store & Bank Setup */}
          <div className="flex flex-col items-center flex-1">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                isDetailsAndFeePaid || formStep === 2
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-[#0c2a5e] text-white shadow-xs'
              }`}
            >
              {isDetailsAndFeePaid || formStep === 2 ? '✓' : '2'}
            </div>
            <span className="text-[10px] font-bold text-slate-700 mt-1">2. Store &amp; Bank Info</span>
          </div>

          <div
            className={`flex-1 h-1 rounded transition-all ${
              isDetailsAndFeePaid || formStep === 2 ? 'bg-emerald-600' : 'bg-slate-200'
            }`}
          />

          {/* Step 3: Platform Plan Fee */}
          <div className="flex flex-col items-center flex-1">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                isDetailsAndFeePaid
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : formStep === 2
                  ? 'bg-[#0c2a5e] text-white shadow-xs animate-pulse ring-4 ring-blue-100'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {isDetailsAndFeePaid ? '✓' : '3'}
            </div>
            <span className="text-[10px] font-bold text-slate-700 mt-1">3. Select Plan &amp; Pay</span>
          </div>

          <div
            className={`flex-1 h-1 rounded ${
              isStoreLive ? 'bg-emerald-600' : 'bg-slate-200'
            }`}
          />

          {/* Step 4: Admin Approval */}
          <div className="flex flex-col items-center flex-1">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                isStoreLive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : enrollmentStatus === 'pending_admin_approval'
                  ? 'bg-amber-500 text-white animate-pulse shadow-xs'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {isStoreLive ? '✓' : '4'}
            </div>
            <span className="text-[10px] font-bold text-slate-700 mt-1">4. Admin Approval</span>
          </div>
        </div>
      </div>

      {/* =====================================================================
          STATE 1: PENDING ADMIN APPROVAL (Fee Paid, Waiting for Admin Review)
         ===================================================================== */}
      {enrollmentStatus === 'pending_admin_approval' && (
        <div className="bg-white p-8 sm:p-10 rounded-3xl border-2 border-amber-300 shadow-xl space-y-6 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
            <Clock className="w-8 h-8 animate-spin" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-black uppercase tracking-wider">
              <BadgeCheck className="w-4 h-4 text-amber-700" />
              <span>Fee Paid • Awaiting Admin Approval</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Application &amp; Payment Received!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              We have received your enrollment fee of <strong>₹{enrollmentFee}</strong>. Your store details, physical address, and settlement bank account are currently queued for administrator audit.
            </p>
          </div>

          {/* Payment Receipt & Submitted Store Summary */}
          <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/40 border border-slate-200 rounded-2xl text-left text-xs space-y-3 max-w-lg mx-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Enrollment Fee Status:</span>
              <span className="font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full text-xs">
                ✓ PAID ₹{enrollmentFee.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Chosen Membership Plan:</span>
              <span className="font-bold text-[#0c2a5e] bg-blue-100/70 px-2.5 py-0.5 rounded-full text-xs">
                {existingStore?.activePlan?.title || selectedPlan?.title || 'Platform Plan'} ({existingStore?.activePlan?.durationDays || planDurationDays} Days)
              </span>
            </div>
            {existingStore?.paymentDetails?.razorpayPaymentId && (
              <div className="flex items-center justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Payment ID:</span>
                <span className="font-mono font-bold text-slate-900">
                  {existingStore.paymentDetails.razorpayPaymentId}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Store Name:</span>
              <span className="font-bold text-slate-900">{existingStore?.storeName}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Store Category:</span>
              <span className="font-bold text-slate-900">{existingStore?.category}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Contact Phone:</span>
              <span className="font-mono font-bold text-slate-900">{existingStore?.phone}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-slate-200">
              <span className="text-slate-500 font-semibold">Dispatch Address:</span>
              <span className="text-right text-slate-800 font-medium">
                {existingStore?.address?.street}, {existingStore?.address?.city}, {existingStore?.address?.state} - {existingStore?.address?.zipCode}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 font-semibold">Settlement Bank:</span>
              <span className="font-mono font-bold text-slate-900">
                {existingStore?.bankDetails?.bankName} (IFSC: {existingStore?.bankDetails?.ifscCode})
              </span>
            </div>
          </div>

          {/* Compliance Review Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-[#0c2a5e] max-w-lg mx-auto text-left space-y-1">
            <p className="font-black flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0c2a5e]" />
              <span>What happens next?</span>
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Our compliance team is auditing your store dispatch address, settlement bank details, and KYC proofs. Once approved, your store will go live immediately and an official confirmation email will be dispatched to <strong>{existingStore?.email || user?.email}</strong>.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              type="button"
              id="refresh-approval-status-btn"
              onClick={() => fetchStatus(true)}
              disabled={checkingStatus}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingStatus ? 'animate-spin' : ''}`} />
              <span>{checkingStatus ? 'Checking Status...' : 'Check Approval Status'}</span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          STATE 2: ACTIVE STORE (Approved by Admin)
         ===================================================================== */}
      {enrollmentStatus === 'active' && (
        <div className="bg-white p-8 sm:p-10 rounded-3xl border-2 border-emerald-400 shadow-xl space-y-6 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div className="space-y-1">
            <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black uppercase tracking-wider">
              Store Approved &amp; Live
            </span>
            <h2 className="text-2xl font-black text-slate-900">Your Store is Fully Activated!</h2>
            <p className="text-xs text-slate-600">
              Admin has verified your store application and approved your merchant account. You can now manage your catalog, track shipments, and receive bank settlements.
            </p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-left text-xs text-emerald-900 space-y-1">
            <p className="font-bold">Store: {existingStore?.storeName}</p>
            {existingStore?.activePlan && (
              <p className="font-semibold text-emerald-800">
                Plan: {existingStore.activePlan.title} ({existingStore.activePlan.durationDays} Days)
              </p>
            )}
            <p className="text-[11px] text-emerald-800">
              Validity: Valid until{' '}
              {existingStore?.planExpiresAt
                ? new Date(existingStore.planExpiresAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '1 Year'}
            </p>
          </div>

          <Link
            to="/vendor/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#0c2a5e] hover:bg-[#153e85] text-white font-black text-sm shadow-md transition"
          >
            <span>Open Merchant Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* =====================================================================
          STATE 3: STORE SETUP FORM & PAYMENT
          (pending_payment, not_submitted, or rejected)
         ===================================================================== */}
      {(!enrollmentStatus ||
        enrollmentStatus === 'pending_payment' ||
        enrollmentStatus === 'not_submitted' ||
        enrollmentStatus === 'rejected') && (
        <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-xl space-y-8">
          {enrollmentStatus === 'rejected' && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Application Needs Revision</span>
              </p>
              <p className="text-[11px] text-rose-700">
                Reason from Admin: {existingStore?.adminNotes || 'Please correct your details and re-submit.'}
              </p>
            </div>
          )}

          {/* Form Step Navigation Tabs */}
          <div className="flex border-b border-slate-200 gap-2 sm:gap-6 pb-2">
            <button
              type="button"
              onClick={() => setFormStep(1)}
              className={`pb-2 px-3 text-xs sm:text-sm font-black border-b-2 transition flex items-center gap-2 cursor-pointer ${
                formStep === 1
                  ? 'border-[#0c2a5e] text-[#0c2a5e]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  formStep === 1 ? 'bg-[#0c2a5e] text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                1
              </div>
              <span>Store Profile &amp; Settlement Bank</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (validateStoreDetails()) {
                  setFormStep(2);
                }
              }}
              className={`pb-2 px-3 text-xs sm:text-sm font-black border-b-2 transition flex items-center gap-2 cursor-pointer ${
                formStep === 2
                  ? 'border-[#0c2a5e] text-[#0c2a5e]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                  formStep === 2 ? 'bg-[#0c2a5e] text-white' : 'bg-slate-200 text-slate-700'
                }`}
              >
                2
              </div>
              <span>Choose Membership Plan &amp; Pay</span>
            </button>
          </div>

          {formStep === 1 && (
            <div className="space-y-8 animate-fadeIn">
              {/* Header Action: Auto-fill Demo Data */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900">Merchant Store Setup &amp; Bank Settlement</h2>
                  <p className="text-xs text-slate-500">
                    Step 2 of 4: Enter store profile, physical dispatch address, and settlement bank details.
                  </p>
                </div>
                <button
                  type="button"
                  id="fill-demo-store-data-btn"
                  onClick={handleFillDemoData}
                  className="text-xs font-bold text-[#0c2a5e] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Auto-Fill Demo Details</span>
                </button>
              </div>

              {/* Section 1: Store Profile Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                  <Building className="w-4 h-4 text-[#0c2a5e]" />
              <span>1. Store Profile &amp; Contact Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Store Name *</label>
                <input
                  type="text"
                  id="store-name-input"
                  name="storeName"
                  required
                  placeholder="e.g. Sri Lakshmi Electronics & Spares"
                  value={formData.storeName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Store Department / Category *</label>
                <select
                  name="category"
                  id="store-category-select"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                >
                  <option value="Electronics">Electronics &amp; Appliances</option>
                  <option value="Furniture">Furniture &amp; Living</option>
                  <option value="Grocery">Grocery &amp; Daily Staples</option>
                  <option value="Fashion">Fashion &amp; Clothing</option>
                  <option value="Footwear">Footwear &amp; Accessories</option>
                  <option value="Beauty">Beauty, Cosmetics &amp; Health</option>
                  <option value="Jewelry">Jewelry &amp; Watches</option>
                  <option value="General">Multi-Category Store</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Business Contact Phone *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    id="store-phone-input"
                    name="phone"
                    required
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Alternate / WhatsApp Phone (Optional)</label>
                <input
                  type="tel"
                  id="store-alt-phone-input"
                  name="alternatePhone"
                  placeholder="e.g. 9848012345"
                  value={formData.alternatePhone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Store Description / About the Shop</label>
              <textarea
                name="description"
                id="store-description-input"
                rows={2}
                placeholder="Describe your catalog, product warranty, and fulfillment assurances..."
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
              />
            </div>
          </div>

          {/* Section 2: Store Physical Dispatch Address */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm font-black text-slate-900">
              <MapPin className="w-4 h-4 text-[#0c2a5e]" />
              <span>2. Store Physical Address &amp; Dispatch Hub</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Shop / Building / Street Address *</label>
                <input
                  type="text"
                  id="store-street-input"
                  name="street"
                  required
                  placeholder="e.g. Shop 14, Commercial Market, Main Road"
                  value={formData.address.street}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nearby Landmark (Optional)</label>
                <input
                  type="text"
                  id="store-landmark-input"
                  name="landmark"
                  placeholder="e.g. Near Clock Tower"
                  value={formData.address.landmark}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">City / Town *</label>
                <input
                  type="text"
                  id="store-city-input"
                  name="city"
                  required
                  placeholder="e.g. Bhimavaram"
                  value={formData.address.city}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">State *</label>
                <select
                  name="state"
                  id="store-state-input"
                  required
                  value={formData.address.state}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">PIN Code *</label>
                <input
                  type="text"
                  id="store-zip-input"
                  name="zipCode"
                  required
                  maxLength={6}
                  placeholder="e.g. 534201"
                  value={formData.address.zipCode}
                  onChange={handleAddressChange}
                  className="w-full px-3 py-2.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Settlement Bank Details */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                <CreditCard className="w-4 h-4 text-[#0c2a5e]" />
                <span>3. Settlement Bank Account Details</span>
              </div>
              <p className="text-xs text-slate-500">
                Direct payouts from completed orders and referral bonuses will be credited to this verified account.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Beneficiary Account Holder Name *</label>
                <input
                  type="text"
                  id="bank-holder-input"
                  name="accountHolder"
                  required
                  placeholder="As per bank passbook"
                  value={formData.bankDetails.accountHolder}
                  onChange={handleBankChange}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Bank Name *</label>
                <select
                  name="bankName"
                  id="bank-name-input"
                  value={formData.bankDetails.bankName}
                  onChange={handleBankChange}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="Other Bank">Other Bank</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Bank Account Number *</label>
                <input
                  type="text"
                  id="bank-account-input"
                  name="accountNumber"
                  required
                  placeholder="e.g. 987654321012"
                  value={formData.bankDetails.accountNumber}
                  onChange={handleBankChange}
                  className="w-full px-3 py-2.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Confirm Account Number *</label>
                <input
                  type="text"
                  id="bank-account-confirm-input"
                  name="confirmAccountNumber"
                  required
                  placeholder="Re-enter bank account number"
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm font-mono bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Bank IFSC Code *</label>
                <input
                  type="text"
                  id="bank-ifsc-input"
                  name="ifscCode"
                  required
                  maxLength={11}
                  placeholder="e.g. SBIN0001234"
                  value={formData.bankDetails.ifscCode}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase();
                    handleBankChange(e);
                  }}
                  className="w-full px-3 py-2.5 text-sm font-mono uppercase bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">UPI ID for Quick Payouts (Optional)</label>
                <input
                  type="text"
                  id="bank-upi-input"
                  name="upiId"
                  placeholder="e.g. merchant@oksbi"
                  value={formData.bankDetails.upiId}
                  onChange={handleBankChange}
                  className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0c2a5e]"
                />
              </div>
            </div>
          </div>

              {/* Step 1 Primary CTA */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-slate-500">
                  Next step: Choose from the membership plans created by platform administration.
                </p>
                <button
                  type="button"
                  id="proceed-to-plans-btn"
                  onClick={handleProceedToPlans}
                  disabled={submitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#0c2a5e] to-[#174896] hover:from-[#092048] hover:to-[#123875] text-white font-black text-sm shadow-xl transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-400"
                >
                  {submitting ? (
                    <span>Saving Store Details...</span>
                  ) : (
                    <>
                      <span>Proceed to Plan Selection &amp; Payment</span>
                      <ArrowRight className="w-4 h-4 text-amber-300" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {formStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Step 2 Header Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setFormStep(1)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0c2a5e] hover:text-[#184a96] transition cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Store &amp; Bank Profile</span>
                </button>
                <span className="text-xs text-slate-500 font-semibold">
                  Step 3 of 4: Select Store Membership Plan
                </span>
              </div>

              {/* Store Profile Review Banner */}
              <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm font-black text-slate-900">{formData.storeName || 'Store'}</strong>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#0c2a5e]">
                      {formData.category}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    Dispatch: {formData.address.city}, {formData.address.state} • Bank: {formData.bankDetails.bankName} (****{formData.bankDetails.accountNumber ? formData.bankDetails.accountNumber.slice(-4) : '****'})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormStep(1)}
                  className="text-xs font-bold text-[#0c2a5e] hover:underline cursor-pointer flex-shrink-0"
                >
                  Edit Details
                </button>
              </div>

              {/* Section 4: Platform Enrollment Membership Plans Created by Admin */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 text-sm font-black text-slate-900">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Choose Membership Plan (Configured by Admin)</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500">
                    Choose a plan to activate your store upon Admin approval
                  </span>
                </div>

                {plansLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-44 rounded-2xl bg-slate-100 border border-slate-200 animate-pulse"
                      />
                    ))}
                  </div>
                ) : plans.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plans.map((plan) => {
                      const isSelected = selectedPlan?._id === plan._id;
                      return (
                        <div
                          key={plan._id}
                          onClick={() => handleSelectPlan(plan)}
                          className={`relative rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-2 border-[#0c2a5e] bg-gradient-to-br from-blue-50/90 via-slate-50 to-indigo-50/50 shadow-md ring-2 ring-[#0c2a5e]/20 scale-[1.01]'
                              : 'border border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                          }`}
                        >
                          {/* Top Header with Radio Indicator and Badge */}
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition ${
                                    isSelected
                                      ? 'border-[#0c2a5e] bg-[#0c2a5e] text-white'
                                      : 'border-slate-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <h4 className="text-base font-black text-slate-900 capitalize">
                                  {plan.title}
                                </h4>
                              </div>

                              {plan.badge ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
                                  {plan.badge}
                                </span>
                              ) : isSelected ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#0c2a5e]">
                                  Selected
                                </span>
                              ) : null}
                            </div>

                            {/* Price and Validity */}
                            <div className="pt-1">
                              <div className="flex items-baseline gap-1">
                                <span className="text-2xl sm:text-3xl font-black text-[#0c2a5e]">
                                  ₹{plan.price.toLocaleString('en-IN')}
                                </span>
                                <span className="text-xs text-slate-500 font-bold">
                                  / {plan.durationDays} Days
                                </span>
                              </div>
                              <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mt-1">
                                <Clock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                <span>Validity: {plan.durationDays} Days ({formatDurationDays(plan.durationDays)})</span>
                              </div>
                            </div>

                            {/* Description if present */}
                            {plan.description && (
                              <p className="text-xs text-slate-600 line-clamp-2">
                                {plan.description}
                              </p>
                            )}

                            {/* Features list */}
                            <div className="pt-2 border-t border-slate-200/80 space-y-1.5 text-xs text-slate-700">
                              {plan.features && plan.features.length > 0 ? (
                                plan.features.map((feat, idx) => (
                                  <div key={idx} className="flex items-start gap-1.5">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-[11px] leading-tight">{feat}</span>
                                  </div>
                                ))
                              ) : (
                                <>
                                  <div className="flex items-start gap-1.5">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-[11px] leading-tight">Unlimited Product Catalog &amp; Inventory</span>
                                  </div>
                                  <div className="flex items-start gap-1.5">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-[11px] leading-tight">Public Storefront with Verified Merchant Trust Badge</span>
                                  </div>
                                  <div className="flex items-start gap-1.5">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-[11px] leading-tight">Direct Customer Orders &amp; Direct Bank Settlements</span>
                                  </div>
                                  <div className="flex items-start gap-1.5">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                    <span className="text-[11px] leading-tight">Earn ₹500 Instant Referral Bonus on Merchant Invites</span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Selected State Marker Button */}
                          <div className="pt-3 mt-3 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectPlan(plan);
                              }}
                              className={`w-full py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-[#0c2a5e] text-white'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Plan Selected</span>
                                </>
                              ) : (
                                <span>Choose This Plan</span>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
                    <p className="font-bold">Standard Platform Enrollment Plan</p>
                    <p>Fee: ₹{enrollmentFee} (Validity: {planDurationDays} Days)</p>
                  </div>
                )}
              </div>

              {/* Primary Action Button: Pay & Submit */}
              <div className="pt-2">
                <button
                  type="button"
                  id="pay-and-submit-merchant-btn"
                  onClick={handleInitiatePayment}
                  disabled={submitting || paymentLoading}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#0c2a5e] to-[#174896] hover:from-[#092048] hover:to-[#123875] text-white font-black text-sm shadow-xl transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-400"
                >
                  {submitting || paymentLoading ? (
                    <span>Opening Razorpay Payment Gateway...</span>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 text-amber-300" />
                      <span>
                        Pay ₹{enrollmentFee.toLocaleString('en-IN')}{selectedPlan ? ` for ${selectedPlan.title}` : ''} via Razorpay &amp; Submit for Admin Approval
                      </span>
                      <ArrowRight className="w-4 h-4 text-amber-300" />
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-slate-500 mt-2">
                  Note: Until the enrollment fee is paid, your store will not be visible in Admin Vendor Requests. Once paid, the Admin will review and activate your store.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simulated Razorpay Test Checkout Modal (fallback for test keys) */}
      {showSimulatedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 rounded-3xl border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#0c2a5e]" />
                <h3 className="font-black text-slate-900 text-sm">Razorpay Vendor Enrollment</h3>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#0c2a5e] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Payment Gateway
              </span>
            </div>

            <div className="space-y-2 text-center py-2">
              <p className="text-xs text-slate-500">Paying Store Enrollment Fee for:</p>
              <h4 className="font-black text-slate-900 text-base">{formData.storeName || 'Store'}</h4>
              <p className="text-xs font-bold text-[#0c2a5e] bg-blue-50 inline-block px-3 py-1 rounded-full border border-blue-200">
                {selectedPlan?.title || 'Selected Membership Plan'}
              </p>
              <div className="text-4xl font-black text-[#0c2a5e]">
                ₹{enrollmentFee.toLocaleString('en-IN')}
              </div>
              <p className="text-xs text-slate-500">
                Plan Validity: <strong>{planDurationDays} Days ({formatDurationDays(planDurationDays)})</strong>
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Store Address:</span>
                <span className="font-bold text-slate-900">{formData.address.city}, {formData.address.state}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank Account:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formData.bankDetails.bankName} (****{formData.bankDetails.accountNumber.slice(-4)})
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSimulatedModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-test-payment-btn"
                onClick={handleSimulatedSuccess}
                disabled={paymentLoading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-sm cursor-pointer disabled:bg-slate-300"
              >
                {paymentLoading ? 'Verifying...' : `Pay ₹${enrollmentFee} & Submit`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorRegister;
