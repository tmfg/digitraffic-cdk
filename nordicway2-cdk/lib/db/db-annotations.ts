import * as pgPromise from "pg-promise";
import {Annotation} from "../model/annotations";

export function insert(db: pgPromise.IDatabase<any, any>, annotations: Annotation[]): Promise<void> {
    return db.tx(t => {
        const inserts: any[] = annotations.map(a => {
            const geometry = createGeometry(a.location);

            console.info("annotation " + JSON.stringify(a));

            return t.none("insert into nw2_annotation(id, created_at, recorded_at, type, location)" +
                "values(${id},${created_at},${recorded_at},${type},${location})", {
                    id: a._id,
                    created_at: a.created_at,
                    recorded_at: a.recorded_at,
                    type: a.tags[0].split(":", 2)[1],
                    location: geometry
            });
        })
    });
}

function createGeometry(g: any): any {
    return null;
}