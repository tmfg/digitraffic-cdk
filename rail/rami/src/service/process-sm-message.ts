import { logException } from "@digitraffic/common/dist/utils/logging";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { DtSmMessage, StMonitoringData } from "../model/dt-rami-message.js";
import { monitoredCall, ramiSmMessageSchema } from "../model/zod-schema/sm-message.js";
import type { z } from "zod";

export function parseSmMessage(message: unknown): DtSmMessage | undefined {
    try {
        const parsedMessage = ramiSmMessageSchema.parse(message);

        return ramiMessageToDtSmMessages(parsedMessage);
    } catch (e) {
        logException(logger, e);
    }
    return undefined;
}

function ramiMessageToDtSmMessages(message: z.infer<typeof ramiSmMessageSchema>): DtSmMessage {
    const data: StMonitoringData[] = [];
    const mcj = message.payload.monitoredStopVisits[0].monitoredVehicleJourney;
    const monitoredCall = mcj.monitoredCall;
    const { trainNumber, departureDate } = parseTrain(mcj.vehicleJourneyName);

    data.push(parseMonitoredCall(monitoredCall));

    mcj.onwardCalls.forEach(oc => {
        data.push(parseMonitoredCall(oc));
    });  

    return { trainNumber, departureDate, data };
}

function parseMonitoredCall(mc: z.infer<typeof monitoredCall>): StMonitoringData {
    const hasDeparture = Object.keys(mc.departureStopAssignment).length > 0;

    return {
        stationShortCode: mc.stopPointRef,
        arrivalTimeUnknown: !mc.expectedArrivalTime,
        arrivalQuayUnknown: !mc.arrivalStopAssignment.expectedQuayName,
        departureTimeUnknown: hasDeparture && !mc.expectedDepartureTime,
        departureQuayUnknown: hasDeparture && !mc.departureStopAssignment.expectedQuayName,
    };
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