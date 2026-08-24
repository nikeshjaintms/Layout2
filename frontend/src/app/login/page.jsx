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
    dispatch(login({ email, password }));
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden font-sans select-none">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover sm:bg-[length:100%_100%] bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/background.png')" }}
      >
        <div className="absolute inset-0 bg-[#0f111a]/40"></div>
        {/* Subtle grid pattern for futuristic feel */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center">
        
        {/* Login Form Container */}
        <div className="relative z-10 w-full bg-transparent backdrop-blur-[2px] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 md:p-14 shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex flex-col items-center transition-all duration-700 ease-out hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,200,255,0.15)] hover:border-white/20 hover:backdrop-blur-sm group">
          
          {/* Subtle animated glass shine on hover */}
          <div className="absolute inset-0 rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

          <div className="mb-12 sm:mb-16 text-center relative flex flex-col items-center w-full z-10">
            <div className="w-10 sm:w-12 h-1.5 bg-[#00c8ff] rounded-full mb-5 sm:mb-8 shadow-[0_0_12px_rgba(0,200,255,0.8)]"></div>
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-[0.25em] sm:tracking-[0.4em] ml-[0.25em] sm:ml-[0.4em] drop-shadow-md">
              LOGIN
            </h1>
            {error && (
              <div className="mt-6 text-[#ff4081] font-bold text-sm sm:text-base">
                {error}
              </div>
            )}
          </div>

          <form onSubmit={handleLogin} className="space-y-8 sm:space-y-10 w-full relative z-10">
            
            {/* Email Field */}
            <div className="relative pt-3">
              <div className="absolute -top-1 left-5 sm:left-7 z-10 flex items-center bg-[#0a0d16] px-4 sm:px-5 py-1.5 rounded-full border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                <span className="text-[10px] sm:text-xs font-black text-[#8ba0b8] uppercase tracking-widest">Email <span className="text-[#ff4081] ml-1">*</span></span>
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 sm:px-8 py-4 sm:py-5 bg-[#0a0d16] border border-white/10 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-white/30 focus:bg-[#0c101a] transition-all duration-300 text-base font-medium shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                placeholder="admin@techomax.com"
              />
            </div>

            {/* Password Field */}
            <div className="relative pt-3">
              <div className="absolute -top-1 left-5 sm:left-7 z-10 flex items-center bg-[#0a0d16] px-4 sm:px-5 py-1.5 rounded-full border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                <span className="text-[10px] sm:text-xs font-black text-[#8ba0b8] uppercase tracking-widest">Password <span className="text-[#ff4081] ml-1">*</span></span>
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-6 sm:pl-8 pr-14 sm:pr-16 py-4 sm:py-5 bg-[#0a0d16] border border-white/10 rounded-xl sm:rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-white/30 focus:bg-[#0c101a] transition-all duration-300 text-base font-medium tracking-widest shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 sm:right-6 top-1/2 -translate-y-1/2 mt-1.5 text-slate-500 hover:text-white transition-colors p-2"
              >
                {showPassword ? <EyeOff size={20} strokeWidth={2} /> : <Eye size={20} strokeWidth={2} />}
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full mt-10 sm:mt-12 py-4 sm:py-5 bg-gradient-to-r from-[#00c8ff] to-[#0066FF] hover:from-[#00b0e6] hover:to-[#0055d4] border border-[#00c8ff]/50 text-white font-bold rounded-xl sm:rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,200,255,0.4)] hover:shadow-[0_0_30px_rgba(0,200,255,0.6)] hover:scale-[1.02] active:scale-[0.98]"
            >
              {status === 'loading' ? (
                <Loader2 size={24} className="animate-spin text-white" />
              ) : (
                <>
                  <span className="text-[14px] sm:text-[15px] font-black tracking-widest uppercase">LOGIN NOW</span>
                  <ArrowRight size={20} strokeWidth={2.5} className="text-white/80 group-hover:text-white group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center z-10 px-4">
        <Link 
          href="https://techomaxsolution.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 group px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#0a0c14]/80 backdrop-blur-sm border border-[#00c8ff]/30 hover:border-[#00c8ff]/60 hover:bg-[#00c8ff]/5 transition-all duration-300 hover:shadow-[0_0_15px_rgba(0,200,255,0.15)] max-w-full"
        >
          <span className="text-[10px] sm:text-sm font-bold text-[#8ba0b8] group-hover:text-[#00c8ff] transition-colors tracking-wider uppercase truncate">
            Powered by <span className="text-[#00c8ff]">Techomax Solutions</span>
          </span>
        </Link>
      </div>

    </div>
  );
}
