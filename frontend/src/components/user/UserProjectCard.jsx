import React from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { BASE_URL } from '@/lib/api';

export default function UserProjectCard({ project }) {
  return (
    <Link href={`/projects/${project.id}`} className="h-full group relative flex flex-col bg-[#0a0d14] rounded-3xl overflow-hidden transition-all duration-700 hover:-translate-y-2 shadow-xl hover:shadow-[0_20px_40px_-10px_rgba(0,200,255,0.15)] block">
      
      {/* Animated gradient border on hover */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#00c8ff]/0 via-transparent to-blue-600/0 group-hover:from-[#00c8ff]/40 group-hover:via-[#00c8ff]/10 group-hover:to-blue-600/40 transition-all duration-700 opacity-0 group-hover:opacity-100 p-[1px] pointer-events-none z-30" />
      
      {/* Inner card container masking the border */}
      <div className="absolute inset-[1px] rounded-[23px] bg-[#0a0d14] z-0 pointer-events-none" />
      
      {/* Ambient background glow inside the card on hover */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#00c8ff]/0 to-[#00c8ff]/0 group-hover:from-[#00c8ff]/5 group-hover:to-transparent transition-all duration-1000 z-10 pointer-events-none" />

      {/* Logos Area */}
      <div className="w-full h-56 sm:h-64 relative overflow-hidden flex flex-col bg-[#05070a] z-10 rounded-t-[23px]">
        
        {/* Top Half: Techomax Logo */}
        <div className="flex-1 min-h-0 flex items-center justify-center p-6 relative z-10 group-hover:scale-110 transition-transform duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] border-b border-white/5 bg-white/[0.02]">
          <img 
            src="/techomax2.png" 
            alt="Techomax" 
            className="w-full h-full object-contain brightness-0 invert opacity-60 group-hover:opacity-100 transition-opacity duration-700 drop-shadow-[0_0_15px_rgba(255,255,255,0.05)] group-hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          />
        </div>
        
        {/* Bottom Half: Project Logo */}
        <div className="flex-1 min-h-0 flex items-center justify-center bg-[#0a0d14]/80 p-6 relative z-10 group-hover:scale-110 transition-transform duration-1000 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] backdrop-blur-sm">
          {project.logoUrl ? (
            <img 
              src={project.logoUrl?.startsWith('http') ? project.logoUrl : `${BASE_URL}${project.logoUrl}`} 
              alt={project.name || "Project Logo"} 
              className="w-full h-full object-contain drop-shadow-[0_5px_15px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_10px_25px_rgba(0,200,255,0.25)] transition-all duration-700"
            />
          ) : (
            <span className="text-[#8ba0b8] font-bold uppercase tracking-[0.25em] text-sm text-center line-clamp-2 opacity-70 group-hover:opacity-100 transition-opacity duration-700 group-hover:text-[#00c8ff] group-hover:drop-shadow-[0_0_15px_rgba(0,200,255,0.4)]">
              {project.name}
            </span>
          )}
        </div>
        
      </div>

      {/* Content Area */}
      <div className="p-6 sm:p-8 flex flex-col flex-1 relative z-20 bg-transparent border-t border-white/5 rounded-b-[23px]">
        <h3 className="text-xl sm:text-2xl font-black text-white mb-2 truncate group-hover:text-[#00c8ff] transition-colors duration-500 drop-shadow-md">
          {project.name}
        </h3>
        
        <div className="flex items-center text-[#8ba0b8] text-sm mb-5 group-hover:text-white/90 transition-colors duration-500">
          <MapPin className="w-4 h-4 mr-1.5 text-[#4b5cd1] group-hover:animate-bounce" />
          <span className="truncate font-medium tracking-wide">{project.city || project.address || 'Premium Location'}</span>
        </div>
        
        <p className="text-[#8ba0b8]/60 text-sm line-clamp-2 mb-6 flex-1 leading-relaxed group-hover:text-[#8ba0b8]/90 transition-colors duration-500">
          {project.description || 'Explore the master layout and premium plots available for this upcoming development. Secure your future investment today.'}
        </p>
        
        <div className="flex justify-end mt-auto">
          <div className="relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-white/5 group-hover:bg-[#4b5cd1] text-[#4b5cd1] group-hover:text-[#0a0d14] transition-all duration-500 transform group-hover:scale-110 shadow-none group-hover:shadow-[0_0_20px_rgba(75,92,209,0.6)]">
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:translate-x-0.5 transition-transform duration-300" />
          </div>
        </div>
      </div>
    </Link>
  );
}
