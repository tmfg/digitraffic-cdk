import { SchedulesApi, SchedulesDirection, SchedulesResponse } from "../../lib/api/schedules";
import { ApiTimestamp, EventType } from "../../lib/model/timestamp";
import { newTimestamp } from "../testdata";
import { getRandomNumber } from "@digitraffic/common/dist/test/testutils";
import { ports } from "../../lib/service/portareas";
import { EventSource } from "../../lib/model/eventsource";
import { SchedulesService } from "../../lib/service/schedules";
import { subHours, subMinutes } from "date-fns";

const uuid = "123123123";
const vesselName = "TEST";
const callsign = "TEST_CALLSIGN";
const mmsi = "123456789";
const imo = "1234567";
const locode = ports[0];
const destination = "Foobar";
const portfacility = `${locode}-1`;
const etaEventTime = "2021-04-27T20:00:00Z";
const etaTimestamp = "2021-04-27T06:17:36Z";
const etdEventTime = "2021-04-27T20:00:00Z";
const etdTimestamp = "2021-04-27T06:17:36Z";

describe("schedules", () => {
    testGetTimestamps(
        "SchedulesService.getTimestampsUnderVtsControl - calls API twice",
        (service: SchedulesService) => service.getTimestampsUnderVtsControl(),
        false
    );

    testGetTimestamps(
        "SchedulesService.getCalculatedTimestamps - calls API twice",
        (service: SchedulesService) => service.getCalculatedTimestamps(),
        true
    );

    function testGetTimestamps(
        description: string,
        serviceFn: (service: SchedulesService) => Promise<ApiTimestamp[]>,
        calculated: boolean
    ) {
        test(description, async () => {
            const api = createApi();
            const getSchedulesTimestampsSpy = jest
                .spyOn(api, "getSchedulesTimestamps")
                .mockImplementation(() => Promise.resolve(createSchedulesResponse(1, false, false)));
            const service = new SchedulesService(api);

            await serviceFn(service);

            expect(getSchedulesTimestampsSpy).toHaveBeenCalledTimes(2);
            expect(getSchedulesTimestampsSpy).toHaveBeenNthCalledWith(1, SchedulesDirection.EAST, calculated);
            expect(getSchedulesTimestampsSpy).toHaveBeenNthCalledWith(2, SchedulesDirection.WEST, calculated);
        });
    }

    test("SchedulesService.schedulesToTimestamps - under VTS control - [x] ETA [ ] ETD", () => {
        const api = createApi();
        const service = new SchedulesService(api);
        const timestamps = service.schedulesToTimestamps(createSchedulesResponse(3, true, false), false);

        expect(timestamps.length).toBe(3);
        timestamps.forEach((ts) => verifyStructure(ts, EventType.ETA, false));
    });

    test("SchedulesService.schedulesToTimestamps - under VTS control - [ ] ETA [x] ETD", () => {
        const api = createApi();
        const service = new SchedulesService(api);

        const timestamps = service.schedulesToTimestamps(createSchedulesResponse(3, false, true), false);

        expect(timestamps.length).toBe(3);
        timestamps.forEach((ts) => verifyStructure(ts, EventType.ETD, false));
    });

    test("SchedulesService.schedulesToTimestamps - under VTS control - [x] ETA [x] ETD", () => {
        const api = createApi();
        const service = new SchedulesService(api);

        const timestamps = service.schedulesToTimestamps(createSchedulesResponse(3, true, true), false);

        expect(timestamps.length).toBe(6);
        timestamps
            .filter((ts) => ts.eventType == EventType.ETA)
            .forEach((ts) => verifyStructure(ts, EventType.ETA, false));
        timestamps
            .filter((ts) => ts.eventType == EventType.ETD)
            .forEach((ts) => verifyStructure(ts, EventType.ETD, false));
    });

    test("SchedulesService.schedulesToTimestamps - calculated - [x] ETA [ ] ETD", () => {
        const api = createApi();
        const service = new SchedulesService(api);

        const timestamps = service.schedulesToTimestamps(createSchedulesResponse(3, true, false), true);

        expect(timestamps.length).toBe(3);
        timestamps.forEach((ts) => verifyStructure(ts, EventType.ETA, true));
    });

    test("SchedulesService.schedulesToTimestamps - calculated - [ ] ETA [x] ETD", () => {
        const api = createApi();
        const service = new SchedulesService(api);

        const timestamps = service.schedulesToTimestamps(createSchedulesResponse(3, false, true), true);

        expect(timestamps.length).toBe(3);
        timestamps.forEach((ts) => verifyStructure(ts, EventType.ETD, true));
    });

    test("SchedulesService.schedulesToTimestamps - calculated - [x] ETA [x] ETD", () => {
        const api = createApi();
        const service = new SchedulesService(api);

        const timestamps = service.schedulesToTimestamps(createSchedulesResponse(3, true, true), true);

        expect(timestamps.length).toBe(6);
        timestamps
            .filter((ts) => ts.eventType == EventType.ETA)
            .forEach((ts) => verifyStructure(ts, EventType.ETA, true));
        timestamps
            .filter((ts) => ts.eventType == EventType.ETD)
            .forEach((ts) => verifyStructure(ts, EventType.ETD, true));
    });

    test("filterTimestamps - older than 5 minutes are filtered", () => {
        const api = createApi();
        const service = new SchedulesService(api);

        const etd: ApiTimestamp = newTimestamp({
            eventType: EventType.ETD,
            eventTime: subHours(Date.now(), getRandomNumber(6, 9999)),
            locode
        });

        expect(service.filterTimestamps([etd]).length).toBe(0);
    });

    test("filterTimestamps - newer than 5 minutes are not filtered", () => {
        const api = createApi();
        const service = new SchedulesService(api);

        const etd: ApiTimestamp = newTimestamp({
            eventType: EventType.ETD,
            eventTime: subMinutes(Date.now(), getRandomNumber(1, 5)),
            locode
        });

        expect(service.filterTimestamps([etd]).length).toBe(1);
    });
});

