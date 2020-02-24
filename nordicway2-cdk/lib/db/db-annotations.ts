import * as pgPromise from "pg-promise";
import {Annotation} from "../model/annotations";
import {createGeometry} from "../../../common/postgres/geometry";

const FIND_ALL_SQL = "select id, author, created_at, recorded_at, expires_at, type, location from nw2_annotation";
const FIND_ACTIVE_SQL = "select id, author, created_at, recorded_at, expires_at, type, location from nw2_annotation" +
    " where expires_at is null or expires_at > current_timestamp";

const UPSERT_ANNOTATIONS_SQL = "insert into nw2_annotation(id, author, created_at, recorded_at, expires_at, type, location)" +
    "values(${id},${author},${created_at},${recorded_at},${expires_at},${type},${geometry}) " +
    "on conflict (id) " +
    "do update set " +
    "   expires_at = ${expires_at}," +
    "   location = ${geometry}";

export function updateAnnotations(db: pgPromise.IDatabase<any, any>, annotations: Annotation[]): Promise<any>[] {
    let promises: any[] = [];

    annotations.forEach(a => {
        promises.push(db.none(UPSERT_ANNOTATIONS_SQL, {
            id: a._id,
            author: a.author,
            created_at: a.created_at,
            recorded_at: a.recorded_at,
            expires_at: a.expires_at,
            type: getTypeFromTags(a.tags),
            geometry: createGeometry(a.location)
        }));
    });

    return promises;
}

function getTypeFromTags(tags: string[]|null) {
    if(tags == null) {
        return null;
    }
    const first = tags[0];

    // somethingIrrelevant:TYPE
    if(first.indexOf(':') > 0) {
        return first.split(":", 2)[1];
    }

    // just plain TYPE
    return first;
}

export async function findActive(db: pgPromise.IDatabase<any, any>, author: string|null, type: string|null): Promise<any[]> {
    let sql = FIND_ACTIVE_SQL;

    if(author) sql+= ' and author=${author}';
    if(type) sql+= ' and type=${type}';

    return await db.manyOrNone(sql, {
        author: author,
        type: type
    });
}

export async function findAll(db: pgPromise.IDatabase<any, any>): Promise<any[]> {
    return await db.manyOrNone(FIND_ALL_SQL);
}