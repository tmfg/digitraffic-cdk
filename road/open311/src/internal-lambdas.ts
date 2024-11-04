import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import type { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { Duration } from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import type * as lambda from "aws-cdk-lib/aws-lambda";

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
type IntegrationEnv = {
    ENDPOINT_USER: string;
    ENDPOINT_PASS: string;
    ENDPOINT_URL: string;
};
// returns lambda names for log group subscriptions
export function create(stack: DigitrafficStack): void {
    const integrationEnvVars: IntegrationEnv = {
        ENDPOINT_USER: stack.getSecret().secretValueFromJson("open311.integration.username").unsafeUnwrap(),
        ENDPOINT_PASS: stack
            .getSecret()
            .secretValueFromJson("open311.integration.endpoint_pass")
            .unsafeUnwrap(),
        ENDPOINT_URL: stack.getSecret().secretValueFromJson("open311.integration.endpoint_url").unsafeUnwrap()
    };

    const updateServicesLambda = createUpdateServicesLambda(integrationEnvVars, stack);
    const updateStatesLambda = createUpdateStatesLambda(integrationEnvVars, stack);
    const updateSubjectsLambda = createUpdateSubjectsLambda(integrationEnvVars, stack);
    const updateSubSubjectsLambda = createUpdateSubSubjectsLambda(integrationEnvVars, stack);

    const updateMetaDataRuleId = "Open311-UpdateMetadataRule";
    const updateMetaDataRule = new events.Rule(stack, updateMetaDataRuleId, {
        ruleName: updateMetaDataRuleId,
        schedule: events.Schedule.rate(Duration.days(1))
    });
    updateMetaDataRule.addTarget(new LambdaFunction(updateServicesLambda));
    updateMetaDataRule.addTarget(new LambdaFunction(updateStatesLambda));
    updateMetaDataRule.addTarget(new LambdaFunction(updateSubjectsLambda));
    updateMetaDataRule.addTarget(new LambdaFunction(updateSubSubjectsLambda));
}

function createUpdateServicesLambda(
    integrationEnvVars: IntegrationEnv,
    stack: DigitrafficStack
): lambda.Function {
    const updateServicesId = "UpdateServices";

    const updateServicesLambda = MonitoredDBFunction.create(stack, updateServicesId, integrationEnvVars);
    return updateServicesLambda;
}

function createUpdateStatesLambda(
    integrationEnvVars: IntegrationEnv,
    stack: DigitrafficStack
): lambda.Function {
    const updateStatesId = "UpdateStates";

    const updateStatesLambda = MonitoredDBFunction.create(stack, updateStatesId, integrationEnvVars);
    return updateStatesLambda;
}

function createUpdateSubjectsLambda(
    integrationEnvVars: IntegrationEnv,
    stack: DigitrafficStack
): lambda.Function {
    const updateSubjectsId = "Open311-UpdateSubjects";

    const updateSubjectsLambda = MonitoredDBFunction.create(stack, updateSubjectsId, integrationEnvVars);
    return updateSubjectsLambda;
}

function createUpdateSubSubjectsLambda(
    integrationEnvVars: IntegrationEnv,
    stack: DigitrafficStack
): lambda.Function {
    const updateSubSubjectsId = "Open311-UpdateSubSubjects";

    const updateSubSubjectsLambda = MonitoredDBFunction.create(
        stack,
        updateSubSubjectsId,
        integrationEnvVars
    );
    return updateSubSubjectsLambda;
}
