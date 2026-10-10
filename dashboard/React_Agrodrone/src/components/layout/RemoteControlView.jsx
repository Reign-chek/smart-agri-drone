import GimbalJoystick from '../ops/GimbalJoystick';
import FpvHudView from '../stage/FpvHudView';

export default function RemoteControlView({
  onClose,
  onStart,
  onPause,
  onReturnToHome,
  onDisarm,
  onEmergencyLand,
  status,
  emergencyStopped,
  telemetry,
  driftRisk,
  geofenceBypass,
  onAltitudeChange,
  onYawChange,
  onPitchChange,
  onPumpToggle,
  onGeofenceToggle,
}) {
  return (
    <main className="remote-control-screen" aria-label="Manual remote control">
      <header className="remote-control-header">
        <div>
          <span className="eyebrow">AgroDrone // Remote control</span>
          <h1>Manual Override</h1>
        </div>
        <div className="remote-header-actions">
          <span className={`status-pill ${emergencyStopped ? 'offline' : 'accent'}`}>
            {emergencyStopped ? 'EMERGENCY STOP' : status}
          </span>
          <button type="button" className="close-btn remote-exit-button" onClick={onClose} aria-label="Exit remote control">
            <span className="remote-exit-label">Exit remote control</span>
            <span className="remote-exit-compact">Exit</span>
          </button>
        </div>
      </header>

      <section className="remote-flight-stage" aria-label="First-person flight view">
        <FpvHudView telemetry={telemetry} active embedded />
        <div className="remote-fpv-telemetry" aria-label="Live FPV telemetry">
          <span className="remote-feed-label">SIMULATED FPV</span>
          <span className="remote-fpv-chip"><span>ALT</span><strong>{telemetry.altitude.toFixed(1)} m</strong></span>
          <span className="remote-fpv-chip"><span>SPD</span><strong>{telemetry.speed.toFixed(1)} m/s</strong></span>
          <span className="remote-fpv-chip"><span>HDG</span><strong>{telemetry.heading.toFixed(0)}°</strong></span>
          <span className="remote-fpv-chip"><span>PITCH</span><strong>{telemetry.cameraPitch.toFixed(0)}°</strong></span>
          <span className="remote-fpv-chip"><span>BAT</span><strong>{telemetry.batteryPct.toFixed(0)}%</strong></span>
          <span className="remote-fpv-chip"><span>FLOW</span><strong>{telemetry.flowRate.toFixed(1)} L/min</strong></span>
          <span className="remote-fpv-chip"><span>WIND</span><strong>{telemetry.windSpeed.toFixed(1)} km/h</strong></span>
          <span className="remote-fpv-chip remote-fpv-gps"><span>GPS</span><strong>{telemetry.lat.toFixed(5)}, {telemetry.lng.toFixed(5)}</strong></span>
          <span className={`remote-fpv-chip risk-${driftRisk.color}`}><span>DRIFT</span><strong>{driftRisk.label}</strong></span>
        </div>
        <div className="remote-controller-layout">
          <section className="controller-card controller-stick" aria-label="Heading and camera controls">
            <h2>Heading &amp; camera</h2>
            <GimbalJoystick
              heading={telemetry.heading}
              pitch={telemetry.cameraPitch}
              onHeadingChange={onYawChange}
              onPitchChange={onPitchChange}
            />
          </section>
          <section className="controller-card controller-adjustments" aria-label="Manual flight and spray controls">
            <label className="drawer-control">
              <span>Altitude <strong>{telemetry.altitude.toFixed(1)} m</strong></span>
              <input type="range" min="1" max="8" step="0.1" value={Math.max(1, Math.min(8, telemetry.altitude))} onChange={(event) => onAltitudeChange(Number(event.target.value))} />
            </label>
            <label className="drawer-control">
              <span>Yaw <strong>{telemetry.heading.toFixed(0)}°</strong></span>
              <input type="range" min="0" max="360" step="1" value={telemetry.heading} onChange={(event) => onYawChange(Number(event.target.value))} />
            </label>
            <div className="controller-utility-actions">
              <button
                type="button"
                className={telemetry.pump ? 'state-on' : 'state-off'}
                aria-pressed={telemetry.pump}
                onClick={onPumpToggle}
                disabled={emergencyStopped || status === 'Landed' || status === 'Disarmed'}
              >
                Pump {telemetry.pump ? 'OFF' : 'ON'}
              </button>
              <button
                type="button"
                className={geofenceBypass ? 'state-on' : 'state-off'}
                aria-pressed={geofenceBypass}
                onClick={onGeofenceToggle}
              >
                Geofence {geofenceBypass ? 'ON' : 'OFF'}
              </button>
            </div>
          </section>
        </div>
        <div className="remote-flight-actions">
          <button type="button" onClick={onStart} disabled={emergencyStopped || status === 'Landed' || status === 'Disarmed'}>Start / Resume</button>
          <button type="button" onClick={onPause} disabled={emergencyStopped || status !== 'Auto-spraying'}>Pause spray</button>
          <button type="button" onClick={onReturnToHome} disabled={emergencyStopped || status === 'Returning to home' || status === 'Landed' || status === 'Disarmed'}>Return to launch</button>
          <button type="button" className="danger-action" onClick={onEmergencyLand} disabled={status === 'Landed' || status === 'Disarmed'}>Emergency land</button>
          <button type="button" className="danger-action" onClick={onDisarm} disabled={status === 'Landed' || status === 'Disarmed'}>Disarm</button>
        </div>
      </section>
    </main>
  );
}
