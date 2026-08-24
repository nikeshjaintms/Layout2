'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, Loader2 } from 'lucide-react';
import { getProjectBoundaries } from '@/lib/api';
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), { ssr: false });
const BOUNDARY_DRAW_MODE = { POINTER: 'POINTER' };

export default function ProjectMap({ project }) {
  const [boundary, setBoundary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const mapContainerRef = useRef(null);
  const [isMapVisible, setIsMapVisible] = useState(false);

  useEffect(() => {
    if (project?.id) {
      getProjectBoundaries(project.id)
        .then(bounds => {
          if (bounds && bounds.length > 0) {
            const b = bounds[0];
            if (typeof b.geoJson === 'string') {
              try { b.geoJson = JSON.parse(b.geoJson); } catch (e) {}
            }
            setBoundary(b);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [project?.id]);

  useEffect(() => {
    if (loading || !boundary) return;
    const el = mapContainerRef.current;
    if (!el) return;
    
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setIsMapVisible(true);
        } else {
          setIsMapVisible(false);
        }
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading, boundary]);

  if (!project) return null;

  return (
    <div className="flex flex-col bg-[#1d2440]/60 backdrop-blur-md text-slate-300 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <MapPin size={16} className="text-[#00c8ff]" />
          Project Location
        </h2>
      </div>
      
      <div className="flex flex-col flex-1 relative min-h-[280px]">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-zinc-500 h-full">
            <Loader2 className="animate-spin mb-2" size={24} />
            <p className="text-sm">Loading location data...</p>
          </div>
        ) : boundary ? (
          <div className="flex flex-col w-full h-full">
            {/* Map Preview */}
            <div ref={mapContainerRef} className="w-full h-[450px] sm:h-[500px] lg:h-[550px] xl:h-[600px] 2xl:h-[700px] relative bg-[#0a0a0a] pointer-events-none">
               {isMapVisible && (
                 <LeafletMap
                    mapType="hybrid"
                    drawMode={BOUNDARY_DRAW_MODE.POINTER}
                    drawingBoundary={false}
                    boundaries={[boundary]}
                    activeBoundaryId={null}
                    initialBounds={boundary.latMin ? [[boundary.latMin, boundary.lngMin], [boundary.latMax, boundary.lngMax]] : null}
                    staticPreview={true}
                    className="w-full h-full"
                 />
               )}
               {/* Overlay to ensure it feels like a static card preview */}
               <div className="absolute inset-0 ring-1 ring-inset ring-black/50 z-10" />
            </div>
            
            {/* Details */}
            <div className="p-5 flex flex-col space-y-4 bg-white/5">
               <Link 
                 href={`/cad-conversion/${project.id}/map`}
                 className="mt-2 flex items-center justify-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 bg-[#00c8ff]/10 hover:bg-[#00c8ff] text-[#00c8ff] hover:text-[#0f111a] border border-[#00c8ff]/30 text-[10px] sm:text-xs uppercase tracking-wider font-bold rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(0,200,255,0.1)] hover:shadow-[0_0_25px_rgba(0,200,255,0.4)] w-full"
               >
                 Continue to Map
                 <ArrowRight size={16} />
               </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center justify-center text-center space-y-4 h-full">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-2 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              <MapPin size={32} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No Location Set</h3>
              <p className="text-sm text-[#8ba0b8] mt-1 font-medium">
                Pin this project on the map to enable GIS features.
              </p>
            </div>

            <Link 
              href={`/cad-conversion/${project.id}/map`}
              className="mt-4 flex items-center justify-center gap-1 sm:gap-2 px-3 py-1.5 sm:px-5 sm:py-2.5 bg-[#00c8ff]/10 hover:bg-[#00c8ff] text-[#00c8ff] hover:text-[#0f111a] border border-[#00c8ff]/30 text-[10px] sm:text-xs uppercase tracking-wider font-bold rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(0,200,255,0.1)] hover:shadow-[0_0_25px_rgba(0,200,255,0.4)] w-full"
            >
              Continue to Map
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
