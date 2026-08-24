'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { PLOT_TYPE_CONFIG } from '@/lib/plotTypeConfig';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlotStatuses } from '@/redux/slices/plotStatusesSlice';
import { createPlotsBulk, updatePlot } from '@/redux/slices/plotsSlice';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import Sidebar from '@/components/cad-conversion/Sidebar';

const DimensionRow = ({ dim, dIdx, plotType, updateDimensions, dimensions, onRemove }) => {
  const isCustomLabel = PLOT_TYPE_CONFIG[plotType]?.customLabels;
  const hideLabels = PLOT_TYPE_CONFIG[plotType]?.hideLabels;
  const isDynamic = PLOT_TYPE_CONFIG[plotType]?.isDynamic;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 items-center bg-[#0f111a]/50 p-3 rounded-xl border border-white/10 transition-all hover:border-[#00c8ff]/30 shadow-inner">
      {isCustomLabel ? (
        <input 
          type="text" 
          value={dim.label ?? ''} 
          onChange={e => {
            const newDims = [...dimensions];
            newDims[dIdx].label = e.target.value;
            updateDimensions(newDims);
          }}
          className="w-full px-3 py-2 bg-[#1d2440] border border-white/10 rounded-lg text-sm text-white placeholder-[#8ba0b8] focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all" 
          placeholder="Label (e.g. North)" 
        />
      ) : !hideLabels ? (
        <div className="w-full px-3 py-2 bg-[#1d2440] border border-white/10 rounded-lg text-sm text-[#8ba0b8] font-bold uppercase tracking-wider flex items-center shadow-inner">
          {dim.label}
        </div>
      ) : (
        <div className="hidden xl:block"></div>
      )}

      <input 
        type="number" step="0.01" 
        value={dim.value ?? ''} 
        onChange={e => {
          const newDims = [...dimensions];
          newDims[dIdx].value = e.target.value;
          updateDimensions(newDims);
        }}
        className={`w-full px-3 py-2 bg-[#1d2440] border border-white/10 rounded-lg text-sm text-white placeholder-[#8ba0b8] focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all ${hideLabels ? 'xl:col-span-2' : ''}`}
        placeholder="Value (e.g. 10.5)" 
      />

      <input 
        type="text" 
        value={dim.unit !== undefined ? dim.unit : (dim.defaultUnit || 'm')} 
        onChange={e => {
          const newDims = [...dimensions];
          newDims[dIdx].unit = e.target.value;
          updateDimensions(newDims);
        }}
        className="w-full px-3 py-2 bg-[#1d2440] border border-white/10 rounded-lg text-sm text-white placeholder-[#8ba0b8] focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all" 
        placeholder="Unit (m, ft)"
      />

      {isDynamic ? (
        <button 
          type="button" 
          onClick={onRemove} 
          className="flex items-center justify-center w-full px-3 py-2 text-[#8ba0b8] hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-all border border-white/10 hover:border-red-500/30"
        >
          <Trash2 size={16} className="mr-2 xl:mr-0 xl:hidden" />
          <span className="xl:hidden">Remove</span>
          <Trash2 size={16} className="hidden xl:block" />
        </button>
      ) : (
        <div className="hidden xl:block"></div>
      )}
    </div>
  );
};

