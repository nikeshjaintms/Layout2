'use client';
import AuthGuard from '@/components/auth/AuthGuard';
import { useState, use, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { createGalleryItem, uploadGalleryImage } from '@/redux/slices/projectGallerySlice';
import { Plus, Trash2, ArrowLeft, Image as ImageIcon, Upload, Save } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import Sidebar from '@/components/cad-conversion/Sidebar';
import AuthImage from '@/components/shared/AuthImage';

export default function AddGalleryPage({ params }) {
  const unwrappedParams = use(params);
  const projectId = unwrappedParams.projectId;
  const searchParams = useSearchParams();
  const editorId = searchParams.get('editorId');
  const router = useRouter();
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({ imageUrl: '', isActive: true });
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const resultAction = await dispatch(uploadGalleryImage({ projectId, file }));
      if (uploadGalleryImage.fulfilled.match(resultAction)) {
        setFormData({ ...formData, imageUrl: resultAction.payload });
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
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please upload an image.', background: '#18181b', color: '#fff' });
      return;
    }
    
    setLoading(true);
    try {
      const resultAction = await dispatch(createGalleryItem({ projectId, formData }));
      if (createGalleryItem.fulfilled.match(resultAction)) {
        Swal.fire({ title: 'Success', text: 'Gallery item added.', icon: 'success', background: '#18181b', color: '#fff', timer: 1500, showConfirmButton: false });
        router.push(`/cad-conversion/${projectId}/gallery${editorId ? '?editorId='+editorId : ''}`);
      } else {
        throw new Error(resultAction.payload || 'Failed to create gallery item');
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, background: '#18181b', color: '#fff' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requirePermission={{ action: 'create', subject: 'gallery' }}>
    <div className="min-h-screen bg-[#131826] flex flex-col md:flex-row text-slate-300 overflow-hidden font-sans">
      <Sidebar projectId={projectId} />
      <div className="flex-1 p-4 md:p-8 flex flex-col h-[calc(100vh-73px)] md:h-screen overflow-y-auto relative w-full">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

        <div className="max-w-3xl mx-auto w-full space-y-6 flex-1 flex flex-col relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <Link 
              href={`/cad-conversion/${projectId}/gallery${editorId ? '?editorId='+editorId : ''}`} 
              className="p-2.5 bg-[#1d2440] border border-white/10 hover:border-[#00c8ff]/50 rounded-xl transition-all duration-300 text-slate-400 hover:text-[#00c8ff] shadow-lg group shrink-0"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                <ImageIcon className="text-[#00c8ff] w-8 h-8" />
                Add New Image
              </h2>
            </div>
          </div>

          <div className="bg-[#1a2035]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">Upload Image *</label>
                <div className="flex justify-center items-center py-4">
                  <div className="w-48 h-48 rounded-xl bg-[#0f111a] border-2 border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden relative group">
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
                    <label 
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <span className="text-white text-sm font-medium">Choose File</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Status</label>
                <select
                  value={formData.isActive !== false ? 'true' : 'false'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                  className="w-full px-4 py-2.5 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end">
                <button type="submit" disabled={loading || !formData.imageUrl} className="px-6 py-2.5 bg-gradient-to-r from-[#00c8ff] to-[#0096ff] hover:from-[#00b0ff] hover:to-[#0080ff] text-white font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={18} />} Save Image
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
      </AuthGuard>
  );
}
