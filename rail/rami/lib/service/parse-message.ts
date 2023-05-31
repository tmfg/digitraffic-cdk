import { RamiMessage, RamiMessageVideoContent } from "../model/rami-message-schema";
import { DtRamiMessage, RamiMessageType, VideoContent } from "../model/dt-rami-message";
import { parseISO } from "date-fns";

interface DeliveryPoint {
    readonly id: string;
    readonly nameLong?: string | null | undefined;
}

interface TextContent {
    readonly language: LanguageCode;
    readonly text?: string;
    readonly videoText?: string;
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
        trainDepartureDate: message.payload.monitoredJourneyScheduledMessage?.vehicleJourney?.dataFrameRef
            ? parseISO(message.payload.monitoredJourneyScheduledMessage?.vehicleJourney?.dataFrameRef)
            : undefined,
        journeyRef: message.payload.monitoredJourneyScheduledMessage?.vehicleJourney?.datedVehicleJourneyRef,
        stations: getDeliveryPoints(message),
        video: getVideoMessage(message)
    };
}

function getVideoMessage(message: RamiMessage): VideoContent | undefined {
    if (
        message.payload.messageType === RamiMessageType.SCHEDULED_MESSAGE &&
        message.payload.scheduledMessage?.onGroundRecipient?.recipientVideoMessagesToDeliver
    ) {
        message.payload.scheduledMessage.onGroundRecipient;
        const videoMessage =
            message.payload.scheduledMessage.onGroundRecipient.recipientVideoMessagesToDeliver;
        return parseVideoMessage(videoMessage);
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

function parseVideoMessage(videoMessage: RamiMessageVideoContent): VideoContent {
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
                : undefined
        })
    };
}

function getTextInLanguage(texts: TextContent[] | null, languageCode: LanguageCode): string | undefined {
    if (!texts) return undefined;
    const textContent = texts.find((text) => text?.language === languageCode);
    if (textContent?.text) return textContent.text;
    if (textContent?.videoText) return textContent.videoText;
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
