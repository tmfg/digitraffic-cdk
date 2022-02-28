/* eslint-disable camelcase */
import {dbTestBase} from "../db-testutil";
import {DTDatabase} from "digitraffic-common/database/database";
import moment from "moment";
import {getRandomNumber, getRandomBigInt, randomString} from "digitraffic-common/test/testutils";
import {areDistinctPositions, groupEventsToIndividualTrackings} from "../../lib/service/paikannin-utils";
import {ApiWorkevent, ApiWorkeventIoDevice} from "../../lib/model/paikannin-api-data";
import {POINT_550m_FROM_START, POINT_450m_FROM_START, POINT_START} from "../testutil";

const ioChannel1 = 'Brushing';
const ioChannel2 = 'Paving';

describe('paikannin-utils-service-test', dbTestBase((db: DTDatabase) => {

    test('groupEventsToIndividualTrackings - events in chronological order', () => {
        const now = new Date();
        const past = moment(now).subtract(1, 'minutes').toDate();
        const events: ApiWorkevent[] = [
            createWorkEvent([ioChannel1], past),
            createWorkEvent([ioChannel1], now),
        ];

        // this shold be groupped to ioChannel1, ioChannel1+ioChannel2 and ioChannel2 tasks
        const groups = groupEventsToIndividualTrackings(events, past);

        expect(groups).toHaveLength(1);
    });

    test('groupEventsToIndividualTrackings - events not in chronological order', () => {
        const now = new Date();
        const past = moment(now).subtract(1, 'minutes').toDate();
        const events: ApiWorkevent[] = [
            createWorkEvent([ioChannel1], now),
            createWorkEvent([ioChannel1], past),
        ];

        // this shold be groupped to ioChannel1, ioChannel1+ioChannel2 and ioChannel2 tasks
        const groups = groupEventsToIndividualTrackings(events, past);

        expect(groups).toHaveLength(2);
    });

    test('groupEventsToIndividualTrackings - task changes', () => {
        // Create work events with three different task combinations
        const events: ApiWorkevent[] = [
            createWorkEvent([ioChannel1]),
            createWorkEvent([ioChannel1]),
            createWorkEvent([ioChannel1,ioChannel2]),
            createWorkEvent([ioChannel1,ioChannel2]),
            createWorkEvent([ioChannel2]),
            createWorkEvent([ioChannel2]),
        ];

        // this shold be groupped to ioChannel1, ioChannel1+ioChannel2 and ioChannel2 tasks
        const groups = groupEventsToIndividualTrackings(events, moment().subtract(1, 'minutes').toDate());

        expect(groups).toHaveLength(3);
        expect(groups[0]).toHaveLength(2);
        expect(groups[0]).toHaveLength(2);
        expect(groups[0]).toHaveLength(2);

        assertContainsEvents(groups[0], [ioChannel1]);
        assertContainsEvents(groups[1], [ioChannel1, ioChannel2]);
        assertContainsEvents(groups[2], [ioChannel2]);
    });

    test('groupEventsToIndividualTrackings - events inside 5 minute time limit', () => {
        // Create work events with over 5 min diff
        const now = new Date();
        const just5Min = moment(now).subtract(5, 'minutes').toDate();
        const events: ApiWorkevent[] = [
            createWorkEvent([ioChannel1], just5Min),
            createWorkEvent([ioChannel1], now),
        ];

        // this shold be groupped to one tracking
        const groups = groupEventsToIndividualTrackings(events, just5Min);
        expect(groups).toHaveLength(1);
    });

    test('groupEventsToIndividualTrackings - events over 5 minute time limit', () => {
        // Create work events with over 5 min diff
        const now = new Date();
        const over5Min = moment(now).subtract(5, 'minutes').subtract(1, 'seconds').toDate();
        const events: ApiWorkevent[] = [
            createWorkEvent([ioChannel1], over5Min),
            createWorkEvent([ioChannel1], now),
        ];

        // this shold be groupped to two trackings
        const groups = groupEventsToIndividualTrackings(events, over5Min);
        expect(groups).toHaveLength(2);
    });

    test('groupEventsToIndividualTrackings - events under 0,5 km limit', () => {
        // Create work events with under 0,5 km diff
        const now = new Date();
        const previous = moment(now).subtract(4, 'minutes').toDate();
        const events: ApiWorkevent[] = [
            createWorkEventWithLocation([ioChannel1], previous, POINT_START),
            createWorkEventWithLocation([ioChannel1], now, POINT_450m_FROM_START),
        ];

        // this shold be groupped to one trackings
        const groups = groupEventsToIndividualTrackings(events, previous);
        expect(groups).toHaveLength(1);
    });

    test('groupEventsToIndividualTrackings - events over 0,5 km limit', () => {
        // Create work events with over 0,5 km diff
        const now = new Date();
        const previous = moment(now).subtract(4, 'minutes').toDate();
        const events: ApiWorkevent[] = [
            createWorkEventWithLocation([ioChannel1], previous, POINT_START),
            createWorkEventWithLocation([ioChannel1], now, POINT_550m_FROM_START),
        ];

        // this shold be groupped to two trackings
        const groups = groupEventsToIndividualTrackings(events, previous);
        expect(groups).toHaveLength(2);
    });

    test('groupEventsToIndividualTrackings - events speed under 140 km/h limit', () => {
        // Distance 0,45 km, speed 135 km/h -> t = 0,45/135 [h] = 12s
        const now = new Date();
        const previous = moment(now).subtract(12, 'seconds').toDate();
        const events: ApiWorkevent[] = [
            createWorkEventWithLocation([ioChannel1], previous, POINT_START),
            createWorkEventWithLocation([ioChannel1], now, POINT_450m_FROM_START),
        ];

        // this shold be groupped to one trackings
        const groups = groupEventsToIndividualTrackings(events, previous);
        expect(groups).toHaveLength(1);
    });

    test('groupEventsToIndividualTrackings - events speed over 140 km/h limit', () => {
        // Distance 0,45 km, speed 145 km/h -> t = 0,45/145 [h] = 11s
        const now = new Date();
        const previous = moment(now).subtract(11, 'seconds').toDate();
        const events: ApiWorkevent[] = [
            createWorkEventWithLocation([ioChannel1], previous, POINT_START),
            createWorkEventWithLocation([ioChannel1], now, POINT_450m_FROM_START),
        ];

        // this shold be groupped to two trackings
        const groups = groupEventsToIndividualTrackings(events, previous);
        expect(groups).toHaveLength(2);
    });

    test('areDistinctPositions', () => {
        expect(areDistinctPositions([1,2],[1,2])).toBe(false);
        expect(areDistinctPositions([1.1,2.2],[1.1,2.2])).toBe(false);
        expect(areDistinctPositions([1,2.1],[1,2])).toBe(true);
        expect(areDistinctPositions([1,2],[1,2.000000000000001])).toBe(true);
    });



}));

