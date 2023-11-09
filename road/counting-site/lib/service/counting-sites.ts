import * as CounterDAO from "../dao/counter";
import * as DataDAO from "../dao/data";
import * as DomainDAO from "../dao/domain";
import * as UserTypeDAO from "../dao/user-type";
import { DTDatabase, inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import { ResultDomain } from "../model/domain";
import { DbCsvData, ResponseData } from "../model/data";
import { createObjectCsvStringifier } from "csv-writer";
import { ResultUserTypes } from "../model/usertype";
import { FeatureCollection } from "geojson";
import { EPOCH } from "@digitraffic/common/dist/utils/date-utils";

import _ from "lodash";

export function getUserTypes(): Promise<[ResultUserTypes, Date]> {
    return inDatabaseReadonly((db: DTDatabase) => {
        return UserTypeDAO.findAllUserTypes(db);
    });
}

export function getDomains(): Promise<[ResultDomain[], Date]> {
    return inDatabaseReadonly((db: DTDatabase) => {
        return DomainDAO.findAllDomains(db);
    }).then((domains) => {
        const results = domains.map(
            (d) =>
                ({
                    name: d.name,
                    description: d.description,
                    addedTimestamp: d.created,
                    removedTimestamp: d.removed_timestamp,
                    dataUpdatedTime: d.modified
                } satisfies ResultDomain)
        );
        const lastModified = results.map((r) => r.dataUpdatedTime).reduce((a, b) => (a > b ? a : b), EPOCH);

        return [results, lastModified];
    });
}

export function getValuesForMonth(
    year: number,
    month: number,
    domainName: string,
    counterId: string
): Promise<[string, Date]> {
    return inDatabaseReadonly((db: DTDatabase) => {
        return DataDAO.findDataForMonth(db, year, month, domainName, counterId);
    }).then(([data, lastModified]) => {
        const csv = createObjectCsvStringifier({
            header: [
                { id: "domain_name", title: "DOMAIN" },
                { id: "counter_name", title: "COUNTER" },
                { id: "user_type", title: "USERTYPE" },
                { id: "timestamp", title: "TIMESTAMP" },
                { id: "interval", title: "INTERVAL" },
                { id: "count", title: "COUNT" },
                { id: "status", title: "STATUS" }
            ]
        });

        // overwrite timestamp to iso 8601
        const dataOut = data.map((row: DbCsvData) =>
            _.set(row, "timestamp", row.data_timestamp.toISOString())
        );
        const rows = data.length === 0 ? "" : csv.stringifyRecords(dataOut);

        return [`${csv.getHeaderString() ?? ""}${rows}`, lastModified];
    });
}

export function findCounterValues(
    year?: number,
    month?: number,
    counterId: string = "",
    domainName: string = ""
): Promise<[ResponseData[], Date]> {
    return inDatabaseReadonly((db: DTDatabase) => {
        return DataDAO.findValues(
            db,
            year || new Date().getUTCFullYear(),
            month || new Date().getUTCMonth() + 1,
            counterId,
            domainName
        );
    }).then(([data, lastModified]) => [
        data.map(
            (row) =>
                ({
                    counterId: row.counter_id,
                    dataTimestamp: row.data_timestamp,
                    interval: row.interval,
                    count: row.count,
                    status: row.status
                } satisfies ResponseData)
        ),
        lastModified
    ]);
}

export function findCounters(
    domain: string = "",
    counterId: string = ""
): Promise<[FeatureCollection, Date]> {
    return inDatabaseReadonly((db: DTDatabase) => {
        return CounterDAO.findCounters(db, domain, counterId).then((featureCollection) => {
            // FeatureCollection has un standard dataUpdatedTime field in sql query
            const collectionWithDataUpdatedTime = featureCollection as unknown as { dataUpdatedTime: string };
            const lastModified = new Date(collectionWithDataUpdatedTime.dataUpdatedTime);
            return [featureCollection, lastModified];
        });
    });
}
