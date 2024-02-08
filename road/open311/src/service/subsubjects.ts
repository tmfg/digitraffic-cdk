import * as SubSubjectsDb from "../db/subsubjects.js";
import { type DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import type { SubSubject } from "../model/subsubject.js";
import type { Locale } from "../model/locale.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

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
        logger.info({
            method: "open311ServiceSubSubjects.update",
            customUpdatedCount: a.length,
            customTookMs: end - start
        });
    });
}