function assertContainsEvents(events: ApiWorkevent[], ioChannels: string[]) {
    const ioSet = new Set(ioChannels);
    events.forEach(value => {
        expect(value.ioChannels).toHaveLength(ioSet.size);
        value.ioChannels.every(io => expect(ioSet.has(io.name)).toBe(true));
    });
}

function createWorkEvent(workEvents: string[], time=new Date()): ApiWorkevent {
    return {
        deviceId: getRandomBigInt(1,100),
        timest: time.toISOString(),
        deviceName: randomString(),
        altitude: 10n,
        heading: 10,
        ioChannels: createWorkEventDevices(workEvents),
        lat: 60,
        lon: 28,
        speed: 100n,
        timestamp: time,
    };
}

function createWorkEventWithLocation(workEvents: string[], time: Date, xy: number[]): ApiWorkevent {
    return {
        deviceId: getRandomBigInt(1,100),
        timest: time.toISOString(),
        deviceName: randomString(),
        altitude: 10n,
        heading: 10,
        ioChannels: createWorkEventDevices(workEvents),
        lat: xy[1],
        lon: xy[0],
        speed: 100n,
        timestamp: time,
    };
}

function createWorkEventDevices(workEvents: string[]): ApiWorkeventIoDevice[] {
    const v = workEvents.map(value => {
        return {
            id: getRandomNumber(1, 100),
            name: value,
        } as ApiWorkeventIoDevice;
    });
    return v;
}