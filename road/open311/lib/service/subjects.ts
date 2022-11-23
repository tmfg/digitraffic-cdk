import * as SubjectsDb from '../db/subjects';
import {DTDatabase, inDatabase} from "@digitraffic/common/dist/database/database";
import {Subject} from "../model/subject";
import {Locale} from "../model/locale";

export function findAll(locale: Locale): Promise<Subject[]> {
    return inDatabase((db: DTDatabase) => {
        return SubjectsDb.findAll(locale, db);
    });
}

export function update(subjects: Subject[]): Promise<void> {
    const start = Date.now();
    return inDatabase((db: DTDatabase) => {
        return SubjectsDb.update(subjects, db);
    }).then(a => {
        const end = Date.now();
        console.info("method=updateSubjects updatedCount=%d tookMs=%d", a.length, (end - start));
    });
}
