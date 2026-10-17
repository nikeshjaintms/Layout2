'use client';

import React, { useState, useEffect } from 'react';
import CadEditorTopBar from './CadEditorTopBar';
import CadEditorToolbar from './CadEditorToolbar';
import CadEditorCanvas from './CadEditorCanvas';
import CadEditorSidebar from './CadEditorSidebar';
import { useDispatch } from 'react-redux';
import { fetchProjectById, updateProject } from '@/redux/slices/projectsSlice';
import { fetchPlots, updatePlot, updatePlotAssignment } from '@/redux/slices/plotsSlice';
import { fetchPlotStatuses } from '@/redux/slices/plotStatusesSlice';
import { fetchAmenities, fetchAmenityPlacements } from '@/redux/slices/amenitiesSlice';
import { fetchAppearanceSettings } from '@/redux/slices/appearanceSlice';
import { BASE_URL } from '@/lib/api';
import { parseSvgStringToState, serializeStateToSvgString } from './SvgDocumentModel';
import { 
  getProjectPlots, getPlotStatuses, getProjectPlotStatuses, getAmenities, getAmenityPlacements, updateProjectPlotAssignment, getCadProject, updateCadProject, updateProjectPlot, getProjectAppearanceSettings, authFetch, getCadConversion, getCadConversionSvg,
  getPublicProjectPlots, getPublicProjectPlotStatuses, getPublicAmenityPlacements, getPublicProject, getPublicProjectAppearanceSettings, getPublicCadConversion, getPublicCadConversionSvg,
  createAmenityPlacement, updateAmenityPlacement, deleteAmenityPlacement
} from '@/lib/api';
import Swal from 'sweetalert2';

function stripGroupById(svgString, id) {
  let result = svgString;
  const openTag = new RegExp(`<g\\b[^>]*\\bid="${id}"[^>]*>`, 'i');
  
  while (true) {
    const match = openTag.exec(result);
    if (!match) break;

    const start = match.index;
    let depth = 1;
    let i = start + match[0].length;

    while (i < result.length && depth > 0) {
      const nextOpen  = result.indexOf('<g', i);
      const nextClose = result.indexOf('</g>', i);

      if (nextClose === -1) break; // malformed — bail out

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        i = nextOpen + 2;
      } else {
        depth--;
        i = nextClose + 4;
      }
    }

    result = result.slice(0, start) + result.slice(i);
  }
  return result;
}

