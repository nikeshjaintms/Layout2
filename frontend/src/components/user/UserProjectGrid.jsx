import React, { useState, useEffect, useRef } from 'react';
import UserProjectCard from './UserProjectCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function UserProjectGrid({ projects }) {
  const [isVisible, setIsVisible] = useState(false);
  const gridRef = useRef(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  
  const totalPages = Math.ceil((projects?.length || 0) / itemsPerPage);
  
  const currentProjects = (projects || []).slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
    
    if (gridRef.current) {
      observer.observe(gridRef.current);
    }
    
    return () => observer.disconnect();
  }, []);

  // Retrigger animation when page changes
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, [currentPage]);

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(p => p + 1);
  };
  
  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(p => p - 1);
  };

  if (!projects || projects.length === 0) return null;

  return (
    <div className="w-full pb-12">
      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
        {currentProjects.map((project, idx) => (
          <div
            key={`${project.id}-${currentPage}`}
            className={`h-full transition-all duration-700 ease-out transform ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
            style={{ transitionDelay: isVisible ? `${idx * 100}ms` : '0ms' }}
          >
            <UserProjectCard project={project} />
          </div>
        ))}
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-6 mt-12">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className={`p-3 rounded-full border transition-all duration-300 ${currentPage === 1 ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-[#00c8ff]/30 text-[#00c8ff] hover:bg-[#00c8ff] hover:text-white shadow-[0_0_15px_rgba(0,200,255,0.1)] hover:shadow-[0_0_20px_rgba(0,200,255,0.4)]'}`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentPage === i + 1 ? 'bg-[#00c8ff] w-8' : 'bg-slate-300 hover:bg-[#00c8ff]/50'}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={`p-3 rounded-full border transition-all duration-300 ${currentPage === totalPages ? 'border-slate-200 text-slate-300 cursor-not-allowed' : 'border-[#00c8ff]/30 text-[#00c8ff] hover:bg-[#00c8ff] hover:text-white shadow-[0_0_15px_rgba(0,200,255,0.1)] hover:shadow-[0_0_20px_rgba(0,200,255,0.4)]'}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
