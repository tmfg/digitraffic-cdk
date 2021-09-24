import * as SitesDb from "../db/sites";
import {inDatabase, inDatabaseReadonly} from "digitraffic-common/postgres/database";
import {EcoCounterApi} from "../api/eco-counter";

export async function updateMetadataForDomain(domainName: string, apiKey: string, url: string) {
    const countersInApi = await getAllCounters(apiKey, url); // site_id -> counter
    const countersInDb = await getAllCountersFromDb(domainName); // site_id -> counter

    const [newCounters, removedCounters, updatedCounters] = compareCounters(countersInApi, countersInDb);

    console.info(newCounters.length + " new " + JSON.stringify(newCounters, null, 3));
    console.info(removedCounters.length + " removed " + JSON.stringify(removedCounters, null, 3));
    console.info(updatedCounters.length + " updated " + JSON.stringify(updatedCounters, null, 3));

    return inDatabase(async db => {
        await SitesDb.insertCounters(db, domainName, newCounters);
        await SitesDb.removeCounters(db, removedCounters);
        await SitesDb.updateCounters(db, updatedCounters);
    });
}

export async function updateDataForDomain(domainName: string, apiKey: string, url: string) {
    const domain = await getDomainFromDb(domainName);
}

export async function getDomainFromDb(domainName: string) {
    return inDatabaseReadonly( db => {
        return SitesDb.getDomain(db, domainName);
    });
}

function compareCounters(countersInApi: any, countersInDb: any): [any[], any[], any[]] {
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

async function getAllCounters(apiKey: string, url: string): Promise<any> {
    const api = new EcoCounterApi(apiKey, url);
    const sites = await api.getSites();
    const entries: any = [];

    sites.forEach((site: any) => {
        // create entries [id, channel]
        site.channels.forEach((c: any) => {
            // override channel name with domain_name + channel_name
            entries.push([c.id, {...c, ...{name: `${site.name} ${c.name}`}}]);
        });
    });

    // and finally create object from entries with id as key ad counter as value
    return Object.fromEntries(entries);
}

async function getAllCountersFromDb(domain: string) {
    const counters = await inDatabaseReadonly( db => {
        return SitesDb.findAllCountersForDomain(db, domain);
    });

    return Object.fromEntries(counters
        .map((c: any) => [c.site_id as string, c])
    );
}

