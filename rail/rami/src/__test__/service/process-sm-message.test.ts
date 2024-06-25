import type { DtSmMessage } from "../../model/dt-rami-message.js";
import { parseSmMessage } from "../../service/process-sm-message.js";
import { createSmMessage } from "../testdata-util.js";

describe("parse sm message", () => {
    function expectMessage(processedMessage: DtSmMessage | undefined, at: boolean, aq:boolean, dt: boolean, dq: boolean): void {
        expect(processedMessage).toBeDefined();

        expect(processedMessage?.trainNumber).toEqual(8122);
        expect(processedMessage?.departureDate).toEqual("20240619");

        if(at) expect(processedMessage?.arrivalTimeUnknown).toBeTruthy();
        else expect(processedMessage?.arrivalTimeUnknown).toBeFalsy();

        if(aq) expect(processedMessage?.arrivalQuayUnknown).toBeTruthy();
        else expect(processedMessage?.arrivalQuayUnknown).toBeFalsy();

        if(dt) expect(processedMessage?.departureTimeUnknown).toBeTruthy();
        else expect(processedMessage?.departureTimeUnknown).toBeFalsy();

        if(dq) expect(processedMessage?.departureQuayUnknown).toBeTruthy();
        else expect(processedMessage?.departureQuayUnknown).toBeFalsy();
    }

    test("parseMessage - invalid scheduledMessage", () => {
        const processedMessage = parseSmMessage("well this is invalid");

        expect(processedMessage).toBeUndefined();
    });


    test("parseMessage - valid scheduledMessage all unknown", () => {
        const processedMessage = parseSmMessage(createSmMessage({}));

        expectMessage(processedMessage, true, true, true, true);
    });

    test("parseMessage - valid scheduledMessage arrival time known", () => {
        const processedMessage = parseSmMessage(createSmMessage({
            arrivalTime: "2024-06-19T12:03:00"
        }));

        expectMessage(processedMessage, false, true, true, true);
    });

    test("parseMessage - valid scheduledMessage arrival quay known", () => {
        const processedMessage = parseSmMessage(createSmMessage({
            arrivalQuay: "B1",
        }));

        expectMessage(processedMessage, true, false, true, true);
    });


    test("parseMessage - valid scheduledMessage departure time known", () => {
        const processedMessage = parseSmMessage(createSmMessage({
            departureTime: "2024-06-19T12:03:00"
        }));

        expectMessage(processedMessage, true, true, false, true);
    });

    test("parseMessage - valid scheduledMessage departure quay known", () => {
        const processedMessage = parseSmMessage(createSmMessage({
            departureQuay: "B2"
        }));

        expectMessage(processedMessage, true, true, true, false);
    });

});
