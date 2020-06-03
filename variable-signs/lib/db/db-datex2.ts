import {IDatabase} from "pg-promise";
import {Situation} from "../service/variable-sign-updater";

const INSERT_DATEX2 =
`insert into device_data_datex2(device_id,datex2,effect_date)
values($(device_id), $(datex2), $(effect_date))
on conflict(device_id) do
update set datex2 = $(datex2), effect_date = $(effect_date)`

const SELECT_ALL =
    'select datex2 from device_data_datex2 order by device_id';

export function saveDatex2(db: IDatabase<any, any>, situations: Situation[]): Promise<any>[] {
    let promises: any[] = [];

    situations.forEach(s => {
       promises.push(db.none(INSERT_DATEX2, {
           device_id: s.id,
           datex2: s.datex2,
           effect_date: s.effect_date
       }));
    });

    return promises;
}

export async function findAll(db: IDatabase<any, any>): Promise<any[]> {
    return await db.any(SELECT_ALL);
}
