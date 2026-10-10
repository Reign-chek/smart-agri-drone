export default function MissionDeck({
  progress,
  coverage,
  totalArea,
  status,
  emergencyStopped,
  onStart,
  onPause,
  onReturnToHome,
  onEmergencyLand,
  events,
}) {
  const missionActive = status === 'Auto-spraying';

  return (
    <footer className="mission-deck glass">
      <div className="mission-summary">
        <div className="progress-copy">
          <span className="label">Mission Coverage</span>
          <strong className="mono">{coverage.toFixed(2)} / {totalArea.toFixed(2)} ha</strong>
        </div>
        <div className="progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mission-actions">
        <button type="button" className="start-btn" onClick={onStart} disabled={emergencyStopped || missionActive || status === 'Landed' || status === 'Disarmed'}>
          {missionActive ? 'Mission Active' : status === 'Paused' ? 'Resume Mission' : 'Start Mission'}
        </button>
        <button type="button" onClick={onPause} disabled={emergencyStopped || !missionActive}>
          Pause Spray
        </button>
        <button type="button" onClick={onReturnToHome} disabled={emergencyStopped || status === 'Returning to home' || status === 'Landed' || status === 'Disarmed'}>
          RTL
        </button>
        <button type="button" className="danger-btn" onClick={onEmergencyLand} disabled={status === 'Landed'}>
          Emergency Land
        </button>
      </div>
      <div className="mission-log" role="status" aria-live="polite">
        {events?.[0] ? `${new Date(events[0].time).toLocaleTimeString()} · ${events[0].text}` : 'No mission events'}
      </div>
    </footer>
  );
}
