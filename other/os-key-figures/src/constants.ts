export const transportType = {
  ALL: "*",
  MARINE: "marine",
  RAIL: "rail",
  ROAD: "road",
  AFIR: "afir",
} as const;

export type TransportType = (typeof transportType)[keyof typeof transportType];

export const OS_REQUEST_FIELD = "request";
export const OS_ACCOUNT_NAME_FIELD = "accountName.keyword";
export const DB_TRANSPORT_TYPE_FIELD = "@transport_type";
export const DB_REQUEST_FIELD = "@fields.request_uri";
