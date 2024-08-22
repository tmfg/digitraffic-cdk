import { Role } from "aws-cdk-lib/aws-iam";
import type { ISecret } from "aws-cdk-lib/aws-secretsmanager";
import { CfnCanary } from "aws-cdk-lib/aws-synthetics";
import type { LambdaEnvironment } from "../stack/lambda-configs.js";
import { DigitrafficRestApi } from "../stack/rest_apis.js";
import { DigitrafficStack } from "../stack/stack.js";
import { DigitrafficCanary } from "./canary.js";
import { ENV_API_KEY, ENV_HOSTNAME, ENV_SECRET } from "./canary-keys.js";
import type { CanaryParameters } from "./canary-parameters.js";

export interface UrlCanaryParameters extends CanaryParameters {
    readonly hostname: string;
    readonly apiKeyId: string;
    readonly inVpc?: boolean;
}

export class UrlCanary extends DigitrafficCanary {
    constructor(stack: DigitrafficStack, role: Role, params: UrlCanaryParameters, secret?: ISecret) {
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
        super(stack, canaryName, role, params, environmentVariables);

        if (params.inVpc && this.node.defaultChild instanceof CfnCanary) {
            const subnetIds =
                stack.vpc === undefined ? [] : stack.vpc.privateSubnets.map((subnet) => subnet.subnetId);

            const securityGroupIds = stack.lambdaDbSg === undefined ? [] : [stack.lambdaDbSg.securityGroupId];

            this.node.defaultChild.vpcConfig = {
                vpcId: stack.vpc?.vpcId,
                securityGroupIds,
                subnetIds,
            };
        }
    }

    static create(
        stack: DigitrafficStack,
        role: Role,
        publicApi: DigitrafficRestApi,
        params: Partial<UrlCanaryParameters>,
        secret?: ISecret,
    ): UrlCanary {
        return new UrlCanary(
            stack,
            role,
            {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                handler: `${params.name!}.handler`,
                hostname: publicApi.hostname(),
                apiKeyId: this.getApiKey(publicApi),
                ...params,
            } as UrlCanaryParameters,
            secret,
        );
    }

    static getApiKey(publicApi: DigitrafficRestApi): string | undefined {
        const apiKeys = publicApi.apiKeyIds;

        if (apiKeys.length > 1) {
            console.info("rest api has more than one api key");
        }

        if (apiKeys.length === 0) {
            console.info("rest api has no api keys");
            return undefined;
        }

        // always use first api key
        return publicApi.apiKeyIds[0];
    }
}
