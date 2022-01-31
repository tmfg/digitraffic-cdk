import {PreparedStatement} from "pg-promise";
import {ApiData, DbCsvData, DbData} from "../model/data";
import {DTDatabase} from "digitraffic-common/database/database";
import {nullNumber, nullString} from "./counter";

const SQL_INSERT_VALUES =
    `insert into counting_site_data(id, counter_id, data_timestamp, count, status, interval)
    values (NEXTVAL('counting_site_data_id_seq'), $1, $2, $3, $4, $5)`;

const SQL_FIND_VALUES =
    `select csd.data_timestamp, csd.interval, csd.count, csd.status 
    from counting_site_data csd, counting_site_counter csc
    where csd.counter_id = csc.id 
    and (csd.counter_id = $1 or $1 is null)
    and (csc.domain_name = $2 or $2 is null)
    order by 1`;

const SQL_FIND_VALUES_FOR_MONTH =
    `select csc.domain_name, csc.name counter_name, csut.name user_type, csd.data_timestamp, csd.interval, csd.count, csd.status 
    from counting_site_data csd, counting_site_counter csc, counting_site_user_type csut 
    where csd.counter_id = csc.id
    and csc.user_type_id = csut.id 
    and data_timestamp >= $1 and data_timestamp < $2
    and (csc.domain_name = $3 or $3 is null)
    and (csd.counter_id = $4 or $4 is null)
    order by 1, 2, 3, 4`;

const PS_INSERT_COUNTER_VALUES = new PreparedStatement({
    name: 'insert-values',
    text: SQL_INSERT_VALUES,
});

const PS_GET_VALUES = new PreparedStatement({
    name: 'find-values',
    text: SQL_FIND_VALUES,
});

const PS_FIND_VALUES_FOR_MONTH = new PreparedStatement({
    name: 'find-data-for-month',
    text: SQL_FIND_VALUES_FOR_MONTH,
});

export function insertCounterValues(db: DTDatabase, siteId: number, interval: number, data: ApiData[]) {
    return Promise.all(data.map(d => {
        return db.none(PS_INSERT_COUNTER_VALUES, [siteId, d.date, d.counts, d.status, interval]);
    }));
}

export function findValues(db: DTDatabase, counterId: string, domainName: string): Promise<DbData[]> {
    return db.manyOrNone(PS_GET_VALUES,[nullNumber(counterId), nullString(domainName)]);
}

export function findDataForMonth(
    db: DTDatabase, year: number, month: number, domainName: string, counterId: string,
): Promise<DbCsvData[]> {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(new Date(startDate).setMonth(month));

    return db.manyOrNone(PS_FIND_VALUES_FOR_MONTH, [startDate, endDate, nullString(domainName), nullNumber(counterId)]);
}