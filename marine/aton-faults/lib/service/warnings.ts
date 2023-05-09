import { RtzVoyagePlan } from "@digitraffic/common/dist/marine/rtz";
import { DTDatabase, inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import * as CachedDao from "@digitraffic/common/dist/database/cached";
import booleanDisjoint from "@turf/boolean-disjoint";
import buffer from "@turf/buffer";
import { lineString } from "@turf/helpers";
import { Feature, FeatureCollection } from "geojson";

const MAX_DISTANCE_NM = 15;

export async function findWarningsForVoyagePlan(
    voyagePlan: RtzVoyagePlan
): Promise<FeatureCollection | undefined> {
    const warnings = await inDatabaseReadonly((db: DTDatabase) => {
        return CachedDao.getJsonFromCache<FeatureCollection>(
            db,
            CachedDao.JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE
        );
    });

    if (!warnings) {
        return undefined;
    }

    const voyageLineString = lineString(
        voyagePlan.route.waypoints
            .flatMap((w) => w.waypoint.flatMap((wp) => wp.position))
            .map((p) => [p.$.lon, p.$.lat])
    );

    // filter out warnings not in the route
    warnings.features = warnings.features.filter(
        (f: Feature) =>
            !booleanDisjoint(
                buffer(f.geometry, MAX_DISTANCE_NM, {
                    units: "nauticalmiles"
                }),
                voyageLineString
            )
    );

    return warnings;
}

/**
 * Find warning with the given id.
 *
 * The warnings are cached in database, so we get all active warnings then filter the one with given id
 * @param db
 * @param id
 */
export async function findWarning(db: DTDatabase, id: number): Promise<Feature | undefined> {
    const warnings = await CachedDao.getJsonFromCache<FeatureCollection>(
        db,
        CachedDao.JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE
    );

    if (!warnings) {
        return undefined;
    }

    return warnings.features.find((f: Feature) => f.properties?.id === id) ?? undefined;
}