function createSchedulesResponse(schedules: number, eta: boolean, etd: boolean): SchedulesResponse {
    return {
        schedules: {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            schedule: Array.from({ length: schedules }).map((_) => ({
                $: { UUID: uuid },
                timetable: [
                    {
                        destination: [
                            {
                                $: { locode, destination, portfacility }
                            }
                        ],
                        eta: eta
                            ? [
                                  {
                                      $: {
                                          time: etaEventTime,
                                          uts: etaTimestamp
                                      }
                                  }
                              ]
                            : undefined,
                        etd: etd
                            ? [
                                  {
                                      $: {
                                          time: etdEventTime,
                                          uts: etdTimestamp
                                      }
                                  }
                              ]
                            : undefined
                    }
                ],
                vessel: [
                    {
                        $: {
                            vesselName,
                            callsign,
                            mmsi,
                            imo
                        }
                    }
                ]
            }))
        }
    };
}

function createApi() {
    return new SchedulesApi("");
}

function verifyStructure(ts: ApiTimestamp, eventType: EventType.ETA | EventType.ETD, calculated: boolean) {
    expect(ts.ship.mmsi).toBe(Number(mmsi));
    expect(ts.ship.imo).toBe(Number(imo));
    expect(ts.location.port).toBe(locode);
    expect(ts.eventType).toBe(eventType);
    expect(ts.eventTime).toBe(eventType == EventType.ETA ? etaEventTime : etdEventTime);
    expect(ts.recordTime).toBe(eventType == EventType.ETA ? etaTimestamp : etdTimestamp);
    expect(ts.source).toBe(calculated ? EventSource.SCHEDULES_CALCULATED : EventSource.SCHEDULES_VTS_CONTROL);
}
