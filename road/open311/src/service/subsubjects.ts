import * as SubSubjectsDb from "../db/subsubjects.js";
import { type DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import type { SubSubject } from "../model/subsubject.js";
import { Locale } from "../model/locale.js";

export function findAll(locale: Locale): Promise<SubSubject[]> {
    return inDatabase((db: DTDatabase) => {
        return SubSubjectsDb.findAll(locale, db);
    });
}

export function update(subSubjects: SubSubject[]): Promise<void> {
    const start = Date.now();
    return inDatabase((db: DTDatabase) => {
        return SubSubjectsDb.update(subSubjects, db);
    }).then((a) => {
        const end = Date.now();
        console.info("method=updateSubSubjects updatedCount=%d tookMs=%d", a.length, end - start);
    });
}
