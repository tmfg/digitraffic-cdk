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
import type { Feature, Geometry } from "geojson";
import type {
  Location,
  LocationFeature,
  LocationFeatureCollection,
  Restriction,
  Suspension,
} from "../model/public-api-model.js";
import { LOCATIONS_CHECK } from "../keys.js";
import { createFeatureCollection } from "../util.js";

export function getLocation(
  locode: string,
): Promise<[Feature<Geometry | null, Location> | undefined, Date | undefined]> {
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
  [LocationFeatureCollection, Date | undefined]
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
  const geometry = location.longitude && location.latitude
    ? {
      type: "Point" as const,
      coordinates: [location.longitude, location.latitude],
    }
    : null;
  return {
    type: "Feature",
    geometry,
    properties: {
      name: location.name,
      type: location.type,
      locodeList: location.locode_list,
      nationality: location.nationality,
      winterport: location.winterport,
      restrictions: (location.restrictions && location.restrictions.length > 0)
        ? location.restrictions.map(convertRestriction)
        : null,
      suspensions: (location.suspensions && location.suspensions.length > 0)
        ? location.suspensions.map(convertSuspension)
        : null,
    },
  };
}

function convertSuspension(s: SuspensionDTO): Suspension {
  return {
    startTime: s.start_time,
    endTime: s.end_time ?? null,
    prenotification: s.prenotification,
    portsClosed: s.ports_closed,
    dueTo: s.due_to,
    // field name is in plural in the database but in the source data it is singular
    specifications: s.specifications ?? null,
  };
}

function convertRestriction(r: RestrictionDTO): Restriction {
  return {
    startTime: r.start_time,
    endTime: r.end_time ?? null,
    textCompilation: r.text_compilation,
  };
}
