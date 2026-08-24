'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Map, Search, Box, Image as ImageIcon, Users, 
  Tag, Layers, Palette, RefreshCcw, IndianRupee, 
  BarChart2, Navigation, Link2, 
  Smartphone, Shield, Bell, Rocket
} from 'lucide-react';

const features = [
  { icon: Map, title: "Interactive Map", desc: "Smooth 2D map with pan, zoom and explore." },
  { icon: Search, title: "Smart Search", desc: "Find any plot instantly with advanced filters." },
  { icon: Box, title: "3D Visualization", desc: "Realistic 3D view to present your project." },
  { icon: ImageIcon, title: "Media Showcase", desc: "Add images, videos & virtual tours." },
  { icon: Users, title: "Team Management", desc: "Manage users, roles and permissions easily." },
  
  { icon: Tag, title: "Plot Labeling", desc: "Add custom labels, tags and information." },
  { icon: Layers, title: "Zone & Block", desc: "Group plots into zones, blocks and categories." },
  { icon: Palette, title: "Color & Status", desc: "Color code plots by status, category or availability." },
  { icon: RefreshCcw, title: "Live Availability", desc: "Real-time inventory and availability updates." },
  { icon: IndianRupee, title: "Pricing Control", desc: "Set, update and manage plot pricing effortlessly." },
  
  { icon: BarChart2, title: "Dashboard & Insights", desc: "Track views, leads and performance in real-time." },
  { icon: Navigation, title: "Navigation & Directions", desc: "Provide easy directions to project location." },
  { icon: Link2, title: "Share & Collaborate", desc: "Share projects via link and collaborate with clients." },
  { icon: Smartphone, title: "Mobile Responsive", desc: "Fully responsive and optimized for all devices." },
  
  { icon: Shield, title: "Secure & Reliable", desc: "Enterprise-grade security to protect your data." },
  { icon: Bell, title: "Smart Notifications", desc: "Instant alerts for leads, updates and activities." }
];

