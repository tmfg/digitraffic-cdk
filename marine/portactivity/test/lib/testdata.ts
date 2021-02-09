import moment from "moment";
import {ApiEstimate, EventType} from "../../lib/model/estimate";
const { v4: uuidv4 } = require('uuid');

export function someNumber(): number {
    return 1 + Math.floor(Math.random() * 999999);
}

export function newEstimate(props?: {
    mmsi?: number,
    imo?: number,
    locode?: string,
    eventTime?: Date
    eventType?: EventType
    eventTimeConfidenceLower?: string | null
    eventTimeConfidenceUpper?: string | null
    source?: string,
    portcallId?: number
}): ApiEstimate {
    // round off millis
    const eventTime = props?.eventTime ?? new Date();
    eventTime.setMilliseconds(0);
    const recordTime = new Date();
    recordTime.setMilliseconds(0);
    return {
        eventType: props?.eventType ?? EventType.ATB,
        eventTime: moment(eventTime).toISOString(),
        recordTime: moment(recordTime).toISOString(),
        source: props?.source ?? someNumber().toString(),
        eventTimeConfidenceLower: props?.eventTimeConfidenceLower ?? null,
        eventTimeConfidenceUpper: props?.eventTimeConfidenceUpper ?? null,
        ship: {
            mmsi: props?.mmsi ?? Number(someNumber().toString().slice(0,5)),
            imo: props?.imo ?? Number(someNumber().toString().slice(0,5))
        },
        location: {
            port: props?.locode ?? someNumber().toString().slice(0,5)
        },
        portcallId: props?.portcallId ?? someNumber()
    };
}

export function newVessel(estimate: ApiEstimate): Vessel {
    return {
        mmsi: estimate.ship.mmsi!,
        timestamp: new Date().getMilliseconds(),
        name: uuidv4(),
        ship_type: 1,
        reference_point_a: 1,
        reference_point_b: 1,
        reference_point_c: 1,
        reference_point_d: 1,
        pos_type: 1,
        draught: 1,
        imo: estimate.ship.imo!,
        eta: 1,
        call_sign: 'a',
        destination: 'b'
    }
}

export function newPortAreaDetails(
    estimate: ApiEstimate,
    props?: {
        eta?: Date,
        portcallId?: number
    }): PortAreaDetails {

    return {
        port_area_details_id: Math.floor(Math.random() * 10000),
        port_call_id: props?.portcallId ?? estimate.portcallId!,
        eta: props?.eta?.toISOString()
    };
}

export function newPortCall(estimate: ApiEstimate, portcallId?: number): PortCall {
    return {
        port_call_id: portcallId ?? estimate.portcallId!,
        radio_call_sign: 'a',
        radio_call_sign_type: 'fake',
        vessel_name: uuidv4(),
        port_call_timestamp: new Date(),
        port_to_visit: estimate.location.port,
        mmsi: estimate.ship.mmsi ?? someNumber(),
        imo_lloyds: estimate.ship.imo ?? someNumber()
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
