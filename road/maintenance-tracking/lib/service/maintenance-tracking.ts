import * as MaintenanceTrackingDB from "../db/db-maintenance-tracking"
import {DbMaintenanceTrackingData, Status} from "../db/db-maintenance-tracking"
import {inDatabase} from "../../../../common/postgres/database";
import {IDatabase} from "pg-promise";

const crypto = require('crypto');

const matchViestitunnisteRegex = /"viestintunniste"\s*:\s*{\s*"id"\s*:\s*[0-9]*\s*}\s*,/;
export async function saveMaintenanceTrackingData(maintenanceTrackingDataJson: string, sendingTime: Date): Promise<any | undefined> {
    return await inDatabase(async (db: IDatabase<any, any>) => {
        const dbMaintenanceTrackingData: DbMaintenanceTrackingData = {
            json: maintenanceTrackingDataJson,
            status: Status.UNHANDLED,
            hash: createHash(maintenanceTrackingDataJson),
            sendingTime: sendingTime
        };
        return await db.tx(async () => {
            return await MaintenanceTrackingDB.insertMaintenanceTrackingData(db, dbMaintenanceTrackingData);
        });
    });

}

export function createHash(maintenanceTrackingDataJson: string) : string {
    // Strip away viestitunniste that changes between messages. We are interested only from the data around it.
    const data = maintenanceTrackingDataJson.replace(matchViestitunnisteRegex, '');
    return crypto.createHash("sha256").update(data).digest("hex");
}