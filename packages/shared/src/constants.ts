export const INDIAN_PHONE_REGEX = /^(\+91)?[6-9]\d{9}$/;
export const OTP_TTL_SECONDS = 600; // 10 minutes
export const OTP_LENGTH = 6;
export const RIDE_OTP_LENGTH = 4;
export const DRIVER_SEARCH_RADIUS_KM = 5;
export const DRIVER_SEARCH_RADIUS_EXPANDED_KM = 8;
export const MAX_RIDE_REJECTIONS = 3;
export const DRIVER_ACCEPT_TIMEOUT_SECONDS = 15;
export const DRIVER_LOCATION_DB_INTERVAL_SECONDS = 30;
export const JWT_ACCESS_EXPIRY = '15m';
export const JWT_REFRESH_EXPIRY = '30d';

export const CITIES = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune'] as const;
export type City = (typeof CITIES)[number];
