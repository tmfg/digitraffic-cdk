import { logException } from "@digitraffic/common/dist/utils/logging";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { DtSmMessage } from "../model/dt-rami-message.js";
import { ramiSmMessageSchema } from "../model/zod-schema/sm-message.js";
import type { z } from "zod";

export function parseSmMessage(message: unknown): DtSmMessage | undefined {
    try {
        const parsedMessage = ramiSmMessageSchema.parse(message);

        return ramiMessageToDtSmMessage(parsedMessage);
    } catch (e) {
        logException(logger, e);
    }
    return undefined;
}

function ramiMessageToDtSmMessage(message: z.infer<typeof ramiSmMessageSchema>): DtSmMessage {
    const mcj = message.payload.monitoredStopVisits[0].monitoredVehicleJourney;
    const monitoredCall = mcj.monitoredCall;

    const hasDeparture = !!monitoredCall.departureStopAssignment;
    const { trainNumber, departureDate } = parseTrain(mcj.vehicleJourneyName);

    return {
        trainNumber, departureDate,
        stationShortCode: monitoredCall.stopPointRef,
        arrivalTimeUnknown: !monitoredCall.expectedArrivalTime,
        arrivalQuayUnknown: !monitoredCall.arrivalStopAssignment.expectedQuayName,
        departureTimeUnknown: hasDeparture && !monitoredCall.expectedDepartureTime,
        departureQuayUnknown: hasDeparture && !monitoredCall.departureStopAssignment.expectedQuayName,
    }
}

/**
 * Parse departure date and train number from VehicleJourneyName
 * 
 * VehicleJourneyName has the following format:
 * YYYYMMDD1nnnnn
 * 
 * Meaning the departure date followed by 1 and then the train number with leading zeros
 * 
 * For example "20240619108122"
 */
function parseTrain(vehicleJourney: string): {
    departureDate: string,
    trainNumber: number
} {
    const departureDate = vehicleJourney.substring(0, 8);
    const trainNumber = vehicleJourney.substring(9);

    return {
        departureDate,
        trainNumber: Number.parseInt(trainNumber),
    }
}