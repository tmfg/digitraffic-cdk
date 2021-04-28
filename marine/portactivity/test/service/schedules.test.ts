import * as SchedulesService from "../../lib/service/schedules";
import {SchedulesResponse} from "../../lib/api/schedules";
import {ApiTimestamp, EventType} from "../../lib/model/timestamp";
import {EVENTSOURCE_SCHEDULES_CALCULATED, EVENTSOURCE_SCHEDULES_VTS_CONTROL} from "../../lib/event-sourceutil";
import {newTimestamp} from "../testdata";
import moment from 'moment-timezone';
import {getRandomNumber} from "../../../../common/test/testutils";
import {getPortAreaGeometries} from "../../lib/service/portareas";

const uuid = '123123123';
const vesselName = 'TEST';
const callsign = 'TEST_CALLSIGN';
const mmsi = '123456789';
const imo = '1234567';
const locode = getPortAreaGeometries()[0].locode;
const destination = 'Foobar';
const portfacility = `${locode}-1`;
const etaEventTime = '2021-04-27T20:00:00Z';
const etaTimestamp = '2021-04-27T06:17:36Z';
const etdEventTime = '2021-04-27T20:00:00Z';
const etdTimestamp = '2021-04-27T06:17:36Z';

describe('schedules', () => {

    test('SchedulesService.schedulesToTimestamps - under VTS control - [x] ETA [ ] ETD', async () => {
        const timestamps = SchedulesService.schedulesToTimestamps(createSchedulesResponse(3, true, false), false);

        expect(timestamps.length).toBe(3);
        timestamps.forEach(ts => verifyStructure(ts, EventType.ETA, false));
    });

    test('SchedulesService.schedulesToTimestamps - under VTS control - [ ] ETA [x] ETD', async () => {
        const timestamps = SchedulesService.schedulesToTimestamps(createSchedulesResponse(3, false, true), false);

        expect(timestamps.length).toBe(3);
        timestamps.forEach(ts => verifyStructure(ts, EventType.ETD, false));
    });

    test('SchedulesService.schedulesToTimestamps - under VTS control - [x] ETA [x] ETD', async () => {
        const timestamps = SchedulesService.schedulesToTimestamps(createSchedulesResponse(3, true, true), false);

        expect(timestamps.length).toBe(6);
        timestamps.filter(ts => ts.eventType == EventType.ETA).forEach(ts => verifyStructure(ts, EventType.ETA, false));
        timestamps.filter(ts => ts.eventType == EventType.ETD).forEach(ts => verifyStructure(ts, EventType.ETD, false));
    });

    test('SchedulesService.schedulesToTimestamps - calculated - [x] ETA [ ] ETD', async () => {
        const timestamps = SchedulesService.schedulesToTimestamps(createSchedulesResponse(3, true, false), true);

        expect(timestamps.length).toBe(3);
        timestamps.forEach(ts => verifyStructure(ts, EventType.ETA, true));
    });

    test('SchedulesService.schedulesToTimestamps - calculated - [ ] ETA [x] ETD', async () => {
        const timestamps = SchedulesService.schedulesToTimestamps(createSchedulesResponse(3, false, true), true);

        expect(timestamps.length).toBe(3);
        timestamps.forEach(ts => verifyStructure(ts, EventType.ETD, true));
    });

    test('SchedulesService.schedulesToTimestamps - calculated - [x] ETA [x] ETD', async () => {
        const timestamps = SchedulesService.schedulesToTimestamps(createSchedulesResponse(3, true, true), true);

        expect(timestamps.length).toBe(6);
        timestamps.filter(ts => ts.eventType == EventType.ETA).forEach(ts => verifyStructure(ts, EventType.ETA, true));
        timestamps.filter(ts => ts.eventType == EventType.ETD).forEach(ts => verifyStructure(ts, EventType.ETD, true));
    });

    test('filterTimestamps - older than 5 minutes are filtered', () => {
        const etd: ApiTimestamp = newTimestamp({
            eventType: EventType.ETD,
            eventTime: moment().subtract(getRandomNumber(6, 9999), 'minutes').toDate(),
            locode
        });

        expect(SchedulesService.filterTimestamps([etd]).length).toBe(0);
    });

    test('filterTimestamps - newer than 5 minutes are not filtered', () => {
        const etd: ApiTimestamp = newTimestamp({
            eventType: EventType.ETD,
            eventTime: moment().subtract(getRandomNumber(1, 5), 'minutes').toDate(),
            locode
        });

        expect(SchedulesService.filterTimestamps([etd]).length).toBe(1);
    });

});

function createSchedulesResponse(schedules: number, eta: boolean, etd: boolean): SchedulesResponse {
    return {
        schedules: {
            schedule: Array.from({length: schedules}).map(_ => ({
                $: { UUID: uuid },
                timetable: [{
                    destination: [{
                        $: { locode, destination, portfacility }
                    }],
                    eta: eta ? [{
                        $: { time: etaEventTime, uts: etaTimestamp }
                    }] : undefined,
                    etd: etd ? [{
                        $: { time: etdEventTime, uts: etdTimestamp }
                    }] : undefined
                }],
                vessel: [{
                    $: {
                        vesselName,
                        callsign,
                        mmsi,
                        imo
                    }
                }]
            }))
        }
    };
}

function verifyStructure(ts: ApiTimestamp, eventType: EventType.ETA | EventType.ETD, calculated: boolean) {
    expect(ts.ship.mmsi).toBe(Number(mmsi));
    expect(ts.ship.imo).toBe(Number(imo));
    expect(ts.location.port).toBe(locode);
    expect(ts.eventType).toBe(eventType);
    expect(ts.eventTime).toBe(eventType == EventType.ETA ? etaEventTime : etdEventTime);
    expect(ts.recordTime).toBe(eventType == EventType.ETA ? etaTimestamp : etdTimestamp);
    expect(ts.source).toBe(calculated ? EVENTSOURCE_SCHEDULES_CALCULATED : EVENTSOURCE_SCHEDULES_VTS_CONTROL)
}
