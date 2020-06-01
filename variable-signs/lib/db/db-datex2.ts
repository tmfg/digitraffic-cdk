import {IDatabase} from "pg-promise";
import {Situation} from "../service/variable-sign-updater";

const INSERT_DATEX2 = 'insert into device_data_datex2(id,datex2,device_id, effect_date) values(nextval(\'seq_device_data_datex2\'), $(datex2), $(device_id), $(effect_date))'

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