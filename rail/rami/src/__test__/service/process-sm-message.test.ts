import type { DtSmMessage } from "../../model/dt-rami-message.js";
import { parseSmMessage } from "../../service/process-sm-message.js";
import { validMessage2 } from "../testdata-sm.js";
import { createSmMessage } from "../testdata-util.js";

describe("parse sm message", () => {
    function expectMessage(processedMessage: DtSmMessage | undefined, index: number, at: boolean, aq:boolean, dt: boolean, dq: boolean,
        trainNumber: number = 8122, departureDate: string = "20240619"
    ): void {
        expect(processedMessage).toBeDefined();

        expect(processedMessage?.trainNumber).toEqual(trainNumber);
        expect(processedMessage?.departureDate).toEqual(departureDate);

        const data = processedMessage?.data[index];

        expect(data?.arrivalTimeUnknown).toEqual(at);
        expect(data?.arrivalQuayUnknown).toEqual(aq);
        expect(data?.departureTimeUnknown).toEqual(dt);
        expect(data?.departureQuayUnknown).toEqual(dq);
    }

    test("parseMessage - invalid scheduledMessage", () => {
        const processedMessage = parseSmMessage("well this is invalid");

        expect(processedMessage).toBeUndefined();
    });


    test("parseMessage - valid scheduledMessage all unknown", () => {
        const processedMessage = parseSmMessage(createSmMessage({}));

        expectMessage(processedMessage, 0, true, true, true, true);
        expectMessage(processedMessage, 1, true, false, false, false);
    });

    test("parseMessage - valid scheduledMessage arrival time known", () => {
        const processedMessage = parseSmMessage(createSmMessage({
            arrivalTime: "2024-06-19T12:03:00"
        }));

        expectMessage(processedMessage, 0, false, true, true, true);
    });

    test("parseMessage - valid scheduledMessage arrival quay known", () => {
        const processedMessage = parseSmMessage(createSmMessage({
            arrivalQuay: "B1",
        }));

        expectMessage(processedMessage, 0, true, false, true, true);
    });


    test("parseMessage - valid scheduledMessage departure time known", () => {
        const processedMessage = parseSmMessage(createSmMessage({
            departureTime: "2024-06-19T12:03:00"
        }));

        expectMessage(processedMessage, 0, true, true, false, true);
    });

    test("parseMessage - valid scheduledMessage departure quay known", () => {
        const processedMessage = parseSmMessage(createSmMessage({
            departureQuay: "B2"
        }));

        expectMessage(processedMessage, 0, true, true, true, false);
    });

    test("parseMessage - valid scheduledMessage with onwardCalls", () => {
        const processedMessage = parseSmMessage(validMessage2);

        expectMessage(processedMessage, 0, false, false, false, false, 762, "20240319");
        expectMessage(processedMessage, 1, true, false, true, false, 762, "20240319");
    });

});
