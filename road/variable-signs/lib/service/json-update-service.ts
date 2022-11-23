import { TloikLaite, TloikMetatiedot } from "../model/metatiedot";
import { TloikTilatiedot } from "../model/tilatiedot";
import * as MetadataDb from "../db/metadata";
import * as DataDb from "../db/data";
import { DbDevice } from "../model/device";
import {
    DTTransaction,
    inTransaction,
} from "@digitraffic/common/dist/database/database";
import { StatusCodeValue } from "../model/status-code-value";

type DeviceIdMap = Map<string, TloikLaite>;

export async function updateJsonData(
    tilatiedot: TloikTilatiedot
): Promise<StatusCodeValue> {
    console.info("DEBUG %s", JSON.stringify(tilatiedot));

    await inTransaction(async (db: DTTransaction) => {
        await Promise.all(
            tilatiedot.liikennemerkit.map(async (lm) => {
                const id = await DataDb.insertDeviceData(db, lm);

                return lm.rivit
                    ? Promise.all(
                          lm.rivit.map((rivi) =>
                              DataDb.insertDeviceDataRows(db, id, rivi)
                          )
                      )
                    : Promise.resolve();
            })
        );
    });

    console.info(
        "method=JsonUpdateService.updateJsonData updatedCount=%d",
        tilatiedot.liikennemerkit.length
    );

    return StatusCodeValue.OK;
}

export async function updateJsonMetadata(
    metadata: TloikMetatiedot
): Promise<StatusCodeValue> {
    console.info("DEBUG " + JSON.stringify(metadata));

    const idMap = createLaiteIdMap(metadata);

    await inTransaction(async (db: DTTransaction) => {
        const devices = await MetadataDb.getAllDevices(db);
        const [updatedCount, removedDevices] = await updateDevices(
            db,
            devices,
            idMap
        );
        // updateDevices removes updated devices from idMap
        await MetadataDb.insertDevices(db, [...idMap.values()]);
        await MetadataDb.removeDevices(db, removedDevices);

        console.info(
            "method=JsonUpdateService.updateJsonMetadata removedCount=%d updatedCount=%d insertCount=%d",
            removedDevices.length,
            updatedCount,
            Object.values(idMap).length
        );
    });

    return StatusCodeValue.OK;
}

function createLaiteIdMap(metatiedot: TloikMetatiedot) {
    const idMap: DeviceIdMap = new Map();

    metatiedot.laitteet.forEach((laite) => idMap.set(laite.tunnus, laite));

    return idMap;
}

async function updateDevices(
    db: DTTransaction,
    devices: DbDevice[],
    idMap: DeviceIdMap
): Promise<[number, string[]]> {
    const removedDevices: string[] = [];
    let updatedCount = 0;

    for (const device of devices) {
        const apiDevice = idMap.get(device.id);

        if (apiDevice != undefined) {
            // a device from the API was found to match device in DB
            if (device.deleted_date != null) {
                console.info("Updating deleted device %s", device.id);
            }

            await MetadataDb.updateDevice(db, apiDevice);

            updatedCount++;

            idMap.delete(device.id);
        } else if (device.deleted_date == null) {
            // no device from the API was found to match device in DB, and the device in DB is not marked deleted
            console.info("Removing device %s", device.id);

            removedDevices.push(device.id);
        }
    }

    return [updatedCount, removedDevices];
}
