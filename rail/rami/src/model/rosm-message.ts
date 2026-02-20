import type { ValueOf } from "@digitraffic/common/dist/types/util-types";
import type { z } from "zod";
import type { monitoredJourneyScheduledMessage } from "./zod-schema/monitored-journey-scheduled-message.js";
import type { ramiRosmMessageSchema } from "./zod-schema/rosm-message.js";
import type {
  recipientAudioMessagesToDeliver,
  recipientVideoMessagesToDeliver,
} from "./zod-schema/scheduled-message.js";

export type RosmMessage = z.infer<typeof ramiRosmMessageSchema>;
export type RosmMessagePayload = Pick<RosmMessage, "payload">["payload"];

export const RosmMessageTypes = {
  MONITORED_JOURNEY_SCHEDULED_MESSAGE: "MONITORED_JOURNEY_SCHEDULED_MESSAGE",
  SCHEDULED_MESSAGE: "SCHEDULED_MESSAGE",
} as const;
export type RosmMessageType = ValueOf<typeof RosmMessageTypes>;

export const RosmMessageOperations = {
  INSERT: "INSERT",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
} as const;
export type RosmMessageOperation = ValueOf<typeof RosmMessageOperations>;

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
