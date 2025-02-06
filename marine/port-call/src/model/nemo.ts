import { z } from "zod";

export const nemoVisitSchema =
    z.object({
      visitId: z.string().max(35),
      portCall: z
        .object({
          vesselInformation: z
            .object({
              identification: z
                .string()
                .min(7)
                .max(7)
                .describe("Aluksen IMO-numero"),
              name: z
                .string()
                .max(70)
                .describe("Aluksen nimi")
            })
            .strict(),
          voyageInformation: z
            .object({
              portIdentification: z
                .string()
                .min(5)
                .max(5)
                .describe("Käyntisatama, koodattu"),
              estimatedArrivalDateTime: z
                .coerce.date()
                .describe("Saapumispäivä ja -aika – arvioitu"),
              estimatedDepartureDateTime: z
                .union([
                  z.null().describe("Lähtöpäivä ja -aika – arvioitu"),
                  z.coerce.date().describe("Lähtöpäivä ja -aika – arvioitu")
                ])
                .describe("Lähtöpäivä ja -aika – arvioitu")
            })
            .strict(),
          arrivalNotification: z
            .object({
              actualArrivalDateTime: z
                .union([
                  z.null().describe("Saapumispäivä ja -aika – toteutunut"),
                  z.coerce.date().describe("Saapumispäivä ja -aika – toteutunut")
                ])
                .describe("Saapumispäivä ja -aika – toteutunut")
            })
            .strict(),
          departureNotification: z
            .object({
              actualDepartureDateTime: z
                .union([
                  z.null().describe("Lähtöpäivä ja -aika – toteutunut"),
                  z.coerce.date().describe("Lähtöpäivä ja -aika – toteutunut")
                ])
                .describe("Lähtöpäivä ja -aika – toteutunut")
            })
            .strict(),
          portCallStatus: z
            .object({
              status: z
                .enum([
                  "Expected to Arrive",
                  "Arrived",
                  "Departed",
                  "Cancelled"
                ])
                .describe("Satamakäynnin tila ")
            })
            .strict()
        })
        .strict(),
      latestUpdateTime: z.coerce.date()
    })
    .strict()
    .describe("Päivämäärät muodossa: YYYY-MM-DDTHH:MM:SS.SS+HH:MM");

export type NemoVisit = z.infer<typeof nemoVisitSchema>;
export type NemoResponse = NemoVisit[];