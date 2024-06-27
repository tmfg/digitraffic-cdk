import { getRandomInteger, randomString } from "@digitraffic/common/dist/test/testutils";
import add from "date-fns/add";
import sub from "date-fns/sub";
import { PAIKANNIN_MAX_TIME_BETWEEN_TRACKINGS_S } from "../../constants.js";
import { type DbWorkMachine } from "../../model/db-data.js";
import {
    type ApiWorkevent,
    type ApiWorkeventDevice,
    type ApiWorkeventIoDevice
} from "../../model/paikannin-api-data.js";
import {
    createDbWorkMachine,
    filterEventsWithoutTasks,
    getTasksForOperations,
    groupEventsToIndividualTrackings,
    isOverTimeLimit
} from "../../service/paikannin-utils.js";
import * as Utils from "../../service/utils.js";
import {
    DOMAIN_1,
    HARJA_BRUSHING,
    HARJA_PAVING,
    HARJA_SALTING,
    PAIKANNIN_OPERATION_BRUSHING,
    PAIKANNIN_OPERATION_PAVING,
    PAIKANNIN_OPERATION_SALTING,
    POINT_450M_FROM_START,
    POINT_550M_FROM_START,
    POINT_750M_FROM_START,
    POINT_START
} from "../testconstants.js";
import {
    createApiRouteDataForEveryMinute,
    createLineStringGeometry,
    createTaskMapping
} from "../testutil.js";

