import { create } from 'zustand';
import { updateFumigation } from '../utils/geo';

const initialTheme = localStorage.getItem('agrodrone-theme');
const defaultTelemetry = {
  batteryPct: 81,
  voltage: 25.8,
  altitude: 42,
  speed: 0,
  heading: 218,
  cameraPitch: 0,
  lat: 51.0498,
  lng: 4.0573,
  gpsSatellites: 14,
  hdop: 0.8,
  windSpeed: 16.5,
  windDirection: 242,
  ambientTemp: 21,
  humidity: 58,
  tankLevel: 74,
  tankLitres: 14.8,
  flowRate: 0,
  pressure: 3.4,
  pump: false,
  agitator: true,
  flush: false,
  solenoid: true,
  atomization: 'Rotary',
  manualOverride: false,
};

const timestamp = () => new Date().toISOString();

const useTelemetryStore = create((set) => ({
  theme: initialTheme === 'light' ? 'light' : 'dark',
  rosConnected: false,
  emergencyStopped: false,
  sprayPaused: false,
  geofenceBypass: false,
  routeMode: 'Lawnmower',
  calibration: 1,
  telemetry: defaultTelemetry,
  mission: {
    status: 'Ready',
    swath: 14,
    dosage: 28,
    margin: 8,
    roe: true,
    routeProgress: 0,
    covered: 0,
    totalArea: 0,
    progress: 0,
  },
  events: [{ time: timestamp(), tone: 'info', text: 'Simulation ready' }],
  logEvent: (text, tone = 'info') =>
    set((state) => ({ events: [{ time: timestamp(), tone, text }, ...state.events].slice(0, 50) })),
  setTheme: (theme) => {
    localStorage.setItem('agrodrone-theme', theme);
    set({ theme });
  },
  setMission: (next) =>
    set((state) => ({ mission: { ...state.mission, ...next } })),
  setSetting: (key, value) => set({ [key]: value }),
  setGeofenceBypass: (geofenceBypass) =>
    set((state) => ({
      geofenceBypass,
      events: [{ time: timestamp(), tone: 'warning', text: `Geofence bypass ${geofenceBypass ? 'enabled' : 'disabled'}` }, ...state.events].slice(0, 50),
    })),
  setTelemetry: (next) =>
    set((state) => ({
      telemetry: { ...state.telemetry, ...next },
    })),
  setTelemetryControl: (key, value) =>
    set((state) => ({ telemetry: { ...state.telemetry, [key]: value } })),
  setRosConnection: (connection) => set({ rosConnected: connection }),
  setHeading: (heading) =>
    set((state) => ({
      telemetry: { ...state.telemetry, heading: ((heading % 360) + 360) % 360 },
    })),
  setCameraPitch: (cameraPitch) =>
    set((state) => ({
      telemetry: { ...state.telemetry, cameraPitch: Math.max(-90, Math.min(30, cameraPitch)) },
    })),
  setManualOverride: (manualOverride) =>
    set((state) => {
      if (state.telemetry.manualOverride === manualOverride) return {};
      if (manualOverride && (
        state.emergencyStopped ||
        state.mission.status === 'Landed' ||
        state.mission.status === 'Disarmed'
      )) return {};

      return {
        sprayPaused: manualOverride ? true : state.sprayPaused,
        telemetry: {
          ...state.telemetry,
          manualOverride,
          ...(manualOverride
            ? {
                altitude: Math.max(1, Math.min(8, state.telemetry.altitude)),
                pump: false,
                flowRate: 0,
              }
            : {}),
        },
        mission: {
          ...state.mission,
          status: manualOverride
            ? 'Manual override'
            : state.mission.status === 'Manual override' ? 'Ready' : state.mission.status,
        },
        events: [{ time: timestamp(), tone: 'warning', text: manualOverride ? 'Manual override enabled' : 'Manual override disabled' }, ...state.events].slice(0, 50),
      };
    }),
  setManualAltitude: (altitude) =>
    set((state) => ({ telemetry: { ...state.telemetry, altitude: Math.max(1, Math.min(8, altitude)) } })),
  setManualYaw: (heading) =>
    set((state) => ({ telemetry: { ...state.telemetry, heading: ((heading % 360) + 360) % 360 } })),
  togglePump: () =>
    set((state) => {
      if (state.mission.status === 'Landed' || state.mission.status === 'Disarmed' || state.emergencyStopped) return {};
      const pump = !state.telemetry.pump;
      return {
        telemetry: { ...state.telemetry, pump, flowRate: pump ? state.telemetry.flowRate : 0 },
        sprayPaused: !pump,
      };
    }),
  startMission: () =>
    set((state) => state.emergencyStopped || state.mission.status === 'Landed' || state.mission.status === 'Disarmed'
      ? {}
      : {
          sprayPaused: false,
          telemetry: { ...state.telemetry, pump: true, manualOverride: false },
          mission: { ...state.mission, status: 'Auto-spraying' },
          events: [{ time: timestamp(), tone: 'success', text: 'Mission started' }, ...state.events].slice(0, 50),
        }),
  pauseMission: () =>
    set((state) => state.emergencyStopped || state.mission.status !== 'Auto-spraying'
      ? {}
      : {
          sprayPaused: true,
          telemetry: { ...state.telemetry, pump: false, flowRate: 0, manualOverride: false },
          mission: { ...state.mission, status: 'Paused' },
          events: [{ time: timestamp(), tone: 'warning', text: 'Spray paused' }, ...state.events].slice(0, 50),
        }),
  returnToHome: () =>
    set((state) => state.emergencyStopped || state.mission.status === 'Returning to home' || state.mission.status === 'Landed' || state.mission.status === 'Disarmed'
      ? {}
      : {
          sprayPaused: true,
          telemetry: { ...state.telemetry, pump: false, flowRate: 0, speed: 8, manualOverride: false },
          mission: { ...state.mission, status: 'Returning to home' },
          events: [{ time: timestamp(), tone: 'warning', text: 'Return-to-home started' }, ...state.events].slice(0, 50),
        }),
  emergencyLand: () =>
    set((state) => ({
      sprayPaused: true,
      telemetry: { ...state.telemetry, pump: false, speed: 0, flowRate: 0, altitude: 0, manualOverride: false },
      mission: { ...state.mission, status: 'Landed' },
      events: [{ time: timestamp(), tone: 'danger', text: 'Emergency landing initiated' }, ...state.events].slice(0, 50),
    })),
  disarm: () =>
    set((state) => ({
      sprayPaused: true,
      telemetry: { ...state.telemetry, pump: false, speed: 0, flowRate: 0, altitude: 0, manualOverride: false },
      mission: { ...state.mission, status: 'Disarmed' },
      events: [{ time: timestamp(), tone: 'danger', text: 'Motors disarmed' }, ...state.events].slice(0, 50),
    })),
  triggerEmergencyStop: () =>
    set((state) => ({
      emergencyStopped: true,
      sprayPaused: true,
      telemetry: {
        ...state.telemetry,
        speed: 0,
        flowRate: 0,
        manualOverride: false,
      },
      mission: {
        ...state.mission,
        status: 'Emergency stopped',
      },
      events: [{ time: timestamp(), tone: 'danger', text: 'Emergency stop activated' }, ...state.events].slice(0, 50),
    })),
  tickTelemetry: () =>
    set((state) => {
      const batteryPct = Math.max(18, state.telemetry.batteryPct - 0.02);
      const voltage = 18 + batteryPct * 0.0963;

      if (state.emergencyStopped) {
        return { telemetry: { ...state.telemetry, batteryPct, voltage } };
      }

      if (state.mission.status === 'Landed' || state.mission.status === 'Disarmed') {
        return { telemetry: { ...state.telemetry, batteryPct, voltage, pump: false, speed: 0, flowRate: 0, altitude: 0 } };
      }

      if (state.mission.status === 'Returning to home') {
        const altitude = Math.max(0, state.telemetry.altitude - 2);
        return {
          telemetry: {
            ...state.telemetry,
            batteryPct,
            voltage,
            speed: altitude === 0 ? 0 : 8,
            altitude,
            pump: false,
            flowRate: 0,
          },
          ...(altitude === 0 ? { mission: { ...state.mission, status: 'Landed' } } : {}),
        };
      }

      const nextFlowRate = state.sprayPaused || !state.telemetry.pump
        ? 0
        : updateFumigation({
            speed: state.telemetry.speed * 3.6,
            swathWidth: state.mission.swath,
            targetDosage: state.mission.dosage,
          }).flowRate * state.calibration;
      const tankLitres = Math.max(0, Math.min(20, state.telemetry.tankLitres - (state.telemetry.pump ? state.telemetry.flowRate / 60 * 1.5 : 0)));
      const returnOnEmpty = state.mission.roe && tankLitres < 1 && state.mission.status === 'Auto-spraying';
      const routeDistance = Math.max(1, (state.mission.totalArea * 10000) / Math.max(state.mission.swath, 1));
      const speedMetersPerSecond = state.mission.status === 'Ready'
        ? 0
        : 3 + (Math.sin(Date.now() / 900) + 1) * 2.5;
      const routeProgressIncrement = speedMetersPerSecond * 1.5 / routeDistance;
      const nextMission = returnOnEmpty
        ? { ...state.mission, status: 'Returning to home' }
        : state.mission.status === 'Auto-spraying'
          ? {
              ...state.mission,
              routeProgress: Math.min(1, state.mission.routeProgress + routeProgressIncrement),
              progress: Math.min(100, (state.mission.routeProgress + routeProgressIncrement) * 100),
              covered: Math.min(state.mission.totalArea || Infinity, state.mission.covered + speedMetersPerSecond * 1.5 * state.mission.swath / 10000),
            }
          : state.mission;

      return {
        telemetry: {
          ...state.telemetry,
          batteryPct,
          voltage,
          heading: state.telemetry.manualOverride || state.mission.status === 'Ready'
            ? state.telemetry.heading
            : (state.telemetry.heading + 1) % 360,
          altitude: state.telemetry.manualOverride
            ? state.telemetry.altitude
            : state.mission.status === 'Ready'
              ? state.telemetry.altitude
              : 40 + Math.sin(Date.now() / 1000) * 8,
          speed: speedMetersPerSecond,
          flowRate: returnOnEmpty ? 0 : Number(nextFlowRate.toFixed(2)),
          tankLitres,
          tankLevel: tankLitres * 5,
          lat: state.mission.status === 'Auto-spraying' || state.mission.status === 'Paused' || state.mission.status === 'Manual override'
            ? state.telemetry.lat + Math.cos(state.telemetry.heading * Math.PI / 180) * state.telemetry.speed * 1.5 / 111320
            : state.telemetry.lat,
          lng: state.mission.status === 'Auto-spraying' || state.mission.status === 'Paused' || state.mission.status === 'Manual override'
            ? state.telemetry.lng + Math.sin(state.telemetry.heading * Math.PI / 180) * state.telemetry.speed * 1.5 / (111320 * Math.cos(state.telemetry.lat * Math.PI / 180))
            : state.telemetry.lng,
        },
        mission: nextMission,
        ...(returnOnEmpty
          ? {
              sprayPaused: true,
              events: [{ time: timestamp(), tone: 'warning', text: 'Tank low · return-on-empty activated' }, ...state.events].slice(0, 50),
            }
          : {}),
      };
    }),
}));

export default useTelemetryStore;
