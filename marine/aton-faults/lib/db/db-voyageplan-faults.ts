import {IDatabase, PreparedStatement} from "pg-promise";
import {LineString} from "wkx";

// 15 nautical miles
const BUFFER_RADIUS_METERS = 27780;

// find faults that are relevant for ships
// transform given ship route (linestring) from wgs84 to etrs89 / tm35fin for metric buffering and then back to wgs84
const FAULT_IDS_BY_AREA =
    `select id
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
    name: 'get-fault-ids-by-area',
    text: FAULT_IDS_BY_AREA
});

export async function findFaultIdsByRoute(db: IDatabase<any, any>, route: LineString): Promise<number[]> {
    return db.tx(t => t.manyOrNone(PS_124, route.toWkt()));
}
