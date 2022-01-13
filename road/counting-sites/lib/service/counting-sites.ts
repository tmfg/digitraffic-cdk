import * as CounterDb from "../db/counter";
import * as DataDb from "../db/data";
import * as LastUpdatedDB from "digitraffic-common/database/last-updated";
import * as MetadataDB from "../db/metadata";
import {DTDatabase, inDatabaseReadonly} from "digitraffic-common/database/database";
import {DbDomain} from "../model/domain";
import {DbCsvData, DbData} from "../model/data";
import {FeatureCollection} from "geojson";
import {DbUserType} from "../model/usertype";
import {MetadataResponse} from "../model/metadata";
import {createObjectCsvStringifier} from 'csv-writer';
import * as R from 'ramda';

export function getMetadata(): Promise<MetadataResponse> {
    return inDatabaseReadonly(async (db: DTDatabase) => {
        const domains = await MetadataDB.findAllDomains(db);
        const userTypes = await MetadataDB.findAllUserTypes(db);
        const lastUpdated = await LastUpdatedDB.getLastUpdated(db, LastUpdatedDB.DataType.COUNTING_SITES_DATA);

        return createResponse(domains, userTypes, lastUpdated);
    });
}

export function getCsvData(year: number, month: number): Promise<string> {
    console.info("getting csv data for year %d month %d", year, month);

    return inDatabaseReadonly((db: DTDatabase) => {
        return DataDb.getAllDataForMonth(db, year, month);
    }).then(data => {
        console.info("data fetched!");

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

export function getDataForCounter(counterId: number): Promise<DbData[]> {
    // should we return error, when counter is not found?
    return inDatabaseReadonly((db: DTDatabase) => {
        return DataDb.findAllData(db, counterId);
    });
}

export function getCountersForDomain(domain: string): Promise<FeatureCollection> {
    // should we return error, when domain is not found?
    return inDatabaseReadonly((db: DTDatabase) => {
        return CounterDb.findAllCountersForDomain(db, domain);
    });
}

function createResponse(domains: DbDomain[], userTypes: DbUserType[], lastUpdated: Date|null): MetadataResponse {
    return {
        lastUpdated,
        domains,
        userTypes,
        directions: {
            "1": "in",
            "2": "out",
            "5": "no direction",
        },
    };
}