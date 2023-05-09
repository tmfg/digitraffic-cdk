import { FaultsApi } from "../api/faults";
import { DTDatabase, inDatabase } from "@digitraffic/common/dist/database/database";
import * as FaultsDB from "../db/faults";
import * as LastUpdatedDB from "@digitraffic/common/dist/database/last-updated";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ATON_FAULTS_CHECK } from "./faults";
import { FaultFeature } from "../model/fault";

export async function updateFaults(url: string, domain: string): Promise<void> {
    const start = Date.now();

    const newFaults = await new FaultsApi(url).getFaults();
    const validated = newFaults.filter(validate);

    await inDatabase((db: DTDatabase) => {
        return db.tx((t) => {
            return t.batch([
                ...FaultsDB.updateFaults(db, domain, validated),
                LastUpdatedDB.updateUpdatedTimestamp(db, ATON_FAULTS_CHECK, new Date(start))
            ]);
        });
    }).finally(() => {
        const end = Date.now();
        logger.info({
            method: "UpdateFaultsService.updateFaults",
            tookMs: end - start,
            customUpdatedCount: newFaults.length
        });
    });
}

function validate(fault: FaultFeature): boolean {
    if (fault.properties.FAULT_TYPE === "Aiheeton") {
        logger.info({
            method: "UpdateFaultsService.validate",
            message: "Aiheeton id",
            customCode: fault.properties.ID
        });
    }

    return fault.properties.FAULT_TYPE !== "Kirjattu";
}
