import { logger } from "@digitraffic/common/dist/aws/runtime/logging/dt-logger-default";
import { MaintenanceLogger } from "@digitraffic/common/dist/aws/runtime/logging/maintenance-logger";
import { StopWatch } from "@digitraffic/common/dist/utils/stop-watch";
import type { Connection } from "mysql2/promise";
import { deleteOldMessages } from "../../dao/stop_monitoring_message.js";
import { deleteOldValues } from "../../dao/udot.js";
import { inTransaction } from "../../util/database.js";

export const handler = async (): Promise<void> => {
  const maintenanceLogger = MaintenanceLogger.instance();
  const sw = StopWatch.createStarted("udot");

  try {
    await inTransaction(async (conn: Connection): Promise<void> => {
      const udotResult = await deleteOldValues(conn);
      const durationSeconds = sw.getDuration("udot") / 1000;

      maintenanceLogger.logCleanup(
        "rami_udot",
        udotResult.udotCount,
        -1,
        durationSeconds,
      );
      maintenanceLogger.logCleanup(
        "rami_udot_history",
        udotResult.historyCount,
        -1,
        durationSeconds,
      );

      sw.start("stop_monitoring_message");
      const messageCount = await deleteOldMessages(conn);
      maintenanceLogger.logCleanup(
        "rami_stop_monitoring_message",
        messageCount,
        50000,
        sw.getDuration("stop_monitoring_message") / 1000,
      );
    });
  } catch (error) {
    maintenanceLogger.logError(
      "rami_cleanup",
      sw.getDuration("udot") / 1000,
      error,
    );
    logger.error({
      method: "DeleteOldDataLambda.handler",
      error,
    });
    throw error;
  }
};
