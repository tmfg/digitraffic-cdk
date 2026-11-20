import { afterEach, describe, expect, test, vi } from "vitest";
import { logger } from "../../aws/runtime/logging/dt-logger-default.js";
import { MaintenanceLogger } from "../../aws/runtime/logging/maintenance-logger.js";
import { WIDE_CONTEXT } from "../../aws/runtime/logging/wide-context.js";

vi.mock("../../aws/runtime/logging/dt-logger-default.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

describe("maintenance-logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("logCleanup", () => {
    test("logs successful cleanup with all required fields", () => {
      const infoSpy = vi
        .spyOn(logger, "info")
        .mockImplementation(() => undefined);

      MaintenanceLogger.instance().logCleanup("users", 150, 10, 2.5);

      expect(infoSpy).toHaveBeenCalledWith({
        method: "MaintenanceLogger.logCleanup",
        [WIDE_CONTEXT.OUTCOME.KEY]: WIDE_CONTEXT.OUTCOME.VALUE_SUCCESS,
        [WIDE_CONTEXT.DB_MAINTENANCE.KEY_CLEANUP]: true,
        [WIDE_CONTEXT.DB_MAINTENANCE.KEY_TABLENAME]: "users",
        [WIDE_CONTEXT.DB_MAINTENANCE.KEY_DELETED_COUNT]: 150,
        [WIDE_CONTEXT.DB_MAINTENANCE.KEY_BATCH_SIZE]: 10,
        [WIDE_CONTEXT.DURATION]: 2.5,
      });
    });

    test("logs cleanup with different table names", () => {
      const infoSpy = vi
        .spyOn(logger, "info")
        .mockImplementation(() => undefined);

      MaintenanceLogger.instance().logCleanup("events", 500, 50, 5.0);

      expect(infoSpy).toHaveBeenCalledWith({
        method: "MaintenanceLogger.logCleanup",
        [WIDE_CONTEXT.OUTCOME.KEY]: WIDE_CONTEXT.OUTCOME.VALUE_SUCCESS,
        [WIDE_CONTEXT.DB_MAINTENANCE.KEY_CLEANUP]: true,
        [WIDE_CONTEXT.DB_MAINTENANCE.KEY_TABLENAME]: "events",
        [WIDE_CONTEXT.DB_MAINTENANCE.KEY_DELETED_COUNT]: 500,
        [WIDE_CONTEXT.DB_MAINTENANCE.KEY_BATCH_SIZE]: 50,
        [WIDE_CONTEXT.DURATION]: 5.0,
      });
    });

    test("logs cleanup with zero deleted count", () => {
      const infoSpy = vi
        .spyOn(logger, "info")
        .mockImplementation(() => undefined);

      MaintenanceLogger.instance().logCleanup("archive", 0, 100, 0.5);

      expect(infoSpy).toHaveBeenCalledWith({
        method: "MaintenanceLogger.logCleanup",
        [WIDE_CONTEXT.OUTCOME.KEY]: WIDE_CONTEXT.OUTCOME.VALUE_SUCCESS,
        [WIDE_CONTEXT.DB_MAINTENANCE.KEY_CLEANUP]: true,
        [WIDE_CONTEXT.DB_MAINTENANCE.KEY_TABLENAME]: "archive",
        [WIDE_CONTEXT.DB_MAINTENANCE.KEY_DELETED_COUNT]: 0,
        [WIDE_CONTEXT.DB_MAINTENANCE.KEY_BATCH_SIZE]: 100,
        [WIDE_CONTEXT.DURATION]: 0.5,
      });
    });
  });

  describe("logError", () => {
    test("logs error with all required fields", () => {
      const errorSpy = vi
        .spyOn(logger, "error")
        .mockImplementation(() => undefined);
      const error = new Error("Database connection failed");

      MaintenanceLogger.instance().logError("users", 1.2, error);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "MaintenanceLogger.logError",
          [WIDE_CONTEXT.OUTCOME.KEY]: WIDE_CONTEXT.OUTCOME.VALUE_ERROR,
          [WIDE_CONTEXT.DB_MAINTENANCE.KEY_CLEANUP]: true,
          [WIDE_CONTEXT.DB_MAINTENANCE.KEY_TABLENAME]: "users",
          [WIDE_CONTEXT.DURATION]: 1.2,
          error,
        }),
      );
    });

    test("logs error with string error", () => {
      const errorSpy = vi
        .spyOn(logger, "error")
        .mockImplementation(() => undefined);

      MaintenanceLogger.instance().logError("events", 0.5, "Timeout occurred");

      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "MaintenanceLogger.logError",
          [WIDE_CONTEXT.OUTCOME.KEY]: WIDE_CONTEXT.OUTCOME.VALUE_ERROR,
          [WIDE_CONTEXT.DB_MAINTENANCE.KEY_CLEANUP]: true,
          [WIDE_CONTEXT.DB_MAINTENANCE.KEY_TABLENAME]: "events",
          [WIDE_CONTEXT.DURATION]: 0.5,
          error: "Timeout occurred",
        }),
      );
    });

    test("logs error with Error object", () => {
      const errorSpy = vi
        .spyOn(logger, "error")
        .mockImplementation(() => undefined);
      const error = new Error("Connection lost");

      MaintenanceLogger.instance().logError("archive", 2.0, error);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "MaintenanceLogger.logError",
          [WIDE_CONTEXT.OUTCOME.KEY]: WIDE_CONTEXT.OUTCOME.VALUE_ERROR,
          [WIDE_CONTEXT.DB_MAINTENANCE.KEY_CLEANUP]: true,
          [WIDE_CONTEXT.DB_MAINTENANCE.KEY_TABLENAME]: "archive",
          [WIDE_CONTEXT.DURATION]: 2.0,
          error,
        }),
      );
    });

    test("logs error with custom error object", () => {
      const errorSpy = vi
        .spyOn(logger, "error")
        .mockImplementation(() => undefined);
      const customError = { code: "DB_ERROR", message: "Query failed" };

      MaintenanceLogger.instance().logError("users", 0.8, customError);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "MaintenanceLogger.logError",
          [WIDE_CONTEXT.OUTCOME.KEY]: WIDE_CONTEXT.OUTCOME.VALUE_ERROR,
          [WIDE_CONTEXT.DB_MAINTENANCE.KEY_CLEANUP]: true,
          [WIDE_CONTEXT.DB_MAINTENANCE.KEY_TABLENAME]: "users",
          [WIDE_CONTEXT.DURATION]: 0.8,
          error: customError,
        }),
      );
    });
  });
});
