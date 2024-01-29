import { default as pgPromise } from "pg-promise";
import type { ApiData, DbCsvData, DbData } from "../model/data.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { nullNumber, nullString } from "./counter.js";

const SQL_INSERT_VALUES = `insert into counting_site_data(id, counter_id, data_timestamp, count, status, interval)
    values (NEXTVAL('counting_site_data_id_seq'), $1, $2, $3, $4, $5)`;

const SQL_FIND_VALUES = `select csd.counter_id, csd.data_timestamp, csd.interval, csd.count, csd.status  
    from counting_site_data csd, counting_site_counter csc
    where csd.counter_id = csc.id
    and data_timestamp >= $1 and data_timestamp < $2
    and (csc.domain_name = $3 or $3 is null)
    and (csd.counter_id = $4 or $4 is null)
    order by 1`;

const SQL_FIND_VALUES_FOR_MONTH = `select csc.domain_name, csc.name counter_name, csut.name user_type, csd.data_timestamp, csd.interval, csd.count, csd.status, csd.modified 
    from counting_site_data csd, counting_site_counter csc, counting_site_user_type csut 
    where csd.counter_id = csc.id
    and csc.user_type_id = csut.id 
    and data_timestamp >= $1 and data_timestamp < $2
    and (csc.domain_name = $3 or $3 is null)
    and (csd.counter_id = $4 or $4 is null)
    order by 1, 2, 3, 4`;

const PS_INSERT_COUNTER_VALUES = new pgPromise.PreparedStatement({
    name: "insert-values",
    text: SQL_INSERT_VALUES
});

const PS_GET_VALUES = new pgPromise.PreparedStatement({
    name: "find-values",
    text: SQL_FIND_VALUES
});

const PS_GET_VALUES_LAST_MODIFIED = new pgPromise.PreparedStatement({
    name: "find-values-last-modified",
    text: `
    select max(sub.modified) as modified
    from (
        select csd.modified as modified
        from counting_site_data csd, counting_site_counter csc
        where csd.counter_id = csc.id
            and data_timestamp >= $1
            and data_timestamp < $2
            and (csc.domain_name = $3 or $3 is null)
            and (csd.counter_id = $4 or $4 is null)
        UNION
        select to_timestamp(0) as modified
      ) sub`
});

const PS_FIND_VALUES_FOR_MONTH = new pgPromise.PreparedStatement({
    name: "find-data-for-month",
    text: SQL_FIND_VALUES_FOR_MONTH
});

const PS_FIND_VALUES_FOR_MONTH_LAST_MODIFIED = new pgPromise.PreparedStatement({
    name: "find-data-for-month-last-modified",
    text: `
    select max(sub.modified) as modified
    from(
        select csc.modified 
        from counting_site_data csd, counting_site_counter csc, counting_site_user_type csut 
        where csd.counter_id = csc.id
        and csc.user_type_id = csut.id 
        and data_timestamp >= $1 and data_timestamp < $2
        and (csc.domain_name = $3 or $3 is null)
        and (csd.counter_id = $4 or $4 is null)
        UNION
        select to_timestamp(0) as modified
    ) sub`
});

export async function insertCounterValues(
    db: DTDatabase,
    siteId: number,
    interval: number,
    data: ApiData[]
): Promise<void> {
    await Promise.allSettled(
        data.map((d) => {
            return db.none(PS_INSERT_COUNTER_VALUES, [siteId, d.date, d.counts, d.status, interval]);
        })
    );
}

export function findValues(
    db: DTDatabase,
    year: number,
    month: number,
    counterId: string,
    domainName: string
): Promise<[DbData[], Date]> {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(new Date(startDate).setMonth(month));

    return db
        .one(PS_GET_VALUES_LAST_MODIFIED, [startDate, endDate, nullString(domainName), nullNumber(counterId)])
        .then((modified: DbModified) => {
            return db
                .manyOrNone(PS_GET_VALUES, [
                    startDate,
                    endDate,
                    nullString(domainName),
                    nullNumber(counterId)
                ])
                .then((data: DbData[]) => [data, modified.modified]);
        });
}

export function findDataForMonth(
    db: DTDatabase,
    year: number,
    month: number,
    domainName: string,
    counterId: string
): Promise<[DbCsvData[], Date]> {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(new Date(startDate).setMonth(month));

    return db
        .one(PS_FIND_VALUES_FOR_MONTH_LAST_MODIFIED, [
            startDate,
            endDate,
            nullString(domainName),
            nullNumber(counterId)
        ])
        .then((modified: DbModified) => {
            return db
                .manyOrNone(PS_FIND_VALUES_FOR_MONTH, [
                    startDate,
                    endDate,
                    nullString(domainName),
                    nullNumber(counterId)
                ])
                .then((data: DbCsvData[]) => [data, modified.modified]);
        });
}

interface DbModified {
    readonly modified: Date;
}
