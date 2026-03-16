import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface AsaaseMapProps {
  groundPos: [number, number];
  aquaPos: [number, number];
  groundHeatmap: any;
  aquaHeatmap: any;
  onMapClick?: (lat: number, lon: number) => void;
  waypoints?: {lat: number, lon: number}[];
}

const MapEvents = ({ onClick }: { onClick?: (lat: number, lon: number) => void }) => {
  useMapEvents({
    click(e) {
      onClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

const AsaaseMap: React.FC<AsaaseMapProps> = ({ groundPos, aquaPos, groundHeatmap, aquaHeatmap, onMapClick, waypoints }) => {
  // Center Ghana: 6.5, -1.5
  const center: [number, number] = [6.5, -1.5];

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-white/5">
      <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapEvents onClick={onMapClick} />

        {/* Robot Markers */}
        <Marker position={groundPos}>
          <Popup>ASAASE GROUND: {groundPos[0]}, {groundPos[1]}</Popup>
        </Marker>
        <Marker position={aquaPos}>
          <Popup>ASAASE AQUA: {aquaPos[0]}, {aquaPos[1]}</Popup>
        </Marker>

        {/* Heatmaps */}
        {groundHeatmap?.features?.map((f: any, i: number) => (
          <Circle
            key={`gh-${i}`}
            center={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
            radius={2000}
            pathOptions={{
              color: f.properties.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
              fillColor: f.properties.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
              fillOpacity: f.properties.severity === 'CRITICAL' ? 0.7 : 0.5
            }}
          >
            <Popup>
              <div className="text-xs">
                <div className="font-bold">Soil Contamination: {f.properties.severity}</div>
                <div>Confidence: {f.properties.confidence_score}%</div>
                <div>Action: {f.properties.dispenser_action}</div>
              </div>
            </Popup>
          </Circle>
        ))}

        {aquaHeatmap?.features?.map((f: any, i: number) => (
          <Circle
            key={`ah-${i}`}
            center={[f.geometry.coordinates[1], f.geometry.coordinates[0]]}
            radius={2000}
            pathOptions={{
              color: f.properties.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
              fillColor: f.properties.severity === 'CRITICAL' ? '#ef4444' : '#f59e0b',
              fillOpacity: f.properties.severity === 'CRITICAL' ? 0.7 : 0.5
            }}
          >
            <Popup>
              <div className="text-xs">
                <div className="font-bold">Water Quality: {f.properties.severity}</div>
                <div>Turbidity: {f.properties.turbidity_ntu} NTU</div>
                <div>pH: {f.properties.ph_value}</div>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Waypoints Polyline */}
        {waypoints && waypoints.length > 0 && (
          <Polyline 
            positions={waypoints.map(w => [w.lat, w.lon])} 
            pathOptions={{ color: '#10b981', dashArray: '5, 10' }} 
          />
        )}
      </MapContainer>
    </div>
  );
};

export default AsaaseMap;
