import { set } from "lodash-es";
import { validateIncomingRosmMessage } from "../../service/validate-message.js";
import { cloneAndUndefine, undefine } from "../message-util.js";
import { validRamiMonitoredJourneyScheduledMessage } from "../testdata-rosm.js";

describe("validate incoming rosm message", () => {
  test("validateIncomingRamiMessage - invalid scheduledMessage", () => {
    const invalidMessage = cloneAndUndefine(
      validRamiMonitoredJourneyScheduledMessage,
      "payload",
      "messageId",
    );
    undefine(
      invalidMessage,
      "payload",
      "scheduledMessage",
      "onGroundRecipient",
      "deliveryPoints",
    );

    const result = validateIncomingRosmMessage(invalidMessage);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toMatch(
        /payload must have required property 'messageId'/,
      );
      expect(result.errors).toMatch(
        /payload\/scheduledMessage\/onGroundRecipient must have required property 'deliveryPoints'/,
      );
    }
  });
  test("validateIncomingRamiMessage - invalid monitoredJourneyScheduledMessage", () => {
    const invalidMessage = cloneAndUndefine(
      validRamiMonitoredJourneyScheduledMessage,
      "payload",
      "messageId",
    );
    undefine(invalidMessage, "payload", "messageVersion");
    set(
      invalidMessage,
      ["payload", "monitoredJourneyScheduledMessage", "deliveryPoints", 0],
      {
        id: 0,
        nameLong: "abc",
      },
    );

    const result = validateIncomingRosmMessage(invalidMessage);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toMatch(
        /payload must have required property 'messageId'/,
      );
      expect(result.errors).toMatch(
        /payload must have required property 'messageVersion'/,
      );
      expect(result.errors).toMatch(
        /payload\/monitoredJourneyScheduledMessage\/deliveryPoints\/0\/id must be string/,
      );
    }
  });

  test("validateIncomingRamiMessage - valid scheduledMessage", () => {
    const result = validateIncomingRosmMessage(
      validRamiMonitoredJourneyScheduledMessage,
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toEqual(validRamiMonitoredJourneyScheduledMessage);
    }
  });

  test("validateIncomingRamiMessage - valid monitoredJourneyScheduledMessage", () => {
    const result = validateIncomingRosmMessage(
      validRamiMonitoredJourneyScheduledMessage,
    );
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.value).toEqual(validRamiMonitoredJourneyScheduledMessage);
    }
  });
});
