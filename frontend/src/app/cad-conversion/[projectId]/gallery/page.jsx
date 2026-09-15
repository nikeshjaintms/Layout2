'use client';
import AuthGuard from '@/components/auth/AuthGuard';
import { useState, useEffect, use } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGallery, deleteGalleryItem } from '@/redux/slices/projectGallerySlice';
import { Plus, Edit2, Trash2, Search, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Swal from 'sweetalert2';
import Sidebar from '@/components/cad-conversion/Sidebar';
import Pagination from '@/components/common/Pagination';
import AuthImage from '@/components/shared/AuthImage';
import { Can } from '@/lib/ability';

export default function ProjectGalleryPage({ params }) {
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.projectId;
  const searchParams = useSearchParams();
  const editorId = searchParams.get('editorId');
  const dispatch = useDispatch();

  const { items: gallery, loading, total: totalRecords, totalPages } = useSelector(state => state.projectGallery);
  
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
    dispatch(fetchGallery({
      projectId,
      page: currentPage, 
      limit, 
      search: debouncedSearch
    }));
  }, [projectId, currentPage, debouncedSearch, dispatch, limit]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Delete Image?',
      text: 'Are you sure you want to delete this image? This action cannot be undone.',
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
        await dispatch(deleteGalleryItem({ projectId, id })).unwrap();
        Swal.fire({ title: 'Deleted!', text: 'Image has been deleted.', icon: 'success', background: '#18181b', color: '#fff' });
      } catch (err) {
        Swal.fire({ title: 'Error', text: 'Failed to delete image', icon: 'error', background: '#18181b', color: '#fff' });
      }
    }
  };

  return (
    <AuthGuard requirePermission={{ action: 'read', subject: 'gallery' }}>
      <div className="min-h-screen bg-white flex flex-col md:flex-row text-slate-300 overflow-hidden font-sans">
        <Sidebar projectId={projectId} />
        <div className="flex-1 p-4 md:p-8 flex flex-col h-[calc(100vh-73px)] md:h-screen overflow-y-auto relative w-full">
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
                Project Gallery
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">Upload and manage project images</p>
              </div>
            </div>
            <Can I="create" a="gallery">
              <Link
                href={`/cad-conversion/${projectId}/gallery/add${editorId ? '?editorId='+editorId : ''}`}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#ABD2FA] hover:bg-[#9bc2ea] text-[#18181b] text-sm font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <Plus size={18} strokeWidth={2.5} /> Add New Image
              </Link>
            </Can>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-4 md:items-center bg-white backdrop-blur-md p-4 rounded-2xl border border-gray-200 shadow-lg">
            <div className="relative flex-1 w-full md:max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-[#ABD2FA] transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search images..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#ABD2FA] focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all text-gray-900 placeholder-[#8ba0b8] font-medium"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white backdrop-blur-md border border-gray-200 rounded-2xl overflow-hidden shadow-xl flex-1 flex flex-col transition-all">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#FDF6ED] border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-5 font-bold text-gray-600 uppercase tracking-wider text-[11px]">Image</th>
                    <th className="px-6 py-5 font-bold text-gray-600 uppercase tracking-wider text-[11px] text-center">Status</th>
                    <th className="px-6 py-5 font-bold text-gray-600 uppercase tracking-wider text-[11px] text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {loading ? (
                    <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-600">Loading images...</td></tr>
                  ) : gallery.length === 0 ? (
                    <tr><td colSpan="3" className="px-6 py-12 text-center text-gray-600">No images found matching your criteria.</td></tr>
                  ) : (
                    gallery.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-all duration-200 group">
                        <td className="px-6 py-5">
                          <AuthImage 
                            src={item.imageUrl} 
                            alt="Gallery image" 
                            className="w-24 h-24 object-cover rounded-lg border border-gray-200 shadow-md"
                          />
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-full shadow-sm ${item.isActive !== false ? 'bg-[#ABD2FA] text-[#18181b] border-[#ABD2FA]' : 'bg-slate-500/10 text-gray-600 border-slate-500/30'}`}>
                            {item.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                            <Can I="edit" a="gallery">
                              <Link href={`/cad-conversion/${projectId}/gallery/${item.id}${editorId ? '?editorId='+editorId : ''}`} className="p-2 text-gray-600 hover:text-[#ABD2FA] bg-white/5 border border-gray-200 hover:border-[#ABD2FA] rounded-lg transition-all hover:shadow-[0_0_10px_rgba(0,200,255,0.1)]">
                                <Edit2 size={15} />
                              </Link>
                            </Can>
                            <Can I="delete" a="gallery">
                              <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-600 hover:text-red-400 bg-white/5 border border-gray-200 hover:border-red-500/50 rounded-lg transition-all hover:shadow-[0_0_10px_rgba(239,68,68,0.1)]">
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
              itemName="images"
              theme="cad"
            />
          </div>
        </div>
      </div>
      </div>
    </AuthGuard>
  );
}
