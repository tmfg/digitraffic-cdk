import {PreparedStatement} from "pg-promise";
import {SubSubject} from "../model/subsubject";
import {Locale} from "../model/locale";
import {DTDatabase} from "digitraffic-common/postgres/database";

const DELETE_SUBSUBJECTS_PS = new PreparedStatement({
    name: 'delete-subsubjects',
    text: 'DELETE FROM open311_subsubject',
});

const INSERT_SUBSUBJECT_PS = new PreparedStatement({
    name: 'insert-subsubject',
    text: `INSERT INTO open311_subsubject(active, id, locale, name, subject_id) VALUES ($1, $2, $3, $4, $5)`,
});

const SELECT_SUBSUBJECTS_PS = new PreparedStatement({
    name: 'select-subsubjects',
    text: 'SELECT active, id, locale, name, subject_id FROM open311_subsubject WHERE locale = $1 ORDER BY id',
});

export function findAll(locale: Locale,
    db: DTDatabase): Promise<SubSubject[]> {
    return db.manyOrNone(SELECT_SUBSUBJECTS_PS, [locale]);
}

export function update(subSubjects: SubSubject[],
    db: DTDatabase): Promise<null[]> {
    return db.tx(t => {
        t.none(DELETE_SUBSUBJECTS_PS);
        const queries: Promise<null>[] = subSubjects.map(s => {
            return t.none(INSERT_SUBSUBJECT_PS, [s.active, s.id, s.locale.toLowerCase(), s.name, s.subject_id]);
        });
        return t.batch(queries);
    });
}
