import {IDatabase, PreparedStatement} from "pg-promise";
import {ServiceRequestState} from "../model/service-request-state";
import {Subject} from "../model/subject";

const DELETE_SUBJECTS_PS = new PreparedStatement({
    name: 'delete-subjects',
    text: 'DELETE FROM open311_subject'
});

const INSERT_SUBJECT_PS = new PreparedStatement({
    name: 'insert-state',
    text: `INSERT INTO open311_subject(active, id, locale, name) VALUES ($1, $2, $3, $4)`
});

const SELECT_SUBJECTS_PS = new PreparedStatement({
    name: 'select-subjects',
    text: 'SELECT active, id, locale, name FROM open311_subject ORDER BY id'
});

export function findAll(db: IDatabase<any, any>): Promise<Subject[]> {
    return db.manyOrNone(SELECT_SUBJECTS_PS);
}

export function update(
    subjects: Subject[],
    db: IDatabase<any, any>
): Promise<void> {
    return db.tx(t => {
        t.none(DELETE_SUBJECTS_PS);
        const queries: any[] = subjects.map(subject => {
            return t.none(INSERT_SUBJECT_PS, [subject.active, subject.id, subject.locale, subject.name]);
        });
        return t.batch(queries);
    });
}
