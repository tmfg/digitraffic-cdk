import * as CounterDAO from "../dao/counter";
import * as DataDAO from "../dao/data";
import * as DomainDAO from "../dao/domain";
import * as UserTypeDAO from "../dao/user-type";
import {
    DTDatabase,
    inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import { ResultDomain } from "../model/domain";
import { DbCsvData, ResponseData } from "../model/data";
import { createObjectCsvStringifier } from "csv-writer";
import * as R from "ramda";

export function getUserTypes() {
    return inDatabaseReadonly((db: DTDatabase) => {
        return UserTypeDAO.findAllUserTypes(db);
    });
}

export function getDomains() {
    return inDatabaseReadonly((db: DTDatabase) => {
        return DomainDAO.findAllDomains(db);
    }).then(
        (domains) =>
            domains.map((d) => ({
                name: d.name,
                description: d.description,
                addedTimestamp: d.added_timestamp,
                removedTimestamp: d.removed_timestamp,
            })) as ResultDomain[]
    );
}

export function getValuesForMonth(
    year: number,
    month: number,
    domainName: string,
    counterId: string
): Promise<string> {
    return inDatabaseReadonly((db: DTDatabase) => {
        return DataDAO.findDataForMonth(db, year, month, domainName, counterId);
    }).then((data) => {
        const csv = createObjectCsvStringifier({
            header: [
                { id: "domain_name", title: "DOMAIN" },
                { id: "counter_name", title: "COUNTER" },
                { id: "user_type", title: "USERTYPE" },
                { id: "timestamp", title: "TIMESTAMP" },
                { id: "interval", title: "INTERVAL" },
                { id: "count", title: "COUNT" },
                { id: "status", title: "STATUS" },
            ],
        });

        // overwrite timestamp to iso 8601
        const dataOut = data.map((row: DbCsvData) =>
            R.assoc("timestamp", row.data_timestamp.toISOString(), row)
        );
        const rows = data.length === 0 ? "" : csv.stringifyRecords(dataOut);

        return `${csv.getHeaderString() ?? ""}${rows}`;
    });
}

export function findCounterValues(
    year?: number,
    month?: number,
    counterId = "",
    domainName = ""
) {
    return inDatabaseReadonly((db: DTDatabase) => {
        return DataDAO.findValues(
            db,
            year ?? new Date().getUTCFullYear(),
            month ?? new Date().getUTCMonth() + 1,
            counterId,
            domainName
        );
    }).then((data) =>
        data.map(
            (row) =>
                ({
                    counterId: row.counter_id,
                    dataTimestamp: row.data_timestamp,
                    interval: row.interval,
                    count: row.count,
                    status: row.status,
                } as ResponseData)
        )
    );
}

export function findCounters(domain = "", counterId = "") {
    return inDatabaseReadonly((db: DTDatabase) => {
        return CounterDAO.findCounters(db, domain, counterId);
    });
}
