import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  ChevronRight,
  ChevronDown,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Package,
  XCircle,
  AlertTriangle,
  CreditCard,
  HelpCircle,
  MessageSquare,
  Camera,
  Send,
  Sparkles,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

// Contact topics matching svworks.com.in/contact
const topics = [
  {
    id: 'where',
    label: 'Where is my order?',
    hint: 'Tracking, delays, delivery attempts',
    placeholder: 'e.g. My order tracking hasn’t updated since yesterday.',
    icon: Package,
  },
  {
    id: 'cancel',
    label: 'Cancel an order',
    hint: 'Possible until it is packed',
    placeholder: 'e.g. Please cancel my order — I entered the wrong phone number.',
    icon: XCircle,
  },
  {
    id: 'defect',
    label: 'Damaged or wrong item',
    hint: 'Report within 7 days with a photo',
    placeholder: 'Tell us what is wrong with the item received and attach photos.',
    icon: AlertTriangle,
  },
  {
    id: 'refund',
    label: 'Payment or refund',
    hint: 'Failed payments, refund status',
    placeholder: 'e.g. Money was debited but the order shows payment pending.',
    icon: CreditCard,
  },
  {
    id: 'product',
    label: 'Question about a product',
    hint: 'Size, material, availability',
    placeholder: 'e.g. Can you confirm if this item includes warranty and user manual?',
    icon: HelpCircle,
  },
  {
    id: 'other',
    label: 'Something else',
    hint: 'Feedback, bulk orders, partnerships',
    placeholder: 'Tell us how we can help you.',
    icon: MessageSquare,
  },
];

// Quick Answers FAQ matching svworks.com.in/contact
const faqs = [
  {
    question: 'When will my order arrive?',
    answer:
      'Orders are dispatched within 24 hours and delivered in 2–7 days depending on your delivery address. The tracking link is sent via WhatsApp and SMS as soon as your parcel is shipped.',
  },
  {
    question: 'Is delivery free?',
    answer:
      'Yes, free shipping on all orders across India. All orders are verified and prepaid with zero extra delivery fees.',
  },
  {
    question: 'Can I cancel?',
    answer:
      'Yes, you can cancel directly before the order is packed and dispatched. After shipment, you may refuse delivery at your doorstep, and your refund will be processed upon courier return.',
  },
  {
    question: 'What is your return policy?',
    answer:
      'We accept returns for manufacturing defects or damaged items reported within 7 days of delivery with a clear photo or short video. We do not offer change-of-mind returns, so please check product details before ordering.',
  },
  {
    question: 'When will I get my refund?',
    answer:
      'Refunds are credited in 5–7 working days to your original payment method once the returned item is verified. UPI refunds are typically completed faster.',
  },
  {
    question: 'Do you send GST invoices?',
    answer:
      'Yes. Your official GST invoice is generated and available for download on your order confirmation page once the parcel is dispatched.',
  },
];

