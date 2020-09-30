import moment from "moment";
import {ApiEstimate, EventType} from "../../lib/estimates/model/estimate";
import {TIME_FORMAT} from "../../lib/subscriptions/model/subscription";
import {DYNAMODB_TIME_FORMAT, SubscriptionType} from "../../lib/subscriptions/service/subscriptions";
const { v4: uuidv4 } = require('uuid');

export function someNumber() {
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
    source?: string
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
        }
    };
}

export function newSubscription() {
    return {
        ID: uuidv4(),
        Time: moment(new Date(+(new Date()) - Math.floor(Math.random()*10000000000))).format(DYNAMODB_TIME_FORMAT),
        Type: SubscriptionType.VESSEL_LIST,
        Locode: 'FIHKI',
        PhoneNumber: '+1234567890'
    };
}
