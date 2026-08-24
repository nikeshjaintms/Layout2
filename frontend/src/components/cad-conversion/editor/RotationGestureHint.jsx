import React, { useEffect, useState } from 'react';

export default function RotationGestureHint({ isVisible, onDismiss }) {
  const [render, setRender] = useState(isVisible);
  const [opacity, setOpacity] = useState(isVisible ? 1 : 0);

  useEffect(() => {
    if (isVisible) {
      setRender(true);
      requestAnimationFrame(() => setOpacity(1));
    } else {
      setOpacity(0);
      const timer = setTimeout(() => {
        setRender(false);
      }, 500); // fade out duration
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!render) return null;

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center z-[1500] transition-opacity duration-500 touch-none pointer-events-auto"
      style={{ opacity }}
      onClick={onDismiss}
      onPointerDown={onDismiss}
      onTouchStart={onDismiss}
      onWheel={onDismiss}
    >
      <style>{`
        @keyframes rotate-gesture {
          0% { transform: rotate(-30deg) scale(1); }
          50% { transform: rotate(30deg) scale(1.1); }
          100% { transform: rotate(-30deg) scale(1); }
        }
        .animate-rotate-gesture {
          animation: rotate-gesture 2.5s ease-in-out infinite;
          transform-origin: 50% 80%; /* Pivot near the wrist */
        }
      `}</style>
      
      {/* Background radial gradient to make it readable */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-all duration-500 pointer-events-none" />
      
      {/* The animated icon wrapper */}
      <div className="relative flex flex-col items-center justify-center animate-rotate-gesture text-white/90 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] pointer-events-none">
        
        {/* Custom image of a proper hand */}
        <img src="/hand.png" alt="Rotate Gesture" className="w-16 h-16 object-contain" />

      </div>

    </div>
  );
}
