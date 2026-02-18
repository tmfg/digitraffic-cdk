import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { addMinutes, differenceInMilliseconds, parseISO } from "date-fns";
import _ from "lodash";
import * as TimestampsDb from "../../dao/timestamps.js";
import type { ApiTimestamp } from "../../model/timestamp.js";
import { EventType } from "../../model/timestamp.js";
import {
  dbTestBase,
  findAll,
  insertPortAreaDetails,
  insertPortCall,
} from "../db-testutil.js";
import { assertDefined } from "../test-utils.js";
import type { PortAreaDetails, PortCall } from "../testdata.js";
import { newPortAreaDetails, newPortCall, newTimestamp } from "../testdata.js";

describe(
  "db-timestamps - updates",
  dbTestBase((db: DTDatabase) => {
    test("updateTimestamp - properties", async () => {
      const timestamp = newTimestamp({
        eventTimeConfidenceLowerDiff: -1000,
        eventTimeConfidenceUpperDiff: 1000,
      });

      await TimestampsDb.updateTimestamp(db, timestamp);

      const fetchedTimestamps = await findAll(db);
      expect(fetchedTimestamps.length).toBe(1);
      const e = fetchedTimestamps[0];
      assertDefined(e);
      expect(e.location_locode).toBe(timestamp.location.port);
      expect(e.location_portarea).toBe(timestamp.location.portArea);
      expect(e.location_from_locode).toBe(timestamp.location.from);
      expect(e.event_source).toBe(timestamp.source);
      expect(e.record_time.toISOString()).toBe(timestamp.recordTime);
      expect(e.event_time.toISOString()).toBe(timestamp.eventTime);
      expect(e.event_type).toBe(timestamp.eventType);
      expect(e.event_time_confidence_lower_diff).toBe(
        timestamp.eventTimeConfidenceLowerDiff ?? null,
      );
      expect(e.event_time_confidence_upper_diff).toBe(
        timestamp.eventTimeConfidenceUpperDiff ?? null,
      );
    });

    test("updateTimestamp - imo undefined, mmsi exists, timestamp is rejected", async () => {
      const timestamp = Object.assign(newTimestamp(), {
        ship: {
          mmsi: 123,
          imo: undefined,
        },
      });

      await expect(() =>
        TimestampsDb.updateTimestamp(db, timestamp),
      ).rejects.toThrow();
    });

    test("updateTimestamp - imo exists, mmsi undefined, timestamp is saved", async () => {
      const timestamp = Object.assign(newTimestamp(), {
        ship: {
          mmsi: undefined,
          imo: 456,
        },
      });

      await expect(
        TimestampsDb.updateTimestamp(db, timestamp),
      ).resolves.not.toThrow();
    });

    test("updateTimestamp - both ids", async () => {
      const timestamp = Object.assign(newTimestamp(), {
        ship: {
          mmsi: 123,
          imo: 456,
        },
      });

      await TimestampsDb.updateTimestamp(db, timestamp);

      const e = (await findAll(db))[0];
      assertDefined(e);
      expect(e.ship_mmsi).toBe(timestamp.ship.mmsi);
      expect(e.ship_imo).toBe(timestamp.ship.imo);
    });

    test("updateTimestamp - ignore duplicate", async () => {
      const timestamp = newTimestamp();

      await TimestampsDb.updateTimestamp(db, timestamp);
      await TimestampsDb.updateTimestamp(db, timestamp);

      expect((await findAll(db)).length).toBe(1);
    });

    test("updateTimestamp - no duplicate rows with null mmsi", async () => {
      const timestamp = _.omit(newTimestamp(), "ship.mmsi");

      await TimestampsDb.updateTimestamp(db, timestamp);
      expect(await TimestampsDb.updateTimestamp(db, timestamp)).toBeNull();

      expect((await findAll(db)).length).toBe(1);
    });

    test("createUpdateValues - mmsi 0", () => {
      const imo = 123456789;
      const values = TimestampsDb.createUpdateValues(
        newTimestamp({
          mmsi: 0,
          imo,
        }),
      );

      expect(values[9]).toBe(undefined);
      expect(values[10]).toBe(imo);
    });

    test("createUpdateValues - imo 0", () => {
      const mmsi = 123456789;
      const values = TimestampsDb.createUpdateValues(
        newTimestamp({
          mmsi,
          imo: 0,
        }),
      );

      expect(values[9]).toBe(mmsi);
      expect(values[10]).toBe(undefined);
    });

    test("portcall id - supplied", async () => {
      const portcallId = 123;
      const timestamp = newTimestamp({
        portcallId,
      });

      await TimestampsDb.updateTimestamp(db, timestamp);

      const result = (await findAll(db))[0];
      assertDefined(result);

      expect(result.portcall_id).toBe(portcallId);
    });

    test("findPortcallId - by nearest time", async () => {
      const eventTime = new Date();
      const timestamp = newTimestamp({
        eventType: EventType.ETA,
        eventTime,
      });
      const portAreaDetails = await generatePortCalls(timestamp);
      const nearestTimestamp = // sort by nearest time
        portAreaDetails.sort((a, b) => {
          const aDiff = a.eta
            ? Math.abs(differenceInMilliseconds(parseISO(a.eta), eventTime))
            : 0;
          const bDiff = b.eta
            ? Math.abs(differenceInMilliseconds(parseISO(b.eta), eventTime))
            : 0;
          return aDiff - bDiff;
        })[0];
      assertDefined(nearestTimestamp);

      const portcallId = await TimestampsDb.findPortcallId(
        db,
        timestamp.location.port,
        timestamp.eventType,
        parseISO(timestamp.eventTime),
        timestamp.ship.mmsi,
        timestamp.ship.imo,
      );

      expect(portcallId).toBe(nearestTimestamp.port_call_id);
    });

    test("findPortcallId - not found", async () => {
      const timestamp = newTimestamp({
        eventType: EventType.ETA,
        eventTime: new Date(),
      });
      await generatePortCalls(timestamp);

      const portcallId = await TimestampsDb.findPortcallId(
        db,
        "NOT_FOUND",
        timestamp.eventType,
        parseISO(timestamp.eventTime),
        123,
        456,
      );

      expect(portcallId).toBeUndefined();
    });

    async function generatePortCalls(
      timestamp: ApiTimestamp,
    ): Promise<PortAreaDetails[]> {
      // cumbersome way to generate a number range
      const portCallData = [
        ...new Set([...Array(5 + Math.floor(Math.random() * 10)).keys()]),
      ].map((i) => {
        const portcallId = i + 1;
        const pc = newPortCall(timestamp, portcallId);
        const pac = newPortAreaDetails(timestamp, {
          portcallId: portcallId,
          eta: addMinutes(
            parseISO(timestamp.eventTime),
            1 + Math.floor(Math.random() * 100),
          ),
        });
        return [pc, pac];
      });
      const portCalls = portCallData.map((p) => p[0]) as PortCall[];
      const portAreaDetails = portCallData.map(
        (p) => p[1],
      ) as PortAreaDetails[];
      await db.tx(async (t) => {
        for (const pc of portCalls) {
          await insertPortCall(t, pc);
        }
        for (const pad of portAreaDetails) {
          await insertPortAreaDetails(t, pad);
        }
      });
      return portAreaDetails;
    }
  }),
);