describe("paikannin-utils-service-test", () => {
    test("groupEventsToIndividualTrackings - events in chronological order", () => {
        const now = new Date();
        const past = sub(now, { minutes: 1 });
        const events: ApiWorkevent[] = [
            createWorkEvent([PAIKANNIN_OPERATION_BRUSHING.name], 1, past),
            createWorkEvent([PAIKANNIN_OPERATION_BRUSHING.name], 1, now)
        ];

        // this should be groupped within task
        // - PAIKANNIN_OPERATION_BRUSHNG,
        // - PAIKANNIN_OPERATION_BRUSHNG+PAIKANNIN_OPERATION_PAVING and
        // - PAIKANNIN_OPERATION_PAVING
        const groups = groupEventsToIndividualTrackings(events, past);

        expect(groups).toHaveLength(1);
    });

    test("groupEventsToIndividualTrackings - events not in chronological order", () => {
        const now = new Date();
        const past = sub(now, { minutes: 1 });
        const events: ApiWorkevent[] = [
            createWorkEvent([PAIKANNIN_OPERATION_BRUSHING.name], 1, now),
            createWorkEvent([PAIKANNIN_OPERATION_BRUSHING.name], 1, past)
        ];

        // this shold be groupped to 1 as method will order them in chronological order
        const groups = groupEventsToIndividualTrackings(events, subtractSecond(past));

        expect(groups).toHaveLength(1);
        expect(groups[0]![0]!.timestamp).toEqual(past);
        expect(groups[0]![1]!.timestamp).toEqual(now);
        // original is not touched
        expect(events[0]!.timestamp).toEqual(now);
        expect(events[1]!.timestamp).toEqual(past);
    });

    test("groupEventsToIndividualTrackings - task changes", () => {
        // Create work events with three different task combinations
        const start = sub(new Date(), { minutes: 10 });

        const events: ApiWorkevent[] = [
            createWorkEvent([PAIKANNIN_OPERATION_BRUSHING.name], 1, add(start, { seconds: 1 })),
            createWorkEvent([PAIKANNIN_OPERATION_BRUSHING.name], 1, add(start, { seconds: 1 })),
            createWorkEvent(
                [PAIKANNIN_OPERATION_BRUSHING.name, PAIKANNIN_OPERATION_PAVING.name],
                1,
                add(start, { seconds: 1 })
            ),
            createWorkEvent(
                [PAIKANNIN_OPERATION_BRUSHING.name, PAIKANNIN_OPERATION_PAVING.name],
                1,
                add(start, { seconds: 1 })
            ),
            createWorkEvent([PAIKANNIN_OPERATION_PAVING.name], 1, add(start, { seconds: 1 })),
            createWorkEvent([PAIKANNIN_OPERATION_PAVING.name], 1, add(start, { seconds: 1 }))
        ];

        // this shold be groupped with task groups: PAIKANNIN_OPERATION_BRUSHNG, PAIKANNIN_OPERATION_BRUSHNG+PAIKANNIN_OPERATION_PAVING.name and PAIKANNIN_OPERATION_PAVING.name tasks
        const groups = groupEventsToIndividualTrackings(events, start);

        expect(groups).toHaveLength(3);
        expect(groups[0]).toHaveLength(3); // end is added and is same as next group start
        expect(groups[0]![2]!.timestamp).toEqual(groups[1]![0]!.timestamp); // end is added and is same as next group start
        expect(groups[0]).toHaveLength(3); // end is added and is same as next group start
        expect(groups[1]![2]!.timestamp).toEqual(groups[2]![0]!.timestamp); // end is added and is same as next group start
        expect(groups[2]).toHaveLength(2);

        assertContainsEvents(groups[0]!, [PAIKANNIN_OPERATION_BRUSHING.name]);
        assertContainsEvents(groups[1]!, [
            PAIKANNIN_OPERATION_BRUSHING.name,
            PAIKANNIN_OPERATION_PAVING.name
        ]);
        assertContainsEvents(groups[2]!, [PAIKANNIN_OPERATION_PAVING.name]);
    });

    test("groupEventsToIndividualTrackings - events inside 5 minute time limit", () => {
        // Create work events with under 5 min diff
        const now = new Date();
        const just5Min = add(now, { minutes: 5 });
        const events: ApiWorkevent[] = [
            createWorkEvent([PAIKANNIN_OPERATION_BRUSHING.name], 1, just5Min),
            createWorkEvent([PAIKANNIN_OPERATION_BRUSHING.name], 1, now)
        ];

        // this shold be groupped to one tracking
        const groups = groupEventsToIndividualTrackings(events, subtractSecond(just5Min));
        expect(groups).toHaveLength(1);
    });

    test("groupEventsToIndividualTrackings - events over 5 minute time limit", () => {
        // Create work events with over 5 min diff
        const now = new Date();
        const over5Min = sub(now, { seconds: PAIKANNIN_MAX_TIME_BETWEEN_TRACKINGS_S + 1 });
        const events: ApiWorkevent[] = [
            createWorkEvent([PAIKANNIN_OPERATION_BRUSHING.name], 1, over5Min),
            createWorkEvent([PAIKANNIN_OPERATION_BRUSHING.name], 1, now)
        ];

        // this shold be groupped to two trackings
        const groups = groupEventsToIndividualTrackings(events, subtractSecond(over5Min));
        expect(groups).toHaveLength(2);
    });

    test("groupEventsToIndividualTrackings - events under 0,7 km limit", () => {
        // Create work events with under 0,7 km diff
        const now = new Date();
        const previous = sub(now, { minutes: 4 });
        const events: ApiWorkevent[] = [
            createWorkEventWithLocation([PAIKANNIN_OPERATION_BRUSHING.name], previous, POINT_START),
            createWorkEventWithLocation([PAIKANNIN_OPERATION_BRUSHING.name], now, POINT_550M_FROM_START)
        ];

        // this shold be groupped to one trackings
        const groups = groupEventsToIndividualTrackings(events, previous);
        expect(groups).toHaveLength(1);
    });

    test("groupEventsToIndividualTrackings - events over 0,7 km limit", () => {
        // Create work events with over 0,7 km diff
        const now = new Date();
        const previous = sub(now, { minutes: 4 });
        const events: ApiWorkevent[] = [
            createWorkEventWithLocation([PAIKANNIN_OPERATION_BRUSHING.name], previous, POINT_START),
            createWorkEventWithLocation([PAIKANNIN_OPERATION_BRUSHING.name], now, POINT_750M_FROM_START)
        ];

        // this shold be groupped to two trackings
        const groups = groupEventsToIndividualTrackings(events, subtractSecond(previous));
        expect(groups).toHaveLength(2);
    });

    test("groupEventsToIndividualTrackings - events speed under 140 km/h limit", () => {
        // Distance 0,45 km, speed 135 km/h -> t = 0,45/135 [h] = 12s
        const now = new Date();
        const previous = sub(now, { seconds: 12 });
        const events: ApiWorkevent[] = [
            createWorkEventWithLocation([PAIKANNIN_OPERATION_BRUSHING.name], previous, POINT_START),
            createWorkEventWithLocation([PAIKANNIN_OPERATION_BRUSHING.name], now, POINT_450M_FROM_START)
        ];

        // this shold be groupped to one trackings
        const groups = groupEventsToIndividualTrackings(events, previous);
        expect(groups).toHaveLength(1);
    });

    test("groupEventsToIndividualTrackings - events speed over 140 km/h limit", () => {
        // Distance 0,45 km, speed 145 km/h -> t = 0,45/145 [h] = 11s
        const now = new Date();
        const previous = sub(now, { seconds: 11 });
        const events: ApiWorkevent[] = [
            createWorkEventWithLocation([PAIKANNIN_OPERATION_BRUSHING.name], previous, POINT_START),
            createWorkEventWithLocation([PAIKANNIN_OPERATION_BRUSHING.name], now, POINT_450M_FROM_START)
        ];

        // this shold be groupped to two trackings
        const groups = groupEventsToIndividualTrackings(events, subtractSecond(previous));
        expect(groups).toHaveLength(2);
    });

    test("isOverTimeLimit", () => {
        const now = new Date();
        const insideLimit = add(now, { seconds: PAIKANNIN_MAX_TIME_BETWEEN_TRACKINGS_S - 1 });
        const onLimit = add(now, { seconds: PAIKANNIN_MAX_TIME_BETWEEN_TRACKINGS_S });
        const outsideLimit = add(now, { seconds: PAIKANNIN_MAX_TIME_BETWEEN_TRACKINGS_S + 1 });
        expect(isOverTimeLimit(now, insideLimit)).toBe(false);
        expect(isOverTimeLimit(now, onLimit)).toEqual(false);
        expect(isOverTimeLimit(now, outsideLimit)).toBe(true);
    });

    test("isOverTimeLimit in wrong order", () => {
        const previous = new Date();
        const next = sub(previous, { minutes: 1 });
        expect(isOverTimeLimit(previous, next)).toEqual(true); //  next before previous
    });

    test("createDbWorkMachine", () => {
        const DOMAIN = "paikannin-kuopio";
        const DEV_ID = 1;
        const DEV_TYPE = "Aura-auto";
        const wm: DbWorkMachine = createDbWorkMachine(DOMAIN, DEV_ID, DEV_TYPE);
        expect(wm.harjaUrakkaId).toEqual(Utils.createHarjaId(DOMAIN));
        expect(wm.harjaId.toString()).toEqual(DEV_ID.toString());
        expect(wm.type).toContain(DOMAIN);
        expect(wm.type).toContain(DEV_ID.toString());
        expect(wm.type).toContain(DEV_TYPE);
    });

    test("getTasksForOperations", () => {
        const taskMappings = [
            // Map domain operations to harja tasks
            createTaskMapping(DOMAIN_1, HARJA_BRUSHING, PAIKANNIN_OPERATION_BRUSHING.name, false),
            createTaskMapping(DOMAIN_1, HARJA_PAVING, PAIKANNIN_OPERATION_PAVING.name, true),
            createTaskMapping(DOMAIN_1, HARJA_SALTING, PAIKANNIN_OPERATION_SALTING.name, false)
        ];

        const tasks: string[] = getTasksForOperations(
            [PAIKANNIN_OPERATION_BRUSHING, PAIKANNIN_OPERATION_PAVING],
            taskMappings
        );

        expect(tasks).toHaveLength(1);
        expect(tasks).toContain(HARJA_BRUSHING);
    });

    test("getTasksForOperations duplicates", () => {
        const taskMappings = [
            // Map domain operations to harja tasks, map two operations to one task
            createTaskMapping(DOMAIN_1, HARJA_BRUSHING, PAIKANNIN_OPERATION_BRUSHING.name, false),
            createTaskMapping(DOMAIN_1, HARJA_BRUSHING, PAIKANNIN_OPERATION_PAVING.name, false),
            createTaskMapping(DOMAIN_1, HARJA_SALTING, PAIKANNIN_OPERATION_SALTING.name, false)
        ];

        const tasks: string[] = getTasksForOperations(
            [PAIKANNIN_OPERATION_BRUSHING, PAIKANNIN_OPERATION_PAVING],
            taskMappings
        );

        expect(tasks).toHaveLength(1);
        expect(tasks).toContain(HARJA_BRUSHING);
    });

    test("calculateSpeedIn_m_s", () => {
        const result = Utils.calculateSpeedInMS(10, 0);
        expect(result).toEqual(Infinity);
        console.info(
            `r: ${result} r>0: ${(result > 0).toString()} r<50: ${(
                result < 50
            ).toString()} isFinite(r): ${Number.isFinite(result).toString()}`
        );

        expect(Utils.calculateSpeedInMS(10, 1)).toEqual(10);

        expect(Utils.calculateSpeedInMS(350, 7)).toEqual(50);
    });

    test("filterEventsWithoutTasks", () => {
        const taskMappings = [
            // Map domain operations to harja tasks, one accepted and ignored
            createTaskMapping(DOMAIN_1, HARJA_BRUSHING, PAIKANNIN_OPERATION_BRUSHING.name, false),
            createTaskMapping(DOMAIN_1, HARJA_SALTING, PAIKANNIN_OPERATION_SALTING.name, true)
        ];

        const deviceWithIgnoredTasks: ApiWorkeventDevice = createApiRouteDataForEveryMinute(
            1,
            new Date(),
            createLineStringGeometry(10, 200),
            [PAIKANNIN_OPERATION_BRUSHING, PAIKANNIN_OPERATION_SALTING]
        );
        const deviceWithAcceptedTasks: ApiWorkeventDevice = createApiRouteDataForEveryMinute(
            2,
            new Date(),
            createLineStringGeometry(10, 200),
            [PAIKANNIN_OPERATION_BRUSHING, PAIKANNIN_OPERATION_SALTING]
        );
        // Make deviceWithIgnoredTasks every other event to be not mapped or ignored -> They should be filtered out
        deviceWithIgnoredTasks.workEvents.forEach((value, index) => {
            if (index % 2 === 0) {
                // index is even
                // clear ioChannels and replace with ignored and not mapped values
                value.ioChannels.splice(0, value.ioChannels.length);
                value.ioChannels.push(...[PAIKANNIN_OPERATION_SALTING, PAIKANNIN_OPERATION_PAVING]);
            }
        });

        const resultDevices = filterEventsWithoutTasks(
            [deviceWithIgnoredTasks, deviceWithAcceptedTasks],
            taskMappings
        );
        expect(resultDevices.length).toEqual(2);

        // deviceWithIgnoredTasks has reduced workEvents as events without valid tasks has been filtered out
        const resultDeviceWithFilteredEvents = resultDevices[0]!;
        expect(resultDeviceWithFilteredEvents.deviceId).toEqual(deviceWithIgnoredTasks.deviceId);
        expect(resultDeviceWithFilteredEvents.deviceName).toEqual(deviceWithIgnoredTasks.deviceName);
        expect(resultDeviceWithFilteredEvents.workEvents.length).toEqual(
            deviceWithIgnoredTasks.workEvents.length / 2
        );
        resultDeviceWithFilteredEvents.workEvents.forEach((we) =>
            expect(we.ioChannels[0]!.name).toEqual(PAIKANNIN_OPERATION_BRUSHING.name)
        );

        // deviceWithAcceptedTasks has all events untouched
        const resultDeviceWithAcceptedTasks = resultDevices[1]!;
        expect(resultDeviceWithAcceptedTasks.deviceId).toEqual(deviceWithAcceptedTasks.deviceId);
        expect(resultDeviceWithAcceptedTasks.deviceName).toEqual(deviceWithAcceptedTasks.deviceName);
        expect(resultDeviceWithAcceptedTasks.workEvents.length).toEqual(
            deviceWithAcceptedTasks.workEvents.length
        );
        resultDeviceWithAcceptedTasks.workEvents.forEach((we) => {
            expect(we.ioChannels[0]!.name).toEqual(PAIKANNIN_OPERATION_BRUSHING.name);
            expect(we.ioChannels[1]!.name).toEqual(PAIKANNIN_OPERATION_SALTING.name);
        });
    });

    test("filterEventsWithoutTasks to empty", () => {
        const taskMappings = [
            // Map domain operations to harja tasks, one accepted and ignored
            createTaskMapping(DOMAIN_1, HARJA_BRUSHING, PAIKANNIN_OPERATION_BRUSHING.name, true)
        ];
        const deviceWithAllIgnoredTasks: ApiWorkeventDevice = createApiRouteDataForEveryMinute(
            1,
            new Date(),
            createLineStringGeometry(10, 200),
            [PAIKANNIN_OPERATION_BRUSHING, PAIKANNIN_OPERATION_SALTING]
        );

        const resultDevices = filterEventsWithoutTasks([deviceWithAllIgnoredTasks], taskMappings);
        // Result should be empty as device doesn't have a single event with mapped or accepted task
        expect(resultDevices.length).toEqual(0);
    });
});

