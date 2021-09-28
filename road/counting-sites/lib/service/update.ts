import * as CounterDb from "../db/counter";
import * as DataDb from "../db/data";
import {inDatabase, inDatabaseReadonly} from "digitraffic-common/postgres/database";
import {EcoCounterApi} from "../api/eco-counter";
import {ApiCounter} from "../model/counter";
import {DbCounter, DbDomain} from "../model/domain";
import moment from "moment";

export async function updateMetadataForDomain(domainName: string, apiKey: string, url: string) {
    const api = new EcoCounterApi(apiKey, url);

    const countersInApi = await api.getAllCounters(); // site_id -> counter
    const countersInDb = await getAllCountersFromDb(domainName); // site_id -> counter

    const [newCounters, removedCounters, updatedCounters] = compareCounters(countersInApi, countersInDb);

    console.info(newCounters.length + " new " + JSON.stringify(newCounters, null, 3));
    console.info(removedCounters.length + " removed " + JSON.stringify(removedCounters, null, 3));
    console.info(updatedCounters.length + " updated " + JSON.stringify(updatedCounters, null, 3));

    return inDatabase(async db => {
        await CounterDb.insertCounters(db, domainName, newCounters);
        await CounterDb.removeCounters(db, removedCounters);
        await CounterDb.updateCounters(db, updatedCounters);
    });
}

export async function updateDataForDomain(domainName: string, apiKey: string, url: string) {
    const api = new EcoCounterApi(apiKey, url);
    const countersInDb = await getAllCountersFromDb(domainName); // site_id -> counter

    return inDatabase(async db => {
        return Promise.allSettled(Object.values(countersInDb).map(async (counter: DbCounter) => {
            if(isDataUpdateNeeded(counter)) {
                // either last update timestamp + 1 day or ten days ago(for first time)
                const fromStamp = counter.last_data_timestamp ? moment(counter.last_data_timestamp).add(1, 'days') : moment().subtract(10, 'days').startOf('day');
                const endStamp = fromStamp.clone().add(1, 'days');

                const data = await api.getDataForSite(counter.site_id, counter.interval, fromStamp.toDate(), endStamp.toDate());

                console.info("method=updateDataForDomain counter=%d updatedCount=%d", counter.id, data.length);

                await DataDb.insertData(db, counter.id, counter.interval, data);
                return CounterDb.updateCounterTimestamp(db, counter.id, fromStamp.toDate());
            }

            console.info("no need to update " + counter.id);
            return;
        }))
        }
    );
}

function isDataUpdateNeeded(counter: DbCounter): boolean {
    return !counter.last_data_timestamp || moment(counter.last_data_timestamp).isBefore(moment().subtract(2, 'days'));
}

export async function getDomainFromDb(domainName: string): Promise<DbDomain> {
    return inDatabaseReadonly( db => {
        return CounterDb.getDomain(db, domainName);
    });
}

function compareCounters(countersInApi: any, countersInDb: any): [ApiCounter[], DbCounter[], ApiCounter[]] {
    const newCounters = Object.keys(countersInApi)
        .filter(key => !(key in countersInDb))
        .map(key => countersInApi[key]);

    const removedCounters = Object.keys(countersInDb)
        .filter(key => !(key in countersInApi))
        .map(key => countersInDb[key]);

    const updatedCounters = Object.keys(countersInApi)
        .filter(key => key in countersInDb)
        .map(key => countersInApi[key]);

    return [newCounters, removedCounters, updatedCounters];
}

async function getAllCountersFromDb(domain: string) {
    const counters = await inDatabaseReadonly( db => {
        return CounterDb.findAllCountersForDomain(db, domain);
    });

    return Object.fromEntries(counters
        .map((c: any) => [c.site_id as string, c])
    );
}

