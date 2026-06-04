export enum VehicleType {
  AUTO = 'AUTO',
  CAB = 'CAB',
  EV_CAB = 'EV_CAB',
  BIKE = 'BIKE',
}

export enum RideStatus {
  SEARCHING = 'SEARCHING',
  DRIVER_ASSIGNED = 'DRIVER_ASSIGNED',
  DRIVER_ARRIVING = 'DRIVER_ARRIVING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  UPI = 'UPI',
  WALLET = 'WALLET',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
}

export enum KycStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum BillingCycle {
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CITY_ADMIN = 'CITY_ADMIN',
  SUPPORT = 'SUPPORT',
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FareEstimate {
  estimatedFare: number;
  distance: number;
  duration: number;
  surgeMultiplier: number;
  breakdown: {
    baseFare: number;
    distanceFare: number;
    timeFare: number;
    surgeFare: number;
  };
}

export interface DriverLocation {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
  timestamp: number;
}

export interface SubscriptionPriceResult {
  basePrice: number;
  discount: number;
  discountType: 'PEAK' | 'OFF_PEAK' | 'OVERRIDE' | 'CAMPAIGN' | 'NONE';
  finalPrice: number;
  reason: string;
}
