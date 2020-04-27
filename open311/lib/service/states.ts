import {IDatabase} from "pg-promise";
import {
    findAll as dbFindAll,
    update as dbUpdate
} from '../db/db-states';
import {inDatabase} from "digitraffic-lambda-postgres/database";
import {ServiceRequestState} from "../model/service-request-state";

export async function findAll(dbParam?: IDatabase<any, any>): Promise<ServiceRequestState[]> {
    return inDatabase(async (db: IDatabase<any, any>) => {
        return await dbFindAll(db);
    }, dbParam);
}

export async function update(
    states: ServiceRequestState[],
    dbParam?: IDatabase<any, any>
): Promise<void> {
    return inDatabase(async (db: IDatabase<any, any>) => {
        return await dbUpdate(states, db);
    }, dbParam);
}