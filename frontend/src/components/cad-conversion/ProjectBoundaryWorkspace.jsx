'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MapPin, ArrowLeft, Save, Trash2, Undo, Redo, Maximize, MousePointer2, Hexagon, Loader2, Edit2, Layers, Eye, EyeOff, ChevronLeft, ChevronRight, X, FileJson } from 'lucide-react';
import area from '@turf/area';
import { polygon as turfPolygon } from '@turf/helpers';
import { getProjectBoundaries, createProjectBoundary, updateProjectBoundary, deleteProjectBoundary, getCadConversions, updateCadConversion, getProjectPlots, getCadProject } from '@/lib/api';
import Swal from 'sweetalert2';

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), { ssr: false });
import { BOUNDARY_DRAW_MODE } from '@/components/map/constants';

export default function ProjectBoundaryWorkspace({ projectId }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [boundary, setBoundary] = useState(null); // the single boundary object
  const [drawMode, setDrawMode] = useState(BOUNDARY_DRAW_MODE.POINTER);
  const [mapType, setMapType] = useState('hybrid');
  const [boundaryVisible, setBoundaryVisible] = useState(true);
  const [boundaryDirty, setBoundaryDirty] = useState(false);

  // History for Undo/Redo
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const mapRef = useRef(null);
  const leafletMapInstance = useRef(null);

  const pushHistory = useCallback((geoJson) => {
    setHistory(prev => {
      // Use the functional state of setHistoryIndex inside the history update
      // by keeping them perfectly in sync without reading the state from closure.
      let currentIndex;
      setHistoryIndex(prevIdx => {
        currentIndex = prevIdx;
        return prevIdx + 1;
      });
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(geoJson);
      return newHistory;
    });
  }, []);


  const [layouts, setLayouts] = useState([]);
  const [plots, setPlots] = useState([]);
  const [projectConfig, setProjectConfig] = useState(null);
  useEffect(() => {
    if (projectId) {
      // Fetch boundaries and conversions independently so one failure
      // doesn't block the other (Promise.all rejects if either fails).
      getProjectBoundaries(projectId)
        .then((boundaries) => {
          if (boundaries && boundaries.length > 0) {
            const b = boundaries[0];
            if (typeof b.geoJson === 'string') {
              try {
                b.geoJson = JSON.parse(b.geoJson);
              } catch (e) {
                console.error("Failed to parse geoJson", e);
              }
            }
            setBoundary(b);
            pushHistory(b.geoJson);
            setDrawMode(BOUNDARY_DRAW_MODE.EDIT); // default to edit mode if boundary exists
          }
        })
        .catch((err) => console.error("Failed to load boundaries:", err))
        .finally(() => setLoading(false));

      getCadConversions(projectId)
        .then((conversions) => {
          if (conversions) {
            // Only show successfully processed conversions
            setLayouts(conversions.filter(c => c.status === 'SUCCESS'));
          }
        })
        .catch((err) => console.error("Failed to load CAD conversions:", err));

      getProjectPlots(projectId, { pagination: false })
        .then((data) => setPlots(data || []))
        .catch((err) => console.error("Failed to load plots:", err));

      getCadProject(projectId)
        .then((data) => setProjectConfig(data || null))
        .catch((err) => console.error("Failed to load project config:", err));
    }
  }, [projectId, pushHistory]);



  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      updateBoundaryGeometry(history[newIndex], false);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      updateBoundaryGeometry(history[newIndex], false);
    }
  };

  const updateBoundaryGeometry = (geoJson, saveToHistory = true) => {
    if (saveToHistory) {
      pushHistory(geoJson);
    }
    setBoundaryDirty(true);
    setBoundary(prev => {
      const updated = prev ? { ...prev, geoJson } : {
        name: 'Project Boundary',
        geoJson,
        color: '#10b981' // emerald color for land boundary
      };
      return updated;
    });
  };

  const onDrawComplete = (geo, mode) => {
    if (mode === BOUNDARY_DRAW_MODE.POLYGON) {
      updateBoundaryGeometry(geo);
      setDrawMode(BOUNDARY_DRAW_MODE.EDIT); // switch to edit mode immediately
    }
  };

  const onMoveComplete = (id, geoGeoJson) => {
    updateBoundaryGeometry(geoGeoJson);
  };
  const handleLayoutDrop = useCallback(async (layout, latlng) => {
    try {
      const updates = { mapLatitude: latlng.lat, mapLongitude: latlng.lng };
      await updateCadConversion(layout.id, updates);
      setLayouts(prev => prev.map(l => l.id === layout.id ? { ...l, ...updates } : l));
    } catch (err) {
      console.error("Failed to place layout", err);
    }
  }, []);

  const handleLayoutUpdate = useCallback(async (id, updates) => {
    try {
      setLayouts(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
      await updateCadConversion(id, updates);
    } catch (err) {
      console.error("Failed to update layout placement", err);
    }
  }, []);

  const handleRemoveLayout = async (id) => {
    const result = await Swal.fire({
      title: 'Remove Layout?',
      text: 'Remove this layout from the map?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#3f3f46',
      confirmButtonText: 'Yes, Remove',
      background: '#18181b',
      color: '#fff'
    });

    if (result.isConfirmed) {
      try {
        const updates = { mapLatitude: null, mapLongitude: null, mapScale: 1, mapRotation: 0 };
        setLayouts(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
        await updateCadConversion(id, updates);
        Swal.fire({ title: 'Removed!', text: 'Layout has been removed from the map.', icon: 'success', background: '#18181b', color: '#fff', timer: 1500, showConfirmButton: false });
      } catch (err) {
        console.error("Failed to remove layout placement", err);
        Swal.fire({ title: 'Error', text: 'Failed to remove layout placement', icon: 'error', background: '#18181b', color: '#fff' });
      }
    }
  };

  const handleSave = async () => {
    mapRef.current?.applyEdit?.();
    if (!boundary || !boundary.geoJson) return;
    setSaving(true);

    // Calculate stats
    const coords = boundary.geoJson.geometry.coordinates[0];
    const pointCount = coords.length - 1; // minus closing point
    let latMin = Infinity, latMax = -Infinity, lngMin = Infinity, lngMax = -Infinity;

    coords.forEach(([lng, lat]) => {
      if (lat < latMin) latMin = lat;
      if (lat > latMax) latMax = lat;
      if (lng < lngMin) lngMin = lng;
      if (lng > lngMax) lngMax = lng;
    });

    // Area calculation using turf
    let calculatedArea = 0;
    try {
      const poly = turfPolygon(boundary.geoJson.geometry.coordinates);
      calculatedArea = area(poly);
    } catch (e) {
      console.error("Area calculation failed", e);
    }

    const payload = {
      name: boundary.name || 'Project Boundary',
      geoJson: JSON.stringify(boundary.geoJson),
      area: calculatedArea,
      pointCount,
      latMin, latMax, lngMin, lngMax
    };

    try {
      if (boundary.id) {
        await updateProjectBoundary(boundary.id, payload);
      } else {
        const created = await createProjectBoundary(projectId, payload);
        setBoundary(prev => ({ ...prev, id: created.id }));
      }
      setBoundaryDirty(false);
      Swal.fire({
        title: 'Saved!',
        text: 'Boundary has been saved successfully.',
        icon: 'success',
        background: '#18181b',
        color: '#fff',
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error('Failed to save boundary', err);
      Swal.fire({
        title: 'Error',
        text: err?.response?.data?.message || err?.message || 'Failed to save boundary.',
        icon: 'error',
        background: '#18181b',
        color: '#fff',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (boundary?.id) {
      const result = await Swal.fire({
        title: 'Delete Boundary?',
        text: 'Are you sure you want to delete this boundary?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#3f3f46',
        confirmButtonText: 'Yes, Delete',
        background: '#18181b',
        color: '#fff'
      });
      if (!result.isConfirmed) return;

      setSaving(true);
      try {
        await deleteProjectBoundary(boundary.id);
        setBoundary(null);
        setHistory([]);
        setHistoryIndex(-1);
        setDrawMode(BOUNDARY_DRAW_MODE.POINTER);
        Swal.fire({ title: 'Deleted!', text: 'Boundary has been deleted.', icon: 'success', background: '#18181b', color: '#fff', timer: 1500, showConfirmButton: false });
      } catch (err) {
        console.error('Failed to delete boundary', err);
        Swal.fire({ title: 'Error', text: 'Failed to delete boundary', icon: 'error', background: '#18181b', color: '#fff' });
      } finally {
        setSaving(false);
      }
    } else {
      setBoundary(null);
      setHistory([]);
      setHistoryIndex(-1);
      setDrawMode(BOUNDARY_DRAW_MODE.POINTER);
    }
  };

  // Responsive state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [layoutsOpen, setLayoutsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('boundary'); // mobile tabs: boundary/layouts/map
  const [selectedLayoutId, setSelectedLayoutId] = useState(null);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-gray-900">
        <Loader2 className="animate-spin mr-2" /> Loading workspace...
      </div>
    );
  }

  // Formatting sidebar stats
  let displayArea = '0';
  let pointCount = 0;
  let latRange = '-';
  let lngRange = '-';

  if (boundary && boundary.geoJson) {
    try {
      const poly = turfPolygon(boundary.geoJson.geometry.coordinates);
      const m2 = area(poly);
      if (m2 > 10000) {
        displayArea = (m2 / 10000).toFixed(2) + ' Hectares';
      } else {
        displayArea = m2.toFixed(2) + ' sq m';
      }
    } catch (e) { }

    const coords = boundary.geoJson.geometry.coordinates[0];
    pointCount = coords.length - 1;
    let lats = coords.map(c => c[1]);
    let lngs = coords.map(c => c[0]);
    latRange = `${Math.min(...lats).toFixed(4)} to ${Math.max(...lats).toFixed(4)}`;
    lngRange = `${Math.min(...lngs).toFixed(4)} to ${Math.max(...lngs).toFixed(4)}`;
  }

  // Pass boundaries as array for LeafletMap
  const mapBoundaries = boundary ? [{
    id: boundary.id || 999, // dummy ID if unsaved
    name: boundary.name || 'Boundary',
    color: '#10b981',
    visible: boundaryVisible,
    geometry: boundary.geoJson
  }] : [];

  const activeId = boundary ? (boundary.id || 999) : null;


  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden text-slate-300 font-sans relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none z-0"></div>

      {/* Top Navbar */}
      <header className="border-b border-gray-200 bg-white backdrop-blur-md flex flex-col lg:flex-row lg:items-center justify-between px-4 sm:px-6 shrink-0 z-50 shadow-xl py-2 lg:py-0 lg:h-14 gap-2">
        <div className="flex items-center justify-between w-full lg:w-auto h-10 lg:h-auto">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href={`/cad-conversion/${projectId}`}
              className="text-gray-600 hover:text-[#ABD2FA] transition-colors flex items-center gap-2 text-sm font-bold uppercase tracking-wider shrink-0"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="hidden sm:block w-px h-6 bg-white/10" />
            <h1 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2 truncate">
              <MapPin size={16} className="text-[#ABD2FA] shrink-0" />
              <span className="truncate">Land Boundary</span>
            </h1>
          </div>

          {/* Mobile menu toggle (Right side) */}
          <button
            className="lg:hidden text-zinc-400 hover:text-[#ABD2FA] p-1 -mr-1 rounded transition-colors"
            onClick={() => setSidebarOpen(v => !v)}
            aria-label="Toggle sidebar"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between sm:justify-center gap-1 sm:gap-2 bg-[#1d2440]/50 rounded-lg p-1 sm:p-1.5 border border-gray-200 w-full lg:w-auto overflow-x-auto no-scrollbar">
          <button
            className={`p-1 sm:p-1.5 rounded-md transition-colors shrink-0 ${!boundaryVisible ? 'bg-white/20 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            onClick={() => setBoundaryVisible(!boundaryVisible)}
            title={boundaryVisible ? "Hide Boundary" : "Show Boundary"}
          >
            {boundaryVisible ? <Eye size={14} className="sm:w-4 sm:h-4" /> : <EyeOff size={14} className="sm:w-4 sm:h-4" />}
          </button>
          <div className="w-px h-3 sm:h-4 bg-white/10 mx-0.5 sm:mx-1" />
          <button
            className={`p-1 sm:p-1.5 rounded-md transition-colors shrink-0 ${drawMode === BOUNDARY_DRAW_MODE.POINTER ? 'bg-white/20 text-gray-900' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
            onClick={() => setDrawMode(BOUNDARY_DRAW_MODE.POINTER)}
            title="Pointer Tool"
          >
            <MousePointer2 size={14} className="sm:w-4 sm:h-4" />
          </button>
          <button
            className={`p-1 sm:p-1.5 rounded-md transition-colors shrink-0 ${drawMode === BOUNDARY_DRAW_MODE.POLYGON ? 'bg-[#ABD2FA] text-[#18181b] border border-[#ABD2FA]' : 'text-gray-600 hover:text-[#ABD2FA] hover:bg-gray-100'}`}
            onClick={async () => {
              if (boundary) {
                const result = await Swal.fire({
                  title: 'Draw New Polygon?',
                  text: 'Drawing a new polygon will discard the current boundary. Continue?',
                  icon: 'warning',
                  showCancelButton: true,
                  confirmButtonColor: '#10b981',
                  cancelButtonColor: '#3f3f46',
                  confirmButtonText: 'Yes, Continue',
                  background: '#18181b',
                  color: '#fff'
                });
                if (result.isConfirmed) {
                  setBoundary(null);
                  setDrawMode(BOUNDARY_DRAW_MODE.POLYGON);
                }
              } else {
                setDrawMode(BOUNDARY_DRAW_MODE.POLYGON);
              }
            }}
            title="Draw Polygon Boundary"
          >
            <Hexagon size={14} className="sm:w-4 sm:h-4" />
          </button>
          <button
            className={`p-1 sm:p-1.5 rounded-md transition-colors shrink-0 ${drawMode === BOUNDARY_DRAW_MODE.EDIT ? 'bg-[#ABD2FA] text-[#18181b] border border-[#ABD2FA]' : 'text-gray-600 hover:text-[#ABD2FA] hover:bg-gray-100'}`}
            onClick={() => {
              if (boundary) setDrawMode(BOUNDARY_DRAW_MODE.EDIT);
            }}
            disabled={!boundary}
            title="Edit Boundary Vertices"
          >
            <Edit2 size={14} className="sm:w-4 sm:h-4" />
          </button>
          <div className="w-px h-3 sm:h-4 bg-white/10 mx-0.5 sm:mx-1" />
          <button
            className="p-1 sm:p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 transition-colors shrink-0"
            onClick={handleUndo} disabled={historyIndex <= 0} title="Undo"
          >
            <Undo size={14} className="sm:w-4 sm:h-4" />
          </button>
          <button
            className="p-1 sm:p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-30 transition-colors shrink-0"
            onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="Redo"
          >
            <Redo size={14} className="sm:w-4 sm:h-4" />
          </button>
          <div className="w-px h-3 sm:h-4 bg-white/10 mx-0.5 sm:mx-1" />
          <button
            className="p-1 sm:p-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors shrink-0"
            onClick={() => mapRef.current?.fitToBounds()} title="Fit to Boundary"
          >
            <Maximize size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 relative flex flex-row-reverse z-10 overflow-hidden">

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[990] lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            bg-white backdrop-blur-md border-l border-gray-200 flex flex-col z-[1000] shadow-xl transition-all duration-300 ease-in-out
            absolute inset-y-0 right-0 lg:relative h-full
            ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            ${sidebarCollapsed ? 'lg:w-16 w-[260px]' : 'w-[260px] sm:w-80'}
          `}
        >
          {/* Mobile close button */}
          <button
            className="lg:hidden absolute right-4 top-4 text-gray-600 hover:text-gray-900 p-1 bg-white/5 rounded-md"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
          {/* Collapse toggle */}
          <button
            className="hidden lg:flex absolute -left-3 top-6 w-7 h-7 items-center justify-center bg-[#1d2440] border border-gray-200 rounded-full text-gray-600 hover:text-[#ABD2FA] hover:border-[#ABD2FA] hover:shadow-[0_0_10px_rgba(0,200,255,0.2)] z-10 transition-all duration-300 group"
            onClick={() => setSidebarCollapsed(v => !v)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" /> : <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />}
          </button>

          <div className={`p-3 lg:p-5 border-b border-gray-200 bg-[#1d2440]/30 ${sidebarCollapsed ? 'hidden' : 'block'}`}>
            <h2 className="text-xs lg:text-sm font-bold text-gray-600 uppercase tracking-wider mb-0.5 lg:mb-1">CAD Layouts</h2>
            <p className="text-[10px] lg:text-xs text-gray-600/80">Drag a layout onto the map to place it.</p>
          </div>

          <div className={`p-3 lg:p-4 flex-1 flex flex-col gap-2 lg:gap-3 overflow-y-auto ${sidebarCollapsed ? 'hidden' : 'flex'}`}>
            {layouts.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-4">No processed CAD files available.</p>
            ) : (
              layouts.map(layout => (
                <div
                  key={layout.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify(layout));
                  }}
                  onClick={() => {
                    if (!layout.mapLatitude) {
                      if (leafletMapInstance.current) {
                        const center = leafletMapInstance.current.getCenter();
                        if (center) {
                          handleLayoutDrop(layout, center);
                        }
                      }
                    } else {
                      leafletMapInstance.current?.setView([layout.mapLatitude, layout.mapLongitude], 18);
                    }
                    setSidebarOpen(false);
                  }}
                  className="bg-[#1d2440]/50 border border-gray-200 p-2 lg:p-3 rounded-lg cursor-pointer hover:border-[#ABD2FA] hover:shadow-[0_0_15px_rgba(0,200,255,0.1)] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs lg:text-sm font-medium text-slate-200 truncate pr-2" title={layout.originalFileName}>
                      {layout.originalFileName}
                    </p>
                    <Link
                      href={`/cad-conversion/${projectId}/editor/${layout.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-[#ABD2FA] transition-colors shrink-0"
                      title="Open Layout Editor"
                    >
                      <Edit2 size={14} />
                    </Link>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 lg:mt-2">
                    {layout.mapLatitude ? (
                      <>
                        <span className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider block">Placed on map</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveLayout(layout.id); }}
                          className="text-[10px] text-gray-600 hover:text-red-400 uppercase font-bold tracking-wider transition-colors"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-gray-600 uppercase font-bold tracking-wider block">Not placed</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className={`p-3 lg:p-6 border-t border-gray-200 bg-[#1d2440]/30 flex flex-col gap-2 lg:gap-3 ${sidebarCollapsed ? 'hidden' : 'flex'}`}>
            {layouts.length > 0 && (
              <Link
                href={`/cad-conversion/${projectId}/editor/${layouts.find(l => l.isActive)?.id || layouts[0].id}`}
                className="w-full flex items-center justify-center py-2 lg:py-2.5 bg-[#ABD2FA] hover:bg-[#9bc2ea] text-[#18181b] border border-[#ABD2FA] text-[10px] lg:text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm hover:shadow-md gap-2"
              >
                Continue to Editor
              </Link>
            )}

            {boundary && (
              <>
                <button
                  disabled={saving || !boundary}
                  onClick={handleSave}
                  className="w-full py-2 lg:py-2.5 bg-[#ABD2FA] hover:bg-[#9bc2ea] disabled:opacity-50 text-[#18181b] border border-[#ABD2FA] text-[10px] lg:text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? 'Saving...' : (boundaryDirty ? 'Save Changes' : 'Save Boundary')}
                </button>

                <button
                  onClick={handleDelete}
                  className="w-full py-2 lg:py-2.5 bg-red-500/10 hover:bg-red-500 border border-red-500/30 text-red-500 hover:text-white text-[10px] lg:text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Boundary
                </button>
              </>
            )}
          </div>

          {/* Collapsed icons */}
          {sidebarCollapsed && (
            <div className="flex flex-col items-center gap-4 pt-4 h-full">
              <button
                className="text-gray-600 hover:text-[#ABD2FA] p-2 rounded-lg hover:bg-gray-50 transition-colors"
                title="CAD Layouts"
                onClick={() => setSidebarCollapsed(false)}
              >
                <FileJson size={18} />
              </button>
              {boundary && (
                <button
                  className="text-gray-600 hover:text-[#ABD2FA] p-2 rounded-lg hover:bg-gray-50 transition-colors mt-auto mb-4"
                  title="Save Boundary"
                  onClick={() => setSidebarCollapsed(false)}
                >
                  <Save size={18} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="flex-1 relative z-0 bg-black/40 backdrop-blur-sm h-full w-full">
          {/* Map Layer Controls */}
          <div className="hidden sm:block absolute top-[64px] sm:top-4 right-2 sm:right-4 z-[900]">
            <div className="bg-[#1d2440]/80 backdrop-blur-md border border-gray-200 rounded-lg shadow-2xl p-1 sm:p-1.5 flex items-center gap-0.5 sm:gap-1">
              <Layers size={14} className="text-gray-600 ml-1.5 mr-0.5 sm:w-4 sm:h-4 sm:ml-2 sm:mr-1" />
              <div className="flex bg-white rounded-md overflow-hidden p-0.5 sm:p-1 gap-0.5 sm:gap-1 border border-gray-200">
                {['satellite', 'hybrid', 'street'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setMapType(type)}
                    className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-1 sm:px-3 sm:py-1.5 rounded transition-all ${mapType === type
                        ? 'bg-white/20 text-gray-900'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Floating Save Boundary Button for Mobile */}
          {boundaryDirty && !selectedLayoutId && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[800] flex gap-3 pointer-events-none lg:hidden">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-[#ABD2FA] hover:bg-[#00a0cc] text-[#0f111a] text-xs font-bold uppercase tracking-wider rounded-full shadow-[0_0_15px_rgba(0,200,255,0.4)] transition-all transform hover:scale-105 pointer-events-auto flex items-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Save Boundary'}
              </button>
            </div>
          )}

          {!loading ? (
            <LeafletMap
              ref={mapRef}
              mapType={mapType}
              drawMode={drawMode}
              drawingBoundary={drawMode === BOUNDARY_DRAW_MODE.POLYGON || drawMode === BOUNDARY_DRAW_MODE.EDIT}
              boundaries={mapBoundaries}
              activeBoundaryId={activeId}
              currentColor="#10b981"
              onDrawComplete={onDrawComplete}
              onSelectBoundary={() => { }}
              onMoveComplete={onMoveComplete}
              initialBounds={boundary?.latMin ? [[boundary.latMin, boundary.lngMin], [boundary.latMax, boundary.lngMax]] : null}
              layouts={layouts}
              plots={plots}
              projectConfig={projectConfig}
              onLayoutDrop={handleLayoutDrop}
              onLayoutUpdate={handleLayoutUpdate}
              onLayoutSelect={setSelectedLayoutId}
              onMapReady={(map) => { leafletMapInstance.current = map; }}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 bg-zinc-950">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-sm font-medium">Loading map boundary...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