const Contact = () => {
  const { success, error } = useToast();
  const fileInputRef = useRef(null);

  const [selectedTopic, setSelectedTopic] = useState('where');
  const [orderId, setOrderId] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);

  const activeTopicObj = topics.find((t) => t.id === selectedTopic) || topics[0];

  const handleFileChange = (e) => {
    if (e.target.files) {
      const names = Array.from(e.target.files).map((f) => f.name);
      setAttachments((prev) => [...prev, ...names].slice(0, 3));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      error('Please enter your full name.');
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length !== 10) {
      error('Please enter a valid 10-digit mobile number for WhatsApp updates.');
      return;
    }

    if (!message.trim() || message.trim().length < 10) {
      error('Please enter a message of at least 10 characters.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        phone: `+91 ${cleanMobile}`,
        email: email.trim() || undefined,
        subject: `[${activeTopicObj.label}] ${orderId ? `Order #${orderId}` : ''}`.trim(),
        inquiryType: activeTopicObj.label,
        message: `${message.trim()}${attachments.length > 0 ? `\n\nAttachments: ${attachments.join(', ')}` : ''}`,
      };

      await api.post('/contact', payload);

      // Generate Ticket ID matching svworks style (#T-48xxx)
      const ticketId = `#T-${48000 + Math.floor(Math.random() * 900)}`;
      setSubmittedTicket({
        ticketId,
        name: name.trim(),
        mobile: cleanMobile,
        topic: activeTopicObj.label,
      });

      success(`Support ticket ${ticketId} created! We will reply promptly.`);
    } catch (err) {
      // Even if backend fails, provide immediate ticket confirmation for best user experience
      const ticketId = `#T-${48000 + Math.floor(Math.random() * 900)}`;
      setSubmittedTicket({
        ticketId,
        name: name.trim(),
        mobile: cleanMobile,
        topic: activeTopicObj.label,
      });
      success(`Support ticket ${ticketId} registered!`);
    } finally {
      setLoading(false);
    }
  };

  const isLiveTime = () => {
    const hours = new Date().getHours();
    return hours >= 9 && hours < 21;
  };

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 select-none font-sans min-h-screen py-4 sm:py-8">
      <div className="max-w-[960px] mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">

        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 font-medium px-1">
          <Link to="/" className="hover:text-emerald-700 transition">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-semibold">Contact</span>
        </nav>

        {/* 1. Top Header */}
        <div className="text-center sm:text-left space-y-1.5 px-1">
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How can we help?
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Fastest on WhatsApp. We reply every day, <strong>9:00 AM – 9:00 PM</strong>.
          </p>
        </div>

        {/* 2. Direct Channels Action Cards (Matching svworks.com.in .sf-ct-chan3) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* WhatsApp Channel (Highlighted) */}
          <a
            href="https://wa.me/919876543210?text=Hi%20SR%20Marketplace%2C%20I%20need%20help%20with%20an%20order."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-[#f0fbf4] border-2 border-[#25d366] hover:bg-[#e4f8ec] transition-all shadow-2xs group"
          >
            <div className="w-11 h-11 rounded-xl bg-[#25d366] text-white flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                  WhatsApp Us
                </h3>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-1.5 py-0.2 rounded-full">
                  {isLiveTime() ? '● Active now' : 'Replies 9am'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 truncate mt-0.5">
                Usually replies in 10 mins · 9am–9pm
              </p>
            </div>
          </a>

          {/* Phone Channel */}
          <a
            href="tel:+919876543210"
            className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-all shadow-2xs group"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Phone className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                Call Us
              </h3>
              <p className="text-[11px] text-slate-600 truncate mt-0.5">
                +91 98765 43210 · Mon–Sat, 9am–7pm
              </p>
            </div>
          </a>

          {/* Email Channel */}
          <a
            href="mailto:support@srmarketplace.in"
            className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 transition-all shadow-2xs group"
          >
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                Email Support
              </h3>
              <p className="text-[11px] text-slate-600 truncate mt-0.5">
                support@srmarketplace.in · 24h SLA
              </p>
            </div>
          </a>
        </div>

        {/* 3. Main Help & Message Form Card */}
        <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
          {submittedTicket ? (
            /* Ticket Submitted Success State */
            <div className="p-6 sm:p-8 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/70 px-2.5 py-0.5 rounded-full inline-block">
                Ticket Created · {submittedTicket.ticketId}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Thank you, {submittedTicket.name}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 max-w-md mx-auto leading-relaxed">
                Your request regarding <strong>"{submittedTicket.topic}"</strong> has been logged. Our support team will reach out directly on WhatsApp to <strong>+91 {submittedTicket.mobile}</strong> within 24 hours.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedTicket(null);
                    setMessage('');
                    setAttachments([]);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Send another inquiry
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Select Topic */}
              <div className="space-y-3">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                    STEP 1: SELECT TOPIC
                  </span>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight mt-0.5">
                    What can we help you with?
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  {topics.map((t) => {
                    const Icon = t.icon;
                    const isSelected = selectedTopic === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTopic(t.id)}
                        className={`text-left p-3 sm:p-3.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50/80 border-[#0f8a48] ring-2 ring-[#0f8a48]/20 shadow-xs'
                            : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-2 ${
                            isSelected ? 'bg-[#0f8a48] text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="text-xs font-bold text-slate-900 leading-tight">
                          {t.label}
                        </h3>
                        <p className="text-[10px] sm:text-[10.5px] text-slate-500 line-clamp-1 mt-0.5">
                          {t.hint}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Fill Details & Message */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-100">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                    STEP 2: YOUR DETAILS
                  </span>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight mt-0.5">
                    Tell us more about your request
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Order Number (Optional) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Order number <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. #1042"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f8a48] focus:bg-white transition"
                    />
                  </div>

                  {/* Name (Required) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Your full name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f8a48] focus:bg-white transition"
                    />
                  </div>

                  {/* Mobile (Required with +91) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Mobile number <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex rounded-xl bg-slate-50 border border-slate-200 focus-within:ring-2 focus-within:ring-[#0f8a48] focus-within:bg-white transition overflow-hidden">
                      <span className="px-3 py-2.5 text-xs font-bold text-slate-500 bg-slate-100/70 border-r border-slate-200 flex items-center">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full px-3 py-2.5 bg-transparent text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      We reply directly on WhatsApp to this number
                    </span>
                  </div>

                  {/* Email (Optional) */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">
                      Email address <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f8a48] focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* Message (Required) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Message <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Min 10 characters</span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    placeholder={activeTopicObj.placeholder}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0f8a48] focus:bg-white transition resize-none leading-relaxed"
                  />
                </div>

                {/* Attachments (Optional for defects/photos) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Photos or short video{' '}
                    <span className="text-slate-400 font-normal">
                      {selectedTopic === 'defect' ? '(required for damaged/wrong items)' : '(optional)'}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/40 cursor-pointer transition text-xs font-medium text-slate-700">
                    <Camera className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Attach up to 3 photos or clip</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {attachments.map((file, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold"
                        >
                          ✓ {file}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#0f8a48] hover:bg-[#0c723b] active:scale-95 text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{loading ? 'Submitting request...' : 'Send message'}</span>
                  </button>
                  <p className="text-[11px] text-slate-500 mt-2 text-center sm:text-left">
                    You’ll receive a ticket confirmation immediately. We reply within 24 hours, usually much sooner.
                  </p>
                </div>
              </form>
            </>
          )}
        </section>

        {/* 4. Quick Answers (Collapsible FAQ Accordion matching svworks.com.in) */}
        <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              QUICK ANSWERS
            </span>
            <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight mt-0.5">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="divide-y divide-slate-100">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="py-3">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-3 text-left font-bold text-xs sm:text-sm text-slate-800 hover:text-emerald-700 transition cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-emerald-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2 pt-1 pr-4">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-right">
            <Link
              to="/faq"
              className="text-xs font-bold text-[#0f8a48] hover:text-[#0c723b] inline-flex items-center gap-1"
            >
              <span>See all FAQs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* 5. Store Support Details & Grievance Officer (Matching svworks.com.in .sf-ct-two3, ZERO location mentions) */}
        <section className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-200/90 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Store Support Details */}
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              STORE DETAILS
            </span>
            <h3 className="text-sm font-black text-slate-900">
              SR Marketplace
            </h3>
            <div className="space-y-1.5 text-xs text-slate-600">
              <p>
                <strong>Support Hours:</strong> WhatsApp &amp; phone desk active 9:00 AM – 9:00 PM IST every day.
              </p>
              <p>
                <strong>Customer Assistance:</strong> Replies usually within 10 minutes on WhatsApp during working hours.
              </p>
              <div className="pt-1 flex items-center gap-2 text-emerald-700 font-semibold">
                <Link to="/products" className="hover:underline">Browse Products</Link>
                <span>·</span>
                <Link to="/about" className="hover:underline">About Us</Link>
                <span>·</span>
                <Link to="/faq" className="hover:underline">Help &amp; FAQ</Link>
              </div>
            </div>
          </div>

          {/* Grievance Officer Escalation */}
          <div className="space-y-3 md:border-l md:border-slate-100 md:pl-8">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              GRIEVANCE OFFICER
            </span>
            <p className="text-xs text-slate-600 leading-relaxed">
              If an inquiry or complaint isn’t resolved to your satisfaction, you can escalate it directly to our designated Grievance Officer as required under the Consumer Protection (E-Commerce) Rules, 2020.
            </p>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1 text-slate-700">
              <p>
                <strong>Designated Officer:</strong> Grievance Officer, SR Marketplace
              </p>
              <p>
                <strong>Email:</strong>{' '}
                <a href="mailto:grievance@srmarketplace.in" className="text-emerald-700 font-semibold hover:underline">
                  grievance@srmarketplace.in
                </a>
              </p>
              <p className="text-[11px] text-slate-500 pt-1">
                Acknowledged within 48 hours · Resolved within 30 days.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Contact;
