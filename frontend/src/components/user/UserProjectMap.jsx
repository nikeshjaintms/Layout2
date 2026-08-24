'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dynamic from 'next/dynamic';
import { fetchPublicProjectById } from '@/redux/slices/projectsSlice';
import { fetchPublicBoundaries, fetchPublicAppearanceSettings } from '@/redux/slices/appearanceSlice';
import { fetchPublicConversions } from '@/redux/slices/conversionsSlice';
import { fetchPublicPlots } from '@/redux/slices/plotsSlice';
import { fetchPublicPlotStatuses } from '@/redux/slices/plotStatusesSlice';
import UserProjectLoading from './UserProjectLoading';
import UserViewerToolbar from './UserViewerToolbar';
import Link from 'next/link';

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), { ssr: false });

export default function UserProjectMap({ projectId }) {
  const dispatch = useDispatch();
  
  const project = useSelector(state => state.projects.selectedProject);
  const boundaries = useSelector(state => state.appearance.boundaries);
  const conversions = useSelector(state => state.conversions.items);
  const plots = useSelector(state => state.plots.items);
  const statuses = useSelector(state => state.plotStatuses.items);
  const appearanceSettings = useSelector(state => state.appearance.settings);
  
  const loading = useSelector(state => 
    state.projects.loading || 
    state.conversions.loading || 
    state.plots.loading
  );
  const error = useSelector(state => state.projects.error);

  const [activeConversion, setActiveConversion] = useState(null);
  const [parsedBoundaries, setParsedBoundaries] = useState([]);
  
  const mapRef = useRef(null);
  const [currentZoom, setCurrentZoom] = useState(1);
  const [showPlotStatus, setShowPlotStatus] = useState(false);
  const [selectedPlotId, setSelectedPlotId] = useState(null);

  useEffect(() => {
    if (projectId) {
      dispatch(fetchPublicProjectById(projectId));
      dispatch(fetchPublicBoundaries(projectId));
      dispatch(fetchPublicConversions(projectId));
      dispatch(fetchPublicPlots({ projectId, options: { pagination: false } }));
      dispatch(fetchPublicPlotStatuses({ projectId, params: { pagination: false } }));
      dispatch(fetchPublicAppearanceSettings(projectId));
    }
  }, [projectId, dispatch]);

  useEffect(() => {
    if (boundaries && boundaries.length > 0) {
      const parsed = boundaries.map(b => {
        let geo = b.geoJson;
        if (typeof geo === 'string') {
          try { geo = JSON.parse(geo); } catch (e) {}
        }
        return { ...b, geometry: geo };
      });
      setParsedBoundaries(parsed);
    } else {
      setParsedBoundaries([]);
    }
  }, [boundaries]);

  useEffect(() => {
    if (conversions && conversions.length > 0) {
      const active = conversions.find(c => c.isActive);
      setActiveConversion(active || null);
    } else {
      setActiveConversion(null);
    }
  }, [conversions]);

  const zoomIn = () => {
    if (mapRef.current?.map) {
      mapRef.current.map.zoomIn();
    }
  };

  const zoomOut = () => {
    if (mapRef.current?.map) {
      mapRef.current.map.zoomOut();
    }
  };

  const centerView = () => {
    if (mapRef.current?.fitToBounds) {
      mapRef.current.fitToBounds();
    }
  };

  const resetTransform = () => {
    if (mapRef.current?.fitToBounds) {
      mapRef.current.fitToBounds();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <UserProjectLoading />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-slate-200 flex flex-col items-center justify-center p-8">
        <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
        <p className="text-slate-400 mb-8">{error || "The project you're looking for doesn't exist or is unavailable."}</p>
        <Link href="/projects" className="px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-colors">
          Back to Projects
        </Link>
      </div>
    );
  }

  const layouts = activeConversion ? [activeConversion] : [];

  return (
    <div className="h-screen flex flex-col bg-[#0B0B0B] overflow-hidden relative">
      <UserViewerToolbar 
        project={project} 
        layoutName={activeConversion?.originalFileName} 
        zoomIn={zoomIn} 
        zoomOut={zoomOut} 
        resetTransform={resetTransform} 
        centerView={centerView}
        currentZoom={currentZoom}
        isMapView={true}
        showPlotStatus={showPlotStatus}
        onTogglePlotStatus={() => setShowPlotStatus(!showPlotStatus)}
      />

        <div className="flex-1 w-full h-full">
        {parsedBoundaries.length > 0 ? (
          <LeafletMap
            ref={mapRef}
            mapType="hybrid"
            drawMode={null} 
            drawingBoundary={false}
            boundaries={parsedBoundaries}
            activeBoundaryId={null}
            initialBounds={parsedBoundaries[0]?.latMin ? [[parsedBoundaries[0].latMin, parsedBoundaries[0].lngMin], [parsedBoundaries[0].latMax, parsedBoundaries[0].lngMax]] : null}
            staticPreview={true}
            layouts={activeConversion ? [activeConversion] : []}
            plots={plots}
            statuses={statuses}
            showPlotStatus={showPlotStatus}
            projectConfig={project}
            selectedPlotId={selectedPlotId}
            onPlotSelect={setSelectedPlotId}
            appearanceSettings={appearanceSettings}
            enableZoomDimming={true}
            className="w-full h-full"
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-bold text-slate-200 mb-4">No Map Data Available</h2>
            <p className="text-slate-400 max-w-md text-center mb-8">
              This project does not have geographic boundaries set up yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
