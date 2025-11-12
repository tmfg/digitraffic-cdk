import ky from "ky";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";

export async function fetchData<T>(url: string, apiKey: string): Promise<T> {
  const start = Date.now();
  try {
    const response = await ky.get(url, {
      timeout: 30000,
      headers: {
        "API-Key": apiKey
      },
    });
    return await response.json<T>();

  } catch (error) {
    logException(logger, error);
    throw error;

  } finally {
    logger.info({
      method: "YearlyPlansService.fetchData",
      tookMs: Date.now() - start,
    });
  }
}
