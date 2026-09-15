'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { getCadProject } from '@/lib/api';
import { 
  fetchConversions, 
  deleteConversion, 
  renameConversion, 
  activateConversion 
} from '@/redux/slices/conversionsSlice';
import UploadPanel from './UploadPanel';
import ConversionQueue from './ConversionQueue';
import SvgPreview from './SvgPreview';
import ConversionConsole from './ConversionConsole';
import ProjectMap from './ProjectMap';
import { UploadCloud, List, Image, MapPin, ChevronLeft, ChevronRight, X, Menu } from 'lucide-react';

// ── Mobile tab IDs ──────────────────────────────────────────────────────────
const TABS = {
  QUEUE: 'queue',
  PREVIEW: 'preview',
  MAP: 'map',
};

export default function CadConversionStudio({ projectId }) {
  const dispatch = useDispatch();
  const [project, setProject] = useState(null);
  
  const { items: conversions } = useSelector(state => state.conversions);
  const [selectedConversionId, setSelectedConversionId] = useState(null);
  const [logs, setLogs] = useState([]);

  // Responsive state
  const [sidebarOpen, setSidebarOpen] = useState(false);   // mobile drawer
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop collapse
  const [activeTab, setActiveTab] = useState(TABS.PREVIEW); // mobile/tablet active tab
  const [showConsole, setShowConsole] = useState(true);

  useEffect(() => {
    if (projectId) {
      getCadProject(projectId).then(setProject).catch(console.error);
    }
  }, [projectId]);

  const addLog = useCallback((message, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date(), message, type }]);
  }, []);

  const loadConversions = useCallback(() => {
    if (projectId) {
      dispatch(fetchConversions(projectId));
    } else {
      dispatch(fetchConversions());
    }
  }, [dispatch, projectId]);

  useEffect(() => {
    loadConversions();
    const interval = setInterval(loadConversions, 3000);
    return () => clearInterval(interval);
  }, [loadConversions]);

  const selectedConversion = conversions.find(c => c.id === selectedConversionId) || null;

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteConversion(id)).unwrap();
      if (selectedConversionId === id) setSelectedConversionId(null);
      addLog(`Conversion ${id} deleted`, 'info');
    } catch (err) { addLog(`Failed to delete: ${err}`, 'error'); }
  };

  const handleUpdate = async (id, newName) => {
    try {
      await dispatch(renameConversion({ id, newName })).unwrap();
      addLog(`Conversion ${id} renamed to ${newName}`, 'info');
    } catch (err) { addLog(`Failed to update: ${err}`, 'error'); }
  };

  const handleReupload = async (id, file) => {
    try {
      addLog(`Uploading new file for conversion ${id}...`, 'info');
      const formData = new FormData();
      formData.append('file', file);
      const { authFetch } = await import('@/lib/api');
      const res = await authFetch(`/api/cad-conversion/${id}/upload`, {
        method: 'POST', body: formData,
      });
      if (res.ok) {
        addLog(`File successfully re-uploaded and queued for conversion ${id}`, 'info');
        loadConversions();
      } else {
        addLog(`Failed to re-upload for conversion ${id}`, 'error');
      }
    } catch (err) { addLog(`Error re-uploading: ${err}`, 'error'); }
  };

  const handleActivate = async (id) => {
    try {
      addLog(`Activating layout ${id}...`, 'info');
      await dispatch(activateConversion(id)).unwrap();
      addLog(`Layout ${id} activated successfully`, 'info');
      loadConversions();
    } catch (err) {
      addLog(`Failed to activate: ${err}`, 'error');
    }
  };

  // ── Sidebar content (shared between drawer + desktop panel) ────────────────
  const sidebarContent = (
    <>
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Upload CAD</h2>
        <UploadPanel
          projectId={projectId}
          onUploadStart={() => { addLog('Upload initiated', 'info'); loadConversions(); }}
          onUploadError={(err) => addLog(`Upload failed: ${err}`, 'error')}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <ConversionQueue
          conversions={conversions}
          selectedId={selectedConversionId}
          onSelect={(id) => {
            setSelectedConversionId(id);
            setSidebarOpen(false);    // close drawer on selection (mobile)
            setActiveTab(TABS.PREVIEW); // jump to preview tab (mobile)
          }}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          onReupload={handleReupload}
          onActivate={handleActivate}
        />
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-screen bg-[#FDF6ED] overflow-hidden text-gray-900 relative font-sans">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none z-0"></div>

      {/* ── Top Navbar ──────────────────────────────────────────────────────── */}
      <header className="h-14 border-b border-gray-200 bg-white backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50 shadow-lg relative">
        <div className="flex items-center gap-3">
          <Link href="/cad-conversion" className="text-zinc-400 hover:text-gray-900 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </Link>
          <div className="w-px h-5 bg-zinc-800"/>
          <h1 className="text-sm font-semibold text-zinc-100 uppercase tracking-widest truncate max-w-[180px] sm:max-w-xs">
            {project ? project.name : 'CAD CONVERSION'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Selected file name pill — tablet+ */}
          {selectedConversion && (
            <span className="hidden sm:inline-block text-xs font-bold tracking-wider text-[#ABD2FA] bg-[#ABD2FA] border border-[#ABD2FA] rounded-full px-4 py-1.5 truncate max-w-[220px] shadow-[0_0_10px_rgba(0,200,255,0.1)]">
              {selectedConversion.originalFileName}
            </span>
          )}
          {/* Hamburger — visible on mobile/tablet only */}
          <button
            className="xl:hidden text-zinc-400 hover:text-gray-900 p-1 rounded"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── Mobile/Tablet Drawer Overlay ─────────────────────────────────── */}
        {sidebarOpen && (
          <div
            className="xl:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Left Sidebar ─────────────────────────────────────────────────── */}
        {/* On mobile/tablet: slide-in drawer. On desktop: static panel (collapsible). */}
        <aside
          className={`
            flex flex-col bg-white backdrop-blur-md border-r border-gray-200 z-50 shrink-0
            transition-all duration-300 ease-in-out
            /* mobile/tablet: fixed drawer */
            fixed inset-y-0 right-0 top-14
            w-[280px] sm:w-80
            xl:static xl:top-auto xl:inset-y-auto
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
            xl:translate-x-0
            ${sidebarCollapsed ? 'xl:w-16' : 'xl:w-80'}
          `}
        >
          {/* Collapse toggle — desktop only */}
          <button
            className="hidden xl:flex absolute -right-3 top-6 w-7 h-7 items-center justify-center bg-white border border-gray-200 rounded-full text-gray-600 hover:text-[#ABD2FA] hover:border-[#ABD2FA] hover:shadow-[0_0_10px_rgba(171,210,250,0.4)] z-10 transition-all duration-300 group"
            onClick={() => setSidebarCollapsed(v => !v)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" /> : <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />}
          </button>

          {/* Mobile close button */}
          <button
            className="xl:hidden absolute top-2 right-2 text-zinc-400 hover:text-gray-900 p-1 rounded"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>

          {/* Content — hide when desktop-collapsed */}
          <div className={`flex flex-col flex-1 overflow-hidden ${sidebarCollapsed ? 'xl:hidden' : ''}`}>
            {sidebarContent}
          </div>

          {/* Collapsed icons — desktop only */}
          {sidebarCollapsed && (
            <div className="hidden xl:flex flex-col items-center gap-4 pt-4">
              <button
                className="text-zinc-400 hover:text-gray-900 p-2 rounded hover:bg-zinc-800"
                title="Uploads & Queue"
                onClick={() => setSidebarCollapsed(false)}
              >
                <UploadCloud size={18} />
              </button>
              <button
                className="text-zinc-400 hover:text-gray-900 p-2 rounded hover:bg-zinc-800"
                title="Conversions"
                onClick={() => setSidebarCollapsed(false)}
              >
                <List size={18} />
              </button>
            </div>
          )}
        </aside>

        {/* ── Center + Right: tab-driven on mobile/tablet, split on desktop ── */}
        <div className="flex-1 flex flex-col xl:flex-row overflow-hidden min-w-0">

          {/* Mobile Tab Bar */}
          <div className="xl:hidden flex border-b border-gray-200 bg-white shrink-0 relative z-10">
            {[
              { id: TABS.PREVIEW, icon: <Image size={15} />, label: 'Preview' },
              { id: TABS.MAP,     icon: <MapPin size={15} />, label: 'Map' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold uppercase tracking-wider transition-all duration-300
                  ${activeTab === tab.id
                    ? 'text-[#ABD2FA] border-b-2 border-[#ABD2FA] bg-[#FDF6ED] shadow-[inset_0_-2px_10px_rgba(171,210,250,0.1)]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Main Editor Column ──────────────────────────────────────────── */}
          <div
            className={`
              flex-1 flex flex-col min-w-0 overflow-hidden
              ${activeTab !== TABS.PREVIEW ? 'hidden xl:flex' : 'flex'}
            `}
          >
            {/* Canvas (Protected Dark Theme) */}
            <div className="flex-1 relative overflow-hidden bg-[#0c0f1d] backdrop-blur-md
              xl:m-6 xl:mb-4 xl:rounded-2xl xl:border xl:border-gray-200 xl:shadow-xl
              m-0 rounded-none border-0 transition-all z-10
            ">
              <SvgPreview
                conversion={selectedConversion}
                conversions={conversions}
                projectId={projectId}
              />
            </div>

            {/* Console — collapsible on mobile */}
            <div className={`
              shrink-0 border-t border-gray-200 xl:border xl:rounded-xl
              xl:mx-6 xl:mb-6 xl:mt-0 
              bg-white backdrop-blur-md shadow-xl overflow-hidden
              transition-all duration-300 relative z-10
              ${showConsole ? 'h-32 sm:h-40' : 'h-10'}
            `}>
              {/* Console toggle header */}
              <button
                className="xl:hidden w-full h-10 flex items-center px-4 gap-2 bg-[#FDF6ED] border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600 hover:text-[#ABD2FA] transition-colors"
                onClick={() => setShowConsole(v => !v)}
              >
                <span className={`transition-transform duration-300 ${showConsole ? 'rotate-180' : ''}`}>▲</span>
                Console
              </button>
              {showConsole && (
                <ConversionConsole logs={logs} selectedConversion={selectedConversion} />
              )}
            </div>
          </div>

          {/* ── Project Map Column ──────────────────────────────────────────── */}
          <div
            className={`
              xl:w-[400px] 2xl:w-[480px] shrink-0 overflow-y-auto relative z-10
              xl:p-6 p-4
              ${activeTab !== TABS.MAP ? 'hidden xl:block' : 'block flex-1'}
            `}
          >
            <ProjectMap project={project} onUpdateProject={setProject} />
          </div>
        </div>
      </div>
    </div>
  );
}
