import { validateIncomingSmMessage } from "../../service/validate-message.js";
import { cloneAndUndefine } from "../message-util.js";
import {
  realMessage,
  validMessage2,
  validMessageUnknownTrackAndDelay,
} from "../testdata-sm.js";

describe("validate incoming sm message", () => {
  function expectValid(message: unknown): void {
    const result = validateIncomingSmMessage(message);

    if (!result.valid) {
      console.info(result.errors);
    }

    expect(result.valid).toBe(true);
    if (result.valid) expect(result.value).toEqual(message);
  }

  test("validateIncomingSmMessage - missing payload", () => {
    const invalidMessage = cloneAndUndefine(
      validMessageUnknownTrackAndDelay,
      "payload",
    );

    const result = validateIncomingSmMessage(invalidMessage);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toMatch(/must have required property 'payload'/);
    }
  });

  test("validateIncomingSmMessage - missing monitoredStopVisits", () => {
    const invalidMessage = cloneAndUndefine(
      validMessageUnknownTrackAndDelay,
      "stopMonitoringMsg",
      "payload",
      "monitoredStopVisits",
    );

    const result = validateIncomingSmMessage(invalidMessage);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.errors).toMatch(
        /payload must have required property 'monitoredStopVisits'/,
      );
    }
  });

  test("validateIncomingSmMessage - valid scheduledMessage", () => {
    expectValid(validMessageUnknownTrackAndDelay);
  });

  test("validateIncomingSmMessage - valid message with onwardCalls", () => {
    expectValid(validMessage2);
  });

  test("validateIncomingSmMessage - real message", () => {
    expectValid(realMessage);
  });
});
