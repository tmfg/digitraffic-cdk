import { default as pgPromise } from "pg-promise";
import type { DTDatabase, DTTransaction } from "@digitraffic/common/dist/database/database";
import type { DbSituation, Situation } from "../model/situation.js";

const PS_INSERT_DATEX2 = new pgPromise.PreparedStatement({
    name: "insert-datex2", // don't set modified here as it will be updated by db trigger
    text: `insert into device_data_datex2(device_id,datex2,effect_date)
           values($1, $2, $3)
           on conflict(device_id) do
           update set datex2 = $2, effect_date = $3`
});

export async function saveDatex2(db: DTTransaction, situations: Situation[]): Promise<void> {
    await Promise.allSettled(
        situations.map((s) => db.none(PS_INSERT_DATEX2, [s.id, s.datex2, s.effectDate]))
    );
}

const PS_FIND_ALL_ACTIVE = new pgPromise.PreparedStatement({
    name: "find-all-active-datex2",
    text: `select datex2 from device_data_datex2 ddd, device
           where ddd.device_id = device.id
             and device.deleted_date is null
           order by ddd.device_id`
});

const PS_FIND_ALL_ACTIVE_LAST_MODIFIED = new pgPromise.PreparedStatement({
    name: "find-all-active-datex2-last-modified",
    text: `
    select max(src.modified) as modified
    from (select max(ddd.modified) as modified
          from device_data_datex2 ddd,
               device
          where ddd.device_id = device.id
            and device.deleted_date is null
          UNION
          select to_timestamp(0) as modified
    ) src`
});

export function findAll(db: DTDatabase): Promise<[DbSituation[], Date]> {
    return db.one(PS_FIND_ALL_ACTIVE_LAST_MODIFIED).then((modified: DbModified) => {
        return db.manyOrNone(PS_FIND_ALL_ACTIVE).then((data: DbSituation[]) => [data, modified.modified]);
    });
}

interface DbModified {
    readonly modified: Date;
}
