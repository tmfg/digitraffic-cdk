import type { ValueOf } from "@digitraffic/common/dist/types/util-types.js";
import type { ramiMessageSchema } from "./rami-message-schema.js";
import type { z } from "zod";

export type RamiMessage = z.infer<typeof ramiMessageSchema>;
export type RamiMessagePayload = Pick<RamiMessage, "payload">["payload"];

export const RamiMessageTypes = {
    MONITORED_JOURNEY_SCHEDULED_MESSAGE: "MONITORED_JOURNEY_SCHEDULED_MESSAGE",
    SCHEDULED_MESSAGE: "SCHEDULED_MESSAGE"
} as const;
export type RamiMessageType = ValueOf<typeof RamiMessageTypes>;

export const RamiMessageOperations = { INSERT: "INSERT", UPDATE: "UPDATE", DELETE: "DELETE" } as const;
export type RamiMessageOperation = ValueOf<typeof RamiMessageOperations>;

// only onGroundRecipient recipient type is used in practice with scheduledMessages
type RamiScheduledMessageRecipient = Pick<
    NonNullable<RamiMessage["payload"]["scheduledMessage"]>,
    "onGroundRecipient"
>["onGroundRecipient"];

export type RamiScheduledMessageVideo = NonNullable<
    Pick<
        NonNullable<RamiScheduledMessageRecipient>,
        "recipientVideoMessagesToDeliver"
    >["recipientVideoMessagesToDeliver"]
>;

export type RamiScheduledMessageAudio = NonNullable<
    Pick<
        NonNullable<RamiScheduledMessageRecipient>,
        "recipientAudioMessagesToDeliver"
    >["recipientAudioMessagesToDeliver"]
>;
