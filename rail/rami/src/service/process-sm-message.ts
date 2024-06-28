import { logException } from "@digitraffic/common/dist/utils/logging";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { monitoredCall, ramiSmMessageSchema } from "../model/zod-schema/sm-message.js";
import type { z } from "zod";
import { findTimeTableRows, type TimeTableRow } from "../dao/time_table_row.js";
import { insertOrUpdate, type UpsertValues } from "../dao/stop_monitoring.js";
import type { Connection } from "mysql2/promise";
import { inTransaction } from "../util/database.js";
import type { DtSmMessage, StMonitoringData } from "../model/dt-rosm-message.js";
import _ from "lodash";

export async function processSmMessage(message: DtSmMessage): Promise<void> {
    logger.info({
        method: "ProcessSmMessageService.processSmMessage",
        message: `Message for train ${message.trainNumber} ${message.departureDate}`
    });

    const rows = await findTimeTableRows(message.trainNumber, message.departureDate);
    const upsertValues: UpsertValues[] = [];

    message.data.forEach(datarow => {
        // find attap_id for each line
        const attapId = findAttapId(rows, datarow);

        if(attapId) {
            upsertValues.push({
                trainNumber: message.trainNumber,
                trainDepartureDate: message.departureDate,
                attapId, 
                uq: datarow.quayUnknown,
                ut: datarow.timeUnknown
            });
        } else {
            logger.error({
                method: "ProcessSmMessageService.processSmMessage",
                message: "Could not find attapId for " + JSON.stringify(datarow)
            });
        }
    });

    return inTransaction(async (conn: Connection): Promise<void> => {
        // run all updates to db
        await insertOrUpdate(conn, upsertValues);
    });    
}

function findAttapId(rows: TimeTableRow[], datarow: StMonitoringData): number | undefined {
    const row = rows.find(r => {
        console.info(`Comparing ${JSON.stringify(r)} and ${JSON.stringify(datarow)} with type ${datarow.type}`);

        return r.station_short_code === datarow.stationShortCode && r.type === datarow.type && r.scheduled_time === datarow.scheduledTime
    });

    return row?.attap_id;
}

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

    data.push(...parseMonitoredCall(monitoredCall));

    mcj.onwardCalls.forEach(oc => {
        data.push(...parseMonitoredCall(oc));
    });  

    return { trainNumber, departureDate, data };
}

function parseMonitoredCall(mc: z.infer<typeof monitoredCall>): StMonitoringData[] {
    const arrival: StMonitoringData | undefined = !mc.aimedArrivalTime ? undefined :{
        stationShortCode: mc.stopPointRef,
        scheduledTime: new Date(mc.aimedArrivalTime),
        type: 0,
        timeUnknown: !mc.expectedArrivalTime,
        quayUnknown: !mc.arrivalStopAssignment.expectedQuayName
    }

    const departure: StMonitoringData | undefined = !mc.aimedDepartureTime ? undefined : {
        stationShortCode: mc.stopPointRef,
        scheduledTime: new Date(mc.aimedDepartureTime),
        type: 1,
        timeUnknown: !mc.expectedDepartureTime,
        quayUnknown: !mc.departureStopAssignment.expectedQuayName
    };

    return _.compact([arrival, departure]);
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