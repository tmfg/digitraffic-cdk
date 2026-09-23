import type { CustomParams } from "../aws/runtime/dt-logger.js";
import { logger } from "../aws/runtime/dt-logger-default.js";

export interface LeadTimeLogging {
  readonly target: string;
  readonly leadTimeMs?: number;
  readonly processTimeMs?: number;

  readonly extraFields?: CustomParams;
}

export type LeadTimeType = "lead-time" | "process-time" | "mqtt-time";

export function logLeadTime(
  name: LeadTimeType,
  target: string,
  tookMs: number,
  extraFields?: CustomParams,
): void {
  const method = "LeadTimeLogging.logLeadTime";

  try {
    logger.info({
      ...(extraFields ?? {}),
      method,
      customLeadTime: true,
      customName: name,
      customTarget: target,
      tookMs,
    });
  } catch (error) {
    logger.error({
      method,
      message: "Error logging lead time",
      error,
    });
  }
}

function isSafe(value?: number): value is number {
  return Number.isSafeInteger(value);
}

export function logLeadTimes(ptl: LeadTimeLogging): void {
  if (isSafe(ptl.leadTimeMs)) {
    logLeadTime("lead-time", ptl.target, ptl.leadTimeMs, ptl.extraFields);
  }

  if (isSafe(ptl.processTimeMs)) {
    logLeadTime("process-time", ptl.target, ptl.processTimeMs, ptl.extraFields);
  }
}
