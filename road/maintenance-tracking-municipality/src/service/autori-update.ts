import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import {
  inDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import * as CommonDateUtils from "@digitraffic/common/dist/utils/date-utils";
import type { GeoJsonPoint } from "@digitraffic/common/dist/utils/geojson-types";
import * as CommonUtils from "@digitraffic/common/dist/utils/utils";
import { add } from "date-fns/add";
import type { Position } from "geojson";
import type { AutoriApi } from "../api/autori.js";
import * as DataDb from "../dao/data.js";
import type {
  ApiContractData,
  ApiOperationData,
  ApiRouteData,
} from "../model/autori-api-data.js";
import type {
  DbDomainContract,
  DbDomainTaskMapping,
  DbLatestTracking,
  DbMaintenanceTracking,
  DbNumberId,
  DbTextId,
  DbWorkMachine,
} from "../model/db-data.js";
import { TrackingSaveResult } from "../model/tracking-save-result.js";
import * as AutoriUtils from "./autori-utils.js";
import * as CommonUpdateService from "./common-update.js";
import logger from "./maintenance-logger.js";
import * as Utils from "./utils.js";

const service = "AutoriUpdate";
export class AutoriUpdate {
  readonly api: AutoriApi;

  constructor(api: AutoriApi) {
    this.api = api;
  }

  /**
   * Update contracts from remote api to db
   * @param domainName Solution domain name ie. myprovider-helsinki
   * @return inserted count
   */
  async updateContractsForDomain(domainName: string): Promise<number> {
    const method: `${string}.${string}` = `${service}.updateContractsForDomain`;
    const apiContracts: ApiContractData[] = await this.api.getContracts();
    const dbContracts: DbDomainContract[] = AutoriUtils.createDbDomainContracts(
      apiContracts,
      domainName,
    );

    const dbIds: (DbTextId | undefined)[] = await inDatabase(
      (db: DTDatabase) => {
        return DataDb.upsertContracts(db, dbContracts);
      },
    );
    logger.info({
      method,
      message: `Insert return value: ${JSON.stringify(dbIds)}`,
      customDomain: domainName,
    });
    // Returns array [{"id":89},null,null,{"id":90}] -> nulls are conflicting ones not inserted
    return dbIds.filter((dbId) => dbId?.id !== null).length;
  }

  /**
   * Update tasks from remote api to db
   * @param domainName Solution domain name ie. myprovider-helsinki
   * @return inserted count
   */
  async updateTaskMappingsForDomain(domainName: string): Promise<number> {
    const method: `${string}.${string}` = `${service}.updateTaskMappingsForDomain`;
    const apiOperations: ApiOperationData[] = await this.api.getOperations();
    const taskMappings: DbDomainTaskMapping[] =
      AutoriUtils.createDbDomainTaskMappings(apiOperations, domainName);

    const dbIds: (DbTextId | undefined)[] = await inDatabase(
      (db: DTDatabase) => {
        return DataDb.upsertTaskMappings(db, taskMappings);
      },
    );
    logger.info({
      method,
      message: `Insert return value: ${JSON.stringify(dbIds)}`,
      customDomain: domainName,
    });
    // Returns array [{"original_id":89},null,null,{"original_id":90}] -> nulls are conflicting ones not inserted
    return dbIds.filter((dbId) => dbId?.id !== null).length;
  }

  /**
   * @param domainName Solution domain name ie. myprovider-helsinki
   * @return TrackingSaveResult update result
   */
  async updateTrackingsForDomain(
    domainName: string,
  ): Promise<TrackingSaveResult> {
    const timerStart = Date.now();
    const method: `${string}.${string}` = `${service}.updateTrackingsForDomain`;

    try {
      const contracts: DbDomainContract[] = await inDatabaseReadonly(
        (db: DTDatabase) => {
          return DataDb.getContractsWithSource(db, domainName);
        },
      );

      const taskMappings: DbDomainTaskMapping[] = await inDatabaseReadonly(
        (db: DTDatabase) => {
          return DataDb.getTaskMappings(db, domainName);
        },
      );

      return Promise.allSettled(
        contracts.map((contract: DbDomainContract) => {
          const start =
            AutoriUtils.resolveNextStartTimeForDataFromApi(contract);
          return this.updateContractTrackings(contract, taskMappings, start);
        }),
      )
        .then((results: PromiseSettledResult<TrackingSaveResult>[]) => {
          const summedResult =
            CommonUpdateService.sumResultsFromPromises(results);
          logger.info({
            method,
            customDomain: domainName,
            customErrorCount: summedResult.errors,
            customCount: summedResult.saved,
            tookMs: Date.now() - timerStart,
          });
          return summedResult;
        })
        .then((finalResult) => {
          return inDatabase((db: DTDatabase) => {
            return CommonUpdateService.updateDataChecked(
              db,
              domainName,
              finalResult,
            );
          });
        });
    } catch (error) {
      logger.error({
        method,
        message: `Failed for all contracts`,
        customDomain: domainName,
        error,
      });
      throw error;
    }
  }

  /**
   * Function will get route data from api from given date and save it to db and recursively
   * call again the function with new date until no new data is available
   *
   * @param contract witch trackings to update
   * @param taskMappings mappings for api tasks -> harja tasks
   * @param apiDataUpdatedFrom exclusive start time where to start asking for new data from api
   * @private
   */
  private updateContractTrackings(
    contract: DbDomainContract,
    taskMappings: DbDomainTaskMapping[],
    apiDataUpdatedFrom: Date,
  ): Promise<TrackingSaveResult> {
    const method: `${string}.${string}` = `${service}.updateContractTrackings`;
    logger.info({
      method,
      message: `getNextRouteDataForContract from ${apiDataUpdatedFrom.toISOString()}`,
      customDomain: contract.domain,
      customContract: contract.contract,
    });
    return this.api
      .getNextRouteDataForContract(
        contract,
        apiDataUpdatedFrom,
        add(new Date(), { minutes: 1 }),
      )
      .then((apiRouteData) =>
        this.saveContractRouteDataAsTrackings(
          contract,
          taskMappings,
          apiDataUpdatedFrom,
          apiRouteData,
        ),
      )
      .catch((error: Error) => {
        logger.error({ method, error });
        return TrackingSaveResult.createError(0);
      });
  }

  /**
   * Method to save api routes as trackings to db
   * @param contract witch trackings to update
   * @param taskMappings mappings for api tasks -> harja tasks
   * @param apiDataUpdatedFrom exclusive start time where to start asking for new data from api
   * @param originalRouteData route data from api
   * @private
   */
  private saveContractRouteDataAsTrackings(
    contract: DbDomainContract,
    taskMappings: DbDomainTaskMapping[],
    apiDataUpdatedFrom: Date,
    originalRouteData: ApiRouteData[],
  ): Promise<TrackingSaveResult> {
    const method: `${string}.${string}` = `${service}.saveContractRouteDataAsTrackings`;

    const start = Date.now();

    const fixedRouteData: ApiRouteData[] =
      AutoriUtils.fixApiRouteDatas(originalRouteData);

    if (fixedRouteData.length === 0) {
      logger.info({
        method,
        message: `No new data after ${apiDataUpdatedFrom.toISOString()}`,
        customDomain: contract.domain,
        customContract: contract.contract,
      });
      return Promise.resolve(new TrackingSaveResult(0, 0, 0));
    }

    return inDatabase(async (db: DTDatabase) => {
      const saveResults: TrackingSaveResult[] = [];
      for (const routeData of fixedRouteData) {
        const messageSizeBytes = Utils.countEstimatedSizeOfMessage(routeData);

        try {
          const machineId: DbNumberId = await db.tx((tx) => {
            const workMachine: DbWorkMachine = AutoriUtils.createDbWorkMachine(
              contract.contract,
              contract.domain,
              routeData.user,
              routeData.vehicleType,
            );
            return DataDb.upsertWorkMachine(tx, workMachine);
          });
          logger.debug(`${method} upsertWorkMachine with id ${machineId.id}`);

          const tasks: string[] = AutoriUtils.getTasksForOperations(
            routeData.operations,
            taskMappings,
          );
          const tracking: DbMaintenanceTracking | undefined =
            AutoriUtils.createDbMaintenanceTracking(
              machineId.id,
              routeData,
              contract,
              tasks,
            );

          const saveResult: TrackingSaveResult = tracking
            ? await this.saveMaintenanceTrackingAndUpdatePrevious(
                db,
                tracking,
                contract,
                machineId,
                messageSizeBytes,
                CommonDateUtils.dateFromIsoString(
                  routeData.updated ?? routeData.endTime,
                ),
              )
            : TrackingSaveResult.createSaved(messageSizeBytes, 0);
          saveResults.push(saveResult);
        } catch (error) {
          logger.error({
            method,
            message: `failed for routeData ${routeData.id}`,
            customDomain: contract.domain,
            customContract: contract.contract,
            error,
          });
          saveResults.push(TrackingSaveResult.createError(messageSizeBytes));
        }
      }
      const summedResult = CommonUpdateService.sumResults(saveResults);
      logger.info({
        method,
        message: `summary`,
        customDomain: contract.domain,
        customContract: contract.contract,
        customErrorCount: summedResult.errors,
        customSizeBytes: summedResult.sizeBytes,
        tookMs: Date.now() - start,
        customCount: summedResult.saved,
      });
      return summedResult;
    });
  }

  private async saveMaintenanceTrackingAndUpdatePrevious(
    db: DTDatabase,
    tracking: DbMaintenanceTracking,
    contract: DbDomainContract,
    machineId: DbNumberId,
    messageSizeBytes: number,
    lastUpdated: Date,
  ): Promise<TrackingSaveResult> {
    const start = Date.now();
    const method: `${string}.${string}` = `${service}.saveMaintenanceTrackingAndUpdatePrevious`;
    const previous: DbLatestTracking | undefined =
      await DataDb.findLatestNotFinishedTrackingForWorkMachine(
        db,
        contract.domain,
        machineId.id,
      );

    // if (previous) {
    //     logger.info(`DEBUG previous: ${JSON.stringify(previous)}\nnext: ${JSON.stringify(tracking)}`);
    // }

    const trackingStartPosition: Position =
      Utils.getTrackingStartPoint(tracking);
    if (
      previous &&
      AutoriUtils.isExtendingPreviousTracking(
        (JSON.parse(previous.last_point) as GeoJsonPoint).coordinates,
        trackingStartPosition,
        previous.end_time,
        tracking.start_time,
      )
    ) {
      await DataDb.markMaintenanceTrackingFinished(db, previous.id);
      // If the task are the same, then set reference to previous tracking id
      if (CommonUtils.bothArraysHasSameValues(previous.tasks, tracking.tasks)) {
        tracking.previous_tracking_id = previous.id;
      }
    }
    return db
      .tx(async (tx) => {
        await DataDb.insertMaintenanceTracking(tx, tracking);
        await DataDb.updateContractLastUpdated(
          tx,
          contract.domain,
          contract.contract,
          lastUpdated,
        );
      })
      .then(() => {
        logger.info({
          method,
          message: `domain=${contract.domain} errors=0 message `,
          customDomain: contract.domain,
          customContract: contract.contract,
          tookMs: Date.now() - start,
          customCount: 1,
          customSizeBytes: messageSizeBytes,
        });
        return TrackingSaveResult.createSaved(messageSizeBytes);
      })
      .catch((error: Error) => {
        logger.error({
          method,
          message: `summary`,
          customDomain: contract.domain,
          customContract: contract.contract,
          customInsertCount: 0,
          customErrorCount: 1,
          customSizeBytes: messageSizeBytes,
          tookMs: Date.now() - start,
          error,
        });
        return TrackingSaveResult.createError(messageSizeBytes);
      });
  }
}
