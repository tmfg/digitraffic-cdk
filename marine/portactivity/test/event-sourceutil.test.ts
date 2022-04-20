import {
    momentAverage,
    mergeTimestamps, VTS_TIMESTAMP_TOO_OLD_HOURS, VTS_TIMESTAMP_DIFF_HOURS,
} from "../lib/event-sourceutil";
import moment from "moment-timezone";
import {newTimestamp} from "./testdata";
import {ApiTimestamp} from "../lib/model/timestamp";
import {EventSource} from "../lib/model/eventsource";
import {getRandomInteger, shuffle} from "digitraffic-common/test/testutils";

describe('event-sourceutil', () => {

    test('momentAverage', () => {
        const m1 = moment(1622549546737);
        const m2 = moment(1622549553609);

        const average = momentAverage([m1, m2]);

        expect(average).toBe('2021-06-01T12:12:30.173Z');
    });

    test('mergeTimestamps - filters out all but one', () => {
        const portcallId = 1;
        const timestamps = [
            newTimestamp({ source: EventSource.SCHEDULES_CALCULATED, portcallId }),
            newTimestamp({ source: EventSource.AWAKE_AI, portcallId }),
        ];

        const merged = mergeTimestamps(timestamps);

        expect(merged.length).toBe(1);
    });

    test('mergeTimestamps - doesnt filter other than VTS A', () => {
        const portcallId = 1;
        const timestamps = [
            newTimestamp({ source: EventSource.SCHEDULES_CALCULATED, portcallId }),
            newTimestamp({ source: EventSource.PORTNET, portcallId }),
            newTimestamp({ source: EventSource.AWAKE_AI, portcallId }),
        ];

        const merged = mergeTimestamps(timestamps);

        expect(merged.length).toBe(2);
    });

    test('mergeTimestamps - timestamps are sorted after merge', () => {
        const portcallId = 1;
        const portnetTime = moment();
        const vtsTimestamp = newTimestamp({ eventTime: portnetTime.add(50, 'minute').toDate(), source: EventSource.SCHEDULES_CALCULATED, portcallId });
        const awakeTimestamp = newTimestamp({ eventTime: portnetTime.add(45, 'minute').toDate(), source: EventSource.AWAKE_AI, portcallId });
        const portnetTimestamp = newTimestamp({ eventTime: portnetTime.toDate(), source: EventSource.PORTNET, portcallId });
        const vtsControlTimestamp = newTimestamp({ eventTime: portnetTime.add(55, 'minute').toDate(), source: EventSource.SCHEDULES_VTS_CONTROL, portcallId });

        const timestamps = shuffle([
            vtsControlTimestamp,
            vtsTimestamp,
            portnetTimestamp,
            awakeTimestamp,
        ]);

        const merged = mergeTimestamps(timestamps);

        expect(merged.length).toBe(3);
        expect(merged[0].source).toBe(EventSource.SCHEDULES_CALCULATED);
        expect(merged[1].source).toBe(EventSource.PORTNET);
        expect(merged[2].source).toBe(EventSource.SCHEDULES_VTS_CONTROL);
    });

    test('mergeTimestamps - picks highest priority source', () => {
        const portcallId = 1;
        const schedulesTimestamp = newTimestamp({ source: EventSource.SCHEDULES_CALCULATED, portcallId });
        const teqplayTimestamp = newTimestamp({ source: EventSource.AWAKE_AI, portcallId });
        const vtsTimestamp = newTimestamp({ source: EventSource.AWAKE_AI, portcallId });
        const timestamps = [
            teqplayTimestamp,
            schedulesTimestamp,
            vtsTimestamp,
        ];

        const merged = mergeTimestamps(timestamps)[0] as ApiTimestamp;

        expect(merged.portcallId).toBe(schedulesTimestamp.portcallId);
        expect(merged.source).toBe(schedulesTimestamp.source);
        expect(merged.eventType).toBe(schedulesTimestamp.eventType);
        expect(merged.recordTime).toBe(schedulesTimestamp.recordTime);
        expect(merged.ship).toMatchObject(schedulesTimestamp.ship);
        expect(merged.location).toMatchObject(schedulesTimestamp.location);
    });

    test('mergeTimestamps - too old VTS timestamps are filtered', () => {
        const portcallId = 1;
        const vtsTimestamp = newTimestamp({
            source: EventSource.SCHEDULES_CALCULATED,
            recordTime: moment().subtract(VTS_TIMESTAMP_TOO_OLD_HOURS + getRandomInteger(0, 1000), 'hour').toDate(),
            portcallId,
        });
        const awakeTimestamp = newTimestamp({ source: EventSource.AWAKE_AI, portcallId });
        const timestamps = [
            vtsTimestamp,
            awakeTimestamp,
        ];

        expectSingleTimestamp(mergeTimestamps(timestamps) as ApiTimestamp[], awakeTimestamp);
    });

    test('mergeTimestamps - VTS timestamp differing too much from Awake timestamp is filtered', () => {
        const portcallId = 1;
        const awakeTimestamp = newTimestamp({ source: EventSource.AWAKE_AI, portcallId });
        const vtsTimestamp = newTimestamp({
            source: EventSource.SCHEDULES_CALCULATED,
            eventTime: moment(awakeTimestamp.eventTime).add(VTS_TIMESTAMP_DIFF_HOURS + getRandomInteger(0, 1000), 'hour').toDate(),
            portcallId,
        });
        const timestamps = [
            awakeTimestamp,
            vtsTimestamp,
        ];

        expectSingleTimestamp(mergeTimestamps(timestamps) as ApiTimestamp[], awakeTimestamp);
    });

    function expectSingleTimestamp(mergedTimestamps: ApiTimestamp[], timestamp: ApiTimestamp) {
        expect(mergedTimestamps.length).toBe(1);
        const merged = mergedTimestamps[0];
        expect(merged.portcallId).toBe(timestamp.portcallId);
        expect(merged.source).toBe(timestamp.source);
        expect(merged.eventType).toBe(timestamp.eventType);
        expect(merged.recordTime).toBe(timestamp.recordTime);
        expect(merged.ship).toMatchObject(timestamp.ship);
        expect(merged.location).toMatchObject(timestamp.location);
    }

});
