import { addHours } from "date-fns";
import type { DtRamiMessage } from "../model/dt-rami-message";
import { validRamiMonitoredJourneyScheduledMessage, validRamiScheduledMessage } from "./testdata";

export function createDtRamiMessage(properties: {
    start?: Date;
    end?: Date;
    trainNumber?: number;
    trainDepartureLocalDate?: string;
    stations?: string[];
    id?: string;
}): DtRamiMessage {
    return {
        id: properties.id ?? "abc",
        version: 1,
        messageType: "MONITORED_JOURNEY_SCHEDULED_MESSAGE",
        operation: "INSERT",
        trainNumber: properties.trainNumber,
        trainDepartureLocalDate: properties.trainDepartureLocalDate,
        stations: properties.stations ?? ["PSL"],
        created: properties.start ?? new Date(),
        startValidity: properties.start ?? new Date(),
        endValidity: properties.end ?? addHours(new Date(), 1),
        audio: {
            textFi: "audioteksti",
            daysOfWeek: ["MONDAY", "WEDNESDAY"]
        },
        video: {
            textFi: "videoteksti",
            daysOfWeek: ["TUESDAY", "SATURDAY"]
        }
    };
}

export function createMonitoredJourneyScheduledMessage(
    start: Date,
    end: Date,
    trainNumber?: number,
    trainDepartureDate?: string,
    station?: string,
    messageId?: string
): unknown {
    const payload = validRamiMonitoredJourneyScheduledMessage.payload;
    return {
        ...validRamiMonitoredJourneyScheduledMessage,
        payload: {
            ...payload,
            messageId: messageId ?? payload.messageId,
            startValidity: start.toISOString(),
            endValidity: end.toISOString(),
            monitoredJourneyScheduledMessage: {
                ...payload.monitoredJourneyScheduledMessage,
                vehicleJourney: {
                    ...payload.monitoredJourneyScheduledMessage.vehicleJourney,
                    vehicleJourneyName:
                        trainNumber?.toString() ??
                        payload.monitoredJourneyScheduledMessage.vehicleJourney.vehicleJourneyName,
                    dataFrameRef:
                        trainDepartureDate ??
                        payload.monitoredJourneyScheduledMessage.vehicleJourney.dataFrameRef
                },
                deliveryPoints: station
                    ? [{ id: station, nameLong: "" }]
                    : payload.monitoredJourneyScheduledMessage.deliveryPoints
            }
        }
    };
}

export function createScheduledMessage(start: Date, end: Date): unknown {
    return {
        ...validRamiScheduledMessage,
        payload: {
            ...validRamiScheduledMessage.payload,
            startValidity: start.toISOString(),
            endValidity: end.toISOString()
        }
    };
}
