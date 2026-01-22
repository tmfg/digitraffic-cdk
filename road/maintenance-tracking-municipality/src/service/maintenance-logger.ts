import type { LoggableType } from "@digitraffic/common/dist/aws/runtime/dt-logger";
import { DtLogger } from "@digitraffic/common/dist/aws/runtime/dt-logger";
import { logger as dtLogger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";

export interface MaintenanceLoggableType extends LoggableType {
  customSizeBytes?: number;
  customDomain?: string;
  customContract?: string;
  customStatus?: number;
}

export class DtLoggeri extends DtLogger {
  override info(message: MaintenanceLoggableType): void {
    dtLogger.info(message);
  }

  override warn(message: MaintenanceLoggableType): void {
    dtLogger.warn(message);
  }

  override error(message: MaintenanceLoggableType): void {
    dtLogger.error(message);
  }
}

const logger = new DtLoggeri();
export default logger;