export default function CadEditorWorkspace({ conversionId, projectId, readOnly = false, showPlotStatus: showPlotStatusProp, onUserViewerSelection, onZoomChange: onZoomChangeProp, gestureActive = false }) {
  const [conversion, setConversion] = useState(null);
  const [projectConfig, setProjectConfig] = useState(null);
  const [appearanceSettings, setAppearanceSettings] = useState(null);
  const [svgContent, setSvgContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTool, setActiveTool] = useState('zoom_window');
  const [isSaving, setIsSaving] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fillColor, setFillColor] = useState('#3b82f6');
  const [fillOpacity, setFillOpacity] = useState(1);
  const [strokeColor, setStrokeColor] = useState('#ffffff');
  const [eraserSize, setEraserSize] = useState(1);
  const [textFontSize, setTextFontSize] = useState(2);
  const [textFontColor, setTextFontColor] = useState('#ffffff');
  const [textFontFamily, setTextFontFamily] = useState('sans-serif');

  // Canvas state synced to TopBar and Sidebar
  const [zoomPercent, setZoomPercent] = useState(100);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  // Selected shape — kept in Workspace so Sidebar can access it
  const [selectedShapeIds, setSelectedShapeIds] = useState([]);
  const [selectedShapes, setSelectedShapes] = useState([]);

  // Plots & Statuses
  const [plots, setPlots] = useState([]);
  const [initialPlots, setInitialPlots] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [internalShowPlotStatus, setInternalShowPlotStatus] = useState(false);
  const showPlotStatus = showPlotStatusProp !== undefined ? showPlotStatusProp : internalShowPlotStatus;

  // Amenities
  const [masterAmenities, setMasterAmenities] = useState([]);
  const [originalAmenities, setOriginalAmenities] = useState([]);
  const [placedAmenities, setPlacedAmenities] = useState([]);

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Apply to All state
  const [applyToAll, setApplyToAll] = useState(false);
  const [applyToAllAnnotations, setApplyToAllAnnotations] = useState(false);
  const debouncedBulkUpdateRef = React.useRef(null);
  
  // Session scoped active style for new labels
  const [activeLabelStyle, setActiveLabelStyle] = useState(null);

  // Auto Save Feature State & Refs
  const [autoSave, setAutoSave] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const autoSaveDebounceTimerRef = React.useRef(null);
  const autoSaveStatusTimerRef = React.useRef(null);
  const isSavingRef = React.useRef(false);
  const pendingSaveRef = React.useRef(false);
  const initialLoadDoneRef = React.useRef(false);
  const latestStateRef = React.useRef({});

  // Synchronize latest state on every render to ensure callbacks never read stale data
  latestStateRef.current = {
    svgContent,
    plots,
    initialPlots,
    placedAmenities,
    originalAmenities,
    projectConfig,
    readOnly,
    conversionId,
    projectId,
    autoSave,
    isSaving,
    hasUnsavedChanges
  };

  // Read saved Auto Save preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cad_editor_autosave');
      if (stored !== null) {
        setAutoSave(stored === 'true');
      }
    } catch (e) {
      console.warn('Unable to access localStorage for autoSave', e);
    }
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoSaveDebounceTimerRef.current) clearTimeout(autoSaveDebounceTimerRef.current);
      if (autoSaveStatusTimerRef.current) clearTimeout(autoSaveStatusTimerRef.current);
    };
  }, []);

  // Warn user before leaving page if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const toggleAutoSave = () => {
    setAutoSave(prev => {
      const next = !prev;
      try {
        localStorage.setItem('cad_editor_autosave', String(next));
      } catch (e) {}

      // If turning ON and there are pending unsaved changes, trigger save quickly
      if (next && hasUnsavedChanges && !isSavingRef.current) {
        if (autoSaveDebounceTimerRef.current) clearTimeout(autoSaveDebounceTimerRef.current);
        autoSaveDebounceTimerRef.current = setTimeout(() => {
          const content = latestStateRef.current.svgContent;
          if (content && !isSavingRef.current) {
            performSave(content, true);
          }
        }, 400);
      }
      return next;
    });
  };

  const triggerAutoSave = (overrideSvgContent) => {
    if (!initialLoadDoneRef.current) return;
    setHasUnsavedChanges(true);

    if (!latestStateRef.current.autoSave || latestStateRef.current.readOnly) {
      return;
    }

    if (autoSaveDebounceTimerRef.current) {
      clearTimeout(autoSaveDebounceTimerRef.current);
    }

    autoSaveDebounceTimerRef.current = setTimeout(() => {
      const state = latestStateRef.current;
      if (state.autoSave && !state.readOnly) {
        if (isSavingRef.current) {
          pendingSaveRef.current = true;
          return;
        }
        const contentToSave = overrideSvgContent || state.svgContent;
        if (contentToSave) {
          performSave(contentToSave, true);
        }
      }
    }, 1500); // 1.5 seconds debounce
  };

  useEffect(() => {
    setApplyToAll(false);
    setApplyToAllAnnotations(false);
    setActiveLabelStyle(null);
  }, [conversionId]);

  // Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const performSave = async (content, isAutoSave = false) => {
    if (isSavingRef.current) {
      if (isAutoSave) pendingSaveRef.current = true;
      return;
    }

    const targetContent = content || latestStateRef.current.svgContent;
    if (!targetContent) return;

    try {
      isSavingRef.current = true;
      setIsSaving(true);
      if (isAutoSave) {
        setAutoSaveStatus('saving');
      }

      // Inject labels from DOM into the SVG payload using pure string manipulation
      let finalSvgString = stripGroupById(targetContent, 'composite-plot-labels');
      try {
        const labelsEl = document.getElementById('plot-labels-overlay');
        if (labelsEl) {
          const labelsString = labelsEl.outerHTML;
          const injectedLabelsString = labelsString.replace('id="plot-labels-overlay"', 'id="composite-plot-labels"');
          finalSvgString = finalSvgString.replace(/<\/svg>\s*$/, injectedLabelsString + '\n</svg>');
        }
      } catch (err) {
        console.error('Failed to inject labels into SVG during save:', err);
      }

      // Bulk save plot assignments by comparing current plots with initialPlots
      const currentPlots = latestStateRef.current.plots || [];
      const currentInitialPlots = latestStateRef.current.initialPlots || [];
      if (currentInitialPlots.length > 0 && currentPlots.length > 0) {
        const changedPlots = currentPlots.filter(p => {
          const init = currentInitialPlots.find(ip => ip.id === p.id);
          if (!init) return true;
          return init.cadRegionId !== p.cadRegionId || 
                 init.conversionId !== p.conversionId || 
                 init.x !== p.x || 
                 init.y !== p.y || 
                 init.rotation !== p.rotation || 
                 init.scale !== p.scale ||
                 JSON.stringify(init.metadata) !== JSON.stringify(p.metadata);
        });

        if (changedPlots.length > 0) {
          await Promise.all(changedPlots.map(p => {
            const assignmentData = {
              cadRegionId: p.cadRegionId || null,
              conversionId: p.conversionId || null,
              cadObjectType: p.cadObjectType || null,
              x: p.x || null,
              y: p.y || null,
              rotation: p.rotation || null,
              scale: p.scale || 1,
              metadata: p.metadata || null
            };
            return updateProjectPlotAssignment(projectId, p.id, assignmentData);
          }));
          setInitialPlots(JSON.parse(JSON.stringify(currentPlots)));
        }
      }

      const res = await authFetch(`/api/cad-conversion/${conversionId}/svg`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ svg: finalSvgString }),
      });
      if (!res.ok) {
        throw new Error('Failed to save SVG');
      }
      
      // Save Amenities
      if (!readOnly) {
        const currentPlaced = latestStateRef.current.placedAmenities || [];
        const currentOriginal = latestStateRef.current.originalAmenities || [];
        const deletedIds = currentOriginal.filter(oa => !currentPlaced.find(pa => pa.id === oa.id)).map(a => a.id);
        const added = currentPlaced.filter(pa => String(pa.id).startsWith('temp-'));
        const updated = currentPlaced.filter(pa => {
          if (String(pa.id).startsWith('temp-')) return false;
          const orig = currentOriginal.find(oa => oa.id === pa.id);
          if (!orig) return false;
          return orig.x !== pa.x || orig.y !== pa.y || orig.width !== pa.width || orig.height !== pa.height || orig.rotation !== pa.rotation;
        });

        const promises = [];
        for (const id of deletedIds) promises.push(deleteAmenityPlacement(id));
        for (const pa of updated) promises.push(updateAmenityPlacement(pa.id, {
          x: pa.x, y: pa.y, width: pa.width, height: pa.height, rotation: pa.rotation, layerOrder: pa.layerOrder || 0
        }));
        for (const pa of added) promises.push(createAmenityPlacement({
          amenityId: pa.amenityId, projectId: parseInt(projectId), conversionId: parseInt(conversionId),
          x: pa.x, y: pa.y, width: pa.width, height: pa.height, rotation: pa.rotation, layerOrder: pa.layerOrder || 0
        }));
        
        await Promise.all(promises);
        
        const fresh = await getAmenityPlacements(conversionId || projectId);
        setOriginalAmenities(fresh);
        setPlacedAmenities(fresh);
      }

      const currentProjConfig = latestStateRef.current.projectConfig;
      if (currentProjConfig) {
        await updateCadProject(projectId, {
          labelFontSize: currentProjConfig.labelFontSize,
          labelFontFamily: currentProjConfig.labelFontFamily,
          labelFontColor: currentProjConfig.labelFontColor,
        });
      }

      setHasUnsavedChanges(false);

      if (!isAutoSave) {
        Swal.fire({
          icon: "success",
          title: "Saved!",
          text: "Project saved successfully.",
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        setAutoSaveStatus('saved');
        if (autoSaveStatusTimerRef.current) clearTimeout(autoSaveStatusTimerRef.current);
        autoSaveStatusTimerRef.current = setTimeout(() => {
          setAutoSaveStatus('idle');
        }, 2500);
      }
    } catch (err) {
      console.error(err);
      if (!isAutoSave) {
        Swal.fire({
          icon: "error",
          title: "Save Failed",
          text: "Unable to save the project. Please try again."
        });
      } else {
        setAutoSaveStatus('error');
        if (autoSaveStatusTimerRef.current) clearTimeout(autoSaveStatusTimerRef.current);
        autoSaveStatusTimerRef.current = setTimeout(() => {
          setAutoSaveStatus('idle');
        }, 3500);
      }
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        if (latestStateRef.current.autoSave) {
          triggerAutoSave();
        }
      }
    }
  };

  const getHistoryState = (histItem) => {
    if (!histItem) return { svgContent: null, plots: null };
    if (typeof histItem === 'string') return { svgContent: histItem, plots: null };
    return histItem;
  };

  const saveSvgContent = async (newSvgString) => {
    setHistoryIndex(prevIndex => {
      setHistory(prevHistory => {
        const newHistory = prevHistory.slice(0, prevIndex + 1);
        const lastPlots = newHistory.length > 0 ? getHistoryState(newHistory[newHistory.length - 1]).plots : plots;
        newHistory.push({ svgContent: newSvgString, plots: lastPlots || plots });
        return newHistory;
      });
      return prevIndex + 1;
    });
    setSvgContent(newSvgString);
    triggerAutoSave(newSvgString);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const state = getHistoryState(history[newIndex]);
      if (state.svgContent) setSvgContent(state.svgContent);
      if (state.plots) setPlots(state.plots);
      triggerAutoSave(state.svgContent);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const state = getHistoryState(history[newIndex]);
      if (state.svgContent) setSvgContent(state.svgContent);
      if (state.plots) setPlots(state.plots);
      triggerAutoSave(state.svgContent);
    }
  };

  const handleSave = () => {
    if (autoSaveDebounceTimerRef.current) {
      clearTimeout(autoSaveDebounceTimerRef.current);
    }
    if (svgContent) performSave(svgContent, false);
  };

  // Update an attribute for selected shapes (and local state)
  const handleShapeAttributeChange = (attrName, value, setStateFn) => {
    setStateFn(value);
    if (selectedShapeIds.length === 0) return;

    const updateShapes = (shapes) => {
      let changed = false;
      const result = shapes.map(s => {
        const isSelected = selectedShapeIds.includes(s.id);
        const isTargetAnnotation = applyToAllAnnotations && s.attributes?.['data-annotation'] === 'true';
        if (isSelected || isTargetAnnotation) {
          changed = true;
          const newAttributes = { ...s.attributes, [attrName]: value };
          if (attrName === 'stroke' || attrName === 'fill') {
            newAttributes['data-custom-color'] = 'true';
          }
          return { ...s, attributes: newAttributes };
        }
        if (s.children) {
          const { newShapes, childChanged } = updateShapes(s.children);
          if (childChanged) {
            changed = true;
            return { ...s, children: newShapes };
          }
        }
        return s;
      });
      return { newShapes: result, childChanged: changed };
    };

    setHistoryIndex(prevIndex => {
      setHistory(prevHistory => {
        const newHist = prevHistory.slice(0, prevIndex + 1);
        const lastState = getHistoryState(newHist[newHist.length - 1]);
        const parsed = parseSvgStringToState(lastState.svgContent);
        const { newShapes } = updateShapes(parsed.shapes);
        const newSvg = serializeStateToSvgString(newShapes, parsed.viewBox);
        newHist.push({ svgContent: newSvg, plots: lastState.plots || plots });
        return newHist;
      });
      return prevIndex + 1;
    });
    setSvgContent(prev => {
      const parsed = parseSvgStringToState(prev);
      const { newShapes } = updateShapes(parsed.shapes);
      return serializeStateToSvgString(newShapes, parsed.viewBox);
    });

    setSelectedShapes(prev => prev.map(s => {
      const newAttributes = { ...s.attributes, [attrName]: value };
      if (attrName === 'stroke' || attrName === 'fill') {
        newAttributes['data-custom-color'] = 'true';
      }
      return { ...s, attributes: newAttributes };
    }));
    triggerAutoSave();
  };

  const handleShapeStrokeWidthChange = (w) => handleShapeAttributeChange('stroke-width', w, setStrokeWidth);
  const handleShapeStrokeColorChange = (c) => handleShapeAttributeChange('stroke', c, setStrokeColor);
  const handleTextFontSizeChange = (w) => handleShapeAttributeChange('font-size', w, setTextFontSize);
  const handleTextFontColorChange = (c) => handleShapeAttributeChange('fill', c, setTextFontColor);
  const handleTextFontFamilyChange = (f) => handleShapeAttributeChange('font-family', f, setTextFontFamily);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.shiftKey ? handleRedo() : handleUndo();
      } else if (e.ctrlKey && e.key.toLowerCase() === 'y') {
        handleRedo();
      } else if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        const targetTag = e.target.tagName?.toLowerCase();
        if (targetTag === 'input' || targetTag === 'textarea' || e.target.isContentEditable) return;
        switch (e.key.toLowerCase()) {
          case 'v': setActiveTool('pointer'); break;
          case 'z': setActiveTool('zoom_window'); break;
          case 'e': setActiveTool('eraser'); break;
          case 'x': setActiveTool('partial_delete'); break;
          case 'y': setActiveTool('vector_eraser'); break;
          case 't': setActiveTool('draw_text'); break;
          case 'l': setActiveTool('draw_line'); break;
          case 'r': setActiveTool('draw_arrow'); break;
          case 'c': setActiveTool('draw_circle'); break;
          case 'u': setActiveTool('draw_curve'); break;
          case 'p': setActiveTool('draw_polygon'); break;
          case 'f': setActiveTool('paint_bucket'); break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex]);

  useEffect(() => {
    async function loadData() {
      if (!conversionId || conversionId === 'undefined') {
        setError('Invalid conversion ID');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const fetchConversion = readOnly ? getPublicCadConversion : getCadConversion;
        const fetchSvg = readOnly ? getPublicCadConversionSvg : getCadConversionSvg;

        const data = await fetchConversion(conversionId);
        setConversion(data);
        if (data.status === 'FAILED') throw new Error('Conversion failed');

        let svgText = await fetchSvg(conversionId);
        svgText = stripGroupById(svgText, 'composite-plot-labels');
        setSvgContent(svgText);
        setHistory([svgText]);
        setHistoryIndex(0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    // Load Amenities
    const fetchPlacements = readOnly ? getPublicAmenityPlacements : getAmenityPlacements;
    Promise.all([
      getAmenities({ pagination: false }),
      fetchPlacements(conversionId)
    ])
      .then(([amenities, placements]) => {
        setMasterAmenities(amenities.filter(a => a.isActive !== false));
        setOriginalAmenities(placements);
        setPlacedAmenities(JSON.parse(JSON.stringify(placements)));
      })
      .catch(console.error);

    if (projectId) {
      const fetchProject = readOnly ? getPublicProject : getCadProject;
      const fetchPlots = readOnly ? getPublicProjectPlots : getProjectPlots;
      const fetchStatuses = readOnly ? getPublicProjectPlotStatuses : getProjectPlotStatuses;
      const fetchAppearance = readOnly ? getPublicProjectAppearanceSettings : getProjectAppearanceSettings;

      Promise.all([
        fetchProject(projectId),
        fetchPlots(projectId, { pagination: false, conversionId }),
        fetchStatuses(projectId, { pagination: false }),
        fetchAppearance(projectId).catch(() => null)
      ])
        .then(([proj, p, s, appearance]) => {
          setProjectConfig(proj);
          setPlots(p);
          setInitialPlots(JSON.parse(JSON.stringify(p)));
          setStatuses(s);
          if (appearance) setAppearanceSettings(appearance);
          
          setHistory(prev => {
             if (prev.length > 0) {
               const newHist = [...prev];
               newHist[0] = { svgContent: getHistoryState(newHist[0]).svgContent, plots: p };
               return newHist;
             }
             return prev;
          });

          setSvgContent(currentSvg => {
            if (!currentSvg) return currentSvg;
            const parsed = parseSvgStringToState(currentSvg);
            let changed = false;

            const syncShapes = (shapes) => {
              return shapes.map(shape => {
                let sChanged = false;
                let newAttrs = { ...shape.attributes };

                // Remove stale plot assignments
                if (newAttrs['data-plot-id']) {
                  const plotId = parseInt(newAttrs['data-plot-id']);
                  const plot = p.find(pl => pl.id === plotId && pl.cadRegionId === shape.id);
                  if (!plot) {
                    delete newAttrs['data-plot-id'];
                    delete newAttrs['fill'];
                    delete newAttrs['fill-opacity'];
                    sChanged = true;
                  }
                }

                // Apply DB assignments
                const matchingPlot = p.find(plot => plot.cadRegionId === shape.id);
                if (matchingPlot) {
                  if (newAttrs['data-plot-id'] !== String(matchingPlot.id)) {
                    newAttrs['data-plot-id'] = String(matchingPlot.id);
                    sChanged = true;
                  }
                  const statusColor = s.find(stat => stat.id === matchingPlot.statusId)?.fillColor;

                  if (matchingPlot.metadata && matchingPlot.metadata.transform) {
                    if (newAttrs['transform'] !== matchingPlot.metadata.transform) {
                      newAttrs['transform'] = matchingPlot.metadata.transform;
                      sChanged = true;
                    }
                  }
                }

                let newChildren = shape.children;
                if (shape.children) {
                  const { newShapes: syncedChildren, changed: cChanged } = syncShapesDeep(shape.children);
                  if (cChanged) {
                    newChildren = syncedChildren;
                    sChanged = true;
                  }
                }

                if (sChanged) changed = true;
                return sChanged ? { ...shape, attributes: newAttrs, children: newChildren } : shape;
              });
            };

            const syncShapesDeep = (shapes) => {
              const newShapes = syncShapes(shapes);
              return { newShapes, changed };
            };

            const { newShapes, changed: wasChanged } = syncShapesDeep(parsed.shapes);
            if (wasChanged) {
              return serializeStateToSvgString(newShapes, parsed.viewBox);
            }
            return currentSvg;
          });
        })
        .catch(console.error);
    }

    const initTimer = setTimeout(() => {
      initialLoadDoneRef.current = true;
    }, 1200);
    return () => clearTimeout(initTimer);
  }, [conversionId, projectId]);

  const handlePlacedAmenitiesChange = (action) => {
    setPlacedAmenities(prev => {
      const next = typeof action === 'function' ? action(prev) : action;
      return next;
    });
    triggerAutoSave();
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center text-zinc-400 flex-col gap-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <div>Loading Editor Workspace...</div>
      </div>
    );
  }

  const handleLayoutLineColorChange = async (color) => {
    if (!conversionId || conversionId === 'undefined') return;
    setConversion(prev => ({ ...prev, layoutLineColor: color }));
    try {
      await authFetch(`/api/cad-conversion/${conversionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layoutLineColor: color })
      });
    } catch (e) {
      console.error('Failed to update line color', e);
    }
  };

  const handlePlotLabelStyleChange = async (plotId, newStyles) => {
    if (applyToAll) {
      const affectedPlots = plots.filter(p => p.cadRegionId != null && p.conversionId === conversion?.id);
      if (affectedPlots.length === 0) return;

      let updatedPlots = [...plots];
      affectedPlots.forEach(ap => {
        const idx = updatedPlots.findIndex(p => p.id === ap.id);
        if (idx !== -1) {
          const currentMetadata = updatedPlots[idx].metadata || {};
          updatedPlots[idx] = { ...updatedPlots[idx], metadata: { ...currentMetadata, ...newStyles } };
        }
      });
      setPlots(updatedPlots);

      setHistoryIndex(prevIndex => {
        setHistory(prevHistory => {
           const newHistory = prevHistory.slice(0, prevIndex + 1);
           const lastSvg = newHistory.length > 0 ? getHistoryState(newHistory[newHistory.length - 1]).svgContent : svgContent;
           newHistory.push({ svgContent: lastSvg, plots: updatedPlots });
           return newHistory;
        });
        return prevIndex + 1;
      });

      triggerAutoSave();

      if (debouncedBulkUpdateRef.current) clearTimeout(debouncedBulkUpdateRef.current);
      debouncedBulkUpdateRef.current = setTimeout(async () => {
        try {
           const promises = affectedPlots.map(ap => {
             const meta = { ...(ap.metadata || {}), ...newStyles };
             return updateProjectPlot(projectId, ap.id, { metadata: meta });
           });
           await Promise.all(promises);
        } catch (e) {
           console.error("Bulk update failed", e);
        }
      }, 300);

    } else if (plotId !== null) {
      const plot = plots.find(p => p.id === plotId);
      if (!plot) return;
      const currentMetadata = plot.metadata || {};
      const newMetadata = { ...currentMetadata, ...newStyles };

      const updatedPlots = plots.map(p => p.id === plotId ? { ...p, metadata: newMetadata } : p);
      setPlots(updatedPlots);

      setHistoryIndex(prevIndex => {
        setHistory(prevHistory => {
           const newHistory = prevHistory.slice(0, prevIndex + 1);
           const lastSvg = newHistory.length > 0 ? getHistoryState(newHistory[newHistory.length - 1]).svgContent : svgContent;
           newHistory.push({ svgContent: lastSvg, plots: updatedPlots });
           return newHistory;
        });
        return prevIndex + 1;
      });

      triggerAutoSave();

      try {
        await updateProjectPlot(projectId, plotId, { metadata: newMetadata });
      } catch (err) {
        console.error('Failed to update plot label style:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-white animate-pulse">Loading Conversion...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center text-red-500 flex-col gap-4">
        <div className="text-xl font-medium">{error}</div>
        <button
          onClick={() => window.location.href = '/cad-conversion'}
          className="px-4 py-2 bg-zinc-800 text-zinc-200 rounded hover:bg-zinc-700"
        >
          Back to Conversion Studio
        </button>
      </div>
    );
  }

  return (
    <div className={`${readOnly ? 'h-full' : 'h-screen'} w-full bg-[#131826] flex flex-col overflow-hidden text-slate-300 font-sans select-none relative`}>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none z-0"></div>
      
      {!readOnly && (
        <CadEditorTopBar
          zoomPercent={zoomPercent}
          coords={coords}
          conversionName={conversion?.originalFileName}
          projectId={projectId}
          isSaving={isSaving}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSave={handleSave}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          activeTool={activeTool}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={handleShapeStrokeWidthChange}
          strokeColor={strokeColor}
          onStrokeColorChange={handleShapeStrokeColorChange}
          textFontSize={textFontSize}
          onTextFontSizeChange={handleTextFontSizeChange}
          textFontColor={textFontColor}
          onTextFontColorChange={handleTextFontColorChange}
          textFontFamily={textFontFamily}
          onTextFontFamilyChange={handleTextFontFamilyChange}
          selectedShapes={selectedShapes}
          showPlotStatus={showPlotStatus}
          onTogglePlotStatus={() => setInternalShowPlotStatus(!internalShowPlotStatus)}
          autoSave={autoSave}
          onToggleAutoSave={toggleAutoSave}
          autoSaveStatus={autoSaveStatus}
          hasUnsavedChanges={hasUnsavedChanges}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          plots={plots}
          projectConfig={projectConfig}
          onPlotLabelStyleChange={handlePlotLabelStyleChange}
          appearanceSettings={appearanceSettings}
          applyToAll={applyToAll}
          onToggleApplyToAll={() => setApplyToAll(!applyToAll)}
          applyToAllAnnotations={applyToAllAnnotations}
          onToggleApplyToAllAnnotations={() => setApplyToAllAnnotations(!applyToAllAnnotations)}
          activeLabelStyle={activeLabelStyle}
          onActiveLabelStyleChange={(updates) => setActiveLabelStyle(prev => ({ ...(prev || {}), ...updates }))}
        />
      )}

      <div className="flex-1 flex overflow-hidden relative z-10">
        {!readOnly && (
          <CadEditorToolbar
            activeTool={activeTool}
            onToolChange={(tool) => {
              setActiveTool(tool);
            }}
          />
        )}

        <div
          className="flex-1 relative overflow-hidden bg-black/40 backdrop-blur-md cad-viewer-global-styles"
          style={{ '--layout-line-color': conversion?.layoutLineColor || '#ffffff', touchAction: 'none' }}
        >
          <style>{`
            .cad-viewer-global-styles svg path:not([stroke="none"]):not([stroke="transparent"]):not([filter]):not([data-custom-color="true"]),
            .cad-viewer-global-styles svg line:not([stroke="none"]):not([stroke="transparent"]):not([filter]):not([data-custom-color="true"]),
            .cad-viewer-global-styles svg polyline:not([stroke="none"]):not([stroke="transparent"]):not([filter]):not([data-custom-color="true"]),
            .cad-viewer-global-styles svg polygon:not([stroke="none"]):not([stroke="transparent"]):not([filter]):not([data-custom-color="true"]),
            .cad-viewer-global-styles svg rect:not([stroke="none"]):not([stroke="transparent"]):not([filter]):not([data-custom-color="true"]),
            .cad-viewer-global-styles svg circle:not([stroke="none"]):not([stroke="transparent"]):not([filter]):not([data-custom-color="true"]),
            .cad-viewer-global-styles svg ellipse:not([stroke="none"]):not([stroke="transparent"]):not([filter]):not([data-custom-color="true"]) {
              stroke: var(--layout-line-color) !important;
            }
          `}</style>
          <CadEditorCanvas
            readOnly={readOnly}
            svgContent={svgContent}
            activeTool={activeTool}
            strokeWidth={strokeWidth}
            strokeColor={strokeColor}
            textFontSize={textFontSize}
            textFontColor={textFontColor}
            textFontFamily={textFontFamily}
            eraserSize={eraserSize}
            fillColor={fillColor}
            fillOpacity={fillOpacity}
            plots={plots}
            statuses={statuses}
            showPlotStatus={showPlotStatus}
            onZoomChange={(pct) => { setZoomPercent(pct); if (onZoomChangeProp) onZoomChangeProp(pct); }}
            onCoordsChange={setCoords}
            onSvgModified={saveSvgContent}
            onToolChange={setActiveTool}
            masterAmenities={masterAmenities}
            placedAmenities={placedAmenities}
            setPlacedAmenities={handlePlacedAmenitiesChange}
            conversionId={conversionId}
            projectId={projectId}
            projectConfig={projectConfig}
            appearanceSettings={appearanceSettings}
            gestureActive={gestureActive}
            onSelectionChange={(ids, shapes) => {
              setSelectedShapeIds(ids);
              setSelectedShapes(shapes);

              if (onUserViewerSelection) {
                if (ids.length === 1 && shapes.length === 1) {
                  const shape = shapes[0];
                  const plotIdStr = shape.attributes?.['data-plot-id'];
                  if (plotIdStr) {
                    const assignedPlot = plots.find(p => p.id === parseInt(plotIdStr));
                    onUserViewerSelection(assignedPlot || null);
                  } else {
                    onUserViewerSelection(null);
                  }
                } else {
                  onUserViewerSelection(null);
                }
              }
            }}
            onLabelDragEnd={(id, dx, dy) => {
              const updateShapes = (shapes) => {
                let changed = false;
                const result = shapes.map(s => {
                  if (s.id === id) {
                    changed = true;
                    return {
                      ...s,
                      attributes: {
                        ...s.attributes,
                        'data-label-dx': dx,
                        'data-label-dy': dy
                      }
                    };
                  }
                  if (s.children) {
                    const { newShapes, childChanged } = updateShapes(s.children);
                    if (childChanged) {
                      changed = true;
                      return { ...s, children: newShapes };
                    }
                  }
                  return s;
                });
                return { newShapes: result, childChanged: changed };
              };

              const parsed = parseSvgStringToState(svgContent);
              const { newShapes, childChanged } = updateShapes(parsed.shapes);
              if (childChanged) {
                const newSvg = serializeStateToSvgString(newShapes, parsed.viewBox);
                saveSvgContent(newSvg);
              }
            }}
          />
        </div>

        {!readOnly && (
          <CadEditorSidebar
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            projectId={projectId}
            conversion={conversion}
            coords={coords}
            activeTool={activeTool}
            selectedShapes={selectedShapes}
            fillColor={fillColor}
            fillOpacity={fillOpacity}
            eraserSize={eraserSize}
            plots={plots}
            onRefreshPlots={() => {
              if (projectId) {
                const fetchPlots = readOnly ? getPublicProjectPlots : getProjectPlots;
                fetchPlots(projectId, { pagination: false, conversionId })
                  .then(p => setPlots(p))
                  .catch(console.error);
              }
            }}
            statuses={statuses}
            masterAmenities={masterAmenities}
            projectConfig={projectConfig}
            onProjectLabelStyleChange={(key, val) => {
              setProjectConfig(prev => ({ ...prev, [key]: val }));
              triggerAutoSave();
            }}
            onPlotLabelStyleChange={handlePlotLabelStyleChange}
            onLayoutLineColorChange={handleLayoutLineColorChange}
            onFillColorChange={setFillColor}
            onFillOpacityChange={setFillOpacity}
            onStrokeWidthChange={handleShapeStrokeWidthChange}
            onEraserSizeChange={setEraserSize}
            appearanceSettings={appearanceSettings}
            onAssignPlot={async (plot, status, labelConfig = null) => {
              if (selectedShapeIds.length !== 1) return;

              const regionId = selectedShapeIds[0];
              const parsed = parseSvgStringToState(svgContent);

              // Find currently assigned plot for this region (if any)
              let currentPlotIdStr = null;
              const findPlotAttr = (shapes) => {
                for (const s of shapes) {
                  if (s.id === regionId) {
                    currentPlotIdStr = s.attributes['data-plot-id'];
                    return true;
                  }
                  if (s.children && findPlotAttr(s.children)) return true;
                }
                return false;
              };
              findPlotAttr(parsed.shapes);

              const oldPlotId = currentPlotIdStr ? parseInt(currentPlotIdStr) : null;

              // 1. Release old plot if it's changing or being removed
              if (oldPlotId && (!plot || oldPlotId !== plot.id)) {
                setPlots(prev => prev.map(p => p.id === oldPlotId ? { ...p, cadRegionId: null, conversionId: null } : p));
                triggerAutoSave();
              }

              // 2. Assign new plot
              if (plot) {
                try {
                  // Try to calculate centroid via DOM
                  const element = document.getElementById(regionId);
                  let x = null, y = null, rotation = 0, scale = 1;
                  const cadObjectType = element ? element.tagName.toLowerCase() : null;

                  if (element && typeof element.getBBox === 'function') {
                    const bbox = element.getBBox();
                    x = bbox.x + bbox.width / 2;
                    y = bbox.y + bbox.height / 2;
                  }

                  let metadata = { ...(plot.metadata || {}) };
                  if (element) {
                    const transform = element.getAttribute('transform');
                    if (transform) {
                      metadata.transform = transform;
                    }
                  }
                  
                  // Apply active label style defaults if not already explicitly set on the plot
                  if (activeLabelStyle) {
                    metadata = { ...metadata, ...activeLabelStyle };
                  } else {
                    if (metadata.labelFontSize === undefined) metadata.labelFontSize = projectConfig?.labelFontSize ?? 2;
                    if (metadata.labelFontColor === undefined) metadata.labelFontColor = projectConfig?.labelFontColor ?? '#ffffff';
                    if (metadata.labelFontFamily === undefined) metadata.labelFontFamily = projectConfig?.labelFontFamily ?? 'sans-serif';
                    if (metadata.labelStrokeWidth === undefined) metadata.labelStrokeWidth = projectConfig?.labelStrokeWidth ?? 0;
                  }

                  // Just update React state. Database will be updated on "Save"
                  setPlots(prev => prev.map(p => p.id === plot.id ? { ...p, cadRegionId: regionId, conversionId: conversion?.id, cadObjectType, x, y, rotation, scale, metadata } : p));
                  triggerAutoSave();
                } catch (e) { console.error(e); }
              }

              const updateShapes = (shapes) => {
                let changed = false;
                const result = shapes.map(s => {
                  if (selectedShapeIds.includes(s.id)) {
                    changed = true;
                    const newAttrs = {
                      ...s.attributes,
                      'data-plot-id': plot ? plot.id : undefined,
                      ...labelConfig
                    };

                    // We do not bake status color into newAttrs.fill! 
                    // ShapeRenderer overlay will handle status fill dynamically.

                    // Cleanup undefined attributes if removing assignment
                    if (!plot && !labelConfig) {
                      delete newAttrs['data-plot-id'];
                      delete newAttrs['data-label-dx'];
                      delete newAttrs['data-label-dy'];
                      delete newAttrs['data-label-rotation'];
                      delete newAttrs['data-label-fontsize'];
                      delete newAttrs['data-label-color'];
                      delete newAttrs['data-label-fontfamily'];
                      delete newAttrs['data-label-fontweight'];
                      delete newAttrs['data-label-align'];
                      delete newAttrs['data-label-show-area'];
                      delete newAttrs['data-label-show-width'];
                      delete newAttrs['data-label-show-height'];
                    }

                    return {
                      ...s,
                      attributes: newAttrs
                    };
                  }
                  if (s.children) {
                    const { newShapes, childChanged } = updateShapes(s.children);
                    if (childChanged) {
                      changed = true;
                      return { ...s, children: newShapes };
                    }
                  }
                  return s;
                });
                return { newShapes: result, childChanged: changed };
              };

              const { newShapes, childChanged } = updateShapes(parsed.shapes);
              if (childChanged) {
                const newSvg = serializeStateToSvgString(newShapes, parsed.viewBox);
                saveSvgContent(newSvg);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
