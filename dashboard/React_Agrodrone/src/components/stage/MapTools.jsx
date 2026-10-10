export default function MapTools({
  drawing,
  boundaryLocked,
  vertexCount,
  locationStatus,
  locationMessage,
  canEditBoundary,
  onBoundaryToggle,
  onUndoPoint,
  onClearBoundary,
  onMyLocation,
  onViewToggle,
  onPipToggle,
  onRecenterMap,
  activeView,
  pipEnabled,
}) {
  return (
    <div className="stage-actions glass" aria-label="Map controls">
      <button
        type="button"
        className={drawing ? 'active' : ''}
        onClick={onBoundaryToggle}
        disabled={!canEditBoundary}
      >
        {drawing ? 'Finish Boundary' : boundaryLocked ? 'Redraw Boundary' : 'Draw Field Boundary'}
      </button>
      <button type="button" onClick={onUndoPoint} disabled={!canEditBoundary || !drawing || vertexCount === 0}>
        Undo Point
      </button>
      <button type="button" onClick={onClearBoundary} disabled={!canEditBoundary || vertexCount === 0}>
        Clear Field
      </button>
      <button
        type="button"
        onClick={onMyLocation}
        aria-busy={locationStatus === 'locating'}
        disabled={locationStatus === 'locating'}
      >
        {locationStatus === 'locating' ? 'Locating…' : 'My Location'}
      </button>
      <button type="button" onClick={onViewToggle}>
        {activeView === 'map' ? 'Show FPV' : 'Show Map'}
      </button>
      <button type="button" className={pipEnabled ? 'active' : ''} onClick={onPipToggle}>
        PIP {pipEnabled ? 'On' : 'Off'}
      </button>
      <button type="button" onClick={onRecenterMap}>
        Recenter Map
      </button>
      {locationMessage && (
        <span className="map-location-message" role={locationStatus === 'error' ? 'alert' : 'status'}>
          {locationMessage}
        </span>
      )}
      {!boundaryLocked && !drawing && vertexCount === 0 && (
        <span className="map-location-message" role="status">
          Draw and finish a boundary to plan an auto mission.
        </span>
      )}
    </div>
  );
}
