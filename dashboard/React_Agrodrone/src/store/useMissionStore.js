import { create } from 'zustand';

const useMissionStore = create((set) => ({
  mission: {
    status: 'Ready',
    swath: 14,
    dosage: 28,
    margin: 8,
    fieldArea: 0,
    progress: 0,
    coverage: 0,
    totalArea: 0,
  },
  setMission: (next) => set((state) => ({ mission: { ...state.mission, ...next } })),
}));

export default useMissionStore;
