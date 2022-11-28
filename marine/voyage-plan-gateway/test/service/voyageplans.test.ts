import * as VoyagePlansService from "../../lib/service/voyageplans";
import { randomBoolean } from "@digitraffic/common/dist/test/testutils";
import moment from "moment-timezone";
import { ValidationError } from "../../lib/service/voyageplans";

describe("voyageplans service", () => {
    test("validateWaypointsStructure - no waypoints", () => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const validationErrors = VoyagePlansService.validateWaypointsStructure(
            randomBoolean() ? undefined! : []
        );

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.MISSING_WAYPOINTS);
    });

    test("validateWaypointsStructure - no waypoint elements", () => {
        const validationErrors = VoyagePlansService.validateWaypointsStructure([
            {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                waypoint: randomBoolean() ? undefined! : [],
            },
        ]);

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.MISSING_WAYPOINT);
    });

    test("validateWaypointsStructure - no position element", () => {
        const validationErrors = VoyagePlansService.validateWaypointsStructure([
            {
                waypoint: [
                    {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        position: randomBoolean() ? undefined! : [],
                    },
                ],
            },
        ]);

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.MISSING_POSITION);
    });

    test("validateWaypointsStructure - missing position attribute", () => {
        const validationErrors = VoyagePlansService.validateWaypointsStructure([
            {
                waypoint: [
                    {
                        position: [
                            {
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                $: undefined!,
                            },
                        ],
                    },
                ],
            },
        ]);

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(
            ValidationError.NO_POSITION_ATTRIBUTES
        );
    });

    test("validateWaypointsStructure - missing longitude", () => {
        const validationErrors = VoyagePlansService.validateWaypointsStructure([
            {
                waypoint: [
                    {
                        position: [
                            {
                                $: {
                                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                    lon: undefined!,
                                    lat: 1,
                                },
                            },
                        ],
                    },
                ],
            },
        ]);

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.MISSING_LONGITUDE);
    });

    test("validateWaypointsStructure - missing latitude", () => {
        const validationErrors = VoyagePlansService.validateWaypointsStructure([
            {
                waypoint: [
                    {
                        position: [
                            {
                                $: {
                                    lon: 1,
                                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                    lat: undefined!,
                                },
                            },
                        ],
                    },
                ],
            },
        ]);

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.MISSING_LATITUDE);
    });

    test("validateWaypointsStructure - multiple errors", () => {
        const validationErrors = VoyagePlansService.validateWaypointsStructure([
            {
                waypoint: [
                    {
                        position: [
                            {
                                $: {
                                    lon: 1,
                                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                    lat: undefined!,
                                },
                            },
                            {
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                $: undefined!,
                            },
                        ],
                    },
                ],
            },
        ]);

        expect(validationErrors.length).toBe(2);
        expect(validationErrors[0]).toBe(ValidationError.MISSING_LATITUDE);
        expect(validationErrors[1]).toBe(
            ValidationError.NO_POSITION_ATTRIBUTES
        );
    });

    test("validateWaypointsStructure - ok", () => {
        const validationErrors = VoyagePlansService.validateWaypointsStructure([
            {
                waypoint: [
                    {
                        position: [
                            {
                                $: {
                                    lon: 1,
                                    lat: 2,
                                },
                            },
                        ],
                    },
                ],
            },
        ]);

        expect(validationErrors.length).toBe(0);
    });

    test("validateSchedulesStructure - no schedules passes validation", () => {
        const validationErrors = VoyagePlansService.validateSchedulesStructure(
            randomBoolean() ? [] : undefined
        );

        expect(validationErrors.length).toBe(0);
    });

    test("validateSchedulesStructure - missing schedule element passes validation", () => {
        const validationErrors = VoyagePlansService.validateSchedulesStructure([
            {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                schedule: randomBoolean() ? undefined! : [],
            },
        ]);

        expect(validationErrors.length).toBe(0);
    });

    test("validateSchedulesStructure - missing scheduleElement element passes validation", () => {
        const validationErrors = VoyagePlansService.validateSchedulesStructure([
            {
                schedule: [
                    {
                        manual: [
                            {
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                scheduleElement: randomBoolean()
                                    ? undefined!
                                    : [],
                            },
                        ],
                    },
                ],
            },
        ]);

        expect(validationErrors.length).toBe(0);
    });

    test("validateSchedulesStructure - missing scheduleElement attributes passes validation", () => {
        const validationErrors = VoyagePlansService.validateSchedulesStructure([
            {
                schedule: [
                    {
                        manual: [
                            {
                                scheduleElement: [
                                    {
                                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                        $: undefined!,
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ]);

        expect(validationErrors.length).toBe(0);
    });

    test("validateStructure - ok", () => {
        const validationErrors = VoyagePlansService.validateStructure({
            route: {
                routeInfo: [],
                waypoints: [
                    {
                        waypoint: [
                            {
                                position: [
                                    {
                                        $: {
                                            lon: 1,
                                            lat: 2,
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
                schedules: [
                    {
                        schedule: [
                            {
                                manual: [
                                    {
                                        scheduleElement: [
                                            {
                                                $: {
                                                    eta: new Date().toISOString(),
                                                    etd: new Date().toISOString(),
                                                },
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        });

        expect(validationErrors.length).toBe(0);
    });

    test("validateStructure - undefined", () => {
        const validationErrors =
            VoyagePlansService.validateStructure(undefined);

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.EMPTY_VOYAGE_PLAN);
    });

    test("validateStructure - no route", () => {
        const validationErrors = VoyagePlansService.validateStructure({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            route: undefined!,
        });

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.MISSING_ROUTE);
    });

    test("validateWaypointsContent - outside spatial limits", () => {
        const validationErrors = VoyagePlansService.validateWaypointsContent([
            {
                waypoint: [
                    {
                        position: [
                            {
                                $: {
                                    lon: 1,
                                    lat: 2,
                                },
                            },
                        ],
                    },
                ],
            },
        ]);

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(
            ValidationError.COORDINATE_OUTSIDE_SPATIAL_LIMITS
        );
    });

    test("validateWaypointsContent - inside spatial limits - Bothnian Bay", () => {
        const validationErrors = VoyagePlansService.validateWaypointsContent([
            {
                waypoint: [
                    {
                        position: [
                            {
                                $: {
                                    lon: 23.22,
                                    lat: 64.84,
                                },
                            },
                        ],
                    },
                ],
            },
        ]);

        expect(validationErrors.length).toBe(0);
    });

    test("validateWaypointsContent - inside spatial limits - Gulf of Finland", () => {
        const validationErrors = VoyagePlansService.validateWaypointsContent([
            {
                waypoint: [
                    {
                        position: [
                            {
                                $: {
                                    lon: 27.61,
                                    lat: 59.96,
                                },
                            },
                        ],
                    },
                ],
            },
        ]);

        expect(validationErrors.length).toBe(0);
    });

    test("validateWaypointsContent - inside spatial limits - Northern Baltic", () => {
        const validationErrors = VoyagePlansService.validateWaypointsContent([
            {
                waypoint: [
                    {
                        position: [
                            {
                                $: {
                                    lon: 19.71,
                                    lat: 58.58,
                                },
                            },
                        ],
                    },
                ],
            },
            {
                waypoint: [
                    {
                        position: [
                            {
                                $: {
                                    lon: 1,
                                    lat: 2,
                                },
                            },
                        ],
                    },
                ],
            },
        ]);

        expect(validationErrors.length).toBe(0);
    });

    test("validateWaypointsContent - one point inside, one point outside is OK", () => {
        const validationErrors = VoyagePlansService.validateWaypointsContent([
            {
                waypoint: [
                    {
                        position: [
                            {
                                $: {
                                    lon: 19.71,
                                    lat: 58.58,
                                },
                            },
                        ],
                    },
                ],
            },
        ]);

        expect(validationErrors.length).toBe(0);
    });

    test("validateSchedulesContent - no calculated timestamps in the future passes validation", () => {
        const validationErrors = VoyagePlansService.validateSchedulesContent([
            {
                schedule: [
                    {
                        calculated: [
                            {
                                scheduleElement: [
                                    {
                                        $: {
                                            eta: moment()
                                                .subtract(5, "minutes")
                                                .toISOString(),
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ]);

        expect(validationErrors.length).toBe(0);
    });

    test("validateSchedulesContent - 1 timestamp in past, 1 in future", () => {
        const validationErrors = VoyagePlansService.validateSchedulesContent([
            {
                schedule: [
                    {
                        calculated: [
                            {
                                scheduleElement: [
                                    {
                                        $: {
                                            eta: moment()
                                                .subtract(5, "minutes")
                                                .toISOString(),
                                        },
                                    },
                                    {
                                        $: {
                                            etd: moment()
                                                .add(1, "hours")
                                                .toISOString(),
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ]);

        expect(validationErrors.length).toBe(0);
    });

    test("validateSchedulesContent - manual timestamps are not validated", () => {
        const validationErrors = VoyagePlansService.validateSchedulesContent([
            {
                schedule: [
                    {
                        manual: [
                            {
                                scheduleElement: [
                                    {
                                        $: {
                                            eta: moment()
                                                .subtract(5, "days")
                                                .toISOString(),
                                        },
                                    },
                                    {
                                        $: {},
                                    },
                                    {
                                        $: {},
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ]);

        expect(validationErrors.length).toBe(0);
    });
});
