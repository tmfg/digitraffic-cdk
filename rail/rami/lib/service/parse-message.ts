import {
    RamiMessage,
    ramiMessageSchema,
    RamiScheduledMessageAudio,
    RamiScheduledMessageVideo
} from "../model/rami-message-schema";
import { DtAudioContent, DtRamiMessage, DtVideoContent, RamiMessageType } from "../model/dt-rami-message";
import { parseISO } from "date-fns";
import { validRamiMonitoredJourneyScheduledMessage, validRamiScheduledMessage } from "../../test/testdata";

interface DeliveryPoint {
    readonly id: string;
    readonly nameLong?: string | null | undefined;
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
    SV: "sv_SE"
} as const;

type LanguageCode = (typeof LanguageCodes)[keyof typeof LanguageCodes];

export function ramiMessageToDtRamiMessage(message: RamiMessage): DtRamiMessage {
    return {
        id: message.payload.messageId,
        version: message.payload.messageVersion,
        created: parseISO(message.payload.creationDateTime),
        startValidity: parseISO(message.payload.startValidity),
        endValidity: parseISO(message.payload.endValidity),
        trainNumber: message.payload.monitoredJourneyScheduledMessage?.vehicleJourney?.vehicleJourneyName
            ? parseInt(message.payload.monitoredJourneyScheduledMessage?.vehicleJourney?.vehicleJourneyName)
            : undefined,
        trainDepartureLocalDate:
            message.payload.monitoredJourneyScheduledMessage?.vehicleJourney?.dataFrameRef,
        journeyRef: message.payload.monitoredJourneyScheduledMessage?.vehicleJourney?.datedVehicleJourneyRef,
        stations: getDeliveryPoints(message),
        video: getVideoContent(message),
        audio: getAudioContent(message)
    };
}

function getAudioContent(message: RamiMessage): DtAudioContent | undefined {
    if (
        message.payload.messageType === RamiMessageType.SCHEDULED_MESSAGE &&
        message.payload.scheduledMessage?.onGroundRecipient?.recipientAudioMessagesToDeliver
    ) {
        const audioMessage =
            message.payload.scheduledMessage?.onGroundRecipient?.recipientAudioMessagesToDeliver;
        return parseScheduledMessageAudio(audioMessage);
    } else if (
        message.payload.messageType === RamiMessageType.MONITORED_JOURNEY_SCHEDULED_MESSAGE &&
        message.payload.monitoredJourneyScheduledMessage?.audioMessageContents
    ) {
        const audioMessage = message.payload.monitoredJourneyScheduledMessage?.audioMessageContents;
        const audioTexts = audioMessage.audioTexts as TextContent[];
        return {
            textFi: getTextInLanguage(audioTexts, LanguageCodes.FI),
            textSv: getTextInLanguage(audioTexts, LanguageCodes.SV),
            textEn: getTextInLanguage(audioTexts, LanguageCodes.EN),
            deliveryType: audioMessage.deliveryType ?? undefined
        };
    }

    return undefined;
}

function parseScheduledMessageAudio(audioMessage: RamiScheduledMessageAudio): DtAudioContent {
    const audioTexts = audioMessage.audioText as TextContent[];
    return {
        textFi: getTextInLanguage(audioTexts, LanguageCodes.FI),
        textSv: getTextInLanguage(audioTexts, LanguageCodes.SV),
        textEn: getTextInLanguage(audioTexts, LanguageCodes.EN),
        ...(audioMessage.scheduledAudioDeliveryRules && {
            deliveryType: audioMessage.scheduledAudioDeliveryRules.audioSchedulationType,
            startDateTime: audioMessage.scheduledAudioDeliveryRules.startDateTime
                ? parseISO(audioMessage.scheduledAudioDeliveryRules.startDateTime)
                : undefined,
            endDateTime: audioMessage.scheduledAudioDeliveryRules.endDateTime
                ? parseISO(audioMessage.scheduledAudioDeliveryRules.endDateTime)
                : undefined,
            startTime: audioMessage.scheduledAudioDeliveryRules.startTime ?? undefined,
            endTime: audioMessage.scheduledAudioDeliveryRules.endTime ?? undefined,
            daysOfWeek: audioMessage.scheduledAudioDeliveryRules.daysOfWeek ?? undefined,
            deliveryAt: audioMessage.scheduledAudioDeliveryRules.deliveryAtDateTime
                ? parseISO(audioMessage.scheduledAudioDeliveryRules.deliveryAtDateTime)
                : undefined
        })
    };
}

function getVideoContent(message: RamiMessage): DtVideoContent | undefined {
    if (
        message.payload.messageType === RamiMessageType.SCHEDULED_MESSAGE &&
        message.payload.scheduledMessage?.onGroundRecipient?.recipientVideoMessagesToDeliver
    ) {
        const videoMessage =
            message.payload.scheduledMessage.onGroundRecipient.recipientVideoMessagesToDeliver;
        return parseScheduledMessageVideo(videoMessage);
    } else if (
        message.payload.messageType === RamiMessageType.MONITORED_JOURNEY_SCHEDULED_MESSAGE &&
        message.payload.monitoredJourneyScheduledMessage?.videoTexts
    ) {
        const videoTexts = message.payload.monitoredJourneyScheduledMessage?.videoTexts as TextContent[];
        return {
            textFi: getTextInLanguage(videoTexts, LanguageCodes.FI),
            textSv: getTextInLanguage(videoTexts, LanguageCodes.SV),
            textEn: getTextInLanguage(videoTexts, LanguageCodes.EN)
        };
    }
    return undefined;
}

function parseScheduledMessageVideo(videoMessage: RamiScheduledMessageVideo): DtVideoContent {
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
            endTime: videoMessage.deliveryRules.endTime ?? undefined
        })
    };
}

function getTextInLanguage(texts: TextContent[] | null, languageCode: LanguageCode): string | undefined {
    if (!texts) return undefined;
    const textContent = texts.find((text) => text?.language === languageCode);
    if (textContent?.text) return textContent.text;
    if (textContent?.videoText) return textContent.videoText;
    if (textContent?.audioText) return textContent.audioText;
    return undefined;
}

function getDeliveryPoints(message: RamiMessage): string[] | undefined {
    if (
        message.payload.messageType === RamiMessageType.SCHEDULED_MESSAGE &&
        message.payload.scheduledMessage?.onGroundRecipient?.deliveryPoints
    ) {
        return mapDeliveryPointsToStationCodes(
            message.payload.scheduledMessage.onGroundRecipient.deliveryPoints
        );
    }
    if (
        message.payload.messageType === RamiMessageType.MONITORED_JOURNEY_SCHEDULED_MESSAGE &&
        message.payload.monitoredJourneyScheduledMessage?.deliveryPoints
    ) {
        return mapDeliveryPointsToStationCodes(
            message.payload.monitoredJourneyScheduledMessage.deliveryPoints
        );
    }
    return undefined;
}

function mapDeliveryPointsToStationCodes(points: DeliveryPoint[]): string[] {
    return points.filter((point): point is DeliveryPoint => !!point).map((point) => point.id);
}