export default function PlotForm({ projectId, plotId, initialData }) {
  const router = useRouter();
  const dispatch = useDispatch();
  
  const statuses = useSelector(state => state.plotStatuses.items);
  const [loading, setLoading] = useState(false);
  const isEditing = !!plotId;
  
  const emptyForm = { 
    plotNumber: '', 
    plotType: 'RECTANGLE',
    dimensions: PLOT_TYPE_CONFIG['RECTANGLE'].dimensions.map(d => ({ ...d, value: '' })),
    areaSqFt: '', 
    statusId: '' 
  };
  
  const [formList, setFormList] = useState([emptyForm]);

  useEffect(() => {
    dispatch(fetchPlotStatuses({ projectId, params: { pagination: false } }));
  }, [projectId, dispatch]);

  useEffect(() => {
    if (initialData) {
      setFormList([{
        plotNumber: initialData.plotNumber,
        plotType: initialData.plotType || 'RECTANGLE',
        dimensions: (initialData.dimensions && initialData.dimensions.length > 0) 
          ? initialData.dimensions 
          : PLOT_TYPE_CONFIG[initialData.plotType || 'RECTANGLE']?.dimensions.map(d => ({ ...d, value: '' })) || [],
        areaSqFt: initialData.areaSqFt || '',
        statusId: initialData.statusId || ''
      }]);
    } else if (statuses && statuses.length > 0 && !formList[0].statusId) {
      setFormList([{ ...emptyForm, statusId: statuses[0].id }]);
    }
  }, [initialData, statuses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        const formData = formList[0];
        const payload = {
          ...formData,
          dimensions: formData.dimensions
            .map(d => ({ ...d, value: d.value ? parseFloat(d.value) : null }))
            .filter(d => d.value !== null && !isNaN(d.value) && d.value > 0),
          areaSqFt: formData.areaSqFt ? parseFloat(formData.areaSqFt) : null,
          statusId: formData.statusId ? parseInt(formData.statusId) : null
        };
        delete payload.width;
        delete payload.height;
        await dispatch(updatePlot({ projectId, plotId, data: payload })).unwrap();
      } else {
        const payloads = formList.map(formData => {
          const p = {
            ...formData,
            dimensions: formData.dimensions
              .map(d => ({ ...d, value: d.value ? parseFloat(d.value) : null }))
              .filter(d => d.value !== null && !isNaN(d.value) && d.value > 0),
            areaSqFt: formData.areaSqFt ? parseFloat(formData.areaSqFt) : null,
            statusId: formData.statusId ? parseInt(formData.statusId) : null
          };
          delete p.width;
          delete p.height;
          return p;
        });
        await dispatch(createPlotsBulk({ projectId, data: payloads })).unwrap();
      }
      router.push(`/cad-conversion/${projectId}/manage-plot`);
    } catch (err) {
      if (err.response?.failedPlots && err.response.failedPlots.length > 0) {
        const plotListHtml = err.response.failedPlots
          .map(p => `<li><strong>${p.plotNumber}</strong>: ${p.reason}</li>`)
          .join('');
        Swal.fire({
          icon: 'error',
          title: 'Failed to Save Plots',
          html: `<p>${err.response?.reason || err.message || err}</p><ul>${plotListHtml}</ul>`,
          customClass: { htmlContainer: 'text-left' }
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.reason || err.message || err || 'Failed to save plot(s)'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#131826] flex text-slate-300 overflow-hidden font-sans">
      <Sidebar projectId={projectId} />
      <div className="flex-1 p-8 flex flex-col h-screen overflow-y-auto relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

        <div className="max-w-4xl mx-auto space-y-6 w-full flex-1 flex flex-col relative z-10">
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-5">
            <Link 
              href={`/cad-conversion/${projectId}/manage-plot`} 
              className="p-2.5 bg-[#1d2440] border border-white/10 hover:border-[#00c8ff]/50 rounded-xl transition-all duration-300 text-slate-400 hover:text-[#00c8ff] shadow-lg group"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">{isEditing ? 'Edit Plot' : 'Add Plot'}</h1>
              <p className="text-[#8ba0b8] font-medium mt-1">{isEditing ? 'Modify plot details' : 'Create new plots for this project'}</p>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {formList.map((formData, index) => {
            const updateField = (field, value) => {
              const newList = [...formList];
              newList[index] = { ...newList[index], [field]: value };
              setFormList(newList);
            };

            return (
              <div key={index} className="relative border border-white/10 p-6 rounded-2xl bg-[#1d2440]/60 backdrop-blur-md shadow-xl transition-all hover:border-white/20">
                {formList.length > 1 && (
                  <button type="button" onClick={() => {
                    const newList = [...formList];
                    newList.splice(index, 1);
                    setFormList(newList);
                  }} className="absolute top-4 right-4 p-2 text-[#8ba0b8] hover:text-red-400 bg-white/5 rounded-lg border border-transparent hover:border-red-500/30 transition-all">
                    <Trash2 size={16} />
                  </button>
                )}
                {formList.length > 1 && (
                  <div className="mb-6 text-sm font-bold text-[#00c8ff] uppercase tracking-wider">Plot {index + 1}</div>
                )}
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Plot Number *</label>
                    <input required type="text" value={formData.plotNumber ?? ''} onChange={e => updateField('plotNumber', e.target.value)} className="w-full px-4 py-2.5 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm text-white placeholder-[#8ba0b8] focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all" placeholder="e.g. A-101" />
                  </div>
                  
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Plot Type *</label>
                    <select 
                      value={formData.plotType} 
                      onChange={(e) => {
                        const newType = e.target.value;
                        const config = PLOT_TYPE_CONFIG[newType];
                        const newList = [...formList];
                        newList[index] = { 
                          ...newList[index], 
                          plotType: newType,
                          dimensions: config ? config.dimensions.map(d => ({ ...d, value: '' })) : []
                        };
                        setFormList(newList);
                      }}
                      className="w-full px-4 py-2.5 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all appearance-none cursor-pointer"
                    >
                      {Object.entries(PLOT_TYPE_CONFIG).map(([key, config]) => (
                        <option key={key} value={key} className="bg-[#0f111a] text-white">{config.displayName}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2 space-y-4">
                    <label className="block text-sm font-bold text-white uppercase tracking-wider">Dimensions</label>
                    <div className="flex flex-col gap-3">
                      {formData.dimensions.map((dim, dIdx) => (
                        <DimensionRow 
                          key={dim.id || dIdx}
                          dim={dim}
                          dIdx={dIdx}
                          plotType={formData.plotType}
                          dimensions={formData.dimensions}
                          updateDimensions={(newDims) => updateField('dimensions', newDims)}
                          onRemove={() => {
                            const newDims = [...formData.dimensions];
                            newDims.splice(dIdx, 1);
                            updateField('dimensions', newDims);
                          }}
                        />
                      ))}
                    </div>
                    {PLOT_TYPE_CONFIG[formData.plotType]?.isDynamic && (
                      <button 
                        type="button" 
                        onClick={() => {
                          const newId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
                          const newDims = [...formData.dimensions, { id: newId, label: `Side ${formData.dimensions.length + 1}`, value: '', unit: 'm' }];
                          updateField('dimensions', newDims);
                        }}
                        className="text-sm text-[#00c8ff] hover:text-white font-bold inline-flex items-center gap-1 mt-2 transition-colors"
                      >
                        <Plus size={16} /> Add Dimension
                      </button>
                    )}
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Area (Sq. Ft.)</label>
                    <input type="number" step="0.01" value={formData.areaSqFt ?? ''} onChange={e => updateField('areaSqFt', e.target.value)} className="w-full px-4 py-2.5 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm text-white placeholder-[#8ba0b8] focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all" placeholder="0.00" />
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-sm font-bold text-white uppercase tracking-wider mb-2">Status</label>
                    <select value={formData.statusId ?? ''} onChange={e => updateField('statusId', e.target.value)} className="w-full px-4 py-2.5 bg-[#0f111a]/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_10px_rgba(0,200,255,0.2)] transition-all appearance-none cursor-pointer">
                      <option value="" className="bg-[#0f111a] text-[#8ba0b8]">Select Status</option>
                      {statuses.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#0f111a] text-white">{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}

          {!isEditing && (
            <button 
              type="button" 
              onClick={() => setFormList([...formList, { ...emptyForm, statusId: statuses.length > 0 ? statuses[0].id : '' }])} 
              className="w-full py-4 mt-4 border-2 border-dashed border-[#00c8ff]/30 rounded-2xl text-[#00c8ff] hover:bg-[#00c8ff]/5 hover:border-[#00c8ff]/80 flex justify-center items-center gap-2 transition-all font-bold text-sm shadow-sm"
            >
              <Plus size={18} strokeWidth={2.5} /> Add More Plots
            </button>
          )}

          <div className="pt-8 flex justify-end gap-4 border-t border-white/10 mt-8">
            <Link href={`/cad-conversion/${projectId}/manage-plot`} className="px-6 py-2.5 text-sm font-bold text-[#8ba0b8] hover:text-white transition-colors bg-[#1d2440] border border-white/10 hover:border-white/30 rounded-xl shadow-lg">Cancel</Link>
            <button disabled={loading} type="submit" className="px-6 py-2.5 bg-[#00c8ff] hover:bg-[#00b0e6] disabled:opacity-50 text-[#0f111a] text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(0,200,255,0.4)] transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100">
              {loading ? 'Saving...' : (isEditing ? 'Save Changes' : (formList.length > 1 ? `Create ${formList.length} Plots` : 'Create Plot'))}
            </button>
          </div>
        </form>
      </div>
      </div>
    </div>
  );
}
