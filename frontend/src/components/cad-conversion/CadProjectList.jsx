'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProjects, createProject, deleteProject, updateProjectStatus } from '@/redux/slices/projectsSlice';
import { fetchMySubscription } from '@/redux/slices/subscriptionsSlice';
import { logoutUser } from '@/redux/slices/authSlice';
import ChangePasswordModal from '@/components/auth/ChangePasswordModal';
import Swal from 'sweetalert2';
import { Search, Plus, Folder, Calendar, FileImage, ArrowRight, X, Trash2, ChevronDown, Shield, LogOut, LayoutDashboard } from 'lucide-react';
import { Can } from '@/lib/ability';

export default function CadProjectList() {
  const dispatch = useDispatch();
  const { items: projects, loading, isCreating, pagination } = useSelector(state => state.projects);
  const { mySubscription } = useSelector(state => state.subscriptions);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const router = useRouter();

  // User menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const authUser = useSelector((state) => state.auth.user);
  
  const displayName = authUser?.name || authUser?.email || 'User';
  const displayEmail = authUser?.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    router.push('/login');
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      if (search !== debouncedSearch) {
        setCurrentPage(1); // Reset to first page on new search
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  useEffect(() => {
    dispatch(fetchProjects({ page: currentPage, limit: 10, search: debouncedSearch }));
    dispatch(fetchMySubscription());
  }, [dispatch, currentPage, debouncedSearch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    try {
      const resultAction = await dispatch(createProject({ name: newProjectName })).unwrap();
      setShowCreateForm(false);
      setNewProjectName('');
      router.push(`/cad-conversion/${resultAction.id}`);
    } catch (err) {
      console.error(err);
      Swal.fire({ 
        icon: 'error', 
        title: 'Failed to create project', 
        text: err, 
        background: '#18181b', 
        color: '#fff',
        confirmButtonColor: '#ef4444'
      });
    }
  };

  const handleDelete = async (e, projectId, projectName) => {
    e.preventDefault();
    e.stopPropagation();

    const result = await Swal.fire({
      title: 'Delete Project?',
      html: `Are you sure you want to delete <b>${projectName}</b>?<br/>This cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: 'Yes, Delete',
      background: '#18181b',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteProject(projectId)).unwrap();
        Swal.fire({ 
          title: 'Deleted!', 
          text: 'Project has been deleted.', 
          icon: 'success', 
          background: '#18181b', 
          color: '#fff',
          timer: 1500,
          showConfirmButton: false
        });
        
        // If we are on a page where the last item gets deleted, we might want to fetch again
        // dispatch(fetchProjects({ page: currentPage, limit: 10, search: debouncedSearch }));
      } catch (err) {
        Swal.fire({ 
          title: 'Error', 
          text: err.message || 'Failed to delete project', 
          icon: 'error', 
          background: '#18181b', 
          color: '#fff' 
        });
      }
    }
  };
  const handleStatusClick = async (e, project) => {
    e.preventDefault();
    e.stopPropagation();

    // If admin has deactivated, client cannot toggle
    if (!project.adminActive) {
      Swal.fire({ 
        icon: 'warning', 
        title: 'Activation Restricted', 
        text: 'This project has been restricted by Admin. Please contact admin to activate this project.', 
        background: '#18181b', 
        color: '#fff',
        confirmButtonColor: '#00c8ff'
      });
      return;
    }

    const newStatus = !project.clientActive;
    const actionText = newStatus ? 'Activate' : 'Deactivate';

    const result = await Swal.fire({
      title: `${actionText} Project?`,
      html: `Are you sure you want to <b>${actionText.toLowerCase()}</b> <b>${project.name}</b>?${!newStatus ? '<br/>It will no longer be visible publicly.' : ''}`,
      icon: newStatus ? 'info' : 'warning',
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
        Swal.fire({ icon: 'error', title: 'Failed', text: err.message || err, background: '#18181b', color: '#fff' });
      }
    }
  };

  // Remove local filter since backend does it
  const filteredProjects = projects || [];

  return (
    <div className="min-h-screen bg-[#FDF6ED] text-gray-900 relative overflow-hidden font-sans flex flex-col">
      {/* Background ambient glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#ABD2FA] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="h-16 sm:h-20 border-b border-gray-200 bg-white backdrop-blur-xl flex items-center justify-between px-4 sm:px-8 shrink-0 z-50 sticky top-0">
        <div className="flex items-center gap-4 sm:gap-8">
          <img src="/techomax.png" alt="Techomax" className="h-10 sm:h-14 w-auto object-contain shrink-0" />
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center gap-2 sm:gap-3 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl transition-colors duration-200 ${isMenuOpen ? 'bg-white/5' : 'hover:bg-gray-50'}`}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#00c8ff] to-[#0066FF] flex items-center justify-center shadow-[0_0_10px_rgba(0,200,255,0.3)] shrink-0">
              <span className="text-gray-900 font-bold text-xs sm:text-sm">
                {initial}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 hidden sm:block max-w-[120px] truncate">
                Hi, {displayName}
              </span>
              <ChevronDown 
                size={16} 
                className={`text-gray-600 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} 
              />
            </div>
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-white border border-gray-200 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-200">
                <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                <p className="text-xs text-gray-600 truncate mt-0.5">{displayEmail}</p>
              </div>
              
              <div className="p-2 space-y-1">
                <button 
                  className="w-full flex items-center gap-3 px-3 py-2 sm:py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsPasswordModalOpen(true);
                  }}
                >
                  <Shield size={16} className="text-gray-600" />
                  Change Password
                </button>
                
                {authUser?.role === 'ADMIN' && (
                  <Link 
                    href="/admin/dashboard"
                    className="w-full flex items-center gap-3 px-3 py-2 sm:py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <LayoutDashboard size={16} className="text-gray-600" />
                    Admin Panel
                  </Link>
                )}
                
                <button 
                  className="w-full flex items-center gap-3 px-3 py-2 sm:py-2.5 rounded-xl text-sm font-medium text-[#ff4d4d] hover:bg-[#ff4d4d]/10 transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-wide leading-tight">My Projects</h1>
              <p className="text-xs sm:text-sm font-medium text-gray-600 uppercase tracking-[0.2em] leading-tight mt-1">Workspace</p>
            </div>
            
            <Can I="create" a="project">
              <button 
                onClick={() => setShowCreateForm(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 bg-[#ABD2FA] hover:bg-[#9bc2ea] text-[#18181b] border border-[#ABD2FA] text-xs sm:text-sm uppercase tracking-wider font-bold rounded-full transition-all duration-300 shadow-sm hover:shadow-md shrink-0 w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>New Project</span>
              </button>
            </Can>
          </div>
          
          {/* Create Form */}
          {showCreateForm && (
            <div className="mb-8 sm:mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
              <form onSubmit={handleCreate} className="bg-white/80 backdrop-blur-xl p-5 sm:p-8 rounded-2xl border border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row gap-4 sm:gap-6 items-end relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00c8ff] to-blue-600" />
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-2 sm:mb-3">
                    Project Name
                  </label>
                  <input 
                    autoFocus
                    type="text" 
                    value={newProjectName} 
                    onChange={e => setNewProjectName(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 sm:px-5 sm:py-3.5 text-sm sm:text-base text-gray-900 placeholder:text-gray-600/50 focus:outline-none focus:border-[#ABD2FA] focus:bg-white focus:shadow-[0_0_20px_rgba(0,200,255,0.1)] transition-all"
                    placeholder="e.g. Phase 1 Architecture"
                  />
                </div>
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                  <button type="submit" disabled={isCreating || !newProjectName.trim()} className="flex-1 sm:flex-none bg-gradient-to-r from-[#00c8ff] to-blue-600 hover:from-[#00b0e6] hover:to-blue-700 disabled:opacity-50 text-gray-900 px-4 sm:px-8 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-bold transition-all shadow-[0_0_20px_rgba(0,200,255,0.2)] hover:shadow-[0_0_30px_rgba(0,200,255,0.4)]">
                    {isCreating ? 'Creating...' : 'Create'}
                  </button>
                  <button type="button" onClick={() => { setShowCreateForm(false); setNewProjectName(''); }} disabled={isCreating} className="flex-1 sm:flex-none bg-white/5 hover:bg-gray-100 border border-gray-200 disabled:opacity-50 text-gray-600 hover:text-gray-900 px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Subscription Banner */}
          {mySubscription && (
            <div className={`mt-6 p-4 rounded-xl border flex items-center justify-between ${
              new Date(mySubscription.endDate).getTime() < new Date().getTime() 
                ? 'bg-red-500/10 border-red-500/30' 
                : mySubscription.status === 'INACTIVE'
                ? 'bg-orange-500/10 border-orange-500/30'
                : 'bg-green-500/10 border-green-500/30'
            }`}>
              <div>
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Shield size={16} className={new Date(mySubscription.endDate).getTime() < new Date().getTime() ? 'text-red-400' : 'text-green-400'} />
                  Subscription Status: {new Date(mySubscription.endDate).getTime() < new Date().getTime() ? 'EXPIRED' : mySubscription.status}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Expires: {new Date(mySubscription.endDate).toLocaleDateString()}
                  {new Date(mySubscription.endDate).getTime() < new Date().getTime() 
                    ? ' — Please contact admin to renew.' 
                    : ` — ${Math.ceil((new Date(mySubscription.endDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} days remaining`
                  }
                </p>
              </div>
            </div>
          )}

          {/* Search & Stats Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4 sm:gap-6 mt-8">
            <div className="relative w-full sm:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-600" />
              </div>
              <input 
                type="text" 
                placeholder="Search projects by name..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white/60 backdrop-blur-md border border-gray-200 rounded-full pl-12 pr-10 py-3 text-sm text-gray-900 placeholder:text-gray-600/60 focus:outline-none focus:border-[#ABD2FA] focus:bg-white/90 focus:shadow-[0_0_20px_rgba(0,200,255,0.1)] transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ABD2FA] animate-pulse" />
              {pagination?.total || 0} {(pagination?.total || 0) === 1 ? 'Project' : 'Projects'} Found
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <Link 
                href={`/cad-conversion/${project.id}`} 
                key={project.id}
                className={`group relative bg-white backdrop-blur-sm border ${project.adminActive && project.clientActive ? 'border-gray-200 hover:border-[#ABD2FA]' : 'border-red-500/20 hover:border-red-500/50'} rounded-2xl p-6 hover:shadow-[0_10px_30px_rgba(0,0,0,0.05)] transition-all duration-500 overflow-hidden flex flex-col h-full`}
              >
                {/* Hover gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00c8ff]/0 via-transparent to-[#00c8ff]/0 group-hover:from-[#00c8ff]/5 group-hover:to-blue-600/5 transition-all duration-500" />
                
                <div className="relative z-10 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-14 flex items-center justify-start group-hover:scale-105 transition-all duration-500 shrink-0">
                      {project.logoUrl ? (
                        <img 
                          src={project.logoUrl.startsWith('http') ? project.logoUrl : `http://localhost:5000${project.logoUrl}`} 
                          alt={project.name} 
                          className="h-full w-auto object-contain max-w-[150px]"
                        />
                      ) : (
                        <Folder className="w-10 h-10 text-gray-600 group-hover:text-[#ABD2FA] transition-colors" />
                      )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-500">
                      <Can I="delete" a="project">
                        <button 
                          onClick={(e) => handleDelete(e, project.id, project.name)}
                          className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500 flex items-center justify-center text-red-500 hover:text-gray-900 transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)] hover:shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                          title="Delete Project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </Can>
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-[#ABD2FA]" />
                      </div>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#ABD2FA] transition-colors line-clamp-1 flex items-center gap-2">
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <button 
                      onClick={(e) => handleStatusClick(e, project)}
                      className={`text-[10px] font-black px-2 py-1 rounded border flex items-center gap-1 ${project.adminActive && project.clientActive ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'}`}
                    >
                      {project.adminActive && project.clientActive ? 'ACTIVE' : 'INACTIVE'}
                      <ChevronDown size={12} />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {project.description || 'No description available for this project.'}
                  </p>
                </div>

                <div className="relative z-10 mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-white/5 px-3 py-1.5 rounded-lg">
                    <FileImage className="w-3.5 h-3.5 text-[#ABD2FA]" />
                    <span>{project._count?.conversions || 0} Layouts</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-600/70">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(project.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination?.totalPages > 1 && (
            <div className="mt-8 flex justify-between items-center bg-white border border-gray-200 rounded-2xl p-4">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || loading}
                className="px-5 py-2.5 bg-white/5 hover:bg-gray-100 text-gray-900 font-medium rounded-xl transition-all disabled:opacity-50 border border-gray-200"
              >
                Previous
              </button>
              <div className="text-gray-600 text-sm font-medium">
                Page <span className="text-gray-900 font-bold">{currentPage}</span> of <span className="text-gray-900 font-bold">{pagination.totalPages}</span>
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage === pagination.totalPages || loading}
                className="px-5 py-2.5 bg-white/5 hover:bg-gray-100 text-gray-900 font-medium rounded-xl transition-all disabled:opacity-50 border border-gray-200"
              >
                Next
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredProjects.length === 0 && (
            <div className="py-16 sm:py-20 flex flex-col items-center justify-center border border-dashed border-gray-200 rounded-3xl bg-white px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-600/50" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 text-center">No projects found</h3>
              <p className="text-gray-600 text-xs sm:text-sm max-w-md text-center mb-6">
                {search ? `We couldn't find any projects matching "${search}".` : "Get started by creating your first CAD conversion project."}
              </p>
              {!search && (
                <Can I="create" a="project">
                  <button 
                    onClick={() => setShowCreateForm(true)}
                    className="px-5 py-2.5 sm:px-6 sm:py-2.5 bg-[#ABD2FA] hover:bg-[#9bc2ea] text-[#18181b] border border-[#ABD2FA] text-[10px] sm:text-xs uppercase tracking-wider font-bold rounded-full transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    Create Project
                  </button>
                </Can>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
