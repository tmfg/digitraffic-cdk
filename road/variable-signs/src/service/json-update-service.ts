import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { DTTransaction } from "@digitraffic/common/dist/database/database";
import { inTransaction } from "@digitraffic/common/dist/database/database";
import * as DataDb from "../db/data.js";
import * as MetadataDb from "../db/metadata.js";
import type { DbDevice } from "../model/device.js";
import type { TloikLaite, TloikMetatiedot } from "../model/metatiedot.js";
import type { StatusCodeValue } from "../model/status-code-value.js";
import { StatusCodeValues } from "../model/status-code-value.js";
import type { TloikTilatiedot } from "../model/tilatiedot.js";

type DeviceIdMap = Map<string, TloikLaite>;

export async function updateJsonData(
  tilatiedot: TloikTilatiedot,
): Promise<StatusCodeValue> {
  logger.debug(tilatiedot);

  await inTransaction(async (db: DTTransaction) => {
    await Promise.all(
      tilatiedot.liikennemerkit.map(async (lm) => {
        const id = await DataDb.insertDeviceData(db, lm);

        return lm.rivit
          ? Promise.all(
              lm.rivit.map((rivi) => DataDb.insertDeviceDataRows(db, id, rivi)),
            )
          : Promise.resolve();
      }),
    );
  });

  logger.info({
    method: "JsonUpdateService.updateJsonData",
    customUpdatedCount: tilatiedot.liikennemerkit.length,
  });

  return StatusCodeValues.OK;
}

export async function updateJsonMetadata(
  metadata: TloikMetatiedot,
): Promise<StatusCodeValue> {
  logger.debug(metadata);

  const idMap = createLaiteIdMap(metadata);

  await inTransaction(async (db: DTTransaction) => {
    const devices = await MetadataDb.getAllDevices(db);
    const [updatedCount, removedDevices] = await updateDevices(
      db,
      devices,
      idMap,
    );
    // updateDevices removes updated devices from idMap
    await MetadataDb.insertDevices(db, [...idMap.values()]);
    await MetadataDb.removeDevices(db, removedDevices);

    logger.info({
      method: "JsonUpdateService.updateJsonMetadata",
      customRemovedCount: removedDevices.length,
      customUpdatedCount: updatedCount,
      customInsertCount: Object.values(idMap).length,
    });
  });

  return StatusCodeValues.OK;
}

function createLaiteIdMap(metatiedot: TloikMetatiedot): DeviceIdMap {
  return new Map(metatiedot.laitteet.map((laite) => [laite.tunnus, laite]));
}

async function updateDevices(
  db: DTTransaction,
  devices: DbDevice[],
  idMap: DeviceIdMap,
): Promise<[number, string[]]> {
  const removedDevices: string[] = [];
  let updatedCount = 0;

  for (const device of devices) {
    const apiDevice = idMap.get(device.id);

    if (apiDevice !== undefined) {
      // a device from the API was found to match device in DB
      if (device.deleted_date) {
        logger.info({
          method: "JsonUpdateService.updateDevices",
          message: `Updating deleted device ${device.id}`,
        });
      }

      await MetadataDb.updateDevice(db, apiDevice);

      updatedCount++;

      idMap.delete(device.id);
    } else if (!device.deleted_date) {
      // no device from the API was found to match device in DB, and the device in DB is not marked deleted
      logger.info({
        method: "JsonUpdateService.updateDevices",
        message: `Removing device ${device.id}`,
      });

      removedDevices.push(device.id);
    }
  }

  return [updatedCount, removedDevices];
}
