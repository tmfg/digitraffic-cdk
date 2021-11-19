import * as ServicesDb from '../db/services';
import {DTDatabase, inDatabase} from "digitraffic-common/postgres/database";
import {Service} from "../model/service";

export async function findAll(): Promise<Service[]> {
    return inDatabase(async (db: DTDatabase) => {
        return await ServicesDb.findAll(db);
    });
}

export async function update(
    services: Service[]
): Promise<void> {
    const start = Date.now();
    return inDatabase(async (db: DTDatabase) => {
        return await ServicesDb.update(services, db);
    }).then(a => {
        const end = Date.now();
        console.info("method=updateServices updatedCount=%d tookMs=%d", a.length, (end - start));
    });
}

export async function find(
    serviceRequestId: string
): Promise<Service | null> {
    return inDatabase(async (db: DTDatabase) => {
        return await ServicesDb.find(serviceRequestId, db);
    });
}