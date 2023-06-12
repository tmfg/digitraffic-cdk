import type { ValueOf } from "@digitraffic/common/dist/types/util-types.js";
import type { z } from "zod";
import type { ramiMessageSchema } from "./schema/rami-message-schema.js";
import type {
    recipientAudioMessagesToDeliver,
    recipientVideoMessagesToDeliver
} from "./schema/scheduled-message-schema.js";

export type RamiMessage = z.infer<typeof ramiMessageSchema>;
export type RamiMessagePayload = Pick<RamiMessage, "payload">["payload"];

export const RamiMessageTypes = {
    MONITORED_JOURNEY_SCHEDULED_MESSAGE: "MONITORED_JOURNEY_SCHEDULED_MESSAGE",
    SCHEDULED_MESSAGE: "SCHEDULED_MESSAGE"
} as const;
export type RamiMessageType = ValueOf<typeof RamiMessageTypes>;

export const RamiMessageOperations = { INSERT: "INSERT", UPDATE: "UPDATE", DELETE: "DELETE" } as const;
export type RamiMessageOperation = ValueOf<typeof RamiMessageOperations>;

export type RamiScheduledMessageVideo = NonNullable<z.infer<typeof recipientVideoMessagesToDeliver>>;
export type RamiScheduledMessageAudio = NonNullable<z.infer<typeof recipientAudioMessagesToDeliver>>;
