import { create } from 'zustand';

const defaultTelemetry = {
  batteryPct: 81,
  voltage: 25.8,
  altitude: 42,
  speed: 18.2,
  heading: 218,
  windSpeed: 16.5,
  humidity: 58,
  tankLevel: 74,
  flowRate: 12.3,
  pressure: 3.4,
};

const useDroneStore = create((set) => ({
  theme: 'dark',
  rosConnected: true,
  telemetry: defaultTelemetry,
  mission: {
    status: 'Ready',
    swath: 14,
    dosage: 28,
    margin: 8,
    fieldArea: 0,
  },
  setTheme: (theme) => set({ theme }),
  setTelemetry: (next) =>
    set((state) => ({
      telemetry: { ...state.telemetry, ...next },
    })),
  setRosConnection: (connected) => set({ rosConnected: connected }),
}));

export default useDroneStore;
