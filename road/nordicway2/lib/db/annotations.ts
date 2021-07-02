import {IDatabase, PreparedStatement} from "pg-promise";
import {Annotation} from "../model/annotations";
import {createGeometry} from "../../../../common/postgres/geometry";

const FIND_ALL_SQL = "select id, author, created_at, recorded_at, updated_at, expires_at, type, location from nw2_annotation";
const FIND_ACTIVE_SQL = `
select id, author, created_at, recorded_at, updated_at, expires_at, type, location from nw2_annotation
where expires_at is null or expires_at > current_timestamp`;

const UPSERT_ANNOTATIONS_SQL =
`insert into nw2_annotation(id, author, created_at, updated_at, recorded_at, expires_at, type, location)
values($1,$2,$3,$4,$5,$6,$7,$8)
on conflict (id)
do update set
   expires_at = $6,
   updated_at = $4,
   location = $8`;

export function updateAnnotations(db: IDatabase<any, any>, annotations: Annotation[]): Promise<any>[] {
    const ps = new PreparedStatement({
        name: 'update-annotations',
        text: UPSERT_ANNOTATIONS_SQL,
    });

    return annotations.map(a => {
        return db.none(ps, [
            a._id,
            a.author,
            a.created_at,
            a.updated_at || a.created_at,
            a.recorded_at,
            a.expires_at,
            getTypeFromTags(a.tags),
            createGeometry(a.location)]);
    });
}

function getTypeFromTags(tags: string[]|null) {
    if(tags == null) {
        return null;
    }
    const first = tags[0];

    // somethingIrrelevant:TYPE
    if(first.includes(':')) {
        return first.split(":", 2)[1];
    }

    // just plain TYPE
    return first;
}

export async function findActive(db: IDatabase<any, any>, author: string|null, type: string|null): Promise<any[]> {
    const values = [];
    let sql = FIND_ACTIVE_SQL;
    let name = 'find-active-annotations';
    let index = 1;

    if(author) {
        sql+= ` and author=\$${index++}`;
        values.push(author);
        name+= "-author";
    }
    if(type) {
        sql+= ` and type=\$${index++}`;
        values.push(type);
        name+= "-type";
    }

    const ps = new PreparedStatement({
        name: name,
        text: sql,
        values: values
    });

    return db.manyOrNone(ps);
}

export async function findAll(db: IDatabase<any, any>): Promise<any[]> {
    const ps = new PreparedStatement({
        name: 'find-all-annotations',
        text: FIND_ALL_SQL
    });

    return db.manyOrNone(ps);
}
