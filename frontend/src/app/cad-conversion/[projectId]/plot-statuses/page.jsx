'use client';
import AuthGuard from '@/components/auth/AuthGuard';
import { useState, useEffect, use } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlotStatuses, deletePlotStatus } from '@/redux/slices/plotStatusesSlice';
import { fetchProjectById } from '@/redux/slices/projectsSlice';
import { Plus, Edit2, Trash2, ArrowLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { Can } from '@/lib/ability';

import Sidebar from '@/components/cad-conversion/Sidebar';
import Pagination from '@/components/common/Pagination';

export default function ProjectPlotStatusesPage({ params }) {
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.projectId;
  
  const searchParams = useSearchParams();
  const editorId = searchParams.get('editorId');
  const router = useRouter();
  
  const dispatch = useDispatch();
  const { items: statuses, loading, total: totalRecords, totalPages } = useSelector(state => state.plotStatuses);
  const { selectedProject: project } = useSelector(state => state.projects);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    dispatch(fetchProjectById(projectId));
  }, [projectId, dispatch]);

  useEffect(() => {
    dispatch(fetchPlotStatuses({
      projectId,
      params: {
        page: currentPage,
        limit,
        search: debouncedSearch
      }
    }));
  }, [projectId, currentPage, debouncedSearch, dispatch, limit]);

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: 'Delete Plot Status?',
      text: `Are you sure you want to delete status "${name}"? This action cannot be undone.`,
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
        await dispatch(deletePlotStatus({ projectId, id })).unwrap();
        Swal.fire({ title: 'Deleted!', text: 'Plot status has been deleted.', icon: 'success', background: '#18181b', color: '#fff' });
      } catch (err) {
        Swal.fire({ title: 'Error', text: err || 'Failed to delete plot status', icon: 'error', background: '#18181b', color: '#fff' });
      }
    }
  };

  return (
    <AuthGuard requirePermission={{ action: 'read', subject: 'status' }}>
      <div className="min-h-screen bg-[#131826] flex flex-col md:flex-row text-slate-300 overflow-hidden font-sans">
        <Sidebar projectId={projectId} />
        <div className="flex-1 p-4 md:p-8 flex flex-col h-[calc(100vh-73px)] md:h-screen overflow-y-auto relative w-full">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto space-y-6 w-full flex-1 flex flex-col relative z-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-5">
            <Link 
              href={editorId ? `/cad-conversion/${projectId}/editor/${editorId}` : `/cad-conversion/${projectId}`} 
              className="p-2 sm:p-2.5 bg-[#1d2440] border border-white/10 hover:border-[#00c8ff]/50 rounded-xl transition-all duration-300 text-slate-400 hover:text-[#00c8ff] shadow-lg group shrink-0"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Project Plot Statuses
              </h1>
              <p className="text-xs sm:text-sm text-[#8ba0b8] font-medium mt-1">
                Manage custom statuses for {project?.name || `Project #${projectId}`}
              </p>
            </div>
          </div>
          <div className="flex sm:gap-4 w-full sm:w-auto">
            <Can I="create" a="status">
              <Link
                href={`/cad-conversion/${projectId}/plot-statuses/add`}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#00c8ff] hover:bg-[#00b0e6] text-[#0f111a] text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(0,200,255,0.4)] flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Plus size={18} strokeWidth={2.5} /> Add Status
              </Link>
            </Can>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center bg-[#1d2440]/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg">
          <div className="relative flex-1 w-full md:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8ba0b8] group-focus-within:text-[#00c8ff] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search statuses by name..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all text-white placeholder-[#8ba0b8] font-medium"
            />
          </div>
        </div>

        {/* Statuses Table */}
        <div className="bg-[#1d2440]/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl flex-1 flex flex-col transition-all">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#1d2440] border-b border-white/10 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-5 font-bold text-[#8ba0b8] uppercase tracking-wider text-[11px]">Name</th>
                  <th className="px-6 py-5 font-bold text-[#8ba0b8] uppercase tracking-wider text-[11px]">Color</th>
                  <th className="px-6 py-5 font-bold text-[#8ba0b8] uppercase tracking-wider text-[11px]">Status</th>
                  <th className="px-6 py-5 font-bold text-[#8ba0b8] uppercase tracking-wider text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-[#8ba0b8]">
                      Loading statuses...
                    </td>
                  </tr>
                ) : statuses.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-[#8ba0b8]">
                      No statuses found.
                    </td>
                  </tr>
                ) : (
                  statuses.map((status) => (
                    <tr key={status.id} className="hover:bg-white/5 transition-all duration-200 group">
                      <td className="px-6 py-5 font-semibold text-white">{status.name}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-6 h-6 rounded border border-white/20 shadow-sm"
                            style={{ backgroundColor: status.fillColor }}
                          />
                          <span className="font-mono text-xs text-[#8ba0b8]">{status.fillColor}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm inline-flex items-center justify-center min-w-[80px] ${
                          status.isActive ? 'bg-[#00c8ff]/10 text-[#00c8ff] border border-[#00c8ff]/30' : 'bg-white/5 text-[#8ba0b8] border border-white/10'
                        }`}>
                          {status.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Can I="edit" a="status">
                            <Link
                              href={`/cad-conversion/${projectId}/plot-statuses/${status.id}/edit`}
                              className="p-2 text-[#8ba0b8] hover:text-[#00c8ff] bg-white/5 border border-white/10 hover:border-[#00c8ff]/50 rounded-lg transition-all hover:shadow-[0_0_10px_rgba(0,200,255,0.1)]"
                              title="Edit Status"
                            >
                              <Edit2 size={15} />
                            </Link>
                          </Can>
                          <Can I="delete" a="status">
                            <button
                              onClick={() => handleDelete(status.id, status.name)}
                              className="p-2 text-[#8ba0b8] hover:text-red-400 bg-white/5 border border-white/10 hover:border-red-500/50 rounded-lg transition-all hover:shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                              title="Delete Status"
                            >
                              <Trash2 size={15} />
                            </button>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalRecords={totalRecords}
            limit={limit}
            onPageChange={setCurrentPage}
            itemName="statuses"
            theme="dark"
          />

        </div>
      </div>
      </div>
    </div>
    </AuthGuard>
  );
}
