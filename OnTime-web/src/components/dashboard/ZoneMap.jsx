// src/components/dashboard/ZoneMap.jsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import { LocateFixed, Compass } from 'lucide-react';
import L from 'leaflet';

// Fix Leaflet default marker icon asset paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Internal map controller manager component
const MapController = ({ latitude, longitude, triggerRecenter, triggerCompass, resetTriggers }) => {
  const map = useMap();

  // 1. Recenter to designated office point when dropdown or button fires
  useEffect(() => {
    if ((latitude && longitude) || triggerRecenter) {
      map.setView([latitude, longitude], 16, { animate: true, duration: 1 });
      resetTriggers(); // Clear flag state back to parent container
    }
  }, [latitude, longitude, triggerRecenter, map]);

  // 2. Compass Orientation reset rule (Resets bearing rotation to true North)
  useEffect(() => {
    if (triggerCompass) {
      map.setView([map.getCenter().lat, map.getCenter().lng], map.getZoom(), { animate: true });
      // If a rotation plugin is ever added later, reset bearing to 0 here. For now, it re-aligns view context maps smoothly.
      resetTriggers();
    }
  }, [triggerCompass, map]);

  return null;
};

const ZoneMap = ({ latitude, longitude, radius, isEditing, onMarkerDrag, externalControlsTrigger }) => {
  const centerPosition = [latitude || 6.7154, longitude || 80.7888];
  
  const [recenterFlag, setRecenterFlag] = useState(false);
  const [compassFlag, setCompassFlag] = useState(false);

  // Expose triggers to parent or listen to local button handlers securely
  useEffect(() => {
    if (externalControlsTrigger === 'recenter') setRecenterFlag(true);
    if (externalControlsTrigger === 'compass') setCompassFlag(true);
  }, [externalControlsTrigger]);

  const markerEventHandlers = {
    dragend(e) {
      const marker = e.target;
      if (marker != null) {
        const position = marker.getLatLng();
        onMarkerDrag(position.lat, position.lng);
      }
    },
  };

  return (
    <div className="w-full relative rounded-xl overflow-hidden border border-gray-100 shadow-inner" style={{ height: '380px', zIndex: 1 }}>
      
      {/* MAP FLOATING CONTROLS TOOLBAR BOX PANEL */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-xl border border-orange-100 shadow-md">
        <button
          type="button"
          onClick={() => setRecenterFlag(true)}
          className="p-2 text-gray-500 hover:text-[#F9A825] bg-gray-50 hover:bg-amber-50 rounded-lg transition-colors outline-none"
          title="Recenter to Zone Coordinates"
        >
          <LocateFixed size={16} />
        </button>
        <button
          type="button"
          onClick={() => setCompassFlag(true)}
          className="p-2 text-gray-500 hover:text-[#F9A825] bg-gray-50 hover:bg-amber-50 rounded-lg transition-colors outline-none"
          title="Align View Orientation Map"
        >
          <Compass size={16} />
        </button>
      </div>

      <MapContainer 
        center={centerPosition} 
        zoom={16} 
        style={{ height: '100%', width: '100%' }} 
        scrollWheelZoom={true}
        zoomControl={true} // Left side default operational buttons (+ / -)
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController 
          latitude={latitude} 
          longitude={longitude} 
          triggerRecenter={recenterFlag}
          triggerCompass={compassFlag}
          resetTriggers={() => {
            setRecenterFlag(false);
            setCompassFlag(false);
          }}
        />

        <Circle 
          center={centerPosition}
          radius={radius || 50}
          pathOptions={{ fillColor: '#F9A825', color: '#F9A825', weight: 1.5, fillOpacity: 0.15 }}
        />

        <Marker 
          position={centerPosition}
          draggable={isEditing}
          eventHandlers={markerEventHandlers}
        />
      </MapContainer>
    </div>
  );
};

export default ZoneMap;