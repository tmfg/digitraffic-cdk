import { z } from "zod";
import { VISIT_STATUS_VALUES } from "./visit-schema.js";

export const nemoVisitSchema = z
  .object({
    visitId: z.string().max(35),
    portCall: z
      .object({
        vesselInformation: z
          .object({
            identification: z
              .string()
              .max(7)
              .nullable()
              .optional()
              .describe(
                "Aluksen IMO-numero, voi puuttua tai olla tyhjä, kun tietoa ei ole saatavilla",
              ),
            name: z
              .string()
              .min(0)
              .max(70)
              .nullable()
              .optional()
              .describe(
                "Aluksen nimi, voi puuttua tai olla tyhjä, kun tietoa ei ole saatavilla",
              ),
            shipCallSign: z
              .string()
              .max(7)
              .nullable()
              .optional()
              .describe("Aluksen kutsumerkki, jos saatavilla"),
            mmsiNumber: z
              .string()
              .length(9)
              .regex(/^[0-9]{9}$/)
              .nullable()
              .optional()
              .describe("Aluksen MMSI-numero, jos saatavilla"),
            vesselType: z
              .string()
              .max(4)
              .nullable()
              .optional()
              .describe("Aluksen tyyppikoodi, jos saatavilla"),
            grossTonnage: z
              .number()
              .int()
              .min(0)
              .nullable()
              .optional()
              .describe("Bruttovetoisuus (GT), jos saatavilla"),
            netTonnage: z
              .number()
              .int()
              .min(0)
              .nullable()
              .optional()
              .describe("Nettovetoisuus (NT), jos saatavilla"),
            length: z
              .number()
              .int()
              .min(0)
              .nullable()
              .optional()
              .describe("Aluksen pituus metreinä, jos saatavilla"),
            breadth: z
              .number()
              .int()
              .min(0)
              .nullable()
              .optional()
              .describe("Aluksen leveys metreinä, jos saatavilla"),
            height: z
              .number()
              .int()
              .min(0)
              .nullable()
              .optional()
              .describe("Aluksen korkeus metreinä, jos saatavilla"),
          })
          .strict(),
        declarantName: z
          .string()
          .max(70)
          .nullable()
          .optional()
          .describe("Ilmoittajan nimi, jos saatavilla"),
        voyageInformation: z
          .object({
            portIdentification: z
              .string()
              .min(5)
              .max(5)
              .describe("Käyntisatama, koodattu"),
            estimatedArrivalDateTime: z.coerce
              .date()
              .describe("Saapumispäivä ja -aika – arvioitu"),
            estimatedDepartureDateTime: z
              .union([
                z.null().describe("Lähtöpäivä ja -aika – arvioitu"),
                z.coerce.date().describe("Lähtöpäivä ja -aika – arvioitu"),
              ])
              .describe("Lähtöpäivä ja -aika – arvioitu"),
            portLocation: z
              .string()
              .nullable()
              .optional()
              .describe("Käyntisataman nimi, jos saatavilla"),
            previousPortIdentification: z
              .string()
              .min(0)
              .max(5)
              .nullable()
              .optional()
              .describe("Edellinen satama (UN/LOCODE), jos saatavilla"),
            previousPortName: z
              .string()
              .nullable()
              .optional()
              .describe("Edellisen sataman nimi, jos saatavilla"),
            nextPortIdentification: z
              .string()
              .min(0)
              .max(5)
              .nullable()
              .optional()
              .describe("Seuraava satama (UN/LOCODE), jos saatavilla"),
            nextPortName: z
              .string()
              .nullable()
              .optional()
              .describe("Seuraavan sataman nimi, jos saatavilla"),
            portAreaCode: z
              .string()
              .nullable()
              .optional()
              .describe("Satama-aluekoodi, jos saatavilla"),
            portAreaName: z
              .string()
              .nullable()
              .optional()
              .describe("Satama-alueen nimi, jos saatavilla"),
            berthName: z
              .string()
              .nullable()
              .optional()
              .describe("Laituri / kiinnittymispaikka, jos saatavilla"),
            berthCode: z
              .string()
              .nullable()
              .optional()
              .describe("Laiturin yksilöivä koodi, jos saatavilla"),
          })
          .strict(),
        arrivalNotification: z
          .object({
            actualArrivalDateTime: z
              .union([
                z.null().describe("Saapumispäivä ja -aika – toteutunut"),
                z.coerce.date().describe("Saapumispäivä ja -aika – toteutunut"),
              ])
              .describe("Saapumispäivä ja -aika – toteutunut"),
          })
          .strict(),
        departureNotification: z
          .object({
            actualDepartureDateTime: z
              .union([
                z.null().describe("Lähtöpäivä ja -aika – toteutunut"),
                z.coerce.date().describe("Lähtöpäivä ja -aika – toteutunut"),
              ])
              .describe("Lähtöpäivä ja -aika – toteutunut"),
          })
          .strict(),
        portCallStatus: z
          .object({
            status: z.enum(VISIT_STATUS_VALUES).describe("Satamakäynnin tila "),
          })
          .strict(),
      })
      .strict(),
    latestUpdateTime: z.coerce.date(),
  })
  .strict()
  .describe("Päivämäärät muodossa: YYYY-MM-DDTHH:MM:SS.SS+HH:MM");

export type NemoVisit = z.infer<typeof nemoVisitSchema>;
export type NemoResponse = NemoVisit[];
