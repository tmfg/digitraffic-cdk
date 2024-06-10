import { addDays, addHours, subDays, subHours } from "date-fns";
import {
    findActiveMessages,
    findMessagesUpdatedAfter,
    insertMessage,
    setMessageDeleted
} from "../../dao/message.js";
import { dbTestBase } from "../db-testutil.js";
import { createDtRosmMessage } from "../testdata-util.js";
import { type WeekDaysBitString, mapBitsToDays } from "../../util/weekdays.js";

describe(
    "dao",
    dbTestBase(() => {
        test("insertMessage - insert valid DtRamiMessage", async () => {
            const message = createDtRosmMessage({});
            await insertMessage(message);

            const result = await findActiveMessages();
            expect(result[0]?.id).toEqual(message.id);
            expect(result[0]?.stations?.split(",").sort()).toEqual(message?.stations?.sort());
            expect(mapBitsToDays(result[0]?.video?.delivery_rules?.days as WeekDaysBitString).sort()).toEqual(
                message.video?.daysOfWeek?.sort()
            );
        });
        test("findActiveMessages - only active is found", async () => {
            const activeMessage = createDtRosmMessage({ id: "abc" });
            const inactiveMessage = createDtRosmMessage({
                id: "def",
                start: subHours(new Date(), 2),
                end: subHours(new Date(), 1)
            });

            await insertMessage(activeMessage);
            await insertMessage(inactiveMessage);

            const result = await findActiveMessages();
            expect(result.length).toEqual(1);
            expect(result[0]?.id).toEqual(activeMessage.id);
        });
        test("findActiveMessages - find by station", async () => {
            const stations = ["HKI", "LPR"] as const;
            const message = createDtRosmMessage({
                id: "abc",
                stations: [...stations]
            });
            const anotherMessage = createDtRosmMessage({
                id: "def",
                stations: ["PSL", "LH"]
            });
            await insertMessage(message);
            await insertMessage(anotherMessage);

            const result = await findActiveMessages(null, null, stations[0]);
            expect(result.length).toEqual(1);
            expect(result[0]?.id).toEqual(message?.id);
            expect(result[0]?.stations?.includes(stations[0])).toEqual(true);
            expect(result[0]?.stations?.includes(stations[1])).toEqual(true);
        });
        test("findActiveMessages - find by train number", async () => {
            const trainNumber = 666;
            const message = createDtRosmMessage({
                id: "abc",
                trainNumber
            });
            const anotherMessage = createDtRosmMessage({
                id: "def",
                trainNumber: trainNumber - 1
            });
            await insertMessage(message);
            await insertMessage(anotherMessage);

            const result = await findActiveMessages(trainNumber);
            expect(result.length).toEqual(1);
            expect(result[0]?.id).toEqual(message.id);
            expect(result[0]?.train_number).toEqual(trainNumber);
        });
        test("findActiveMessages - find by train departure date", async () => {
            const trainDepartureLocalDate = "2023-06-06";
            const message = createDtRosmMessage({
                id: "abc",
                trainDepartureLocalDate
            });
            const anotherMessage = createDtRosmMessage({
                id: "def",
                trainDepartureLocalDate: "2023-06-05"
            });
            await insertMessage(message);
            await insertMessage(anotherMessage);

            const result = await findActiveMessages(undefined, trainDepartureLocalDate);
            expect(result.length).toEqual(1);
            expect(result[0]?.id).toEqual(message?.id);
            expect(result[0]?.train_departure_date).toEqual(trainDepartureLocalDate);
        });
        test("findActiveMessages - filter by only general", async () => {
            const generalMessage = createDtRosmMessage({
                id: "abc"
            });
            const trainRelatedMessage = createDtRosmMessage({
                id: "def",
                trainNumber: 1
            });
            await insertMessage(generalMessage);
            await insertMessage(trainRelatedMessage);

            const messages = await findActiveMessages(undefined, undefined, undefined, true);
            expect(messages.length).toBe(1);
            expect(messages[0]?.id).toEqual(generalMessage.id);
        });
        test("findActiveMessages - find by all parameters", async () => {
            const stations = ["HKI", "LPR"] as const;
            const trainNumber = 666;
            const trainDepartureLocalDate = "2023-06-06";
            const message = createDtRosmMessage({
                id: "abc",
                trainNumber,
                trainDepartureLocalDate,
                stations: [...stations]
            });
            const anotherMessage = createDtRosmMessage({
                id: "def",
                trainNumber: trainNumber - 1,
                trainDepartureLocalDate,
                stations: [...stations]
            });
            const thirdMessage = createDtRosmMessage({
                id: "ghi",
                stations: [...stations]
            });
            await insertMessage(message);
            await insertMessage(anotherMessage);
            await insertMessage(thirdMessage);

            const result = await findActiveMessages(trainNumber, trainDepartureLocalDate, stations[0], false);
            expect(result.length).toEqual(1);
            expect(result[0]?.id).toEqual(message?.id);
            expect(result[0]?.stations?.includes(stations[0])).toEqual(true);
            expect(result[0]?.stations?.includes(stations[1])).toEqual(true);
            expect(result[0]?.train_departure_date).toEqual(trainDepartureLocalDate);
            expect(result[0]?.train_number).toEqual(trainNumber);
        });
        test("findMessagesUpdatedAfter - correct", async () => {
            const date = subDays(new Date(), 2);
            const messageBeforeDate = createDtRosmMessage({ id: "abc", created: subDays(date, 1) });
            const messageAfterDate = createDtRosmMessage({
                id: "def",
                created: addDays(date, 1)
            });

            await insertMessage(messageBeforeDate);
            await insertMessage(messageAfterDate);

            const result = await findMessagesUpdatedAfter(date);

            expect(result.length).toEqual(1);
            expect(result[0]?.id).toEqual(messageAfterDate.id);
        });
        test("findMessagesUpdatedAfter - only active messages by default", async () => {
            const date = subDays(new Date(), 2);
            const messageBeforeDate = createDtRosmMessage({ id: "abc", created: subDays(date, 1) });
            const inactiveMessageAfterDate = createDtRosmMessage({
                id: "def",
                start: addHours(date, 24),
                end: addHours(date, 26),
                created: addHours(date, 24)
            });

            await insertMessage(messageBeforeDate);
            await insertMessage(inactiveMessageAfterDate);

            const result = await findMessagesUpdatedAfter(date);

            expect(result.length).toEqual(0);
        });
        test("findMessagesUpdatedAfter - inactive messages returned if parameter set", async () => {
            const date = subDays(new Date(), 2);
            const messageBeforeDate = createDtRosmMessage({ id: "abc", created: subDays(date, 1) });
            const inactiveMessageAfterDate = createDtRosmMessage({
                id: "def",
                start: addHours(date, 24),
                end: addHours(date, 26),
                created: addHours(date, 24)
            });

            await insertMessage(messageBeforeDate);
            await insertMessage(inactiveMessageAfterDate);

            const result = await findMessagesUpdatedAfter(date, null, null, null, null, false);

            expect(result.length).toEqual(1);
            expect(result[0]?.id).toEqual(inactiveMessageAfterDate.id);
        });
        test("setMessageDeleted - not found in active messages anymore", async () => {
            const message = createDtRosmMessage({});
            await insertMessage(message);

            const result = await findActiveMessages();
            expect(result.length).toEqual(1);

            await setMessageDeleted(message.id);
            const resultAfterDelete = await findActiveMessages();
            expect(resultAfterDelete.length).toEqual(0);
        });
        test("insert and get - weekday bits are correctly mapped", async () => {
            const message = createDtRosmMessage({});
            await insertMessage(message);
            const result = await findActiveMessages();
            expect(mapBitsToDays(result[0]?.video?.delivery_rules?.days as WeekDaysBitString).sort()).toEqual(
                message.video?.daysOfWeek?.sort()
            );
        });
    })
);
