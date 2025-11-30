import { create } from "zustand";

export interface FloorLevel {
  id: number;
  name: string;
  short_name: string;
  ordinal: number;
}

interface FloorState {
  currentFloor: number;
  floors: FloorLevel[];
  setCurrentFloor: (floor: number) => void;
  getFloorName: (floorId: number) => string;
}

const useFloorStore = create<FloorState>((set, get) => ({
  currentFloor: 0,
  floors: [
    { id: 0, name: "Ground Floor", short_name: "G", ordinal: 0 },
    { id: 1, name: "First Floor", short_name: "1", ordinal: 1 },
    { id: 2, name: "Second Floor", short_name: "2", ordinal: 2 },
    { id: 3, name: "Third Floor", short_name: "3", ordinal: 3 },
  ],
  setCurrentFloor: (floor) => set({ currentFloor: floor }),
  getFloorName: (floorId) => {
    const floor = get().floors.find((f) => f.id === floorId);
    return floor ? floor.name : "Unknown Floor";
  },
}));

export default useFloorStore;
