import { z } from "zod";

export const monitoredJourneyScheduledMessage = z
  .object({
    vehicleJourney: z
      .object({
        datedVehicleJourneyRef: z.string().describe("id of vehicle journey"),
        dataFrameRef: z
          .string()
          .describe(
            "unique identifier of data frame within participant service",
          ),
        vehicleJourneyName: z.string().describe("name of vehicle journey"),
      })
      .describe("vehicle journey identifiers information")
      .nullable(),
    messageContentType: z.enum(["AUDIO", "VIDEO", "AUDIO_VIDEO"]).describe(
      "message content type",
    ),
    deliveryPoints: z
      .array(
        z
          .object({
            id: z
              .string()
              .describe(
                "**This refers to code external to Moova**. It is retrieved by invoking the SVCPLN-NetworkCode service",
              ),
            nameLong: z.string().optional().nullable(),
          })
          .describe("point where to deliver the scheduled message"),
      )
      .nullable(),
    audioMessageContents: z
      .object({
        audioTexts: z
          .array(
            z
              .object({
                language: z.string().describe(
                  "identifies the language of the content",
                ),
                audioText: z.string().describe(
                  "audio text used for tts system",
                ),
              })
              .describe(
                "audio message content to be delivered for monitored journey scheduled message",
              ),
          )
          .describe("list of audio message text"),
        deliveryRules: z
          .object({
            repetitions: z.number().int().nullable().optional(),
            repeatEvery: z.number().int().nullable().optional(),
            scheduledArrival: z.boolean().nullable().optional(),
            scheduledDeparture: z.boolean().nullable().optional(),
            estimatedArrival: z.boolean().nullable().optional(),
            estimatedDeparture: z.boolean().nullable().optional(),
            eventType: z
              .string()
              .describe(
                "one of the event for messages to deliver on board ARRIVING DEPARTING ARRIVED DEPARTED\n  ",
              )
              .optional()
              .nullable(),
          })
          .describe("Delivery Rule for monitored journey scheduled message")
          .nullable(),
        deliveryType: z
          .union([
            z.literal("ON_EVENT"),
            z.literal("ON_SCHEDULE"),
            z.literal(null),
          ])
          .describe(
            "delivery type of message associated with vehicle journeys",
          ),
      })
      .describe(
        "audio message content to be delivered for monitored journey scheduled message with delivery rules.\nAudio messages can be delivered in three delivery types specified in the _deliveryType_ field: \n- ON_EVENT the message is delivered for vehicle journey when that vehicle journey generates a specified event for a defined Point in _deliveryPoints_ (e.g. ARRIVING)\n- ON_SCHEDULE the message is delivered on a specific vehicle journey scheduling date happens for a defined Point in _deliveryPoints_ (e.g. estimated arrival time)",
      )
      .optional()
      .nullable(),
    videoTexts: z
      .array(
        z
          .object({
            language: z.string().describe(
              "identifies the language of the content",
            ),
            videoText: z.string().describe("audio text used for tts system"),
          })
          .describe(
            "video message content to be delivered for monitored journey scheduled message",
          ),
      )
      .describe("list of video message for vehicle journey")
      .nullable()
      .optional(),
  })
  .describe(
    "is filled only if the message is of type MONITORED_JOURNEY_SCHEDULED_MESSAGE",
  )
  .optional()
  .nullable();
