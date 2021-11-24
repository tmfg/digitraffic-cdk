import {IDatabase, PreparedStatement} from "pg-promise";
import {ApiData, DbData} from "../model/data";
import {DTDatabase} from "digitraffic-common/postgres/database";

const SQL_INSERT_DATA =
    `insert into counting_site_data(id, counter_id, data_timestamp, count, status, interval)
    values (NEXTVAL('counting_site_data_id_seq'), $1, $2, $3, $4, $5)`;

const SQL_GET_DATA =
    `select data_timestamp, interval, count, status 
    from counting_site_data 
    where counter_id = $1
    order by data_timestamp`;

const PS_INSERT_DATA = new PreparedStatement({
    name: 'insert-data',
    text: SQL_INSERT_DATA
});

const PS_GET_DATA = new PreparedStatement({
    name: 'get-data',
    text: SQL_GET_DATA
});

export async function insertData(db: DTDatabase, site_id: number, interval: number, data: ApiData[]) {
    return Promise.all(data.map(d => {
        db.none(PS_INSERT_DATA, [site_id, d.date, d.counts, d.status, interval]);
    }));
}

export function findAllData(db: DTDatabase, counterId: number): Promise<DbData[]> {
    return db.any(PS_GET_DATA,[counterId]);
}
