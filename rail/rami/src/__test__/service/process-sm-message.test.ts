import type { UnknownDelayOrTrackMessage } from "../../model/dt-rosm-message.js";
import { parseUDOTMessage } from "../../service/process-sm-message.js";
import { realMessage, validMessage2 } from "../testdata-sm.js";
import { createSmMessage } from "../testdata-util.js";

describe("parse sm messages", () => {
    function expectMessage(processedMessage: UnknownDelayOrTrackMessage | undefined, index: number, delayUnknown: boolean, trackUnknown: boolean, type: number,
        trainNumber: number = 8122, departureDate: string = "2024-06-19"
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

        expect(data.unknownDelay).toEqual(delayUnknown);
        expect(data.unknownTrack).toEqual(trackUnknown);
        expect(data.type).toEqual(type);
    }

    test("parseSmMessage - invalid scheduledMessage", () => {
        const processedMessage = parseUDOTMessage("well this is invalid");

        expect(processedMessage).toBeUndefined();
    });


    test("parseSmMessage - valid scheduledMessage all unknown", () => {
        const processedMessage = parseUDOTMessage(createSmMessage({}));

        expectMessage(processedMessage, 0, true, true, 0);
        expectMessage(processedMessage, 1, true, true, 1);
        expectMessage(processedMessage, 2, true, false, 0);
    });

    test("parseSmMessage - valid scheduledMessage arrival time known", () => {
        const processedMessage = parseUDOTMessage(createSmMessage({
            arrivalTime: "2024-06-19T12:03:00"
        }));

        expectMessage(processedMessage, 0, false, true, 0);
        expectMessage(processedMessage, 1, true, true, 1);
    });

    test("parseSmMessage - valid scheduledMessage arrival quay known", () => {
        const processedMessage = parseUDOTMessage(createSmMessage({
            arrivalQuay: "B1",
        }));

        expectMessage(processedMessage, 0, true, false, 0);
        expectMessage(processedMessage, 1, true, true, 1);
    });


    test("parseSmMessage - valid scheduledMessage departure time known", () => {
        const processedMessage = parseUDOTMessage(createSmMessage({
            departureTime: "2024-06-19T12:03:00"
        }));

        expectMessage(processedMessage, 0, true, true, 0);
        expectMessage(processedMessage, 1, false, true, 1);
    });

    test("parseSmMessage - valid scheduledMessage departure quay known", () => {
        const processedMessage = parseUDOTMessage(createSmMessage({
            departureQuay: "B2"
        }));

        expectMessage(processedMessage, 0, true, true, 0);
        expectMessage(processedMessage, 1, true, false, 1);
    });

    test("parseSmMessage - valid scheduledMessage with onwardCalls", () => {
        const processedMessage = parseUDOTMessage(validMessage2);

        expectMessage(processedMessage, 0, false, false, 0, 762, "2024-03-19");
        expectMessage(processedMessage, 1, false, false, 1, 762, "2024-03-19");
        expectMessage(processedMessage, 2, true, false, 0, 762, "2024-03-19");
        expectMessage(processedMessage, 3, true, false, 1, 762, "2024-03-19");
    });

    test("parseSmMessage - real message", () => {
        const processedMessage = parseUDOTMessage(realMessage);

        expectMessage(processedMessage, 0, false, false, 0, 8844, "2024-07-26");
    });
});
