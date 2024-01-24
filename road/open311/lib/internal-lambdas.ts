import * as events from "aws-cdk-lib/aws-events";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Duration } from "aws-cdk-lib";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction"
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { createSubscription } from "@digitraffic/common/dist/aws/infra/stack/subscription";
import { Open311Props } from "./app-props";

type IntegrationEnv = {
    ENDPOINT_USER: string,
    ENDPOINT_PASS: string,
    ENDPOINT_URL: string,
}
// returns lambda names for log group subscriptions
export function create(vpc: ec2.IVpc, lambdaDbSg: ec2.ISecurityGroup, stack: DigitrafficStack, props: Open311Props): void {
    const integrationEnvVars: IntegrationEnv = {
        ENDPOINT_USER: stack.getSecret().secretValueFromJson("open311.integration.username").unsafeUnwrap(),
        ENDPOINT_PASS: stack.getSecret().secretValueFromJson("open311.integration.endpoint_pass").unsafeUnwrap(),
        ENDPOINT_URL: stack.getSecret().secretValueFromJson("open311.integration.endpoint_url").unsafeUnwrap(),
    }

    const updateServicesLambda = createUpdateServicesLambda(props, integrationEnvVars, stack);
    const updateStatesLambda = createUpdateStatesLambda(props, integrationEnvVars, stack);
    const updateSubjectsLambda = createUpdateSubjectsLambda(props, integrationEnvVars, stack);
    const updateSubSubjectsLambda = createUpdateSubSubjectsLambda(props, integrationEnvVars, stack);

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
    props: Open311Props,
    integrationEnvVars: IntegrationEnv,
    stack: DigitrafficStack
): lambda.Function {
    const updateServicesId = "UpdateServices";

    const updateServicesLambda = MonitoredDBFunction.create(stack, updateServicesId, integrationEnvVars);
    createSubscription(updateServicesLambda, updateServicesId, props.logsDestinationArn, stack);
    return updateServicesLambda;
}

function createUpdateStatesLambda(
    props: Open311Props,
    integrationEnvVars: IntegrationEnv,
    stack: DigitrafficStack
): lambda.Function {
    const updateStatesId = "UpdateStates";

    const updateStatesLambda = MonitoredDBFunction.create(stack, updateStatesId, integrationEnvVars);
    createSubscription(updateStatesLambda, updateStatesId, props.logsDestinationArn, stack);
    return updateStatesLambda;
}

function createUpdateSubjectsLambda(
    props: Open311Props,
    integrationEnvVars: IntegrationEnv,
    stack: DigitrafficStack
): lambda.Function {
    const updateSubjectsId = "Open311-UpdateSubjects";

    const updateSubjectsLambda = MonitoredDBFunction.create(stack, updateSubjectsId, integrationEnvVars);
    createSubscription(updateSubjectsLambda, updateSubjectsId, props.logsDestinationArn, stack);
    return updateSubjectsLambda;
}

function createUpdateSubSubjectsLambda(
    props: Open311Props,
    integrationEnvVars: IntegrationEnv,
    stack: DigitrafficStack
): lambda.Function {
    const updateSubSubjectsId = "Open311-UpdateSubSubjects";

    const updateSubSubjectsLambda = MonitoredDBFunction.create(stack, updateSubSubjectsId, integrationEnvVars);
    createSubscription(updateSubSubjectsLambda, updateSubSubjectsId, props.logsDestinationArn, stack);
    return updateSubSubjectsLambda;
}
