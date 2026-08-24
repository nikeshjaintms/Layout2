'use client';
import AuthGuard from '@/components/auth/AuthGuard';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ColorPicker } from 'antd';
import { Palette, Save, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAppearanceSettings, updateAppearanceSettings, createAppearanceSettings } from '@/redux/slices/appearanceSlice';
import { Can } from '@/lib/ability';
import Sidebar from '@/components/cad-conversion/Sidebar';

export default function AppearanceSettingsPage({ params }) {
  const unwrappedParams = React.use(params);
  const { projectId } = unwrappedParams;

  const dispatch = useDispatch();
  const { settings: globalSettings, loading, error: reduxError } = useSelector(state => state.appearance);

  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(true);

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [settings, setSettings] = useState({
    dimensionColor: '#ffffff',
    plotColor: '#3B82F6',
    plotLabelColor: '#ffffff'
  });

  useEffect(() => {
    if (projectId) {
      dispatch(fetchAppearanceSettings(projectId)).unwrap()
        .then(data => {
          if (data) {
            setSettings({
              dimensionColor: data.dimensionColor || '#ffffff',
              plotColor: data.plotColor || '#3B82F6',
              plotLabelColor: data.plotLabelColor || '#ffffff'
            });
            setIsNew(false);
          }
        })
        .catch(err => {
          // If 404, it means no settings exist yet, which is fine (isNew = true).
          if (err && !err.includes('404')) {
            setError('Failed to load appearance settings.');
          }
        });
    }
  }, [projectId, dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage('');

    try {
      if (isNew) {
        await dispatch(createAppearanceSettings({ projectId, data: settings })).unwrap();
        setIsNew(false);
      } else {
        await dispatch(updateAppearanceSettings({ projectId, data: settings })).unwrap();
      }
      setSuccessMessage('Appearance settings saved successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Failed to save settings', err);
      setError(err || 'Failed to save appearance settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <AuthGuard requirePermission={{ action: 'read', subject: 'appearance' }}>
      <div className="min-h-screen bg-[#131826] flex flex-col md:flex-row text-slate-300 overflow-hidden font-sans">
        <Sidebar projectId={projectId} />
        <div className="flex-1 p-4 md:p-8 flex flex-col h-[calc(100vh-73px)] md:h-screen overflow-y-auto relative w-full">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto space-y-6 w-full flex-1 flex flex-col relative z-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-5">
            <Link 
              href={`/cad-conversion/${projectId}`}
              className="p-2 sm:p-2.5 bg-[#1d2440] border border-white/10 hover:border-[#00c8ff]/50 rounded-xl transition-all duration-300 text-slate-400 hover:text-[#00c8ff] shadow-lg group shrink-0"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#00c8ff]/10 rounded-xl border border-[#00c8ff]/30 hidden sm:block">
                <Palette className="w-6 h-6 text-[#00c8ff]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Appearance Settings
                </h1>
                <p className="text-xs sm:text-sm text-[#8ba0b8] font-medium mt-1">
                  Customize the primary colors for plots and dimensions
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <form onSubmit={handleSave} className="bg-[#1d2440]/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 space-y-8 shadow-xl">

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 shadow-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="bg-[#00c8ff]/10 border border-[#00c8ff]/30 rounded-xl p-4 flex items-center gap-3 text-[#00c8ff] shadow-[0_0_15px_rgba(0,200,255,0.1)]">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Dimension Color */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="text-sm font-bold text-white uppercase tracking-wider">Dimension Color</label>
              </div>
              <div className="sm:col-span-2 flex items-center gap-4">
                <div className="flex-1">
                  <ColorPicker
                    value={settings.dimensionColor}
                    onChange={(_, hex) => setSettings(prev => ({ ...prev, dimensionColor: hex }))}
                    showText
                    format="hex"
                    className="w-full h-10 border border-white/10 hover:border-[#00c8ff]/50 shadow-sm bg-[#0f111a]/50 !text-white"
                    styles={{
                      popup: { zIndex: 9999 }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Plot Color */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-6 border-t border-white/10">
              <div>
                <label className="text-sm font-bold text-white uppercase tracking-wider">Plot Color</label>
              </div>
              <div className="sm:col-span-2 flex items-center gap-4">
                <div className="flex-1">
                  <ColorPicker
                    value={settings.plotColor}
                    onChange={(_, hex) => setSettings(prev => ({ ...prev, plotColor: hex }))}
                    showText
                    format="hex"
                    className="w-full h-10 border border-white/10 hover:border-[#00c8ff]/50 shadow-sm bg-[#0f111a]/50 !text-white"
                    styles={{
                      popup: { zIndex: 9999 }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Plot Label Color */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-6 border-t border-white/10">
              <div>
                <label className="text-sm font-bold text-white uppercase tracking-wider">Plot Label Color</label>
              </div>
              <div className="sm:col-span-2 flex items-center gap-4">
                <div className="flex-1">
                  <ColorPicker
                    value={settings.plotLabelColor}
                    onChange={(_, hex) => setSettings(prev => ({ ...prev, plotLabelColor: hex }))}
                    showText
                    format="hex"
                    className="w-full h-10 border border-white/10 hover:border-[#00c8ff]/50 shadow-sm bg-[#0f111a]/50 !text-white"
                    styles={{
                      popup: { zIndex: 9999 }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex justify-end">
            <Can I="edit" a="appearance">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-[#00c8ff] hover:bg-[#00b0e6] text-[#0f111a] text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(0,200,255,0.4)] flex items-center gap-2 transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </Can>
          </div>
        </form>
      </div>
      </div>
      </div>
      </div>
    </AuthGuard>
  );
}
