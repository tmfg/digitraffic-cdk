import {IDatabase} from "pg-promise";
import {
    findAll as dbFindAll,
    update as dbUpdate
} from '../db/db-subjects';
import {inDatabase} from "digitraffic-lambda-postgres/database";
import {Subject, SubjectLocale} from "../model/subject";

export async function findAll(locale: SubjectLocale): Promise<Subject[]> {
    return inDatabase(async (db: IDatabase<any, any>) => {
        return await dbFindAll(locale, db);
    });
}

export async function update(
    subjects: Subject[]
): Promise<void> {
    const start = Date.now();
    return inDatabase(async (db: IDatabase<any, any>) => {
        return await dbUpdate(subjects, db);
    }).then(a => {
        const end = Date.now();
        console.info("method=updateSubjects updatedCount=%d tookMs=%d", a.length, (end - start));
    });
}
