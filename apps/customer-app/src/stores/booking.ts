import { create } from 'zustand';

export type BookingStep = 'idle' | 'selecting' | 'searching' | 'assigned' | 'arriving' | 'in_progress' | 'completed';

interface BookingState {
  step: BookingStep;
  pickup: { lat: number; lng: number; address: string } | null;
  drop: { lat: number; lng: number; address: string } | null;
  ride: any | null;
  driver: any | null;
  driverLocation: { lat: number; lng: number } | null;
  setPickup: (p: BookingState['pickup']) => void;
  setDrop: (d: BookingState['drop']) => void;
  setRide: (r: any) => void;
  setDriver: (d: any) => void;
  setDriverLocation: (l: BookingState['driverLocation']) => void;
  setStep: (s: BookingStep) => void;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  step: 'idle', pickup: null, drop: null, ride: null, driver: null, driverLocation: null,
  setPickup: (p) => set({ pickup: p }),
  setDrop: (d) => set({ drop: d }),
  setRide: (r) => set({ ride: r }),
  setDriver: (d) => set({ driver: d }),
  setDriverLocation: (l) => set({ driverLocation: l }),
  setStep: (s) => set({ step: s }),
  reset: () => set({ step: 'idle', pickup: null, drop: null, ride: null, driver: null, driverLocation: null }),
}));
