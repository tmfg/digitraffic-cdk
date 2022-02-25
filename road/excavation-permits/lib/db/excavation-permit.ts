import {DTDatabase} from "../../../../digitraffic-common/database/database";
import {PreparedStatement} from "pg-promise";
import {ApiExcavationPermit} from "../model/excavation-permit";

const SQL_INSERT_PERMIT =
    `INSERT INTO excavation_permits (id, subject, geometry, effective_from, effective_to)
     VALUES ($1, $2, (SELECT ST_Transform(ST_GeomFromGML($3), 4326)), $4, $5)`;

const PS_INSERT_PERMIT = new PreparedStatement({
    name: 'insert-permit',
    text: SQL_INSERT_PERMIT,
});

export function insertPermits(db: DTDatabase, permits: ApiExcavationPermit[]): Promise<null[]> {
    return Promise.all(permits
        .map(permit => db.none(PS_INSERT_PERMIT,
            [permit.id, permit.subject, permit.gmlGeometryXmlString, permit.effectiveFrom, permit.effectiveTo])));
}
