import { afterEach, describe, expect, test, vi } from "vitest";
import { logger } from "../../aws/runtime/dt-logger-default.js";
import type { LeadTimeLogging } from "../../utils/lead-time-logging.js";
import { logLeadTime, logLeadTimes } from "../../utils/lead-time-logging.js";

describe("lead-time-logging", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("logLeadTime logs expected payload", () => {
    const infoSpy = vi
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);
    const errorSpy = vi
      .spyOn(logger, "error")
      .mockImplementation(() => undefined);

    logLeadTime("lead-time", "test-target", 123);

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith({
      method: "LeadTimeLogging.logLeadTime",
      customLeadTime: true,
      customName: "lead-time",
      customTarget: "test-target",
      tookMs: 123,
    });
    expect(errorSpy).toHaveBeenCalledTimes(0);
  });

  test("logLeadTime merges extra fields", () => {
    const infoSpy = vi
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);

    logLeadTime("mqtt-time", "mqtt", 88, {
      customSource: "mqtt",
      customRetriesCount: 2,
    });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith({
      method: "LeadTimeLogging.logLeadTime",
      customLeadTime: true,
      customName: "mqtt-time",
      customTarget: "mqtt",
      tookMs: 88,
      customSource: "mqtt",
      customRetriesCount: 2,
    });
  });

  test("logLeadTime logs error if logger.info throws", () => {
    const infoError = new Error("boom");
    vi.spyOn(logger, "info").mockImplementation(() => {
      throw infoError;
    });
    const errorSpy = vi
      .spyOn(logger, "error")
      .mockImplementation(() => undefined);

    logLeadTime("process-time", "target", 10);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith({
      method: "LeadTimeLogging.logLeadTime",
      message: "Error logging lead time",
      error: infoError,
    });
  });

  test("logLeadTimes logs only lead-time when only leadTimeMs is safe", () => {
    const infoSpy = vi
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);

    logLeadTimes({ target: "x", leadTimeMs: 10 });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenNthCalledWith(1, {
      method: "LeadTimeLogging.logLeadTime",
      customLeadTime: true,
      customName: "lead-time",
      customTarget: "x",
      tookMs: 10,
    });
  });

  test("logLeadTimes logs only process-time when only processTimeMs is safe", () => {
    const infoSpy = vi
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);

    logLeadTimes({ target: "x", processTimeMs: 20 });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenNthCalledWith(1, {
      method: "LeadTimeLogging.logLeadTime",
      customLeadTime: true,
      customName: "process-time",
      customTarget: "x",
      tookMs: 20,
    });
  });

  test("logLeadTimes logs both in order with extra fields", () => {
    const infoSpy = vi
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);
    const input: LeadTimeLogging = {
      target: "device",
      leadTimeMs: 11,
      processTimeMs: 22,
      extraFields: { customSource: "mqtt", customPartition: 3 },
    };

    logLeadTimes(input);

    expect(infoSpy).toHaveBeenCalledTimes(2);
    expect(infoSpy).toHaveBeenNthCalledWith(1, {
      method: "LeadTimeLogging.logLeadTime",
      customLeadTime: true,
      customName: "lead-time",
      customTarget: "device",
      tookMs: 11,
      customSource: "mqtt",
      customPartition: 3,
    });
    expect(infoSpy).toHaveBeenNthCalledWith(2, {
      method: "LeadTimeLogging.logLeadTime",
      customLeadTime: true,
      customName: "process-time",
      customTarget: "device",
      tookMs: 22,
      customSource: "mqtt",
      customPartition: 3,
    });
  });

  test("logLeadTimes ignores non-safe values", () => {
    const infoSpy = vi
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);

    logLeadTimes({
      target: "x",
      leadTimeMs: 1.5,
      processTimeMs: Number.MAX_SAFE_INTEGER + 1,
    });
    logLeadTimes({
      target: "x",
      leadTimeMs: Number.NaN,
      processTimeMs: Infinity,
    });
    logLeadTimes({ target: "x" });

    expect(infoSpy).toHaveBeenCalledTimes(0);
  });

  test("logLeadTimes logs negative safe integer values", () => {
    const infoSpy = vi
      .spyOn(logger, "info")
      .mockImplementation(() => undefined);

    logLeadTimes({ target: "x", leadTimeMs: -5 });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenNthCalledWith(1, {
      method: "LeadTimeLogging.logLeadTime",
      customLeadTime: true,
      customName: "lead-time",
      customTarget: "x",
      tookMs: -5,
    });
  });
});

// clean comment
