import {
  type DTDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import * as LocationDB from "../db/locations.js";
import * as LastUpdatedDB from "@digitraffic/common/dist/database/last-updated";
import type {
  LocationDTO,
  RestrictionDTO,
  SuspensionDTO,
} from "../model/dto-model.js";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { createFeatureCollection } from "@digitraffic/common/dist/utils/geometry";
import type {
  Location,
  LocationFeature,
  Restriction,
  Suspension,
} from "../model/public-api-model.js";

export const LOCATIONS_CHECK = "WN_LOCATION_CHECK";

export function getLocation(
  locode: string,
): Promise<[Feature<Geometry, Location> | undefined, Date | undefined]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const location = await LocationDB.getLocation(db, locode);
    const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(
      db,
      LOCATIONS_CHECK,
    );

    if (!location) {
      return Promise.resolve([undefined, lastUpdated ?? undefined]);
    }

    return [{
      ...convertToFeature(location),
      lastUpdated,
    }, lastUpdated ?? undefined];
  });
}

export function getLocations(): Promise<
  [FeatureCollection, Date | undefined]
> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const locations = await LocationDB.getLocations(db);
    const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(
      db,
      LOCATIONS_CHECK,
    );
    const featureCollection = createFeatureCollection(
      locations.map(convertToFeature),
      lastUpdated,
    );
    return [featureCollection, lastUpdated ?? undefined];
  });
}

function convertToFeature(
  location: LocationDTO,
): LocationFeature {
  return {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [location.longitude, location.latitude],
    },
    properties: {
      name: location.name,
      type: location.type,
      locodeList: location.locode_list,
      nationality: location.nationality,
      winterport: location.winterport,
      ...(location.restrictions && location.restrictions.length > 0 &&
        { restrictions: location.restrictions.map(convertRestriction) }),
      ...(location.suspensions && location.suspensions.length > 0 &&
        { suspensions: location.suspensions.map(convertSuspension) }),
    },
  };
}

function convertSuspension(s: SuspensionDTO): Suspension {
  return {
    startTime: s.start_time,
    ...(s.end_time && { endTime: s.end_time }),
    prenotification: s.prenotification,
    portsClosed: s.ports_closed,
    dueTo: s.due_to,
    // field name is in plural in the database but in the source data it is singular
    ...(s.specifications && { specifications: s.specifications }),
  };
}

function convertRestriction(r: RestrictionDTO): Restriction {
  return {
    startTime: r.start_time,
    ...(r.end_time && { endTime: r.end_time }),
    textCompilation: r.text_compilation,
  };
}
