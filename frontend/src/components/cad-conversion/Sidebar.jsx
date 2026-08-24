'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjectDetails } from '@/redux/slices/projectDetailsSlice';
import { LayoutGrid, Activity, Palette, Coffee, Menu, X, Info, Image as ImageIcon, MapPin } from 'lucide-react';
import { Can } from '@/lib/ability';
import { AbilityContext } from '@/lib/ability';
import { useContext } from 'react';

export default function Sidebar({ projectId }) {
  const dispatch = useDispatch();
  const ability = useContext(AbilityContext);
  const { data: project } = useSelector(state => state.projectDetails);
  
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const editorIdFromUrl = searchParams.get('editorId');
  const activeConversion = project?.conversions?.find(c => c.isActive) || project?.conversions?.[0];
  const editorId = editorIdFromUrl || activeConversion?.id;
  
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (projectId && (!project || String(project.id) !== String(projectId))) {
      dispatch(fetchProjectDetails(projectId));
    }
  }, [projectId, project, dispatch]);

  const querySuffix = editorId ? `?editorId=${editorId}` : '';

  const navItems = [

    {
      name: 'Details',
      href: `/cad-conversion/${projectId}/details${querySuffix}`,
      activeMatch: `/cad-conversion/${projectId}/details`,
      icon: Info,
      action: 'read',
      subject: 'project'
    },
    {
      name: 'Gallery',
      href: `/cad-conversion/${projectId}/gallery${querySuffix}`,
      activeMatch: `/cad-conversion/${projectId}/gallery`,
      icon: ImageIcon,
      action: 'read',
      subject: 'gallery'
    },
    {
      name: 'Manage Plots',
      href: `/cad-conversion/${projectId}/manage-plot${querySuffix}`,
      activeMatch: `/cad-conversion/${projectId}/manage-plot`,
      icon: LayoutGrid,
      action: 'read',
      subject: 'plot'
    },
    {
      name: 'Plot Status',
      href: `/cad-conversion/${projectId}/plot-statuses${querySuffix}`,
      activeMatch: `/cad-conversion/${projectId}/plot-statuses`,
      icon: Activity,
      action: 'read',
      subject: 'status'
    },
    {
      name: 'Plot Appearance',
      href: `/cad-conversion/${projectId}/plot-appearance${querySuffix}`,
      activeMatch: `/cad-conversion/${projectId}/plot-appearance`,
      icon: Palette,
      action: 'read',
      subject: 'appearance'
    },
    {
      name: 'Amenities',
      href: `/masters/amenities?projectId=${projectId}${editorId ? '&editorId=' + editorId : ''}`,
      activeMatch: `/masters/amenities`,
      icon: Coffee,
      action: 'read',
      subject: 'amenity'
    }
  ];

  return (
    <>
      {/* Mobile Header / Hamburger */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0f111a] border-b border-white/5 flex-shrink-0">
        <div className="flex-1 flex justify-center overflow-hidden mr-2">
          {project?.logoUrl ? (
            <img src={project.logoUrl.startsWith('http') ? project.logoUrl : `http://localhost:5000${project.logoUrl}`} alt={project?.name || 'Project Logo'} className="h-8 w-auto max-w-full object-contain shrink-0" />
          ) : (
            <div className="h-8 w-8 bg-white/5 rounded border border-white/10 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-[#8ba0b8]">{project?.name?.charAt(0) || 'P'}</span>
            </div>
          )}
        </div>
        <button onClick={() => setIsOpen(true)} className="text-white p-1 shrink-0">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0f111a] border-r border-white/5 flex flex-col h-full min-h-screen transform transition-transform duration-300 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} flex-shrink-0`}>
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-8 pl-3 md:mb-8 md:justify-center md:pl-0">
            <div className="flex justify-center items-center w-full overflow-hidden">
              {project?.logoUrl ? (
                <img src={project.logoUrl.startsWith('http') ? project.logoUrl : `http://localhost:5000${project.logoUrl}`} alt={project?.name || 'Project Logo'} className="h-12 w-auto max-w-[180px] object-contain rounded" />
              ) : (
                <div className="h-12 w-12 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center shrink-0">
                  <span className="text-xl font-bold text-[#8ba0b8]">{project?.name?.charAt(0) || 'P'}</span>
                </div>
              )}
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white md:hidden p-1 shrink-0 ml-2">
              <X size={24} />
            </button>
          </div>
          
          <nav className="space-y-3 relative pl-3">
            {navItems.map((item) => {
              if (item.action && item.subject && !ability.can(item.action, item.subject)) {
                return null;
              }

              const isActive = pathname.startsWith(item.activeMatch);
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`group flex items-center gap-4 px-4 py-3 text-[14px] font-medium transition-all duration-300 relative ${
                    isActive
                      ? 'text-[#00c8ff]'
                      : 'text-[#8ba0b8] hover:text-[#c4d6eb]'
                  }`}
                >
                  {/* Active Tab Background & Glowing Border */}
                  {isActive && (
                    <div className="absolute inset-0 bg-[#1d2440] rounded-l-xl border border-[#00c8ff]/30 border-r-0 shadow-[inset_4px_0_15px_rgba(0,200,255,0.1)] -right-6 overflow-hidden">
                       <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-[#00c8ff] shadow-[0_0_12px_rgba(0,200,255,0.8)]"></div>
                    </div>
                  )}
                  
                  {/* Hover state for inactive tabs */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-white/5 rounded-l-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -right-6"></div>
                  )}
                  
                  <Icon className={`w-[18px] h-[18px] relative z-10 transition-transform duration-300 ${isActive ? 'text-[#00c8ff]' : 'text-[#8ba0b8] group-hover:text-[#c4d6eb]'}`} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="p-6 border-t border-white/5 space-y-3">
          {editorId && (
            <Link
              href={`/cad-conversion/${projectId}/editor/${editorId}`}
              className="w-full flex items-center justify-center py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all bg-[#00c8ff]/10 text-[#00c8ff] border border-[#00c8ff]/30 hover:bg-[#00c8ff] hover:text-[#0f111a]"
            >
              Continue to Editor
            </Link>
          )}
          <Link
            href={`/cad-conversion/${projectId}/map`}
            className="w-full flex items-center justify-center py-2.5 px-4 text-xs font-bold uppercase tracking-wider rounded-lg transition-all bg-white/5 text-[#8ba0b8] border border-white/10 hover:bg-white/10 hover:text-white"
          >
            Continue to Map
          </Link>
        </div>
      </aside>
    </>
  );
}
