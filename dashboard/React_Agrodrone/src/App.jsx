import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import NavigationRail from './components/layout/NavigationRail';
import Topbar from './components/layout/Topbar';
import MissionDeck from './components/layout/MissionDeck';
import OperationsPanel from './components/ops/OperationsPanel';
import DrawerPanel from './components/drawers/DrawerPanel';
import RemoteControlView from './components/layout/RemoteControlView';
import GoogleMapView from './components/stage/GoogleMapView';
import MapTools from './components/stage/MapTools';
import MapErrorBoundary from './components/stage/MapErrorBoundary';
import FpvHudView from './components/stage/FpvHudView';
import { useRos2Bridge } from './hooks/useRos2Bridge';
import useTheme from './hooks/useTheme';
import useGoogleMapPlanner from './hooks/useGoogleMapPlanner';
import useTelemetryStore from './store/useTelemetryStore';
import { geoArea, inside, pathLength, updateFumigation, validBoundary, generateLawnmower } from './utils/geo';
import { createRosFieldPlan } from './utils/rosMissionPlan';

function App() {
  const {
    theme,
    telemetry,
    setTheme,
    tickTelemetry,
    mission,
    emergencyStopped,
    startMission,
    pauseMission,
    returnToHome,
    emergencyLand,
    disarm,
    setCameraPitch,
    setMission,
    setTelemetryControl,
    setSetting,
    setManualOverride,
    togglePump,
    setManualAltitude,
    setManualYaw,
    setGeofenceBypass,
    logEvent,
    events,
    geofenceBypass,
    routeMode,
    calibration,
  } = useTelemetryStore();
  const { connected, publishFieldPlan } = useRos2Bridge();
  const {
    boundary,
    drawing,
    setDrawing,
    boundaryLocked,
    setBoundaryLocked,
    addPoint,
    undoPoint,
    clear,
  } = useGoogleMapPlanner();
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(17);
  const [locationFeedback, setLocationFeedback] = useState({ status: 'idle', message: '' });
  const initialLocationRequested = useRef(false);
  const [activeView, setActiveView] = useState('map');
  const [pipEnabled, setPipEnabled] = useState(false);
  const [selectedDrawer, setSelectedDrawer] = useState('mission');
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [emergencyNoticeOpen, setEmergencyNoticeOpen] = useState(false);

  useTheme(theme);

  const requestDeviceLocation = useCallback((activateMap = true) => {
    if (activateMap) setActiveView('map');

    if (!window.isSecureContext) {
      const message = 'Device location requires a secure connection. Open this app on localhost or serve it over HTTPS.';
      setLocationFeedback({ status: 'error', message });
      logEvent(message, 'warning');
      return;
    }

    if (!navigator.geolocation) {
      const message = 'Device geolocation is not supported by this browser.';
      setLocationFeedback({ status: 'error', message });
      logEvent(message, 'warning');
      return;
    }

    setLocationFeedback({ status: 'locating', message: 'Getting device location…' });
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const center = { lat: coords.latitude, lng: coords.longitude };
        setMapCenter(center);
        setMapZoom(18);
        setLocationFeedback({ status: 'success', message: 'Device location acquired; map centered.' });
        logEvent('Map centered on device location', 'success');
      },
      (error) => {
        const message = error.code === 1
          ? 'Location permission denied. Allow location access in browser settings.'
          : error.code === 2
            ? 'Device location is unavailable.'
            : error.code === 3
              ? 'Device location request timed out. Try again.'
              : 'Could not get device location.';
        setLocationFeedback({ status: 'error', message });
        logEvent(message, 'warning');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [logEvent]);

  useEffect(() => {
    if (initialLocationRequested.current) return;
    initialLocationRequested.current = true;
    requestDeviceLocation(false);
  }, [requestDeviceLocation]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      tickTelemetry();
    }, 1500);

    return () => clearInterval(intervalId);
  }, [tickTelemetry]);

  useEffect(() => {
    const onKeyDown = (event) => {
      const targetIsInput = event.target instanceof HTMLElement
        && event.target.closest('input, textarea, select, [contenteditable="true"]');

      if (event.key.toLowerCase() === 'm' && !targetIsInput) {
        setManualOverride(!useTelemetryStore.getState().telemetry.manualOverride);
      }

      if (event.key === 'Escape') {
        if (useTelemetryStore.getState().telemetry.manualOverride) {
          setManualOverride(false);
          return;
        }
        setDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setManualOverride]);

  const driftRisk = useMemo(() => {
    const risk = updateFumigation({ windSpeed: telemetry.windSpeed }).driftRisk;
    if (risk === 'LOW') return { label: 'Low', color: 'green' };
    if (risk === 'MODERATE') return { label: 'Moderate', color: 'amber' };
    return { label: 'High warning', color: 'red' };
  }, [telemetry.windSpeed]);

  const sprayRate = telemetry.flowRate;

  const calculatedArea = useMemo(
    () => boundaryLocked ? geoArea(boundary) : 0,
    [boundary, boundaryLocked],
  );
  const activePath = useMemo(
    () => !boundaryLocked
      ? []
      : routeMode === 'Perimeter'
        ? [boundary]
        : generateLawnmower(boundary, mission.swath, mission.margin),
    [boundary, boundaryLocked, mission.margin, mission.swath, routeMode],
  );
  const routeDistanceMeters = useMemo(() => pathLength(activePath), [activePath]);
  const fluidRequired = calculatedArea * mission.dosage;
  const geofenceStatus = !boundaryLocked
    ? drawing ? 'Boundary not locked' : 'No locked boundary'
    : inside({ lat: telemetry.lat, lng: telemetry.lng }, boundary) || geofenceBypass
      ? geofenceBypass ? 'Bypass enabled' : 'Inside field'
      : 'Outside boundary';

  useEffect(() => {
    setMission({ totalArea: calculatedArea });
  }, [calculatedArea, setMission]);

  useEffect(() => {
    if (!boundaryLocked || !validBoundary(boundary)) return;
    const plan = createRosFieldPlan({
      boundary,
      activePath,
      mission: {
        swath: mission.swath,
        margin: mission.margin,
        dosage: mission.dosage,
      },
      routeMode,
    });
    const published = publishFieldPlan(plan);
    logEvent(
      published ? 'Validated field plan published to ROS' : 'Field plan queued until ROS bridge connects',
      published ? 'success' : 'warning',
    );
  }, [
    activePath,
    boundary,
    boundaryLocked,
    logEvent,
    mission.dosage,
    mission.margin,
    mission.swath,
    publishFieldPlan,
    routeMode,
  ]);

  const handleMapClick = (event) => {
    if (!drawing || boundaryLocked) return;

    const nextPoint = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };

    addPoint(nextPoint);
    logEvent(`Boundary point added (${boundary.length + 1} vertices)`);
  };

  const handleStartMission = () => {
    if (!boundaryLocked || !validBoundary(boundary) || routeDistanceMeters <= 0) {
      logEvent('Mission start blocked · draw and finish a valid boundary with a generated route', 'danger');
      return;
    }
    startMission();
  };

  const handleMapCenterChange = (center) => {
    setMapCenter((current) => {
      if (Math.abs(current.lat - center.lat) < 0.000001 && Math.abs(current.lng - center.lng) < 0.000001) {
        return current;
      }
      return center;
    });
  };

  const handleMapZoomChange = (zoom) => {
    setMapZoom((current) => (current === zoom ? current : zoom));
  };

  const handleNavSelect = (key) => {
    if (selectedDrawer === key && drawerOpen) {
      setDrawerOpen(false);
      return;
    }

    setSelectedDrawer(key);
    setDrawerOpen(true);
  };

  const handleBoundaryToggle = () => {
    if (mission.status === 'Auto-spraying' || mission.status === 'Returning to home') {
      logEvent('Boundary editing blocked · mission is active', 'warning');
      return;
    }
    if (!drawing) {
      clear();
      setDrawing(true);
      setMission({ totalArea: 0, covered: 0, progress: 0, routeProgress: 0 });
      logEvent('Boundary drawing started');
      return;
    }
    if (!validBoundary(boundary)) {
      logEvent('Boundary invalid · add 3+ points and avoid crossing edges', 'warning');
      return;
    }
    const lawnmowerPath = generateLawnmower(boundary, mission.swath, mission.margin);
    const generatedPath = routeMode === 'Perimeter' ? [boundary] : lawnmowerPath;
    setBoundaryLocked(true);
    setDrawing(false);
    logEvent(`Boundary validated · ${geoArea(boundary).toFixed(2)} ha`, 'success');
    if (pathLength(generatedPath) <= 0) {
      logEvent('Route generation failed · reduce headland margin or adjust swath width', 'warning');
    }
  };

  const handleClearField = () => {
    clear();
    setDrawing(false);
    setBoundaryLocked(false);
    setMission({
      totalArea: 0,
      covered: 0,
      progress: 0,
      routeProgress: 0,
      ...(mission.status === 'Paused' ? { status: 'Ready' } : {}),
    });
    const clearPlan = createRosFieldPlan({
      boundary: [],
      activePath: [],
      mission,
      routeMode,
      action: 'clear',
    });
    const published = publishFieldPlan(clearPlan);
    logEvent(
      published
        ? 'Field cleared · calculations reset and clear sent to ROS'
        : 'Field cleared · calculations reset; clear queued until ROS bridge connects',
      published ? 'info' : 'warning',
    );
  };

  useEffect(() => {
    if (
      mission.status === 'Auto-spraying' &&
      !geofenceBypass &&
      boundaryLocked &&
      !inside({ lat: telemetry.lat, lng: telemetry.lng }, boundary)
    ) {
      pauseMission();
      logEvent('Geofence breach · spray paused', 'danger');
    }
  }, [boundary, boundaryLocked, geofenceBypass, logEvent, mission.status, pauseMission, telemetry.lat, telemetry.lng]);

  if (telemetry.manualOverride) {
    return (
      <RemoteControlView
        onClose={() => setManualOverride(false)}
        onStart={handleStartMission}
        onPause={pauseMission}
        onReturnToHome={returnToHome}
        onDisarm={() => {
          disarm();
          setEmergencyNoticeOpen(true);
        }}
        onEmergencyLand={emergencyLand}
        status={mission.status}
        emergencyStopped={emergencyStopped}
        telemetry={telemetry}
        driftRisk={driftRisk}
        geofenceBypass={geofenceBypass}
        onAltitudeChange={setManualAltitude}
        onYawChange={setManualYaw}
        onPitchChange={setCameraPitch}
        onPumpToggle={togglePump}
        onGeofenceToggle={() => setGeofenceBypass(!geofenceBypass)}
      />
    );
  }

  return (
    <div className="app-shell">
      <NavigationRail
        selectedDrawer={selectedDrawer}
        setSelectedDrawer={handleNavSelect}
        theme={theme}
        setTheme={setTheme}
        emergencyStopped={emergencyStopped}
        missionStatus={mission.status}
        onEmergencyStop={() => handleNavSelect('kill')}
        onRemoteControl={() => setManualOverride(true)}
      />

      <DrawerPanel
        open={drawerOpen}
        drawerKey={selectedDrawer}
        telemetry={telemetry}
        mission={mission}
        connected={connected}
        calculatedArea={calculatedArea}
        routeLength={routeDistanceMeters}
        fluidRequired={fluidRequired}
        boundary={boundary}
        boundaryLocked={boundaryLocked}
        geofenceStatus={geofenceStatus}
        events={events}
        theme={theme}
        routeMode={routeMode}
        calibration={calibration}
        onMissionChange={setMission}
        onTelemetryControl={(key, value) => key === 'pump' ? togglePump() : setTelemetryControl(key, value)}
        onSettingChange={setSetting}
        onThemeChange={setTheme}
        onDisarm={() => {
          disarm();
          setEmergencyNoticeOpen(true);
        }}
      />

      <main className="workspace">
        <Topbar
          telemetry={telemetry}
          connected={connected}
          emergencyStopped={emergencyStopped}
          missionStatus={mission.status}
        />

        <section className="dashboard-row">
          <div className="stage glass">
            <MapErrorBoundary onShowFpv={() => setActiveView('fpv')}>
              <GoogleMapView
                boundary={boundary}
                boundaryLocked={boundaryLocked}
                drawing={drawing}
                activePath={activePath}
                mapCenter={mapCenter}
                mapZoom={mapZoom}
                locationStatus={locationFeedback.status}
                locationMessage={locationFeedback.message}
                active={activeView === 'map'}
                telemetry={telemetry}
                onMapClick={handleMapClick}
                onMapCenterChange={handleMapCenterChange}
                onMapZoomChange={handleMapZoomChange}
                pip={pipEnabled && activeView !== 'map'}
              />
            </MapErrorBoundary>

            <FpvHudView telemetry={telemetry} active={activeView === 'fpv'} pip={pipEnabled && activeView !== 'fpv'} />

            <MapTools
              drawing={drawing}
              boundaryLocked={boundaryLocked}
              vertexCount={boundary.length}
              locationStatus={locationFeedback.status}
              locationMessage={locationFeedback.message}
              canEditBoundary={mission.status !== 'Auto-spraying' && mission.status !== 'Returning to home'}
              onBoundaryToggle={handleBoundaryToggle}
              onUndoPoint={() => { undoPoint(); logEvent('Last boundary point removed'); }}
              onClearBoundary={handleClearField}
              onMyLocation={() => requestDeviceLocation()}
              onViewToggle={() => setActiveView((view) => (view === 'map' ? 'fpv' : 'map'))}
              onPipToggle={() => setPipEnabled((enabled) => !enabled)}
              onRecenterMap={() => requestDeviceLocation()}
              activeView={activeView}
              pipEnabled={pipEnabled}
            />
          </div>

          <OperationsPanel
            telemetry={telemetry}
            driftRisk={driftRisk}
            sprayRate={sprayRate}
            fieldArea={calculatedArea}
            fluidRequired={fluidRequired}
            emergencyStopped={emergencyStopped}
            mission={mission}
          />
        </section>

        <MissionDeck
          progress={mission.progress}
          coverage={mission.covered}
          totalArea={mission.totalArea}
          events={events}
          status={mission.status}
          emergencyStopped={emergencyStopped}
          onStart={handleStartMission}
          onPause={pauseMission}
          onReturnToHome={returnToHome}
          onEmergencyLand={emergencyLand}
        />
      </main>

      {emergencyNoticeOpen && (
        <div
          className="modal-backdrop"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="emergency-stop-title"
        >
          <div className="modal-panel glass emergency-stop-notice">
            <div className="modal-header">
              <div>
                <span className="eyebrow">Emergency control</span>
                <strong id="emergency-stop-title">Simulated motors disarmed</strong>
              </div>
            </div>
            <p>
              Simulated speed, altitude, and spray flow have been stopped. This prototype does not send
              commands to a connected drone.
            </p>
            <button
              type="button"
              className="close-btn"
              onClick={() => setEmergencyNoticeOpen(false)}
              autoFocus
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
