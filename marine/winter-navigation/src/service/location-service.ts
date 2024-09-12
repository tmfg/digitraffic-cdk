import { type DTDatabase, inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import { type DTLocation, type DTRestriction, type DTSuspension } from "../model/dt-apidata.js";
import * as LocationDB from "../db/locations.js";
import * as RestrictionsDB from "../db/restrictions.js";
import * as SuspensionDB from "../db/port-suspensions.js";
import * as LastUpdatedDB from "@digitraffic/common/dist/database/last-updated";
import type { Location, Restriction } from "../model/apidata.js";
import { groupBy } from "lodash-es";
import type { PortSuspensionWithLocations } from "../model/db-models.js";

export const LOCATIONS_CHECK = "LOCATIONS_CHECK";

export function getLocation(locationId: string): Promise<[DTLocation | undefined, Date | undefined]> {
    return inDatabaseReadonly(async (db: DTDatabase) => {
        const location = await LocationDB.getLocation(db, locationId);
        const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(db, LOCATIONS_CHECK);        

        if(!location) {
            return Promise.resolve([undefined, lastUpdated ?? undefined]);
        }

        const restrictions = await RestrictionsDB.getRestrictions(db);
        const suspensions = await SuspensionDB.getSuspensions(db);      
        const dtLocations = convertLocations([location], restrictions, suspensions);

        return [dtLocations[0], lastUpdated ?? undefined];
    });
}


export function getLocations(): Promise<[DTLocation[], Date | undefined]> {
    return inDatabaseReadonly(async (db: DTDatabase) => {
        const locations = await LocationDB.getLocations(db);
        const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(db, LOCATIONS_CHECK);        
        const restrictions = await RestrictionsDB.getRestrictions(db);
        const suspensions = await SuspensionDB.getSuspensions(db);      
        const dtLocations = convertLocations(locations, restrictions, suspensions);

        return [dtLocations, lastUpdated ?? undefined];
    });
}

function convertLocations(locations: Location[], restrictions: Restriction[], suspensions: PortSuspensionWithLocations[]): DTLocation[] {
    const restrictionMap = groupBy(restrictions, "location_id");
    const suspensionMap = groupBy(suspensions, "location_id");

    return locations.map(l => convertLocation(l, restrictionMap, suspensionMap));
}

function convertLocation(l: Location, restrictionMap: Record<string, Restriction[]>, suspensionMap: Record<string, PortSuspensionWithLocations[]>): DTLocation {
    const dbRestrictions = restrictionMap[l.id];
    const dbSuspensions = suspensionMap[l.id];

    const restrictions = dbRestrictions ? convertRestrictions(dbRestrictions) : undefined;
    const suspensions = dbSuspensions ? convertSuspensions(dbSuspensions) : undefined;

    return {
        name: l.name,
        type: l.type,
        locodeList: l.locode_list,
        nationality: l.nationality,
        latitude: l.latitude,
        longitude: l.longitude,
        winterport: l.winterport,
        restrictions,
        suspensions
    } satisfies DTLocation
}

function convertRestrictions(restrictions: Restriction[]): DTRestriction[]{
    return restrictions.map(r => {
        return {
            startTime: r.start_time,
            endTime: r.end_time,
            textCompilation: r.text_compilation
        } satisfies DTRestriction
    });
}

function convertSuspensions(suspensions: PortSuspensionWithLocations[]): DTSuspension[] {
    return suspensions.map(s => {
        return {
            startTime: s.start_time,
            endTime: s.end_time,
            prenotification: s.prenotification,
            portsClosed: s.ports_closed,
            dueTo: s.due_to,
            specifications: s.specifications
        } satisfies DTSuspension
    })
}
