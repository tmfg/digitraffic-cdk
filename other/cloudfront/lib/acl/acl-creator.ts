import { CfnWebACL } from "aws-cdk-lib/aws-wafv2";
import { IResolvable, RemovalPolicy, Stack } from "aws-cdk-lib";
import { AclBuilder } from "@digitraffic/common/dist/aws/infra/acl-builder.mjs";
import { WafRules } from "./waf-rules";
import { LogGroup } from "aws-cdk-lib/aws-logs";

type ResponseKey = "IP_WITH_HEADER" | "IPQUERY_WITH_HEADER" | "IP_WITHOUT_HEADER" | "IPQUERY_WITHOUT_HEADER";

const CUSTOM_KEYS_IP_AND_QUERY: CfnWebACL.RateBasedStatementCustomKeyProperty[] = [
    {
        uriPath: {
            textTransformations: [
                {
                    priority: 1,
                    type: "LOWERCASE"
                },
                {
                    priority: 2,
                    type: "NORMALIZE_PATH"
                },
                {
                    priority: 3,
                    type: "MD5"
                }
            ]
        }
    },
    {
        ip: {}
    }
];

function createRuleAction(
    customResponseBodyKey: ResponseKey,
    block: boolean = true
): CfnWebACL.RuleActionProperty {
    return block
        ? {
              block: {
                  customResponse: {
                      responseCode: 429,
                      customResponseBodyKey
                  }
              }
          }
        : {
              count: {}
          };
}

interface RuleProperty {
    action?: CfnWebACL.RuleActionProperty;
    statement: CfnWebACL.StatementProperty;
}

function createRuleProperty(
    name: string,
    priority: number,
    rule: RuleProperty,
    overrideAction: boolean = true
): CfnWebACL.RuleProperty {
    return {
        ...{
            name,
            priority,
            visibilityConfig: {
                sampledRequestsEnabled: true,
                cloudWatchMetricsEnabled: true,
                metricName: name
            }
        },
        ...rule,
        ...(overrideAction ? { overrideAction: { none: {} } } : {})
    };
}

export function createWebAcl(stack: Stack, environment: string, rules: WafRules): CfnWebACL {
    const aclBuilder = new AclBuilder(stack)

    aclBuilder.withAWSManagedRules(rules.awsCommonRules)
      .withThrottleDigitrafficUserIp(rules.perIpWithHeader)
      .withThrottleDigitrafficUserIpAndUriPath(rules.perIpAndQueryWithHeader)
      .withThrottleAnonymousUserIp(rules.perIpWithoutHeader)
      .withThrottleAnonymousUserIpAndUriPath(rules.perIpAndQueryWithoutHeader)

    const acl = aclBuilder.build();

    const logGroup = new LogGroup(stack, `AclLogGroup-${environment}`, {
        // group name must begin with aws-waf-logs!!!!
        logGroupName: `aws-waf-logs-${environment}`,
        removalPolicy: RemovalPolicy.RETAIN
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

function createRuleAWSCommonRuleSet(): CfnWebACL.RuleProperty {
    return createRuleProperty("AWS-AWSManagedRulesCommonRuleSet", 70, {
        statement: {
            managedRuleGroupStatement: {
                vendorName: "AWS",
                name: "AWSManagedRulesCommonRuleSet",
                excludedRules: [
                    { name: "NoUserAgent_HEADER" },
                    { name: "SizeRestrictions_BODY" },
                    { name: "GenericRFI_BODY" }
                ]
            }
        }
    });
}

function createAWSReputationList(): CfnWebACL.RuleProperty {
    return createRuleProperty("AWS-AWSManagedRulesAmazonIpReputationList", 80, {
        statement: {
            managedRuleGroupStatement: {
                vendorName: "AWS",
                name: "AWSManagedRulesAmazonIpReputationList"
            }
        }
    });
}

function createAWSKnownBadInput(): CfnWebACL.RuleProperty {
    return createRuleProperty("AWS-AWSManagedRulesKnownBadInputsRuleSet", 90, {
        statement: {
            managedRuleGroupStatement: {
                vendorName: "AWS",
                name: "AWSManagedRulesKnownBadInputsRuleSet"
            }
        }
    });
}

function createAWSAntiSQLInjection(): CfnWebACL.RuleProperty {
    return createRuleProperty("AWS-AWSManagedRulesSQLiRuleSet", 100, {
        statement: {
            managedRuleGroupStatement: {
                vendorName: "AWS",
                name: "AWSManagedRulesSQLiRuleSet"
            }
        }
    });
}

function createThrottleStatement(
    limit: number,
    headerMustBePresent: boolean,
    aggregateKey: boolean
): CfnWebACL.StatementProperty {
    // this statement matches empty digitraffic-user -header
    const matchStatement: CfnWebACL.StatementProperty = {
        sizeConstraintStatement: {
            comparisonOperator: headerMustBePresent ? "GT" : "GE",
            fieldToMatch: {
                singleHeader: {
                    Name: "digitraffic-user"
                }
            },
            textTransformations: [{ priority: 0, type: "NONE" }],
            size: 0
        } as CfnWebACL.SizeConstraintStatementProperty
    };

    // header present       -> size > 0
    // header not present   -> NOT(size >= 0)

    if (aggregateKey) {
        return {
            rateBasedStatement: {
                aggregateKeyType: "CUSTOM_KEYS",
                customKeys: CUSTOM_KEYS_IP_AND_QUERY,
                limit: limit,
                scopeDownStatement: headerMustBePresent ? matchStatement : notStatement(matchStatement)
            }
        };
    }

    return {
        rateBasedStatement: {
            aggregateKeyType: "IP",
            limit: limit,
            scopeDownStatement: headerMustBePresent ? matchStatement : notStatement(matchStatement)
        }
    };
}

function notStatement(statement: CfnWebACL.StatementProperty): CfnWebACL.StatementProperty {
    return {
        notStatement: {
            statement
        }
    };
}
