import { logException } from "@digitraffic/common/dist/utils/logging";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type {
  UnknownDelayOrTrack,
  UnknownDelayOrTrackMessage,
} from "../model/dt-rosm-message.js";
import {
  type monitoredCall,
  ramiSmMessageSchema,
} from "../model/zod-schema/sm-message.js";
import type { z } from "zod";
import { insertMessage } from "../dao/stop_monitoring_message.js";
import type { Connection } from "mysql2/promise";
import { inTransaction } from "../util/database.js";
import { compact } from "lodash-es";

export function parseUDOTMessage(
  message: unknown,
): UnknownDelayOrTrackMessage | undefined {
  try {
    const parsedMessage = ramiSmMessageSchema.parse(message);

    return ramiSmMessageToUDOTMessage(parsedMessage);
  } catch (e) {
    logException(logger, e);
  }

  return undefined;
}

export async function saveSMMessage(
  id: string,
  trainNumber: number,
  trainDepartureDate: string,
  message: string,
): Promise<void> {
  await inTransaction(async (conn: Connection): Promise<void> => {
    // run all updates to db
    await insertMessage(conn, id, trainNumber, trainDepartureDate, message);
  });
}

function ramiSmMessageToUDOTMessage(
  message: z.infer<typeof ramiSmMessageSchema>,
): UnknownDelayOrTrackMessage {
  const data: UnknownDelayOrTrack[] = [];
  // @ts-ignore
  const mcj = message.payload.monitoredStopVisits[0].monitoredVehicleJourney;
  const monitoredCall = mcj.monitoredCall;
  const messageId = message.headers.e2eId;
  const vehicleJourneyName = mcj.vehicleJourneyName;
  const { trainNumber, departureDate } = parseTrain(vehicleJourneyName);

  data.push(...parseMonitoredCall(monitoredCall));

  mcj.onwardCalls.forEach((oc) => {
    data.push(...parseMonitoredCall(oc));
  });

  return { messageId, trainNumber, departureDate, vehicleJourneyName, data };
}

function parseMonitoredCall(
  mc: z.infer<typeof monitoredCall>,
): UnknownDelayOrTrack[] {
  const arrival: UnknownDelayOrTrack | undefined =
    !!mc.aimedArrivalTime && includeCall(mc)
      ? {
        stationShortCode: mc.stopPointRef,
        scheduledTime: new Date(mc.aimedArrivalTime),
        type: 0,
        unknownDelay: !mc.expectedArrivalTime,
        unknownTrack: !mc.arrivalStopAssignment.expectedQuayName,
      }
      : undefined;

  const departure: UnknownDelayOrTrack | undefined =
    !!mc.aimedDepartureTime && includeCall(mc)
      ? {
        stationShortCode: mc.stopPointRef,
        scheduledTime: new Date(mc.aimedDepartureTime),
        type: 1,
        unknownDelay: !mc.expectedDepartureTime,
        unknownTrack: !mc.departureStopAssignment.expectedQuayName,
      }
      : undefined;

  return compact([arrival, departure]);
}

function includeCall(mc: z.infer<typeof monitoredCall>): boolean {
  return mc.departureBoardingActivity === "boarding";
}

/**
 * Parse departure date and train number from VehicleJourneyName
 *
 * VehicleJourneyName has the following format:
 * YYYYMMDD1nnnnn[BUS]
 *
 * Meaning the departure date followed by 1 and then the train number with leading zeros, and might be followed with BUS
 *
 * For example "20240619108122"
 * For example "20240807100761BUS"
 */
function parseTrain(vehicleJourney: string): {
  departureDate: string;
  trainNumber: number;
} {
  const departureDate = vehicleJourney.substring(0, 8);
  const trainNumber = vehicleJourney.substring(9, 14);

  return {
    departureDate: `${departureDate.substring(0, 4)}-${
      departureDate.substring(4, 6)
    }-${departureDate.substring(6, 8)}`,
    trainNumber: Number.parseInt(trainNumber),
  };
}