export default function UserFeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

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
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef} className="w-full bg-[#0a0f16] py-24 px-4 sm:px-6 lg:px-8 border-t border-slate-800 relative overflow-hidden">
      
      {/* Futuristic Dot Grid Background */}
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, rgba(0,102,255,0.2) 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-[#0066ff]/10 blur-[150px] pointer-events-none rounded-full z-0" />
      
      <div className="max-w-[1400px] mx-auto relative z-10">
        
        {/* Header Section with HUD Brackets */}
        <div className={`text-center max-w-4xl mx-auto mb-20 relative transition-all duration-1000 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          
          {/* HUD Left Bracket */}
          <div className="absolute top-1/2 -left-2 sm:-left-8 -translate-y-1/2 w-8 sm:w-16 h-[120%] border-l-2 border-y-2 border-[#0066ff]/20 rounded-l-3xl shadow-[inset_10px_0_20px_rgba(0,102,255,0.05)] animate-pulse" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 20%, 0 20%, 0 80%, 100% 80%, 100% 100%, 0 100%)', animationDuration: '3s' }} />
          {/* HUD Right Bracket */}
          <div className="absolute top-1/2 -right-2 sm:-right-8 -translate-y-1/2 w-8 sm:w-16 h-[120%] border-r-2 border-y-2 border-[#0066ff]/20 rounded-r-3xl shadow-[inset_-10px_0_20px_rgba(0,102,255,0.05)] animate-pulse" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 80%, 100% 80%, 100% 20%, 0 20%)', animationDuration: '3s', animationDelay: '1.5s' }} />

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0066ff]/10 border border-[#0066ff]/30 text-[#00c8ff] text-xs font-bold tracking-widest uppercase mb-6 shadow-[0_0_15px_rgba(0,102,255,0.2)] animate-pulse" style={{ animationDuration: '4s' }}>
            <Rocket className="w-3.5 h-3.5" />
            Powerful Platform
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 sm:mb-6 tracking-tight leading-[1.2] sm:leading-[1.1] drop-shadow-[0_0_20px_rgba(0,102,255,0.2)]">
            Everything You Need.<br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            Built for <span className="text-[#0066ff] drop-shadow-[0_0_30px_rgba(0,102,255,0.6)]">Real Results.</span>
          </h2>
          <p className="text-base sm:text-lg text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto px-4 sm:px-0">
            Techomax gives you all the powerful tools to host, manage and showcase your projects with a <span className="text-[#00c8ff] drop-shadow-[0_0_10px_rgba(0,200,255,0.5)]">seamless plot viewing experience.</span>
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div 
                key={idx} 
                className={`group relative flex transition-all duration-700 ease-out hover:-translate-y-1.5 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
                }`}
                style={{ transitionDelay: isVisible ? `${idx * 40}ms` : '0ms' }}
              >
                {/* Glowing Outer Border Wrapper using clip-path */}
                <div 
                  className="w-full relative p-[1px] bg-gradient-to-br from-[#0066ff]/60 via-slate-800/80 to-[#0066ff]/40 group-hover:from-[#00c8ff] group-hover:to-[#0066ff] transition-all duration-300 shadow-[0_0_15px_rgba(0,102,255,0.05)] group-hover:shadow-[0_0_30px_rgba(0,200,255,0.3)]"
                  style={{ 
                    clipPath: 'polygon(18px 0%, 100% 0%, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0% 100%, 0% 18px)' 
                  }}
                >
                  {/* Inner Dark Background */}
                  <div 
                    className="w-full h-full flex items-center p-4 gap-4 bg-[#0a0f18]/70 group-hover:bg-[#0d1624]/90 transition-colors duration-300 relative overflow-hidden backdrop-blur-md shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]"
                    style={{ 
                      clipPath: 'polygon(17px 0%, 100% 0%, 100% calc(100% - 17px), calc(100% - 17px) 100%, 0% 100%, 0% 17px)' 
                    }}
                  >
                    
                    {/* Small glowing dot top-left */}
                    <div className="absolute top-2.5 left-6 w-1 h-1 rounded-full bg-[#0066ff] shadow-[0_0_8px_rgba(0,102,255,1)] opacity-80 group-hover:opacity-100 group-hover:bg-[#00c8ff] group-hover:shadow-[0_0_12px_rgba(0,200,255,1)] transition-all duration-300 animate-pulse" style={{ animationDuration: `${2 + (idx % 3)}s` }} />

                    {/* Mobile Auto-Glow Background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#00c8ff]/0 via-[#00c8ff]/5 to-[#00c8ff]/0 sm:hidden animate-pulse pointer-events-none" style={{ animationDuration: `${3 + (idx % 4)}s`, animationDelay: `${idx * 0.2}s` }} />

                    {/* Hexagonal Icon Container */}
                    <div className="flex-shrink-0 w-11 h-11 flex items-center justify-center relative mt-1 group-hover:scale-110 transition-transform duration-500 ease-out">
                      {/* Mobile Automatic Icon Glow */}
                      <div className="absolute inset-0 bg-[#00c8ff]/30 blur-md rounded-full sm:hidden animate-pulse" style={{ animationDuration: `${2 + (idx % 3)}s` }} />
                      
                      {/* Hexagon Shape Background */}
                      <div 
                        className="absolute inset-0 bg-[#0066ff]/10 border border-[#0066ff]/40 group-hover:bg-[#00c8ff]/20 group-hover:border-[#00c8ff]/60 transition-all duration-300" 
                        style={{ clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)' }}
                      />
                      {/* Icon */}
                      <Icon className="w-5 h-5 text-[#0066ff] group-hover:text-[#00c8ff] relative z-10 drop-shadow-[0_0_5px_rgba(0,102,255,0.6)] group-hover:drop-shadow-[0_0_10px_rgba(0,200,255,1)] transition-all duration-300" strokeWidth={1.5} />
                    </div>
                    
                    {/* Text Content */}
                    <div className="flex flex-col justify-center pt-1.5">
                      <h4 className="text-[13px] font-bold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-cyan-200 transition-all duration-300">
                        {feature.title}
                      </h4>
                      <p className="text-[11px] leading-[1.35] text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                        {feature.desc}
                      </p>
                    </div>
                    
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
