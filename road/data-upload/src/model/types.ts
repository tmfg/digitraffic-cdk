export const SOURCES = {
  API: "API",
} as const;

export const TYPES = {
  VMS_DATEX2_XML: "VARIABLE_MESSAGE_SIGN_DATEX_XML",
  VMS_DATEX2_METADATA_XML: "VARIABLE_MESSAGE_SIGN_METADATA_XML",
} as const;

export type DataStatus = "NEW" | "FAILED" | "PROCESSED";

export const Datex2Version = {
  "3.5": "DATEXII_3_5",
  "2.2.3": "DATEXII_2_2_3",
} as const;
