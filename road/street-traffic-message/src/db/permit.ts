import type {
  DTDatabase,
  DTTransaction,
} from "@digitraffic/common/dist/database/database";
import { PreparedStatement } from "pg-promise";
import type { ApiPermit, DbPermit } from "../model/permit.js";
import type {
  Feature,
  FeatureCollection,
  Geometry as GeoJSONGeometry,
  Point,
} from "geojson";
import { Geometry } from "wkx";

// multiple geometries related to a single permit are contained inside otherwise duplicated fields in Lahti source data
const SQL_INSERT_PERMIT_OR_UPDATE_GEOMETRY = `INSERT INTO permit
    (id, source_id, source, permit_type, permit_subject, effective_from, effective_to, created, modified, version, geometry)
    VALUES
    (DEFAULT, $1, $2, $3, $4, $5, $6, NOW(), NOW(), DEFAULT, ST_ForceCollection(ST_Transform(ST_GeomFromGML($7), 4326)))
    ON CONFLICT (source_id, source) 
    DO UPDATE 
    SET geometry=ST_ForceCollection(ST_Collect(ARRAY(SELECT (ST_Dump(geometry)).geom FROM permit WHERE source_id=$1 AND source=$2) 
     || ST_Transform(ST_GeomFromGML($7), 4326)))`;

interface PermitsGeoJSON {
  collection: FeatureCollection;
}

const SQL_FIND_ALL_PERMITS_GEOJSON = `select json_build_object(
        'type', 'FeatureCollection', 
        'features', coalesce(json_agg(
             json_build_object(
                     'type', 'Feature',
                     'geometry', ST_AsGeoJSON(ST_SNAPTOGRID(geometry, 0.00001)::geometry)::json,
                     'properties', json_build_object(
                         'id', id,
                         'version', version,
                         'permitType', permit_type,
                         'subject', permit_subject,
                         'effectiveFrom', effective_from,
                         'effectiveTo', effective_to,
                         'created', created,
                         'modified', modified
                     )
                 )
             ), '[]')
        ) as collection
     from permit where removed=false`;

const SQL_FIND_ALL_PERMITS = `select id, 
    version, 
    permit_type, 
    permit_subject, 
    geometry, 
    effective_from, 
    effective_to, 
    created, 
    modified,
    source,
    source_id,
    ST_CENTROID(geometry) centroid
from permit`;

const SQL_FIND_ALL_PERMIT_SOURCE_IDS = "SELECT source_id FROM permit";

const SQL_SET_PERMIT_REMOVED =
  `UPDATE permit SET removed=true WHERE source_id=$1`;

const PS_INSERT_PERMIT_OR_UPDATE_GEOMETRY = new PreparedStatement({
  name: "insert-permit-or-update-geometry",
  text: SQL_INSERT_PERMIT_OR_UPDATE_GEOMETRY,
});

const PS_FIND_ALL_GEOJSON = new PreparedStatement({
  name: "find-all-permits-geojson",
  text: SQL_FIND_ALL_PERMITS_GEOJSON,
});

type FindAllPermits = {
  id: number;
  version: number;
  permit_type: string;
  permit_subject: string;
  geometry: string;
  effective_from: Date;
  effective_to: Date;
  created: Date;
  modified: Date;
  source: string;
  source_id: string;
  centroid: string;
}[];

const PS_FIND_ALL = new PreparedStatement({
  name: "find-all-permits",
  text: SQL_FIND_ALL_PERMITS,
});

const PS_FIND_ALL_SOURCE_IDS = new PreparedStatement({
  name: "find-all-permit-source-ids",
  text: SQL_FIND_ALL_PERMIT_SOURCE_IDS,
});

const PS_SET_PERMIT_REMOVED = new PreparedStatement({
  name: "set-permit-removed",
  text: SQL_SET_PERMIT_REMOVED,
});

export function insertPermits(
  db: DTTransaction,
  permits: ApiPermit[],
): Promise<null[]> {
  return Promise.all(
    permits.map((permit) =>
      db.none(PS_INSERT_PERMIT_OR_UPDATE_GEOMETRY, [
        permit.sourceId,
        permit.source,
        permit.permitType,
        permit.permitSubject,
        permit.effectiveFrom,
        permit.effectiveTo,
        permit.gmlGeometryXmlString,
      ])
    ),
  );
}

export function setRemovedPermits(
  db: DTTransaction,
  permitIdList: string[],
): Promise<null[]> {
  return Promise.all(
    permitIdList.map((permitId) => db.none(PS_SET_PERMIT_REMOVED, [permitId])),
  );
}

export function getActivePermitsGeojson(
  db: DTDatabase,
): Promise<FeatureCollection> {
  return db.one(PS_FIND_ALL_GEOJSON).then((result: PermitsGeoJSON) =>
    result.collection
  );
}

export function getActivePermits(db: DTDatabase): Promise<DbPermit[]> {
  return db.manyOrNone(PS_FIND_ALL).then((results: FindAllPermits) =>
    results.map(
      (result) =>
        ({
          id: result.id,
          sourceId: result.source_id,
          source: result.source,
          version: result.version,
          permitSubject: result.permit_subject,
          permitType: result.permit_type,
          geometry: Geometry.parse(
            Buffer.from(result.geometry, "hex"),
          ).toGeoJSON() as GeoJSONGeometry,
          centroid: Geometry.parse(Buffer.from(result.centroid, "hex"))
            .toGeoJSON() as Point,
          effectiveFrom: result.effective_from,
          effectiveTo: result.effective_to,
          created: result.created,
          modified: result.modified,
        }) as DbPermit,
    )
  );
}

export function getAllPermitIds(
  db: DTDatabase,
): Promise<Record<string, string>[]> {
  return db.manyOrNone(PS_FIND_ALL_SOURCE_IDS);
}
