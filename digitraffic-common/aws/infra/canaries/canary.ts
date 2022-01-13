import {Duration} from "aws-cdk-lib";
import {AssetCode, Canary, Runtime, Schedule, Test} from "@aws-cdk/aws-synthetics-alpha";
import {Role} from "aws-cdk-lib/aws-iam";
import {CanaryAlarm} from "./canary-alarm";
import {CanaryParameters} from "./canary-parameters";
import {Construct} from "constructs";
import {LambdaEnvironment} from "../stack/lambda-configs";

export class DigitrafficCanary extends Canary {
    constructor(
        scope: Construct,
        canaryName: string,
        role: Role,
        params: CanaryParameters,
        environmentVariables: LambdaEnvironment,
    ) {
        super(scope, canaryName, {
            runtime: Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_3,
            role,
            test: Test.custom({
                code: new AssetCode("dist", {
                    exclude: ["lambda"],
                }),
                handler: params.handler,
            }),
            environmentVariables,
            canaryName,
            schedule: params.schedule ?? Schedule.rate(Duration.minutes(15)),
        });

        this.artifactsBucket.grantWrite(role);

        if (params.alarm ?? true) {
            new CanaryAlarm(scope, this, params);
        }
    }
}
