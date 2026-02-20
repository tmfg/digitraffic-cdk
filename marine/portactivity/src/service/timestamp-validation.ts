import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { isValid, parseISO } from "date-fns";
import { findVesselSpeedAndNavStatus } from "../dao/timestamps.js";
import { NavStatus } from "../model/ais-status.js";
import { EventSource } from "../model/eventsource.js";
import type { ApiTimestamp } from "../model/timestamp.js";
import { EventType } from "../model/timestamp.js";

export const SHIP_SPEED_STATIONARY_THRESHOLD_KNOTS = 2;

export async function validateTimestamp(
  timestamp: Partial<ApiTimestamp>,
  db: DTDatabase,
): Promise<ApiTimestamp | undefined> {
  if (
    !timestamp.eventType ||
    !Object.values(EventType).includes(timestamp.eventType)
  ) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `Invalid eventType for timestamp ${JSON.stringify(timestamp)}`,
    });
    return undefined;
  }
  if (!timestamp.eventTime) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `Missing eventTime for timestamp ${JSON.stringify(timestamp)}`,
    });
    return undefined;
  }
  if (!isValid(parseISO(timestamp.eventTime))) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `Invalid eventTime for timestamp ${JSON.stringify(timestamp)}`,
    });
    return undefined;
  }
  if (!timestamp.recordTime) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `Missing recordTime for timestamp ${JSON.stringify(timestamp)}`,
    });
    return undefined;
  }
  if (!isValid(parseISO(timestamp.recordTime))) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `Invalid recordTime for timestamp ${JSON.stringify(timestamp)}`,
    });
    return undefined;
  }
  if (!timestamp.source) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `Missing source for timestamp ${JSON.stringify(timestamp)}`,
    });
    return undefined;
  }
  if (!timestamp.ship) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `Missing ship info for timestamp ${JSON.stringify(timestamp)}`,
    });
    return undefined;
  }
  if (!timestamp.ship.mmsi && !timestamp.ship.imo) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `Both MMSI and IMO are missing for timestamp ${JSON.stringify(
        timestamp,
      )}`,
    });
    return undefined;
  }
  if (!timestamp.location) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `Missing location info for timestamp ${JSON.stringify(
        timestamp,
      )}`,
    });
    return undefined;
  }
  if (!timestamp.location.port) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `Missing port for timestamp ${JSON.stringify(timestamp)}`,
    });
    return undefined;
  }
  if (timestamp.location.port.length > 5) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `Locode too long ${JSON.stringify(timestamp)}`,
    });
    return undefined;
  }
  if (timestamp.location.from && timestamp.location.from.length > 5) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `From locode too long ${JSON.stringify(timestamp)}`,
    });
    return undefined;
  }
  if (timestamp.location.portArea && timestamp.location.portArea.length > 6) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `PortArea too long ${JSON.stringify(timestamp)}`,
    });
    return undefined;
  }
  if (
    timestamp.source === EventSource.AWAKE_AI_PRED &&
    timestamp.eventType === EventType.ETD
  ) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `ETD prediction from Awake.AI - not persisting ${JSON.stringify(
        timestamp,
      )}`,
    });
    return undefined;
  }

  // filter unreliable ETA predictions from VTS Schedules API
  if (
    (timestamp.eventType === EventType.ETA ||
      timestamp.eventType === EventType.ETB) &&
    timestamp.source === EventSource.SCHEDULES_CALCULATED
  ) {
    const shipStatus = await findVesselSpeedAndNavStatus(
      db,
      timestamp.ship?.mmsi,
    );
    if (shipStatus && !navStatusIsValid(shipStatus.nav_stat)) {
      logger.warn({
        method: "ProcessQueue.validateTimestamp",
        message: `VTS prediction for ship with invalid AIS status ${shipStatus.nav_stat} ${JSON.stringify(
          timestamp,
        )}`,
      });
      return undefined;
    }
    if (shipStatus && shipStatus.sog < SHIP_SPEED_STATIONARY_THRESHOLD_KNOTS) {
      logger.warn({
        method: "ProcessQueue.validateTimestamp",
        message: `VTS prediction for stationary ship with speed ${shipStatus.sog} knots and AIS status ${shipStatus.nav_stat} ${JSON.stringify(
          timestamp,
        )}`,
      });
      return undefined;
    }
  }

  return {
    eventType: timestamp.eventType,
    eventTime: timestamp.eventTime,
    recordTime: timestamp.recordTime,
    source: timestamp.source,
    ship: timestamp.ship,
    location: timestamp.location,
    portcallId: timestamp.portcallId,
    sourceId: timestamp.sourceId,
    ...(validateConfidenceInterval(timestamp) && {
      eventTimeConfidenceLowerDiff: timestamp.eventTimeConfidenceLowerDiff,
      eventTimeConfidenceUpperDiff: timestamp.eventTimeConfidenceUpperDiff,
    }),
  };
}

function validateConfidenceInterval(timestamp: Partial<ApiTimestamp>): boolean {
  if (
    !timestamp.eventTimeConfidenceLowerDiff ||
    !timestamp.eventTimeConfidenceUpperDiff
  )
    return false;
  if (
    typeof timestamp.eventTimeConfidenceLowerDiff !== "number" ||
    Number.isNaN(timestamp.eventTimeConfidenceLowerDiff)
  ) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `eventTimeConfidenceLowerDiff is not a number ${JSON.stringify(
        timestamp,
      )}`,
    });
    return false;
  }
  if (
    typeof timestamp.eventTimeConfidenceUpperDiff !== "number" ||
    Number.isNaN(timestamp.eventTimeConfidenceUpperDiff)
  ) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `eventTimeConfidenceUpperDiff is not a number ${JSON.stringify(
        timestamp,
      )}`,
    });
    return false;
  }
  if (
    timestamp.eventTimeConfidenceLowerDiff >
    timestamp.eventTimeConfidenceUpperDiff
  ) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `eventTimeConfidenceLowerDiff is greater than eventTimeConfidenceUpperDiff ${JSON.stringify(
        timestamp,
      )}`,
    });
    return false;
  }
  if (timestamp.eventTimeConfidenceLowerDiff > 0) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `eventTimeConfidenceLowerDiff is greater than zero ${JSON.stringify(
        timestamp,
      )}`,
    });
    return false;
  }
  if (timestamp.eventTimeConfidenceUpperDiff < 0) {
    logger.warn({
      method: "ProcessQueue.validateTimestamp",
      message: `eventTimeConfidenceUpperDiff is less than zero ${JSON.stringify(
        timestamp,
      )}`,
    });
    return false;
  }
  return true;
}

function navStatusIsValid(navStatus: number): boolean {
  return !(
    navStatus === NavStatus.AT_ANCHOR ||
    navStatus === NavStatus.MOORED ||
    navStatus === NavStatus.AGROUND
  );
}
