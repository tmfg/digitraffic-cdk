import {RtzVoyagePlan} from "digitraffic-common/rtz/voyageplan";
import {inDatabaseReadonly} from "digitraffic-common/postgres/database";
import {IDatabase} from "pg-promise";
import * as CachedDao from "digitraffic-common/db/cached";
import {JSON_CACHE_KEY} from "digitraffic-common/db/cached";
import * as turf from "@turf/turf";
import {Feature} from "geojson";

const MAX_DISTANCE_NM = 15;

export async function findWarningsForVoyagePlan(voyagePlan: RtzVoyagePlan): Promise<any> {
    const warnings = await inDatabaseReadonly(async (db: IDatabase<any,any>) => {
        return CachedDao.getJsonFromCache(db, JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE);
    });

    if(!warnings) {
        return {};
    }

    const voyageLineString =
        turf.lineString(voyagePlan.route.waypoints
            .flatMap(w => w.waypoint.flatMap( wp => wp.position))
            .map(p => [p.$.lon, p.$.lat]));

    // filter out warnings not in the route
    warnings.features = warnings.features.filter((f: any) => !turf.booleanDisjoint(turf.buffer(f.geometry, MAX_DISTANCE_NM, {
        units: 'nauticalmiles'
    }), voyageLineString));

    return warnings;
}

/**
 * Find warning with the given id.
 *
 * The warnings are cached in database, so we get all active warnings then filter the one with given id
 * @param id
 */
export async function findWarning(id: number): Promise<Feature|null> {
    const warnings = await inDatabaseReadonly(async (db: IDatabase<any,any>) => {
        return CachedDao.getJsonFromCache(db, JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE);
    });

    if(!warnings) {
        return null;
    }

    return warnings.features.find((f: any) => f.properties.id === id);
}

