import { create } from 'zustand';

interface RideRequest {
  rideId: string;
  pickupLat: number;
  pickupLng: number;
  distanceToPickup: string;
  vehicleType: string;
  timeoutSeconds: number;
}

interface RideState {
  currentRequest: RideRequest | null;
  activeRide: any | null;
  setRequest: (r: RideRequest | null) => void;
  setActiveRide: (r: any | null) => void;
}

export const useRideStore = create<RideState>((set) => ({
  currentRequest: null,
  activeRide: null,
  setRequest: (r) => set({ currentRequest: r }),
  setActiveRide: (r) => set({ activeRide: r }),
}));
