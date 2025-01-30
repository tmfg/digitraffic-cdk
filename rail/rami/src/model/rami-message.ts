import type { ValueOf } from "@digitraffic/common/dist/types/util-types";
import type { z } from "zod";
import type { ramiMessageSchema } from "./zod-schema/rami-message.js";
import type {
  recipientAudioMessagesToDeliver,
  recipientVideoMessagesToDeliver,
} from "./zod-schema/scheduled-message.js";
import type { monitoredJourneyScheduledMessage } from "./zod-schema/monitored-journey-scheduled-message.js";

export type RamiMessage = z.infer<typeof ramiMessageSchema>;
export type RamiMessagePayload = Pick<RamiMessage, "payload">["payload"];

export const RamiMessageTypes = {
  MONITORED_JOURNEY_SCHEDULED_MESSAGE: "MONITORED_JOURNEY_SCHEDULED_MESSAGE",
  SCHEDULED_MESSAGE: "SCHEDULED_MESSAGE",
} as const;
export type RamiMessageType = ValueOf<typeof RamiMessageTypes>;

export const RamiMessageOperations = {
  INSERT: "INSERT",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
} as const;
export type RamiMessageOperation = ValueOf<typeof RamiMessageOperations>;

export type RamiScheduledMessageVideo = NonNullable<
  z.infer<typeof recipientVideoMessagesToDeliver>
>;
export type RamiScheduledMessageAudio = NonNullable<
  z.infer<typeof recipientAudioMessagesToDeliver>
>;

export type RamiMonitoredJourneyScheduledMessage = NonNullable<
  z.infer<typeof monitoredJourneyScheduledMessage>
>;
export type RamiMonitoredJourneyScheduledMessageAudio = NonNullable<
  Pick<
    RamiMonitoredJourneyScheduledMessage,
    "audioMessageContents"
  >["audioMessageContents"]
>;
