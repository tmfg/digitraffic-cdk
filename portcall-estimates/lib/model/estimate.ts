import moment from 'moment';

export enum EventType {
    ETA = 'ETA',
    ATB = 'ATB',
    ETD = 'ETD'
}
const eventTypes = [
    EventType.ETA,
    EventType.ATB,
    EventType.ETD
]

export interface Ship {
    readonly mmsi?: number
    readonly imo?: number
}

export interface Location {
    readonly port: string
    readonly terminal?: string
    readonly berth?: string
    readonly berthPosition?: string
    readonly shipSide?: string
}

export interface ApiEstimate {
    readonly eventType: EventType
    readonly eventTime: string
    readonly eventTimeConfidenceLower?: string | null
    readonly eventTimeConfidenceUpper?: string | null
    readonly recordTime: string
    readonly source: string
    readonly ship: Ship
    readonly location: Location
}

export function validateEstimate(estimate: ApiEstimate): boolean {
    if (!eventTypes.includes(estimate.eventType)) {
        console.warn('Invalid eventType for estimate', estimate);
        return false;
    }
    if (!estimate.eventTime) {
        console.warn('Missing eventTime for estimate', estimate);
        return false;
    }
    if (!moment(estimate.eventTime).isValid()) {
        console.warn('Invalid eventTime for estimate', estimate);
        return false;
    }
    if (estimate.eventTimeConfidenceLower != null && estimate.eventTimeConfidenceLower != moment(estimate.eventTimeConfidenceLower).toISOString()) {
        console.warn('Invalid eventTimeConfidenceLower for estimate', estimate);
        return false;
    }
    if (estimate.eventTimeConfidenceUpper != null && estimate.eventTimeConfidenceUpper != moment(estimate.eventTimeConfidenceUpper).toISOString()) {
        console.warn('Invalid eventTimeConfidenceUpper for estimate', estimate);
        return false;
    }
    if (!estimate.recordTime) {
        console.warn('Missing recordTime for estimate', estimate);
        return false;
    }
    if (!moment(estimate.recordTime).isValid()) {
        console.warn('Invalid recordTime for estimate', estimate);
        return false;
    }
    if (!estimate.source) {
        console.warn('Missing source for estimate', estimate);
        return false;
    }
    if (!estimate.ship) {
        console.warn('Missing ship info for estimate', estimate);
        return false;
    }
    if (!estimate.ship.mmsi && !estimate.ship.imo) {
        console.warn('Both MMSI and IMO are missing for estimate', estimate);
        return false;
    }
    if (!estimate.location) {
        console.warn('Missing location info for estimate', estimate);
        return false;
    }
    if (!estimate.location.port) {
        console.warn('Missing port for estimate', estimate);
        return false;
    }
    return true;
}