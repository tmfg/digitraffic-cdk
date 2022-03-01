import {DTDatabase} from "../../../../digitraffic-common/database/database";
import {PreparedStatement} from "pg-promise";
import {ApiExcavationPermit} from "../model/excavation-permit";
import {FeatureCollection} from "geojson";

const SQL_INSERT_PERMIT =
    `INSERT INTO excavation_permits (id, subject, geometry, effective_from, effective_to)
     VALUES ($1, $2, (SELECT ST_Transform(ST_GeomFromGML($3), 4326)), $4, $5)`;

const SQL_FIND_ALL_PERMITS_GEOJSON =
    `select json_build_object(
        'type', 'FeatureCollection',
        'features', coalesce(json_agg(
             json_build_object(
                     'type', 'Feature',
                     'geometry', ST_AsGeoJSON(geometry::geometry)::json,
                     'properties', json_build_object(
                         'id', id,
                         'subject', subject,
                         'effectiveFrom', effective_from,
                         'effectiveTo', effective_to
                     )
                 )
             ), '[]')
        ) as collection
     from excavation_permits`;

const PS_INSERT_PERMIT = new PreparedStatement({
    name: 'insert-permit',
    text: SQL_INSERT_PERMIT,
});

const PS_FIND_ALL = new PreparedStatement({
    name: 'find-all-permits-geojson',
    text: SQL_FIND_ALL_PERMITS_GEOJSON,
});

export function insertPermits(db: DTDatabase, permits: ApiExcavationPermit[]): Promise<null[]> {
    return Promise.all(permits
        .map(permit => db.none(PS_INSERT_PERMIT,
            [permit.id, permit.subject, permit.gmlGeometryXmlString, permit.effectiveFrom, permit.effectiveTo])));
}

export function getActivePermitsGeojson(db: DTDatabase): Promise<FeatureCollection> {
    return db.one(PS_FIND_ALL).then(result => result.collection);
}