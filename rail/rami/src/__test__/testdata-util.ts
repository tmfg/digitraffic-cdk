import { addHours } from "date-fns";
import { chain } from "lodash-es";
import type { DtRosmMessage } from "../model/dt-rami-message.js";
import type { RosmMessageOperation } from "../model/rosm-message.js";
import { validRamiMonitoredJourneyScheduledMessage } from "./testdata-rosm.js";
import { validMessageUnknownTrackAndDelay } from "./testdata-sm.js";

export function createDtRosmMessage(properties: {
  created?: Date;
  start?: Date;
  end?: Date;
  trainNumber?: number;
  trainDepartureLocalDate?: string;
  stations?: string[];
  id?: string;
}): DtRosmMessage {
  return {
    id: properties.id ?? "abc",
    version: 1,
    messageType: properties.trainNumber
      ? "MONITORED_JOURNEY_SCHEDULED_MESSAGE"
      : "SCHEDULED_MESSAGE",
    operation: "INSERT",
    trainNumber: properties.trainNumber,
    trainDepartureLocalDate: properties.trainDepartureLocalDate,
    stations: properties.stations ?? ["PSL"],
    created: properties.created ?? properties.start ?? new Date(),
    startValidity: properties.start ?? new Date(),
    endValidity: properties.end ?? addHours(new Date(), 1),
    audio: {
      textFi: "audioteksti",
      daysOfWeek: ["MONDAY", "WEDNESDAY"],
    },
    video: {
      textFi: "videoteksti",
      daysOfWeek: ["TUESDAY", "FRIDAY"],
    },
  };
}

export function createMonitoredJourneyScheduledMessage(properties: {
  operation?: RosmMessageOperation;
  start?: Date;
  end?: Date;
  trainNumber?: number;
  trainDepartureDate?: string;
  station?: string;
  messageId?: string;
}): unknown {
  const payload = validRamiMonitoredJourneyScheduledMessage.payload;
  return {
    ...validRamiMonitoredJourneyScheduledMessage,
    payload: {
      ...payload,
      operation: properties.operation ?? payload.operation,
      messageId: properties.messageId ?? payload.messageId,
      startValidity: properties.start
        ? properties.start.toISOString()
        : new Date().toISOString(),
      endValidity: properties.end
        ? properties.end.toISOString()
        : addHours(new Date(), 1).toISOString(),
      monitoredJourneyScheduledMessage: {
        ...payload.monitoredJourneyScheduledMessage,
        vehicleJourney: {
          ...payload.monitoredJourneyScheduledMessage.vehicleJourney,
          vehicleJourneyName:
            properties.trainNumber?.toString() ??
            payload.monitoredJourneyScheduledMessage.vehicleJourney
              .vehicleJourneyName,
          dataFrameRef:
            properties.trainDepartureDate ??
            payload.monitoredJourneyScheduledMessage.vehicleJourney
              .dataFrameRef,
        },
        deliveryPoints: properties.station
          ? [{ id: properties.station, nameLong: "" }]
          : payload.monitoredJourneyScheduledMessage.deliveryPoints,
      },
    },
  };
}

export function createScheduledMessage(properties: {
  operation?: RosmMessageOperation;
  start?: Date;
  end?: Date;
  trainNumber?: number;
  trainDepartureDate?: string;
  station?: string;
  messageId?: string;
}): unknown {
  return {
    ...validRamiMonitoredJourneyScheduledMessage,
    payload: {
      ...validRamiMonitoredJourneyScheduledMessage.payload,
      operation:
        properties.operation ??
        validRamiMonitoredJourneyScheduledMessage.payload.operation,
      startValidity: properties.start
        ? properties.start.toISOString()
        : new Date().toISOString(),
      endValidity: properties.end
        ? properties.end.toISOString()
        : addHours(new Date(), 1).toISOString(),
    },
  };
}

export function createSmMessage(properties: {
  arrivalTime?: string;
  arrivalQuay?: string;
  departureTime?: string;
  departureQuay?: string;
}): unknown {
  return chain(validMessageUnknownTrackAndDelay)
    .clone()
    .set(
      [
        "payload",
        "monitoredStopVisits",
        0,
        "monitoredVehicleJourney",
        "monitoredCall",
        "expectedArrivalTime",
      ],
      properties.arrivalTime,
    )
    .set(
      [
        "payload",
        "monitoredStopVisits",
        0,
        "monitoredVehicleJourney",
        "monitoredCall",
        "expectedDepartureTime",
      ],
      properties.departureTime,
    )
    .set(
      [
        "payload",
        "monitoredStopVisits",
        0,
        "monitoredVehicleJourney",
        "monitoredCall",
        "arrivalStopAssignment",
        "expectedQuayName",
      ],
      properties.arrivalQuay,
    )
    .set(
      [
        "payload",
        "monitoredStopVisits",
        0,
        "monitoredVehicleJourney",
        "monitoredCall",
        "departureStopAssignment",
        "expectedQuayName",
      ],
      properties.departureQuay,
    )
    .value();
}
