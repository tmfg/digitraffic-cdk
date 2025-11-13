import type { CfnWebACL } from "aws-cdk-lib/aws-wafv2";
import { RemovalPolicy, type Stack } from "aws-cdk-lib";
import { AclBuilder } from "@digitraffic/common/dist/aws/infra/acl-builder";
import type { WafRules } from "./waf-rules.js";
import { LogGroup } from "aws-cdk-lib/aws-logs";

export function createWebAcl(
  stack: Stack,
  environment: string,
  rulesCollection: WafRules[],
  distributionName: string,
  logGroupName?: string,
): CfnWebACL {
  const aclBuilder = new AclBuilder(stack, `WebACL-${distributionName}`);

  for (const rules of rulesCollection) {
    if (rules.isCountOnly) {
      aclBuilder
        .withCountDigitrafficUserIp(rules.perIpWithHeader)
        .withCountDigitrafficUserIpAndUriPath(rules.perIpAndQueryWithHeader)
        .withCountAnonymousUserIp(rules.perIpWithoutHeader)
        .withCountAnonymousUserIpAndUriPath(rules.perIpAndQueryWithoutHeader);
    } else {
      aclBuilder
        .withAWSManagedRules(rules.awsCommonRuleSets, rules.excludedRules)
        .withThrottleDigitrafficUserIp(rules.perIpWithHeader)
        .withThrottleDigitrafficUserIpAndUriPath(rules.perIpAndQueryWithHeader)
        .withThrottleAnonymousUserIp(rules.perIpWithoutHeader)
        .withThrottleAnonymousUserIpAndUriPath(
          rules.perIpAndQueryWithoutHeader,
        )
        .withThrottleAnonymousUserIpByUriPath(
          rules.perIpAndQueryWithoutHeaderByPath?.limit,
          rules.perIpAndQueryWithoutHeaderByPath?.path,
        );
    }
  }

  const acl = aclBuilder.build();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const logGroup = new LogGroup(stack, `AclLogGroup-${environment}`, {
    // group name must begin with aws-waf-logs!!!!
    logGroupName: `aws-waf-logs-${
      logGroupName ?? distributionName
    }-${environment}`,
    removalPolicy: RemovalPolicy.RETAIN,
  });

  // logGroup.logGroupArn is not in the right format for this, so have to construct the arn manually
  /*    new CfnLoggingConfiguration(stack, `AclLogConfig-${environment}`, {
        logDestinationConfigs: [stack.formatArn({
            arnFormat: ArnFormat.COLON_RESOURCE_NAME,
            service: "logs",
            resource: "log-group",
            resourceName: logGroup.logGroupName
          })],
        resourceArn: acl.attrArn,
    });*/

  return acl;
}
