'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { Search, Loader2, Navigation, Target } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet marker icons not loading correctly in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

function MapUpdater({ searchLocation, flyToLocation }) {
  const map = useMap();
  useEffect(() => {
    if (searchLocation) {
      map.flyTo([searchLocation.lat, searchLocation.lng], 14, { animate: true });
    }
  }, [searchLocation, map]);

  useEffect(() => {
    if (flyToLocation) {
      map.flyTo([flyToLocation.lat, flyToLocation.lng], 14, { animate: true });
    }
  }, [flyToLocation, map]);

  return null;
}

export default function LocationPickerMap({ position, setPosition, onLocationFound }) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searching, setSearching] = React.useState(false);
  const [searchLocation, setSearchLocation] = React.useState(null);
  const [flyToLocation, setFlyToLocation] = React.useState(null);
  const [mapType, setMapType] = React.useState('hybrid'); // 'hybrid' for satellite, 'roadmap' for standard
  const [defaultCenter, setDefaultCenter] = React.useState(position || { lat: 17.385044, lng: 78.486671 });
  const mapRef = React.useRef(null);

  // Fix for React 18 Strict Mode double-mount "Map container is being reused" error
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        const container = mapRef.current.getContainer ? mapRef.current.getContainer() : null;
        if (container) {
          container._leaflet_id = null;
        }
      }
    };
  }, []);

  useEffect(() => {
    if (!position && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setDefaultCenter(loc);
          setFlyToLocation(loc);
        },
        (err) => console.warn('Geolocation error:', err)
      );
    }
  }, [position]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const result = data[0];
        const newPos = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        setSearchLocation(newPos);
        setPosition(newPos);
        
        if (onLocationFound && result.address) {
          onLocationFound({
            place: searchQuery,
            city: result.address.city || result.address.town || result.address.village || result.address.county || '',
            state: result.address.state || '',
            address: result.display_name || ''
          });
        }
      }
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setSearching(false);
    }
  };

  const locateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setFlyToLocation(loc);
          setPosition(loc);
        },
        (err) => console.warn('Geolocation error:', err)
      );
    }
  };

  const recenterToMarker = () => {
    if (position) {
      // Trigger a map fly-to using the existing state
      setFlyToLocation({ ...position }); // Clone it so useEffect triggers even if same
    }
  };

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border border-gray-200 relative z-0">
      
      {/* Floating Search Bar */}
      <div className="absolute top-4 left-4 right-4 sm:right-auto sm:w-80 z-[1000] flex gap-2">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch(e);
            }
          }}
          placeholder="Search places..." 
          className="flex-1 bg-white/95 text-slate-800 placeholder-slate-500 border border-black/10 rounded-xl px-4 py-2.5 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-[#00c8ff]/50 backdrop-blur-md"
        />
        <button type="button" onClick={handleSearch} disabled={searching || !searchQuery.trim()} className="px-4 py-2.5 bg-[#ABD2FA] hover:bg-[#00a0cc] text-gray-900 rounded-xl transition-colors disabled:opacity-50 shadow-lg flex items-center justify-center">
          {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        </button>
      </div>

      {/* Re-center Button */}
      {position && (
        <div className="absolute bottom-20 right-4 z-[1000]">
          <button 
            type="button" 
            onClick={recenterToMarker}
            className="p-3 bg-[#ABD2FA] text-[#18181b] hover:bg-[#9bc2ea] hover:text-[#18181b] rounded-full shadow-lg transition-colors backdrop-blur-md border border-[#ABD2FA]"
            title="Re-center on project marker"
          >
            <Target size={20} />
          </button>
        </div>
      )}

      {/* Locate Me Button */}
      <div className="absolute bottom-6 right-4 z-[1000]">
        <button 
          type="button" 
          onClick={locateMe}
          className="p-3 bg-white/95 text-slate-800 hover:text-[#ABD2FA] rounded-full shadow-lg transition-colors backdrop-blur-md border border-black/10"
          title="Go to my location"
        >
          <Navigation size={20} />
        </button>
      </div>

      {/* Map Type Toggle */}
      <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur-md border border-black/10 rounded-lg shadow-lg overflow-hidden flex text-xs font-semibold pointer-events-auto">
        <button 
          type="button"
          onClick={() => setMapType('roadmap')}
          className={`px-3 py-2 transition-colors ${mapType === 'roadmap' ? 'bg-[#ABD2FA] text-gray-900' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Map
        </button>
        <button 
          type="button"
          onClick={() => setMapType('hybrid')}
          className={`px-3 py-2 transition-colors ${mapType === 'hybrid' ? 'bg-[#ABD2FA] text-gray-900' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Satellite
        </button>
      </div>

      <MapContainer 
        ref={mapRef}
        center={defaultCenter} 
        zoom={12} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          key={mapType}
          url={`https://mt1.google.com/vt/lyrs=${mapType === 'hybrid' ? 'y' : 'm'}&x={x}&y={y}&z={z}`}
        />
        <LocationMarker position={position} setPosition={setPosition} />
        <MapUpdater searchLocation={searchLocation} flyToLocation={flyToLocation} />
      </MapContainer>
      
      {/* Pure Google Maps Watermark */}
      <div className="absolute bottom-1 right-1 bg-white/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-black font-medium z-[1000] pointer-events-none">
        © Google Maps
      </div>
    </div>
  );
}
