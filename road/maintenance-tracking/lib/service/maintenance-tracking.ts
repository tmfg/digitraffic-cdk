import * as MaintenanceTrackingDB from "../db/db-maintenance-tracking"
import {DbMaintenanceTrackingData, Status} from "../db/db-maintenance-tracking"
import {inDatabase} from "../../../../common/postgres/database";
import {IDatabase} from "pg-promise";

export async function saveMaintenanceTrackingData(maintenanceTrackingDataJson: string): Promise<any | undefined> {
    return await inDatabase(async (db: IDatabase<any, any>) => {
        const dbMaintenanceTrackingData: DbMaintenanceTrackingData = {
            json: maintenanceTrackingDataJson,
            status: Status.UNHANDLED
        };
        return await db.tx(t => {
            const queries = [
                MaintenanceTrackingDB.insertMaintenanceTrackingData(db, dbMaintenanceTrackingData),
            ];
            return t.batch(queries);
        });
    });
}