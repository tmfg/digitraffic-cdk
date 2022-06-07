import {PreparedStatement} from "pg-promise";
import {DTDatabase, DTTransaction} from "digitraffic-common/database/database";
import {DbSituation, Situation} from "../model/situation";

const SQL_INSERT_DATEX2 =
`insert into device_data_datex2(device_id,datex2,effect_date,updated_timestamp)
values($1, $2, $3, $4)
on conflict(device_id) do
update set datex2 = $2, effect_date = $3, updated_timestamp = $4`;

const PS_INSERT_DATEX2 = new PreparedStatement({
    name: 'insert-datex2',
    text: SQL_INSERT_DATEX2,
});

export function saveDatex2(db: DTTransaction, situations: Situation[], timestamp: Date): Promise<null>[] {
    return situations.map(s => {
        return db.none(PS_INSERT_DATEX2, [
            s.id,
            s.datex2,
            s.effectDate,
            timestamp]);
    });
}

const SQL_SELECT_ALL_ACTIVE =
    `select datex2 from device_data_datex2 ddd, device
    where ddd.device_id = device.id
    and device.deleted_date is null
    order by ddd.device_id`;

const PS_FIND_ALL_ACTIVE = new PreparedStatement({
    name: 'find-all-active-datex2',
    text: SQL_SELECT_ALL_ACTIVE,
});


export function findAll(db: DTDatabase): Promise<DbSituation[]> {
    return db.any(PS_FIND_ALL_ACTIVE);
}
