import { DTTransaction } from "@digitraffic/common/database/database";
import { TloikLiikennemerkinTila, TloikRivi } from "../model/tilatiedot";

const SQL_INSERT_DEVICE_DATA_ROW = `insert into device_data_row(id, device_data_id, screen, row_number, text)
values (nextval('device_data_row_id_seq'), $1, $2, $3, $4)`;

export function insertDeviceDataRows(
    db: DTTransaction,
    id: number,
    tt: TloikRivi
) {
    return db.none(SQL_INSERT_DEVICE_DATA_ROW, [
        id,
        tt.naytto,
        tt.rivi,
        tt.teksti,
    ]);
}

const SQL_INSERT_DEVICE_DATA = `insert into device_data(id, created_date, device_id, display_value, additional_information, effect_date, cause, reliability)
values (nextval('device_data_id_seq'), current_timestamp, $1, $2, $3, $4, $5, $6)
returning id`;

interface Identifiable {
    id: number;
};

export function insertDeviceData(
    db: DTTransaction,
    tt: TloikLiikennemerkinTila
) {
    return db
        .one(SQL_INSERT_DEVICE_DATA, [
            tt.tunnus,
            tt.nayttama,
            tt.lisatieto,
            tt.voimaan,
            tt.syy,
            tt.luotettavuus,
        ])
        .then((r: Identifiable) => r.id);
}
