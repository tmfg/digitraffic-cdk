import * as CounterDb from "../db/counter";
import * as DataDb from "../db/data";
import * as MetadataDB from "../db/metadata";
import {DTDatabase, inDatabaseReadonly} from "digitraffic-common/database/database";
import {ResultDomain} from "../model/domain";
import {DbCsvData, ResponseData} from "../model/data";
import {FeatureCollection} from "geojson";
import {createObjectCsvStringifier} from 'csv-writer';
import * as R from 'ramda';

export function getUserTypes() {
    return inDatabaseReadonly(async (db: DTDatabase) => {
        return MetadataDB.findAllUserTypes(db);
    });
}

export function getDomains() {
    return inDatabaseReadonly(async (db: DTDatabase) => {
        return MetadataDB.findAllDomains(db);
    }).then(domains => domains.map(d => ({
        name: d.name,
        description: d.description,
        addedTimestamp: d.added_timestamp,
        removedTimestamp: d.removed_timestamp,
    })) as ResultDomain[]);
}

export function getCsvData(year: number, month: number, domainName: string, counterId: string): Promise<string> {
    return inDatabaseReadonly((db: DTDatabase) => {
        return DataDb.getAllDataForMonth(
            db, year, month, parseString(domainName), parseNumber(counterId),
        );
    }).then(data => {
        console.info("method=getCsvData rowCount=%d", data.length);

        const csv = createObjectCsvStringifier({
            header: [
                {id: 'domain_name', title: 'DOMAIN'},
                {id: 'counter_name', title: 'COUNTER'},
                {id: 'user_type', title: 'USERTYPE'},
                {id: 'timestamp', title: 'TIMESTAMP'},
                {id: 'interval', title: 'INTERVAL'},
                {id: 'count', title: 'COUNT'},
                {id: 'status', title: 'STATUS'},
            ],
        });

        // overwrite timestamp to iso 8601
        const dataOut = data.map((row: DbCsvData) => R.assoc('timestamp', row.data_timestamp.toISOString(), row));

        return csv.getHeaderString() + csv.stringifyRecords(dataOut);
    });
}

function parseString(value: string): string | null {
    return !value || value === "" ? null : value;
}

function parseNumber(value: string): number | null {
    return !value || value === "" ? null : Number.parseInt(value);
}

export function getDataForCounter(counterId: number) {
    // should we return error, when counter is not found?
    return inDatabaseReadonly((db: DTDatabase) => {
        return DataDb.findAllData(db, counterId);
    }).then(data => data.map(row => ({
        dataTimestamp: row.data_timestamp,
        interval: row.interval,
        count: row.count,
        status: row.status,
    } as ResponseData)));
}

export function getCountersForDomain(domain: string): Promise<FeatureCollection> {
    // should we return error, when domain is not found?
    return inDatabaseReadonly((db: DTDatabase) => {
        return CounterDb.findAllCountersForDomain(db, domain);
    });
}
