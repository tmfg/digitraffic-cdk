export const COORDINATE_PRECISION = 0.000001; // What is the precision of saved coordinates

export const AUTORI_MAX_TIME_BETWEEN_TRACKINGS_S = 60*5 + 5; // 5 min + 5s
export const AUTORI_MAX_DISTANCE_BETWEEN_TRACKINGS_M = 500;
export const AUTORI_MAX_MINUTES_TO_HISTORY = 7;
export const AUTORI_MAX_SPEED_BETWEEN_TRACKINGS_KMH = 80; // 140 km/h
export const AUTORI_MAX_DISTANCE_WHEN_INFINITE_SPEED_M = 50;

// Paikannin sends data minimum every: 5 min / 500m / 25° turn
export const PAIKANNIN_MAX_TIME_BETWEEN_TRACKINGS_S = 60*5 + 5; // 5 min + 5s; // * 1000*60*2; // 2 min ** 1000*60*5 + 1000*5; // 5 min + 5s
export const PAIKANNIN_MAX_DISTANCE_BETWEEN_TRACKINGS_M = 520;
export const PAIKANNIN_MIN_MINUTES_FROM_PRESENT = 2; // Dont get data younger than this
export const PAIKANNIN_MAX_MINUTES_TO_HISTORY = 9; // Dont get data older than this
export const PAIKANNIN_MAX_SPEED_BETWEEN_TRACKINGS_KMH = 80; // harja = 140 km/h
