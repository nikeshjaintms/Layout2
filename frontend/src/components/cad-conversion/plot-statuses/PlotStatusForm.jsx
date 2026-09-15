'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { createPlotStatus, updatePlotStatus } from '@/redux/slices/plotStatusesSlice';
import { ArrowLeft } from 'lucide-react';
import { ColorPicker, ConfigProvider, theme } from 'antd';
import Link from 'next/link';
import Swal from 'sweetalert2';

import Sidebar from '@/components/cad-conversion/Sidebar';

export default function PlotStatusForm({ projectId, statusId, initialData, currentMaxOrder }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const isEditing = !!statusId;

  const emptyForm = { name: '', fillColor: '#000000', isActive: true };
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditing && initialData) {
      setFormData({
        name: initialData.name || '',
        fillColor: initialData.fillColor || '#000000',
        isActive: initialData.isActive ?? true
      });
    }
  }, [isEditing, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setErrors({ name: 'Status Name is required.' });
      return;
    }
    setErrors({});
    
    try {
      setLoading(true);
      const payload = { ...formData };

      if (isEditing) {
        await dispatch(updatePlotStatus({ projectId, id: statusId, body: payload })).unwrap();
      } else {
        await dispatch(createPlotStatus({ projectId, body: payload })).unwrap();
      }
      
      router.push(`/cad-conversion/${projectId}/plot-statuses`);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err || 'Failed to save plot status'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex text-slate-300 overflow-hidden font-sans">
      <Sidebar projectId={projectId} />
      <div className="flex-1 p-8 flex flex-col h-screen overflow-y-auto relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col relative z-10">
          <div className="flex items-center gap-5 mb-8">
            <Link 
              href={`/cad-conversion/${projectId}/plot-statuses`} 
              className="p-2.5 bg-[#FDF6ED] border border-gray-200 hover:border-[#ABD2FA] rounded-xl transition-all duration-300 text-gray-600 hover:text-[#ABD2FA] shadow-lg group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{isEditing ? 'Edit Plot Status' : 'Add Plot Status'}</h1>
              <p className="text-gray-600 font-medium mt-1">{isEditing ? `Editing status for project #${projectId}` : `Create a new status for project #${projectId}`}</p>
            </div>
          </div>

          <div className="bg-[#FDF6ED] backdrop-blur-md border border-gray-200 rounded-2xl overflow-hidden shadow-xl transition-all">
            <form onSubmit={handleSubmit} noValidate className="flex flex-col">
              <div className="p-8 space-y-8">
                <div>
                  <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Status Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value.replace(/\s/g, '') }))}
                    onKeyDown={(e) => {
                      if (e.key === ' ') e.preventDefault();
                    }}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-[#8ba0b8] focus:outline-none focus:border-[#ABD2FA] focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all"
                    placeholder="e.g. Premium"
                  />
                  {errors.name && (
                    <div className="text-red-400 text-xs font-bold mt-2">{errors.name}</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Fill Color</label>
                  <div className="flex items-center gap-3 w-full bg-white border border-gray-200 rounded-xl p-2 focus-within:border-[#ABD2FA] focus-within:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all">
                    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
                      <ColorPicker
                        format="hex"
                        value={formData.fillColor}
                        onChange={(color) => setFormData(prev => ({ ...prev, fillColor: typeof color === 'string' ? color : color.toHexString() }))}
                        showText
                        size="large"
                        className="bg-transparent border-none text-gray-900 w-full flex justify-start shadow-none"
                      />
                    </ConfigProvider>
                  </div>
                </div>

                <div className="pt-2">
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
              </div>
              
              <div className="p-6 border-t border-gray-200 bg-white/5 flex justify-end gap-4 mt-auto">
                <Link
                  href={`/cad-conversion/${projectId}/plot-statuses`}
                  className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors bg-white hover:bg-gray-50 border border-gray-200 rounded-xl shadow-sm"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#ABD2FA] hover:bg-[#9bc2ea] disabled:opacity-50 text-[#18181b] text-sm font-bold rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100"
                >
                  {loading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Status')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
