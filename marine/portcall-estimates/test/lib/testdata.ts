import moment from "moment";
import {ApiEstimate, EventType} from "../../lib/estimates/model/estimate";
import {TIME_FORMAT} from "../../lib/subscriptions/model/subscription";
import {DYNAMODB_TIME_FORMAT, SubscriptionType} from "../../lib/subscriptions/service/subscriptions";
import {DbSubscription} from "../../lib/subscriptions/db/db-subscriptions";
const { v4: uuidv4 } = require('uuid');

export function someNumber(): number {
    return Math.floor(Math.random() * 999999);
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

export function newSubscription(): DbSubscription {
    return {
        Time: moment(new Date(+(new Date()) - Math.floor(Math.random()*10000000000))).format(DYNAMODB_TIME_FORMAT),
        Type: SubscriptionType.VESSEL_LIST,
        Locode: 'FIHKI',
        PhoneNumber: '+1234567890',
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

export function newVesselLocation(estimate: ApiEstimate, navStat: number): VesselLocation {
    return {
        mmsi: estimate.ship.mmsi!,
        timestamp_ext: new Date().getMilliseconds(),
        x: 1,
        y: 1,
        sog: 1,
        cog: 1,
        nav_stat: navStat,
        rot: 1,
        pos_acc: 'true',
        raim: 'false',
        timestamp: 1,
        heading: 5
    };
}

export function newPortAreaDetails(estimate: ApiEstimate, ata?: Date): PortAreaDetails {
    return {
        port_area_details_id: Math.floor(Math.random() * 10000),
        port_call_id: estimate.portcallId!,
        ata: ata?.toISOString()
    };
}

export function newPortCall(estimate: ApiEstimate): PortCall {
    return {
        port_call_id: estimate.portcallId!,
        radio_call_sign: 'a',
        radio_call_sign_type: 'fake',
        vessel_name: uuidv4()
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

export interface VesselLocation {
    readonly mmsi: number
    readonly timestamp_ext: number
    readonly x: number
    readonly y: number
    readonly sog: number
    readonly cog: number
    readonly nav_stat: number
    readonly rot: number
    readonly pos_acc: string
    readonly raim: string
    readonly timestamp: number
    readonly heading: number
}

export interface PortAreaDetails {
    readonly port_area_details_id: number
    readonly port_call_id: number
    readonly ata?: string
}

export interface PortCall {
    readonly port_call_id: number
    readonly radio_call_sign: string
    readonly radio_call_sign_type: string
    readonly vessel_name: string
}
