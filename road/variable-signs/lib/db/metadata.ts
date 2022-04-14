import {DbDevice} from "../model/device";
import {DTTransaction} from "digitraffic-common/database/database";
import {TloikLaite} from "../model/metatiedot";

const SQL_UPDATE_DEVICE = `
    update device
        set updated_date = current_timestamp, type = $2, road_address = $3, direction = $4, carriageway = $5, etrs_tm35fin_x = $6, etrs_tm35fin_y = $7
        where id = $1
`;

export function updateDevice(db: DTTransaction, device: TloikLaite) {
    return db.none(SQL_UPDATE_DEVICE, [device.tunnus, device.tyyppi, device.sijainti.tieosoite, device.sijainti.ajosuunta, device.sijainti.ajorata, device.sijainti.e, device.sijainti.n]);
}

const SQL_INSERT_DEVICE = `
    insert into device(id, updated_date, type, road_address, direction, carriageway, etrs_tm35fin_x, etrs_tm35fin_y)
    values ($1, current_timestamp, $2, $3, $4, $5, $6, $7)
`;

export function insertDevices(db: DTTransaction, devices: TloikLaite[]) {
    return db.batch(devices.map(d => db.none(SQL_INSERT_DEVICE, [d.tunnus, d.tyyppi, d.sijainti.tieosoite, d.sijainti.ajosuunta, d.sijainti.ajorata, d.sijainti.e, d.sijainti.n])));
}

const SQL_GET_DEVICES = `
    select id, updated_date, type, road_address, direction, carriageway, etrs_tm35fin_x, etrs_tm35fin_y
    from device
    where id in ($1:list)
`;

export function getDevices(db: DTTransaction, idList: string[]): Promise<DbDevice[]> {
    if (idList.length > 0) {
        return db.manyOrNone(SQL_GET_DEVICES, [idList]);
    }

    return Promise.resolve([]);
}