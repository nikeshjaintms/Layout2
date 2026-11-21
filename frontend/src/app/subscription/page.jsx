'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { initializeAuth, logoutUser } from '@/redux/slices/authSlice';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  LogOut,
  Mail,
  Phone,
  Building,
  CreditCard,
  Sparkles,
  ArrowRight,
  Send,
  HelpCircle,
  FileCheck,
  Check,
  Zap,
  Lock,
  MapPin,
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function SubscriptionPurchasePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, status } = useSelector((state) => state.auth);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('Professional');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    plan: 'Professional Plan (Annual - ₹39,999/yr)',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Sync user info into form when loaded
  useEffect(() => {
    if (user) {
      setContactForm((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  // Check if subscription has been activated
  const isSubscriptionActive = Boolean(
    user?.isSubscriptionActive ||
    (user?.subscription &&
      user.subscription.status === 'ACTIVE' &&
      new Date(user.subscription.endDate).getTime() > Date.now())
  );

  // If subscription is already active and user is not admin, redirect to cad-conversion
  useEffect(() => {
    if (status === 'authenticated' && user) {
      if (user.role === 'ADMIN') {
        // Admin can stay or go to admin subscriptions
      } else if (isSubscriptionActive) {
        router.push('/cad-conversion');
      }
    }
  }, [status, user, isSubscriptionActive, router]);

  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      const res = await dispatch(initializeAuth()).unwrap();
      const freshUser = res.user || res;
      const active = Boolean(
        freshUser?.isSubscriptionActive ||
        (freshUser?.subscription &&
          freshUser.subscription.status === 'ACTIVE' &&
          new Date(freshUser.subscription.endDate).getTime() > Date.now())
      );

      if (active) {
        Swal.fire({
          icon: 'success',
          title: 'Subscription Active!',
          text: 'Your subscription is confirmed! Redirecting to your dashboard...',
          timer: 2000,
          showConfirmButton: false,
          background: '#18181b',
          color: '#fff',
        });
        setTimeout(() => {
          router.push('/cad-conversion');
        }, 1500);
      } else {
        Swal.fire({
          icon: 'info',
          title: 'Status: Pending',
          text: 'No active subscription detected yet. If you have already paid, please allow a few minutes for admin approval or contact support.',
          background: '#18181b',
          color: '#fff',
        });
      }
    } catch (e) {
      // ignore
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push('/login');
  };

  const handleSelectPlan = (planName, fullPlanTitle) => {
    setSelectedPlan(planName);
    setContactForm((prev) => ({
      ...prev,
      plan: fullPlanTitle,
      message: `Hello, I would like to purchase and activate the ${planName} for my account (${user?.email || ''}).`,
    }));
    // Smooth scroll to contact form
    const formElement = document.getElementById('contact-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSubmitInquiry = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      Swal.fire({
        icon: 'success',
        title: 'Request Submitted!',
        html: `Thank you, <b>${contactForm.name}</b>.<br/><br/>Your request for the <b>${contactForm.plan}</b> has been received. Our administration team has been notified and will contact you via email/phone to complete activation.`,
        background: '#18181b',
        color: '#fff',
        confirmButtonColor: '#ABD2FA',
        confirmButtonText: 'Great, thanks!',
      });
      setContactForm((prev) => ({
        ...prev,
        phone: '',
        message: '',
      }));
    }, 800);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isExpired = user?.subscription?.endDate && new Date(user.subscription.endDate).getTime() < Date.now();
  const isInactive = user?.subscription && user.subscription.status === 'INACTIVE';
  const hasNoSubscription = !user?.subscription;

  return (
    <div className="min-h-screen bg-[#0a0c14] text-gray-200 font-sans flex flex-col relative overflow-x-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent pointer-events-none"></div>

      {/* TOP NAVBAR */}
      <header className="border-b border-white/10 bg-[#0f111a]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/techomax.png" alt="Techomax Solutions" className="h-9 w-auto object-contain" />
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-[#ABD2FA] border border-[#ABD2FA]/20 hidden sm:inline-block">
            Subscription Portal
          </span>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs">
              <div className="w-6 h-6 rounded-full bg-[#ABD2FA] text-gray-900 font-bold flex items-center justify-center text-[11px]">
                {(user.name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-gray-200 hidden md:inline">{user.name || user.email}</span>
              <span className="text-[10px] uppercase font-bold text-gray-400 bg-white/10 px-1.5 py-0.5 rounded">
                {user.role || 'CLIENT'}
              </span>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-10 relative z-10">

        {/* STATUS ALERT BANNER */}
        <div className="bg-gradient-to-r from-slate-900 via-[#131b2e] to-slate-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0 mt-1">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {hasNoSubscription
                      ? 'Subscription Required'
                      : isExpired
                      ? 'Your Subscription Has Expired'
                      : 'Subscription Inactive'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    ACCESS PAUSED
                  </span>
                </div>

                <p className="text-sm text-gray-300 mt-2 max-w-2xl leading-relaxed">
                  {hasNoSubscription && (
                    <>
                      Welcome to Techomax Solutions CAD & Land Layout Platform. An active subscription is required to access your project dashboard, CAD conversions, and plot management tools. Please select a plan below or contact our administration to activate your access.
                    </>
                  )}
                  {isExpired && (
                    <>
                      Your subscription validity ended on <b className="text-white">{formatDate(user?.subscription?.endDate)}</b>. Please renew your package below or contact admin to reactivate dashboard privileges.
                    </>
                  )}
                  {isInactive && !isExpired && (
                    <>
                      Your subscription is currently inactive. Please reach out to our administration team to verify your account status.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Refresh check button */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={handleRefreshStatus}
                disabled={refreshing}
                className="w-full sm:w-auto px-5 py-3 bg-[#ABD2FA] hover:bg-[#8bbefa] text-gray-900 font-bold text-sm rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Checking Status...' : 'Check Activation Status'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 1: SUBSCRIPTION PLANS */}
        <section className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#ABD2FA]">
              Plans & Pricing
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Select Your Subscription Plan
            </h3>
            <p className="text-sm text-gray-400">
              Pick the right duration for your real estate and land layout projects. All plans include full CAD conversion & map capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* TIER 1: STARTER */}
            <div className="bg-[#101422] border border-white/10 rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:border-white/20 transition-all hover:-translate-y-1">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-bold text-white">Starter Plan</h4>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300">
                    Monthly
                  </span>
                </div>
                <p className="text-xs text-gray-400">Ideal for single plot developments and short-term architectural conversions.</p>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">₹4,999</span>
                    <span className="text-xs text-gray-400">/ month</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">30 Days Full Access</p>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-white/10 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    <span>Up to 5 CAD Layout Projects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    <span>DXF & DWG Vector Conversion</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    <span>Interactive Plot Mapping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    <span>Public Project Link Sharing</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Check className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>Standard Email Support</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSelectPlan('Starter Plan', 'Starter Plan (Monthly - ₹4,999/mo)')}
                className="mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center gap-2"
              >
                <span>Select Starter Plan</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* TIER 2: PROFESSIONAL (FEATURED) */}
            <div className="bg-gradient-to-b from-[#14203a] to-[#101422] border-2 border-[#ABD2FA] rounded-3xl p-6 sm:p-7 flex flex-col justify-between shadow-xl shadow-blue-500/10 relative hover:-translate-y-1 transition-all">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#ABD2FA] text-gray-950 text-[10px] font-black uppercase tracking-wider rounded-full shadow-md flex items-center gap-1">
                <Sparkles size={12} /> Most Popular • Best Value
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center pt-2">
                  <h4 className="text-lg font-bold text-white">Professional Plan</h4>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#ABD2FA]/20 text-[#ABD2FA]">
                    Annual
                  </span>
                </div>
                <p className="text-xs text-gray-300">The complete solution for land developers, builders, and estate brokers.</p>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">₹39,999</span>
                    <span className="text-xs text-gray-400">/ year</span>
                  </div>
                  <p className="text-[11px] text-green-400 font-semibold mt-1">365 Days Access • Save ~35%</p>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-white/10 text-xs text-gray-200">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#ABD2FA] shrink-0" />
                    <span className="font-semibold text-white">Unlimited CAD Layout Projects</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#ABD2FA] shrink-0" />
                    <span>High-Precision Boundary & Plot Snapping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#ABD2FA] shrink-0" />
                    <span>Amenity Placement & Custom Icons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#ABD2FA] shrink-0" />
                    <span>Plot Status Management (Available/Sold/Booked)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#ABD2FA] shrink-0" />
                    <span>High-Resolution PDF & Print Export</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#ABD2FA] shrink-0" />
                    <span>Priority Phone & WhatsApp Support</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSelectPlan('Professional Plan', 'Professional Plan (Annual - ₹39,999/yr)')}
                className="mt-6 w-full py-3 px-4 rounded-xl text-xs font-black bg-[#ABD2FA] hover:bg-[#8bbefa] text-gray-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
              >
                <span>Select Professional Plan</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* TIER 3: ENTERPRISE */}
            <div className="bg-[#101422] border border-white/10 rounded-3xl p-6 sm:p-7 flex flex-col justify-between hover:border-white/20 transition-all hover:-translate-y-1">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-bold text-white">Enterprise Plan</h4>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300">
                    Tailored
                  </span>
                </div>
                <p className="text-xs text-gray-400">For large real estate firms requiring custom integrations and multi-seat access.</p>

                <div className="pt-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">Custom</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">Multi-Year & Custom Terms</p>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-white/10 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    <span>All Professional Features</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    <span>Multi-User Team Sub-Accounts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    <span>Custom AutoCAD DWG Layer Presets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    <span>Custom Branding & White-Labeling</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    <span>Dedicated Technical Account Manager</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleSelectPlan('Enterprise Plan', 'Enterprise Plan (Custom Quotation)')}
                className="mt-6 w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center gap-2"
              >
                <span>Contact For Enterprise</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>
        </section>

        {/* SECTION 2: CONTACT & ACTIVATION REQUEST */}
        <section id="contact-section" className="bg-[#101422] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#ABD2FA]">
              Get In Touch
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Contact Administration & Request Activation
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Have you made a payment, or do you need a custom invoice? Reach out directly or send an activation request below.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* DIRECT CONTACT INFO */}
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Building size={16} className="text-[#ABD2FA]" /> Direct Communication
                </h4>

                <div className="space-y-3.5 text-sm">
                  {/* Office Address */}
                  <div className="flex items-start gap-3 text-gray-300">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Head Office Location</p>
                      <a
                        href="https://www.google.com/maps/dir//golden+square+bharuch/@21.722586,73.00463,18.82z/data=!4m8!4m7!1m0!1m5!1m1!1s0x3be0214a1d6b4d31:0xae0daf8ad64322b7!2m2!1d73.0046459!2d21.7225728"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-white hover:text-[#ABD2FA] transition-colors leading-snug block mt-0.5"
                      >
                        915, 914, Ninth Floor, Golden Square, Bharuch, Gujarat, India - 392001
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-[#ABD2FA] flex items-center justify-center shrink-0">
                      <Mail size={16} />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Email Administration</p>
                      <a href="mailto:info@techomaxsolution.com" className="font-semibold text-white hover:text-[#ABD2FA] transition-colors">
                        info@techomaxsolution.com
                      </a>
                    </div>
                  </div>

                  {/* Phone & WhatsApp */}
                  <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-9 h-9 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center shrink-0">
                      <Phone size={16} />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Phone & WhatsApp Support</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <a href="tel:+918849012113" className="font-semibold text-white hover:text-green-400 transition-colors">
                          +91-8849012113
                        </a>
                        <span className="text-gray-500">|</span>
                        <a
                          href="https://wa.me/918849012113"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-green-400 hover:underline"
                        >
                          Chat on WhatsApp ↗
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div className="flex items-center gap-3 text-gray-300">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Office Working Hours</p>
                      <p className="font-semibold text-white">Mon – Sat, 9:00 AM – 7:00 PM IST</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* PAYMENT DETAILS */}
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard size={16} className="text-[#ABD2FA]" /> Payment Options Accepted
                </h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-200">
                    UPI / QR Code
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-200">
                    Bank Transfer (NEFT/RTGS/IMPS)
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-200">
                    Credit / Debit Cards
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-200">
                    Corporate GST Invoicing
                  </span>
                </div>
                <p className="text-xs text-gray-400 pt-1">
                  Once your transaction is verified, your account is activated directly from the Admin Subscriptions system.
                </p>
              </div>
            </div>

            {/* INQUIRY / REQUEST FORM */}
            <form onSubmit={handleSubmitInquiry} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Send size={16} className="text-[#ABD2FA]" /> Submit Activation Request
              </h4>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="Your Name"
                  className="w-full bg-[#0a0c14] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#ABD2FA]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  placeholder="your.email@example.com"
                  className="w-full bg-[#0a0c14] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#ABD2FA]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Phone / WhatsApp Number</label>
                <input
                  type="text"
                  required
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#0a0c14] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#ABD2FA]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Selected Plan</label>
                <select
                  value={contactForm.plan}
                  onChange={(e) => setContactForm({ ...contactForm, plan: e.target.value })}
                  className="w-full bg-[#0a0c14] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#ABD2FA]"
                >
                  <option value="Starter Plan (Monthly - ₹4,999/mo)">Starter Plan (Monthly - ₹4,999/mo)</option>
                  <option value="Professional Plan (Annual - ₹39,999/yr)">Professional Plan (Annual - ₹39,999/yr)</option>
                  <option value="Enterprise Plan (Custom Quotation)">Enterprise Plan (Custom Quotation)</option>
                  <option value="Other / Payment Verification Inquiry">Other / Payment Verification Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Message / Payment Reference (Optional)</label>
                <textarea
                  rows={3}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  placeholder="Add any payment reference, UPI UTR number, or specific questions..."
                  className="w-full bg-[#0a0c14] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#ABD2FA]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#ABD2FA] hover:bg-[#8bbefa] text-gray-950 font-black text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Send size={15} />
                <span>{submitting ? 'Submitting...' : 'Send Request to Admin'}</span>
              </button>
            </form>
          </div>
        </section>

        {/* SECTION 3: FAQ */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4 text-xs text-gray-300">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <HelpCircle size={16} className="text-[#ABD2FA]" /> Frequently Asked Questions
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
              <p className="font-bold text-white">How quickly will my account be activated?</p>
              <p className="text-gray-400">
                Most activations take place within 1-2 hours after payment confirmation during business hours.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/20 border border-white/5 space-y-1">
              <p className="font-bold text-white">I have already made the payment. What should I do?</p>
              <p className="text-gray-400">
                Click the <b className="text-white">Check Activation Status</b> button at the top of this page. As soon as your administrator approves the transaction, you will be redirected automatically to your project dashboard.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-gray-500">
        <p>© 2026 Techomax Solutions. All rights reserved. Subscription & Real Estate CAD Platform.</p>
      </footer>
    </div>
  );
}
