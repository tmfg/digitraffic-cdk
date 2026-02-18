import { z } from "zod";
import { headers } from "./rosm-message.js";

const stopAssignment = z.object({
  expectedQuayName: z
    .string()
    .describe("expected quay for this stop")
    .optional(),
});

export const monitoredCall = z.object({
  arrivalStopAssignment: stopAssignment,
  departureStopAssignment: stopAssignment,
  aimedArrivalTime: z
    .string()
    .describe("datetime, in UTC ISO8601, expected arrival time")
    .optional(),
  aimedDepartureTime: z
    .string()
    .describe("datetime, in UTC ISO8601, expected arrival time")
    .optional(),
  expectedArrivalTime: z
    .string()
    .describe("datetime, in UTC ISO8601, expected arrival time")
    .optional(),
  expectedDepartureTime: z
    .string()
    .describe("datetime, in UTC ISO8601, expected arrival time")
    .optional(),
  departureBoardingActivity: z.string(),
  stopPointRef: z.string().describe("station"),
});

export const payload = z
  .object({
    monitoredStopVisits: z
      .array(
        z.object({
          monitoredVehicleJourney: z.object({
            monitoredCall: monitoredCall,
            onwardCalls: z.array(monitoredCall),
            vehicleJourneyName: z.string().length(14).or(z.string().length(17)),
          }),
        }),
      )
      .nonempty()
      .length(1),
  })
  .describe(
    "Object containing the information of a scheduled message inserted by an operator",
  );

// RamiOperatorScheduledMessage
export const ramiSmMessageSchema = z
  .object({
    headers,
    payload,
    extraPayload: z
      .object({})
      .describe("Optional extention of payload object")
      .optional()
      .nullable(),
  })
  .strict();
