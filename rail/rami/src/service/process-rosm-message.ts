import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { ValueOf } from "@digitraffic/common/dist/types/util-types";
import { logException } from "@digitraffic/common/dist/utils/logging";
import { parseISO } from "date-fns";
import { insertMessage, setMessageDeleted } from "../dao/message.js";
import type {
  DtAudioContent,
  DtRosmMessage,
  DtVideoContent,
} from "../model/dt-rami-message.js";
import {
  type RamiMonitoredJourneyScheduledMessageAudio,
  type RamiScheduledMessageAudio,
  type RamiScheduledMessageVideo,
  type RosmMessage,
  RosmMessageOperations,
  type RosmMessagePayload,
  RosmMessageTypes,
} from "../model/rosm-message.js";
import { ramiRosmMessageSchema } from "../model/zod-schema/rosm-message.js";

interface DeliveryPoint {
  readonly id: string;
}

interface TextContent {
  readonly language: LanguageCode;
  readonly text?: string;
  readonly videoText?: string;
  readonly audioText?: string;
}

const LanguageCodes = {
  EN: "en_GB",
  FI: "fi_FI",
  SV: "sv_SE",
} as const;

type LanguageCode = ValueOf<typeof LanguageCodes>;

export function processRosmMessage(message: DtRosmMessage): Promise<void> {
  if (
    message.operation === RosmMessageOperations.INSERT ||
    message.operation === RosmMessageOperations.UPDATE
  ) {
    logger.info({
      method: "RamiMessageService.processRosmMessage",
      message:
        `Persisting RAMI message id: ${message.id}, version: ${message.version}`,
    });
    return insertMessage(message);
  } else if (message.operation === RosmMessageOperations.DELETE) {
    logger.info({
      method: "RamiMessageService.processRosmMessage",
      message: `Deleting RAMI message id: ${message.id}`,
    });
    return setMessageDeleted(message.id);
  }
  return Promise.reject();
}

export function parseRosmMessage(message: unknown): DtRosmMessage | undefined {
  try {
    const parsedMessage = ramiRosmMessageSchema.parse(message);
    return ramiMessageToDtRamiMessage(parsedMessage);
  } catch (e) {
    logException(logger, e);
  }
  return undefined;
}

export function ramiMessageToDtRamiMessage(
  { payload }: RosmMessage,
): DtRosmMessage {
  return {
    id: payload.messageId,
    version: payload.messageVersion,
    messageType: payload.messageType,
    operation: payload.operation,
    created: parseISO(payload.creationDateTime),
    startValidity: parseISO(payload.startValidity),
    endValidity: parseISO(payload.endValidity),
    trainNumber: payload.monitoredJourneyScheduledMessage?.vehicleJourney
        ?.vehicleJourneyName
      ? parseInt(
        payload.monitoredJourneyScheduledMessage?.vehicleJourney
          ?.vehicleJourneyName,
      )
      : undefined,
    trainDepartureLocalDate: payload.monitoredJourneyScheduledMessage
      ?.vehicleJourney?.dataFrameRef,
    journeyRef: payload.monitoredJourneyScheduledMessage?.vehicleJourney
      ?.datedVehicleJourneyRef,
    stations: getDeliveryPoints(payload),
    video: getVideoContent(payload),
    audio: getAudioContent(payload),
  };
}

function getAudioContent(
  payload: RosmMessagePayload,
): DtAudioContent | undefined {
  if (
    payload.messageType === RosmMessageTypes.SCHEDULED_MESSAGE &&
    payload.scheduledMessage?.onGroundRecipient?.recipientAudioMessagesToDeliver
  ) {
    const audioMessage = payload.scheduledMessage?.onGroundRecipient
      ?.recipientAudioMessagesToDeliver;
    return parseScheduledMessageAudio(audioMessage);
  } else if (
    payload.messageType ===
      RosmMessageTypes.MONITORED_JOURNEY_SCHEDULED_MESSAGE &&
    payload.monitoredJourneyScheduledMessage?.audioMessageContents
  ) {
    const audioMessage =
      payload.monitoredJourneyScheduledMessage.audioMessageContents;
    return parseMonitoredJourneyScheduledMessageAudio(audioMessage);
  }

  return undefined;
}

function parseMonitoredJourneyScheduledMessageAudio(
  audioMessage: RamiMonitoredJourneyScheduledMessageAudio,
): DtAudioContent {
  const audioTexts = audioMessage.audioTexts as TextContent[];
  return {
    textFi: getTextInLanguage(audioTexts, LanguageCodes.FI),
    textSv: getTextInLanguage(audioTexts, LanguageCodes.SV),
    textEn: getTextInLanguage(audioTexts, LanguageCodes.EN),
    deliveryType: audioMessage.deliveryType ?? undefined,
    repeatEvery: audioMessage.deliveryRules?.repeatEvery ?? undefined,
    repetitions: audioMessage.deliveryRules?.repetitions ?? undefined,
    eventType: audioMessage.deliveryRules?.eventType
      ? audioMessage.deliveryRules?.eventType
      : undefined,
  };
}

