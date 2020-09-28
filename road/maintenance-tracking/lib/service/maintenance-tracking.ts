import * as MaintenanceTrackingDB from "../db/db-maintenance-tracking"
import {DbMaintenanceTrackingData, Status} from "../db/db-maintenance-tracking"
import {inDatabase} from "../../../../common/postgres/database";
import {IDatabase} from "pg-promise";
import forge from "node-forge";

const matchViestitunnisteRegex = /"viestintunniste"\s*:\s*{\s*"id"\s*:\s*[0-9]*\s*}\s*,/;

export async function saveMaintenanceTrackingData(maintenanceTrackingDataJson: string): Promise<any | undefined> {
    return await inDatabase(async (db: IDatabase<any, any>) => {
        const dbMaintenanceTrackingData: DbMaintenanceTrackingData = {
            json: maintenanceTrackingDataJson,
            status: Status.UNHANDLED,
            hash: createHash(maintenanceTrackingDataJson)
        };
        return await db.tx(async () => {
            const value = await MaintenanceTrackingDB.insertMaintenanceTrackingData(db, dbMaintenanceTrackingData);
            console.info(`Return value ${JSON.stringify(value)}`);
            return value;
        });
    });
}

export function createHash(maintenanceTrackingDataJson: string) : string {
    // Strip away viestitunniste that changes between messages. We are interested only from the data around it.
    const data = maintenanceTrackingDataJson.replace(matchViestitunnisteRegex, '');
    const md = forge.md.sha256.create();
    md.update(data, 'utf8');
    const hash = md.digest().toHex();
    console.info(`method=createHash data: ${data} hash: ${hash}`);
    return hash;
}