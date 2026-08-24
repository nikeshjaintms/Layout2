import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { BASE_URL } from '@/lib/api';
import { getContrastYIQ } from '@/lib/utils';
import Link from 'next/link';
import { ColorPicker, ConfigProvider, theme } from 'antd';
import { Plus, X } from 'lucide-react';

const STROKE_SUPPORTED_TYPES = new Set([
  'line', 'polyline', 'path', 'rect', 'circle', 'ellipse', 'polygon',
]);

const MIN_STROKE = 0.01;
const MAX_STROKE = 20;

export default function CadEditorSidebar({ isMobileOpen, onCloseMobile, projectId, conversion, coords, activeTool, selectedShapes, fillColor, fillOpacity, eraserSize, plots, statuses, masterAmenities = [], projectConfig, onProjectLabelStyleChange, onPlotLabelStyleChange, onLayoutLineColorChange, onFillColorChange, onFillOpacityChange, onStrokeWidthChange, onEraserSizeChange, onAssignPlot, appearanceSettings }) {
  // Theme styling
  const sidebarBg = appearanceSettings?.navColor || '#0f111a';
  const sidebarText = appearanceSettings?.navFontColor || '#ffffff';
  const sidebarSubText = appearanceSettings?.navFontColor ? `${appearanceSettings.navFontColor}cc` : '#8ba0b8';
  const btnBg = appearanceSettings?.buttonColor || '#00c8ff';
  const btnText = appearanceSettings?.buttonFontColor || '#0f111a';
  const isDarkSidebar = !appearanceSettings?.navColor || (appearanceSettings.navColor.toLowerCase() !== '#ffffff' && appearanceSettings.navColor.toLowerCase() !== 'white');
  const panelBg = appearanceSettings?.navColor ? `${appearanceSettings.navColor}80` : 'rgba(29,36,64,0.5)';
  const borderColor = isDarkSidebar ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

  const antdTheme = {
    algorithm: isDarkSidebar ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorBgContainer: isDarkSidebar ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
      colorBorder: btnBg,
      colorText: btnBg,
      borderRadius: 6,
    }
  };
  const [localStroke, setLocalStroke] = useState(2);
  const [localEraser, setLocalEraser] = useState(1);

  // Custom Dropdown State
  const [isPlotDropdownOpen, setIsPlotDropdownOpen] = useState(false);
  const [plotSearch, setPlotSearch] = useState('');
  const [selectedPlotId, setSelectedPlotId] = useState('');

  const [isMobile, setIsMobile] = useState(false);
  const [isMobileAmenitiesOpen, setIsMobileAmenitiesOpen] = useState(false);
  const [isMobilePanelClosed, setIsMobilePanelClosed] = useState(false);
  const floatingPanelRef = useRef(null);

  useEffect(() => {
    setIsMobilePanelClosed(false);
  }, [selectedShapes?.[0]?.id]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Init
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedShape = selectedShapes?.[0]; // Use first shape for generic property display

  useEffect(() => {
    if (!isMobile || selectedShapes?.length !== 1 || !selectedShape) return;

    let animationFrameId;

    const updatePosition = () => {
      const el = document.getElementById(selectedShape.id);
      if (el && floatingPanelRef.current) {
        const rect = el.getBoundingClientRect();

        let top = rect.bottom + 10;
        let left = Math.max(10, rect.left);

        const panelWidth = 240;
        if (left + panelWidth > window.innerWidth - 10) {
          left = Math.max(10, window.innerWidth - panelWidth - 10);
        }

        const panelHeight = floatingPanelRef.current.offsetHeight || 150;
        if (top + panelHeight > window.innerHeight - 10) {
          top = rect.top - panelHeight - 10;
        }

        floatingPanelRef.current.style.transform = `translate(${left}px, ${top}px)`;
        floatingPanelRef.current.style.opacity = '1';
        floatingPanelRef.current.style.pointerEvents = 'auto';
      }
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    animationFrameId = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isMobile, selectedShapes?.length, selectedShape?.id]);

  useEffect(() => {
    if (selectedShape) {
      const raw = selectedShape.attributes?.['stroke-width'];
      const parsed = parseFloat(raw);
      setLocalStroke(!isNaN(parsed) ? parsed : 2);
    }
  }, [selectedShape?.id, selectedShape?.attributes?.['stroke-width']]);

  useEffect(() => {
    if (eraserSize !== undefined) setLocalEraser(eraserSize);
  }, [eraserSize]);

  const canEditStroke =
    selectedShape &&
    STROKE_SUPPORTED_TYPES.has(selectedShape.type) &&
    typeof onStrokeWidthChange === 'function';

  const commitStroke = (val) => {
    const clamped = Math.min(MAX_STROKE, Math.max(MIN_STROKE, val));
    setLocalStroke(clamped);
    onStrokeWidthChange(clamped);
  };

  const handleSlider = (e) => {
    const val = Number(e.target.value);
    setLocalStroke(val);
    onStrokeWidthChange(val);
  };

  const handleInput = (e) => {
    const raw = e.target.value;
    setLocalStroke(raw === '' ? '' : Number(raw));
  };

  const handleInputBlur = (e) => {
    const parsed = parseFloat(e.target.value);
    commitStroke(isNaN(parsed) ? localStroke : parsed);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      const parsed = parseFloat(e.target.value);
      commitStroke(isNaN(parsed) ? localStroke : parsed);
    }
  };

  const amenitiesListContent = (
    <>
      {masterAmenities.map(am => (
        <div
          key={am.id}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/cad-amenity', JSON.stringify(am));
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onClick={() => {
            window.dispatchEvent(new CustomEvent('cad-amenity-select', { detail: am }));
            if (isMobile) setIsMobileAmenitiesOpen(false);
          }}
          className="bg-white/5 border border-white/10 rounded-lg p-1 md:p-1.5 flex flex-col items-center justify-center gap-0.5 md:gap-1 cursor-pointer hover:border-[#00c8ff] transition-all duration-300 hover:shadow-[0_0_10px_rgba(0,200,255,0.2)] group"
          title="Drag to canvas or click to prepare placement"
        >
          <div className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center bg-black/50 rounded overflow-hidden shrink-0 group-hover:scale-110 transition-transform duration-300">
            <img src={`${BASE_URL}${am.iconPath}`} alt={am.name} className="max-w-[80%] max-h-[80%] object-contain" />
          </div>
          <div className="text-[7px] md:text-[9px] text-[#8ba0b8] group-hover:text-white font-medium text-center leading-tight truncate w-full transition-colors">
            {am.name}
          </div>
        </div>
      ))}
      {masterAmenities.length === 0 && (
        <div className="col-span-3 text-[10px] text-zinc-600 text-center py-2">No amenities available.</div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Amenities Panel */}
      {isMobile && isMobileAmenitiesOpen && (
        <div
          className="absolute top-0 bottom-0 right-0 w-12 border-l z-40 flex flex-col shadow-2xl md:hidden"
          style={{ backgroundColor: sidebarBg, borderColor: borderColor }}
        >
          <div className="flex flex-col items-center justify-center p-1 border-b shrink-0 gap-0.5 pb-1.5" style={{ borderColor: borderColor }}>
            <button
              onClick={() => setIsMobileAmenitiesOpen(false)}
              className="p-0.5 shrink-0 w-full flex justify-center opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: sidebarText }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          <div className="p-1 overflow-y-auto flex-1 flex flex-col gap-2 content-start items-center pt-2">
            {amenitiesListContent}
          </div>
        </div>
      )}
      <div
        className={`absolute md:relative right-0 top-0 h-full w-64 backdrop-blur-md border-l flex flex-col shrink-0 z-30 overflow-y-auto transform transition-transform duration-200 ${isMobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
          } shadow-xl`}
        style={{ backgroundColor: `${sidebarBg}E6`, borderColor: borderColor }}
      >
        <div className="md:hidden flex justify-between items-center p-4 border-b" style={{ borderColor: borderColor, backgroundColor: panelBg }}>
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: btnBg }}>Properties</h3>
          <button onClick={onCloseMobile} className="opacity-70 hover:opacity-100 transition-opacity" style={{ color: sidebarText }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <div className="p-4 border-b flex flex-col gap-2" style={{ borderColor: borderColor }}>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-2 hidden md:block" style={{ color: sidebarSubText }}>Actions</h3>
          <Link
            href={`/cad-conversion/${projectId}/manage-plot${conversion ? `?editorId=${conversion.id}` : ''}`}
            className="w-full flex items-center justify-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
            style={{ 
              backgroundColor: `${btnBg}1A`, // 10% opacity
              color: btnBg,
              borderColor: `${btnBg}4D`, // 30% opacity
              borderWidth: 1,
              borderStyle: 'solid'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnBg; e.currentTarget.style.color = btnText; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${btnBg}1A`; e.currentTarget.style.color = btnBg; }}
          >
            Manage Plots
          </Link>
          <Link
            href={`/cad-conversion/${projectId}/map`}
            className="w-full flex items-center justify-center py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all mt-1"
            style={{ 
              backgroundColor: `${btnBg}1A`, // 10% opacity
              color: btnBg,
              borderColor: `${btnBg}4D`, // 30% opacity
              borderWidth: 1,
              borderStyle: 'solid'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = btnBg; e.currentTarget.style.color = btnText; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${btnBg}1A`; e.currentTarget.style.color = btnBg; }}
          >
            Continue to Map
          </Link>
        </div>

        {/* ── Amenities ─────────────────────────────────────────────────────── */}
        <div className="p-4 border-b flex flex-col shrink-0" style={{ borderColor: borderColor }}>
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: sidebarSubText }}>Amenities</h3>
            <a
              href="/masters/amenities"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity opacity-70 hover:opacity-100"
              style={{ color: btnBg }}
              title="Add Amenity"
            >
              <Plus size={14} />
            </a>
          </div>

          {!isMobile ? (
            <div className="grid grid-cols-3 gap-2 overflow-y-auto pr-1 max-h-[250px]">
              {amenitiesListContent}
            </div>
          ) : (
            <button
              onClick={() => {
                setIsMobileAmenitiesOpen(true);
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors"
              style={{ backgroundColor: panelBg, color: sidebarText }}
            >
              <span>Open Amenities Panel</span>
              <span style={{ color: btnBg }}>→</span>
            </button>
          )}
        </div>

        {/* ── Global CAD Line Color ───────────────────────────────────────── */}
        <div className="p-4 border-b" style={{ borderColor: borderColor }}>
          <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: sidebarSubText }}>CAD Line Color</h3>
          <div className="space-y-3">
            <ConfigProvider theme={antdTheme}>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <ColorPicker
                    value={conversion?.layoutLineColor || '#ffffff'}
                    onChange={(_, hex) => onLayoutLineColorChange(hex)}
                    showText
                    format="hex"
                    className="w-full"
                    styles={{
                      popup: { zIndex: 9999 }
                    }}
                  />
                </div>
                <button
                  onClick={() => onLayoutLineColorChange(null)}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border h-8"
                  style={{ backgroundColor: panelBg, borderColor: borderColor, color: sidebarSubText }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = sidebarText; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = sidebarSubText; }}
                  title="Reset to original CAD colors"
                >
                  Reset
                </button>
              </div>
            </ConfigProvider>
          </div>
        </div>

        {/* ── Properties ──────────────────────────────────────────────────── */}
        {selectedShapes?.length === 1 && (
          (() => {
            const assignPlotContent = (
              <>
                <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: sidebarSubText }}>Assign Plot</h4>

                {(() => {
                  const assignedPlotId = selectedShape.attributes?.['data-plot-id'];
                  const assignedPlot = assignedPlotId ? plots.find(p => p.id === parseInt(assignedPlotId)) : null;

                  if (assignedPlot) {
                    return (
                      <div className="space-y-3">
                        <div className="p-3 border rounded flex flex-col gap-2" style={{ backgroundColor: `${btnBg}1A`, borderColor: `${btnBg}33` }}>
                          <div>
                            <span className="text-[10px] block uppercase tracking-wider" style={{ color: btnBg, opacity: 0.8 }}>Assigned Plot</span>
                            <span className="text-sm font-medium" style={{ color: sidebarText }}>{assignedPlot.plotNumber}</span>
                          </div>
                          {assignedPlot.status && (
                            <div>
                              <span className="text-[10px] block uppercase tracking-wider mb-0.5" style={{ color: sidebarSubText }}>Status</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded inline-block" style={{ backgroundColor: assignedPlot.status.fillColor, color: getContrastYIQ(assignedPlot.status.fillColor) }}>
                                {assignedPlot.status.name}
                              </span>
                            </div>
                          )}

                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() => setIsPlotDropdownOpen(!isPlotDropdownOpen)}
                              className="flex-1 px-2 py-1.5 border rounded text-[10px] transition-colors"
                              style={{ backgroundColor: `${btnBg}33`, borderColor: `${btnBg}4D`, color: btnBg }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${btnBg}66`; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = `${btnBg}33`; }}
                            >
                              Change Assignment
                            </button>
                            <button
                              onClick={() => {
                                onAssignPlot(null, null);
                                setIsPlotDropdownOpen(false);
                              }}
                              className="flex-1 px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-[10px] text-red-400 transition-colors"
                            >
                              Remove Assignment
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      onClick={() => setIsPlotDropdownOpen(!isPlotDropdownOpen)}
                      className="w-full px-2 py-1.5 rounded text-xs font-medium transition-colors flex justify-between items-center shadow-sm"
                      style={{ backgroundColor: btnBg, color: btnText }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = 0.8; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = 1; }}
                    >
                      <span>Select Plot to Assign...</span>
                      <span>▼</span>
                    </button>
                  );
                })()}

                {/* Searchable Dropdown */}
                {isPlotDropdownOpen && (
                  <div className="mt-2 border rounded-md overflow-hidden shadow-lg animate-in fade-in slide-in-from-top-1 duration-150 relative z-50 max-w-full" style={{ backgroundColor: sidebarBg, borderColor: borderColor }}>
                    <div className="p-2 border-b" style={{ borderColor: borderColor }}>
                      <input
                        type="text"
                        placeholder="Search available plots..."
                        value={plotSearch}
                        onChange={e => setPlotSearch(e.target.value)}
                        className="w-full border rounded px-2 py-1 text-xs focus:outline-none transition-colors"
                        style={{ backgroundColor: panelBg, borderColor: borderColor, color: sidebarText }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = btnBg; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = borderColor; }}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {plots
                        .filter(p => !p.cadRegionId)
                        .filter(p => {
                          const s = plotSearch.toLowerCase();
                          return p.plotNumber.toLowerCase().includes(s) || (p.status?.name || '').toLowerCase().includes(s);
                        })
                        .sort((a, b) => a.plotNumber.localeCompare(b.plotNumber, undefined, { numeric: true, sensitivity: 'base' }))
                        .map(p => (
                          <button
                            key={p.id}
                            onClick={() => {
                              const status = statuses.find(s => s.id === p.statusId);
                              onAssignPlot(p, status);
                              setIsPlotDropdownOpen(false);
                              setPlotSearch('');
                            }}
                            className="w-full text-left px-3 py-2 text-xs border-b last:border-0 flex justify-between items-center transition-colors"
                            style={{ borderColor: `${borderColor}80`, color: sidebarText }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = `${btnBg}33`; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            <span className="font-medium">{p.plotNumber}</span>
                            {p.status && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: p.status.fillColor, color: getContrastYIQ(p.status.fillColor) }}>
                                {p.status.name}
                              </span>
                            )}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </>
            );

            const fillColorContent = (
              <>
                <h4 className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: sidebarSubText }}>Fill Color</h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <ColorPicker
                      value={selectedShape.attributes?.fill && selectedShape.attributes.fill !== 'none' ? (selectedShape.attributes.fill.startsWith('#') ? selectedShape.attributes.fill : '#ffffff') : '#ffffff'}
                      onChange={(_, hex) => {
                        const currentAttrs = selectedShape.attributes || {};
                        const evt = new CustomEvent('cad-patch-shape', {
                          detail: {
                            id: selectedShape.id,
                            patch: {
                              fill: hex,
                              'data-cad-custom-fill': 'true',
                              'data-original-fill': currentAttrs['data-original-fill'] ?? (currentAttrs.fill !== undefined ? currentAttrs.fill : 'MISSING'),
                              'data-original-fill-opacity': currentAttrs['data-original-fill-opacity'] ?? (currentAttrs['fill-opacity'] !== undefined ? currentAttrs['fill-opacity'] : 'MISSING')
                            }
                          }
                        });
                        window.dispatchEvent(evt);
                      }}
                      showText
                      format="hex"
                      className="w-full"
                    />
                  </div>
                  <button
                    disabled={selectedShape.attributes?.['data-cad-custom-fill'] !== 'true'}
                    className="px-3 py-1.5 text-xs rounded transition-colors border h-8 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      backgroundColor: selectedShape.attributes?.['data-cad-custom-fill'] === 'true' ? panelBg : 'transparent', 
                      borderColor: borderColor, 
                      color: selectedShape.attributes?.['data-cad-custom-fill'] === 'true' ? sidebarText : sidebarSubText 
                    }}
                    onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = `${btnBg}33`; }}
                    onMouseLeave={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = selectedShape.attributes?.['data-cad-custom-fill'] === 'true' ? panelBg : 'transparent'; }}
                    onClick={() => {
                      const attrs = selectedShape.attributes || {};
                      const originalFill = attrs['data-original-fill'];
                      const originalFillOpacity = attrs['data-original-fill-opacity'];

                      if (originalFill !== undefined) {
                        const evt = new CustomEvent('cad-patch-shape', {
                          detail: {
                            id: selectedShape.id,
                            patch: {
                              fill: originalFill === 'MISSING' ? null : originalFill,
                              'fill-opacity': (originalFillOpacity === undefined || originalFillOpacity === 'MISSING') ? null : originalFillOpacity,
                              'data-cad-custom-fill': null,
                              'data-original-fill': null,
                              'data-original-fill-opacity': null
                            }
                          }
                        });
                        window.dispatchEvent(evt);
                      }
                    }}
                    title="Reset to Default"
                  >
                    Reset
                  </button>
                </div>
              </>
            );

            const combinedContent = (
              <>
                {assignPlotContent}
                <div className="mt-4 pt-4 border-t" style={{ borderColor: borderColor }}>
                  {fillColorContent}
                </div>
              </>
            );

            if (isMobile) {
              if (isMobilePanelClosed) return null;
              
              return typeof window !== 'undefined' ? createPortal(
                <div
                  ref={floatingPanelRef}
                  className="fixed top-0 left-0 z-50 w-64 max-w-[90vw] border rounded-lg shadow-2xl p-4 opacity-0 transition-opacity duration-150"
                  style={{ backgroundColor: sidebarBg, borderColor: borderColor }}
                  onClick={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setIsMobilePanelClosed(true)}
                    className="absolute top-2 right-2 p-1 rounded transition-colors opacity-60 hover:opacity-100"
                    style={{ backgroundColor: panelBg, color: sidebarText }}
                    title="Close"
                  >
                    <X size={14} />
                  </button>
                  <ConfigProvider theme={antdTheme}>
                    {combinedContent}
                  </ConfigProvider>
                </div>,
                document.body
              ) : null;
            }

            return (
              <div className="p-4 border-b" style={{ borderColor: borderColor }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: sidebarSubText }}>Properties</h3>
                <div className="space-y-3">
                  <ConfigProvider theme={antdTheme}>
                    {combinedContent}
                  </ConfigProvider>
                </div>
              </div>
            );
          })()
        )}

        {/* ── Paint Bucket — Fill Color ─────────────────────────────────────── */}
        {activeTool === 'paint_bucket' && (
          <div className="p-4 border-b" style={{ borderColor: borderColor }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: sidebarSubText }}>
              Paint Bucket
            </h3>

            {/* Color swatch + hex input */}
            <div className="mb-3">
              <div className="flex items-center gap-3">
                <ConfigProvider theme={antdTheme}>
                  <div className="flex-1">
                    <ColorPicker
                      value={fillColor || '#3b82f6'}
                      onChange={(_, hex) => onFillColorChange?.(hex)}
                      showText
                      format="hex"
                      className="w-full"
                    />
                  </div>
                  <button
                    onClick={() => onFillColorChange?.('#3b82f6')}
                    className="px-3 py-1.5 text-xs rounded transition-colors border h-8"
                    style={{ backgroundColor: panelBg, borderColor: borderColor, color: sidebarSubText }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = sidebarText; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = sidebarSubText; }}
                    title="Reset to default fill color"
                  >
                    Reset
                  </button>
                </ConfigProvider>
              </div>
            </div>
          </div>
        )}

        {/* ── Vector Eraser ──────────────────────────────────────────────── */}
        {activeTool === 'vector_eraser' && (
          <div className="p-4 border-b" style={{ borderColor: borderColor }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: sidebarSubText }}>
              Eraser Size
            </h3>
            <p className="text-[10px] mb-3 leading-relaxed" style={{ color: sidebarSubText }}>
              Drag over geometry to erase segments precisely.
            </p>

            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider" style={{ color: sidebarSubText }}>Radius</span>
              <span className="font-mono text-sm px-2 py-0.5 rounded border" style={{ color: btnBg, backgroundColor: panelBg, borderColor: borderColor }}>
                {localEraser} px
              </span>
            </div>

            <div className="mb-3">
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={localEraser}
                onChange={e => {
                  const val = Number(e.target.value);
                  setLocalEraser(val);
                  onEraserSizeChange?.(val);
                }}
                className="w-full"
              />
              <div className="flex justify-between text-[9px] mt-0.5" style={{ color: sidebarSubText }}>
                <span>1px</span>
                <span>100px</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const val = Math.max(1, localEraser - 1);
                  setLocalEraser(val);
                  onEraserSizeChange?.(val);
                }}
                className="w-7 h-7 flex items-center justify-center rounded text-sm font-bold transition-colors border select-none"
                style={{ backgroundColor: panelBg, borderColor: borderColor, color: sidebarSubText }}
                onMouseEnter={(e) => { e.currentTarget.style.color = sidebarText; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = sidebarSubText; }}
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max="100"
                value={localEraser}
                onChange={e => {
                  const raw = e.target.value;
                  setLocalEraser(raw === '' ? '' : Number(raw));
                }}
                onBlur={e => {
                  const parsed = Math.min(100, Math.max(1, parseInt(e.target.value) || 10));
                  setLocalEraser(parsed);
                  onEraserSizeChange?.(parsed);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const parsed = Math.min(100, Math.max(1, parseInt(e.target.value) || 10));
                    setLocalEraser(parsed);
                    onEraserSizeChange?.(parsed);
                  }
                }}
                className="flex-1 h-7 border rounded px-2 text-xs text-center focus:outline-none transition-colors font-mono"
                style={{ backgroundColor: panelBg, borderColor: borderColor, color: sidebarText }}
              />
              <button
                onClick={() => {
                  const val = Math.min(100, localEraser + 1);
                  setLocalEraser(val);
                  onEraserSizeChange?.(val);
                }}
                className="w-7 h-7 flex items-center justify-center rounded text-sm font-bold transition-colors border select-none"
                style={{ backgroundColor: panelBg, borderColor: borderColor, color: sidebarSubText }}
                onMouseEnter={(e) => { e.currentTarget.style.color = sidebarText; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = sidebarSubText; }}
              >
                +
              </button>
            </div>
            <div className="mt-4 flex gap-1 flex-wrap">
              {[1, 2, 4, 8, 12, 16, 24, 32].map(sz => (
                <button
                  key={sz}
                  onClick={() => {
                    setLocalEraser(sz);
                    onEraserSizeChange?.(sz);
                  }}
                  className="px-1.5 py-1 text-[10px] font-mono rounded border transition-colors"
                  style={{
                    backgroundColor: localEraser === sz ? `${btnBg}33` : panelBg,
                    borderColor: localEraser === sz ? `${btnBg}80` : borderColor,
                    color: localEraser === sz ? btnBg : sidebarSubText
                  }}
                  onMouseEnter={(e) => { if (localEraser !== sz) e.currentTarget.style.color = sidebarText; }}
                  onMouseLeave={(e) => { if (localEraser !== sz) e.currentTarget.style.color = sidebarSubText; }}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        )}



        {/* Placeholder when no shape is selected */}
        {!selectedShape && (
          <div className="p-4 border-b" style={{ borderColor: borderColor }}>
            <div className="text-[10px] text-center py-2" style={{ color: sidebarSubText }}>
              Select an object to edit its properties
            </div>
          </div>
        )}
      </div>
    </>
  );
}