function parseScheduledMessageAudio(
  audioMessage: RamiScheduledMessageAudio,
): DtAudioContent {
  const audioTexts = audioMessage.audioText as TextContent[];
  return {
    textFi: getTextInLanguage(audioTexts, LanguageCodes.FI),
    textSv: getTextInLanguage(audioTexts, LanguageCodes.SV),
    textEn: getTextInLanguage(audioTexts, LanguageCodes.EN),
    ...(audioMessage.scheduledAudioDeliveryRules && {
      deliveryType:
        audioMessage.scheduledAudioDeliveryRules.audioSchedulationType,
      startDateTime: audioMessage.scheduledAudioDeliveryRules.startDateTime
        ? parseISO(audioMessage.scheduledAudioDeliveryRules.startDateTime)
        : undefined,
      endDateTime: audioMessage.scheduledAudioDeliveryRules.endDateTime
        ? parseISO(audioMessage.scheduledAudioDeliveryRules.endDateTime)
        : undefined,
      startTime: audioMessage.scheduledAudioDeliveryRules.startTime ??
        undefined,
      endTime: audioMessage.scheduledAudioDeliveryRules.endTime ?? undefined,
      repetitions: audioMessage.scheduledAudioDeliveryRules.repetitions ??
        undefined,
      repeatEvery: audioMessage.scheduledAudioDeliveryRules.repeatEvery ??
        undefined,
      daysOfWeek: audioMessage.scheduledAudioDeliveryRules.daysOfWeek ??
        undefined,
      deliveryAt: audioMessage.scheduledAudioDeliveryRules.deliveryAtDateTime
        ? parseISO(audioMessage.scheduledAudioDeliveryRules.deliveryAtDateTime)
        : undefined,
    }),
  };
}

function getVideoContent(
  payload: RosmMessagePayload,
): DtVideoContent | undefined {
  if (
    payload.messageType === RosmMessageTypes.SCHEDULED_MESSAGE &&
    payload.scheduledMessage?.onGroundRecipient?.recipientVideoMessagesToDeliver
  ) {
    const videoMessage = payload.scheduledMessage.onGroundRecipient
      .recipientVideoMessagesToDeliver;
    return parseScheduledMessageVideo(videoMessage);
  } else if (
    payload.messageType ===
      RosmMessageTypes.MONITORED_JOURNEY_SCHEDULED_MESSAGE &&
    payload.monitoredJourneyScheduledMessage?.videoTexts
  ) {
    const videoTexts = payload.monitoredJourneyScheduledMessage
      .videoTexts as TextContent[];
    return {
      textFi: getTextInLanguage(videoTexts, LanguageCodes.FI),
      textSv: getTextInLanguage(videoTexts, LanguageCodes.SV),
      textEn: getTextInLanguage(videoTexts, LanguageCodes.EN),
    };
  }
  return undefined;
}

function parseScheduledMessageVideo(
  videoMessage: RamiScheduledMessageVideo,
): DtVideoContent {
  const videoTexts = videoMessage.videoTexts as TextContent[];
  return {
    textFi: getTextInLanguage(videoTexts, LanguageCodes.FI),
    textSv: getTextInLanguage(videoTexts, LanguageCodes.SV),
    textEn: getTextInLanguage(videoTexts, LanguageCodes.EN),
    ...(videoMessage.deliveryRules && {
      daysOfWeek: videoMessage.deliveryRules.daysOfWeek ?? undefined,
      deliveryType: videoMessage.deliveryRules.videoSchedulationType,
      startDateTime: videoMessage.deliveryRules.startDateTime
        ? parseISO(videoMessage.deliveryRules.startDateTime)
        : undefined,
      endDateTime: videoMessage.deliveryRules.endDateTime
        ? parseISO(videoMessage.deliveryRules.endDateTime)
        : undefined,
      startTime: videoMessage.deliveryRules.startTime ?? undefined,
      endTime: videoMessage.deliveryRules.endTime ?? undefined,
    }),
  };
}

function getTextInLanguage(
  texts: TextContent[],
  languageCode: LanguageCode,
): string | undefined {
  const textContent = texts.find((text) => text.language === languageCode);
  return (
    textContent?.text?.trim() ??
      textContent?.videoText?.trim() ??
      textContent?.audioText?.trim() ??
      undefined
  );
}

function getDeliveryPoints(payload: RosmMessagePayload): string[] | undefined {
  if (
    payload.messageType === RosmMessageTypes.SCHEDULED_MESSAGE &&
    payload.scheduledMessage?.onGroundRecipient?.deliveryPoints
  ) {
    return mapDeliveryPointsToStationCodes(
      payload.scheduledMessage.onGroundRecipient.deliveryPoints,
    );
  }
  if (
    payload.messageType ===
      RosmMessageTypes.MONITORED_JOURNEY_SCHEDULED_MESSAGE &&
    payload.monitoredJourneyScheduledMessage?.deliveryPoints
  ) {
    return mapDeliveryPointsToStationCodes(
      payload.monitoredJourneyScheduledMessage.deliveryPoints,
    );
  }
  return undefined;
}

function mapDeliveryPointsToStationCodes(points: DeliveryPoint[]): string[] {
  return points.filter((point): point is DeliveryPoint => !!point).map((
    point,
  ) => point.id);
}
