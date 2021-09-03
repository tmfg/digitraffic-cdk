import {Construct, Duration} from "@aws-cdk/core";
import {AssetCode, Canary, Runtime, Schedule, Test} from "@aws-cdk/aws-synthetics";
import {CanaryParameters} from "./canary-parameters";
import {Role} from "@aws-cdk/aws-iam";
import {LambdaEnvironment} from "../model/lambda-environment";
import {CanaryAlarm} from "./canary-alarm";

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
        const canary = new Canary(stack, canaryName, {
            runtime: Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_1,
            role,
            test: Test.custom({
                code: new AssetCode("dist"),
                handler: `${params.handler ?? 'url-test'}.handler`
            }),
            environmentVariables,
            canaryName,
            schedule: Schedule.rate(params.rate ?? Duration.minutes(15))
        });

        canary.artifactsBucket.grantWrite(role);

        if(params.alarm ?? true) {
            new CanaryAlarm(stack, canary, params);
        }

        return canary;
    }
}