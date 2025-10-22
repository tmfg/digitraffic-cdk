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
import type { Feature, Geometry, Point } from "geojson";

export const LOCATIONS_CHECK = "LOCATIONS_CHECK";

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

    return [convertToFeature(location), lastUpdated ?? undefined];
  });
}

export function getLocations(): Promise<
  [LocationFeatureCollection, Date | undefined]
> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const locations = await LocationDB.getLocations(db);
    const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(
      db,
      LOCATIONS_CHECK,
    );
    const featureCollection = convertToFeatureCollection(locations);
    return [featureCollection, lastUpdated ?? undefined];
  });
}

function convertToFeatureCollection(
  locations: LocationWithRelations[],
): LocationFeatureCollection {
  const features = locations.map(convertToFeature);
  return {
    type: "FeatureCollection",
    features,
  };
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
    endTime: s.end_time,
    prenotification: s.prenotification,
    portsClosed: s.ports_closed,
    dueTo: s.due_to,
    specifications: s.specifications,
  };
}

function convertRestriction(r: Restriction): DTRestriction {
  return {
    startTime: r.start_time,
    endTime: r.end_time,
    textCompilation: r.text_compilation,
  } satisfies DTRestriction;
}
