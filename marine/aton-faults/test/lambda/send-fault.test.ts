import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";

jest.mock("@digitraffic/common/dist/aws/runtime/secrets/secret-holder", () => {
    return {
        SecretHolder: {
            create: jest.fn(() => ({
                get: jest.fn(() => Promise.resolve(TEST_ATON_SECRET)),
            })),
        },
    };
});

import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";

jest.mock("@digitraffic/common/dist/aws/runtime/secrets/proxy-holder", () => {
    return {
        ProxyHolder: {
            create: jest.fn(() => ({
                setCredentials: jest.fn(() => Promise.resolve()),
            })),
        },
    };
});

import { dbTestBase, insert, TEST_ATON_SECRET } from "../db-testutil";
import { handlerFn } from "../../lib/lambda/send-s124/send-s124";
import { newFault } from "../testdata";
import { SQSEvent } from "aws-lambda";
import { TestHttpServer } from "@digitraffic/common/dist/test/httpserver";
import {
    S124Type,
    SendS124Event,
} from "../../lib/model/upload-voyageplan-event";
import { DTDatabase } from "@digitraffic/common/dist/database/database";
const SERVER_PORT = 30123;

describe(
    "send-fault",
    dbTestBase((db: DTDatabase) => {
        test("faults are sent to endpoint", async () => {
            const server = new TestHttpServer();
            try {
                let receivedData: string | undefined;
                const fault = newFault({
                    geometry: {
                        lat: 60.285807,
                        lon: 27.321659,
                    },
                });
                await insert(db, [fault]);
                const s124Event: SendS124Event = {
                    type: S124Type.FAULT,
                    id: fault.id,
                    callbackEndpoint: `http://localhost:${SERVER_PORT}/area`,
                };

                server.listen(SERVER_PORT, {
                    "/area": (
                        url: string | undefined,
                        data: string | undefined
                    ) => {
                        receivedData = data;
                        return "";
                    },
                });

                await handlerFn()(createSqsEvent(s124Event));

                // TODO better assertion
                expect(receivedData).toContain("S124:DataSet");
            } finally {
                server.close();
            }
        });
    })
);

function createSqsEvent(sendFaultEvent: SendS124Event): SQSEvent {
    return {
        Records: [
            {
                body: JSON.stringify(sendFaultEvent),
            },
        ],
    } as SQSEvent;
}
