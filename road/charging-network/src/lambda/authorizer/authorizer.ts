import type {
    APIGatewayAuthorizerResult,
    AuthResponse,
    Callback,
    Context,
    PolicyDocument,
    Statement
} from "aws-lambda";
import type { APIGatewayRequestAuthorizerEvent, APIGatewayRequestAuthorizerEventHeaders } from "aws-lambda";
import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import { ProxyHolder } from "@digitraffic/common/dist/aws/runtime/secrets/proxy-holder";
import { inDatabaseReadonly } from "@digitraffic/common/dist/database/database";
import * as OcpiDao from "../../dao/ocpi-dao.js";
import type { DbOcpiCpo } from "../../model/dao-models.js";

const EFFECT_ALLOW = "Allow" as const;
const EFFECT_DENY = "Deny" as const;

const proxyHolder = ProxyHolder.create();
const method = `Authorizer.handler` as const;

// In future when released, APIGatewaySimpleAuthorizerWithContextResult could be used instead of APIGatewayAuthorizerResult

export const handler: (
    event: APIGatewayRequestAuthorizerEvent,
    context: Context,
    callback: Callback<APIGatewayAuthorizerResult>
) => Promise<void> = async function (
    event: APIGatewayRequestAuthorizerEvent,
    context: Context,
    callback: Callback<APIGatewayAuthorizerResult>
) {
    logger.debug({
        method,
        eventHeaders: event.headers
    });
    const tokenB = parseAuthentication(event.headers);
    logger.debug({ method, tokenB });

    const cpo = tokenB ? await proxyHolder.setCredentials().then(() => getCpoByTokenB(tokenB)) : undefined;

    logger.debug({ method, cpo });

    const policy = generatePolicy(event.methodArn, cpo);

    logger.debug({ method, policy });

    callback(null, policy);
};

// eslint-disable-next-line @rushstack/no-new-null
function parseAuthentication(headers: APIGatewayRequestAuthorizerEventHeaders | null): string | undefined {
    const header = headers ?? {};
    // eslint-disable-next-line dot-notation
    const authHeaderValue = header["authorization"] ? header["authorization"] : header["Authorization"];
    if (!authHeaderValue) {
        return undefined;
    }
    // Full header:
    // "Authorization: Token plaaplaplaa"
    // Content of headers?.authorization: Token plaaplaplaa
    // This returns only value of the token: "plaaplaplaa" or undefined
    return authHeaderValue.split(" ")[1];
}

function generatePolicy(methodArn: string, cpo: DbOcpiCpo | undefined): AuthResponse {
    const statementOne: Statement = {
        Action: "execute-api:Invoke",
        Effect: cpo ? EFFECT_ALLOW : EFFECT_DENY, // Allow if cpo is found
        Resource: methodArn
    };

    const policyDocument: PolicyDocument = {
        Version: "2012-10-17",
        Statement: [statementOne]
    };

    return {
        principalId: "cpo",
        policyDocument,
        context: {
            dtCpoId: JSON.stringify(cpo?.dt_cpo_id ? [cpo?.dt_cpo_id] : [])
        }
    } satisfies AuthResponse;
}

function getCpoByTokenB(tokenB: string): Promise<DbOcpiCpo | undefined> {
    return inDatabaseReadonly(async (db) => {
        return OcpiDao.findCpoByTokenB(db, tokenB);
    });
}
