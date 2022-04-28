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
        const devices = await MetadataDb.getDevices(db, Object.keys(idMap));

        const updatedCount = await updateDevices(db, devices, idMap);
        // updateDevices removes updated devices from idMap
        await MetadataDb.insertDevices(db, Object.values(idMap));

        console.info("method=JsonUpdateService.updateJsonMetadata updatedCount=%d insertCount=%d", updatedCount, Object.values(idMap).length);
    });

    return StatusCodeValue.OK;
}

function createLaiteIdMap(metatiedot: TloikMetatiedot) {
    const idMap : DeviceIdMap = {};

    metatiedot.laitteet.forEach(laite => idMap[laite.tunnus] = laite);

    return idMap;
}

async function updateDevices(db: DTTransaction, devices: DbDevice[], idMap: DeviceIdMap) {
    let updatedCount = 0;

    for (const device of devices) {
        const apiDevice = idMap[device.id];

        if (apiDevice != null) {
            await MetadataDb.updateDevice(db, apiDevice);

            updatedCount++;

            delete idMap[device.id];
        } else {
            console.error("Could not find " + device.id);
        }
    }

    return updatedCount;
}