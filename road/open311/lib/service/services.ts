import * as ServicesDb from "../db/services";
import {
    DTDatabase,
    inDatabase,
} from "@digitraffic/common/dist/database/database";
import { Service } from "../model/service";

export function findAll(): Promise<Service[]> {
    return inDatabase((db: DTDatabase) => {
        return ServicesDb.findAll(db);
    });
}

export function update(services: Service[]): Promise<void> {
    const start = Date.now();
    return inDatabase((db: DTDatabase) => {
        return ServicesDb.update(services, db);
    }).then((a) => {
        const end = Date.now();
        console.info(
            "method=updateServices updatedCount=%d tookMs=%d",
            a.length,
            end - start
        );
    });
}

export function find(serviceRequestId: string): Promise<Service | null> {
    return inDatabase((db: DTDatabase) => {
        return ServicesDb.find(serviceRequestId, db);
    });
}
