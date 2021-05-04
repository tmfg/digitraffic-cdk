import * as VoyagePlansService from '../../lib/service/voyageplans';
import {RtzVoyagePlan} from "../../../../common/vis/voyageplan";
import {randomBoolean} from "../../../../common/test/testutils";

describe('voyageplans service', () => {

    test('validateStructure - undefined', () => {
        const validationErrors = VoyagePlansService.validateStructure(undefined);

        expect(validationErrors.length).toBe(1);
    });

    test('validateStructure - no route', () => {
        const validationErrors = VoyagePlansService.validateStructure({
            route: undefined!
        });

        expect(validationErrors.length).toBe(1);
    });

    test('validateStructure - no waypoints', () => {
        const validationErrors = VoyagePlansService.validateStructure({
            route: {
                waypoints: randomBoolean() ? undefined! : []
            }
        });

        expect(validationErrors.length).toBe(1);
    });

    test('validateStructure - no waypoint elements', () => {
        const validationErrors = VoyagePlansService.validateStructure({
            route: {
                waypoints: [{
                    waypoint: randomBoolean() ? undefined! : []
                }]
            }
        });

        expect(validationErrors.length).toBe(1);
    });

    test('validateStructure - no position element', () => {
        const validationErrors = VoyagePlansService.validateStructure({
            route: {
                waypoints: [{
                    waypoint: [
                        {
                            position: randomBoolean() ? undefined! : []
                        }
                    ]
                }]
            }
        });

        expect(validationErrors.length).toBe(1);
    });

    test('validateStructure - missing position attribute', () => {
        const validationErrors = VoyagePlansService.validateStructure({
            route: {
                waypoints: [{
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
            }
        });

        expect(validationErrors.length).toBe(1);
    });

    test('validateStructure - missing longitude', () => {
        const validationErrors = VoyagePlansService.validateStructure({
            route: {
                waypoints: [{
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
            }
        });

        expect(validationErrors.length).toBe(1);
    });

    test('validateStructure - missing latitude', () => {
        const validationErrors = VoyagePlansService.validateStructure({
            route: {
                waypoints: [{
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
            }
        });

        expect(validationErrors.length).toBe(1);
    });

    test('validateStructure - multiple errors', () => {
        const validationErrors = VoyagePlansService.validateStructure({
            route: {
                waypoints: [{
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
            }
        });

        expect(validationErrors.length).toBe(2);
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
                }]
            }
        });

        expect(validationErrors.length).toBe(0);
    });

    test('validateContent - outside spatial limits', () => {
        const validationErrors = VoyagePlansService.validateContent({
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
                }]
            }
        });

        expect(validationErrors.length).toBe(1);
    });

    test('validateContent - inside spatial limits - Bothnian Bay', () => {
        const validationErrors = VoyagePlansService.validateContent({
            route: {
                waypoints: [{
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
            }
        });

        expect(validationErrors.length).toBe(0);
    });

    test('validateContent - inside spatial limits - Gulf of Finland', () => {
        const validationErrors = VoyagePlansService.validateContent({
            route: {
                waypoints: [{
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
            }
        });

        expect(validationErrors.length).toBe(0);
    });

    test('validateContent - inside spatial limits - Northern Baltic', () => {
        const validationErrors = VoyagePlansService.validateContent({
            route: {
                waypoints: [{
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
            }
        });

        expect(validationErrors.length).toBe(0);
    });

});
