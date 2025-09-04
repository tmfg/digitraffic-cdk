export const SOURCES = {
  API: "API",
} as const;

export const TYPES = {
  VS_DATEX2_XML: "VS_DATEX2_XML",
} as const;

export type DataStatus = "NEW" | "FAILED" | "PROCESSED";
