'use client';
import AuthGuard from '@/components/auth/AuthGuard';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAmenities, deleteAmenity } from '@/redux/slices/amenitiesSlice';
import { BASE_URL } from '@/lib/api';
import { Plus, Edit2, Trash2, Image as ImageIcon, Search, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Can } from '@/lib/ability';
import { useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import Sidebar from '@/components/cad-conversion/Sidebar';
import Pagination from '@/components/common/Pagination';

// Debounce hook or utility
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

function AmenitiesMasterContent() {
  const dispatch = useDispatch();
  const { items: amenities, loading, total: totalRecords, totalPages } = useSelector(state => state.amenities);
  
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const editorId = searchParams.get('editorId');
  const querySuffix = projectId ? `?projectId=${projectId}${editorId ? '&editorId=' + editorId : ''}` : '';

  const [page, setPage] = useState(1);
  const limit = 10;

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  useEffect(() => {
    dispatch(fetchAmenities({
      page: page,
      limit,
      search: debouncedSearch
    }));
  }, [dispatch, page, limit, debouncedSearch]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Amenity?',
      text: 'Are you sure you want to delete this amenity? This action cannot be undone.',
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
        await dispatch(deleteAmenity(id)).unwrap();
        Swal.fire({ title: 'Deleted!', text: 'Amenity has been deleted.', icon: 'success', background: '#18181b', color: '#fff' });
      } catch (err) {
        Swal.fire({ title: 'Error', text: 'Failed to delete amenity', icon: 'error', background: '#18181b', color: '#fff' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#131826] text-slate-300 flex flex-col md:flex-row overflow-hidden font-sans">
      {projectId && <Sidebar projectId={projectId} />}
      <div className={`flex-1 p-4 md:p-8 ${projectId ? 'h-[calc(100vh-73px)]' : 'h-screen'} md:h-screen overflow-y-auto relative w-full ${!projectId && 'flex items-center justify-center'}`}>
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto space-y-8 w-full flex-1 flex flex-col relative z-10">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-5">
              <Link 
                href="/" 
                className="p-2 sm:p-2.5 bg-[#1d2440] border border-white/10 hover:border-[#00c8ff]/50 rounded-xl transition-all duration-300 text-slate-400 hover:text-[#00c8ff] shadow-lg group shrink-0"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">Amenity Master</h1>
                <p className="text-xs sm:text-sm text-[#8ba0b8] font-medium mt-1">Manage global amenities to be used across all projects.</p>
              </div>
            </div>
            <div className="flex sm:gap-4 w-full sm:w-auto">
              <Can I="create" a="amenity">
                <Link
                  href={`/masters/amenities/add${querySuffix}`}
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#00c8ff] hover:bg-[#00b0e6] text-[#0f111a] text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(0,200,255,0.4)] flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <Plus size={18} strokeWidth={2.5} /> Add Amenity
                </Link>
              </Can>
            </div>
          </div>

        {/* Search */}
        <div className="bg-[#1d2440]/60 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-lg flex items-center">
          <div className="relative flex-1 max-w-md group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-[#8ba0b8] group-focus-within:text-[#00c8ff] transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-2.5 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm placeholder-[#8ba0b8] focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all text-white font-medium"
              placeholder="Search amenities by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1d2440]/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl flex-1 flex flex-col transition-all">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#1d2440] border-b border-white/10 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-5 font-bold text-[#8ba0b8] uppercase tracking-wider text-[11px]">Icon</th>
                  <th className="px-6 py-5 font-bold text-[#8ba0b8] uppercase tracking-wider text-[11px]">Name</th>
                  <th className="px-6 py-5 font-bold text-[#8ba0b8] uppercase tracking-wider text-[11px] text-center">Status</th>
                  <th className="px-6 py-5 font-bold text-[#8ba0b8] uppercase tracking-wider text-[11px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-[#8ba0b8]">Loading...</td></tr>
                ) : amenities.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-[#8ba0b8]">No amenities found.</td></tr>
                ) : (
                  amenities.map(amenity => (
                    <tr key={amenity.id} className="hover:bg-white/5 transition-all duration-200 group">
                      <td className="px-6 py-5">
                        {amenity.iconPath ? (
                          <img src={`${BASE_URL}${amenity.iconPath}`} alt={amenity.name} className="w-10 h-10 object-contain bg-white/5 border border-white/10 rounded-xl p-1.5 shadow-sm" />
                        ) : (
                          <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-[#8ba0b8] shadow-sm">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 font-semibold text-white">{amenity.name}</td>
                      <td className="px-6 py-5 text-center">
                        <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-full shadow-sm ${amenity.isActive !== false ? 'bg-[#00c8ff]/10 text-[#00c8ff] border-[#00c8ff]/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/30'}`}>
                          {amenity.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                          <Can I="edit" a="amenity">
                            <Link
                              href={`/masters/amenities/${amenity.id}/edit${querySuffix}`}
                              className="p-2 text-[#8ba0b8] hover:text-[#00c8ff] bg-white/5 border border-white/10 hover:border-[#00c8ff]/50 rounded-lg transition-all hover:shadow-[0_0_10px_rgba(0,200,255,0.1)]"
                            >
                              <Edit2 size={15} />
                            </Link>
                          </Can>
                          <Can I="delete" a="amenity">
                            <button onClick={() => handleDelete(amenity.id)} className="p-2 text-[#8ba0b8] hover:text-red-400 bg-white/5 border border-white/10 hover:border-red-500/50 rounded-lg transition-all hover:shadow-[0_0_10px_rgba(239,68,68,0.1)]">
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
          {!loading && totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalRecords={totalRecords}
              limit={limit}
              onPageChange={setPage}
              itemName="amenities"
              theme="dark"
            />
          )}
        </div>

      </div>
      </div>
    </div>
  );
}

export default function AmenitiesMasterPage() {
  return (
    <AuthGuard requirePermission={{ action: 'read', subject: 'amenity' }}>
    <Suspense fallback={
      <div className="min-h-screen bg-[#131826] text-slate-300 flex flex-col md:flex-row overflow-hidden font-sans items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AmenitiesMasterContent />
    </Suspense>
      </AuthGuard>
  );
}
