import {Construct, Duration} from "@aws-cdk/core";
import {AssetCode, Canary, Runtime, Schedule, Test} from "@aws-cdk/aws-synthetics";
import {CanaryParameters} from "./canary-parameters";
import {Role} from "@aws-cdk/aws-iam";

export interface TestParams extends CanaryParameters {
    readonly hostname: string;
}

export class UrlTestCanary extends Construct {
    constructor(scope: Construct, role: Role, params: TestParams) {
        super(scope, params.name);

        const canaryName = `${params.name}-url-canary`;
        const environmentVariables = {} as any;
        environmentVariables.hostname = params.hostname;

        const canary = new Canary(scope, canaryName, {
            runtime: Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_1,
            role,
            test: Test.custom({
                code: new AssetCode("dist"),
                handler: 'url-test-code.handler'
            }),
            environmentVariables,
            canaryName,
            schedule: Schedule.rate(params.rate ?? Duration.minutes(15))
        });

        canary.artifactsBucket.grantWrite(role);

        return canary;
    }
}