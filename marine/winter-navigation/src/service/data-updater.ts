import {
  type DTDatabase,
  inDatabase,
} from "@digitraffic/common/dist/database/database";
import { type ApiPath, IbnetApi } from "../api/ibnet-api.js";
import type { BaseAttributes, Deleted } from "../model/apidata.js";
import { setDeleted, type TableName } from "../db/deleted.js";
import { getDataVersion, updateDataVersion } from "../db/data-version.js";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import {
  saveAllPortSuspensionLocations,
  saveAllPortSuspensions,
} from "../db/port-suspensions.js";
import { saveAllLocations } from "../db/locations.js";
import { saveAllRestrictions } from "../db/restrictions.js";
import { saveAllVessels } from "../db/vessels.js";
import { saveAllActivities } from "../db/activities.js";
import { saveAllSources } from "../db/sources.js";
import { saveAllQueues } from "../db/queues.js";
import { saveAllDirwaypoints, saveAllDirways } from "../db/dirways.js";

type SaveFunction<T> = (db: DTDatabase, objects: T[]) => unknown;

export class DataUpdater {
  readonly _api: IbnetApi;

  constructor(baseUrl: string, authHeaderValue: string) {
    this._api = new IbnetApi(baseUrl, authHeaderValue);
  }

  async update(): Promise<void> {
    const to = await this._api.getCurrentVersion();

    await inDatabase(async (db: DTDatabase) => {
      await this.updateObjects(
        db,
        "wn_location",
        to,
        "location",
        saveAllLocations,
      );
      await this.updateObjects(
        db,
        "wn_restriction",
        to,
        "restriction",
        saveAllRestrictions,
      );
      await this.updateObjects(db, "wn_vessel", to, "vessel", saveAllVessels);
      await this.updateObjects(
        db,
        "wn_activity",
        to,
        "activity",
        saveAllActivities,
      );
      await this.updateObjects(db, "wn_source", to, "source", saveAllSources);
      await this.updateObjects(
        db,
        "wn_port_suspension",
        to,
        "port-suspension",
        saveAllPortSuspensions,
      );
      await this.updateObjects(
        db,
        "wn_port_suspension_location",
        to,
        "port-suspension-location",
        saveAllPortSuspensionLocations,
      );
      await this.updateObjects(db, "wn_queue", to, "queue", saveAllQueues);
      await this.updateObjects(db, "wn_dirway", to, "dirway", saveAllDirways);
      await this.updateObjects(
        db,
        "wn_dirwaypoint",
        to,
        "dirwaypoint",
        saveAllDirwaypoints,
      );
    });
  }

  async updateObjects<T extends BaseAttributes | Deleted>(
    db: DTDatabase,
    tableName: TableName,
    to: number,
    apiPath: ApiPath,
    saveObjects: SaveFunction<T>,
  ): Promise<void> {
    const start = Date.now();

    const from = await getDataVersion(db, tableName);

    const objects = await this._api.fetch<T>(apiPath, from, to);
    const deleted: Deleted[] = [];
    const updated: T[] = [];

    objects.forEach((o) => {
      if (o.deleted) {
        deleted.push(o);
      } else {
        updated.push(o);
      }
    });

    if (updated.length > 0) {
      await saveObjects(db, updated);
    }

    if (deleted.length > 0) {
      await setDeleted(db, tableName, deleted);
    }

    await updateDataVersion(db, tableName, to);

    logger.info({
      method: "DataUpdater.updateObjects",
      customObjectName: tableName,
      customUpdatedCount: updated.length,
      customDeletedCount: deleted.length,
      tookMs: Date.now() - start,
    });
  }
}
