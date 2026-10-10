export default function FpvHudView({ telemetry, active, pip = false, embedded = false }) {
  return (
    <div className={`fpv-shell ${active ? 'active' : ''} ${pip ? 'pip' : ''} ${embedded ? 'embedded' : ''}`}>
      <div className="fpv-scene">
        <div className="horizon" />
        <div className="pitch-ladder" />
        <div className="crosshair" />
        <div className="hud">
          <div className="hud-top">
            <div className="hud-group">
              <span className="hud-chip rec"><i /> REC</span>
              <span className="hud-chip">ALT {telemetry.altitude.toFixed(0)} m</span>
              <span className="hud-chip">PITCH {telemetry.cameraPitch.toFixed(0)}°</span>
            </div>
            <div className="hud-group">
              <span className="hud-chip">HDG {telemetry.heading.toFixed(0)}°</span>
            </div>
          </div>

          <div className="hud-bottom">
            <div className="hud-group">
              <span className="hud-chip">SPD {telemetry.speed.toFixed(1)} m/s</span>
              <span className="hud-chip">WIND {telemetry.windSpeed.toFixed(1)}</span>
            </div>
            <div className="hud-group">
              <span className="hud-chip">FLOW {telemetry.flowRate.toFixed(1)} L/min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
