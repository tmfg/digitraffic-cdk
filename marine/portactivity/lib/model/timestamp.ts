import moment from "moment";
import { EventSource } from "./eventsource";

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
    readonly eventTimeConfidenceLower?: string;
    readonly eventTimeConfidenceUpper?: string;
    readonly eventTimeConfidenceLowerDiff?: number;
    readonly eventTimeConfidenceUpperDiff?: number;
    readonly recordTime: string;
    readonly source: string;
    readonly ship: Ship;
    readonly location: Location;
    readonly portcallId?: number;
    readonly sourceId?: string;
}

export interface PublicApiShip extends Omit<Ship, "mmsi" | "imo"> {
    readonly mmsi?: number | null;
    readonly imo?: number | null;
}

export interface PublicApiLocation extends Omit<Location, "portArea" | "from"> {
    readonly portArea?: string | null;
    readonly from?: string | null;
}

export interface PublicApiTimestamp
    extends Omit<ApiTimestamp, "portcallId" | "sourceId" | "ship" | "location"> {
    readonly portcallId?: number | null;
    readonly sourceId?: string | null;
    readonly ship: PublicApiShip;
    readonly location: PublicApiLocation;
}

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
    if (timestamp.eventTimeConfidenceLowerDiff && isNaN(Number(timestamp.eventTimeConfidenceLowerDiff))) {
        console.warn("Invalid eventTimeConfidenceLowerDiff for timestamp", timestamp);
        return undefined;
    }
    if (timestamp.eventTimeConfidenceUpperDiff && isNaN(Number(timestamp.eventTimeConfidenceUpperDiff))) {
        console.warn("Invalid eventTimeConfidenceUpperDiff for timestamp", timestamp);
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
        console.warn("ETD prediction from Awake.AI - not persisting");
        return undefined;
    }

    return {
        eventType: timestamp.eventType,
        eventTime: timestamp.eventTime,
        eventTimeConfidenceLowerDiff: timestamp.eventTimeConfidenceLowerDiff,
        eventTimeConfidenceUpperDiff: timestamp.eventTimeConfidenceUpperDiff,
        recordTime: timestamp.recordTime,
        source: timestamp.source,
        ship: timestamp.ship,
        location: timestamp.location,
        portcallId: timestamp.portcallId,
        sourceId: timestamp.sourceId
    };
}
