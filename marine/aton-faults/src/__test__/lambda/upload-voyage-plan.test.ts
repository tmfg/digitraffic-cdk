// eslint-disable-next-line dot-notation
process.env["SECRET_ID"] = "";

import { AtonEnvKeys } from "../../keys.js";
import { dbTestBase, insert, TEST_ATON_SECRET } from "../db-testutil.js";
import { newFaultWithGeometry, voyagePlan } from "../testdata.js";
import { BAD_REQUEST_MESSAGE } from "@digitraffic/common/dist/aws/types/errors";
import type { UploadVoyagePlanEvent } from "../../model/upload-voyageplan-event.js";
import type { DTDatabase } from "@digitraffic/common/dist/database/database";
import { SecretHolder } from "@digitraffic/common/dist/aws/runtime/secrets/secret-holder";
import { jest } from "@jest/globals";

process.env[AtonEnvKeys.SEND_S124_QUEUE_URL] = "Value_for_test";

import { SQS } from "@aws-sdk/client-sqs";

const { handler } = await import(
  "../../lambda/upload-voyage-plan/upload-voyage-plan.js"
);

// mock SecretHolder & SQS
jest.spyOn(SecretHolder.prototype, "get").mockResolvedValue(TEST_ATON_SECRET);
const sendStub = jest.spyOn(SQS.prototype, "sendMessage").mockReturnValue();

describe(
  "upload-voyage-plan",
  dbTestBase((db: DTDatabase) => {
    test("publishes to SNS per fault id", async () => {
      const fault1 = newFaultWithGeometry(60.285807, 27.321659);
      const fault2 = newFaultWithGeometry(60.285817, 27.32166);

      await insert(db, [fault1, fault2]);
      const uploadEvent: UploadVoyagePlanEvent = {
        voyagePlan,
        callbackEndpoint: "some-endpoint",
      };

      await handler(uploadEvent);

      expect(sendStub).toHaveBeenCalledTimes(2);
    });

    test("failed route parsing", async () => {
      const uploadEvent: UploadVoyagePlanEvent = {
        voyagePlan: "asdfasdf",
      };

      await expect(handler(uploadEvent)).rejects.toMatch(BAD_REQUEST_MESSAGE);
    });
  }),
);
