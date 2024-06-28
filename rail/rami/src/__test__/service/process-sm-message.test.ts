import type { DtSmMessage } from "../../model/dt-rosm-message.js";
import { parseSmMessage } from "../../service/process-sm-message.js";
import { validMessage2 } from "../testdata-sm.js";
import { createSmMessage } from "../testdata-util.js";

describe("parse sm messages", () => {
    function expectMessage(processedMessage: DtSmMessage | undefined, index: number, timeUnknown: boolean, quayUnknown: boolean, type: number,
        trainNumber: number = 8122, departureDate: string = "20240619"
    ): void {
        if(!processedMessage) {
            throw new Error("no message!");
        }

        expect(processedMessage.trainNumber).toEqual(trainNumber);
        expect(processedMessage.departureDate).toEqual(departureDate);        

        const data = processedMessage.data[index];

        if(!data) {
            throw new Error("No data at index " + index);
        }

        expect(data.timeUnknown).toEqual(timeUnknown);
        expect(data.quayUnknown).toEqual(quayUnknown);
        expect(data.type).toEqual(type);
    }

    test("parseSmMessage - invalid scheduledMessage", () => {
        const processedMessage = parseSmMessage("well this is invalid");

        expect(processedMessage).toBeUndefined();
    });


    test("parseSmMessage - valid scheduledMessage all unknown", () => {
        const processedMessage = parseSmMessage(createSmMessage({}));

        expectMessage(processedMessage, 0, true, true, 0);
        expectMessage(processedMessage, 1, true, true, 1);
        expectMessage(processedMessage, 2, true, false, 0);
    });

    test("parseSmMessage - valid scheduledMessage arrival time known", () => {
        const processedMessage = parseSmMessage(createSmMessage({
            arrivalTime: "2024-06-19T12:03:00"
        }));

        expectMessage(processedMessage, 0, false, true, 0);
        expectMessage(processedMessage, 1, true, true, 1);
    });

    test("parseSmMessage - valid scheduledMessage arrival quay known", () => {
        const processedMessage = parseSmMessage(createSmMessage({
            arrivalQuay: "B1",
        }));

        expectMessage(processedMessage, 0, true, false, 0);
        expectMessage(processedMessage, 1, true, true, 1);
    });


    test("parseSmMessage - valid scheduledMessage departure time known", () => {
        const processedMessage = parseSmMessage(createSmMessage({
            departureTime: "2024-06-19T12:03:00"
        }));

        expectMessage(processedMessage, 0, true, true, 0);
        expectMessage(processedMessage, 1, false, true, 1);
    });

    test("parseSmMessage - valid scheduledMessage departure quay known", () => {
        const processedMessage = parseSmMessage(createSmMessage({
            departureQuay: "B2"
        }));

        expectMessage(processedMessage, 0, true, true, 0);
        expectMessage(processedMessage, 1, true, false, 1);
    });

    test("parseSmMessage - valid scheduledMessage with onwardCalls", () => {
        const processedMessage = parseSmMessage(validMessage2);

        expectMessage(processedMessage, 0, false, false, 0, 762, "20240319");
        expectMessage(processedMessage, 1, false, false, 1, 762, "20240319");
        expectMessage(processedMessage, 2, true, false, 0, 762, "20240319");
        expectMessage(processedMessage, 3, true, false, 1, 762, "20240319");
    });

});
