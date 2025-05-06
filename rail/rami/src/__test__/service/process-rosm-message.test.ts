import _ from "lodash";
import { RosmMessageOperations } from "../../model/rosm-message.js";
import { getActiveMessages } from "../../service/get-message.js";
import {
  parseRosmMessage,
  processRosmMessage,
} from "../../service/process-rosm-message.js";
import { dbTestBase } from "../db-testutil.js";
import { validRamiMonitoredJourneyScheduledMessage } from "../testdata-rosm.js";
import {
  createMonitoredJourneyScheduledMessage,
  createScheduledMessage,
} from "../testdata-util.js";

describe("parse rosm message", () => {
  test("parseMessage - valid monitoredJourneyScheduledMessage is correctly parsed", () => {
    const processedMessage = parseRosmMessage(
      validRamiMonitoredJourneyScheduledMessage,
    );
    expect(processedMessage?.id).toEqual(
      validRamiMonitoredJourneyScheduledMessage.payload.messageId,
    );
  });

  test("parseMessage - valid scheduledMessage is correctly parsed", () => {
    const processedMessage = parseRosmMessage(
      validRamiMonitoredJourneyScheduledMessage,
    );
    expect(processedMessage?.id).toEqual(
      validRamiMonitoredJourneyScheduledMessage.payload.messageId,
    );
  });

  test("parseMessage - invalid message is correctly parsed", () => {
    const invalidMessage = _.set(
      _.cloneDeep(validRamiMonitoredJourneyScheduledMessage),
      ["payload", "messageId"],
      undefined,
    );
    const processedMessage = parseRosmMessage(invalidMessage);
    expect(processedMessage).not.toBeDefined();
  });
});

describe(
  "process rosm message",
  dbTestBase(() => {
    test("processRosmMessage - insert valid monitoredJourneyScheduledMessage", async () => {
      const message = parseRosmMessage(
        createMonitoredJourneyScheduledMessage({}),
      );
      if (!message) fail();
      await processRosmMessage(message);

      const activeMessages = await getActiveMessages();
      expect(activeMessages.length).toEqual(1);
      expect(activeMessages[0]?.id).toEqual(message.id);
    });
    test("processRosmMessage - insert valid scheduledMessage", async () => {
      const message = parseRosmMessage(createScheduledMessage({}));
      if (!message) fail();
      await processRosmMessage(message);

      const activeMessages = await getActiveMessages();
      expect(activeMessages.length).toEqual(1);
      expect(activeMessages[0]?.id).toEqual(message.id);
    });
    test("processRosmMessage - update valid message", async () => {
      const message = parseRosmMessage(
        createScheduledMessage({ operation: RosmMessageOperations.INSERT }),
      );
      if (!message) fail();
      const updatedMessage = {
        ...message,
        operation: RosmMessageOperations.UPDATE,
        version: message.version + 1,
      };
      await processRosmMessage(message);
      await processRosmMessage(updatedMessage);

      const activeMessages = await getActiveMessages();
      expect(activeMessages.length).toEqual(1);
      expect(activeMessages[0]?.id).toEqual(message.id);
      expect(activeMessages[0]?.version).toEqual(updatedMessage.version);
    });
    test("processRosmMessage - delete message", async () => {
      const message = parseRosmMessage(
        createScheduledMessage({ operation: RosmMessageOperations.INSERT }),
      );
      if (!message) fail();
      await processRosmMessage(message);

      const activeMessages = await getActiveMessages();
      expect(activeMessages.length).toEqual(1);
      expect(activeMessages[0]?.id).toEqual(message.id);

      const deletedMessage = {
        ...message,
        operation: RosmMessageOperations.DELETE,
      };
      await processRosmMessage(deletedMessage);

      const activeMessagesAfterDelete = await getActiveMessages();
      expect(activeMessagesAfterDelete.length).toEqual(0);
    });
  }),
);
