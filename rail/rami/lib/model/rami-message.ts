import { ramiMessageSchema } from "./rami-message-schema";
import { z } from "zod";

export type RamiMessage = z.infer<typeof ramiMessageSchema>;
export type RamiMessagePayload = Pick<RamiMessage, "payload">["payload"];

export enum RamiMessageType {
    MONITORED_JOURNEY_SCHEDULED_MESSAGE = "MONITORED_JOURNEY_SCHEDULED_MESSAGE",
    SCHEDULED_MESSAGE = "SCHEDULED_MESSAGE"
}

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
