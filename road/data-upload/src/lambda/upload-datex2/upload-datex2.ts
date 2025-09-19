import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { LambdaResponse } from "@digitraffic/common/dist/aws/types/lambda-response";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { updateDatex2 } from "../../service/datex2-update.js";
import {
  type Datex2UpdateObject,
  Datex2UpdateObjectSchema,
} from "../../model/datex2-update-object.js";

const proxyHolder = ProxyHolder.create();

const method = "UploadDatex2.handler" as const;

export const ERRORS = {
  MISSING_BODY: "Missing body",
  INVALID_PAYLOAD: "Invalid payload",
  EMPTY_PAYLOAD: "Empty payload",
} as const;

export const handler = async (
  event: Record<string, string>,
): Promise<LambdaResponse> => {
  // eslint-disable-next-line dot-notation
  const body = event["body"];
  const start = Date.now();

  if (body) {
    const payload = parsePayload(body);

    if (!payload) {
      return LambdaResponse.badRequest(ERRORS.INVALID_PAYLOAD);
    }

    try {
      await proxyHolder.setCredentials();

      await updateDatex2(payload);
    } catch (error) {
      logger.error({
        method,
        error,
      });
    } finally {
      logger.info({
        method,
        tookMs: Date.now() - start,
      });
    }

    return LambdaResponse.ok("");
  }

  return LambdaResponse.badRequest(ERRORS.MISSING_BODY);
};

function parsePayload(body: string): Datex2UpdateObject | undefined {
  try {
    const parsed = Datex2UpdateObjectSchema.safeParse(JSON.parse(body));

    if (parsed.error) {
      logger.error({ method, error: parsed.error });

      return undefined;
    }

    if (!parsed.data || parsed.data.datexIIVersions.length === 0) {
      logger.error({ method, message: ERRORS.EMPTY_PAYLOAD });

      return undefined;
    }

    // check type and version?

    return parsed.data;
  } catch (error) {
    logger.debug(body);
    logger.error({ method, message: ERRORS.INVALID_PAYLOAD });

    return undefined;
  }
}
