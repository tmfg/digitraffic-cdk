import {
  dateAverage,
  mergeTimestamps,
  VTS_TIMESTAMP_DIFF_MINUTES,
  VTS_TIMESTAMP_TOO_OLD_MINUTES,
} from "../event-sourceutil.js";
import { newTimestamp } from "./testdata.js";
import type { ApiTimestamp } from "../model/timestamp.js";
import { EventType } from "../model/timestamp.js";
import { EventSource } from "../model/eventsource.js";
import {
  getRandomInteger,
  shuffle,
} from "@digitraffic/common/dist/test/testutils";
import { addMinutes, parseISO, subMinutes } from "date-fns";
import _ from "lodash";
import { assertDefined } from "./test-utils.js";

describe("event-sourceutil", () => {
  function expectSingleTimestamp(
    mergedTimestamps: ApiTimestamp[],
    timestamp: ApiTimestamp,
  ): void {
    expect(mergedTimestamps.length).toBe(1);
    const merged = mergedTimestamps[0];
    assertDefined(merged);
    expectTimestamp(timestamp, merged);
  }

  function expectTimestamp(
    actual: ApiTimestamp | undefined,
    expected: ApiTimestamp,
  ): void {
    expect(actual?.portcallId).toBe(expected.portcallId);
    expect(actual?.source).toBe(expected.source);
    expect(actual?.eventType).toBe(expected.eventType);
    expect(actual?.recordTime).toBe(expected.recordTime);
    expect(actual?.ship).toMatchObject(expected.ship);
    expect(actual?.location).toMatchObject(expected.location);
  }

  test("dateAverage", () => {
    const m1 = new Date(1622549546737);
    const m2 = new Date(1622549553609);

    const average = dateAverage([m1, m2]);

    expect(average).toBe("2021-06-01T12:12:30.173Z");
  });

  test("mergeTimestamps - filters out all but one", () => {
    const portcallId = 1;
    const timestamps = [
      newTimestamp({
        source: EventSource.SCHEDULES_CALCULATED,
        portcallId,
      }),
      newTimestamp({ source: EventSource.AWAKE_AI, portcallId }),
    ];

    const merged = mergeTimestamps(timestamps);

    expect(merged.length).toBe(1);
  });

  test("mergeTimestamps - doesnt filter other than VTS A", () => {
    const portcallId = 1;
    const timestamps = [
      newTimestamp({
        source: EventSource.SCHEDULES_CALCULATED,
        portcallId,
      }),
      newTimestamp({ source: EventSource.PORTNET, portcallId }),
      newTimestamp({ source: EventSource.AWAKE_AI, portcallId }),
    ];

    const merged = mergeTimestamps(timestamps);

    expect(merged.length).toBe(2);
  });

  test("mergeTimestamps - VTS A ETB timestamps are merged", () => {
    const portcallId = 1;
    const timestamps = [
      newTimestamp({
        source: EventSource.AWAKE_AI,
        portcallId,
        eventType: EventType.ETB,
      }),
      newTimestamp({
        source: EventSource.SCHEDULES_CALCULATED,
        portcallId,
        eventType: EventType.ETB,
      }),
      newTimestamp({
        source: EventSource.AWAKE_AI,
        portcallId,
        eventType: EventType.ETA,
      }),
      newTimestamp({
        source: EventSource.SCHEDULES_CALCULATED,
        portcallId,
        eventType: EventType.ETA,
      }),
    ];

    const merged = mergeTimestamps(timestamps);
    expect(merged.length).toBe(2);
    expect(merged.filter((ts) => ts.eventType === EventType.ETA).length).toBe(
      1,
    );
    expect(merged.filter((ts) => ts.eventType === EventType.ETB).length).toBe(
      1,
    );
  });

  test("mergeTimestamps - timestamps are sorted after merge", () => {
    const portcallId = 1;

    const vtsTime = new Date();
    const portnetTime = addMinutes(Date.now(), 50);
    const vtsCTime = addMinutes(Date.now(), 55);

    const vtsTimestamp = newTimestamp({
      eventTime: vtsTime,
      source: EventSource.SCHEDULES_CALCULATED,
      portcallId,
    });
    const portnetTimestamp = newTimestamp({
      eventTime: portnetTime,
      source: EventSource.PORTNET,
      portcallId,
    });
    const vtsControlTimestamp = newTimestamp({
      eventTime: vtsCTime,
      source: EventSource.SCHEDULES_VTS_CONTROL,
      portcallId,
    });

    let index = 5;
    while (index-- > 0) {
      const timestamps = shuffle([
        vtsControlTimestamp,
        vtsTimestamp,
        portnetTimestamp,
      ]);

      const merged = mergeTimestamps(timestamps);

      expect(merged.length).toBe(3);
      expect(merged[0]?.source).toBe(EventSource.SCHEDULES_CALCULATED);
      expect(merged[1]?.source).toBe(EventSource.PORTNET);
      expect(merged[2]?.source).toBe(EventSource.SCHEDULES_VTS_CONTROL);
    }
  });

  test("mergeTimestamps - picks highest priority source", () => {
    const portcallId = 1;
    const schedulesTimestamp = newTimestamp({
      source: EventSource.SCHEDULES_VTS_CONTROL,
      portcallId,
    });
    const teqplayTimestamp = newTimestamp({
      source: EventSource.AWAKE_AI,
      portcallId,
    });
    const vtsTimestamp = newTimestamp({
      source: EventSource.AWAKE_AI,
      portcallId,
    });
    const timestamps = [teqplayTimestamp, schedulesTimestamp, vtsTimestamp];

    const merged = mergeTimestamps(timestamps);

    expect(merged.length).toBe(2);
    expectTimestamp(merged[0] as ApiTimestamp, schedulesTimestamp);
  });

  test("mergeTimestamps - too old VTS timestamps are filtered", () => {
    const portcallId = 1;
    const vtsTimestamp = newTimestamp({
      source: EventSource.SCHEDULES_CALCULATED,
      recordTime: subMinutes(
        Date.now(),
        VTS_TIMESTAMP_TOO_OLD_MINUTES + getRandomInteger(0, 1000),
      ),
      portcallId,
    });
    const timestamps = [vtsTimestamp];

    expect(mergeTimestamps(timestamps).length).toBe(0);
  });

  test("mergeTimestamps - VTS timestamp differing too much from Awake timestamp is filtered", () => {
    const portcallId = 1;
    const awakeTimestamp = newTimestamp({
      source: EventSource.AWAKE_AI,
      portcallId,
    });
    const vtsTimestamp = newTimestamp({
      source: EventSource.SCHEDULES_CALCULATED,
      eventTime: addMinutes(
        parseISO(awakeTimestamp.eventTime),
        VTS_TIMESTAMP_DIFF_MINUTES + getRandomInteger(0, 1000),
      ),
      portcallId,
    });
    const timestamps = [awakeTimestamp, vtsTimestamp];

    expectSingleTimestamp(
      mergeTimestamps(timestamps) as ApiTimestamp[],
      awakeTimestamp,
    );
  });

  test("mergeTimestamps - PRED timestamps are filtered out if VTS a timestamps are available", () => {
    const portcallId = 1;
    const awakeTimestamp = newTimestamp({
      source: EventSource.AWAKE_AI,
      portcallId,
    });
    const predTimestamp = newTimestamp({
      source: EventSource.AWAKE_AI_PRED,
      portcallId,
    });
    const timestamps = [awakeTimestamp, predTimestamp];

    expectSingleTimestamp(
      mergeTimestamps(timestamps) as ApiTimestamp[],
      awakeTimestamp,
    );
  });

  test("mergeTimestamps - PRED timestamps with multiple ships", () => {
    const awakeTimestamp1 = newTimestamp({
      source: EventSource.AWAKE_AI,
      portcallId: 1,
    });
    const predTimestamp1 = newTimestamp({
      source: EventSource.AWAKE_AI_PRED,
      portcallId: 1,
    });
    const predTimestamp2 = newTimestamp({
      source: EventSource.AWAKE_AI_PRED,
      portcallId: 2,
    });

    const timestamps = [awakeTimestamp1, predTimestamp1, predTimestamp2];

    const merged = mergeTimestamps(timestamps) as ApiTimestamp[];
    expect(merged.length).toBe(2);
    expectTimestamp(merged[0], awakeTimestamp1);
    expectTimestamp(merged[1], predTimestamp2);
  });

  test("mergeTimestamps - discard duplicate PRED timestamp with missing portcallId", () => {
    const predTimestampWithoutPortcallId = _.omit(
      newTimestamp({
        source: EventSource.AWAKE_AI_PRED,
      }),
      "portcallId",
    );
    const duplicateWithPortcallId = {
      ...predTimestampWithoutPortcallId,
      portcallId: 123,
    };
    const timestamps = [
      predTimestampWithoutPortcallId,
      duplicateWithPortcallId,
    ];
    const merged = mergeTimestamps(timestamps) as ApiTimestamp[];

    expect(merged.length).toBe(1);
    expectTimestamp(merged[0], duplicateWithPortcallId);
  });
});
