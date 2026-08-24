'use client';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGallery } from '@/redux/slices/projectGallerySlice';
import { X, Loader2, Image as ImageIcon } from 'lucide-react';
import { BASE_URL } from '@/lib/api';

export default function UserProjectGalleryModal({ isOpen, onClose, projectId }) {
  const dispatch = useDispatch();
  const { items: allGallery, loading } = useSelector(state => state.projectGallery);
  const gallery = allGallery.filter(item => item.isActive !== false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    if (isOpen && projectId) {
      dispatch(fetchGallery({ projectId, page: 1, limit: 100 }));
    }
  }, [isOpen, projectId, dispatch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-6xl max-h-[90vh] bg-[#131826] border border-white/10 rounded-2xl shadow-2xl flex flex-col m-4 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Floating Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 text-white bg-black/50 hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 text-[#00c8ff] animate-spin" />
            </div>
          ) : gallery?.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No images available for this project yet.</p>
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
              {gallery.map(item => (
                <div 
                  key={item.id} 
                  className="relative group overflow-hidden rounded-xl border border-white/10 cursor-pointer break-inside-avoid bg-[#1d2440]"
                  onClick={() => setSelectedImage(item.imageUrl)}
                >
                  <img 
                    src={item.imageUrl?.startsWith('http') ? item.imageUrl : `${BASE_URL}${item.imageUrl}`} 
                    alt={item.title || "Project Image"}
                    className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  {item.title && (
                    <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <p className="text-white text-sm font-medium line-clamp-2">{item.title}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-md">
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-white/10 rounded-full transition-colors z-50"
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={selectedImage?.startsWith('http') ? selectedImage : `${BASE_URL}${selectedImage}`} 
            alt="Fullscreen View"
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg animate-in zoom-in duration-300 shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
