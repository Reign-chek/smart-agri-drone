import { Layers3, Navigation, ShieldAlert, Gauge, Droplets, Settings2, Gamepad2 } from 'lucide-react';

export default function NavigationRail({
  selectedDrawer,
  setSelectedDrawer,
  theme,
  setTheme,
  emergencyStopped,
  missionStatus,
  onEmergencyStop,
  onRemoteControl,
}) {
  const navItems = [
    { key: 'status', icon: Gauge },
    { key: 'maps', icon: Layers3 },
    { key: 'mission', icon: Navigation },
    { key: 'spray', icon: Droplets },
    { key: 'settings', icon: Settings2 },
  ];

  return (
    <aside className="sidebar glass">
      <div className="brand-mark">
        <img src="/cut-logo.png" alt="Chinhoyi University of Technology" />
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        {navItems.map(({ key, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`nav-btn ${selectedDrawer === key ? 'active' : ''}`}
            aria-label={key}
            aria-expanded={selectedDrawer === key}
            onClick={() => setSelectedDrawer(key)}
          >
            <Icon size={18} />
          </button>
        ))}

        <button
          type="button"
          className="nav-btn remote-control-trigger"
          aria-label="Enter remote control"
          title="Remote control"
          onClick={onRemoteControl}
          disabled={emergencyStopped || missionStatus === 'Landed' || missionStatus === 'Disarmed'}
        >
          <Gamepad2 size={18} />
        </button>

        <button
          type="button"
          className={`nav-btn danger ${emergencyStopped || selectedDrawer === 'kill' ? 'active' : ''}`}
          aria-label={emergencyStopped ? 'Disarm active' : 'Disarm motors'}
          aria-expanded={selectedDrawer === 'kill'}
          aria-pressed={emergencyStopped}
          onClick={onEmergencyStop}
        >
          <ShieldAlert size={18} />
        </button>
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="theme-toggle"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </div>
    </aside>
  );
}
