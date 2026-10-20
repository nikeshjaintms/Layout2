'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Shield, LogOut, Globe, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '@/redux/slices/authSlice';
import ChangePasswordModal from '@/components/auth/ChangePasswordModal';

export default function AdminNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const dispatch = useDispatch();

  const authUser = useSelector((state) => state.auth.user);
  
  const displayName = authUser?.name || authUser?.email || 'Admin User';
  const displayEmail = authUser?.email || 'admin@example.com';
  const initial = displayName.charAt(0).toUpperCase();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-6 shrink-0 sticky top-0 z-40 gap-3">
      <Link
        href="/projects"
        target="_blank"
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-[#ABD2FA]/20 border border-gray-200 hover:border-[#ABD2FA] text-gray-700 text-xs font-semibold transition-all shadow-sm"
        title="Open Public Projects Portal (/projects)"
      >
        <Globe size={14} className="text-[#0066FF]" />
        <span>Live Site</span>
        <span className="font-mono text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">/projects</span>
        <ExternalLink size={12} className="text-gray-400" />
      </Link>

      <div className="relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-3 px-3 py-1.5 rounded-xl transition-colors duration-200 ${isOpen ? 'bg-white/5' : 'hover:bg-gray-50'}`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00c8ff] to-[#0066FF] flex items-center justify-center shadow-[0_0_10px_rgba(0,200,255,0.3)]">
            <span className="text-gray-900 font-bold text-sm">
              {initial}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 hidden sm:block">
              Hi, {displayName}
            </span>
            <ChevronDown 
              size={16} 
              className={`text-gray-600 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="px-5 py-4 border-b border-gray-200">
              <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-600 truncate mt-0.5">{displayEmail}</p>
            </div>
            
            {/* Menu Actions */}
            <div className="p-2 space-y-1">
              <Link 
                href="/projects"
                target="_blank"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <Globe size={16} className="text-[#0066FF]" />
                <span>Public Portal (/projects)</span>
                <ExternalLink size={12} className="ml-auto text-gray-400" />
              </Link>

              <button 
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setIsOpen(false);
                  setIsPasswordModalOpen(true);
                }}
              >
                <Shield size={16} className="text-gray-500" />
                Change Password
              </button>
              
              <button 
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#ff4d4d] hover:bg-[#ff4d4d]/10 transition-colors"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
      
      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </header>
  );
}
