import * as CounterDb from "../db/counter";
import * as DataDb from "../db/data";
import * as LastUpdatedDB from "digitraffic-common/db/last-updated";
import {inDatabaseReadonly} from "digitraffic-common/postgres/database";
import { IDatabase } from "pg-promise";
import {DbCounter, DbDomain} from "../model/domain";

export async function getMetadata(): Promise<any> {
    return inDatabaseReadonly(async (db: IDatabase<any,any>) => {
        const domains = await CounterDb.findAllDomains(db);
        const counters = await CounterDb.findAllCounters(db);
        const lastUpdated = await LastUpdatedDB.getLastUpdated(db, LastUpdatedDB.DataType.COUNTING_SITES);

        //console.info("domains " + JSON.stringify(domains));
        //console.info("counters " + JSON.stringify(counters));

        return createResponse(domains, counters, lastUpdated);
    });
}

export async function getDataForCounter(counterId: number): Promise<any> {
    return inDatabaseReadonly(async (db: IDatabase<any,any>) => {
        return DataDb.findAllData(db, counterId);
    });
}

function createResponse(dbDomains: DbDomain[], dbCounters: DbCounter[], lastUpdated: Date|null): any {
    const countersMap: {[key: string]: any[]} = {};

    dbCounters.forEach((c: DbCounter) => {
        if(!(c.domain_name in countersMap)) {
            countersMap[c.domain_name] = [];
        }
        countersMap[c.domain_name].push(c);
    });

    const domains = dbDomains.map((d: DbDomain) => ({
        ...d, ...{
            counters: countersMap[d.name]
        }
    }));

    return {
        lastUpdated,
        domains
    }
}