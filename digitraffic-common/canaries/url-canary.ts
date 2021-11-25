import {Construct} from "@aws-cdk/core";
import {CanaryParameters} from "./canary-parameters";
import {Role} from "@aws-cdk/aws-iam";
import {LambdaEnvironment} from "../model/lambda-environment";
import {DigitrafficCanary} from "./canary";
import {DigitrafficStack} from "../stack/stack";
import {DigitrafficRestApi} from "../api/rest_apis";

export interface UrlCanaryParameters extends CanaryParameters {
    readonly hostname: string;
    readonly apiKeyId?: string;
}

export class UrlCanary extends DigitrafficCanary {
    constructor(stack: Construct, role: Role, params: UrlCanaryParameters) {
        const canaryName = `${params.name}-url`;
        const environmentVariables: LambdaEnvironment = {};
        environmentVariables.hostname = params.hostname;

        if(params.apiKeyId) {
            environmentVariables.apiKeyId = params.apiKeyId;
        }

        // the handler code is defined at the actual project using this
        super(stack, canaryName, role, params, environmentVariables);
    }

    static create(stack: DigitrafficStack, role: Role, publicApi: DigitrafficRestApi, params: Partial<UrlCanaryParameters>): UrlCanary {
        const defaultParameters: any = {
            handler: `${params.name}.handler`,
            hostname: publicApi.hostname(),
            apiKeyId: this.getApiKey(publicApi),
        };

        return new UrlCanary(stack, role, {...defaultParameters, ...params});
    }

    static getApiKey(publicApi: DigitrafficRestApi): string | undefined {
        // always use first api key
        return publicApi.apiKeyIds.length > 0 ? publicApi.apiKeyIds[0] : undefined;
    }
}
