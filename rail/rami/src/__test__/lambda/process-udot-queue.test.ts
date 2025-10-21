import type { SQSEvent, SQSRecord } from "aws-lambda";
import { handlerFn } from "../../lambda/process-udot-queue/process-udot-queue.js";
import { dbTestBase, expectRowCount } from "../db-testutil.js";
import type {
  TimeTableRowType,
  UnknownDelayOrTrackMessage,
} from "../../model/dt-rosm-message.js";
import { inTransaction } from "../../util/database.js";

interface UdotMessageParams {
  trainNumber: number;
  departureDate: Date;
  stationCodes: string[];
}

describe(
  "process-udot-queue lambda",
  dbTestBase(() => {
    const insertTimeTableRows = async (
      trainNumber: number,
      departureDate: Date,
      stationCodes: string[],
    ): Promise<void> => {
      await inTransaction(async (conn) => {
        await conn.execute(
          `INSERT INTO train (train_number, departure_date, operator_short_code, operator_uic_code, train_type_id, train_category_id, commuter_lineid, running_currently, cancelled, version, timetable_type, timetable_acceptance_date, deleted)
           VALUES (:trainNumber, :departureDate, :operatorShortCode, :operatorUicCode, :trainTypeId, :trainCategoryId, :commuterLineid, :runningCurrently, :cancelled, :version, :timetableType, :timetableAcceptanceDate, :deleted)`,
          {
            trainNumber,
            departureDate,
            operatorShortCode: "vr",
            operatorUicCode: 10,
            trainTypeId: 1,
            trainCategoryId: 1,
            commuterLineid: "Z",
            runningCurrently: false,
            cancelled: false,
            version: 1,
            timetableType: 1,
            timetableAcceptanceDate: departureDate,
            deleted: false,
          },
        );

        for (let i = 0; i < stationCodes.length; i++) {
          const scheduledTime = new Date(
            departureDate.getTime() + (10 * 60 + i) * 60 * 1000,
          );

          await conn.execute(
            `INSERT INTO time_table_row (attap_id, train_number, departure_date, station_short_code, scheduled_time, type, cancelled, station_uic_code, train_stopping)
             VALUES (:attapId, :trainNumber, :departureDate, :stationCode, :scheduledTime, :type, :cancelled, :stationUicCode, :trainStopping)`,
            {
              attapId: 1000 + i,
              trainNumber,
              departureDate,
              stationCode: stationCodes[i],
              scheduledTime,
              type: i % 2,
              cancelled: false,
              stationUicCode: 1000 + i,
              trainStopping: true,
            },
          );
        }
      });
    };

    const createSQSRecord = (
      message: UnknownDelayOrTrackMessage,
      index: number,
    ): SQSRecord => {
      return {
        messageId: `msg-${index}`,
        receiptHandle: `receipt-${index}`,
        body: JSON.stringify(message),
        attributes: {
          ApproximateReceiveCount: "1",
          SentTimestamp: Date.now().toString(),
          SenderId: "test",
          ApproximateFirstReceiveTimestamp: Date.now().toString(),
        },
        messageAttributes: {},
        md5OfBody: "test-md5",
        eventSource: "aws:sqs",
        eventSourceARN: "arn:aws:sqs:region:account:queue",
        awsRegion: "eu-west-1",
      };
    };

    const createSQSEvent = (
      messages: UnknownDelayOrTrackMessage[],
    ): SQSEvent => {
      return {
        Records: messages.map((msg, idx) => createSQSRecord(msg, idx)),
      };
    };

    const createUdotMessage = (
      trainNumber: number,
      departureDate: Date,
      stationCodes: string[],
    ): UnknownDelayOrTrackMessage => {
      const departureDateStr = departureDate.toISOString().split("T")[0]!; // Convert to YYYY-MM-DD
      return {
        messageId: `udot-msg-${trainNumber}`,
        trainNumber,
        departureDate: departureDateStr,
        vehicleJourneyName: `${departureDateStr}${trainNumber}`,
        data: stationCodes.map((stationCode, i) => {
          const scheduledTime = new Date(
            departureDate.getTime() + (10 * 60 + i) * 60 * 1000,
          );

          return {
            stationShortCode: stationCode,
            scheduledTime,
            type: (i % 2) as TimeTableRowType,
            unknownDelay: i % 2 === 0,
            unknownTrack: i % 2 === 1,
          };
        }),
      };
    };

    const createSQSEventFromParams = (
      ...params: UdotMessageParams[]
    ): SQSEvent => {
      const messages = params.map((
        { trainNumber, departureDate, stationCodes },
      ) => createUdotMessage(trainNumber, departureDate, stationCodes));
      return createSQSEvent(messages);
    };
    const stationCodes = ["ST0", "ST1"];

    test("handler resolves successfully for valid message", async () => {
      const departureDate = new Date("2025-10-14");

      await insertTimeTableRows(66, departureDate, stationCodes);

      const event = createSQSEventFromParams({
        trainNumber: 66,
        departureDate,
        stationCodes: stationCodes,
      });

      const handler = handlerFn();
      const results = await handler(event);

      expect(results).toHaveLength(1);
      expect(results[0]?.status).toBe("fulfilled");

      await expectRowCount(2, "SELECT count(*) FROM rami_udot");
      await expectRowCount(2, "SELECT count(*) FROM rami_udot_history");
    });

    test("handler processes multiple messages independently", async () => {
      const departureDate = new Date("2025-10-14");
      const event = createSQSEventFromParams(
        { trainNumber: 66, departureDate, stationCodes },
        { trainNumber: 66, departureDate, stationCodes },
      );

      const handler = handlerFn();
      const results = await handler(event);

      expect(results).toHaveLength(2);
      expect(results[0]?.status).toBe("fulfilled");
      expect(results[1]?.status).toBe("fulfilled");
    });

    test("handler continues processing after one message fails", async () => {
      const departureDate = new Date("2025-10-14");
      const validMessage = createUdotMessage(66, departureDate, stationCodes);
      const event: SQSEvent = {
        Records: [
          {
            ...createSQSRecord(validMessage, 0),
            body: "invalid json",
          },
          createSQSRecord(validMessage, 1),
        ],
      };

      const handler = handlerFn();
      const results = await handler(event);

      expect(results).toHaveLength(2);
      expect(results[0]?.status).toBe("rejected");
      expect(results[1]?.status).toBe("fulfilled");
    });

    test("processing message with no matching timetable rows", async () => {
      const event = createSQSEventFromParams({
        trainNumber: 999,
        departureDate: new Date("2025-10-15"),
        stationCodes,
      });

      const handler = handlerFn();
      const results = await handler(event);

      expect(results[0]?.status).toBe("fulfilled");

      await expectRowCount(
        0,
        "SELECT count(*) FROM rami_udot WHERE train_number = 999",
      );
    });
  }, {
    beforeEach: async (db) => {
      await db.execute("DELETE FROM time_table_row");
      await db.execute("DELETE FROM train");
    },
  }),
);
