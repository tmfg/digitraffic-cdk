import * as VoyagePlansService from "../../service/voyageplans.js";
import { randomBoolean } from "@digitraffic/common/dist/test/testutils";
import { addHours, subDays, subMinutes } from "date-fns";
import { ValidationError } from "../../service/voyageplans.js";

describe("voyageplans service", () => {
  function assertValidationError(
    validationErrors: ValidationError[],
    expected: ValidationError,
  ): void {
    expect(validationErrors.length).toBe(1);
    expect(validationErrors[0]).toBe(expected);
  }

  test("validateWaypointsStructure - no waypoints - empty", () => {
    const validationErrors = VoyagePlansService.validateWaypointsStructure([]);

    assertValidationError(validationErrors, ValidationError.MISSING_WAYPOINTS);
  });

  test("validateWaypointsStructure - no waypoints - undefined", () => {
    const validationErrors = VoyagePlansService.validateWaypointsStructure(
      undefined,
    );

    assertValidationError(validationErrors, ValidationError.MISSING_WAYPOINTS);
  });

  test("validateWaypointsStructure - no waypoint elements - empty", () => {
    const validationErrors = VoyagePlansService.validateWaypointsStructure([
      {
        waypoint: [],
      },
    ]);

    assertValidationError(validationErrors, ValidationError.MISSING_WAYPOINT);
  });

  test("validateWaypointsStructure - no position element", () => {
    const validationErrors = VoyagePlansService.validateWaypointsStructure([
      {
        waypoint: [
          {
            position: randomBoolean() ? undefined! : [],
          },
        ],
      },
    ]);

    assertValidationError(validationErrors, ValidationError.MISSING_POSITION);
  });

  test("validateWaypointsStructure - missing position attribute", () => {
    const validationErrors = VoyagePlansService.validateWaypointsStructure([
      {
        waypoint: [
          {
            position: [
              {
                $: undefined!,
              },
            ],
          },
        ],
      },
    ]);

    assertValidationError(
      validationErrors,
      ValidationError.NO_POSITION_ATTRIBUTES,
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
                  lon: undefined!,
                  lat: 1,
                },
              },
            ],
          },
        ],
      },
    ]);

    assertValidationError(validationErrors, ValidationError.MISSING_LONGITUDE);
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
                  lat: undefined!,
                },
              },
            ],
          },
        ],
      },
    ]);

    assertValidationError(validationErrors, ValidationError.MISSING_LATITUDE);
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
                  lat: undefined!,
                },
              },
              {
                $: undefined!,
              },
            ],
          },
        ],
      },
    ]);

    expect(validationErrors.length).toBe(2);
    expect(validationErrors[0]).toBe(ValidationError.MISSING_LATITUDE);
    expect(validationErrors[1]).toBe(ValidationError.NO_POSITION_ATTRIBUTES);
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
      randomBoolean() ? [] : undefined,
    );

    expect(validationErrors.length).toBe(0);
  });

  test("validateSchedulesStructure - missing schedule element passes validation", () => {
    const validationErrors = VoyagePlansService.validateSchedulesStructure([
      {
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
                scheduleElement: [],
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
    const validationErrors = VoyagePlansService.validateStructure(undefined);

    assertValidationError(validationErrors, ValidationError.EMPTY_VOYAGE_PLAN);
  });

  test("validateStructure - no route", () => {
    const validationErrors = VoyagePlansService.validateStructure({
      route: undefined!,
    });

    assertValidationError(validationErrors, ValidationError.MISSING_ROUTE);
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

    assertValidationError(
      validationErrors,
      ValidationError.COORDINATE_OUTSIDE_SPATIAL_LIMITS,
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
                      eta: subMinutes(new Date(), 5).toISOString(),
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
                      eta: subMinutes(new Date(), 5).toISOString(),
                    },
                  },
                  {
                    $: {
                      etd: addHours(new Date(), 1).toISOString(),
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
                      eta: subDays(new Date(), 5).toISOString(),
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
