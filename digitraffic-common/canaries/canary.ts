import {Construct, Duration} from "@aws-cdk/core";
import {AssetCode, Canary, Runtime, Schedule, Test} from "@aws-cdk/aws-synthetics";
import {LambdaEnvironment} from "../model/lambda-environment";
import {Role} from "@aws-cdk/aws-iam";

export function createCanary(scope: Construct, canaryName: string, handler: string, role: Role, environmentVariables: LambdaEnvironment, schedule?: Schedule): Canary {
    return new Canary(scope, canaryName, {
        runtime: Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_2,
        role,
        test: Test.custom({
            code: new AssetCode("dist", {
                exclude: ["lambda"]
            }),
            handler,
        }),
        environmentVariables,
        canaryName,
        schedule: schedule ?? Schedule.rate(Duration.minutes(15))
    });
}
