// eslint-disable-next-line dot-notation
process.env["SECRET_ID"] = "";

import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { dbTestBase, insert, TEST_ATON_SECRET } from "../db-testutil.js";
import { jest } from "@jest/globals";

jest.spyOn(SecretHolder.prototype, "get").mockImplementation(() =>
  Promise.resolve(TEST_ATON_SECRET)
);
jest.spyOn(ProxyHolder.prototype, "setCredentials").mockImplementation(() =>
  Promise.resolve()
);

import { newFault } from "../testdata.js";
import type { SQSEvent } from "aws-lambda";
import {
  S124Type,
  type SendS124Event,
} from "../../model/upload-voyageplan-event.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";

const TEST_ADDRESS = "http://localhost:3000";

describe(
  "send-fault",
  dbTestBase((db: DTDatabase) => {
    test("faults are sent to endpoint", async () => {
      let receivedData: string | undefined;

      jest.unstable_mockModule("../../api/vis.js", () => ({
        postDocument: jest.fn(
          (
            faultS124: string,
            _url: string,
            _ca: string,
            _clientCertificate: string,
            _privateKey: string,
          ) => {
            receivedData = faultS124;

            return Promise.resolve();
          },
        ),
      }));

      const { handlerFn } = await import("../../lambda/send-s124/send-s124.js");

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
        callbackEndpoint: TEST_ADDRESS,
      };

      await handlerFn()(createSqsEvent(s124Event));

      // TODO better assertion
      expect(receivedData).toContain("S124:DataSet");
    });
  }),
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
