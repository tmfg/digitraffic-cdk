import { logger } from "@digitraffic/common/dist/aws/runtime/dt-logger-default";
import type { CognitoUserSession } from "amazon-cognito-identity-js";
import type {
  APIGatewayAuthorizerResult,
  APIGatewayRequestAuthorizerEvent,
  APIGatewayRequestAuthorizerEventHeaders,
  AuthResponse,
  PolicyDocument,
  Statement,
  StatementEffect,
} from "aws-lambda";
import { loginUser } from "./cognito_backend.js";

const EFFECT_ALLOW = "Allow";
const EFFECT_DENY = "Deny";

const KEY_COGNITO_GROUPS = "cognito:groups";

export const handler = async (
  event: APIGatewayRequestAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
  const result = parseAuthentication(event.headers);
  const group = getGroupFromPath(event.path);
  if (!result) {
    throw new Error("Unauthorized");
  } else {
    const policy = await generatePolicy(
      group,
      result[0],
      result[1],
      event.methodArn,
    );

    logger.debug(policy);

    return policy;
  }
};

function parseAuthentication(
  // eslint-disable-next-line @rushstack/no-new-null
  headers: APIGatewayRequestAuthorizerEventHeaders | null,
): [string, string] | undefined {
  // biome-ignore lint/complexity/useLiteralKeys: Indexed access
  if (!headers?.["authorization"]) {
    return undefined;
  } else {
    // biome-ignore lint/complexity/useLiteralKeys: Indexed access
    const encodedCreds = headers["authorization"].split(" ")[1];
    if (!encodedCreds) {
      return undefined;
    }
    const plainCreds = Buffer.from(encodedCreds, "base64")
      .toString()
      .split(":");

    if (plainCreds.length !== 2 || !plainCreds[0] || !plainCreds[1]) {
      return undefined;
    }
    return [plainCreds[0], plainCreds[1]];
  }
}

function getGroupFromPath(path: string): string {
  const group = path.split("/")[2]; // images/[group]/[image]
  if (!group) {
    if (!group) throw new Error(`Invalid path, group not found: ${path}`);
  }
  return group;
}

async function generatePolicy(
  group: string,
  username: string,
  password: string,
  methodArn: string,
): Promise<AuthResponse> {
  const user = await loginUser(username, password);
  const effect = checkAuthorization(user, group);

  const statementOne: Statement = {
    Action: "execute-api:Invoke",
    Effect: effect,
    Resource: methodArn,
  };

  const policyDocument: PolicyDocument = {
    Version: "2012-10-17",
    Statement: [statementOne],
  };

  const context = {
    groups: JSON.stringify(
      user ? user.getAccessToken().payload[KEY_COGNITO_GROUPS] : [],
    ),
  };

  return {
    principalId: "user",
    policyDocument,
    context,
  } as AuthResponse;
}

function checkAuthorization(
  user: CognitoUserSession | undefined,
  group: string,
): StatementEffect {
  if (user) {
    const userGroups = user.getAccessToken().payload[KEY_COGNITO_GROUPS] as
      | string[]
      | null;

    if (group === "metadata" || userGroups?.includes(group)) {
      return EFFECT_ALLOW;
    }
  }

  return EFFECT_DENY;
}
