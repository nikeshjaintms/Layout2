'use client';

/**
 * LeafletMap — pure Leaflet (no React Leaflet) to avoid SSR issues.
 *
 * Tools:
 *  POINTER   — click boundary to select; cursor default
 *  POLYGON   — click points, double-click / Enter to finish
 *  RECTANGLE — click+drag
 *  EDIT      — drag the selected boundary to move it; double-click vertex to delete it
 *
 * Other features:
 *  - Satellite / Street / Hybrid tile layers
 *  - Per-boundary color + visibility
 *  - Fit to bounds on demand (imperative ref)
 *  - Nominatim place search
 *  - Escape cancels draw / edit
 */

import {
  useEffect, useRef, useState, useCallback,
  useImperativeHandle, forwardRef,
} from 'react';
import { createPortal } from 'react-dom';
import 'leaflet/dist/leaflet.css';
import { BASE_URL } from '@/lib/api';
import LayoutTransformNode from './LayoutTransformNode';

import { BOUNDARY_DRAW_MODE } from './constants';

const LeafletMap = forwardRef(function LeafletMap(
  {
    mapType, drawMode, drawingBoundary,
    boundaries, activeBoundaryId, currentColor,
    onDrawComplete, onSelectBoundary, onMoveComplete,
    initialBounds, staticPreview, onLayoutDrop,
    layouts, onLayoutUpdate, plots, statuses, showPlotStatus,
    projectConfig, selectedPlotId, onPlotSelect, appearanceSettings,
    onMapReady, onLayoutSelect, enableZoomDimming,
    aligningLayout, onCancelAlignment, onLayoutPolygonLoaded
  },
  ref,
) {
  const containerRef   = useRef(null);
  const mapRef         = useRef(null);
  const tileRef        = useRef(null);
  const labelTileRef   = useRef(null);
  const boundaryLayers = useRef({});   // id → L.GeoJSON layer
  const editLayerRef   = useRef(null); // the draggable edit layer
  const drawPtsRef     = useRef([]);
  const drawMarkersRef = useRef([]);
  const previewRef     = useRef(null);
  const rectStartRef   = useRef(null);
  const rectLayerRef   = useRef(null);
  const isDrawing      = useRef(false);
  const L              = useRef(null);

  const [search,    setSearch]    = useState('');
  const [searching, setSearching] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  const [selectedLayoutId, _setSelectedLayoutId] = useState(null);
  const setSelectedLayoutId = (id) => {
    _setSelectedLayoutId(id);
    if (onLayoutSelect) onLayoutSelect(id);
  };

  const [draftTransforms, setDraftTransforms] = useState({});
  const [currentZoom, setCurrentZoom] = useState(null);
  const [baseZoom, setBaseZoom] = useState(null);
  const [portalTargets, setPortalTargets] = useState({});

  // ── 2-Point Reference Alignment State ─────────────────────────────────────────
  const layoutPolygonsRef = useRef({});
  const [alignStep, setAlignStep] = useState(1); // 1: pt1Layout, 2: pt1Map, 3: pt2Layout, 4: pt2Map
  const [alignData, setAlignData] = useState({
    pt1Layout: null,
    pt1Map: null,
    pt2Layout: null,
    pt2Map: null
  });
  const alignMarkersRef = useRef([]);
  const alignLinesRef = useRef([]);

  // ── Expose map methods imperatively ──────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    fitToBounds() {
      const map = mapRef.current;
      if (!map) return;
      const layers = Object.values(boundaryLayers.current);
      if (!layers.length) return;
      try {
        const group = L.current.featureGroup(layers);
        map.fitBounds(group.getBounds().pad(0.2));
      } catch { /* empty */ }
    },
    getCenter() {
      return mapRef.current?.getCenter();
    },
    setView(latlng, zoom) {
      return mapRef.current?.setView(latlng, zoom);
    }
  }));

  // ── Init map ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;
    if (containerRef.current?._leaflet_id) {
      containerRef.current._leaflet_id = null;
    }

    import('leaflet').then((mod) => {
      if (!containerRef.current || mapRef.current) return;
      const Lf = mod.default;
      L.current = Lf;
      setLeafletLoaded(true);

      delete Lf.Icon.Default.prototype._getIconUrl;
      Lf.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const mapOpts = { zoomControl: false, maxZoom: 28 };
      if (!initialBounds) {
        mapOpts.center = [20.5937, 78.9629];
        mapOpts.zoom = 5;
      }

      const map = Lf.map(containerRef.current, mapOpts);
      if (initialBounds) {
        map.fitBounds(initialBounds);
        const z = map.getZoom();
        setBaseZoom(z);
        setCurrentZoom(z);
      } else {
        setBaseZoom(5);
        setCurrentZoom(5);
      }

      if (onMapReady) {
        onMapReady(map);
      }

      mapRef.current = map;
      if (!staticPreview) {
        Lf.control.zoom({ position: 'bottomright' }).addTo(map);
      }

      map.on('zoom', () => {
        setCurrentZoom(map.getZoom());
      });


      const { base, label } = buildTileLayers(Lf, 'satellite');
      tileRef.current = base.addTo(map);
      if (label) labelTileRef.current = label.addTo(map);

      mapRef.current = map;

      // Handle resize events (e.g., when sidebar collapses)
      const observer = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      });
      observer.observe(containerRef.current);
      mapRef.current._resizeObserver = observer;
    });

    return () => {
      if (mapRef.current) { 
        if (mapRef.current._resizeObserver) {
          mapRef.current._resizeObserver.disconnect();
        }
        mapRef.current.remove(); 
        mapRef.current = null; 
      }
      if (containerRef.current) delete containerRef.current._leaflet_id;
    };
  }, []);

  // ── Swap tile layers ───────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const Lf  = L.current;
    if (!map || !Lf) return;
    if (tileRef.current)      map.removeLayer(tileRef.current);
    if (labelTileRef.current) { map.removeLayer(labelTileRef.current); labelTileRef.current = null; }
    const { base, label } = buildTileLayers(Lf, mapType);
    tileRef.current = base.addTo(map);
    if (label) labelTileRef.current = label.addTo(map);
  }, [mapType]);

  // ── Render saved boundaries ────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const Lf  = L.current;
    if (!map || !Lf) return;

    // Remove layers for deleted boundaries
    Object.keys(boundaryLayers.current).forEach((sid) => {
      const numId = Number(sid);
      if (!boundaries.find((b) => b.id === numId)) {
        try { map.removeLayer(boundaryLayers.current[sid]); } catch {}
        delete boundaryLayers.current[sid];
      }
    });

    boundaries.forEach((b) => {
      // Handle visibility
      if (!b.visible) {
        if (boundaryLayers.current[b.id]) {
          try { map.removeLayer(boundaryLayers.current[b.id]); } catch {}
          delete boundaryLayers.current[b.id];
        }
        return;
      }

      const isActive = b.id === activeBoundaryId;
      const color    = b.color ?? '#3b82f6';
      const style = {
        color,
        weight:      isActive ? 3 : 2,
        fillOpacity: isActive ? 0.25 : 0.12,
        fillColor:   color,
        dashArray:   isActive ? null : '5,4',
      };

      if (boundaryLayers.current[b.id]) {
        boundaryLayers.current[b.id].setStyle(style);
        // Update tooltip text in case name changed
        try {
          boundaryLayers.current[b.id].unbindTooltip();
          boundaryLayers.current[b.id].bindTooltip(b.name, {
            permanent: false, direction: 'center',
            className: 'leaflet-tooltip-custom',
          });
        } catch {}
      } else {
        try {
          const layer = Lf.geoJSON(b.geometry, { style })
            .on('click', (e) => {
              e.originalEvent?.stopPropagation();
              onSelectBoundary(b.id);
            })
            .addTo(map);

          layer.bindTooltip(b.name, {
            permanent: false, direction: 'center',
            className: 'leaflet-tooltip-custom',
          });

          boundaryLayers.current[b.id] = layer;
        } catch { /* malformed geometry */ }
      }
    });
  }, [boundaries, activeBoundaryId, onSelectBoundary]);

  // ── Edit / Move mode ────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const Lf  = L.current;
    if (!map || !Lf) return;

    // Tear down any previous edit layer
    if (editLayerRef.current) {
      try { map.removeLayer(editLayerRef.current.poly); } catch {}
      editLayerRef.current.markers?.forEach((m) => { try { map.removeLayer(m); } catch {} });
      editLayerRef.current.midMarkers?.forEach((m) => { try { map.removeLayer(m); } catch {} });
      editLayerRef.current = null;
    }

    if (drawMode !== BOUNDARY_DRAW_MODE.EDIT || !activeBoundaryId) return;

    const boundary = boundaries.find((b) => b.id === activeBoundaryId);
    if (!boundary || !boundary.visible) return;

    const geo = boundary.geometry?.geometry ?? boundary.geometry;
    if (!geo?.coordinates?.[0]) return;

    const color = boundary.color ?? '#3b82f6';
    const ring  = geo.coordinates[0].slice(0, -1);

    let latLngs = ring.map(([lng, lat]) => Lf.latLng(lat, lng));

    if (boundaryLayers.current[activeBoundaryId]) {
      try { map.removeLayer(boundaryLayers.current[activeBoundaryId]); } catch {}
      delete boundaryLayers.current[activeBoundaryId];
    }

    const poly = Lf.polygon(latLngs, {
      color, weight: 2, fillOpacity: 0.2, fillColor: color, dashArray: '5,4', interactive: false,
    }).addTo(map);

    let markers = [];
    let midMarkers = [];

    function finishEdit() {
      if (!latLngs || latLngs.length < 3) return;
      const coords = [...latLngs, latLngs[0]].map((ll) => [ll.lng, ll.lat]);
      const newGeo = {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: {},
      };
      onMoveComplete?.(activeBoundaryId, newGeo);
    }

    function buildMarkers() {
      markers.forEach(m => { try { map.removeLayer(m); } catch {} });
      midMarkers.forEach(m => { try { map.removeLayer(m); } catch {} });
      markers = [];
      midMarkers = [];

      latLngs.forEach((ll, i) => {
        // Main vertex marker using a DivIcon and native draggable for touch/mouse support
        const icon = Lf.divIcon({
          className: 'boundary-vertex-icon',
          html: `<div style="width: 14px; height: 14px; background: ${color}; border: 2px solid #fff; border-radius: 50%; box-shadow: 0 0 3px rgba(0,0,0,0.5); cursor: grab;"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7]
        });

        const m = Lf.marker(ll, {
          icon: icon,
          draggable: true,
          zIndexOffset: 1000
        }).addTo(map);

        m.on('dragstart', () => {
          map.dragging.disable();
        });
        
        m.on('drag', () => {
          latLngs[i] = m.getLatLng();
          poly.setLatLngs(latLngs);
          refreshMidMarkers();
        });
        
        m.on('dragend', () => {
          map.dragging.enable();
          finishEdit();
        });

        // Double click or Long Press (contextmenu) to delete vertex
        m.on('dblclick contextmenu', (e) => {
          e.originalEvent?.stopPropagation();
          e.originalEvent?.preventDefault();
          if (latLngs.length <= 3) return; // Cannot have less than 3 points
          latLngs.splice(i, 1);
          poly.setLatLngs(latLngs);
          buildMarkers(); // Rebuild everything due to index shift
          finishEdit();
        });

        markers.push(m);
      });

      // Midpoint markers
      refreshMidMarkers();
    }

    function refreshMidMarkers() {
      midMarkers.forEach(m => { try { map.removeLayer(m); } catch {} });
      midMarkers = [];

      for (let i = 0; i < latLngs.length; i++) {
        const p1 = latLngs[i];
        const p2 = latLngs[(i + 1) % latLngs.length];
        const mid = Lf.latLng((p1.lat + p2.lat) / 2, (p1.lng + p2.lng) / 2);

        const midIcon = Lf.divIcon({
          className: 'boundary-vertex-mid-icon',
          html: `<div style="width: 12px; height: 12px; background: ${color}; border: 1.5px solid #fff; border-radius: 50%; opacity: 0.6; box-shadow: 0 0 2px rgba(0,0,0,0.5); cursor: pointer;"></div>`,
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        });

        const mMid = Lf.marker(mid, {
          icon: midIcon,
          zIndexOffset: 500
        }).addTo(map);

        mMid.on('mousedown touchstart', (e) => {
          e.originalEvent?.stopPropagation();
          // Convert midpoint to real vertex
          latLngs.splice(i + 1, 0, mid);
          poly.setLatLngs(latLngs);
          buildMarkers();
          finishEdit();
        });
        midMarkers.push(mMid);
      }
      
      if (editLayerRef.current) {
        editLayerRef.current.markers = markers;
        editLayerRef.current.midMarkers = midMarkers;
      }
    }

    buildMarkers();

    function onKeyDown(e) {
      if (e.key === 'Enter') finishEdit();
      if (e.key === 'Escape') {
        if (editLayerRef.current) {
          try { map.removeLayer(editLayerRef.current.poly); } catch {}
          editLayerRef.current.markers.forEach((m) => { try { map.removeLayer(m); } catch {} });
          editLayerRef.current.midMarkers.forEach((m) => { try { map.removeLayer(m); } catch {} });
          editLayerRef.current = null;
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    editLayerRef.current = { poly, markers, finishEdit };

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (editLayerRef.current) {
        try { map.removeLayer(editLayerRef.current.poly); } catch {}
        editLayerRef.current.markers?.forEach((m) => { try { map.removeLayer(m); } catch {} });
        editLayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawMode, activeBoundaryId]);

  // Expose finishEdit via ref so MapWorkspace toolbar can trigger "Apply"
  useImperativeHandle(ref, () => ({
    fitToBounds() {
      const map = mapRef.current;
      if (!map) return;
      const layers = Object.values(boundaryLayers.current);
      if (!layers.length) return;
      try {
        const group = L.current.featureGroup(layers);
        map.fitBounds(group.getBounds().pad(0.2));
      } catch {}
    },
    applyEdit() {
      editLayerRef.current?.finishEdit?.();
    },
  }));

  // ── Draw mode ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const Lf  = L.current;
    if (!map || !Lf) return;

    if (!drawingBoundary) {
      cleanupDraw(map, Lf);
      map.getContainer().style.cursor =
        drawMode === BOUNDARY_DRAW_MODE.POINTER ? 'default' :
        drawMode === BOUNDARY_DRAW_MODE.EDIT    ? 'grab'    : '';
      return;
    }

    map.getContainer().style.cursor = 'crosshair';

    // ── Polygon ──────────────────────────────────────────────────────────
    // Disable double-click zoom while in polygon draw mode
    if (drawMode === BOUNDARY_DRAW_MODE.POLYGON) {
      map.doubleClickZoom.disable();
    }

    function onPolyClick(e) {
      if (drawMode !== BOUNDARY_DRAW_MODE.POLYGON) return;
      e.originalEvent?.stopPropagation();

      // Prevent duplicate points from the second click of a double-click
      const pts = drawPtsRef.current;
      if (pts.length > 0) {
        const lastPt = pts[pts.length - 1];
        // ~1 meter tolerance to catch the second click even with slight mouse drift
        if (Math.abs(lastPt[0] - e.latlng.lat) < 0.00001 && Math.abs(lastPt[1] - e.latlng.lng) < 0.00001) {
          return;
        }
      }

      isDrawing.current = true;
      const pt = [e.latlng.lat, e.latlng.lng];
      drawPtsRef.current.push(pt);

      const m = Lf.circleMarker(e.latlng, {
        radius: 5, color: currentColor, fillColor: currentColor, fillOpacity: 1, weight: 2,
      }).addTo(map);
      drawMarkersRef.current.push(m);

      if (previewRef.current) map.removeLayer(previewRef.current);
      if (drawPtsRef.current.length > 1) {
        previewRef.current = Lf.polyline(drawPtsRef.current, {
          color: currentColor, weight: 2, dashArray: '6,4',
        }).addTo(map);
      }
    }

    function onPolyDblClick(e) {
      if (drawMode !== BOUNDARY_DRAW_MODE.POLYGON) return;
      const pts = drawPtsRef.current;
      if (pts.length < 3) return;
      e.originalEvent?.stopPropagation();
      finishPolygon(map, Lf, pts);
    }

    function finishPolygon(map, Lf, pts) {
      const coords = [...pts, pts[0]].map(([lat, lng]) => [lng, lat]);
      const geo = {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: {},
      };
      cleanupDraw(map, Lf);
      map.getContainer().style.cursor = '';
      onDrawComplete(geo, BOUNDARY_DRAW_MODE.POLYGON);
    }

    // ── Rectangle ────────────────────────────────────────────────────────
    function onMouseDown(e) {
      if (drawMode !== BOUNDARY_DRAW_MODE.RECTANGLE) return;
      if (e.originalEvent?.button !== 0) return;
      isDrawing.current = true;
      rectStartRef.current = e.latlng;
    }

    function onMouseMove(e) {
      if (drawMode !== BOUNDARY_DRAW_MODE.RECTANGLE || !isDrawing.current || !rectStartRef.current) return;
      if (rectLayerRef.current) map.removeLayer(rectLayerRef.current);
      rectLayerRef.current = Lf.rectangle(
        Lf.latLngBounds(rectStartRef.current, e.latlng),
        { color: currentColor, weight: 2, fillOpacity: 0.1, dashArray: '6,4' },
      ).addTo(map);
    }

    function onMouseUp(e) {
      if (drawMode !== BOUNDARY_DRAW_MODE.RECTANGLE || !isDrawing.current || !rectStartRef.current) return;
      isDrawing.current = false;
      const bounds = Lf.latLngBounds(rectStartRef.current, e.latlng);
      if (rectLayerRef.current) { map.removeLayer(rectLayerRef.current); rectLayerRef.current = null; }
      rectStartRef.current = null;

      const sw = bounds.getSouthWest();
      const ne = bounds.getNorthEast();
      const coords = [
        [sw.lng, sw.lat], [ne.lng, sw.lat],
        [ne.lng, ne.lat], [sw.lng, ne.lat], [sw.lng, sw.lat],
      ];
      const geo = {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: {},
      };
      cleanupDraw(map, Lf);
      map.getContainer().style.cursor = '';
      onDrawComplete(geo, BOUNDARY_DRAW_MODE.RECTANGLE);
    }

    function onKeyDown(e) {
      if (e.key === 'Enter' && drawMode === BOUNDARY_DRAW_MODE.POLYGON) {
        const pts = drawPtsRef.current;
        if (pts.length >= 3) finishPolygon(map, Lf, pts);
      }
      if (e.key === 'Escape') {
        cleanupDraw(map, Lf);
        map.getContainer().style.cursor = '';
      }
    }

    map.on('click',     onPolyClick);
    map.on('dblclick',  onPolyDblClick);
    map.on('mousedown', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup',   onMouseUp);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      map.off('click',     onPolyClick);
      map.off('dblclick',  onPolyDblClick);
      map.off('mousedown', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup',   onMouseUp);
      window.removeEventListener('keydown', onKeyDown);
      cleanupDraw(map, Lf);
      if (map.getContainer()) {
        map.getContainer().style.cursor = '';
      }
      if (map.doubleClickZoom) {
        map.doubleClickZoom.enable();
      }
    };
  }, [drawingBoundary, drawMode, currentColor, onDrawComplete]);

  function cleanupDraw(map, Lf) {
    isDrawing.current = false;
    drawPtsRef.current = [];
    drawMarkersRef.current.forEach((m) => { try { map.removeLayer(m); } catch {} });
    drawMarkersRef.current = [];
    if (previewRef.current)   { try { map.removeLayer(previewRef.current); }   catch {} previewRef.current = null; }
    if (rectLayerRef.current) { try { map.removeLayer(rectLayerRef.current); } catch {} rectLayerRef.current = null; }
  }

  // ── 2-Point Reference Alignment Cleanup ─────────────────────────────────────
  const cleanupAlignMarkers = useCallback(() => {
    if (mapRef.current) {
      alignMarkersRef.current.forEach(m => {
        try { mapRef.current.removeLayer(m); } catch (e) {}
      });
      alignLinesRef.current.forEach(l => {
        try { mapRef.current.removeLayer(l); } catch (e) {}
      });
    }
    alignMarkersRef.current = [];
    alignLinesRef.current = [];
  }, []);

  useEffect(() => {
    if (!aligningLayout) {
      setAlignStep(1);
      setAlignData({ pt1Layout: null, pt1Map: null, pt2Layout: null, pt2Map: null });
      cleanupAlignMarkers();
    }
  }, [aligningLayout, cleanupAlignMarkers]);

  // Cancel on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && aligningLayout) {
        cleanupAlignMarkers();
        if (onCancelAlignment) onCancelAlignment();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aligningLayout, onCancelAlignment, cleanupAlignMarkers]);

  // Click on layout point during alignment
  const handleLayoutAlignmentClick = useCallback((layoutId, localPt) => {
    if (!aligningLayout || aligningLayout.id !== layoutId || !mapRef.current) return;
    const map = mapRef.current;
    const Lf = L.current;
    if (!Lf) return;

    const draft = draftTransforms[layoutId] || {};
    const lat = draft.mapLatitude ?? aligningLayout.mapLatitude;
    const lng = draft.mapLongitude ?? aligningLayout.mapLongitude;
    const scale = draft.mapScale ?? aligningLayout.mapScale ?? 1;
    const rot = draft.mapRotation ?? aligningLayout.mapRotation ?? 0;

    const polyInfo = layoutPolygonsRef.current[layoutId];
    if (!polyInfo) return;
    const { imgSize, interactionPolygon } = polyInfo;
    const centroidPx = {
      x: interactionPolygon.centroid[0] * imgSize.w,
      y: interactionPolygon.centroid[1] * imgSize.h
    };

    const zoomScale = Math.pow(2, map.getZoom() - 17);
    const finalScale = scale * zoomScale;
    const centerLp = map.latLngToLayerPoint([lat, lng]);
    const deltaLocal = { x: (localPt.x - centroidPx.x) * finalScale, y: (localPt.y - centroidPx.y) * finalScale };
    const rRad = (rot * Math.PI) / 180;
    const screenLp = {
      x: centerLp.x + (deltaLocal.x * Math.cos(rRad) - deltaLocal.y * Math.sin(rRad)),
      y: centerLp.y + (deltaLocal.x * Math.sin(rRad) + deltaLocal.y * Math.cos(rRad))
    };
    const ptLatLng = map.layerPointToLatLng(Lf.point(screenLp.x, screenLp.y));

    if (alignStep === 1) {
      const icon = Lf.divIcon({
        className: 'align-marker-pt1',
        html: `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;background:#00c8ff;color:#0f111a;font-weight:bold;font-size:11px;border-radius:50%;box-shadow:0 0 12px #00c8ff;border:2px solid #fff;">1</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      const m = Lf.marker(ptLatLng, { icon, zIndexOffset: 3000 }).addTo(map);
      alignMarkersRef.current.push(m);

      setAlignData(prev => ({ ...prev, pt1Layout: { local: localPt, latlng: ptLatLng } }));
      setAlignStep(2);
    } else if (alignStep === 3) {
      const icon = Lf.divIcon({
        className: 'align-marker-pt2',
        html: `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;background:#00c8ff;color:#0f111a;font-weight:bold;font-size:11px;border-radius:50%;box-shadow:0 0 12px #00c8ff;border:2px solid #fff;">2</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      const m = Lf.marker(ptLatLng, { icon, zIndexOffset: 3000 }).addTo(map);
      alignMarkersRef.current.push(m);

      setAlignData(prev => ({ ...prev, pt2Layout: { local: localPt, latlng: ptLatLng } }));
      setAlignStep(4);
    }
  }, [aligningLayout, alignStep, draftTransforms]);

  // Click on map target during alignment
  useEffect(() => {
    if (!aligningLayout || !mapRef.current) return;
    const map = mapRef.current;
    const Lf = L.current;
    if (!Lf) return;

    function handleMapClick(e) {
      if (alignStep !== 2 && alignStep !== 4) return;
      let targetLatLng = e.latlng;

      // Snap to nearest boundary vertex if within 25 screen pixels
      const boundaryCoords = boundaries?.[0]?.geometry?.geometry?.coordinates?.[0] || 
                            boundaries?.[0]?.geometry?.coordinates?.[0];
      if (boundaryCoords && boundaryCoords.length > 0) {
        const clickLp = map.latLngToLayerPoint(e.latlng);
        let minDist = 25;
        for (const [lng, lat] of boundaryCoords) {
          const vLp = map.latLngToLayerPoint([lat, lng]);
          const dist = Math.hypot(clickLp.x - vLp.x, clickLp.y - vLp.y);
          if (dist < minDist) {
            minDist = dist;
            targetLatLng = Lf.latLng(lat, lng);
          }
        }
      }

      if (alignStep === 2) {
        const icon = Lf.divIcon({
          className: 'align-target-1',
          html: `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;background:#10b981;color:#fff;font-weight:bold;font-size:11px;border-radius:50%;box-shadow:0 0 12px #10b981;border:2px solid #fff;">1</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        const m = Lf.marker(targetLatLng, { icon, zIndexOffset: 3000 }).addTo(map);
        alignMarkersRef.current.push(m);

        if (alignData.pt1Layout?.latlng) {
          const line = Lf.polyline([alignData.pt1Layout.latlng, targetLatLng], {
            color: '#10b981',
            weight: 2,
            dashArray: '5,5'
          }).addTo(map);
          alignLinesRef.current.push(line);
        }

        setAlignData(prev => ({ ...prev, pt1Map: targetLatLng }));
        setAlignStep(3);
      } else if (alignStep === 4) {
        const icon = Lf.divIcon({
          className: 'align-target-2',
          html: `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;background:#10b981;color:#fff;font-weight:bold;font-size:11px;border-radius:50%;box-shadow:0 0 12px #10b981;border:2px solid #fff;">2</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });
        const m = Lf.marker(targetLatLng, { icon, zIndexOffset: 3000 }).addTo(map);
        alignMarkersRef.current.push(m);

        if (alignData.pt2Layout?.latlng) {
          const line = Lf.polyline([alignData.pt2Layout.latlng, targetLatLng], {
            color: '#10b981',
            weight: 2,
            dashArray: '5,5'
          }).addTo(map);
          alignLinesRef.current.push(line);
        }

        const polyInfo = layoutPolygonsRef.current[aligningLayout.id];
        if (polyInfo && alignData.pt1Layout && alignData.pt1Map && alignData.pt2Layout) {
          try {
            const alignmentResult = calculate2PointAlignment({
              map,
              imgSize: polyInfo.imgSize,
              interactionPolygon: polyInfo.interactionPolygon,
              pt1Local: alignData.pt1Layout.local,
              pt1Map: alignData.pt1Map,
              pt2Local: alignData.pt2Layout.local,
              pt2Map: targetLatLng
            });

            setDraftTransforms(prev => ({
              ...prev,
              [aligningLayout.id]: {
                ...(prev[aligningLayout.id] || {}),
                ...alignmentResult,
                _dirty: true
              }
            }));

            if (onLayoutUpdate) {
              onLayoutUpdate(aligningLayout.id, alignmentResult);
            }

            import('sweetalert2').then(SwalMod => {
              const Swal = SwalMod.default;
              Swal.fire({
                title: 'Layout Aligned!',
                text: 'CAD layout has been mathematically aligned to the points.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                background: '#18181b',
                color: '#fff'
              });
            });
          } catch (err) {
            console.error('Alignment calculation error:', err);
            import('sweetalert2').then(SwalMod => {
              const Swal = SwalMod.default;
              Swal.fire({
                title: 'Alignment Failed',
                text: err.message || 'Points could not produce a valid transform. Please try again.',
                icon: 'error',
                background: '#18181b',
                color: '#fff'
              });
            });
          }
        }

        setTimeout(() => {
          cleanupAlignMarkers();
          if (onCancelAlignment) onCancelAlignment();
        }, 1200);
      }
    }

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [aligningLayout, alignStep, alignData, boundaries, onLayoutUpdate, onCancelAlignment, cleanupAlignMarkers]);



  // ── Search ─────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    if (!search.trim() || !mapRef.current) return;
    setSearching(true);
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(search)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'en' } },
      );
      const data = await res.json();
      if (data[0]) mapRef.current.setView([+data[0].lat, +data[0].lon], 14);
    } catch { /* network */ } finally { setSearching(false); }
  }, [search]);

  return (
    <div className="relative w-full h-full">
      <style>{`
        @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        .leaflet-container { background: #1c1c1c; font-family: inherit; }
        .leaflet-tooltip-custom {
          background: rgba(15,15,15,0.92); border: 1px solid #3f3f46;
          color: #e4e4e7; font-size: 11px; padding: 3px 8px; border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }
        .boundary-vertex { cursor: move !important; }
        
        /* Grid Overlay for premium engineering visual aesthetic */
        .leaflet-container::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
          pointer-events: none;
          z-index: 250; /* Between tile-pane (200) and overlay-pane (400) */
        }
      `}</style>

      {/* Search bar */}
      {!staticPreview && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[9000] w-[calc(100%-32px)] sm:w-auto max-w-md pointer-events-none">
          <form onSubmit={handleSearch} className="flex gap-1.5 sm:gap-2 p-1 sm:p-1.5 bg-[#0f111a]/80 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl w-full pointer-events-auto">
            <div className="relative flex-1">
              <svg className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-[#8ba0b8] pointer-events-none shrink-0"
                   width="12" height="12" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search place, city..."
                className="w-full sm:w-80 bg-[#1d2440]/50 border border-white/5 rounded-lg
                           pl-7 sm:pl-9 pr-2 sm:pr-3 py-1.5 sm:py-2 text-xs sm:text-sm text-white placeholder-[#8ba0b8]/60
                           focus:outline-none focus:border-[#00c8ff]/50 focus:shadow-[0_0_15px_rgba(0,200,255,0.1)] transition-all"
              />
            </div>
            <button type="submit" disabled={searching}
                    className="px-3 sm:px-5 py-1.5 sm:py-2 bg-[#00c8ff]/10 hover:bg-[#00c8ff] text-[#00c8ff] hover:text-[#0f111a] border border-[#00c8ff]/30 text-[10px] sm:text-xs uppercase tracking-wider
                               font-bold rounded-lg transition-all shadow-[0_0_10px_rgba(0,200,255,0.1)] hover:shadow-[0_0_15px_rgba(0,200,255,0.3)] disabled:opacity-50 shrink-0">
              {searching ? '...' : 'Go'}
            </button>
          </form>
        </div>
      )}

      {enableZoomDimming && (
        <style>{`
          .leaflet-tile-pane {
            filter: brightness(${
              (currentZoom === null || baseZoom === null) ? 0.45 :
              currentZoom < baseZoom ? 1.0 : 0.45
            });
            transition: filter 300ms ease;
          }
        `}</style>
      )}

      <div 
        ref={containerRef} 
        className="w-full h-full" 
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!mapRef.current || !onLayoutDrop) return;
          try {
            const layoutData = e.dataTransfer.getData('application/json');
            if (!layoutData) return;
            const layout = JSON.parse(layoutData);
            
            const rect = containerRef.current.getBoundingClientRect();
            const point = L.current.point(e.clientX - rect.left, e.clientY - rect.top);
            const latlng = mapRef.current.containerPointToLatLng(point);
            
            onLayoutDrop(layout, latlng);
          } catch (err) {
            console.error("Drop error", err);
          }
        }}
        onClick={(e) => {
          // If we clicked on the map directly (not on a marker/portal), deselect
          if (e.target.classList.contains('leaflet-container')) {
            setSelectedLayoutId(null);
          }
        }}
      />

      {/* Floating Save Placement Button */}
      {Object.keys(draftTransforms).some(id => draftTransforms[id]._dirty) && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[9000]">
          <button
            onClick={() => {
              Object.keys(draftTransforms).forEach(id => {
                const draft = draftTransforms[id];
                if (draft._dirty && onLayoutUpdate) {
                  onLayoutUpdate(parseInt(id), {
                    mapLatitude: draft.mapLatitude,
                    mapLongitude: draft.mapLongitude,
                    mapScale: draft.mapScale,
                    mapRotation: draft.mapRotation
                  });
                }
              });
              setDraftTransforms({});
              setSelectedLayoutId(null);
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all transform hover:scale-105 pointer-events-auto"
          >
            Save Placement
          </button>
        </div>
      )}

      {/* 2-Point Reference Alignment Floating Guide Banner */}
      {aligningLayout && (
        <div className="absolute top-16 sm:top-5 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-24px)] max-w-xl pointer-events-auto">
          <div className="bg-[#0f111a]/95 backdrop-blur-md border border-[#00c8ff]/50 rounded-xl shadow-[0_0_25px_rgba(0,200,255,0.25)] p-3 text-white">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#00c8ff]/20 text-[#00c8ff] flex items-center justify-center font-bold text-sm shrink-0 border border-[#00c8ff]/50 shadow-[0_0_10px_rgba(0,200,255,0.3)]">
                  {alignStep}/4
                </div>
                <div>
                  <div className="text-[11px] font-bold text-[#00c8ff] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00c8ff] animate-ping inline-block" />
                    2-Point Reference Alignment
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-slate-100 mt-0.5">
                    {alignStep === 1 && "Step 1: Click Reference Point 1 on the CAD Layout (e.g. corner)"}
                    {alignStep === 2 && "Step 2: Click Target Point 1 on the Map or Boundary to match"}
                    {alignStep === 3 && "Step 3: Click Reference Point 2 on the CAD Layout (e.g. second corner)"}
                    {alignStep === 4 && "Step 4: Click Target Point 2 on the Map or Boundary to complete"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  cleanupAlignMarkers();
                  if (onCancelAlignment) onCancelAlignment();
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-lg transition-colors text-slate-300 hover:text-white shrink-0"
              >
                Cancel (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Render of LayoutTransformNode as a Leaflet Layer */}
      {leafletLoaded && mapRef.current && layouts?.map(layout => {
        if (!layout.mapLatitude || !layout.mapLongitude) return null;
        
        const draft = draftTransforms[layout.id] || {};
        const activeLayout = {
           ...layout,
           mapScale: draft.mapScale ?? layout.mapScale ?? 1,
           mapRotation: draft.mapRotation ?? layout.mapRotation ?? 0,
           mapLatitude: draft.mapLatitude ?? layout.mapLatitude,
           mapLongitude: draft.mapLongitude ?? layout.mapLongitude
        };

        return (
          <LayoutTransformNode
            key={layout.id}
            layout={activeLayout}
            map={mapRef.current}
            plots={plots}
            statuses={statuses}
            showPlotStatus={showPlotStatus}
            projectConfig={projectConfig}
            readOnly={staticPreview}
            isSelected={selectedLayoutId === layout.id}
            onSelect={() => setSelectedLayoutId(layout.id)}
            selectedPlotId={selectedPlotId}
            onPlotSelect={onPlotSelect}
            appearanceSettings={appearanceSettings}
            isAligning={aligningLayout?.id === layout.id}
            onPolygonLoaded={(layoutId, polyData) => {
              layoutPolygonsRef.current[layoutId] = polyData;
              if (onLayoutPolygonLoaded) onLayoutPolygonLoaded(layoutId, polyData);
            }}
            onLayoutClickForAlignment={handleLayoutAlignmentClick}
            onTransformChange={(newDraft) => {
              setDraftTransforms(prev => ({
                ...prev,
                [layout.id]: {
                  ...(prev[layout.id] || {}),
                  ...newDraft,
                  _dirty: true
                }
              }));
            }}
            onTransformEnd={() => {}}
          />
        );
      })}
    </div>
  );
});

export default LeafletMap;

// ─── 2-Point Reference Alignment Math (Helmert 2D conformal transformation) ─────
function calculate2PointAlignment({
  map,
  imgSize,
  interactionPolygon,
  pt1Local,
  pt1Map,
  pt2Local,
  pt2Map
}) {
  const centroidPx = {
    x: interactionPolygon.centroid[0] * imgSize.w,
    y: interactionPolygon.centroid[1] * imgSize.h
  };

  const v1Local = { x: pt1Local.x - centroidPx.x, y: pt1Local.y - centroidPx.y };
  const v2Local = { x: pt2Local.x - centroidPx.x, y: pt2Local.y - centroidPx.y };

  const dLocalX = pt2Local.x - pt1Local.x;
  const dLocalY = pt2Local.y - pt1Local.y;
  const distLocal = Math.hypot(dLocalX, dLocalY);
  if (distLocal < 2) {
    throw new Error("Reference points on the layout are too close together. Pick two points that are further apart.");
  }
  const angleLocal = Math.atan2(dLocalY, dLocalX) * (180 / Math.PI);

  const lp1 = map.latLngToLayerPoint([pt1Map.lat, pt1Map.lng]);
  const lp2 = map.latLngToLayerPoint([pt2Map.lat, pt2Map.lng]);

  const dMapX = lp2.x - lp1.x;
  const dMapY = lp2.y - lp1.y;
  const distMap = Math.hypot(dMapX, dMapY);
  if (distMap < 2) {
    throw new Error("Target points on the map are too close together. Pick two points that are further apart.");
  }
  const angleMap = Math.atan2(dMapY, dMapX) * (180 / Math.PI);

  // 1. Rotation difference
  let newRotation = angleMap - angleLocal;
  while (newRotation > 180) newRotation -= 360;
  while (newRotation <= -180) newRotation += 360;

  // 2. Scale
  const zoom = map.getZoom();
  const zoomScale = Math.pow(2, zoom - 17);
  const finalScale = distMap / distLocal;
  let newScale = finalScale / zoomScale;
  if (newScale < 0.0001) newScale = 0.0001;

  // 3. Translation (Centroid)
  const midLocal = {
    x: (v1Local.x + v2Local.x) / 2,
    y: (v1Local.y + v2Local.y) / 2
  };
  const rad = (newRotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const scaledMidLocal = {
    x: midLocal.x * finalScale,
    y: midLocal.y * finalScale
  };

  const rotatedMidLayer = {
    x: scaledMidLocal.x * cos - scaledMidLocal.y * sin,
    y: scaledMidLocal.x * sin + scaledMidLocal.y * cos
  };

  const midMapLp = {
    x: (lp1.x + lp2.x) / 2,
    y: (lp1.y + lp2.y) / 2
  };

  const centroidLp = {
    x: midMapLp.x - rotatedMidLayer.x,
    y: midMapLp.y - rotatedMidLayer.y
  };

  const centroidLatLng = map.layerPointToLatLng(L.current.point(centroidLp.x, centroidLp.y));

  return {
    mapLatitude: centroidLatLng.lat,
    mapLongitude: centroidLatLng.lng,
    mapRotation: parseFloat(newRotation.toFixed(2)),
    mapScale: parseFloat(newScale.toFixed(6))
  };
}

// ─── Tile layer factory ────────────────────────────────────────────────────────
function buildTileLayers(Lf, type) {
  if (type === 'satellite') {
    return {
      base: Lf.tileLayer(
        'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        { attribution: '© Google', maxZoom: 28, maxNativeZoom: 21, subdomains: ['0','1','2','3'] },
      ),
      label: null,
    };
  }
  if (type === 'hybrid') {
    return {
      base: Lf.tileLayer(
        'https://mt{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        { attribution: '© Google', maxZoom: 28, maxNativeZoom: 21, subdomains: ['0','1','2','3'] },
      ),
      label: Lf.tileLayer(
        'https://mt{s}.google.com/vt/lyrs=h&x={x}&y={y}&z={z}',
        { attribution: '© Google', maxZoom: 28, maxNativeZoom: 21, subdomains: ['0','1','2','3'], opacity: 0.9 },
      ),
    };
  }
  return {
    base: Lf.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '© OpenStreetMap contributors', maxZoom: 28, maxNativeZoom: 19 },
    ),
    label: null,
  };
}
