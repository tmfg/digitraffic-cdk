import {TloikLaite, TloikMetatiedot} from "../model/metatiedot";
import {TloikTilatiedot} from "../model/tilatiedot";
import * as MetadataDb from "../db/metadata";
import * as DataDb from "../db/data";
import {DbDevice} from "../model/device";
import {DTTransaction, inTransaction} from "../../../../digitraffic-common/database/database";
import {StatusCodeValue} from "../model/status-code-value";

type DeviceIdMap = Record<string, TloikLaite>;

export async function updateJsonData(tilatiedot: TloikTilatiedot): Promise<StatusCodeValue> {
    console.info('DEBUG ' + JSON.stringify(tilatiedot));

    await inTransaction((db: DTTransaction) => {
        return Promise.all(tilatiedot.liikennemerkit.map(async lm => {
            const id = await DataDb.insertDeviceData(db, lm);

            if (lm.rivit) {
                return Promise.all(lm.rivit.map(rivi => DataDb.insertDeviceDataRows(db, id, rivi)));
            }

            return Promise.resolve();
        }));
    });

    console.info("method=JsonUpdateService.updateJsonData updatedCount=%d", tilatiedot.liikennemerkit.length);

    return StatusCodeValue.OK;
}

export async function updateJsonMetadata(metadata: TloikMetatiedot): Promise<StatusCodeValue> {
    console.info('DEBUG ' + JSON.stringify(metadata));

    const idMap = createLaiteIdMap(metadata);

    await inTransaction(async (db: DTTransaction) => {
        const devices = await MetadataDb.getAllDevices(db);
        const removedDevices: string[] = [];
        const updatedCount = await updateDevices(db, devices, idMap, removedDevices);
        // updateDevices removes updated devices from idMap
        await MetadataDb.insertDevices(db, Object.values(idMap));
        await MetadataDb.removeDevices(db, removedDevices);

        console.info("method=JsonUpdateService.updateJsonMetadata removedCount=%d updatedCount=%d insertCount=%d",
            removedDevices.length, updatedCount, Object.values(idMap).length);
    });

    return StatusCodeValue.OK;
}

function createLaiteIdMap(metatiedot: TloikMetatiedot) {
    const idMap : DeviceIdMap = {};

    metatiedot.laitteet.forEach(laite => idMap[laite.tunnus] = laite);

    return idMap;
}

async function updateDevices(db: DTTransaction, devices: DbDevice[], idMap: DeviceIdMap, removedDevices: string[]) {
    let updatedCount = 0;

    for (const device of devices) {
        const apiDevice = idMap[device.id];

        if (apiDevice != null) {
            // a device from the API was found to match device in DB
            if (device.deleted_date != null) {
                console.info("Updating deleted device %s", device.id);
            }

            await MetadataDb.updateDevice(db, apiDevice);

            updatedCount++;

            delete idMap[device.id];
        } else if (device.deleted_date == null) {
            // no device from the API was found to match device in DB, and the device in DB is not marked deleted
            console.info("Removing device %s", device.id);

            removedDevices.push(device.id);
        }
    }

    return updatedCount;
}