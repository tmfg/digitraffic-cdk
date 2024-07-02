import { type DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import { parseISO } from "date-fns";
import * as MaintenanceTrackingDb from "../dao/maintenance-tracking-dao.js";
import { type DbObservationData, Status } from "../dao/maintenance-tracking-dao.js";
import { type DbNumberId } from "../model/db-data.js";
import { type Havainto, type TyokoneenseurannanKirjaus } from "../model/models.js";
import crypto from "crypto";
import { logger, type LoggerMethodType } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import _ from "lodash";

const matchViestitunnisteRegex = /"viestintunniste"\s*:\s*{\s*"id"\s*:\s*[0-9]*\s*}\s*,/;

const service = "MaintenanceTrackingService" as const;

export async function saveMaintenanceTrackingObservationData(
    observationDatas: DbObservationData[]
): Promise<number> {
    const a: (DbNumberId | undefined)[] = await inDatabase((db: DTDatabase) => {
        return MaintenanceTrackingDb.insertMaintenanceTrackingObservationData(db, observationDatas);
    });
    // Returns array [{"id":89},null,null,{"id":90}] -> nulls are conflicting ones not inserted
    return a.filter((id) => id !== undefined).length;
}

export function cleanMaintenanceTrackingData(hoursToKeep: number): Promise<void> {
    const method = `${service}.cleanMaintenanceTrackingData` satisfies LoggerMethodType;
    return inDatabase(async (db: DTDatabase) => {
        return MaintenanceTrackingDb.getOldestTrackingHours(db).then(async (limitHours) => {
            logger.info({
                method,
                message: `oldestHours ${limitHours} and hoursToKeep ${hoursToKeep}`
            });

            while (limitHours >= hoursToKeep) {
                logger.info({
                    method,
                    message: `limitHours ${limitHours}`
                });
                await MaintenanceTrackingDb.cleanMaintenanceTrackingData(db, limitHours);
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

export async function handleMessage(
    payload: TyokoneenseurannanKirjaus
): Promise<void> {
    const method = `${service}.handleMessage` satisfies LoggerMethodType;
    const trackingJson = payload;
    const trackingJsonString = JSON.stringify(payload);
    const messageSizeBytes = Buffer.byteLength(trackingJsonString);
    const sendingTime = parseISO(trackingJson.otsikko.lahetysaika);

    if (!trackingJson.otsikko.lahettaja.jarjestelma) {
        logger.warn({
            method,
            message: `observations sendingSystem is empty using UNKNOWN otsikko ${JSON.stringify(trackingJson.otsikko)}`
        });
    }

    const sendingSystem = _.get(trackingJson, ["otsikko", "lahettaja", "jarjestelma"], "UNKNOWN");
    const observationDatas: MaintenanceTrackingDb.DbObservationData[] = trackingJson.havainnot.map(
        (havainto: Havainto) =>
            convertToDbObservationData(havainto, sendingTime, sendingSystem, "TODO unknown")
    );

    try {
        const start = Date.now();
        const insertCount: number = await saveMaintenanceTrackingObservationData(
            observationDatas
        );
        const end = Date.now();
        logger.info({
            method,
            message: `observations messageSendingTime=${sendingTime.toISOString()}`,
            tookMs: end - start,
            customDomain: "state-roads",
            customInsertCount: insertCount,
            customCount: observationDatas.length,
            customSizeBytes: messageSizeBytes
        });
    } catch (e) {
        const clones = MaintenanceTrackingDb.cloneObservationsWithoutJson(observationDatas);
        logger.error({
            method,
            message: `Error while handling tracking from SQS to db observationDatas: ${JSON.stringify(
                clones
            )}`,
            error: e
        });
        return Promise.reject(e);
    }
    return Promise.resolve();
}
