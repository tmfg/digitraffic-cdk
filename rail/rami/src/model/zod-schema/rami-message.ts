import { z } from "zod";
import { scheduledMessage } from "./scheduled-message";
import { monitoredJourneyScheduledMessage } from "./monitored-journey-scheduled-message";

export const headers = z
    .object({
        e2eId: z.string().describe("Correlational event unique identifier for logging and instrumentation"),
        organisation: z.string().describe("Data Type for Identifier of an OrganisationCode.").optional(),
        source: z.string().describe("Module identifier that publishes the message"),
        partitionKey: z
            .string()
            .describe(
                "kafka partition key where the message is sent in the specific topic. The message id is used"
            )

            .describe(
                "kafka partition key where the message is sent in the specific topic. The message id is used"
            )
            .nullable()
            .optional(),
        eventType: z.string().nullable().describe("Type of event"),
        recordedAtTime: z.string().describe("Registration date")
    })
    .describe("Mandatory header of the message");

export const payload = z
    .object({
        messageId: z.string().describe("unique id of the message"),
        messageVersion: z
            .number()
            .int()
            .gte(1)
            .describe("message versioning, it is incremented at each message update"),
        title: z.string().max(255).describe("title of the message"),
        messageType: z
            .enum(["SCHEDULED_MESSAGE", "MONITORED_JOURNEY_SCHEDULED_MESSAGE"])
            .describe("type of the message. Indicates whether related with vehicle journey or not"),
        operation: z
            .enum(["INSERT", "UPDATE", "DELETE"])
            .describe("type of operation performed by the user on the message"),
        creationDateTime: z.string().describe("datetime, in UTC ISO8601, creation date time"),
        startValidity: z.string().describe("datetime, in UTC ISO8601, start validity"),
        endValidity: z.string().describe("datetime, in UTC ISO8601, end validity"),
        scheduledMessage,
        monitoredJourneyScheduledMessage
    })
    .describe("Object containing the information of a scheduled message inserted by an operator");

export const ramiMessageSchema = z
    .object({
        headers,
        payload,
        extraPayload: z.object({}).describe("Optional extention of payload object").optional().nullable()
    })
    .strict();
