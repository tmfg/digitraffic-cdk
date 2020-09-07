import {IDatabase, PreparedStatement} from "pg-promise";
import {Situation} from "../service/variable-sign-updater";

const INSERT_DATEX2 =
`insert into device_data_datex2(device_id,datex2,effect_date)
values($1, $2, $3)
on conflict(device_id) do
update set datex2 = $2, effect_date = $3`

const SELECT_ALL =
    'select datex2 from device_data_datex2 order by device_id';

export function saveDatex2(db: IDatabase<any, any>, situations: Situation[]): Promise<any>[] {
    const ps = new PreparedStatement({
        name: 'insert-datex2',
        text: INSERT_DATEX2,
    });

    return situations.map(s => {
        return db.none(ps, [
            s.id,
            s.datex2,
            s.effect_date]);
    });
}

export async function findAll(db: IDatabase<any, any>): Promise<any[]> {
    const ps = new PreparedStatement({
        name: 'find-all-datex2',
        text: SELECT_ALL
    });

    return await db.any(ps);
}
