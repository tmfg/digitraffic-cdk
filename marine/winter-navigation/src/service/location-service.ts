import { type DTDatabase, inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import * as LocationDB from "../db/locations.js";
import * as LastUpdatedDB from "@digitraffic/common/dist/database/last-updated";

export const LOCATIONS_CHECK = "LOCATIONS_CHECK";

export function getLocations(): Promise<[unknown[], Date | null]> {
    return inDatabaseReadonly(async (db: DTDatabase) => {
        const locations = await LocationDB.getLocations(db);
        const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(db, LOCATIONS_CHECK);

        const apiLocations = locations.map(l => {
            return {
                id: l.id,
                name: l.name,
                type: l.type,
                locodeList: l.locode_list,
                nationality: l.nationality,
                latitude: l.latitude,
                longitude: l.longitude,
                winterport: l.winterport
            }});

        return [apiLocations, lastUpdated];
    });
}