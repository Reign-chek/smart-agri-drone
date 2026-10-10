import { MapPin, Wind, Satellite, BatteryCharging, Radio } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Topbar({ telemetry, connected, emergencyStopped, missionStatus }) {
  const [utcTime, setUtcTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setUtcTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="topbar glass">
      <div className="title-block">
        <span className="eyebrow">Agricultural Autonomy</span>
        <strong>Flight Operations</strong>
      </div>

      <div className="topbar-status">
        <div className={`status-pill ${connected ? 'live' : 'offline'}`}>
          <Radio size={12} />
          {connected ? 'ROS2 · 38 ms' : 'ROS2 offline'}
        </div>
        <div className="status-pill">
          <Satellite size={12} />
          {telemetry.gpsSatellites} SAT · HDOP {telemetry.hdop.toFixed(1)}
        </div>
        <div className="status-pill">
          <BatteryCharging size={12} />
          {telemetry.batteryPct.toFixed(0)}%
        </div>
        <div className="status-pill">
          <MapPin size={12} />
          {utcTime.toISOString().slice(11, 19)}Z · {telemetry.lat.toFixed(4)}, {telemetry.lng.toFixed(4)}
        </div>
        <div className="status-pill">
          <Wind size={12} />
          {telemetry.windSpeed.toFixed(1)} km/h
        </div>
        <div className={`status-pill accent ${emergencyStopped ? 'offline' : ''}`}>
          {emergencyStopped ? 'EMERGENCY STOP' : missionStatus.toUpperCase()}
        </div>
      </div>
    </header>
  );
}
