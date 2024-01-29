import type { DTTransaction } from "@digitraffic/common/dist/database/database";
import type { TloikLiikennemerkinTila, TloikRivi } from "../model/tilatiedot.js";

const SQL_INSERT_DEVICE_DATA_ROW = `insert into device_data_row(id, device_data_id, screen, row_number, text)
values (nextval('device_data_row_id_seq'), $1, $2, $3, $4)`;

export async function insertDeviceDataRows(db: DTTransaction, id: number, tt: TloikRivi): Promise<void> {
    await db.none(SQL_INSERT_DEVICE_DATA_ROW, [id, tt.naytto, tt.rivi, tt.teksti]);
}

const SQL_INSERT_DEVICE_DATA = `insert into device_data(id, device_id, display_value, additional_information, effect_date, cause, reliability)
values (nextval('device_data_id_seq'), $1, $2, $3, $4, $5, $6)
returning id`;

interface Identifiable {
    id: number;
}

export function insertDeviceData(db: DTTransaction, tt: TloikLiikennemerkinTila): Promise<number> {
    return db
        .one(SQL_INSERT_DEVICE_DATA, [
            tt.tunnus,
            tt.nayttama,
            tt.lisatieto,
            tt.voimaan,
            tt.syy,
            tt.luotettavuus
        ])
        .then((r: Identifiable) => r.id);
}
