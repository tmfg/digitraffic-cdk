import { type DTDatabase, inDatabase, inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import { EcoCounterApi } from "../api/eco-counter.js";
import type { ApiCounter, DbCounter } from "../model/counter.js";
import { addDays, subDays, startOfDay, isBefore } from "date-fns";
import { DataType, updateLastUpdated } from "@digitraffic/common/dist/database/last-updated";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import {
    findAllCountersForUpdateForDomain,
    insertCounters,
    removeCounters,
    updateCounterTimestamp,
    updateCounters
} from "../dao/counter.js";
import { insertCounterValues } from "../dao/data.js";

export async function updateMetadataForDomain(
    domainName: string,
    apiKey: string,
    url: string
): Promise<void> {
    const api = new EcoCounterApi(apiKey, url);

    const countersInApi = await api.getAllCounters(); // site_id -> counter
    const countersInDb = await getAllCountersFromDb(domainName); // site_id -> counter

    const [newCounters, removedCounters, updatedCounters] = compareCounters(countersInApi, countersInDb);

    return inDatabase(async (db) => {
        const updatedTimestamp = new Date();

        await insertCounters(db, domainName, newCounters);
        await removeCounters(db, removedCounters);
        await updateCounters(db, updatedCounters);

        if (newCounters.length > 0 || removedCounters.length > 0 || updatedCounters.length > 0) {
            await updateLastUpdated(db, DataType.COUNTING_SITES_METADATA, updatedTimestamp);
        }
        await updateLastUpdated(db, DataType.COUNTING_SITES_METADATA_CHECK, updatedTimestamp);
    });
}

export async function updateDataForDomain(domainName: string, apiKey: string, url: string): Promise<void> {
    const api = new EcoCounterApi(apiKey, url);
    const countersInDb = await getAllCountersFromDb(domainName); // site_id -> counter

    return inDatabase(async (db: DTDatabase) => {
        await Promise.allSettled(
            Object.values(countersInDb).map(async (counter: DbCounter) => {
                if (isDataUpdateNeeded(counter)) {
                    // either last update timestamp + 1 day or ten days ago(for first time)
                    const fromStamp = counter.last_data_timestamp
                        ? new Date(counter.last_data_timestamp)
                        : startOfDay(subDays(new Date(), 10));
                    const endStamp = addDays(fromStamp, 1);

                    const data = await api.getDataForSite(
                        counter.site_id,
                        counter.interval,
                        fromStamp,
                        endStamp
                    );

                    logger.info({
                        method: "UpdateService.updateDataForDomain",
                        customCounter: counter.id,
                        customUpdatedCount: data.length
                    });

                    await insertCounterValues(db, counter.id, counter.interval, data);
                    return updateCounterTimestamp(db, counter.id, endStamp);
                }

                logger.info({
                    method: "UpdateService.updateDataForDomain",
                    message: `no need to update ${counter.id}`
                });

                return;
            })
        );

        await updateLastUpdated(db, DataType.COUNTING_SITES_DATA, new Date());
    });
}

function isDataUpdateNeeded(counter: DbCounter): boolean {
    return (
        !counter.last_data_timestamp ||
        isBefore(new Date(counter.last_data_timestamp), subDays(new Date(), 2))
    );
}

function compareCounters(
    countersInApi: Record<string, ApiCounter>,
    countersInDb: Record<string, DbCounter>
): [ApiCounter[], DbCounter[], ApiCounter[]] {
    const newCounters = Object.keys(countersInApi)
        .filter((key) => !(key in countersInDb))
        .map((key) => countersInApi[key]);

    const removedCounters = Object.keys(countersInDb)
        .filter((key) => !(key in countersInApi))
        .map((key) => countersInDb[key]);

    const updatedCounters = Object.keys(countersInApi)
        .filter((key) => key in countersInDb)
        .map((key) => countersInApi[key]);

    return [newCounters as ApiCounter[], removedCounters as DbCounter[], updatedCounters as ApiCounter[]];
}

async function getAllCountersFromDb(domain: string): Promise<Record<number, DbCounter>> {
    const counters = await inDatabaseReadonly((db) => {
        return findAllCountersForUpdateForDomain(db, domain);
    });

    return Object.fromEntries(counters.map((c: DbCounter) => [c.site_id, c]));
}
