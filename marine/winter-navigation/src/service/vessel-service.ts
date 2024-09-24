import { type DTDatabase, inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import type { DTActivity, DTVessel } from "../model/dt-apidata.js";
import * as VesselDB from "../db/vessels.js";
import * as ActivityDB from "../db/activities.js";
import type { Activity, Vessel } from "../model/apidata.js";
import { groupBy } from "lodash-es";

export function getVessel(vesselId: string): Promise<[DTVessel | undefined, Date | undefined]> {
    return inDatabaseReadonly(async (db: DTDatabase) => {
        const vessel = await VesselDB.getVessel(db, vesselId);
        const lastUpdated = undefined;

        if(!vessel) {
            return Promise.resolve([undefined, lastUpdated ?? undefined]);
        }

        const activities = await ActivityDB.getActivities(db);
//        const restrictions = await RestrictionsDB.getRestrictions(db);
        const dtVessels = convertVessels([vessel], activities);

        return [dtVessels[0], lastUpdated ?? undefined];
    });
}

export function getVessels(): Promise<[DTVessel[], Date | undefined]> {
    return inDatabaseReadonly(async (db: DTDatabase) => {
        const vessels = await VesselDB.getVessels(db);
        const activities = await ActivityDB.getActivities(db);
        const lastUpdated = undefined;
        const dtVessels = convertVessels(vessels, activities);

        return [dtVessels, lastUpdated ?? undefined];
    });

}

function convertVessels(vessels: Vessel[], activities: Activity[]): DTVessel[] {
    const activityMap = groupBy(activities, "vessel_id");

    return vessels.map(v => convertVessel(v, activityMap));
}

function convertVessel(v: Vessel, activityMap: Record<string, Activity[]>): DTVessel {
    const dbActivities = activityMap[v.id];
    const activities = dbActivities ? convertActivities(dbActivities) : undefined

    return {
        name: v.name,
        callSign: v.callsign,
        shortcode: v.shortcode,
        mmsi: v.mmsi,
        imo: v.imo,
        activities
    };
}

function convertActivities(activities: Activity[]): DTActivity[] {
    return activities.map(a => {
        return {
            type: a.type,
            reason: a.reason,
            publicComment: a.public_comment,
            startTime: a.start_time,
            endTime: a.end_time
        } satisfies DTActivity;
    });
}

