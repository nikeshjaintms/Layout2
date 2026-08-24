import React, { useState, useEffect } from 'react';
import { authFetch } from '@/lib/api';

export default function AuthImage({ src, alt, className, ...props }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activeUrl = null;
    if (!src) {
      setLoading(false);
      return;
    }

    if (src.startsWith('blob:') || src.startsWith('data:')) {
      setObjectUrl(src);
      setLoading(false);
      return;
    }

    let isMounted = true;
    
    // Construct safe api path
    let apiPath = src;
    try {
      const urlObj = new URL(src);
      apiPath = urlObj.pathname + urlObj.search;
    } catch (e) {
      if (src.startsWith('http')) {
        apiPath = src;
      }
    }

    authFetch(apiPath)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch image');
        return res.blob();
      })
      .then(blob => {
        if (!isMounted) return;
        activeUrl = URL.createObjectURL(blob);
        setObjectUrl(activeUrl);
        setLoading(false);
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('AuthImage fetch error:', err);
        setError(true);
        setLoading(false);
      });

    return () => {
      isMounted = false;
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [src]);

  if (loading) {
    return (
      <div className={`animate-pulse bg-white/10 flex items-center justify-center text-xs text-slate-500 ${className}`}>
        Loading...
      </div>
    );
  }

  if (error || !objectUrl) {
    return (
      <div className={`bg-white/5 flex flex-col items-center justify-center text-xs text-slate-500 border border-white/10 ${className}`}>
        <svg className="w-6 h-6 mb-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Failed
      </div>
    );
  }

  return <img src={objectUrl} alt={alt} className={className} {...props} />;
}
