import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Building2,
  Headphones,
  Store,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const Contact = () => {
  const { success, error } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    inquiryType: 'Customer Support',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      error('Please complete your name, email, and message.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/contact', formData);
      if (res.data?.success) {
        success(res.data.message || 'Inquiry submitted successfully!');
        setSubmitted(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          inquiryType: 'Customer Support',
          message: '',
        });
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to send message. Please try again or call our support line.');
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      q: 'How does merchant registration and store approval work?',
      a: 'Merchants register on our platform by submitting mandatory KYC proofs (12-digit Aadhaar Number + scanned document and 10-character PAN Number + scanned document). Once Admin inspects and approves the store and the enrollment fee is paid via Razorpay, your official store is published on the public panel and your Merchant Dashboard is unlocked.',
    },
    {
      q: 'When is the ₹500 merchant referral bonus credited?',
      a: 'When an existing merchant refers another seller using their unique referral code, as soon as the platform Admin verifies the KYC documents and approves the referred store, the ₹500 referral reward is automatically credited directly to the referring merchant’s wallet balance.',
    },
    {
      q: 'How long does a merchant store remain active?',
      a: 'The store remains visible on the public storefront and the merchant retains full dashboard selling access strictly for the paid plan validity duration (e.g., 365 days / 1 year set by platform administration). Merchants can renew anytime to keep their catalog live.',
    },
    {
      q: 'How do customers track orders and deliveries?',
      a: 'Customers can view active shipments in the "My Orders" tab with real-time status updates (Processing, Dispatched, Out for Delivery, Delivered). Each order is covered under Amezon.online Escrow Protection.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 font-sans select-none">
      {/* Hero Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0c2a5e] text-xs font-black uppercase tracking-wider">
          <Headphones className="w-3.5 h-3.5 text-blue-600" />
          <span>Helpdesk &amp; Partner Inquiries</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          We’re Here to Support <span className="text-[#0c2a5e]">Your Journey</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Have questions about an order, merchant onboarding, KYC verification, or wallet settlements? Our Bhimavaram support desk is ready to assist you.
        </p>
      </div>

      {/* 4 Contact Channels Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bright-card p-6 rounded-2xl space-y-3 border-slate-200 hover:border-blue-300 transition shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-black text-slate-900">Headquarters Address</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Amezon Commercial Complex, Main Road, Bhimavaram, West Godavari District, Andhra Pradesh – 534201, India.
          </p>
          <div className="pt-2 text-[11px] font-bold text-blue-700">Open for physical inquiries</div>
        </div>

        <div className="bright-card p-6 rounded-2xl space-y-3 border-slate-200 hover:border-blue-300 transition shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-black text-slate-900">Phone Support</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Direct Line: <strong className="text-slate-800">+91 98765 43210</strong><br />
            Landline: <strong className="text-slate-800">08816 220011</strong>
          </p>
          <div className="pt-2 text-[11px] font-bold text-emerald-700">Mon - Sat: 9:00 AM – 7:00 PM IST</div>
        </div>

        <div className="bright-card p-6 rounded-2xl space-y-3 border-slate-200 hover:border-blue-300 transition shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-black text-slate-900">Email Inquiries</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Customer Care: <strong className="text-slate-800">support@amezon.online</strong><br />
            Merchant Team: <strong className="text-slate-800">partners@amezon.online</strong>
          </p>
          <div className="pt-2 text-[11px] font-bold text-amber-700">Response SLA: 2–4 Hours</div>
        </div>

        <div className="bright-card p-6 rounded-2xl space-y-3 border-slate-200 hover:border-blue-300 transition shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-sm font-black text-slate-900">Grievance &amp; Compliance</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Officer: N. Venkat Rao<br />
            Email: <strong className="text-slate-800">grievance@amezon.online</strong>
          </p>
          <div className="pt-2 text-[11px] font-bold text-purple-700">Statutory IT Act 2000 Compliance</div>
        </div>
      </div>

      {/* Main Form & Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Contact Form Card */}
        <div className="lg:col-span-7 bright-card p-6 sm:p-8 rounded-3xl border-slate-200 shadow-sm space-y-6">
          <div>
            <span className="text-[11px] font-black uppercase text-blue-600 tracking-wider">Fast Response</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Send Us a Message
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Fill out the form below. We will dispatch a confirmation email and connect you with the appropriate department.
            </p>
          </div>

          {submitted && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                Thank you! Your inquiry has been dispatched to our support team and an automated acknowledgment was emailed to your inbox.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Varma"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ramesh@example.com"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Inquiry Category</label>
                <select
                  name="inquiryType"
                  value={formData.inquiryType}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium cursor-pointer"
                >
                  <option value="Customer Support">Customer Support / Order Help</option>
                  <option value="Merchant Enrollment">Merchant Enrollment &amp; Registration</option>
                  <option value="KYC & Documents">KYC Documents Verification (Aadhaar &amp; PAN)</option>
                  <option value="Payments & Refunds">Payments &amp; Refunds</option>
                  <option value="Referral & Wallet">Referral Program &amp; Wallet Settlement</option>
                  <option value="Grievance">Grievance &amp; Compliance Escalation</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Brief summary of your question"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Your Message *</label>
              <textarea
                name="message"
                required
                rows={4}
                value={formData.message}
                onChange={handleChange}
                placeholder="Provide detailed information regarding your inquiry..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium resize-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-xl bg-[#0c2a5e] hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:bg-slate-400"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Transmitting Message...' : 'Submit Inquiry'}</span>
            </button>
          </form>
        </div>

        {/* Operational Map & Operating Hours */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bright-card p-6 rounded-3xl border-slate-200 space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-600 shrink-0" />
              <h2 className="text-base font-black text-slate-900">Bhimavaram Headquarters</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Situated in the commercial hub of Bhimavaram, AP, our physical center handles marketplace operations, merchant KYC approvals, and regional logistics coordination.
            </p>

            {/* Map Embed Container */}
            <div className="w-full h-56 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 relative">
              <iframe
                title="Amezon Headquarters Bhimavaram"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3824.238644342416!2d81.52187687593683!3d16.544372984209593!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a36254421b56951%3A0xb35a0f1e8432360!2sBhimavaram%2C%20Andhra%20Pradesh!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                className="w-full h-full border-0"
                loading="lazy"
                allowFullScreen=""
              ></iframe>
            </div>

            <div className="pt-2 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Visiting Hours: 10:00 AM – 5:00 PM</span>
              </span>
              <span className="text-[#0c2a5e] font-bold">AP – 534201</span>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0c2a5e] to-blue-900 text-white space-y-3 shadow-md">
            <div className="flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-black text-white">Merchant Enrollment Queries?</h2>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed">
              Need assistance uploading your Aadhaar &amp; PAN proofs or understanding platform listing durations? Our dedicated vendor relationship managers can guide you.
            </p>
            <div className="pt-2">
              <a
                href="mailto:partners@amezon.online"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white transition"
              >
                <span>Email Vendor Relations Desk →</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bright-card p-8 rounded-3xl border-slate-200 space-y-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 cursor-pointer hover:bg-blue-50/50 transition"
              onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-bold text-slate-900">{item.q}</h3>
                <span className="text-slate-400 font-mono text-sm">{openFaq === idx ? '−' : '+'}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Contact;
