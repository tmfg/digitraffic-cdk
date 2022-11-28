import * as SubSubjectsDb from "../db/subsubjects";
import {
    DTDatabase,
    inDatabase,
} from "@digitraffic/common/dist/database/database";
import { SubSubject } from "../model/subsubject";
import { Locale } from "../model/locale";

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
        console.info(
            "method=updateSubSubjects updatedCount=%d tookMs=%d",
            a.length,
            end - start
        );
    });
}
