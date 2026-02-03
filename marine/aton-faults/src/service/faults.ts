import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import * as LastUpdatedDB from "@digitraffic/common/dist/database/last-updated";
import type { Language } from "@digitraffic/common/dist/types/language";
import { createFeatureCollection } from "@digitraffic/common/dist/utils/geometry";

import type { Feature, FeatureCollection, GeometryObject } from "geojson";
import { Geometry } from "wkx";
import * as FaultsDB from "../db/faults.js";
import type { DbFault } from "../model/fault.js";

export const ATON_FAULTS_CHECK = "ATON_FAULTS_CHECK";

export interface FaultProps {
  readonly id: number;
  readonly entry_timestamp: Date;
  // eslint-disable-next-line @rushstack/no-new-null
  readonly fixed_timestamp: Date | null;
  readonly type: string;
  readonly domain: string;
  readonly state: string;
  readonly fixed: boolean;
  readonly aton_id: number;
  readonly aton_name_fi: string;
  readonly aton_name_sv: string;
  readonly aton_type: string;
  readonly fairway_number: number;
  readonly fairway_name_fi: string;
  readonly fairway_name_sv: string;
  readonly area_number: number;
  readonly area_description: string;
}

export function findAllFaults(
  language: Language,
  fixedInHours: number,
  // eslint-disable-next-line @rushstack/no-new-null
): Promise<[FeatureCollection, Date | null]> {
  return inDatabaseReadonly(async (db: DTDatabase) => {
    const features = await FaultsDB.findAll(
      db,
      language,
      fixedInHours,
      convertFeature,
    );
    const lastUpdated = await LastUpdatedDB.getUpdatedTimestamp(
      db,
      ATON_FAULTS_CHECK,
    );

    return [createFeatureCollection(features, lastUpdated), lastUpdated];
  });
}

function convertFeature(fault: DbFault): Feature {
  const properties: FaultProps = {
    id: fault.id,
    entry_timestamp: fault.entry_timestamp,
    fixed_timestamp: fault.fixed_timestamp,
    type: fault.aton_fault_type,
    domain: fault.domain,
    state: fault.state,
    fixed: fault.fixed,
    aton_id: fault.aton_id,
    aton_name_fi: fault.aton_name_fi,
    aton_name_sv: fault.aton_name_sv,
    aton_type: fault.aton_type,
    fairway_number: fault.fairway_number,
    fairway_name_fi: fault.fairway_name_fi,
    fairway_name_sv: fault.fairway_name_sv,
    area_number: fault.area_number,
    area_description: fault.area_description,
  };

  // convert geometry from db to geojson
  const geometry = Geometry.parse(
    Buffer.from(fault.geometry, "hex"),
  ).toGeoJSON() as GeometryObject;

  return {
    type: "Feature",
    properties: properties,
    geometry,
  };
}
