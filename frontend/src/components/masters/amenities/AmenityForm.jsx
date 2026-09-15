'use client';
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createAmenity, updateAmenity } from '@/redux/slices/amenitiesSlice';
import { uploadAmenityIcon, BASE_URL } from '@/lib/api';
import { Image as ImageIcon, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

import { useSearchParams } from 'next/navigation';
import Sidebar from '@/components/cad-conversion/Sidebar';

export default function AmenityForm({ initialData = null }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const editorId = searchParams.get('editorId');
  const querySuffix = projectId ? `?projectId=${projectId}${editorId ? '&editorId=' + editorId : ''}` : '';

  const isEditing = !!initialData;

  const [formData, setFormData] = useState({
    name: '',
    iconPath: '',
    isActive: true
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        iconPath: initialData.iconPath || '',
        isActive: initialData.isActive !== false
      });
    }
  }, [initialData]);

  const handleIconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const { iconPath } = await uploadAmenityIcon(file);
      setFormData(prev => ({ ...prev, iconPath }));
      setErrors(prev => ({ ...prev, iconPath: null }));
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to upload icon', icon: 'error', background: '#18181b', color: '#fff' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!formData.iconPath) newErrors.iconPath = 'Icon is required.';
    if (!formData.name.trim()) newErrors.name = 'Name is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all required fields.',
        background: '#18181b', color: '#fff'
      });
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      if (isEditing) {
        await dispatch(updateAmenity({ id: initialData.id, body: formData })).unwrap();
      } else {
        await dispatch(createAmenity(formData)).unwrap();
      }
      router.push(`/masters/amenities${querySuffix}`);
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to save amenity', icon: 'error', background: '#18181b', color: '#fff' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex text-gray-900 overflow-hidden font-sans">
      {projectId && <Sidebar projectId={projectId} />}
      <div className={`flex-1 p-8 flex flex-col h-screen overflow-y-auto relative ${!projectId && 'items-center justify-center'}`}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto space-y-6 w-full flex-1 flex flex-col relative z-10">
          <div className="flex items-center gap-5 mb-8">
            <Link href={`/masters/amenities${querySuffix}`} className="p-2.5 bg-[#FDF6ED] border border-gray-200 hover:border-[#ABD2FA] rounded-xl transition-all duration-300 text-gray-600 hover:text-[#ABD2FA] shadow-lg group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{isEditing ? 'Edit Amenity' : 'Add Amenity'}</h1>
              <p className="text-gray-600 font-medium mt-1">{isEditing ? 'Modify existing amenity' : 'Create a new global amenity'}</p>
            </div>
          </div>

          <div className="bg-[#FDF6ED] backdrop-blur-md border border-gray-200 rounded-2xl overflow-hidden shadow-xl transition-all">
            <form onSubmit={handleSubmit} noValidate className="flex flex-col">
              <div className="space-y-6 p-6 sm:p-8">
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-600 uppercase tracking-wider text-center">Upload Icon *</label>
                  <div className="flex justify-center items-center py-4">
                    <div className="w-48 h-48 rounded-xl bg-white border-2 border-dashed border-gray-200 flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer transition-all hover:border-[#ABD2FA] shadow-sm">
                      {formData.iconPath ? (
                        <img src={`${BASE_URL}${formData.iconPath}`} alt="Preview" className="w-full h-full object-contain p-4" />
                      ) : (
                        <div className="text-center text-gray-500 flex flex-col items-center">
                          <ImageIcon className="w-10 h-10 mb-3 opacity-50 group-hover:text-[#ABD2FA] transition-colors" />
                          <span className="text-sm font-medium group-hover:text-gray-900 transition-colors">Click to Upload</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                        <span className="text-sm font-bold text-[#ABD2FA] uppercase tracking-wider">{uploading ? 'Uploading...' : 'Change Icon'}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/svg+xml, image/webp"
                        onChange={handleIconUpload}
                        disabled={uploading || submitting}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  {errors.iconPath && <div className="text-red-400 text-xs font-bold text-center mt-2">{errors.iconPath}</div>}
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Name *</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({ ...formData, name: e.target.value.replace(/\s/g, '') })} 
                    onKeyDown={(e) => {
                      if (e.key === ' ') e.preventDefault();
                    }}
                    disabled={submitting} 
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#ABD2FA] focus:shadow-sm transition-all" 
                    placeholder="e.g. ClubHouse" 
                  />
                  {errors.name && <div className="text-red-400 text-xs font-bold mt-2">{errors.name}</div>}
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={formData.isActive !== false ? 'true' : 'false'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:border-[#ABD2FA] focus:shadow-sm transition-all"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-white/5 flex justify-end gap-4 mt-auto">
                <Link href={`/masters/amenities${querySuffix}`} className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-sm">
                  Cancel
                </Link>
                <button type="submit" disabled={uploading || submitting} className="px-6 py-2.5 bg-[#ABD2FA] hover:bg-[#9bc2ea] disabled:opacity-50 text-[#18181b] text-sm font-bold rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100 flex items-center justify-center">
                  {submitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Amenity')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
