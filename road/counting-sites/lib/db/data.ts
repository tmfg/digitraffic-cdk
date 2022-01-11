import {PreparedStatement} from "pg-promise";
import {ApiData, DbCsvData, DbData} from "../model/data";
import {DTDatabase} from "digitraffic-common/postgres/database";

const SQL_INSERT_DATA =
    `insert into counting_site_data(id, counter_id, data_timestamp, count, status, interval)
    values (NEXTVAL('counting_site_data_id_seq'), $1, $2, $3, $4, $5)`;

const SQL_GET_DATA =
    `select data_timestamp, interval, count, status 
    from counting_site_data 
    where counter_id = $1
    order by data_timestamp`;

const SQL_GET_DATA_FOR_MONTH =
    `select csc.domain_name, csc.name counter_name, csut.name user_type, csd.data_timestamp, csd.interval, csd.count, csd.status 
    from counting_site_data csd, counting_site_counter csc, counting_site_user_type csut 
    where csd.counter_id = csc.id
    and csc.user_type_id = csut.id 
    and date_part('year', data_timestamp) = $1
    and date_part('month', data_timestamp) = $2
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

export function findAllData(db: DTDatabase, counterId: number): Promise<DbData[]> {
    return db.manyOrNone(PS_GET_DATA,[counterId]);
}

export function getAllDataForMonth(db: DTDatabase, year: number, month: number): Promise<DbCsvData[]> {
    return db.manyOrNone(PS_GET_DATA_FOR_MONTH, [year, month]);
}