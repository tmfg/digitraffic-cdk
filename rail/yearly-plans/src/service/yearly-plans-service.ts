import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { logException } from "@digitraffic/common/dist/utils/logging";
import ky from "ky";

export async function fetchData<T>(url: string, apiKey: string): Promise<T> {
  const start = Date.now();

  logger.info({
    method: "YearlyPlansService.fetchData",
    message: `Fetching from ${url}`,
  });

  try {
    const response = await ky.get(url, {
      timeout: 30000,
      headers: {
        "API-Key": apiKey,
      },
    });
    return await response.json<T>();
  } catch (error) {
    logException(logger, error);
    throw new Error("Failed to fetch data from source system");
  } finally {
    logger.info({
      method: "YearlyPlansService.fetchData",
      tookMs: Date.now() - start,
    });
  }
}
