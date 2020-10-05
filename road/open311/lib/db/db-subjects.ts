import {IDatabase, PreparedStatement} from "pg-promise";
import {ServiceRequestState} from "../model/service-request-state";
import {Subject, SubjectLocale} from "../model/subject";

const DELETE_SUBJECTS_PS = new PreparedStatement({
    name: 'delete-subjects',
    text: 'DELETE FROM open311_subject'
});

const INSERT_SUBJECT_PS = new PreparedStatement({
    name: 'insert-subject',
    text: `INSERT INTO open311_subject(active, id, locale, name) VALUES ($1, $2, $3, $4)`
});

const SELECT_SUBJECTS_PS = new PreparedStatement({
    name: 'select-subjects',
    text: 'SELECT active, id, locale, name FROM open311_subject WHERE locale = $1 ORDER BY id'
});

export function findAll(
    locale: SubjectLocale,
    db: IDatabase<any, any>
): Promise<Subject[]> {
    return db.manyOrNone(SELECT_SUBJECTS_PS, [locale]);
}

export function update(
    subjects: Subject[],
    db: IDatabase<any, any>
): Promise<void> {
    return db.tx(t => {
        t.none(DELETE_SUBJECTS_PS);
        const queries: any[] = subjects.map(subject => {
            return t.none(INSERT_SUBJECT_PS, [subject.active, subject.id, subject.locale.toLowerCase(), subject.name]);
        });
        return t.batch(queries);
    });
}
