import React from 'react';
import { X, MapPin } from 'lucide-react';

export default function UserProjectInfoModal({ isOpen, onClose, project }) {
  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#1d2440] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Floating Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 text-white/70 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 sm:p-10 flex flex-col items-start text-left">
          {/* Logo */}
          {project.logoUrl ? (
            <img 
              src={project.logoUrl.startsWith('http') ? project.logoUrl : `http://localhost:5000${project.logoUrl}`} 
              alt={project.name} 
              className="h-20 sm:h-28 object-contain mb-8 drop-shadow-xl"
            />
          ) : (
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-8 drop-shadow-lg uppercase">
              {project.name}
            </h2>
          )}

          {/* Info */}
          {project.info && (
            <p className="text-white text-base sm:text-lg font-medium leading-relaxed mb-8 w-full whitespace-pre-wrap">
              {project.info}
            </p>
          )}

          {/* Address */}
          {(project.address || project.place) && (
            <div className="w-full text-left flex gap-4">
              <p className="text-[#8ba0b8] text-sm sm:text-[15px] leading-relaxed">
                <span className="font-medium mr-2">Address:</span>
                {project.address || `${project.place}, ${project.city}, ${project.state}`}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 pt-0 flex flex-col items-center justify-center text-center">
          <a 
            href="https://techomaxsolution.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-4"
          >
            <p className="text-xs text-slate-500 font-medium tracking-wide group-hover:text-slate-300 transition-colors duration-300">
              Powered by Techomax Solutions
            </p>
            <img 
              src="/techomax.png" 
              alt="Techomax Solutions" 
              className="h-8 sm:h-10 object-contain opacity-70 group-hover:opacity-100 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] group-hover:scale-105 transition-all duration-300"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
