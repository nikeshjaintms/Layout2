import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Phone, Mail, ArrowUp } from 'lucide-react';

const FacebookIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  </svg>
);

const TwitterIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const InstagramIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

export default function UserFooter() {
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (footerRef.current) {
      observer.observe(footerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer ref={footerRef} className="w-full bg-[#131923] relative overflow-hidden text-slate-300 pt-20 pb-10 border-t border-slate-800">
      
      {/* Background Dot Pattern (Breathing Animation) */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.15] pointer-events-none animate-pulse"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)',
          backgroundSize: '24px 24px',
          animationDuration: '4s'
        }}
      />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-24 mb-12 lg:mb-16">
          
          {/* Where We Are Section */}
          <div className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <h3 className="text-white text-xl md:text-2xl font-bold mb-6 md:mb-10">Where We Are</h3>
            <div className="space-y-5 md:space-y-8">
              
              <div className="flex items-start gap-4 md:gap-5 group cursor-default">
                <MapPin className="w-5 h-5 md:w-6 md:h-6 text-slate-400 mt-1 flex-shrink-0 transition-all duration-300 group-hover:scale-125 group-hover:text-[#00c8ff] group-hover:-rotate-3" strokeWidth={1.5} />
                <p className="text-[15px] md:text-lg leading-relaxed transition-all duration-300 group-hover:translate-x-2 group-hover:text-white">
                  915,914 ,Ninth Floor,Golden<br/>Square,Bharuch, Gujarat, India - 392001
                </p>
              </div>
              
              <div className="flex items-center gap-4 md:gap-5 pt-1 md:pt-2 group cursor-pointer">
                <Phone className="w-5 h-5 md:w-6 md:h-6 text-slate-400 flex-shrink-0 transition-all duration-300 group-hover:scale-125 group-hover:text-[#00c8ff] group-hover:rotate-12" strokeWidth={1.5} />
                <a href="tel:+918849012113" className="text-[15px] md:text-[18px] font-medium transition-all duration-300 group-hover:translate-x-2 group-hover:text-white">
                  +91-8849012113
                </a>
              </div>
              
              <div className="flex items-center gap-4 md:gap-5 group cursor-pointer">
                <Mail className="w-5 h-5 md:w-6 md:h-6 text-slate-400 flex-shrink-0 transition-all duration-300 group-hover:scale-125 group-hover:text-[#00c8ff] group-hover:-rotate-12" strokeWidth={1.5} />
                <a href="mailto:info@techomaxsolution.com" className="text-[15px] md:text-[18px] font-medium transition-all duration-300 group-hover:translate-x-2 group-hover:text-white">
                  info@techomaxsolution.com
                </a>
              </div>

            </div>
          </div>

          {/* About Section */}
          <div className={`flex flex-col pt-1 mt-2 md:mt-0 transition-all duration-1000 delay-200 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <h3 className="text-white text-xl md:text-2xl font-bold mb-6 md:mb-10">About Us</h3>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00c8ff] font-bold text-lg md:text-2xl leading-snug mb-4 md:mb-6 max-w-lg">
              Powering the next generation of digital real-estate experiences.
            </p>
            <p className="text-slate-400 leading-relaxed text-[15px] md:text-lg max-w-lg">
              Techomax Solutions helps developers transform layouts into interactive project experiences that buyers can explore from anywhere.
            </p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className={`pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-1000 delay-400 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
          <div className="flex flex-col items-center md:items-start gap-4">
            {/* Logo */}
            <div>
              <img 
                src="/techomax1.png" 
                alt="Techomax Solution" 
                className="h-20 w-auto object-contain"
              />
            </div>
            <p className="text-[13px] text-slate-400">
              Copyright © 2018 - {new Date().getFullYear()} <a href="https://techomaxsolution.com/" target="_blank" rel="noopener noreferrer" className="hover:text-[#00c8ff] hover:underline transition-colors font-medium text-slate-300">Techomax Solution</a> | All Right Reserved
            </p>
          </div>
          
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-4">
              <button className="w-10 h-10 rounded-full border border-slate-700 hover:border-[#0066ff] hover:bg-[#0066ff] flex items-center justify-center transition-all duration-300 hover:-translate-y-1.5 hover:scale-110 hover:shadow-[0_0_15px_rgba(0,102,255,0.5)] group">
                <FacebookIcon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              </button>
              <button className="w-10 h-10 rounded-full border border-slate-700 hover:border-[#0066ff] hover:bg-[#0066ff] flex items-center justify-center transition-all duration-300 hover:-translate-y-1.5 hover:scale-110 hover:shadow-[0_0_15px_rgba(0,102,255,0.5)] group">
                <TwitterIcon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              </button>
              <button className="w-10 h-10 rounded-full border border-slate-700 hover:border-[#0066ff] hover:bg-[#0066ff] flex items-center justify-center transition-all duration-300 hover:-translate-y-1.5 hover:scale-110 hover:shadow-[0_0_15px_rgba(0,102,255,0.5)] group">
                <LinkedinIcon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              </button>
              <button className="w-10 h-10 rounded-full border border-slate-700 hover:border-[#0066ff] hover:bg-[#0066ff] flex items-center justify-center transition-all duration-300 hover:-translate-y-1.5 hover:scale-110 hover:shadow-[0_0_15px_rgba(0,102,255,0.5)] group">
                <InstagramIcon className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Floating Scroll to Top Button (Far Right) */}
      <button 
        onClick={scrollToTop}
        className="absolute right-8 bottom-10 w-14 h-14 rounded-full bg-[#0066ff] hover:bg-[#00c8ff] text-white flex items-center justify-center shadow-[0_0_20px_rgba(0,102,255,0.5)] transition-all duration-300 hover:scale-110 animate-bounce group z-50 hidden md:flex"
      >
        <div className="absolute inset-0 rounded-full bg-[#00c8ff] opacity-0 group-hover:animate-ping" />
        <ArrowUp className="w-6 h-6 relative z-10" strokeWidth={2.5} />
      </button>

    </footer>
  );
}
