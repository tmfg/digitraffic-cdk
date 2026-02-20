import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type {
  DTDatabase,
  DTTransaction,
} from "@digitraffic/common/dist/database/database";
import {
  inDatabase,
  inDatabaseReadonly,
} from "@digitraffic/common/dist/database/database";
import { parseISO } from "date-fns";
import _ from "lodash";
import type {
  DbETAShip,
  DbTimestamp,
  DbTimestampIdAndLocode,
  DbUpdatedTimestamp,
} from "../dao/timestamps.js";
import * as TimestampsDB from "../dao/timestamps.js";
import {
  getDisplayableNameForEventSource,
  isPortnetTimestamp,
  mergeTimestamps,
} from "../event-sourceutil.js";
import { EventSource } from "../model/eventsource.js";
import type {
  ApiTimestamp,
  PublicApiTimestamp,
  Ship,
} from "../model/timestamp.js";
import { EventType } from "../model/timestamp.js";
import type { Ports } from "./portareas.js";

export interface UpdatedTimestamp extends DbUpdatedTimestamp {
  readonly locodeChanged: boolean;
}

function getPortcallEventType(timestamp: ApiTimestamp): EventType {
  return timestamp.eventType === EventType.ETB &&
    (timestamp.source === EventSource.SCHEDULES_CALCULATED ||
      timestamp.source === EventSource.AWAKE_AI)
    ? EventType.ETA
    : timestamp.eventType;
}

export function saveTimestamp(
  timestamp: ApiTimestamp,
  db: DTDatabase,
): Promise<UpdatedTimestamp | undefined> {
  return db.tx(async (t) => {
    const portcallId =
      timestamp.portcallId ??
      (await TimestampsDB.findPortcallId(
        db,
        timestamp.location.port,
        getPortcallEventType(timestamp),
        parseISO(timestamp.eventTime),
        timestamp.ship.mmsi,
        timestamp.ship.imo,
      ));
    if (!portcallId) {
      if (timestamp.source !== EventSource.AWAKE_AI_PRED) {
        logger.warn({
          method: "ProcessQueue.saveTimestamp",
          message: `no port call id could be found for, not persisting timestamp: ${JSON.stringify(
            timestamp,
          )}`,
        });
        // resolve so this gets removed from the queue
        return undefined;
      } else {
        logger.info({
          method: "ProcessQueue.saveTimestamp",
          message: `portcall id not found but persisting because source is: ${EventSource.AWAKE_AI_PRED}, timestamp: ${JSON.stringify(
            timestamp,
          )}`,
        });
      }
    }

    // do not persist timestamp if no imo is found
    const imo =
      timestamp.ship.imo ??
      (await TimestampsDB.findImoByMmsi(db, timestamp.ship.mmsi));
    if (!imo) {
      logger.warn({
        method: "ProcessQueue.saveTimestamp",
        message: `IMO not found for timestamp, not persisting ${JSON.stringify(
          timestamp,
        )}`,
      });
      // resolve so this gets removed from the queue
      return undefined;
    }

    // mmsi is allowed to be undefined if imo exists
    const mmsi =
      timestamp.ship.mmsi && timestamp.ship.mmsi > 0
        ? timestamp.ship.mmsi
        : await TimestampsDB.findMmsiByImo(db, timestamp.ship.imo);
    if (!mmsi) {
      logger.warn({
        method: "ProcessQueue.saveTimestamp",
        message: `MMSI not found for timestamp ${JSON.stringify(timestamp)}`,
      });
    }

    const ship: Ship = {
      imo,
      mmsi,
    };

    return doSaveTimestamp(t, { ...timestamp, ...{ portcallId, ship } });
  });
}

export function saveTimestamps(
  timestamps: ApiTimestamp[],
): Promise<(DbUpdatedTimestamp | undefined)[]> {
  return inDatabase((db: DTDatabase) => {
    return db.tx((t) =>
      t.batch(timestamps.map((timestamp) => doSaveTimestamp(t, timestamp))),
    );
  });
}

async function doSaveTimestamp(
  tx: DTTransaction,
  timestamp: ApiTimestamp,
): Promise<UpdatedTimestamp | undefined> {
  const removedTimestamps = await removeOldTimestamps(tx, timestamp);
  const updatedTimestamp = await TimestampsDB.updateTimestamp(tx, timestamp);
  return updatedTimestamp
    ? { ...updatedTimestamp, locodeChanged: removedTimestamps.length > 0 }
    : undefined;
}

async function removeOldTimestamps(
  tx: DTTransaction,
  timestamp: ApiTimestamp,
): Promise<DbTimestampIdAndLocode[]> {
  let timestampsAnotherLocode: DbTimestampIdAndLocode[] = [];
  if (isPortnetTimestamp(timestamp) && timestamp.portcallId) {
    timestampsAnotherLocode =
      await TimestampsDB.findPortnetTimestampsForAnotherLocode(
        tx,
        timestamp.portcallId,
        timestamp.location.port,
      );
    if (timestampsAnotherLocode.length) {
      logger.info({
        method: "ProcessQueue.removeOldTimestamps",
        message: `deleting timestamps with changed locode,timestamp ids: ${timestampsAnotherLocode
          .map((e) => e.id)
          .toString()}`,
      });
      await tx.batch(
        timestampsAnotherLocode.map((e) => TimestampsDB.deleteById(tx, e.id)),
      );
    }
  }
  return timestampsAnotherLocode;
}

