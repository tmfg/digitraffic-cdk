import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { v4 } from "uuid";
import type { Datex2UpdateObject } from "../../model/datex2-update-object.js";
import { Datex2UpdateObjectSchema } from "../../model/datex2-update-object.js";
import { updateDatex2 } from "../../service/datex2-update.js";

const proxyHolder = ProxyHolder.create();

const method = "UploadDatex2.handler" as const;

export const ERRORS = {
  MISSING_BODY: "Missing body",
  INVALID_PAYLOAD: "Invalid payload",
  EMPTY_PAYLOAD: "Empty payload",
} as const;

export const StatusCodes = {
  OK: {
    statusCode: 200,
  },

  INTERNAL_ERROR: {
    statusCode: 500,
  },

  BAD_REQUEST: {
    statusCode: 400,
  },
} as const;

// proxy lambda, do not return LambdaResponse
export const handler = async (
  event: APIGatewayProxyEvent,
): Promise<APIGatewayProxyResult> => {
  // eslint-disable-next-line dot-notation
  const body = event.body;
  const requestId = event.headers["X-Request-ID"];
  const start = Date.now();

  if (body) {
    const payload = parsePayload(body);

    if (!payload) {
      return {
        statusCode: 400,
        body: ERRORS.INVALID_PAYLOAD,
      };
    }

    try {
      await proxyHolder.setCredentials();

      await updateDatex2(payload, requestId ?? v4());

      logger.info({
        method,
        customDataIncomingMethod: "API",
        customDataIncomingCount: payload.datexIIVersions.length,
      });
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

    return {
      statusCode: 200,
      body: "OK",
    };
  }

  return {
    statusCode: 400,
    body: ERRORS.MISSING_BODY,
  };
};

function parsePayload(body: string): Datex2UpdateObject | undefined {
  try {
    const json = JSON.parse(body) as unknown;

    //    logger.debug("Parsed json " + JSON.stringify(json));

    const parsed = Datex2UpdateObjectSchema.safeParse(json);

    if (parsed.error) {
      logger.debug(`parse error from: ${body}`);
      logger.error({ method, error: parsed.error });

      return undefined;
    }

    if (!parsed.data || parsed.data.datexIIVersions.length === 0) {
      logger.error({ method, message: ERRORS.EMPTY_PAYLOAD });

      return undefined;
    }

    // check type and version?

    return parsed.data;
  } catch (_error) {
    logger.debug(`error from: ${body}`);
    logger.error({ method, message: ERRORS.INVALID_PAYLOAD });

    return undefined;
  }
}
