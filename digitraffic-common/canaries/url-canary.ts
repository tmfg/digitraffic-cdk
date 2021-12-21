import {Construct} from "constructs";
import {CanaryParameters} from "./canary-parameters";
import {Role} from "aws-cdk-lib/aws-iam";
import {LambdaEnvironment} from "../model/lambda-environment";
import {DigitrafficCanary} from "./canary";
import {DigitrafficStack} from "../stack/stack";
import {DigitrafficRestApi} from "../api/rest_apis";
import {ISecret} from "aws-cdk-lib/aws-secretsmanager";

export const ENV_API_KEY = "apiKeyId";
export const ENV_HOSTNAME = "hostname";
export const ENV_SECRET = "secret";

export interface UrlCanaryParameters extends CanaryParameters {
    readonly hostname: string;
    readonly apiKeyId?: string;
}

export class UrlCanary extends DigitrafficCanary {
    constructor(stack: Construct,
        role: Role,
        params: UrlCanaryParameters,
        secret?: ISecret) {
        const canaryName = `${params.name}-url`;
        const environmentVariables: LambdaEnvironment = {};
        environmentVariables[ENV_HOSTNAME] = params.hostname;

        if (params.secret) {
            environmentVariables[ENV_SECRET] = params.secret;
        }

        if (params.apiKeyId) {
            environmentVariables[ENV_API_KEY] = params.apiKeyId;
        }

        if (secret) {
            secret.grantRead(role);
        }

        // the handler code is defined at the actual project using this
        super(
            stack, canaryName, role, params, environmentVariables,
        );
    }

    static create(stack: DigitrafficStack,
        role: Role,
        publicApi: DigitrafficRestApi,
        params: Partial<UrlCanaryParameters>): UrlCanary {
        return new UrlCanary(stack, role, {...{
            handler: `${params.name}.handler`,
            hostname: publicApi.hostname(),
            apiKeyId: this.getApiKey(publicApi),
        }, ...params} as UrlCanaryParameters);
    }

    static getApiKey(publicApi: DigitrafficRestApi): string | undefined {
        const apiKeys = publicApi.apiKeyIds;

        if (apiKeys.length > 1) {
            console.info("rest api has more than one api");
        }

        if (apiKeys.length === 0) {
            console.info("rest api has no api keys");
            return undefined;
        }

        // always use first api key
        return publicApi.apiKeyIds[0];
    }
}
