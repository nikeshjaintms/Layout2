'use client';
import AuthGuard from '@/components/auth/AuthGuard';
import { useState, useEffect, use, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { updateGalleryItem, uploadGalleryImage } from '@/redux/slices/projectGallerySlice';
import { ArrowLeft, Save, Image as ImageIcon, Upload } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import Sidebar from '@/components/cad-conversion/Sidebar';
import AuthImage from '@/components/shared/AuthImage';

export default function EditGalleryPage({ params }) {
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.projectId;
  const galleryId = unwrappedParams.galleryId;
  const searchParams = useSearchParams();
  const editorId = searchParams.get('editorId');
  const router = useRouter();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    imageUrl: '',
    isActive: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
    
    import('@/lib/api').then(({ authFetch }) => {
      authFetch(`/api/projects/${projectId}/gallery/${galleryId}`)
        .then(res => res.json())
        .then(data => {
        setFormData({
          imageUrl: data.imageUrl || '',
          isActive: data.isActive !== false
        });
        setInitialLoading(false);
      })
      .catch(err => {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch gallery item', background: '#18181b', color: '#fff' });
        router.push(`/cad-conversion/${projectId}/gallery`);
      });
    });
  }, [projectId, galleryId, router]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const resultAction = await dispatch(uploadGalleryImage({ projectId, file }));
      if (uploadGalleryImage.fulfilled.match(resultAction)) {
        setFormData(prev => ({ ...prev, imageUrl: resultAction.payload }));
        setErrors({});
        Swal.fire({ title: 'Success', text: 'Image uploaded.', icon: 'success', background: '#18181b', color: '#fff', timer: 1500, showConfirmButton: false });
      } else {
        throw new Error(resultAction.payload || 'Upload failed');
      }
    } catch (err) {
      Swal.fire({ title: 'Error', text: err.message, icon: 'error', background: '#18181b', color: '#fff' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imageUrl) {
      setErrors({ imageUrl: 'An image is required.' });
      Swal.fire({ icon: 'error', title: 'Error', text: 'An image is required.', background: '#18181b', color: '#fff' });
      return;
    }
    
    setErrors({});
    setLoading(true);
    try {
      const resultAction = await dispatch(updateGalleryItem({ projectId, id: galleryId, formData }));
      if (updateGalleryItem.fulfilled.match(resultAction)) {
        Swal.fire({ title: 'Success', text: 'Gallery item updated.', icon: 'success', background: '#18181b', color: '#fff', timer: 1500, showConfirmButton: false });
        router.push(`/cad-conversion/${projectId}/gallery${editorId ? '?editorId='+editorId : ''}`);
      } else {
        throw new Error(resultAction.payload || 'Failed to update gallery item');
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, background: '#18181b', color: '#fff' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requirePermission={{ action: 'edit', subject: 'gallery' }}>
    <div className="min-h-screen bg-white flex flex-col md:flex-row text-slate-300 overflow-hidden font-sans">
      <Sidebar projectId={projectId} />
      <div className="flex-1 p-4 md:p-8 flex flex-col h-[calc(100vh-73px)] md:h-screen overflow-y-auto relative w-full">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

        <div className="max-w-3xl mx-auto w-full space-y-6 flex-1 flex flex-col relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              href={`/cad-conversion/${projectId}/gallery${editorId ? '?editorId='+editorId : ''}`} 
              className="p-2.5 bg-[#FDF6ED] border border-gray-200 hover:border-[#ABD2FA] rounded-xl transition-all duration-300 text-gray-600 hover:text-[#ABD2FA] shadow-lg group shrink-0"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <ImageIcon className="text-[#ABD2FA] w-8 h-8" />
                Edit Image
              </h2>
            </div>
          </div>

          <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-2xl">
            {initialLoading ? (
               <div className="flex justify-center items-center h-40">
                 <div className="w-8 h-8 border-4 border-[#ABD2FA] border-t-transparent rounded-full animate-spin"></div>
               </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">Image *</label>
                  <div className="flex justify-center items-center py-4">
                    <div className="w-48 h-48 rounded-xl bg-white border-2 border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden relative group">
                      {formData.imageUrl ? (
                        <AuthImage 
                          src={formData.imageUrl} 
                          alt="Preview" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="text-center text-slate-500">
                          <Upload className="w-10 h-10 mx-auto mb-3 opacity-50" />
                          <span className="text-sm font-medium">Click to Upload</span>
                        </div>
                      )}
                      <div 
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <span className="text-gray-900 text-sm font-medium">Change File</span>
                      </div>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </div>
                  {errors.imageUrl && (
                    <div className="text-red-400 text-xs font-bold text-center mt-2">
                      {errors.imageUrl}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={formData.isActive !== false ? 'true' : 'false'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#ABD2FA] focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>


                <div className="pt-6 border-t border-gray-200 flex justify-end">
                  <button type="submit" disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-[#00c8ff] to-[#0096ff] hover:from-[#00b0ff] hover:to-[#0080ff] text-gray-900 font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={18} />} Update Image
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      </div>
    </div>
      </AuthGuard>
  );
}
