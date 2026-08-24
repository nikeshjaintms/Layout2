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
    } catch (err) {
      Swal.fire({ title: 'Error', text: 'Failed to upload icon', icon: 'error', background: '#18181b', color: '#fff' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="min-h-screen bg-[#131826] flex text-slate-300 overflow-hidden font-sans">
      {projectId && <Sidebar projectId={projectId} />}
      <div className={`flex-1 p-8 flex flex-col h-screen overflow-y-auto relative ${!projectId && 'items-center justify-center'}`}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto space-y-6 w-full flex-1 flex flex-col relative z-10">
          <div className="flex items-center gap-5 mb-8">
            <Link href={`/masters/amenities${querySuffix}`} className="p-2.5 bg-[#1d2440] border border-white/10 hover:border-[#00c8ff]/50 rounded-xl transition-all duration-300 text-slate-400 hover:text-[#00c8ff] shadow-lg group">
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">{isEditing ? 'Edit Amenity' : 'Add Amenity'}</h1>
              <p className="text-[#8ba0b8] font-medium mt-1">{isEditing ? 'Modify existing amenity' : 'Create a new global amenity'}</p>
            </div>
          </div>

          <div className="bg-[#1d2440]/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl transition-all">
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="space-y-6 p-6 sm:p-8">
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-slate-300 uppercase tracking-wider text-center">Upload Icon *</label>
                  <div className="flex justify-center items-center py-4">
                    <div className="w-48 h-48 rounded-xl bg-[#0f111a] border-2 border-dashed border-white/20 flex flex-col items-center justify-center overflow-hidden relative group cursor-pointer transition-all hover:border-[#00c8ff]/50 shadow-inner">
                      {formData.iconPath ? (
                        <img src={`${BASE_URL}${formData.iconPath}`} alt="Preview" className="w-full h-full object-contain p-4" />
                      ) : (
                        <div className="text-center text-slate-500 flex flex-col items-center">
                          <ImageIcon className="w-10 h-10 mb-3 opacity-50 group-hover:text-[#00c8ff] transition-colors" />
                          <span className="text-sm font-medium group-hover:text-white transition-colors">Click to Upload</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-[#0f111a]/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm">
                        <span className="text-sm font-bold text-[#00c8ff] uppercase tracking-wider">{uploading ? 'Uploading...' : 'Change Icon'}</span>
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
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Name *</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} disabled={submitting} className="w-full px-4 py-2.5 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm text-white placeholder-[#8ba0b8] focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all" placeholder="e.g. Club House" />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={formData.isActive !== false ? 'true' : 'false'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                    className="w-full px-4 py-2.5 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-4 mt-auto">
                <Link href={`/masters/amenities${querySuffix}`} className="px-6 py-2.5 text-sm font-bold text-[#8ba0b8] hover:text-white transition-colors bg-[#1d2440] border border-white/10 hover:border-white/30 rounded-xl shadow-lg">
                  Cancel
                </Link>
                <button type="submit" disabled={uploading || submitting} className="px-6 py-2.5 bg-[#00c8ff] hover:bg-[#00b0e6] disabled:opacity-50 text-[#0f111a] text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(0,200,255,0.4)] transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100 flex items-center justify-center">
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
