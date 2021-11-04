import * as CounterDb from "../db/counter";
import * as DataDb from "../db/data";
import {inDatabase, inDatabaseReadonly} from "digitraffic-common/postgres/database";
import {EcoCounterApi} from "../api/eco-counter";
import {ApiCounter, DbCounter} from "../model/counter";
import moment from "moment";
import {findAllCountersForUpdateForDomain} from "../db/counter";

export async function updateMetadataForDomain(domainName: string, apiKey: string, url: string): Promise<void> {
    const api = new EcoCounterApi(apiKey, url);

    const countersInApi = await api.getAllCounters(); // site_id -> counter
    const countersInDb = await getAllCountersFromDb(domainName); // site_id -> counter

    const [newCounters, removedCounters, updatedCounters] = compareCounters(countersInApi, countersInDb);

//    console.info(newCounters.length + " new " + JSON.stringify(newCounters, null, 3));
//    console.info(removedCounters.length + " removed " + JSON.stringify(removedCounters, null, 3));
//    console.info(updatedCounters.length + " updated " + JSON.stringify(updatedCounters, null, 3));

    await inDatabase(async db => {
        await CounterDb.insertCounters(db, domainName, newCounters);
        await CounterDb.removeCounters(db, removedCounters);
        await CounterDb.updateCounters(db, updatedCounters);
    });
}

export async function updateDataForDomain(domainName: string, apiKey: string, url: string): Promise<void> {
    const api = new EcoCounterApi(apiKey, url);
    const countersInDb = await getAllCountersFromDb(domainName); // site_id -> counter

    await inDatabase(async db => {
        return Promise.allSettled(Object.values(countersInDb).map(async (counter: DbCounter) => {
            if(isDataUpdateNeeded(counter)) {
                // either last update timestamp + 1 day or ten days ago(for first time)
                const fromStamp = counter.last_data_timestamp ? moment(counter.last_data_timestamp) : moment().subtract(10, 'days').startOf('day');
                const endStamp = fromStamp.clone().add(1, 'days');

                const data = await api.getDataForSite(counter.site_id, counter.interval, fromStamp.toDate(), endStamp.toDate());

                console.info("method=updateDataForDomain counter=%d updatedCount=%d", counter.id, data.length);

                await DataDb.insertData(db, counter.id, counter.interval, data);
                return CounterDb.updateCounterTimestamp(db, counter.id, endStamp.toDate());
            }

            console.info("no need to update " + counter.id);
            return;
        }))
        }
    );
}

function isDataUpdateNeeded(counter: DbCounter): boolean {
    console.info("comparing " + moment(counter.last_data_timestamp).toISOString() + " and " + moment().subtract(2, 'days').toISOString());

    return !counter.last_data_timestamp || moment(counter.last_data_timestamp).isBefore(moment().subtract(2, 'days'));
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
        return CounterDb.findAllCountersForUpdateForDomain(db, domain);
    });

    return Object.fromEntries(counters
        .map((c: any) => [c.site_id as string, c])
    );
}

