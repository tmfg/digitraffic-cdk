export const MAX_TIME_BETWEEN_TRACKINGS_MS = 1000*60*5 + 1000*5;
export const MAX_DISTANCE_BETWEEN_TRACKINGS_KM = 0.5; // 0,5 km
export const MAX_SPEED_BETWEEN_TRACKINGS_KMH = 140; // 140 km/h

export const AUTORI_MAX_TIME_BETWEEN_TRACKINGS_MS = 1000*60*5; // 5 min + 5s
export const AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_KM = 0.5;
export const AUTORI_MAX_MINUTES_TO_HISTORY = 7;
export const AUTORI_MAX_MINUTES_AT_ONCE = 30;


// Paikannin sends data minimum every:
// - 5 min
// - 500m
// - 25° turn
export const PAIKANNIN_MAX_TIME_BETWEEN_TRACKINGS_MS = 1000*60*5 + 1000*5; // 5 min + 5s
export const PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_KM = 0.55;
export const PAIKANNIN_MIN_MINUTES_FROM_PRESENT = 2; // Dont get data younger than this
export const PAIKANNIN_MAX_MINUTES_TO_HISTORY = 9; // Dont get data older than this
