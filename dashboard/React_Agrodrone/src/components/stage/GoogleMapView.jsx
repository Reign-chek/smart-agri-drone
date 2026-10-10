import { GoogleMap, OverlayView, useJsApiLoader } from '@react-google-maps/api';
import { Plane } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const googleMapsApiKey = 'AIzaSyBzrKZ1V-ijoWanKxxw6ZpUY9p0qhCCVrM';

export default function GoogleMapView({
  boundary,
  boundaryLocked,
  drawing,
  activePath,
  mapCenter,
  mapZoom,
  locationStatus,
  locationMessage,
  onMapClick,
  onMapCenterChange,
  onMapZoomChange,
  telemetry,
  active,
  pip = false,
}) {
  const mapInstance = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey,
    version: 'weekly',
  });

  const mapContainerStyle = { width: '100%', height: '100%' };

  useEffect(() => {
    const map = mapInstance.current;
    const mapsApi = window.google?.maps;
    if (!mapReady || !map || !mapsApi) return undefined;

    const overlays = [];
    if (boundary.length >= 3) {
      overlays.push(new mapsApi.Polygon({
        map,
        paths: boundary,
        fillColor: '#22c55e',
        fillOpacity: boundaryLocked ? 0.25 : 0.12,
        strokeColor: boundaryLocked ? '#6ee7b7' : '#facc15',
        strokeWeight: 2,
        clickable: false,
      }));
    }

    const vertexColor = boundaryLocked ? '#34d399' : drawing ? '#facc15' : '#22d3ee';
    boundary.forEach((vertex, index) => {
      overlays.push(new mapsApi.Marker({
        map,
        position: vertex,
        title: `Boundary vertex ${index + 1}`,
        clickable: false,
        icon: {
          path: mapsApi.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: vertexColor,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      }));
    });

    activePath.forEach((segment, index) => {
      overlays.push(new mapsApi.Polyline({
        map,
        path: segment,
        strokeColor: index % 2 === 0 ? '#38bdf8' : '#86efac',
        strokeOpacity: 0.9,
        strokeWeight: 2,
        icons: [{ icon: { path: 'M 0,-1 L 0,1', scale: 4 }, offset: '0', repeat: '10px' }],
      }));
    });

    return () => overlays.forEach((overlay) => overlay.setMap(null));
  }, [activePath, boundary, boundaryLocked, drawing, mapReady]);

  if (!mapCenter) {
    const message = locationStatus === 'locating'
      ? 'Acquiring device location…'
      : locationMessage || 'Device location is required to show the map.';
    return (
      <div className={`map-shell ${active ? 'active' : ''} ${pip ? 'pip' : ''} map-location-waiting`} role="status">
        {message}
      </div>
    );
  }

  if (!isLoaded) {
    return <div className={`map-shell ${active ? 'active' : ''} ${pip ? 'pip' : ''}`}>Loading...</div>;
  }

  return (
    <div className={`map-shell ${active ? 'active' : ''} ${pip ? 'pip' : ''}`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        onLoad={(map) => { mapInstance.current = map; setMapReady(true); }}
        onUnmount={() => { mapInstance.current = null; setMapReady(false); }}
        onDragEnd={() => {
          const center = mapInstance.current?.getCenter();
          if (center) onMapCenterChange({ lat: center.lat(), lng: center.lng() });
        }}
        onZoomChanged={() => {
          const zoom = mapInstance.current?.getZoom();
          if (zoom !== undefined) onMapZoomChange(zoom);
        }}
        zoom={mapZoom}
        options={{
          mapTypeId: 'hybrid',
          gestureHandling: 'greedy',
          draggable: true,
          scrollwheel: true,
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          zoomControl: true,
          minZoom: 10,
          maxZoom: 20,
        }}
        onClick={onMapClick}
      >
        <OverlayView position={{ lat: telemetry.lat, lng: telemetry.lng }} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
          <div className="drone-marker" style={{ transform: `rotate(${telemetry.heading}deg)` }}>
            <Plane size={18} />
          </div>
        </OverlayView>
      </GoogleMap>
    </div>
  );
}
