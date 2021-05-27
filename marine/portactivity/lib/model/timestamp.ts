import moment from 'moment';

export enum EventType {
    ATA = 'ATA',
    ATB = 'ATB',
    ATD = 'ATD',
    ETA = 'ETA',
    ETD = 'ETD',
    // for pilotage
    RPS = 'RPS',
    PPS = 'PPS',
    APS = 'APS',
    APC = 'APC'
}

export interface Ship {
    readonly mmsi?: number
    readonly imo?: number
}

export interface Location {
    readonly port: string
    readonly portArea?: string
    readonly terminal?: string
    readonly berth?: string
    readonly berthPosition?: string
    readonly shipSide?: string
}

export interface ApiTimestamp {
    readonly eventType: EventType
    readonly eventTime: string
    readonly eventTimeConfidenceLower?: string | null
    readonly eventTimeConfidenceUpper?: string | null
    readonly recordTime: string
    readonly source: string
    readonly ship: Ship
    readonly location: Location
    readonly portcallId?: number | null
}

export function validateTimestamp(timestamp: ApiTimestamp): boolean {
    if(!Object.values(EventType).includes(timestamp.eventType)) {
        console.warn('Invalid eventType for timestamp', timestamp);
        return false;
    }
    if (!timestamp.eventTime) {
        console.warn('Missing eventTime for timestamp', timestamp);
        return false;
    }
    if (!moment(timestamp.eventTime).isValid()) {
        console.warn('Invalid eventTime for timestamp', timestamp);
        return false;
    }
    if (timestamp.eventTimeConfidenceLower != null && timestamp.eventTimeConfidenceLower != moment.duration(timestamp.eventTimeConfidenceLower).toISOString()) {
        console.warn('Invalid eventTimeConfidenceLower for timestamp', timestamp);
        return false;
    }
    if (timestamp.eventTimeConfidenceUpper != null && timestamp.eventTimeConfidenceUpper != moment.duration(timestamp.eventTimeConfidenceUpper).toISOString()) {
        console.warn('Invalid eventTimeConfidenceUpper for timestamp', timestamp);
        return false;
    }
    if (!timestamp.recordTime) {
        console.warn('Missing recordTime for timestamp', timestamp);
        return false;
    }
    if (!moment(timestamp.recordTime).isValid()) {
        console.warn('Invalid recordTime for timestamp', timestamp);
        return false;
    }
    if (!timestamp.source) {
        console.warn('Missing source for timestamp', timestamp);
        return false;
    }
    if (!timestamp.ship) {
        console.warn('Missing ship info for timestamp', timestamp);
        return false;
    }
    if (!timestamp.ship.mmsi && !timestamp.ship.imo) {
        console.warn('Both MMSI and IMO are missing for timestamp', timestamp);
        return false;
    }
    if (!timestamp.location) {
        console.warn('Missing location info for timestamp', timestamp);
        return false;
    }
    if (!timestamp.location.port) {
        console.warn('Missing port for timestamp', timestamp);
        return false;
    }
    if (timestamp.location.port.length > 5) {
        console.warn('Locode too long', timestamp);
        return false;
    }
    if(timestamp.location.portArea && timestamp.location.portArea.length > 6) {
        console.warn('PortArea too long', timestamp);
        return false;
    }

    return true;
}