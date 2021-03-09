import {IDatabase, PreparedStatement} from "pg-promise";
import {createGeometry} from "../../../../common/postgres/geometry";
import {stream} from "../../../../common/db/stream-util";
import {Language} from "../../../../common/model/language";
import {LineString} from "wkx";

// 15 nautical miles
const BUFFER_RADIUS_METERS = 27780;

// find faults that are relevant for ships
// transform given ship route (linestring) from wgs84 to etrs89 / tm35fin for metric buffering and then back to wgs84
const ALL_FAULTS_S124_WITH_DOMAIN_SQL_BY_AREA =
    `select
       id,
       entry_timestamp,
       fixed_timestamp,
       aton_fault_type.name_en fault_type_en,
       aton_id,
       aton_name_fi,
       aton_type.name_en aton_type_en, 
       fairway_name_fi,
       description_en area_description_en,
       geometry
    from aton_fault, area, aton_fault_type, aton_type
    where domain in ('C_NA', 'C_NM') 
    and aton_fault.area_number = area.area_number
    and aton_fault.type = aton_fault_type.name_fi
    and aton_fault.aton_type_fi = aton_type.name_fi
    and st_intersects(
        st_setsrid(geometry, 4326),
        st_transform(
            st_buffer(
                st_transform(
                    st_geomfromtext($1, 4326), 3067
                )
                , ${BUFFER_RADIUS_METERS})
        , 4326)
    )
`;

const PS_124 = new PreparedStatement({
    name: 'get-all-faults-s124-by-area',
    text: ALL_FAULTS_S124_WITH_DOMAIN_SQL_BY_AREA
});

export async function findFaultsByRoute(db: IDatabase<any, any>, route: LineString) {
    return db.tx(t => t.manyOrNone(PS_124, route.toWkt()));
}
