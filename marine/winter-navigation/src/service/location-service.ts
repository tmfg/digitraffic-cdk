import {
  type DTDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import {
  type DTLocation,
  type DTRestriction,
  type DTSuspension,
  type LocationFeatureCollection,
} from "../model/dt-apidata.js";
import * as LocationDB from "../db/locations.js";
import * as LastUpdatedDB from "@digitraffic/common/dist/database/last-updated";
import type { PortSuspension, Restriction } from "../model/apidata.js";
import type { LocationWithRelations } from "../model/db-models.js";
import type { Feature, FeatureCollection, Geometry, Point } from "geojson";
import { createFeatureCollection } from "@digitraffic/common/dist/utils/geometry";

export const LOCATIONS_CHECK = "WN_LOCATION_CHECK";

export function getLocation(
  locationId: string,
): Promise<[Feature<Geometry, DTLocation> | undefined, Date | undefined]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const location = await LocationDB.getLocation(db, locationId);
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
  location: LocationWithRelations,
): Feature<Point, DTLocation> {
  return {
    type: "Feature",
    id: location.id,
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

function convertSuspension(s: PortSuspension): DTSuspension {
  return {
    startTime: s.start_time,
    ...(s.end_time && { endTime: s.end_time }),
    prenotification: s.prenotification,
    portsClosed: s.ports_closed,
    dueTo: s.due_to,
    ...(s.specifications && { specifications: s.specifications }),
  };
}

function convertRestriction(r: Restriction): DTRestriction {
  return {
    startTime: r.start_time,
    ...(r.end_time && { endTime: r.end_time }),
    textCompilation: r.text_compilation,
  } satisfies DTRestriction;
}
