import {Construct} from "@aws-cdk/core";
import {CanaryParameters} from "./canary-parameters";
import {Role} from "@aws-cdk/aws-iam";
import {LambdaEnvironment} from "../model/lambda-environment";
import {CanaryAlarm} from "./canary-alarm";
import {createCanary} from "./canary";

export interface TestParams extends CanaryParameters {
    readonly hostname: string;
    readonly apikey?: string;
}

export class UrlTestCanary extends Construct {
    constructor(stack: Construct, role: Role, params: TestParams) {
        super(stack, params.name);

        const canaryName = `${params.name}-url`;
        const environmentVariables: LambdaEnvironment = {};
        environmentVariables.hostname = params.hostname;

        if(params.apikey) {
            environmentVariables.apikey = params.apikey;
        }

        // the handler code is defined at the actual project using this
        const canary = createCanary(stack, canaryName, params.handler, role, environmentVariables, params.schedule);

        canary.artifactsBucket.grantWrite(role);

        if(params.alarm ?? true) {
            new CanaryAlarm(stack, canary, params);
        }

        return canary;
    }
}