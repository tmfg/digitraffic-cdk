import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import type { DigitrafficStack } from "./stack.js";
import type { Stack } from "aws-cdk-lib";

export interface CreateLambdaLogGroupParams {
  functionName: string;
  retention?: RetentionDays;
}

export interface CreateLambdaLogGroupParamsForStack
  extends CreateLambdaLogGroupParams {
  stack: Stack;
  shortName: string;
}

export interface CreateLambdaLogGroupParamsForDigitrafficStack
  extends CreateLambdaLogGroupParams {
  stack: DigitrafficStack;
}

function isCreateLambdaLogGroupParamsForDigitrafficStack(
  params:
    | CreateLambdaLogGroupParamsForStack
    | CreateLambdaLogGroupParamsForDigitrafficStack,
): params is CreateLambdaLogGroupParamsForDigitrafficStack {
  return !!("configuration" in params.stack &&
    params.stack?.configuration?.shortName);
}

export function createLambdaLogGroup(
  params:
    | CreateLambdaLogGroupParamsForStack
    | CreateLambdaLogGroupParamsForDigitrafficStack,
): LogGroup {
  const _createLambdaLogGroup = (
    stack: Stack,
    functionName: string,
    shortName: string,
    retention: RetentionDays,
  ): LogGroup => {
    return new LogGroup(stack, `${functionName}-LogGroup`, {
      logGroupName: `/${shortName}/lambda/${functionName}`,
      retention,
    });
  };

  const getShortName = (
    params:
      | CreateLambdaLogGroupParamsForStack
      | CreateLambdaLogGroupParamsForDigitrafficStack,
  ): string => {
    if (isCreateLambdaLogGroupParamsForDigitrafficStack(params)) {
      return params.stack.configuration.shortName;
    } else {
      return params.shortName;
    }
  };

  const { functionName, retention = RetentionDays.ONE_YEAR } = params;
  const shortName = getShortName(params);

  return _createLambdaLogGroup(
    params.stack,
    functionName,
    shortName,
    retention,
  );
}
