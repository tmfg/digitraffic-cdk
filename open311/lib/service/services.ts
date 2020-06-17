import {IDatabase} from "pg-promise";
import {
    findAll as dbFindAll,
    find as dbFind,
    update as dbUpdate
} from '../db/db-services';
import {inDatabase} from "digitraffic-lambda-postgres/database";
import {Service} from "../model/service";

export async function findAll(): Promise<Service[]> {
    return inDatabase(async (db: IDatabase<any, any>) => {
        return await dbFindAll(db);
    });
}

export async function update(
    services: Service[]
): Promise<void> {
    return inDatabase(async (db: IDatabase<any, any>) => {
        await dbUpdate(services, db);
    });
}

export async function find(
    serviceRequestId: string
): Promise<Service> {
    return inDatabase(async (db: IDatabase<any, any>) => {
        return await dbFind(serviceRequestId, db);
    });
}