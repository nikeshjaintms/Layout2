'use client';
import AuthGuard from '@/components/auth/AuthGuard';
import { useState, useEffect, use } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getProjectPlotStatuses, getCadProject } from '@/lib/api';
import { fetchPlots, deletePlot, updatePlotAssignment } from '@/redux/slices/plotsSlice';
import { fetchProjectById } from '@/redux/slices/projectsSlice';
import { Plus, Edit2, Trash2, Search, Filter, ArrowLeft } from 'lucide-react';
import { getContrastYIQ } from '@/lib/utils';
import { PLOT_TYPE_CONFIG } from '@/lib/plotTypeConfig';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import { Can } from '@/lib/ability';

import Sidebar from '@/components/cad-conversion/Sidebar';
import Pagination from '@/components/common/Pagination';

export default function ProjectPlotsPage({ params }) {
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.projectId;
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const editorId = searchParams.get('editorId');
  
  const dispatch = useDispatch();
  const { items: plots, loading, total: totalRecords, totalPages } = useSelector(state => state.plots);
  const { selectedProject: project } = useSelector(state => state.projects);
  
  const [statuses, setStatuses] = useState([]);
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [filterStatus, setFilterStatus] = useState('');
  const [filterAssignment, setFilterAssignment] = useState('');
  
  const [sortConfig, setSortConfig] = useState({ key: 'plotNumber', direction: 'asc' });
  
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch initial project & statuses
  useEffect(() => {
    dispatch(fetchProjectById(projectId));
    getProjectPlotStatuses(projectId, { pagination: false })
      .then(setStatuses)
      .catch(console.error);
  }, [projectId, dispatch]);

  // Fetch paginated plots
  useEffect(() => {
    dispatch(fetchPlots({
      projectId,
      options: {
        page: currentPage, 
        limit, 
        search: debouncedSearch,
        statusId: filterStatus || undefined,
        assignment: filterAssignment || undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        conversionId: editorId || undefined,
      }
    }));
  }, [projectId, currentPage, debouncedSearch, filterStatus, filterAssignment, sortConfig, dispatch, limit, editorId]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Plot?',
      text: 'Are you sure you want to delete this plot? This action cannot be undone.',
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
        await dispatch(deletePlot({ projectId, plotId: id })).unwrap();
        router.refresh();
        Swal.fire({ title: 'Deleted!', text: 'Plot has been deleted.', icon: 'success', background: '#18181b', color: '#fff' });
      } catch (err) {
        Swal.fire({ title: 'Error', text: 'Failed to delete plot', icon: 'error', background: '#18181b', color: '#fff' });
      }
    }
  };

  const handleAssignmentChange = async (plot, newValue) => {
    try {
      let cadRegionId = null;
      if (newValue === 'assigned') {
        const { value: manualId } = await Swal.fire({
          title: 'Assign CAD Region',
          input: 'text',
          inputLabel: 'Enter the CAD shape ID (e.g., shape-1234)',
          inputPlaceholder: 'CAD Region ID',
          showCancelButton: true,
          inputValidator: (value) => {
            if (!value) return 'You need to write something!';
          }
        });
        if (!manualId) return;
        cadRegionId = manualId;
      }
      await dispatch(updatePlotAssignment({ projectId, plotId: plot.id, assignmentData: { cadRegionId } })).unwrap();
      router.refresh();
      Swal.fire({ icon: 'success', title: 'Success', text: 'Assignment updated successfully.', timer: 2000, showConfirmButton: false });
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to update assignment.' });
    }
  };

  // Frontend filtering and sorting removed, now handled by backend

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };


  return (
    <AuthGuard requirePermission={{ action: 'read', subject: 'plot' }}>
      <div className="min-h-screen bg-white flex flex-col md:flex-row text-slate-300 overflow-hidden font-sans">
        <Sidebar projectId={projectId} />
        <div className="flex-1 p-4 md:p-8 flex flex-col h-[calc(100vh-73px)] md:h-screen overflow-y-auto relative w-full">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto w-full space-y-6 flex-1 flex flex-col relative z-10">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-5">
            <Link 
              href={editorId ? `/cad-conversion/${projectId}/editor/${editorId}` : `/cad-conversion/${projectId}`} 
              className="p-2 sm:p-2.5 bg-[#FDF6ED] border border-gray-200 hover:border-[#ABD2FA] rounded-xl transition-all duration-300 text-gray-600 hover:text-[#ABD2FA] shadow-lg group shrink-0"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                {project ? `${project.name} Plots` : 'Project Plots'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">Manage plots for {project ? project.name : `Project #${projectId}`}</p>
            </div>
          </div>
          <div className="flex sm:gap-4 w-full sm:w-auto">
            <Can I="create" a="plot">
              <Link 
                href={`/cad-conversion/${projectId}/add-plot`}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#ABD2FA] hover:bg-[#00b0e6] text-[#0f111a] text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(0,200,255,0.4)] flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Plus size={18} strokeWidth={2.5} /> Add New Plot
              </Link>
            </Can>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 md:items-center bg-white backdrop-blur-md p-4 rounded-2xl border border-gray-200 shadow-lg">
          <div className="relative flex-1 w-full md:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#ABD2FA] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by plot number..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#ABD2FA] focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all text-gray-900 placeholder-[#8ba0b8] font-medium"
            />
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 flex-1 md:flex-none md:min-w-[180px] focus-within:border-[#ABD2FA] focus-within:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all group">
              <Filter className="text-gray-600 group-focus-within:text-[#ABD2FA] shrink-0 transition-colors" size={16} />
              <select 
                value={filterStatus}
                onChange={e => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-transparent border-none focus:outline-none text-sm text-gray-900 font-medium appearance-none cursor-pointer"
              >
                <option value="" className="bg-white text-gray-900">All Statuses</option>
                {statuses.map(s => (
                  <option key={s.id} value={s.id} className="bg-white text-gray-900">{s.name}</option>
                ))}
              </select>
              <div className="pointer-events-none text-gray-600 shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 flex-1 md:flex-none md:min-w-[180px] focus-within:border-[#ABD2FA] focus-within:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all group">
              <Filter className="text-gray-600 group-focus-within:text-[#ABD2FA] shrink-0 transition-colors" size={16} />
              <select 
                value={filterAssignment}
                onChange={e => {
                  setFilterAssignment(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-transparent border-none focus:outline-none text-sm text-gray-900 font-medium appearance-none cursor-pointer"
              >
                <option value="" className="bg-white text-gray-900">All Assignments</option>
                <option value="available" className="bg-white text-gray-900">Available</option>
                <option value="assigned" className="bg-white text-gray-900">Assigned</option>
              </select>
              <div className="pointer-events-none text-gray-600 shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white backdrop-blur-md border border-gray-200 rounded-2xl overflow-hidden shadow-xl flex-1 flex flex-col transition-all">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#FDF6ED] border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase tracking-wider text-[11px] cursor-pointer hover:text-[#ABD2FA] transition-colors group" onClick={() => handleSort('plotNumber')}>
                    <span className="flex items-center gap-1">Plot Number <span className="text-[#ABD2FA]">{sortConfig.key === 'plotNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</span></span>
                  </th>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase tracking-wider text-[11px] cursor-pointer hover:text-[#ABD2FA] transition-colors" onClick={() => handleSort('plotType')}>
                    <span className="flex items-center gap-1">Plot Type <span className="text-[#ABD2FA]">{sortConfig.key === 'plotType' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</span></span>
                  </th>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase tracking-wider text-[11px]">Dimensions</th>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase tracking-wider text-[11px] cursor-pointer hover:text-[#ABD2FA] transition-colors" onClick={() => handleSort('areaSqFt')}>
                     <span className="flex items-center gap-1">Area (Sq. Ft.) <span className="text-[#ABD2FA]">{sortConfig.key === 'areaSqFt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</span></span>
                  </th>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase tracking-wider text-[11px] cursor-pointer hover:text-[#ABD2FA] transition-colors" onClick={() => handleSort('status')}>
                     <span className="flex items-center gap-1">Status <span className="text-[#ABD2FA]">{sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</span></span>
                  </th>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase tracking-wider text-[11px] cursor-pointer hover:text-[#ABD2FA] transition-colors" onClick={() => handleSort('cadRegionId')}>
                     <span className="flex items-center gap-1">Assignment <span className="text-[#ABD2FA]">{sortConfig.key === 'cadRegionId' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</span></span>
                  </th>
                  <th className="px-6 py-5 font-bold text-gray-600 uppercase tracking-wider text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-600">Loading plots...</td></tr>
                ) : plots.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-gray-600">No plots found.</td></tr>
                ) : (
                  plots.map(plot => (
                    <tr key={plot.id} className="hover:bg-gray-50 transition-all duration-200 group">
                      <td className="px-6 py-5 font-semibold text-gray-900">{plot.plotNumber}</td>
                      <td className="px-6 py-5 text-gray-600 font-medium">{PLOT_TYPE_CONFIG[plot.plotType]?.displayName || plot.plotType}</td>
                      <td className="px-6 py-5 text-gray-600">
                        {plot.dimensions?.length > 0 
                          ? (
                              <div className="inline-block min-w-[140px]">
                                <table className="text-xs w-full">
                                  <tbody>
                                    {plot.dimensions.map((d, i) => {
                                      const config = PLOT_TYPE_CONFIG[plot.plotType];
                                      const isMissing = d.value === null || d.value === undefined || d.value === '';
                                      const val = isMissing ? '—' : Number(d.value).toFixed(2);
                                      const unit = isMissing ? '' : (d.unit || 'm');
                                      
                                      if (config?.hideLabels) {
                                        return (
                                          <tr key={i}>
                                            <td className="text-gray-900 font-medium py-0.5 text-left">{val} {unit}</td>
                                          </tr>
                                        );
                                      }
                                      
                                      return (
                                        <tr key={i}>
                                          <td className="text-gray-600 pr-2 py-0.5 whitespace-nowrap text-right uppercase tracking-wider text-[10px] w-1/2">{d.label}</td>
                                          <td className="text-gray-600/50 pr-2 py-0.5 w-[10px] text-center">:</td>
                                          <td className="text-gray-900 font-medium py-0.5 whitespace-nowrap text-left w-1/2">{val} <span className="text-gray-600 font-normal">{unit}</span></td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )
                          : <span className="text-gray-600/40 pl-8">-</span>}
                      </td>
                      <td className="px-6 py-5 text-gray-900 font-medium pl-10">{plot.areaSqFt || <span className="text-gray-600/40">-</span>}</td>
                      <td className="px-6 py-5">
                        {plot.status ? (
                            <span 
                              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full shadow-sm inline-flex items-center justify-center min-w-[80px]"
                              style={{ 
                                backgroundColor: plot.status.fillColor, 
                                color: getContrastYIQ(plot.status.fillColor),
                                border: `1px solid ${plot.status.fillColor}40`
                              }}
                            >
                            {plot.status.name}
                          </span>
                        ) : (
                          <span className="text-gray-600/40 pl-4">-</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="relative inline-block min-w-[120px]">
                          <select
                            value={plot.cadRegionId ? 'assigned' : 'available'}
                            onChange={(e) => handleAssignmentChange(plot, e.target.value)}
                            className={`w-full pl-3 pr-8 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00c8ff]/50 cursor-pointer shadow-sm appearance-none border transition-colors ${
                              plot.cadRegionId 
                                ? 'bg-[#ABD2FA] border-[#ABD2FA] text-[#18181b]' 
                                : 'bg-white/5 border-gray-200 text-gray-600 hover:border-[#ABD2FA]'
                            }`}
                          >
                            <option value="available" className="text-gray-600 bg-white">Available</option>
                            <option value="assigned" className="text-[#18181b] bg-[#ABD2FA]">Assigned</option>
                          </select>
                          <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 opacity-70 ${plot.cadRegionId ? 'text-[#18181b]' : 'text-gray-600'}`}>
                             <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Can I="edit" a="plot">
                            <Link href={`/cad-conversion/${projectId}/manage-plot/${plot.id}/edit`} className="p-2 text-gray-600 hover:text-[#ABD2FA] bg-white/5 border border-gray-200 hover:border-[#ABD2FA] rounded-lg transition-all hover:shadow-[0_0_10px_rgba(0,200,255,0.1)]">
                              <Edit2 size={15} />
                            </Link>
                          </Can>
                          <Can I="delete" a="plot">
                            <button onClick={() => handleDelete(plot.id)} className="p-2 text-gray-600 hover:text-red-400 bg-white/5 border border-gray-200 hover:border-red-500/50 rounded-lg transition-all hover:shadow-[0_0_10px_rgba(239,68,68,0.1)]">
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
            itemName="plots"
            theme="cad"
          />
        </div>

          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
