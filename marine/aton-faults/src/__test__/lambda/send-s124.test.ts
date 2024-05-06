// eslint-disable-next-line dot-notation
process.env["SECRET_ID"] = "";

import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { dbTestBase, insert, TEST_ATON_SECRET } from "../db-testutil.js";
import { jest } from "@jest/globals";

jest.spyOn(SecretHolder.prototype, "get").mockImplementation(() => Promise.resolve(TEST_ATON_SECRET));
jest.spyOn(ProxyHolder.prototype, "setCredentials").mockImplementation(() => Promise.resolve());

import { newFault } from "../testdata.js";
import type { SQSEvent } from "aws-lambda";
import { S124Type, type SendS124Event } from "../../model/upload-voyageplan-event.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import ky from "ky";
import type { Options, Input, ResponsePromise } from "ky";

describe(
    "send-fault",
    dbTestBase((db: DTDatabase) => {
        test("faults are sent to endpoint", async () => {
            const { handlerFn } = await import("../../lambda/send-s124/send-s124.js");

            let receivedData: string | undefined;

            jest.spyOn(ky, "post").mockImplementation((_url: Input, options?: Options): ResponsePromise => {
                receivedData = options!.body as string;

                return Promise.resolve({
                    status: 200
                }) as ResponsePromise;
            });

            const fault = newFault({
                geometry: {
                    lat: 60.285807,
                    lon: 27.321659
                }
            });
            await insert(db, [fault]);
            const s124Event: SendS124Event = {
                type: S124Type.FAULT,
                id: fault.id,
                callbackEndpoint: "does_not_really_matter"
            };

            await handlerFn()(createSqsEvent(s124Event));

            // TODO better assertion
            expect(receivedData).toContain("S124:DataSet");
        });
    })
);

function createSqsEvent(sendFaultEvent: SendS124Event): SQSEvent {
    return {
        Records: [
            {
                body: JSON.stringify(sendFaultEvent)
            }
        ]
    } as SQSEvent;
}
