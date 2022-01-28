import {PreparedStatement} from "pg-promise";
import {ApiData, DbCsvData, DbData} from "../model/data";
import {DTDatabase} from "digitraffic-common/database/database";

const SQL_INSERT_DATA =
    `insert into counting_site_data(id, counter_id, data_timestamp, count, status, interval)
    values (NEXTVAL('counting_site_data_id_seq'), $1, $2, $3, $4, $5)`;

const SQL_GET_DATA =
    `select csd.data_timestamp, csd.interval, csd.count, csd.status 
    from counting_site_data csd, counting_site_counter csc
    where csd.counter_id = csc.id 
    and (csd.counter_id = $1 or $1 is null)
    and (csc.domain_name = $2 or $2 is null)
    order by 1`;

const SQL_GET_DATA_FOR_MONTH =
    `select csc.domain_name, csc.name counter_name, csut.name user_type, csd.data_timestamp, csd.interval, csd.count, csd.status 
    from counting_site_data csd, counting_site_counter csc, counting_site_user_type csut 
    where csd.counter_id = csc.id
    and csc.user_type_id = csut.id 
    and data_timestamp >= $1 and data_timestamp < $2
    and (csc.domain_name = $3 or $3 is null)
    and (csd.counter_id = $4 or $4 is null)
    order by 1, 2, 3, 4`;

const PS_INSERT_DATA = new PreparedStatement({
    name: 'insert-data',
    text: SQL_INSERT_DATA,
});

const PS_GET_DATA = new PreparedStatement({
    name: 'get-data',
    text: SQL_GET_DATA,
});

const PS_GET_DATA_FOR_MONTH = new PreparedStatement({
    name: 'get-data-for-month',
    text: SQL_GET_DATA_FOR_MONTH,
});

export function insertData(db: DTDatabase, siteId: number, interval: number, data: ApiData[]) {
    return Promise.all(data.map(d => {
        return db.none(PS_INSERT_DATA, [siteId, d.date, d.counts, d.status, interval]);
    }));
}

export function findAllData(db: DTDatabase, counterId: number | null, domainName: string | null): Promise<DbData[]> {
    return db.manyOrNone(PS_GET_DATA,[counterId, domainName]);
}

export function getAllDataForMonth(
    db: DTDatabase, year: number, month: number, domainName: string | null, counterId: number | null,
): Promise<DbCsvData[]> {
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(new Date(startDate).setMonth(month));

    return db.manyOrNone(PS_GET_DATA_FOR_MONTH, [startDate, endDate, domainName, counterId]);
}