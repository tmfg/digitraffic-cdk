import {IDatabase, PreparedStatement} from "pg-promise";
import {SubSubject} from "../model/subsubject";

const DELETE_SUBSUBJECTS_PS = new PreparedStatement({
    name: 'delete-subsubjects',
    text: 'DELETE FROM open311_subsubject'
});

const INSERT_SUBSUBJECT_PS = new PreparedStatement({
    name: 'insert-subsubject',
    text: `INSERT INTO open311_subsubject(active, id, locale, name, subject_id) VALUES ($1, $2, $3, $4, $5)`
});

const SELECT_SUBSUBJECTS_PS = new PreparedStatement({
    name: 'select-subsubjects',
    text: 'SELECT active, id, locale, name, subject_id FROM open311_subsubject ORDER BY locale, id'
});

export function findAll(db: IDatabase<any, any>): Promise<SubSubject[]> {
    return db.manyOrNone(SELECT_SUBSUBJECTS_PS);
}

export function update(
    subSubjects: SubSubject[],
    db: IDatabase<any, any>
): Promise<void> {
    return db.tx(t => {
        t.none(DELETE_SUBSUBJECTS_PS);
        const queries: any[] = subSubjects.map(s => {
            return t.none(INSERT_SUBSUBJECT_PS, [s.active, s.id, s.locale, s.name, s.subject_id]);
        });
        return t.batch(queries);
    });
}
