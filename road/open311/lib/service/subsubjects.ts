import {IDatabase} from "pg-promise";
import {
    findAll as dbFindAll,
    update as dbUpdate
} from '../db/db-subsubjects';
import {inDatabase} from "digitraffic-lambda-postgres/database";
import {SubSubject} from "../model/subsubject";
import {SubjectLocale} from "../model/subject";

export async function findAll(locale: SubjectLocale): Promise<SubSubject[]> {
    return inDatabase(async (db: IDatabase<any, any>) => {
        return await dbFindAll(locale, db);
    });
}

export async function update(
    subSubjects: SubSubject[]
): Promise<void> {
    const start = Date.now();
    return inDatabase(async (db: IDatabase<any, any>) => {
        return await dbUpdate(subSubjects, db);
    }).then(a => {
        const end = Date.now();
        console.info("method=updateSubSubjects updatedCount=%d tookMs=%d", a.length, (end - start));
    });
}
