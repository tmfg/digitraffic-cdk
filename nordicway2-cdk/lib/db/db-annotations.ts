import * as pgPromise from "pg-promise";
import {Annotation} from "../model/annotations";

export function insert(db: pgPromise.IDatabase<any, any>, annotations: Annotation[]): Promise<void> {
    return db.tx(t => {
        const inserts: any[] = annotations.map(a => {
            const geometry = createGeometry(a.location);

            console.info("annotation " + JSON.stringify(a));

            return t.none("insert into nw2_annotation(id, created_at, recorded_at, type, location)" +
                "values(${id},${created_at},${recorded_at},${type},${geometry})", {
                    id: a._id,
                    created_at: a.created_at,
                    recorded_at: a.recorded_at,
                    type: a.tags[0].split(":", 2)[1],
                    geometry: geometry
            });
        })
    });
}

function createGeometry(location: any): any {
    if(location.type == 'LineString') {
        const coordinates = location.coordinates.map((c: any) =>  coordinatePair(c)).join(',');

        return `LINESTRING(${coordinates})`;
    } else if (location.type == 'Point') {
        const coordinates = coordinatePair(location.coordinates[0]);

        return `POINT(${coordinates})`;
    }

    console.error("unsupported locationType=", location.type);

    return null;
}

function coordinatePair(coordinate: any) {
    return `${coordinate[0]} ${coordinate[1]}`;
}