export async function findAllTimestamps(
  locode?: string,
  mmsi?: number,
  imo?: number,
  source?: string,
): Promise<PublicApiTimestamp[]> {
  const start = Date.now();

  const timestamps = await inDatabaseReadonly(async (db: DTDatabase) => {
    if (locode) {
      return TimestampsDB.findByLocode(db, locode);
    } else if (mmsi && !imo) {
      return TimestampsDB.findByMmsi(db, mmsi);
    } else if (imo) {
      return TimestampsDB.findByImo(db, imo);
    } else if (source) {
      return TimestampsDB.findBySource(db, source);
    }
    logger.warn({
      method: "GetTimestamps.findAllTimestamps",
      message: "no locode, mmsi, imo or source given",
    });
    return [];
  });

  logger.info({
    method: "GetTimestamps.findAllTimestamps",
    tookMs: Date.now() - start,
  });

  const tss = timestamps.map(dbTimestampToPublicApiTimestamp);

  return mergeTimestamps(tss).map((timestamp) => ({
    ...timestamp,
    source: getDisplayableNameForEventSource(timestamp.source),
  }));
}

export async function findETAShipsByLocode(ports: Ports): Promise<DbETAShip[]> {
  logger.info({
    method: "TimeStampsService.findETAShipsByLocode",
    message: `find for ${ports.toString()}`,
  });

  const startFindPortnetETAsByLocodes = Date.now();
  const portnetShips = await inDatabaseReadonly((db: DTDatabase) => {
    return TimestampsDB.findPortnetETAsByLocodes(db, ports);
  }).finally(() => {
    logger.info({
      method: "TimeStampsService.findPortnetETAsByLocodes",
      tookMs: Date.now() - startFindPortnetETAsByLocodes,
    });
  });

  // handle multiple ETAs for the same day: calculate ETA only for the port call closest to NOW
  const shipsByImo = _.groupBy(portnetShips, (s) => s.imo.toString());
  const newestShips = Object.values(shipsByImo)
    .flatMap((ships) =>
      _.chain(ships)
        .sortBy((ship: DbETAShip) => ship.eta)
        .head()
        .value(),
    )
    .filter((ship): ship is DbETAShip => ship !== undefined);
  logger.info({
    method: "TimeStampsService.findETAShipsByLocode",
    message: `ships count before newest ETA filtering ${portnetShips.length} after newest ETA filtering ${newestShips.length}`,
  });

  if (newestShips.length) {
    const startFindVtsShipsTooCloseToPort = Date.now();
    return await inDatabaseReadonly(async (db: DTDatabase) => {
      const shipsTooCloseToPortImos = (
        await TimestampsDB.findVtsShipImosTooCloseToPortByPortCallId(
          db,
          newestShips.map((ship) => ship.portcall_id),
        )
      ).map((ship) => ship.imo);
      logger.info({
        method: "TimeStampsService.findETAShipsByLocode",
        message: `Ships too close to port ${JSON.stringify(
          shipsTooCloseToPortImos,
        )}`,
      });
      const filteredShips = newestShips.filter((ship) =>
        shipsTooCloseToPortImos.includes(ship.imo),
      );
      logger.info({
        method: "TimeStampsService.findETAShipsByLocode",
        message: `Did not fetch ETA for ships too close to port ${JSON.stringify(
          filteredShips,
        )}`,
      });
      return newestShips.filter(
        (ship) => !shipsTooCloseToPortImos.includes(ship.imo),
      );
    }).finally(() => {
      logger.info({
        method: "TimeStampsService.findETAShipsByLocode",
        tookMs: Date.now() - startFindVtsShipsTooCloseToPort,
      });
    });
  } else {
    return Promise.resolve([]);
  }
}

export function deleteOldTimestampsAndPilotages(): Promise<void> {
  return inDatabase((db: DTDatabase) => {
    return db.tx(async (t) => {
      const deletedPilotagesCount = await TimestampsDB.deleteOldPilotages(t);
      logger.info({
        method: "TimeStampsService.deleteOldTimestampsAndPilotages",
        customDeletedPilotagesCount: deletedPilotagesCount,
      });
      const deletedTimestampsCount = await TimestampsDB.deleteOldTimestamps(t);
      logger.info({
        method: "TimeStampsService.deleteOldTimestampsAndPilotages",
        customDeletedTimestampsCount: deletedTimestampsCount,
      });
    });
  });
}

function dbTimestampToPublicApiTimestamp(ts: DbTimestamp): PublicApiTimestamp {
  return {
    eventType: ts.event_type,
    eventTime: ts.event_time.toISOString(),
    recordTime: ts.record_time.toISOString(),
    source: ts.event_source,
    sourceId: ts.source_id,
    ship: {
      mmsi: ts.ship_mmsi,
      imo: ts.ship_imo,
    },
    location: {
      port: ts.location_locode,
      portArea: ts.location_portarea,
      from: ts.location_from_locode,
    },
    portcallId: ts.portcall_id,
    eventTimeConfidenceLowerDiff: ts.event_time_confidence_lower_diff,
    eventTimeConfidenceUpperDiff: ts.event_time_confidence_upper_diff,
  };
}
