import z from "zod";

export const VISIT_STATUS_VALUES = [
  "Expected to Arrive",
  "Arrived",
  "Departed",
  "Cancelled",
] as const;

// this type is returned from lambdas
export const visitResponseSchema = z
  .object({
    visitId: z.string().max(35),
    vesselId: z.string().min(7).max(7).describe("IMO-number"),
    vesselName: z.string().max(70).describe("Vessel name"),
    portLocode: z.string().min(5).max(5).describe("Port locode of visit"),
    eta: z.iso.datetime().describe("Estimated time of arrival"),
    etd: z.iso.datetime().describe("Estimated time of departure").optional(),
    ata: z.iso.datetime().describe("Actual time of arrival").optional(),
    atd: z.iso.datetime().describe("Actual time of departure").optional(),
    status: z.enum(VISIT_STATUS_VALUES).describe("Visit status"),
    updateTime: z.iso.datetime().describe("When visit was updated"),
  })
  .strict();

export type VisitResponse = z.infer<typeof visitResponseSchema>;
