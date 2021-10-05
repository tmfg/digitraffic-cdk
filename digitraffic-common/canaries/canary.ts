import {Construct, Duration} from "@aws-cdk/core";
import {AssetCode, Canary, Runtime, Schedule, Test} from "@aws-cdk/aws-synthetics";
import {LambdaEnvironment} from "../model/lambda-environment";
import {ManagedPolicy, PolicyStatement, PolicyStatementProps, Role, ServicePrincipal} from "@aws-cdk/aws-iam";
import {CanaryAlarm} from "./canary-alarm";
import {CanaryParameters} from "./canary-parameters";

export class DigitrafficCanary extends Canary {
    constructor(scope: Construct, canaryName: string, role: Role, params: CanaryParameters, environmentVariables: LambdaEnvironment) {
        super(scope, canaryName, {
            runtime: Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_2,
            role,
            test: Test.custom({
                code: new AssetCode("dist", {
                    exclude: ["lambda"]
                }),
                handler: params.handler
            }),
            environmentVariables,
            canaryName,
            schedule: params.schedule ?? Schedule.rate(Duration.minutes(15))
        });

        this.artifactsBucket.grantWrite(role);

        if(params.alarm ?? true) {
            new CanaryAlarm(scope, this, params);
        }
    }
}
