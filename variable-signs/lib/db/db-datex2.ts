import {IDatabase} from "pg-promise";
import {Situation} from "../service/variable-sign-updater";
import {stream} from "../../../common/db/stream-util";

const QueryStream = require('pg-query-stream');

const INSERT_DATEX2 = 'insert into device_data_datex2(id,datex2,device_id, effect_date) values(nextval(\'seq_device_data_datex2\'), $(datex2), $(device_id), $(effect_date))'
const SELECT_ALL = 'select datex2 from device_data_datex2 where id in (select first_value(id) over (partition by device_id order by effect_date desc) from device_data_datex2 )';

export function saveDatex2(db: IDatabase<any, any>, situations: Situation[]): Promise<any>[] {
    let promises: any[] = [];

    situations.forEach(s => {
       promises.push(db.none(INSERT_DATEX2, {
           datex2: s.datex2,
           device_id: s.id,
           effect_date: s.effect_date
       }));
    });

    return promises;
}

export async function findAll(db: IDatabase<any, any>): Promise<string[]> {
    return stream(db, new QueryStream(SELECT_ALL), d => d.datex2);
}
