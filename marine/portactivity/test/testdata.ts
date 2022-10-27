import moment from "moment";
import {ApiTimestamp, EventType} from "../lib/model/timestamp";
import {
    AwakeAiATXEventType,
    AwakeAIATXTimestampMessage,
    AwakeATXZoneEventType,
} from "../lib/api/awake_ai_atx";
import {AwakeAiZoneType} from "../lib/api/awake_common";
import { v4 as uuidv4 } from 'uuid';
import {getRandomNumber} from "@digitraffic/common/test/testutils";

// test file
/* eslint-disable camelcase */

export function newAwakeATXMessage(options?: {
    zoneEventType?: AwakeATXZoneEventType,
    zoneType?: AwakeAiZoneType,
    locode?: string
}): AwakeAIATXTimestampMessage {
    return {
        eventType: 'zone-event',
        eventTimestamp: new Date().toISOString(),
        mmsi: 123456789,
        imo: 1234567,
        zoneId: 'foo',
        eventId: 'bar',
        msgType: AwakeAiATXEventType.EVENT,
        shipName: 'someship',
        locodes: [
            options?.locode ?? 'FILOL',
        ],
        location: [53.2, 40.3],
        zoneName: 'somezone',
        zoneEventType: options?.zoneEventType ?? AwakeATXZoneEventType.ARRIVAL,
        zoneType: options?.zoneType ?? AwakeAiZoneType.BERTH,
    };
}

export function someNumber(): number {
    return 1 + Math.floor(Math.random() * 999999);
}

export function randomIMO() {
    return getRandomNumber(1000000, 9999999);
}

export function randomMMSI() {
    return getRandomNumber(100000000, 999999999);
}

export function newTimestamp(props?: {
    mmsi?: number,
    imo?: number,
    locode?: string,
    from?: string,
    portArea?: string,
    eventTime?: Date
    recordTime?: Date
    eventType?: EventType
    eventTimeConfidenceLower?: string | null
    eventTimeConfidenceUpper?: string | null
    source?: string,
    sourceId?: string,
    portcallId?: number
}): ApiTimestamp {
    // round off millis
    const eventTime = props?.eventTime ?? new Date();
    const recordTime = props?.recordTime ?? new Date();
    eventTime.setMilliseconds(0);
    recordTime.setMilliseconds(0);

    return {
        eventType: props?.eventType ?? EventType.ATB,
        eventTime: moment(eventTime).toISOString(),
        recordTime: moment(recordTime).toISOString(),
        source: props?.source ?? someNumber().toString(),
        sourceId: props?.sourceId ?? someNumber().toString(),
        eventTimeConfidenceLower: props?.eventTimeConfidenceLower ?? null,
        eventTimeConfidenceUpper: props?.eventTimeConfidenceUpper ?? null,
        ship: {
            mmsi: props?.mmsi ?? Number(someNumber().toString().slice(0,5)),
            imo: props?.imo ?? Number(someNumber().toString().slice(0,5)),
        },
        location: {
            port: props?.locode ?? someNumber().toString().slice(0,5),
            portArea: props?.portArea ?? someNumber().toString().slice(0,5),
            from: props?.from ?? someNumber().toString().slice(0,5),
        },
        portcallId: props?.portcallId ?? someNumber(),
    };
}

export function newVessel(timestamp: ApiTimestamp): Vessel {
    return {
        mmsi: timestamp.ship.mmsi ?? -1,
        timestamp: new Date().getMilliseconds(),
        name: uuidv4(),
        ship_type: 1,
        reference_point_a: 1,
        reference_point_b: 1,
        reference_point_c: 1,
        reference_point_d: 1,
        pos_type: 1,
        draught: 1,
        imo: timestamp.ship.imo ?? - 1,
        eta: 1,
        call_sign: 'a',
        destination: 'b',
    };
}

export function newPortAreaDetails(timestamp: ApiTimestamp,
    props?: {
        eta?: Date,
        etd?: Date,
        ata?: Date,
        atd?: Date,
        portcallId?: number
    }): PortAreaDetails {

    return {
        port_area_details_id: Math.floor(Math.random() * 10000),
        port_call_id: props?.portcallId ?? timestamp.portcallId ?? - 1,
        eta: props?.eta?.toISOString(),
        etd: props?.etd?.toISOString(),
        ata: props?.ata?.toISOString(),
        atd: props?.atd?.toISOString(),
    };
}

export function newPortCall(timestamp: ApiTimestamp, portcallId?: number): PortCall {
    return {
        port_call_id: portcallId ?? timestamp.portcallId ?? - 1,
        radio_call_sign: 'a',
        radio_call_sign_type: 'fake',
        vessel_name: uuidv4(),
        port_call_timestamp: new Date(),
        port_to_visit: timestamp.location.port,
        mmsi: timestamp.ship.mmsi ?? someNumber(),
        imo_lloyds: timestamp.ship.imo ?? someNumber(),
    };
}

// Types below used only in tests
export interface Vessel {
    readonly mmsi: number
    readonly timestamp: number
    readonly name: string
    readonly ship_type: number
    readonly reference_point_a: number
    readonly reference_point_b: number
    readonly reference_point_c: number
    readonly reference_point_d: number
    readonly pos_type: number
    readonly draught: number
    readonly imo: number
    readonly eta: number
    readonly call_sign: string
    readonly destination: string
}

export interface PortAreaDetails {
    readonly port_area_details_id: number
    readonly port_call_id: number
    readonly eta?: string
    readonly etd?: string
    readonly ata?: string
    readonly atd?: string
}

export interface PortCall {
    readonly port_call_id: number
    readonly radio_call_sign: string
    readonly radio_call_sign_type: string
    readonly vessel_name: string
    readonly port_call_timestamp: Date
    readonly port_to_visit: string
    readonly mmsi: number
    readonly imo_lloyds: number
}
