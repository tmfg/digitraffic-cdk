import {PreparedStatement} from "pg-promise";
import {DTDatabase, DTTransaction} from "digitraffic-common/database/database";
import {DbSituation, Situation} from "../model/situation";

const INSERT_DATEX2 =
`insert into device_data_datex2(device_id,datex2,effect_date,updated_timestamp)
values($1, $2, $3, $4)
on conflict(device_id) do
update set datex2 = $2, effect_date = $3, updated_timestamp = $4`;

const SELECT_ALL =
    'select datex2 from device_data_datex2 order by device_id';

const INSERT_PS = new PreparedStatement({
    name: 'insert-datex2',
    text: INSERT_DATEX2,
});

const FIND_ALL_PS = new PreparedStatement({
    name: 'find-all-datex2',
    text: SELECT_ALL,
});

export function saveDatex2(db: DTTransaction, situations: Situation[], timestamp: Date): Promise<null>[] {
    return situations.map(s => {
        return db.none(INSERT_PS, [
            s.id,
            s.datex2,
            s.effectDate,
            timestamp]);
    });
}

export function findAll(db: DTDatabase): Promise<DbSituation[]> {
    return db.any(FIND_ALL_PS);
}
