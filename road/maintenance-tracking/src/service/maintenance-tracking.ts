import { DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import { parseISO } from "date-fns";
import * as MaintenanceTrackingDB from "../dao/maintenance-tracking-dao";
import { DbObservationData, Status } from "../dao/maintenance-tracking-dao";
import { DbNumberId } from "../model/db-data";
import { Havainto } from "../model/models";
import crypto from "crypto";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

const matchViestitunnisteRegex = /"viestintunniste"\s*:\s*{\s*"id"\s*:\s*[0-9]*\s*}\s*,/;

export async function saveMaintenanceTrackingObservationData(
    observationDatas: DbObservationData[]
): Promise<number> {
    const a: (DbNumberId | undefined)[] = await inDatabase((db: DTDatabase) => {
        return MaintenanceTrackingDB.insertMaintenanceTrackingObservationData(db, observationDatas);
    });
    // Returns array [{"id":89},null,null,{"id":90}] -> nulls are conflicting ones not inserted
    return a.filter((id) => id !== undefined).length;
}

export function cleanMaintenanceTrackingData(hoursToKeep: number): Promise<void> {
    return inDatabase(async (db: DTDatabase) => {
        return MaintenanceTrackingDB.getOldestTrackingHours(db).then(async (limitHours) => {
            logger.info({
                method: "MaintenanceTrackingService.cleanMaintenanceTrackingData",
                message: `oldestHours ${limitHours} and hoursToKeep ${hoursToKeep}`
            });

            while (limitHours >= hoursToKeep) {
                logger.info({
                    method: "MaintenanceTrackingService.cleanMaintenanceTrackingData",
                    message: `limitHours ${limitHours}`
                });
                await MaintenanceTrackingDB.cleanMaintenanceTrackingData(db, limitHours);
                limitHours--;
            }
            return Promise.resolve();
        });
    });
}

export function createMaintenanceTrackingMessageHash(maintenanceTrackingDataJson: string): string {
    // Strip away viestitunniste that changes between messages. We are interested only from the data around it.
    const data = maintenanceTrackingDataJson.replace(matchViestitunnisteRegex, "");
    return crypto.createHash("sha256").update(data).digest("hex");
}

export function createObservationHash(maintenanceTrackingObservationDataJson: string): string {
    return crypto.createHash("sha256").update(maintenanceTrackingObservationDataJson).digest("hex");
}

export function convertToDbObservationData(
    item: Havainto,
    sendingTime: Date,
    sendingSystem: string,
    s3Uri: string
): DbObservationData {
    const observationJson = JSON.stringify(item.havainto);
    const observationTime = parseISO(item.havainto.havaintoaika);
    const harjaContractId = item.havainto.urakkaid;
    const harjaWorkmachineId = item.havainto.tyokone.id;
    return {
        observationTime: observationTime,
        sendingTime: sendingTime,
        json: observationJson,
        harjaWorkmachineId: harjaWorkmachineId,
        harjaContractId: harjaContractId,
        sendingSystem: sendingSystem,
        status: Status.UNHANDLED,
        hash: createObservationHash(observationJson),
        s3Uri: s3Uri
    };
}
