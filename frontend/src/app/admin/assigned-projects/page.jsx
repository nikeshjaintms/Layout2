'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects, updateProjectStatus } from '@/redux/slices/projectsSlice';
import AuthGuard from '@/components/auth/AuthGuard';
import { Folder, User, Mail, Search, X, Loader2, ChevronDown, CheckCircle2, XCircle, Globe, ExternalLink } from 'lucide-react';
import Swal from 'sweetalert2';

export default function AdminAssignedProjects() {
  const dispatch = useDispatch();
  const { items: projects, loading } = useSelector(state => state.projects);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    dispatch(fetchProjects({ page: 1, limit: 100, search: debouncedSearch }));
  }, [dispatch, debouncedSearch]);

  const handleAdminStatusToggle = async (e, project) => {
    e.preventDefault();
    e.stopPropagation();

    const effectiveActive = project.adminActive && project.clientActive;
    const newStatus = !effectiveActive;
    const actionText = newStatus ? 'Force Activate' : 'Deactivate';

    const result = await Swal.fire({
      title: `${actionText} Project?`,
      html: `Are you sure you want to <b>${actionText.toLowerCase()}</b> ${project.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newStatus ? '#22c55e' : '#ef4444',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: `Yes, ${actionText}`,
      background: '#18181b',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(updateProjectStatus({ id: project.id, active: newStatus })).unwrap();
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Failed', text: err, background: '#18181b', color: '#fff' });
      }
    }
  };

  return (
    <AuthGuard requirePermission={{ action: 'read', subject: 'project' }}>
    <div className="p-8 h-full flex flex-col">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-wide uppercase drop-shadow-md">
            Assigned Projects
          </h1>
          <p className="text-gray-600 mt-2 font-medium">
            View all projects assigned to your administration.
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-600" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-[#8ba0b8] focus:outline-none focus:border-[#ABD2FA] focus:ring-1 focus:ring-[#00c8ff]/50 transition-all text-sm"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-900"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <Loader2 className="w-8 h-8 text-[#ABD2FA] animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
          <Folder size={48} className="mb-4 opacity-50" />
          <p>No projects found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link href={`/cad-conversion/${project.id}`} key={project.id} className="bg-white backdrop-blur-md border border-gray-200 rounded-[2rem] p-6 hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 group cursor-pointer block">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-gray-200 flex items-center justify-center text-[#ABD2FA] group-hover:bg-[#ABD2FA] group-hover:border-[#ABD2FA] transition-colors">
                  <Folder size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-lg line-clamp-1" title={project.name}>{project.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <button 
                      onClick={(e) => handleAdminStatusToggle(e, project)}
                      className={`text-[10px] font-black px-2 py-1 rounded border flex items-center gap-1 ${project.adminActive && project.clientActive ? 'bg-[#ABD2FA] text-[#18181b] border-[#ABD2FA] hover:bg-[#9bc2ea]' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'}`}
                      title="Toggle Effective Status"
                    >
                      STATUS: {project.adminActive && project.clientActive ? 'ACTIVE' : 'INACTIVE'}
                      <ChevronDown size={12} />
                    </button>
                    {!project.adminActive && (
                       <span className="text-[10px] font-black px-2 py-1 rounded border bg-zinc-500/10 text-zinc-400 border-zinc-500/20">
                         Restricted by Admin
                       </span>
                    )}
                    {!project.clientActive && project.adminActive && (
                       <span className="text-[10px] font-black px-2 py-1 rounded border bg-orange-500/10 text-orange-400 border-orange-500/20">
                         Deactivated by Client
                       </span>
                    )}
                  </div>
                </div>
                <a
                  href={`/projects/${project.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-[#ABD2FA]/20 border border-gray-200 hover:border-[#ABD2FA] text-gray-500 hover:text-[#0066FF] flex items-center justify-center shrink-0 transition-all shadow-sm"
                  title="View on Public Site (/projects)"
                >
                  <Globe size={16} />
                </a>
              </div>
              
              <div className="flex justify-between items-start pt-6 border-t border-gray-200">
                <div className="flex flex-col flex-1 min-w-0 pr-2">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Client</span>
                  <span className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1.5 truncate">
                    <User size={14} className="text-[#ABD2FA] shrink-0"/> 
                    <span className="truncate">{project.owner?.name || 'Unassigned'}</span>
                  </span>
                  {project.owner?.email && (
                    <span className="text-xs text-gray-600 mt-1 flex items-center gap-1.5 truncate" title={project.owner.email}>
                      <Mail size={12} className="shrink-0"/> 
                      <span className="truncate">{project.owner.email}</span>
                    </span>
                  )}
                </div>
                <div className="flex flex-col items-end shrink-0 pl-2 border-l border-gray-200">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Plots</span>
                  <span className="text-lg font-black text-[#ABD2FA] mt-1">{project._count?.plots || 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
    </AuthGuard>
  );
}
