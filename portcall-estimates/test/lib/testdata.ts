import moment from "moment";
import {ApiEstimate, EventType} from "../../lib/model/estimate";

export function someNumber() {
    return Math.floor(Math.random() * 999999);
}

export function newEstimate(): ApiEstimate {
    // round off millis
    const eventTime = new Date();
    eventTime.setMilliseconds(0);
    const recordTime = new Date();
    recordTime.setMilliseconds(0);
    return {
        eventType: EventType.ATB,
        eventTime: moment(eventTime).toISOString(),
        recordTime: moment(recordTime).toISOString(),
        source: someNumber().toString(),
        eventTimeConfidenceLower: 'PT2H',
        eventTimeConfidenceUpper: 'PT0H6M',
        ship: {
            mmsi: Number(someNumber().toString().slice(0,5))
        },
        location: {
            port: someNumber().toString().slice(0,5)
        }
    };
}
