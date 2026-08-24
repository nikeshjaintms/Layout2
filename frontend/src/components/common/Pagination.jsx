import React from 'react';

export default function Pagination({ 
  currentPage, 
  totalPages, 
  totalRecords, 
  limit, 
  onPageChange, 
  itemName = 'items',
  theme = 'dark' // 'dark' or 'light'
}) {
  const getPageNumbers = () => {
    if (totalPages <= 1) return [1];

    const delta = 2;
    const range = [];
    
    for (
      let i = Math.max(2, currentPage - delta); 
      i <= Math.min(totalPages - 1, currentPage + delta); 
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }

    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  const pages = getPageNumbers();

  const isLight = theme === 'light';

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t gap-4 ${isLight ? 'border-slate-200 bg-slate-50 rounded-b-xl' : 'border-white/10 bg-[#1d2440]/60 backdrop-blur-md rounded-b-2xl'}`}>
      <div className={`text-sm ${isLight ? 'text-slate-500' : 'text-[#8ba0b8]'}`}>
        Showing {totalRecords === 0 ? 0 : ((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalRecords)} of {totalRecords} {itemName}
      </div>
      
      <div className="flex gap-2 items-center">
        <button 
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || totalRecords === 0}
          className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isLight 
              ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' 
              : 'bg-[#0f111a]/50 border-white/10 text-white hover:bg-white/5 hover:border-[#00c8ff]/30'
          }`}
        >
          Previous
        </button>
        
        <div className="hidden sm:flex items-center gap-1">
          {pages.map((pageNum, index) => {
            if (pageNum === '...') {
              return (
                <span key={`ellipsis-${index}`} className={`w-9 h-9 flex items-center justify-center text-sm font-medium ${isLight ? 'text-slate-400' : 'text-[#8ba0b8]'}`}>
                  ...
                </span>
              );
            }
            
            let buttonClass = '';
            if (currentPage === pageNum) {
              buttonClass = isLight 
                ? 'bg-[#2b4b9b] text-white border-[#2b4b9b] shadow-sm' 
                : 'bg-[#00c8ff]/10 text-[#00c8ff] border-[#00c8ff]/50 shadow-[0_0_10px_rgba(0,200,255,0.2)]';
            } else {
              buttonClass = isLight 
                ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                : 'bg-[#0f111a]/50 border-white/10 text-[#8ba0b8] hover:bg-white/5 hover:text-white hover:border-[#00c8ff]/30';
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`w-9 h-9 flex items-center justify-center rounded-md text-sm font-medium transition-colors border ${buttonClass}`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button 
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || totalRecords === 0}
          className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isLight 
              ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' 
              : 'bg-[#0f111a]/50 border-white/10 text-white hover:bg-white/5 hover:border-[#00c8ff]/30'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
