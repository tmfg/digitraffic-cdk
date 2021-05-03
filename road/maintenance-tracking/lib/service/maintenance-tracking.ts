import * as MaintenanceTrackingDB from "../db/maintenance-tracking"
import {DbObservationData, Status} from "../db/maintenance-tracking"
import {inDatabase} from "../../../../common/postgres/database";
import {IDatabase} from "pg-promise";
import moment from "moment-timezone";
import {Havainto} from "../lambda/process-queue/lambda-process-queue";

const crypto = require('crypto');

const matchViestitunnisteRegex = /"viestintunniste"\s*:\s*{\s*"id"\s*:\s*[0-9]*\s*}\s*,/;

export async function saveMaintenanceTrackingObservationData(observationDatas: DbObservationData[]): Promise<number> {
    const a : [] = await inDatabase(async (db: IDatabase<any, any>) => {
        return await MaintenanceTrackingDB.insertMaintenanceTrackingObservationData(db, observationDatas);
    });
    // Returns array [{"id":89},null,null,{"id":90}] -> nulls are conflicting ones not inserted
    return a.filter(id => id != null).length
}

export function createMaintenanceTrackingMessageHash(maintenanceTrackingDataJson: string) : string {
    // Strip away viestitunniste that changes between messages. We are interested only from the data around it.
    const data = maintenanceTrackingDataJson.replace(matchViestitunnisteRegex, '');
    return crypto.createHash("sha256").update(data).digest("hex");
}

export function createObservationHash(maintenanceTrackingObservationDataJson: string) : string {
    return crypto.createHash("sha256").update(maintenanceTrackingObservationDataJson).digest("hex");
}

export function convertToDbObservationData(item: Havainto, sendingTime: Date, sendingSystem: string, s3Uri: string) {
    const observationJson = JSON.stringify(item.havainto);
    const observationTime = moment(item.havainto.havaintoaika).toDate()
    const harjaContractId = item.havainto.urakkaid;
    const harjaWorkmachineId = item.havainto.tyokone.id;
    const data: DbObservationData = {
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
    // console.info("method=convertToDbObservationData havainto: ", JSON.stringify(data));
    return data;
}