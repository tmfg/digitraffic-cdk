import {Construct, Duration} from "@aws-cdk/core";
import {AssetCode, Canary, Runtime, Schedule, Test} from "@aws-cdk/aws-synthetics";
import {Alarm, ComparisonOperator} from "@aws-cdk/aws-cloudwatch";
import {CanaryParameters} from "./canary-parameters";
import {Role} from "@aws-cdk/aws-iam";

export interface TestParams extends CanaryParameters {
    readonly hostname: string;
    readonly handler?: string;
    readonly apikey?: string;
}

export class UrlTestCanary extends Construct {
    constructor(scope: Construct, role: Role, params: TestParams) {
        super(scope, params.name);

        const canaryName = `${params.name}-url`;
        const environmentVariables = {} as any;
        environmentVariables.hostname = params.hostname;

        if(params.apikey) {
            environmentVariables["apikey"] = params.apikey;
        }

        const canary = new Canary(scope, canaryName, {
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
            new Alarm(scope, `${params.name}-alarm`, {
                //alarmDescription: 'Monitor portactivity public apis',
                metric: canary.metricSuccessPercent(),
                evaluationPeriods: 2,
                threshold: 90,
                comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
            });
        }

        return canary;
    }
}