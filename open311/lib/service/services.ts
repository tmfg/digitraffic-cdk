import {IDatabase} from "pg-promise";
import {
    findAll as dbFindAll,
    find as dbFind,
    update as dbUpdate
} from '../db/db-services';
import {inDatabase} from "digitraffic-lambda-postgres/database";
import {Service} from "../model/service";

export async function findAll(dbParam?: IDatabase<any, any>): Promise<Service[]> {
    return inDatabase(async (db: IDatabase<any, any>) => {
        return await dbFindAll(db);
    }, dbParam);
}

export async function update(
    services: Service[],
    dbParam?: IDatabase<any, any>
): Promise<void> {
    return inDatabase(async (db: IDatabase<any, any>) => {
        await dbUpdate(services, db);
    }, dbParam);
}

export async function find(
    serviceRequestId: string,
    dbParam?: IDatabase<any, any>
): Promise<Service> {
    return inDatabase(async (db: IDatabase<any, any>) => {
        return await dbFind(serviceRequestId, db);
    }, dbParam);
}