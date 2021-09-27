import {IDatabase, PreparedStatement} from "pg-promise";

const SQL_INSERT_DATA =
    `insert into counting_site_data(id, counter_id, data_timestamp, count, status, interval)
    values (NEXTVAL('counting_site_data_id_seq'), $1, $2, $3, $4, $5)`;

const PS_INSERT_DATA = new PreparedStatement({
    name: 'insert-data',
    text: SQL_INSERT_DATA
})

export async function insertData(db: IDatabase<any, any>, site_id: number, interval: number, data: any[]) {
    return Promise.all(data.map(d => {
        db.none(PS_INSERT_DATA, [site_id, d.date, d.counts, d.status, interval]);
    }));
}
