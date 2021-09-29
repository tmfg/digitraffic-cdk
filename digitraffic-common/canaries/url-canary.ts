import {Construct} from "@aws-cdk/core";
import {CanaryParameters} from "./canary-parameters";
import {Role} from "@aws-cdk/aws-iam";
import {LambdaEnvironment} from "../model/lambda-environment";
import {CanaryAlarm} from "./canary-alarm";
import {createCanary, DigitrafficCanary} from "./canary";

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
}
