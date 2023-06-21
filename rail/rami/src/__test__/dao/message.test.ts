import { subHours } from "date-fns";
import { findActiveMessages, insertMessage, setMessageDeleted } from "../../dao/message";
import { dbTestBase } from "../db-testutil";
import { createDtRamiMessage } from "../testdata-util";
import { WeekDaysBitString, mapBitsToDays } from "../../util/weekdays";

describe(
    "dao",
    dbTestBase(() => {
        test("insertMessage - insert valid DtRamiMessage", async () => {
            const message = createDtRamiMessage({});
            await insertMessage(message);

            const result = await findActiveMessages();
            expect(result[0]?.id).toEqual(message.id);
            expect(result[0]?.stations?.split(",").sort()).toEqual(message?.stations?.sort());
            expect(mapBitsToDays(result[0]?.video?.delivery_rules?.days as WeekDaysBitString).sort()).toEqual(
                message.video?.daysOfWeek?.sort()
            );
        });
        test("findActiveMessages - only active is found", async () => {
            const activeMessage = createDtRamiMessage({ id: "abc" });
            const inactiveMessage = createDtRamiMessage({
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
            const message = createDtRamiMessage({
                id: "abc",
                stations: [...stations]
            });
            const anotherMessage = createDtRamiMessage({
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
            const message = createDtRamiMessage({
                id: "abc",
                trainNumber
            });
            const anotherMessage = createDtRamiMessage({
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
            const message = createDtRamiMessage({
                id: "abc",
                trainDepartureLocalDate
            });
            const anotherMessage = createDtRamiMessage({
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
            const generalMessage = createDtRamiMessage({
                id: "abc"
            });
            const trainRelatedMessage = createDtRamiMessage({
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
            const message = createDtRamiMessage({
                id: "abc",
                trainNumber,
                trainDepartureLocalDate,
                stations: [...stations]
            });
            const anotherMessage = createDtRamiMessage({
                id: "def",
                trainNumber: trainNumber - 1,
                trainDepartureLocalDate,
                stations: [...stations]
            });
            const thirdMessage = createDtRamiMessage({
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
        test("setMessageDeleted - not found in active messages anymore", async () => {
            const message = createDtRamiMessage({});
            await insertMessage(message);

            const result = await findActiveMessages();
            expect(result.length).toEqual(1);

            await setMessageDeleted(message.id);
            const resultAfterDelete = await findActiveMessages();
            expect(resultAfterDelete.length).toEqual(0);
        });
        test("insert and get - weekday bits are correctly mapped", async () => {
            const message = createDtRamiMessage({});
            await insertMessage(message);
            const result = await findActiveMessages();
            expect(mapBitsToDays(result[0]?.video?.delivery_rules?.days as WeekDaysBitString).sort()).toEqual(
                message.video?.daysOfWeek?.sort()
            );
        });
    })
);
