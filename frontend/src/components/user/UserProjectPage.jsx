'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPublicProjects } from '@/redux/slices/projectsSlice';
import UserNavbar from './UserNavbar';
import UserProjectGrid from './UserProjectGrid';
import UserProjectLoading from './UserProjectLoading';
import UserProjectEmptyState from './UserProjectEmptyState';
import UserFeaturesSection from './UserFeaturesSection';
import UserFooter from './UserFooter';

export default function UserProjectPage() {
  const dispatch = useDispatch();
  const { items: projects, loading, error } = useSelector(state => state.projects);
  const [imageClicked, setImageClicked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Force scroll to top on page load/refresh
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }
      window.scrollTo(0, 0);
    }
  }, []);

  const handleImageClick = () => {
    if (imageClicked) return;
    setImageClicked(true);
    setTimeout(() => setImageClicked(false), 600); // 600ms animation
  };

  useEffect(() => {
    dispatch(fetchPublicProjects());
  }, [dispatch]);

  return (
    <>
      <UserNavbar />
      <div className="min-h-screen bg-[#0a0f16] text-white selection:bg-[#00c8ff]/30 font-sans flex flex-col">
      
      {/* Hero Banner Section */}
      <div className="w-full mb-16 flex flex-col lg:flex-row justify-between items-center overflow-hidden py-12 lg:py-24 gap-8 lg:gap-12 bg-[#0a0f16] relative">
        
        {/* Ambient Glow Effects */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-[#0066ff]/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />

        {/* Left Side: Image */}
        <div className={`w-full lg:w-3/5 xl:w-2/3 pl-0 sm:pl-4 lg:pl-0 relative z-10 flex justify-center lg:justify-start transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
          <img 
            src="/plot.png" 
            alt="Techomax Plot Layout" 
            onClick={handleImageClick}
            className={`w-full h-auto object-contain object-left max-h-[40vh] sm:max-h-[50vh] lg:max-h-[75vh] drop-shadow-[0_0_40px_rgba(0,102,255,0.15)] cursor-pointer transition-all duration-500 ease-out ${
              imageClicked 
                ? 'scale-95 brightness-125 saturate-150 drop-shadow-[0_0_80px_rgba(0,102,255,0.8)]' 
                : 'hover:scale-[1.03] hover:-translate-y-3 hover:drop-shadow-[0_20px_60px_rgba(0,102,255,0.4)] hover:brightness-110'
            }`}
          />
        </div>

        {/* Right Side: Text */}
        <div className="w-full lg:w-2/5 xl:w-1/3 flex flex-col justify-center text-left px-4 sm:px-8 lg:px-12 xl:pr-20 relative z-10 mt-8 lg:mt-0">
          <h1 className={`text-4xl sm:text-5xl lg:text-6xl xl:text-[76px] font-extrabold text-white leading-[1.1] mb-4 sm:mb-6 tracking-tight transition-all duration-1000 delay-150 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Your Project.<br/>
            Your&nbsp;Platform.<br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#4b5cd1] to-[#303a8e] block mt-1 sm:mt-2">
              Your Digital Experience.
            </span>
          </h1>
          <p className={`text-base sm:text-xl text-slate-400 font-medium leading-relaxed max-w-lg mb-8 sm:mb-10 transition-all duration-1000 delay-300 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Host, manage and showcase your plotting projects with an interactive experience built for modern developers.
          </p>
          <div className={`transition-all duration-1000 delay-500 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <button className="w-full sm:w-auto group relative bg-gradient-to-r from-[#4b5cd1] to-[#303a8e] hover:opacity-90 text-white font-bold py-3.5 sm:py-4 px-8 sm:px-10 rounded-xl transition-all duration-300 shadow-[0_0_30px_-5px_rgba(48,58,142,0.5)] hover:shadow-[0_0_40px_0px_rgba(48,58,142,0.7)] flex items-center justify-center gap-3 overflow-hidden">
              <span className="relative z-10 text-lg">Get Plot</span>
              <span className="relative z-10 group-hover:translate-x-1 transition-transform duration-300">&rarr;</span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <UserProjectLoading />
        ) : (!projects || projects.length === 0) ? (
          <UserProjectEmptyState />
        ) : (
          <UserProjectGrid projects={projects} />
        )}
      </div>

      <UserFeaturesSection />
      </div>
      
      <UserFooter />
    </>
  );
}
