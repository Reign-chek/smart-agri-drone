import { BatteryCharging, Droplets, Gauge, Wind } from 'lucide-react';
import CompassHeading from './CompassHeading';

export default function OperationsPanel({
  telemetry,
  driftRisk,
  fieldArea,
  fluidRequired,
  sprayRate,
  emergencyStopped,
  mission,
}) {
  return (
    <aside className="ops-panel glass">
      <div className="panel-card">
        <div className="card-header">
          <span className="eyebrow">Flight</span>
          <span className={emergencyStopped ? 'risk-pill red' : 'good-pill'}>
            {emergencyStopped ? 'Stopped' : mission.status}
          </span>
        </div>

        <div className="metrics-grid">
          <div className="metric-box">
            <BatteryCharging size={17} />
            <strong>{telemetry.batteryPct.toFixed(0)}%</strong>
            <span>Battery</span>
          </div>
          <div className="metric-box">
            <Gauge size={17} />
            <strong>{telemetry.altitude.toFixed(0)}m</strong>
            <span>Altitude</span>
          </div>
          <div className="metric-box">
            <Droplets size={17} />
            <strong>{telemetry.tankLevel.toFixed(0)}%</strong>
            <span>Tank</span>
          </div>
          <div className="metric-box">
            <Wind size={17} />
            <strong>{driftRisk.label}</strong>
            <span>Drift risk</span>
          </div>
        </div>
      </div>

      <div className="panel-card">
        <div className="card-header">
          <span className="eyebrow">Mission</span>
          <span className="good-pill">{telemetry.speed.toFixed(0)} m/s</span>
        </div>

        <div className="mission-list">
          <div><span>Field area</span><strong>{fieldArea.toFixed(2)} ha</strong></div>
          <div><span>Swath</span><strong>{mission.swath} m</strong></div>
          <div><span>Target dosage</span><strong>{mission.dosage} L/ha</strong></div>
          <div><span>Fluid required</span><strong>{fluidRequired.toFixed(1)} L</strong></div>
          <div><span>Spray rate</span><strong>{sprayRate.toFixed(2)} L/min</strong></div>
          <div><span>Tank volume</span><strong>{telemetry.tankLitres.toFixed(1)} L</strong></div>
          <div><span>Nozzle pressure</span><strong>{telemetry.pressure.toFixed(1)} bar</strong></div>
        </div>
      </div>

      <div className="panel-card">
        <div className="card-header">
          <span className="eyebrow">NAV / Heading</span>
          <span className="good-pill">Locked</span>
        </div>
        <CompassHeading heading={telemetry.heading} lat={telemetry.lat} lng={telemetry.lng} />
      </div>

      <div className="panel-card">
        <div className="card-header">
          <span className="eyebrow">Environment</span>
          <span className={`risk-pill ${driftRisk.color}`}>{driftRisk.label}</span>
        </div>

        <div className="meter-group">
          <label>
            <span>Humidity</span>
            <strong>{telemetry.humidity.toFixed(0)}%</strong>
          </label>
          <div className="meter"><span style={{ width: `${telemetry.humidity}%` }} /></div>
        </div>

        <div className="meter-group">
          <label>
            <span>Battery</span>
            <strong>{telemetry.batteryPct.toFixed(0)}%</strong>
          </label>
          <div className="meter battery"><span style={{ width: `${telemetry.batteryPct}%` }} /></div>
        </div>
        <div className="mission-list sensor-summary">
          <div><span>Ambient temperature</span><strong>{telemetry.ambientTemp.toFixed(1)} °C</strong></div>
          <div><span>Wind direction</span><strong>{telemetry.windDirection.toFixed(0)}°</strong></div>
          <div><span>GPS / HDOP</span><strong>{telemetry.gpsSatellites} sat / {telemetry.hdop.toFixed(1)}</strong></div>
        </div>
      </div>
    </aside>
  );
}
