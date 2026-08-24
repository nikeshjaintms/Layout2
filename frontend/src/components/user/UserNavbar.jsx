'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function UserNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);

  // Add shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-slate-200 border-slate-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 md:h-[88px] flex items-center justify-between gap-3">
          
          {/* LEFT: Logo */}
          <div className="flex items-center">
            <Link href="/projects" className="flex items-center gap-4 group transition-transform duration-300 hover:scale-[1.02]">
              <img 
                src="/techomax.png" 
                alt="Techomax Logo" 
                className="h-10 sm:h-12 md:h-16 w-auto object-contain mix-blend-multiply shrink-0" 
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.style.display = 'none';
                }}
              />
            </Link>
          </div>

          {/* RIGHT: Action Button */}
          <div className="flex items-center shrink-0">
            <button className="bg-gradient-to-r from-[#0066ff] to-[#00c8ff] hover:opacity-90 text-white font-bold py-2 px-4 md:py-2.5 md:px-7 rounded-lg md:rounded-xl transition-all duration-300 shadow-md shadow-blue-500/20 text-sm md:text-[15px] flex items-center gap-1.5 md:gap-2 group hover:shadow-lg hover:-translate-y-0.5 whitespace-nowrap">
              Get Plot <span className="text-lg md:text-xl leading-none group-hover:translate-x-1 transition-transform">&rarr;</span>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
