import z from "zod";

export const VISIT_STATUS_VALUES = [
  "Expected to Arrive",
  "Arrived",
  "Departed",
  "Cancelled",
] as const;

export const VISIT_STATUS_QUERY_VALUES = [
  "expected-to-arrive",
  "arrived",
  "departed",
  "cancelled",
] as const;

export const VISIT_STATUS_QUERY_TO_VALUE_MAP: Record<
  (typeof VISIT_STATUS_QUERY_VALUES)[number],
  (typeof VISIT_STATUS_VALUES)[number]
> = {
  "expected-to-arrive": "Expected to Arrive",
  arrived: "Arrived",
  departed: "Departed",
  cancelled: "Cancelled",
} as const;

export type VisitStatus = (typeof VISIT_STATUS_VALUES)[number];

export const VISIT_SORT_FIELDS = [
  "eta",
  "etd",
  "ata",
  "atd",
  "vesselName",
  "portOfCall",
  "status",
] as const;

export type VisitSortField = (typeof VISIT_SORT_FIELDS)[number];

export const SORT_DIRECTIONS = ["asc", "desc"] as const;

export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export interface VisitSort {
  readonly field: VisitSortField;
  readonly direction: SortDirection;
}

// this type is returned from lambdas
export const visitResponseSchema = z
  .object({
    visitId: z.string().max(35),
    vesselId: z.string().min(7).max(7).describe("IMO-number"),
    vesselName: z.string().max(70).describe("Vessel name"),
    portOfCall: z.string().min(5).max(5).describe("Port locode of visit"),
    eta: z.iso.datetime().describe("Estimated time of arrival"),
    etd: z.iso.datetime().describe("Estimated time of departure").optional(),
    ata: z.iso.datetime().describe("Actual time of arrival").optional(),
    atd: z.iso.datetime().describe("Actual time of departure").optional(),
    status: z.enum(VISIT_STATUS_VALUES).describe("Visit status"),
    updateTime: z.iso.datetime().describe("When visit was updated"),
  })
  .strict();

export type VisitResponse = z.infer<typeof visitResponseSchema>;
