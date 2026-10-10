function RangeInput({ label, value, min, max, step, onChange, unit = '' }) {
  return (
    <label className="drawer-control">
      <span>{label} <strong>{value}{unit}</strong></span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function NumberInput({ label, value, min, max, step, onChange, unit = '' }) {
  return (
    <label className="drawer-control">
      <span>{label}</span>
      <span className="drawer-input-wrap">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <span>{unit}</span>
      </span>
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="drawer-toggle">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    </label>
  );
}

export default function DrawerPanel({
  open,
  drawerKey,
  telemetry,
  mission,
  connected,
  calculatedArea,
  routeLength,
  fluidRequired,
  boundary,
  boundaryLocked,
  geofenceStatus,
  events,
  theme,
  routeMode,
  calibration,
  onMissionChange,
  onTelemetryControl,
  onSettingChange,
  onThemeChange,
  onDisarm,
}) {
  if (!open) return null;
  const titleByKey = {
    status: 'Flight Status',
    maps: 'Geospatial Planner',
    mission: 'Mission Events',
    spray: 'Spray System',
    settings: 'Settings',
    kill: 'Disarm Motors',
  };
  const title = titleByKey[drawerKey] ?? titleByKey.status;

  return (
    <aside className="drawer-panel glass" aria-live="polite">
      <div className="drawer-header">
        <span className="eyebrow">AgroDrone // {drawerKey}</span>
        <strong>{title}</strong>
      </div>

      {drawerKey === 'status' && (
        <>
          <p>Link and system health.</p>
          <ul>
            <li>ROS2 bridge: {connected ? 'Connected' : 'Offline'}{connected ? ' · 38 ms' : ''}</li>
            <li>GPS quality: {telemetry.gpsSatellites} satellites · HDOP {telemetry.hdop.toFixed(1)}</li>
            <li>Power: {telemetry.voltage.toFixed(1)} V · estimated endurance {(telemetry.batteryPct * 1.25).toFixed(0)} min</li>
          </ul>
        </>
      )}

      {drawerKey === 'maps' && (
        <>
          <p>Boundary and route planning readings.</p>
          <ul>
            <li>Field area: {calculatedArea.toFixed(2)} ha</li>
            <li>Route distance: {(routeLength / 1000).toFixed(2)} km</li>
            <li>Fluid required: {fluidRequired.toFixed(1)} L</li>
            <li>Vertices: {boundary.length}</li>
            <li>Boundary: {boundaryLocked ? 'Locked' : boundary.length >= 3 ? 'Ready to finish' : 'Needs 3+ points'}</li>
            <li>Geofence: {geofenceStatus}</li>
          </ul>
          <RangeInput label="Swath width" value={mission.swath} min={1} max={20} step={0.5} unit=" m" onChange={(value) => onMissionChange({ swath: value })} />
          <RangeInput label="Headland margin" value={mission.margin} min={0} max={20} step={0.5} unit=" m" onChange={(value) => onMissionChange({ margin: value })} />
          <label className="drawer-control">
            <span>Route mode</span>
            <select value={routeMode} onChange={(event) => onSettingChange('routeMode', event.target.value)}>
              <option>Lawnmower</option>
              <option>Perimeter</option>
            </select>
          </label>
        </>
      )}

      {drawerKey === 'mission' && (
        <>
          <p>Recent mission and system events.</p>
          <EventList events={events} />
        </>
      )}

      {drawerKey === 'spray' && (
        <>
          <p>Auto-spray configuration. Live readings are shown in the operations panel.</p>
          <NumberInput label="Dosage" value={mission.dosage} min={0} max={100} step={0.5} unit=" L/ha" onChange={(value) => onMissionChange({ dosage: value })} />
          <NumberInput label="Flow calibration" value={calibration} min={0.1} max={2} step={0.1} onChange={(value) => onSettingChange('calibration', value)} />
          <Toggle label="Pump output" checked={telemetry.pump} onChange={() => onTelemetryControl('pump', !telemetry.pump)} />
          <Toggle label="Tank agitator" checked={telemetry.agitator} onChange={(value) => onTelemetryControl('agitator', value)} />
          <Toggle label="Flush mode" checked={telemetry.flush} onChange={(value) => onTelemetryControl('flush', value)} />
          <Toggle label="Solenoid valves" checked={telemetry.solenoid} onChange={(value) => onTelemetryControl('solenoid', value)} />
          <Toggle label="Return on empty" checked={mission.roe} onChange={(value) => onMissionChange({ roe: value })} />
          <button type="button" className="drawer-action" onClick={() => onTelemetryControl('atomization', telemetry.atomization === 'Rotary' ? 'Solenoid PWM' : 'Rotary')}>
            Atomization: {telemetry.atomization} · Toggle
          </button>
        </>
      )}

      {drawerKey === 'settings' && (
        <>
          <p>Appearance and application options.</p>
          <Toggle label="Light theme" checked={theme === 'light'} onChange={(value) => onThemeChange(value ? 'light' : 'dark')} />
          <ul>
            <li>Build: AgroDrone HMI · Simulation</li>
          </ul>
        </>
      )}

      {drawerKey === 'kill' && (
        <>
          <p>Disarming immediately stops simulated motion and spray flow. No real aircraft command is sent.</p>
          <button type="button" className="drawer-action danger-action" onClick={onDisarm}>Disarm simulated motors</button>
        </>
      )}
    </aside>
  );
}

function EventList({ events }) {
  return (
    <section className="drawer-events" aria-label="Recent mission events">
      <span className="eyebrow">Recent events</span>
      <ul>
        {events.slice(0, 6).map((event, index) => (
          <li key={`${event.time}-${index}`}>
            <time dateTime={event.time}>{new Date(event.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</time>
            {' '}{event.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
