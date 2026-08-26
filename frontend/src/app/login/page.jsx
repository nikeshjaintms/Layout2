'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError, initializeAuth } from '@/redux/slices/authSlice';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { status, error, user } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (status === 'authenticated' && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/cad-conversion');
      }
    }
  }, [status, user, router]);

  useEffect(() => {
    // Only dispatch on mount if we haven't checked auth yet
    if (status === 'loading') {
      dispatch(initializeAuth());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleLogin = (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    dispatch(clearError());

    // Trim whitespace
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    let hasError = false;

    // Check for empty fields
    if (!cleanEmail) {
      setEmailError('Please fill out the Email field.');
      hasError = true;
    } else if (/\s/.test(cleanEmail)) {
      setEmailError('Whitespace is not allowed in Email.');
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setEmailError('Please enter a valid Email address.');
        hasError = true;
      }
    }

    if (!cleanPassword) {
      setPasswordError('Please fill out the Password field.');
      hasError = true;
    } else if (/\s/.test(cleanPassword)) {
      setPasswordError('Whitespace is not allowed in Password.');
      hasError = true;
    }

    if (hasError) return;

    dispatch(login({ email: cleanEmail, password: cleanPassword }));
  };

  return (
    <div className="min-h-screen flex w-full bg-[#0a0c14] font-sans select-none overflow-hidden relative items-center justify-center px-4">

      {/* FULL BACKGROUND IMAGE */}
      <div
        className="absolute inset-0 bg-[length:100%_100%] bg-center bg-no-repeat z-0"
        style={{ backgroundImage: "url('/Background3.png')" }}
      >
        {/* Subtle dark overlay to ensure readability if needed, but mockup looks fairly bright on left */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* LOGIN CARD */}
      <div className="w-full max-w-[500px] bg-[#1b2b4c] border border-white/30 rounded-[2.5rem] p-10 sm:p-14 min-h-[600px] relative z-10 shadow-2xl flex flex-col justify-center">

        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-6">
          <img src="/techomax1.png" alt="Techomax Solution" className="h-20 sm:h-24 object-contain mb-8" onError={(e) => { e.target.style.display = 'none' }} />
          <h1 className="text-[28px] font-semibold text-white mb-2 tracking-tight">
            Welcome Back!
          </h1>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-semibold text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} noValidate className="space-y-8 mt-2">

          {/* Email Field */}
          <div>
            <div className="relative flex items-center">
              <Mail className="absolute left-4 text-gray-400" size={20} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value.replace(/\s/g, ''))}
                onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
                className="w-full pl-12 pr-4 py-4 bg-[#0f172a] border border-[#1e2f4a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] transition-all text-sm font-medium shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)]"
                placeholder="Email or Mobile Number"
              />
            </div>
            {emailError && <div className="text-[#ff4081] text-xs font-bold mt-1.5 ml-1">{emailError}</div>}
          </div>

          {/* Password Field */}
          <div>
            <div className="relative flex items-center">
              <Lock className="absolute left-4 text-gray-400" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value.replace(/\s/g, ''))}
                onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
                className="w-full pl-12 pr-12 py-4 bg-[#0f172a] border border-[#1e2f4a] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316] transition-all text-sm font-medium shadow-[inset_0_3px_6px_rgba(0,0,0,0.4)] tracking-widest"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-gray-500 hover:text-white transition-colors p-2"
              >
                {showPassword ? <EyeOff size={20} strokeWidth={2} /> : <Eye size={20} strokeWidth={2} />}
              </button>
            </div>
            {passwordError && <div className="text-[#ff4081] text-xs font-bold mt-1.5 ml-1">{passwordError}</div>}
          </div>



          {/* Submit Button */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full mt-10 py-4 sm:py-5 bg-gradient-to-r from-[#ff7a00] to-[#e05a00] hover:from-[#ff8a1a] hover:to-[#f06400] text-white font-bold tracking-wider uppercase rounded-xl flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_6px_16px_rgba(224,90,0,0.3)] hover:shadow-[0_8px_20px_rgba(224,90,0,0.4)] hover:-translate-y-0.5 relative group"
          >
            {status === 'loading' ? (
              <Loader2 size={22} className="animate-spin text-white" />
            ) : (
              <>
                <span>SIGN IN</span>
                <div className="absolute right-4 p-1.5 bg-black/10 rounded-md group-hover:bg-black/20 transition-colors">
                  <ArrowRight size={18} strokeWidth={3} className="text-white group-hover:translate-x-0.5 transition-transform" />
                </div>
              </>
            )}
          </button>
        </form>



      </div>
    </div>
  );
}
