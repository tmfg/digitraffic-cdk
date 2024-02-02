import * as SubjectsDb from "../db/subjects.js";
import { type DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import type { Subject } from "../model/subject.js";
import { Locale } from "../model/locale.js";

export function findAll(locale: Locale): Promise<Subject[]> {
    return inDatabase((db: DTDatabase) => {
        return SubjectsDb.findAll(locale, db);
    });
}

export function update(subjects: Subject[]): Promise<void> {
    const start = Date.now();
    return inDatabase((db: DTDatabase) => {
        return SubjectsDb.update(subjects, db);
    }).then((a) => {
        const end = Date.now();
        console.info("method=updateSubjects updatedCount=%d tookMs=%d", a.length, end - start);
    });
}
