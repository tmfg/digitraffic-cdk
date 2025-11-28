import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { inDatabase } from "@digitraffic/common/dist/database/database";
import * as LastUpdatedDB from "@digitraffic/common/dist/database/last-updated";
import type { ApiPath } from "../api/ibnet-api.js";
import { IbnetApi } from "../api/ibnet-api.js";
import { saveAllActivities } from "../db/activities.js";
import { getDataVersion, updateDataVersion } from "../db/data-version.js";
import type { TableName } from "../db/deleted.js";
import { setDeleted } from "../db/deleted.js";
import { saveAllDirwaypoints, saveAllDirways } from "../db/dirways.js";
import { saveAllLocations } from "../db/locations.js";
import {
  saveAllPortSuspensionLocations,
  saveAllPortSuspensions,
} from "../db/port-suspensions.js";
import { saveAllQueues } from "../db/queues.js";
import { saveAllRestrictions } from "../db/restrictions.js";
import { saveAllSources } from "../db/sources.js";
import { saveAllVessels } from "../db/vessels.js";
import type { ApiMetaData, Deleted } from "../model/api-db-model.js";

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

  async updateObjects<T extends ApiMetaData | Deleted>(
    db: DTDatabase,
    tableName: TableName,
    to: number,
    apiPath: ApiPath,
    saveObjects: SaveFunction<T>,
  ): Promise<void> {
    const start = new Date();

    const from = await getDataVersion(db, tableName);

    if (from === to) {
      logger.info({
        method: "DataUpdater.updateObjects",
        message: `Version number for ${tableName} not changed, skipping update`,
      });
      return;
    }

    const objects = await this._api.fetch<T>(apiPath, from, to);
    const deleted: Deleted[] = [];
    const updated: T[] = [];

    await LastUpdatedDB.updateUpdatedTimestamp(
      db,
      `${tableName.toUpperCase()}_CHECK`,
      start,
    );

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

    if (deleted.length > 0 || updated.length > 0) {
      await updateDataVersion(db, tableName, to);
      await LastUpdatedDB.updateUpdatedTimestamp(
        db,
        `${tableName.toUpperCase()}`,
        start,
      );
    }

    logger.info({
      method: "DataUpdater.updateObjects",
      customObjectName: tableName,
      customUpdatedCount: updated.length,
      customDeletedCount: deleted.length,
      tookMs: Date.now() - start.getTime(),
    });
  }
}
