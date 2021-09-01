import {Construct, Duration} from "@aws-cdk/core";
import {AssetCode, Canary, Runtime, Schedule, Test} from "@aws-cdk/aws-synthetics";

export interface TestParams {
    readonly name: string;
    readonly url: string;
    readonly rate?: Duration;
}

export class UrlTestCanary extends Construct {
    constructor(scope: Construct, params: TestParams) {
        super(scope, params.name);

        const canaryName = `${params.name}-url-canary`;
        const environmentVariables = {} as any;
        environmentVariables.url = params.url;

        return new Canary(scope, canaryName, {
            runtime: Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_1,
            test: Test.custom({
                code: new AssetCode("dist"),
                handler: 'url-test-code.handler'
            }),
            environmentVariables,
            canaryName,
            schedule: Schedule.rate(params.rate ?? Duration.minutes(15))
        });

    }
}