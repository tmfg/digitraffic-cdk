import * as VoyagePlansService from '../../lib/service/voyageplans';
import {getRandomNumber, randomBoolean} from "digitraffic-common/test/testutils";
import moment from 'moment-timezone';
import {ValidationError} from "../../lib/service/voyageplans";

describe('voyageplans service', () => {

    test('validateWaypointsStructure - no waypoints', () => {
        const validationErrors = VoyagePlansService.validateWaypointsStructure(randomBoolean() ? undefined! : []);

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.MISSING_WAYPOINTS);
    });

    test('validateWaypointsStructure - no waypoint elements', () => {
        const validationErrors = VoyagePlansService.validateWaypointsStructure([{
                waypoint: randomBoolean() ? undefined! : []
            }]
        );

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.MISSING_WAYPOINT);
    });

    test('validateWaypointsStructure - no position element', () => {
        const validationErrors = VoyagePlansService.validateWaypointsStructure([{
                waypoint: [
                    {
                        position: randomBoolean() ? undefined! : []
                    }
                ]
            }]
        );

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.MISSING_POSITION);
    });

    test('validateWaypointsStructure - missing position attribute', () => {
        const validationErrors = VoyagePlansService.validateWaypointsStructure([{
                waypoint: [
                    {
                        position: [
                            {
                                $: undefined!
                            }
                        ]
                    }
                ]
            }]
        );

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.NO_POSITION_ATTRIBUTES);
    });

    test('validateWaypointsStructure - missing longitude', () => {
        const validationErrors = VoyagePlansService.validateWaypointsStructure([{
                waypoint: [
                    {
                        position: [
                            {
                                $: {
                                    lon: undefined!,
                                    lat: 1
                                }
                            }
                        ]
                    }
                ]
            }]
        );

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.MISSING_LONGITUDE);
    });

    test('validateWaypointsStructure - missing latitude', () => {
        const validationErrors = VoyagePlansService.validateWaypointsStructure([{
                waypoint: [
                    {
                        position: [
                            {
                                $: {
                                    lon: 1,
                                    lat: undefined!
                                }
                            }
                        ]
                    }
                ]
            }]
        );

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.MISSING_LATITUDE);
    });

    test('validateWaypointsStructure - multiple errors', () => {
        const validationErrors = VoyagePlansService.validateWaypointsStructure([{
                waypoint: [
                    {
                        position: [
                            {
                                $: {
                                    lon: 1,
                                    lat: undefined!
                                }
                            },
                            {
                                $: undefined!
                            }
                        ]
                    }
                ]
            }]
        );

        expect(validationErrors.length).toBe(2);
        expect(validationErrors[0]).toBe(ValidationError.MISSING_LATITUDE);
        expect(validationErrors[1]).toBe(ValidationError.NO_POSITION_ATTRIBUTES);
    });

    test('validateWaypointsStructure - ok', () => {
        const validationErrors = VoyagePlansService.validateWaypointsStructure([{
                waypoint: [
                    {
                        position: [
                            {
                                $: {
                                    lon: 1,
                                    lat: 2
                                }
                            }
                        ]
                    }
                ]
            }]
        );

        expect(validationErrors.length).toBe(0);
    });

    test('validateSchedulesStructure - no schedules', () => {
        const validationErrors = VoyagePlansService.validateSchedulesStructure(randomBoolean() ? [] : undefined);

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.MISSING_SCHEDULES);
    });

    test('validateSchedulesStructure - missing schedule element', () => {
        const validationErrors = VoyagePlansService.validateSchedulesStructure([{
            schedule: randomBoolean() ? undefined! : []
        }]);

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.MISSING_SCHEDULE);
    });

    test('validateSchedulesStructure - missing scheduleElement element', () => {
        const validationErrors = VoyagePlansService.validateSchedulesStructure([{
            schedule: [{
                manual: [{
                    scheduleElement: randomBoolean() ? undefined! : []
                }]
            }]
        }]);

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.MISSING_SCHEDULE_ELEMENT);
    });

    test('validateSchedulesStructure - missing scheduleElement attributes', () => {
        const validationErrors = VoyagePlansService.validateSchedulesStructure([{
            schedule: [{
                manual: [{
                    scheduleElement: [{
                        $: undefined!
                    }]
                }]
            }]
        }]);

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.NO_SCHEDULE_ELEMENT_ATTRIBUTES);
    });

    test('validateSchedulesStructure - missing both ETA & ETD', () => {
        const validationErrors = VoyagePlansService.validateSchedulesStructure([{
            schedule: [{
                manual: [{
                    scheduleElement: [{
                        $: {
                            eta: undefined,
                            etd: undefined
                        }
                    }]
                }]
            }]
        }]);

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.NO_ETA_OR_ETD_ATTRIBUTES);
    });

    test('validateSchedulesStructure - just ETA is ok', () => {
        const validationErrors = VoyagePlansService.validateSchedulesStructure([{
            schedule: [{
                manual: [{
                    scheduleElement: [{
                        $: {
                            eta: new Date().toISOString()
                        }
                    }]
                }]
            }]
        }]);

        expect(validationErrors.length).toBe(0);
    });

    test('validateSchedulesStructure - just ETD is ok', () => {
        const validationErrors = VoyagePlansService.validateSchedulesStructure([{
            schedule: [{
                manual: [{
                    scheduleElement: [{
                        $: {
                            etd: new Date().toISOString()
                        }
                    }]
                }]
            }]
        }]);

        expect(validationErrors.length).toBe(0);
    });

    test('validateStructure - ok', () => {
        const validationErrors = VoyagePlansService.validateStructure({
            route: {
                waypoints: [{
                    waypoint: [
                        {
                            position: [
                                {
                                    $: {
                                        lon: 1,
                                        lat: 2
                                    }
                                }
                            ]
                        }
                    ]
                }],
                schedules: [{
                    schedule: [{
                        manual: [{
                            scheduleElement: [{
                                $: {
                                    eta: new Date().toISOString(),
                                    etd: new Date().toISOString()
                                }
                            }]
                        }]
                    }]
                }]
            }
        });

        expect(validationErrors.length).toBe(0);
    });

    test('validateStructure - undefined', () => {
        const validationErrors = VoyagePlansService.validateStructure(undefined);

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.EMPTY_VOYAGE_PLAN);
    });

    test('validateStructure - no route', () => {
        const validationErrors = VoyagePlansService.validateStructure({
            route: undefined!
        });

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.MISSING_ROUTE);
    });

    test('validateWaypointsContent - outside spatial limits', () => {
        const validationErrors = VoyagePlansService.validateWaypointsContent([{
                waypoint: [
                    {
                        position: [
                            {
                                $: {
                                    lon: 1,
                                    lat: 2
                                }
                            }
                        ]
                    }
                ]
            }]
        );

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.COORDINATE_OUTSIDE_SPATIAL_LIMITS);
    });

    test('validateWaypointsContent - inside spatial limits - Bothnian Bay', () => {
        const validationErrors = VoyagePlansService.validateWaypointsContent([{
                waypoint: [
                    {
                        position: [
                            {
                                $: {
                                    lon: 23.22,
                                    lat: 64.84
                                }
                            }
                        ]
                    }
                ]
            }]
        );

        expect(validationErrors.length).toBe(0);
    });

    test('validateWaypointsContent - inside spatial limits - Gulf of Finland', () => {
        const validationErrors = VoyagePlansService.validateWaypointsContent([{
                waypoint: [
                    {
                        position: [
                            {
                                $: {
                                    lon: 27.61,
                                    lat: 59.96
                                }
                            }
                        ]
                    }
                ]
            }]
        );

        expect(validationErrors.length).toBe(0);
    });

    test('validateWaypointsContent - inside spatial limits - Northern Baltic', () => {
        const validationErrors = VoyagePlansService.validateWaypointsContent([{
                waypoint: [
                    {
                        position: [
                            {
                                $: {
                                    lon: 19.71,
                                    lat: 58.58
                                }
                            }
                        ]
                    }
                ]
            }]
        );

        expect(validationErrors.length).toBe(0);
    });

    test('validateSchedulesContent - malformed ETA', () => {
        const validationErrors = VoyagePlansService.validateSchedulesContent([{
                schedule: [
                    {
                        manual: [
                            {
                                scheduleElement: [{
                                    $: {
                                        eta: 'asdfasdf'
                                    }
                                }]
                            }
                        ]
                    }
                ]
            }]
        );

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.INVALID_ETA_TIMESTAMP);
    });

    test('validateSchedulesContent - malformed ETD', () => {
        const validationErrors = VoyagePlansService.validateSchedulesContent([{
                schedule: [
                    {
                        manual: [
                            {
                                scheduleElement: [{
                                    $: {
                                        etd: 'fdsafdsa'
                                    }
                                }]
                            }
                        ]
                    }
                ]
            }]
        );

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.INVALID_ETD_TIMESTAMP);
    });

    test('validateSchedulesContent - ETA in past', () => {
        const validationErrors = VoyagePlansService.validateSchedulesContent([{
                schedule: [
                    {
                        manual: [
                            {
                                scheduleElement: [{
                                    $: {
                                        eta: moment().subtract(getRandomNumber(1, 1000), 'minutes').toISOString()
                                    }
                                }]
                            }
                        ]
                    }
                ]
            }]
        );

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.INVALID_ETA_TIMESTAMP);
    });

    test('validateSchedulesContent - ETD in past', () => {
        const validationErrors = VoyagePlansService.validateSchedulesContent([{
                schedule: [
                    {
                        manual: [
                            {
                                scheduleElement: [{
                                    $: {
                                        etd: moment().subtract(getRandomNumber(1, 1000), 'minutes').toISOString()
                                    }
                                }]
                            }
                        ]
                    }
                ]
            }]
        );

        expect(validationErrors.length).toBe(1);
        expect(validationErrors[0]).toBe(ValidationError.INVALID_ETD_TIMESTAMP);
    });

});
