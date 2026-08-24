import React from 'react';

export default function CompassControl({ rotation = 0, onResetNorth }) {
  return (
    <div 
      className="absolute top-4 right-4 z-50 flex items-center justify-center w-12 h-12 bg-zinc-900/80 backdrop-blur-md border border-zinc-700/50 rounded-full shadow-lg cursor-pointer hover:bg-zinc-800/90 transition-colors"
      onClick={onResetNorth}
      title="Reset to North"
    >
      <div 
        className="relative w-full h-full"
        style={{ 
          transform: `rotate(${rotation}deg)`,
          transition: 'transform 0.2s ease'
        }}
      >
        {/* N label and indicator */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-red-500 mb-0.5" />
          <div style={{ transform: `rotate(${-rotation}deg)`, transition: 'transform 0.2s ease' }}>
            <span className="text-[9px] font-bold text-red-500 leading-none block">N</span>
          </div>
        </div>
        
        {/* E label */}
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <div style={{ transform: `rotate(${-rotation}deg)`, transition: 'transform 0.2s ease' }}>
            <span className="text-[9px] font-bold text-zinc-400 block leading-none">E</span>
          </div>
        </div>
        
        {/* S label */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center justify-center">
          <div style={{ transform: `rotate(${-rotation}deg)`, transition: 'transform 0.2s ease' }}>
            <span className="text-[9px] font-bold text-zinc-400 block leading-none">S</span>
          </div>
        </div>
        
        {/* W label */}
        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <div style={{ transform: `rotate(${-rotation}deg)`, transition: 'transform 0.2s ease' }}>
            <span className="text-[9px] font-bold text-zinc-400 block leading-none">W</span>
          </div>
        </div>
      </div>
    </div>
  );
}
