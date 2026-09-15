'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize, RotateCcw, Share2, Map as MapIcon, Image as ImageIcon, Images, Navigation, Info, Search, X } from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';
// Removed duplicate lucide-react imports
import { getPublicProjectPlotStatuses, getPublicProjectPlots } from '@/lib/api';
import { PLOT_TYPE_CONFIG } from '@/lib/plotTypeConfig';
import UserProjectGalleryModal from './UserProjectGalleryModal';
import UserProjectInfoModal from './UserProjectInfoModal';

export default function UserViewerToolbar({ 
  project, 
  conversionId,
  layoutName, 
  zoomIn, 
  zoomOut, 
  resetTransform, 
  centerView,
  currentZoom = 1,
  isMapView = false,
  showPlotStatus = false,
  onTogglePlotStatus
}) {
  const [plots, setPlots] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  
  useEffect(() => {
    if (project?.id && conversionId) {
      getPublicProjectPlots(project.id, { pagination: false, conversionId })
        .then(data => {
          if (data && Array.isArray(data)) {
            setPlots(data);
          }
        })
        .catch(err => console.error('Failed to load project plots:', err));
    } else if (project?.id && isMapView) {
      getPublicProjectPlots(project.id, { pagination: false })
        .then(data => {
          if (data && Array.isArray(data)) {
            setPlots(data);
          }
        })
        .catch(err => console.error('Failed to load project plots:', err));
    }
  }, [project?.id, conversionId, isMapView]);

  const getFilteredPlots = () => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.trim().toLowerCase();
    
    const exact = [];
    const exactCI = [];
    const starts = [];
    const contains = [];

    plots.forEach(p => {
      if (!p.plotNumber) return;
      
      const pNum = String(p.plotNumber);
      const pNumLower = pNum.toLowerCase();

      if (pNum === searchQuery.trim()) {
        exact.push(p);
      } else if (pNumLower === query) {
        exactCI.push(p);
      } else if (pNumLower.startsWith(query)) {
        starts.push(p);
      } else if (pNumLower.includes(query)) {
        contains.push(p);
      }
    });

    return [...exact, ...exactCI, ...starts, ...contains].slice(0, 50); // Limit results
  };

  const filteredPlots = getFilteredPlots();

  const executeSearch = () => {
    if (!searchQuery.trim()) {
      // Empty search + Enter triggers a return to normal view
      window.dispatchEvent(new CustomEvent('viewer-search-select-plot', { detail: { plot: null } }));
      return;
    }

    const filtered = getFilteredPlots();

    if (filtered.length > 0) {
      window.dispatchEvent(new CustomEvent('viewer-search-select-plot', { detail: { plot: filtered[0] } }));
      setSearchQuery('');
    } else {
      Swal.fire({
        title: 'Not Found',
        text: `Plot ${searchQuery} not found`,
        icon: 'info',
        confirmButtonColor: '#3b82f6',
        background: '#18181b',
        color: '#e4e4e7',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };
  
  const handleShare = async () => {
    const url = window.location.href;
    const title = project?.name || 'Project Layout';
    const text = `Check out the layout for ${title}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return; // Success handled by native UI
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        } else {
          return; // User cancelled
        }
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(url);
      Swal.fire({
        title: 'Success!',
        text: 'Project link copied successfully.',
        icon: 'success',
        confirmButtonColor: '#3b82f6',
        background: '#18181b',
        color: '#e4e4e7'
      });
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: 'Unable to share project.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
        background: '#18181b',
        color: '#e4e4e7'
      });
    }
  };


  const handleLocate = () => {
    if (project?.googleMapsLink) {
      window.open(project.googleMapsLink, '_blank', 'noopener,noreferrer');
    } else {
      Swal.fire({
        title: 'Location Not Set',
        text: 'A location has not been added for this project yet.',
        icon: 'info',
        confirmButtonColor: '#3b82f6',
        background: '#18181b',
        color: '#e4e4e7',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  const [plotStatuses, setPlotStatuses] = useState([]);

  useEffect(() => {
    if (project?.id) {
      getPublicProjectPlotStatuses(project.id, { pagination: false })
        .then(data => {
          if (data && Array.isArray(data)) {
            setPlotStatuses(data);
          }
        })
        .catch(err => console.error('Failed to load plot statuses:', err));
    }
  }, [project?.id]);

  const zoomPercent = Math.round(currentZoom * 100);

  return (
    <>
      {/* Floating Zoom Controls (Top Left) */}
      <div className="fixed top-6 left-6 z-[1000] flex items-center gap-1 sm:gap-1.5 bg-[#0f111a]/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/5 rounded-full px-1.5 py-1 sm:px-2 sm:py-1.5 pointer-events-auto">
        <button
          onClick={() => zoomOut()}
          className="p-1 sm:p-1.5 text-[#8ba0b8] hover:text-[#00c8ff] hover:bg-[#00c8ff]/10 rounded-full transition-all duration-300"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        
        <div className="w-10 sm:w-14 text-center text-[10px] sm:text-xs font-bold text-white tracking-widest font-mono">
          {zoomPercent}%
        </div>

        <button
          onClick={() => zoomIn()}
          className="p-1 sm:p-1.5 text-[#8ba0b8] hover:text-[#00c8ff] hover:bg-[#00c8ff]/10 rounded-full transition-all duration-300"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        <div className="h-3 sm:h-4 w-px bg-white/10 mx-0.5 sm:mx-1"></div>

        <button
          onClick={() => centerView()}
          className="p-1 sm:p-1.5 text-[#8ba0b8] hover:text-[#00c8ff] hover:bg-[#00c8ff]/10 rounded-full transition-all duration-300"
          title="Fit to Screen"
        >
          <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        
        <button
          onClick={() => resetTransform()}
          className="p-1 sm:p-1.5 text-[#8ba0b8] hover:text-[#00c8ff] hover:bg-[#00c8ff]/10 rounded-full transition-all duration-300"
          title="Reset Zoom"
        >
          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* Floating Legend Panel (Right Aligned) */}
      {showPlotStatus && plotStatuses.length > 0 && (
        <div className="fixed bottom-[8.5rem] right-6 flex flex-col gap-1 animate-in fade-in slide-in-from-right-4 duration-300 pointer-events-none z-[1000]">
          {plotStatuses.map(status => (
            <div key={status.id} className="flex items-center flex-row-reverse gap-1.5">
              <span 
                className="w-2 h-2 rounded-full flex-shrink-0 shadow-[0_0_4px_rgba(0,0,0,0.8)] border border-white/20" 
                style={{ backgroundColor: status.fillColor || '#888' }}
              />
              <span className="text-[8px] text-white/90 font-bold tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-right">
                {status.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Bottom-Right Controls Panel */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col items-end gap-2 sm:gap-3 z-[1000] pointer-events-none max-w-[calc(100vw-2rem)] overflow-hidden">
        
        {/* Top Row: Search & Plot Status */}
        <div className="flex flex-row items-center justify-end gap-2 sm:gap-3 pointer-events-auto w-full">
          {/* Search Bar */}
          <div className="relative w-[140px] sm:w-[180px] shrink-0">
            <div className={`flex items-center h-[36px] sm:h-[44px] bg-[#0f111a]/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/5 rounded-full px-2 sm:px-4 pointer-events-auto transition-all duration-300 focus-within:border-[#00c8ff]/50 focus-within:shadow-[0_0_15px_rgba(0,200,255,0.2)]`}>
              <button 
                onClick={executeSearch}
                className="p-1 hover:bg-white/10 rounded-full transition-colors group mr-1"
                title="Search Plot"
              >
                <Search className="w-4 h-4 text-[#8ba0b8] group-hover:text-white" />
              </button>
              <input
                type="text"
                placeholder="Search plot number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    executeSearch();
                  }
                }}
                className="bg-transparent border-none text-sm text-white placeholder:text-[#8ba0b8]/70 focus:outline-none w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    window.dispatchEvent(new CustomEvent('viewer-search-select-plot', { detail: { plot: null } }));
                  }}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors text-[#8ba0b8] hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          
          {/* Plot Status */}
          <div className="relative flex items-center justify-between gap-1.5 sm:gap-2.5 px-3 sm:px-4 h-[36px] sm:h-[44px] bg-[#0f111a]/60 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/5 rounded-full pointer-events-auto w-[130px] sm:w-[180px] shrink-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-[#8ba0b8] uppercase tracking-[0.1em] sm:tracking-[0.2em] truncate">
              Plot Status
            </span>
            <button 
              onClick={onTogglePlotStatus}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-300 focus:outline-none shadow-[inset_0_2px_6px_rgba(0,0,0,0.4)] ${showPlotStatus ? 'bg-[#00c8ff]' : 'bg-[#131826] border border-white/5'}`}
              aria-label="Toggle plot status"
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${showPlotStatus ? 'translate-x-4.5 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'translate-x-1 opacity-70'}`} />
            </button>
          </div>
        </div>

        {/* Bottom Row: Actions */}
        <div className="flex flex-row items-center justify-end gap-1.5 sm:gap-3 pointer-events-auto w-full">
          {/* Locate */}
          <button
            onClick={handleLocate}
            className="w-[36px] h-[36px] sm:w-auto sm:h-[44px] p-0 sm:px-4 bg-[#1a1d24]/90 backdrop-blur-md shadow-lg border border-white/10 rounded-full text-[#a1a1aa] hover:text-white transition-all duration-300 flex items-center justify-center sm:justify-start gap-2 text-[13px] font-medium tracking-wide shrink-0"
            title="Locate on Map"
          >
            <Navigation className="w-4 h-4 fill-transparent" />
            <span className="hidden sm:inline">Locate</span>
          </button>

          {/* Info */}
          <button
            onClick={() => setIsInfoOpen(true)}
            className="w-[36px] h-[36px] sm:w-auto sm:h-[44px] p-0 sm:px-4 bg-[#1a1d24]/90 backdrop-blur-md shadow-lg border border-white/10 rounded-full text-[#a1a1aa] hover:text-white transition-all duration-300 flex items-center justify-center sm:justify-start gap-2 text-[13px] font-medium tracking-wide shrink-0"
            title="Project Info"
          >
            <Info className="w-4 h-4" />
            <span className="hidden sm:inline">Info</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="w-[36px] h-[36px] sm:w-auto sm:h-[44px] p-0 sm:px-4 bg-[#1a1d24]/90 backdrop-blur-md shadow-lg border border-white/10 rounded-full text-[#a1a1aa] hover:text-white transition-all duration-300 flex items-center justify-center sm:justify-start gap-2 text-[13px] font-medium tracking-wide shrink-0"
            title="Share Project"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Gallery */}
          <button
            onClick={() => setIsGalleryOpen(true)}
            className="w-auto px-3 sm:px-4 sm:w-[120px] lg:w-[180px] h-[36px] sm:h-[44px] bg-[#1a1d24]/90 backdrop-blur-md shadow-lg border border-white/10 rounded-full text-[#a1a1aa] hover:text-white transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-[14px] font-medium tracking-wide shrink-0"
            title="View Gallery"
          >
            <Images className="w-4 h-4" />
            <span className="hidden sm:inline">Gallery</span>
          </button>

          {/* Map/Layout */}
          <Link
            href={`/projects/${project?.id}${isMapView ? '' : '/map'}`}
            className="w-auto px-3 sm:px-4 sm:w-[120px] lg:w-[180px] h-[36px] sm:h-[44px] bg-[#00c8ff]/10 hover:bg-[#00c8ff] text-[#00c8ff] hover:text-[#0f111a] border border-[#00c8ff]/30 rounded-full transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-[12px] font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(0,200,255,0.1)] hover:shadow-[0_0_20px_rgba(0,200,255,0.4)] shrink-0"
          >
            {isMapView ? (
              <>
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Layout</span>
              </>
            ) : (
              <>
                <MapIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Map</span>
              </>
            )}
          </Link>
        </div>
      </div>
      
      <UserProjectGalleryModal 
        isOpen={isGalleryOpen} 
        onClose={() => setIsGalleryOpen(false)} 
        projectId={project?.id} 
      />

      <UserProjectInfoModal 
        isOpen={isInfoOpen} 
        onClose={() => setIsInfoOpen(false)} 
        project={project}
      />
    </>
  );
}
