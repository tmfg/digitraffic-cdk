import {
  type DTDatabase,
  inDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import { EcoCounterApi } from "../api/v2/eco-counter.js";
import {
  addDays,
  addMinutes,
  isBefore,
  max,
  startOfDay,
  subDays,
} from "date-fns";
import {
  DataType,
  updateLastUpdated,
} from "@digitraffic/common/dist/database/last-updated";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { ApiSite } from "../model/v2/api-model.js";
import type { DbSite } from "../model/v2/db-model.js";
import {
  addSites,
  getAllSites,
  removeSites,
  updateSites,
  updateSiteTimestamp,
} from "../dao/site.js";
import type { Domain } from "../model/v2/types.js";
import { addSiteData } from "../dao/data.js";

export async function updateMetadata(
  url: string,
  apiKey: string,
  domain: Domain,
): Promise<void> {
  const start = Date.now();

  const api = new EcoCounterApi(url, apiKey);

  const sitesInApi = await api.getSites();
  const sitesInDb = await getAllSitesFromDb(domain);

  const [newSites, removedSites, updatedSites] = compareSites(
    sitesInApi,
    sitesInDb,
  );

  try {
    return await inDatabase(async (db) => {
      const updatedTimestamp = new Date();

      await addSites(db, domain, newSites);
      await removeSites(db, removedSites);
      await updateSites(db, updatedSites);

      await updateLastUpdated(
        db,
        DataType.COUNTING_SITES_METADATA_CHECK,
        updatedTimestamp,
      );
    });
  } catch (e) {
    logger.debug(e);
  } finally {
    logger.info({
      method: "V2UpdateService.updateMetadata",
      customAddedCount: newSites.length,
      customUpdatedCount: updatedSites.length,
      customRemovedCount: removedSites.length,
      tookMs: Date.now() - start,
    });
  }
}

async function getAllSitesFromDb(domain: Domain): Promise<DbSite[]> {
  return await inDatabaseReadonly((db) => {
    return getAllSites(db, domain);
  });
}

export async function updateData(
  url: string,
  apiKey: string,
  domain: Domain,
): Promise<void> {
  const api = new EcoCounterApi(url, apiKey);
  const sitesInDb = await getAllSitesFromDb(domain); // site_id -> counter

  return await inDatabase(async (db: DTDatabase) => {
    await Promise.all(sitesInDb.map(async (site: DbSite) => {
      if (site.removed_timestamp) {
        logger.info({
          method: "V2UpdateService.updateDataForDomain",
          message: `Skipping removed site ${site.id}`,
        });
      } else if (isDataUpdateNeeded(site)) {
        // either last update timestamp + 1 day or ten days ago(for first time)
        const fromStamp = site.last_data_timestamp ??
          startOfDay(subDays(new Date(), 10));
        const endStamp = addDays(fromStamp, 1);

        logger.debug(
          `Site ${site.id}, last_data_timestamp ${
            JSON.stringify(site.last_data_timestamp)
          }, updating from ${JSON.stringify(fromStamp)} to ${
            JSON.stringify(endStamp)
          }`,
        );

        // add one minute to fromStamp, as timestamps are inclusive and we don't want duplicate data
        // timestamp resolution is minutes
        const data = await api.getDataForSite(
          site.id,
          addMinutes(fromStamp, 1),
          endStamp,
        );

        logger.info({
          method: "V2UpdateService.updateDataForDomain",
          customSite: site.id,
          customObjectType: "data",
          customUpdatedCount: data.length,
        });

        const pointCount = await addSiteData(db, site.id, data);

        if (pointCount === 0) {
          logger.info({
            method: "V2UpdateService.updateDataForDomain",
            message: "Skipping update, no values",
            customSite: site.id,
          });
          if (
            site.last_data_timestamp &&
            site.last_data_timestamp < subDays(new Date(), 7)
          ) {
            // if we are more than seven days in the past and there's no new data for the requested time interval, add 1 day to last_data_timestamp of this site in order to not get stuck
            await updateSiteTimestamp(
              db,
              site.id,
              addDays(site.last_data_timestamp, 1),
            );
            logger.info({
              method: "V2UpdateService.updateDataForDomain",
              message:
                `Over 7 days since last data update for site - Adding 1 day to previous last_data_timestamp`,
              customSite: site.id,
              customPreviousLastDataTimestamp: site.last_data_timestamp,
            });
          }
        } else {
          const actualEndStamp = max(
            data.flatMap((d) => d.data).map((p) => p.timestamp),
          );

          logger.info({
            method: "V2UpdateService.updateDataForDomain",
            customSite: site.id,
            customObjectType: "point",
            customUpdatedCount: pointCount,
            customEndTime: actualEndStamp,
          });

          await updateSiteTimestamp(db, site.id, actualEndStamp);
        }
      } else {
        logger.info({
          method: "V2UpdateService.updateDataForDomain",
          message: `Skipping ${site.id}, last updated ${
            JSON.stringify(site.last_data_timestamp)
          }`,
        });
      }

      return;
    }));

    await updateLastUpdated(db, DataType.COUNTING_SITES_DATA, new Date());
  });
}

/// check if data needs update, if last update timestamp is more than one day in the past
function isDataUpdateNeeded(site: DbSite): boolean {
  return (
    !site.last_data_timestamp ||
    isBefore(site.last_data_timestamp, subDays(new Date(), 1))
  );
}

function compareSites(
  sitesInApi: ApiSite[],
  sitesInDb: DbSite[],
): [ApiSite[], DbSite[], ApiSite[]] {
  const apiSiteMap = groupBy(sitesInApi, (s) => s.id);
  const dbSiteMap = groupBy(sitesInDb, (s) => s.id);

  const newSites = sitesInApi
    .filter((s) => !(s.id in dbSiteMap));

  const removedSites = sitesInDb
    .filter((s) => !(s.id in apiSiteMap));

  const updatedSites = sitesInApi
    .filter((s) => s.id in dbSiteMap);

  return [newSites, removedSites, updatedSites];
}

function groupBy<T>(arr: T[], fn: (item: T) => number): Record<string, T[]> {
  return arr.reduce<Record<string, T[]>>((prev, curr) => {
    const key = fn(curr);
    const group = prev[key] || [];
    group.push(curr);
    return { ...prev, [key]: group };
  }, {});
}
