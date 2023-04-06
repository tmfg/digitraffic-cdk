import moment from "moment";
import { EventSource } from "./eventsource";
import { NullableOptional } from "@digitraffic/common/dist/types/nullable";

export enum EventType {
    ATA = "ATA",
    ATB = "ATB",
    ATD = "ATD",
    ETA = "ETA",
    ETB = "ETB",
    ETP = "ETP",
    ETD = "ETD",
    // for pilotage
    RPS = "RPS",
    PPS = "PPS",
    APS = "APS",
    APC = "APC"
}

export interface Ship {
    readonly mmsi?: number;
    readonly imo?: number;
}

export interface Location {
    readonly port: string;
    readonly portArea?: string;
    readonly from?: string;
    readonly terminal?: string;
    readonly berth?: string;
    readonly berthPosition?: string;
    readonly shipSide?: string;
}

export interface ApiTimestamp {
    readonly eventType: EventType;
    readonly eventTime: string;
    readonly recordTime: string;
    readonly source: string;
    readonly ship: Ship;
    readonly location: Location;
    readonly eventTimeConfidenceLowerDiff?: number;
    readonly eventTimeConfidenceUpperDiff?: number;
    readonly portcallId?: number;
    readonly sourceId?: string;
}

export type PublicApiTimestamp = NullableOptional<
    Omit<ApiTimestamp, "ship" | "location"> & {
        ship: NullableOptional<Ship>;
        location: NullableOptional<Location>;
    }
>;

export function validateTimestamp(timestamp: Partial<ApiTimestamp>): ApiTimestamp | undefined {
    if (!timestamp.eventType || !Object.values(EventType).includes(timestamp.eventType)) {
        console.warn("Invalid eventType for timestamp", timestamp);
        return undefined;
    }
    if (!timestamp.eventTime) {
        console.warn("Missing eventTime for timestamp", timestamp);
        return undefined;
    }
    if (!moment(timestamp.eventTime).isValid()) {
        console.warn("Invalid eventTime for timestamp", timestamp);
        return undefined;
    }
    if (!timestamp.recordTime) {
        console.warn("Missing recordTime for timestamp", timestamp);
        return undefined;
    }
    if (!moment(timestamp.recordTime).isValid()) {
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
