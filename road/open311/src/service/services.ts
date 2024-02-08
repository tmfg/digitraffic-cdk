import * as ServicesDb from "../db/services.js";
import { type DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { Service } from "../model/service.js";

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
        logger.info({
            method: "open311ServiceServices.update",
            customUpdatedCount: a.length,
            customTookMs: end - start
        });
    });
}

export function find(serviceRequestId: string): Promise<Service | null> {
    return inDatabase((db: DTDatabase) => {
        return ServicesDb.find(serviceRequestId, db);
    });
}
