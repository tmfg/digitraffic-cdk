import * as CachedDao from "@digitraffic/common/dist/database/cached";
import {
  type DTDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import type { RtzVoyagePlan } from "@digitraffic/common/dist/marine/rtz";
import { booleanDisjoint, buffer, lineString } from "@turf/turf";
import type { Feature, LineString } from "geojson";
import type {
  WarningFeature,
  WarningFeatureCollection,
} from "../model/warnings.js";

const MAX_DISTANCE_NM = 15;

export async function findWarningsForVoyagePlan(
  voyagePlan: RtzVoyagePlan,
): Promise<WarningFeatureCollection | undefined> {
  const warnings = await inDatabaseReadonly((db: DTDatabase) => {
    return CachedDao.getJsonFromCache<WarningFeatureCollection>(
      db,
      CachedDao.JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE,
    );
  });

  if (!warnings) {
    return undefined;
  }

  const voyageLineString = lineString(
    voyagePlan.route.waypoints
      .flatMap((w) => w.waypoint.flatMap((wp) => wp.position))
      .map((p) => [p.$.lon, p.$.lat]),
  );

  // filter out warnings not in the route
  warnings.features = warnings.features.filter((f: Feature) => {
    const feature = (f as Feature<LineString>).geometry;
    const buffered = buffer(feature, MAX_DISTANCE_NM, {
      units: "nauticalmiles",
    });

    return buffered && !booleanDisjoint(buffered, voyageLineString);
  });

  return warnings;
}

/**
 * Find warning with the given id.
 *
 * The warnings are cached in database, so we get all active warnings then filter the one with given id
 * @param db
 * @param id
 */
export async function findWarning(
  db: DTDatabase,
  id: number,
): Promise<WarningFeature | undefined> {
  const warnings = await CachedDao.getJsonFromCache<WarningFeatureCollection>(
    db,
    CachedDao.JSON_CACHE_KEY.NAUTICAL_WARNINGS_ACTIVE,
  );

  if (!warnings) {
    return undefined;
  }

  return warnings.features.find((f: WarningFeature) =>
    f.properties.id === id
  ) ?? undefined;
}
