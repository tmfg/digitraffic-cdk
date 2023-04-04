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

export function validateTimestamp(timestamp: Partial<ApiTimestamp>): timestamp is ApiTimestamp {
    if (!timestamp.eventType || !Object.values(EventType).includes(timestamp.eventType)) {
        console.warn("Invalid eventType for timestamp", timestamp);
        return false;
    }
    if (!timestamp.eventTime) {
        console.warn("Missing eventTime for timestamp", timestamp);
        return false;
    }
    if (!moment(timestamp.eventTime).isValid()) {
        console.warn("Invalid eventTime for timestamp", timestamp);
        return false;
    }
    if (!timestamp.recordTime) {
        console.warn("Missing recordTime for timestamp", timestamp);
        return false;
    }
    if (!moment(timestamp.recordTime).isValid()) {
        console.warn("Invalid recordTime for timestamp", timestamp);
        return false;
    }
    if (!timestamp.source) {
        console.warn("Missing source for timestamp", timestamp);
        return false;
    }
    if (!timestamp.ship) {
        console.warn("Missing ship info for timestamp", timestamp);
        return false;
    }
    if (!timestamp.ship.mmsi && !timestamp.ship.imo) {
        console.warn("Both MMSI and IMO are missing for timestamp", timestamp);
        return false;
    }
    if (!timestamp.location) {
        console.warn("Missing location info for timestamp", timestamp);
        return false;
    }
    if (!timestamp.location.port) {
        console.warn("Missing port for timestamp", timestamp);
        return false;
    }
    if (timestamp.location.port.length > 5) {
        console.warn("Locode too long", timestamp);
        return false;
    }
    if (timestamp.location.from && timestamp.location.from.length > 5) {
        console.warn("From locode too long", timestamp);
        return false;
    }
    if (timestamp.location.portArea && timestamp.location.portArea.length > 6) {
        console.warn("PortArea too long", timestamp);
        return false;
    }
    if (timestamp.source === EventSource.AWAKE_AI_PRED && timestamp.eventType === EventType.ETD) {
        console.warn("ETD prediction from Awake.AI - not persisting");
        return false;
    }
    if (timestamp.eventTimeConfidenceLowerDiff && isNaN(Number(timestamp.eventTimeConfidenceLowerDiff))) {
        console.warn("eventTimeConfidenceLowerDiff is not a number", timestamp);
        return false;
    }
    if (timestamp.eventTimeConfidenceUpperDiff && isNaN(Number(timestamp.eventTimeConfidenceUpperDiff))) {
        console.warn("eventTimeConfidenceUpperDiff is not a number", timestamp);
        return false;
    }
    if (
        timestamp.eventTimeConfidenceLowerDiff &&
        timestamp.eventTimeConfidenceUpperDiff &&
        timestamp.eventTimeConfidenceLowerDiff > timestamp.eventTimeConfidenceUpperDiff
    ) {
        console.warn("Lower bound of confidence interval is greater than upper bound", timestamp);
    }

    return true;
}
