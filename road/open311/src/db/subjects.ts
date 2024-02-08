import pgPromise from "pg-promise";
import type { Subject } from "../model/subject.js";
import type { Locale } from "../model/locale.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";

const { PreparedStatement } = pgPromise;

const DELETE_SUBJECTS_PS = new PreparedStatement({
    name: "delete-subjects",
    text: "DELETE FROM open311_subject"
});

const INSERT_SUBJECT_PS = new PreparedStatement({
    name: "insert-subject",
    text: `INSERT INTO open311_subject(active, id, locale, name) VALUES ($1, $2, $3, $4)`
});

const SELECT_SUBJECTS_PS = new PreparedStatement({
    name: "select-subjects",
    text: "SELECT active, id, locale, name FROM open311_subject WHERE locale = $1 ORDER BY id"
});

export function findAll(locale: Locale, db: DTDatabase): Promise<Subject[]> {
    return db.manyOrNone(SELECT_SUBJECTS_PS, [locale]);
}

export function update(subjects: Subject[], db: DTDatabase): Promise<null[]> {
    return db.tx(async (t) => {
        await t.none(DELETE_SUBJECTS_PS);
        const queries: Promise<null>[] = subjects.map((subject) => {
            return t.none(INSERT_SUBJECT_PS, [
                subject.active,
                subject.id,
                subject.locale.toLowerCase(),
                subject.name
            ]);
        });
        return await t.batch(queries);
    });
}
