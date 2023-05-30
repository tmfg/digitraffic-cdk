import { EventSource } from "../model/eventsource";
import { findVesselSpeedAndNavStatus } from "../dao/timestamps";
import { ApiTimestamp, EventType } from "../model/timestamp";
import { DTDatabase } from "@digitraffic/common/dist/database/database";
import { isValid, parseISO } from "date-fns";
import { NavStatus } from "../model/ais-status";

export const SHIP_SPEED_STATIONARY_THRESHOLD_KNOTS = 2;

export async function validateTimestamp(
    timestamp: Partial<ApiTimestamp>,
    db: DTDatabase
): Promise<ApiTimestamp | undefined> {
    if (!timestamp.eventType || !Object.values(EventType).includes(timestamp.eventType)) {
        console.warn("Invalid eventType for timestamp", timestamp);
        return undefined;
    }
    if (!timestamp.eventTime) {
        console.warn("Missing eventTime for timestamp", timestamp);
        return undefined;
    }
    if (!isValid(parseISO(timestamp.eventTime))) {
        console.warn("Invalid eventTime for timestamp", timestamp);
        return undefined;
    }
    if (!timestamp.recordTime) {
        console.warn("Missing recordTime for timestamp", timestamp);
        return undefined;
    }
    if (!isValid(parseISO(timestamp.recordTime))) {
        console.warn("Invalid recordTime for timestamp", timestamp);
        return undefined;
    }
    if (!timestamp.source) {
        console.warn("Missing source for timestamp", timestamp);
        return undefined;
    }
    if (!timestamp.ship) {
        console.warn("Missing ship info for timestamp", timestamp);
        return undefined;
    }
    if (!timestamp.ship.mmsi && !timestamp.ship.imo) {
        console.warn("Both MMSI and IMO are missing for timestamp", timestamp);
        return undefined;
    }
    if (!timestamp.location) {
        console.warn("Missing location info for timestamp", timestamp);
        return undefined;
    }
    if (!timestamp.location.port) {
        console.warn("Missing port for timestamp", timestamp);
        return undefined;
    }
    if (timestamp.location.port.length > 5) {
        console.warn("Locode too long", timestamp);
        return undefined;
    }
    if (timestamp.location.from && timestamp.location.from.length > 5) {
        console.warn("From locode too long", timestamp);
        return undefined;
    }
    if (timestamp.location.portArea && timestamp.location.portArea.length > 6) {
        console.warn("PortArea too long", timestamp);
        return undefined;
    }
    if (timestamp.source === EventSource.AWAKE_AI_PRED && timestamp.eventType === EventType.ETD) {
        console.warn("ETD prediction from Awake.AI - not persisting", timestamp);
        return undefined;
    }

    // filter unreliable ETA predictions from VTS Schedules API
    if (timestamp.eventType === EventType.ETA && timestamp.source === EventSource.SCHEDULES_CALCULATED) {
        const shipStatus = await findVesselSpeedAndNavStatus(db, timestamp.ship?.mmsi);
        if (shipStatus && !navStatusIsValid(shipStatus.nav_stat)) {
            console.warn(
                "method=validateTimestamp VTS prediction for ship with invalid ais status %d %s",
                shipStatus.nav_stat,
                JSON.stringify(timestamp)
            );
            return undefined;
        }
        if (shipStatus && shipStatus.sog < SHIP_SPEED_STATIONARY_THRESHOLD_KNOTS) {
            console.warn(
                "method=validateTimestamp VTS prediction for stationary ship with sog %d and ais status %d %s",
                shipStatus.sog,
                shipStatus.nav_stat,
                JSON.stringify(timestamp)
            );
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
            eventTimeConfidenceUpperDiff: timestamp.eventTimeConfidenceUpperDiff
        })
    };
}

function validateConfidenceInterval(timestamp: Partial<ApiTimestamp>): boolean {
    if (!timestamp.eventTimeConfidenceLowerDiff || !timestamp.eventTimeConfidenceUpperDiff) return false;
    if (isNaN(timestamp.eventTimeConfidenceLowerDiff)) {
        console.warn("eventTimeConfidenceLowerDiff is not a number", timestamp);
        return false;
    }
    if (isNaN(timestamp.eventTimeConfidenceUpperDiff)) {
        console.warn("eventTimeConfidenceUpperDiff is not a number", timestamp);
        return false;
    }
    if (timestamp.eventTimeConfidenceLowerDiff > timestamp.eventTimeConfidenceUpperDiff) {
        console.warn("eventTimeConfidenceLowerDiff is greater than eventTimeConfidenceUpperDiff", timestamp);
        return false;
    }
    if (timestamp.eventTimeConfidenceLowerDiff > 0) {
        console.warn("eventTimeConfidenceLowerDiff is greater than zero", timestamp);
        return false;
    }
    if (timestamp.eventTimeConfidenceUpperDiff < 0) {
        console.warn("eventTimeConfidenceUpperDiff is less than zero", timestamp);
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