function assertContainsEvents(events: ApiWorkevent[], ioChannels: string[]): void {
    const ioSet = new Set(ioChannels);
    events.forEach((value) => {
        expect(value.ioChannels).toHaveLength(ioSet.size);
        expect(value.ioChannels.every((io) => ioSet.has(io.name))).toBe(true);
    });
}

function createWorkEvent(
    workEvents: string[],
    deviceId: number = getRandomInteger(1, 100),
    time: Date = new Date()
): ApiWorkevent {
    return {
        deviceId: deviceId,
        timest: time.toISOString(),
        deviceName: randomString(),
        altitude: 10,
        heading: 10,
        ioChannels: createWorkEventDevices(workEvents),
        lat: 60,
        lon: 28,
        speed: 100,
        timestamp: time
    };
}

function createWorkEventWithLocation(workEvents: string[], time: Date, xy: number[]): ApiWorkevent {
    return {
        deviceId: getRandomInteger(1, 100),
        timest: time.toISOString(),
        deviceName: randomString(),
        altitude: 10,
        heading: 10,
        ioChannels: createWorkEventDevices(workEvents),
        lat: xy[1]!,
        lon: xy[0]!,
        speed: 100,
        timestamp: time
    };
}

function createWorkEventDevices(workEvents: string[]): ApiWorkeventIoDevice[] {
    return workEvents.map((value) => {
        return {
            id: getRandomInteger(1, 100),
            name: value
        } as ApiWorkeventIoDevice;
    });
}

function subtractSecond(time: Date): Date {
    return sub(time, { seconds: 1 });
}
