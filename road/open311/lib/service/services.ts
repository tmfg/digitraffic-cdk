import {IDatabase} from "pg-promise";
import {
    findAll as dbFindAll,
    find as dbFind,
    update as dbUpdate
} from '../db/db-services';
import {inDatabase} from "../../../../common/postgres/database";
import {Service} from "../model/service";

export async function findAll(): Promise<Service[]> {
    return inDatabase(async (db: IDatabase<any, any>) => {
        return await dbFindAll(db);
    });
}

export async function update(
    services: Service[]
): Promise<void> {
    const start = Date.now();
    return inDatabase(async (db: IDatabase<any, any>) => {
        return await dbUpdate(services, db);
    }).then(a => {
        const end = Date.now();
        console.info("method=updateServices updatedCount=%d tookMs=%d", a.length, (end - start));
    });
}

export async function find(
    serviceRequestId: string
): Promise<Service> {
    return inDatabase(async (db: IDatabase<any, any>) => {
        return await dbFind(serviceRequestId, db);
    });
}