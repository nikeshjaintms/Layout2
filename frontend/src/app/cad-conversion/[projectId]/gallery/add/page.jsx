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

  const emptyForm = { imageUrl: '', isActive: true };
  const [formList, setFormList] = useState([emptyForm]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleFileChange = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const resultAction = await dispatch(uploadGalleryImage({ projectId, file }));
      if (uploadGalleryImage.fulfilled.match(resultAction)) {
        const newList = [...formList];
        newList[index].imageUrl = resultAction.payload;
        setFormList(newList);
        setErrors(errors.filter(errIdx => errIdx !== index));
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
    
    const invalidIndices = [];
    formList.forEach((f, i) => {
      if (!f.imageUrl) invalidIndices.push(i);
    });

    if (invalidIndices.length > 0) {
      setErrors(invalidIndices);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Please upload an image for all gallery items.', background: '#18181b', color: '#fff' });
      return;
    }
    
    setErrors([]);
    setLoading(true);
    try {
      const promises = formList.map(formData => 
        dispatch(createGalleryItem({ projectId, formData })).unwrap()
      );
      await Promise.all(promises);
      
      Swal.fire({ title: 'Success', text: 'Gallery items added.', icon: 'success', background: '#18181b', color: '#fff', timer: 1500, showConfirmButton: false });
      router.push(`/cad-conversion/${projectId}/gallery${editorId ? '?editorId='+editorId : ''}`);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message || 'Failed to create gallery items', background: '#18181b', color: '#fff' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requirePermission={{ action: 'create', subject: 'gallery' }}>
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
                Add New Image
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {formList.map((formData, index) => (
              <div key={index} className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-2xl relative mb-6">
                {formList.length > 1 && (
                  <button type="button" onClick={() => {
                    const newList = [...formList];
                    newList.splice(index, 1);
                    setFormList(newList);
                  }} className="absolute top-4 right-4 p-2 text-gray-600 hover:text-red-400 bg-white/5 rounded-lg border border-transparent hover:border-red-500/30 transition-all">
                    <Trash2 size={16} />
                  </button>
                )}
                {formList.length > 1 && (
                  <div className="mb-6 text-sm font-bold text-[#ABD2FA] uppercase tracking-wider">Image {index + 1}</div>
                )}
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider">Upload Image *</label>
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
                      <label 
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <span className="text-gray-900 text-sm font-medium">Choose File</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleFileChange(e, index)}
                        />
                      </label>
                    </div>
                  </div>
                  {errors.includes(index) && (
                    <div className="text-red-400 text-xs font-bold text-center mt-2">
                      Please upload an image.
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={formData.isActive !== false ? 'true' : 'false'}
                    onChange={(e) => {
                      const newList = [...formList];
                      newList[index].isActive = e.target.value === 'true';
                      setFormList(newList);
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#ABD2FA] focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            ))}

            <button 
              type="button" 
              onClick={() => setFormList([...formList, emptyForm])} 
              className="w-full py-4 mt-4 mb-6 border-2 border-dashed border-[#ABD2FA] rounded-2xl text-[#ABD2FA] hover:bg-[#ABD2FA] hover:border-[#ABD2FA] flex justify-center items-center gap-2 transition-all font-bold text-sm shadow-sm"
            >
              <Plus size={18} strokeWidth={2.5} /> Add Another Image
            </button>

            <div className="pt-6 border-t border-gray-200 flex justify-end">
              <button type="submit" disabled={loading} className="px-6 py-2.5 bg-gradient-to-r from-[#00c8ff] to-[#0096ff] hover:from-[#00b0ff] hover:to-[#0080ff] text-gray-900 font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={18} />} 
                {formList.length > 1 ? `Save ${formList.length} Images` : 'Save Image'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
      </AuthGuard>
  );
}
