'use client';

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPublicProjectById } from '@/redux/slices/projectsSlice';
import { fetchPublicConversions } from '@/redux/slices/conversionsSlice';
import UserLayoutViewer from './UserLayoutViewer';
import UserProjectLoading from './UserProjectLoading';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function UserProjectDetails({ projectId }) {
  const dispatch = useDispatch();
  
  const project = useSelector(state => state.projects.selectedProject);
  const conversions = useSelector(state => state.conversions.items);
  const loading = useSelector(state => state.projects.loading || state.conversions.loading);
  const error = useSelector(state => state.projects.error || state.conversions.error);

  const [activeConversion, setActiveConversion] = useState(null);
  const [isInitialMount, setIsInitialMount] = useState(true);

  useEffect(() => {
    setIsInitialMount(false);
  }, []);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchPublicProjectById(projectId));
      dispatch(fetchPublicConversions(projectId));
    }
  }, [projectId, dispatch]);

  useEffect(() => {
    if (conversions && conversions.length > 0) {
      const active = conversions.find(c => c.isActive);
      setActiveConversion(active || null);
    } else {
      setActiveConversion(null);
    }
  }, [conversions]);

  if (isInitialMount || loading) {
    return (
      <div className="min-h-screen bg-[#131826] pt-20 relative font-sans">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none z-0"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <UserProjectLoading />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#131826] text-slate-300 flex flex-col items-center justify-center p-8 relative font-sans">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none z-0"></div>
        <div className="relative z-10 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-4">Project Not Found</h2>
          <p className="text-[#8ba0b8] mb-8">{error || "The project you're looking for doesn't exist or is unavailable."}</p>
          <Link href="/projects" className="px-6 py-3 bg-[#00c8ff]/10 text-[#00c8ff] hover:bg-[#00c8ff] hover:text-[#0f111a] border border-[#00c8ff]/30 rounded-lg text-sm font-bold uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(0,200,255,0.1)] hover:shadow-[0_0_15px_rgba(0,200,255,0.3)]">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#131826] overflow-hidden relative font-sans">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none z-0"></div>
      
      {activeConversion && activeConversion.status === 'SUCCESS' ? (
        <UserLayoutViewer project={project} conversion={activeConversion} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center relative z-10">
          <h2 className="text-2xl font-bold text-white uppercase tracking-wider mb-4">No Layout Available</h2>
          <p className="text-[#8ba0b8] max-w-md text-center mb-8">
            This project does not have a finalized master plan layout available for viewing yet.
          </p>
          <Link href="/projects" className="px-6 py-3 bg-[#00c8ff]/10 text-[#00c8ff] hover:bg-[#00c8ff] hover:text-[#0f111a] border border-[#00c8ff]/30 rounded-lg text-sm font-bold uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(0,200,255,0.1)] hover:shadow-[0_0_15px_rgba(0,200,255,0.3)] inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Link>
        </div>
      )}
    </div>
  );
}
