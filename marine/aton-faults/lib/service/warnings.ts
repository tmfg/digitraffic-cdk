import {RtzVoyagePlan} from "digitraffic-common/rtz/voyageplan";
import {DTDatabase, inDatabaseReadonly} from "digitraffic-common/postgres/database";
import * as CachedDao from "digitraffic-common/db/cached";
import {JSON_CACHE_KEY} from "digitraffic-common/db/cached";
import * as turf from "@turf/turf";
import {Feature, FeatureCollection} from "geojson";

const MAX_DISTANCE_NM = 15;

export async function findWarningsForVoyagePlan(voyagePlan: RtzVoyagePlan): Promise<FeatureCollection|null> {
    const warnings = await inDatabaseReadonly(async (db: DTDatabase) => {
        return CachedDao.getJsonFromCache(db, JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE);
    }) as FeatureCollection;

    if(!warnings) {
        return null;
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
export async function findWarning(db: DTDatabase, id: number): Promise<Feature|undefined> {
    const warnings = await CachedDao.getJsonFromCache(db, JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE) as FeatureCollection;

    if(!warnings) {
        return undefined;
    }

    return warnings.features.find((f: any) => f.properties.id === id);
}

