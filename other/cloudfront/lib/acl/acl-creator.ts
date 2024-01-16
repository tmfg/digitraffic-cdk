import { CfnLoggingConfiguration, CfnWebACL } from "aws-cdk-lib/aws-wafv2";
import { ArnFormat, IResolvable, RemovalPolicy, Stack } from "aws-cdk-lib";
import { WafRules } from "./waf-rules";
import { LogGroup } from "aws-cdk-lib/aws-logs";

type ResponseKey =
    | "WITH_DIGITRAFFIC_USER"
    | "IPQUERY_WITH_DIGITRAFFIC_USER"
    | "WITHOUT_DIGITRAFFIC_USER"
    | "IPQUERY_WITHOUT_DIGITRAFFIC_USER";

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

type CustomResponseBodies = Partial<Record<ResponseKey, CfnWebACL.CustomResponseBodyProperty | IResolvable>>;

function createCustomResponseBodies(rules: WafRules): CustomResponseBodies {
    const customResponseBodies: CustomResponseBodies = {};

    if (rules.withHeaderLimit) {
        customResponseBodies["WITH_DIGITRAFFIC_USER"] = {
            content: `Request rate is limited to ${rules.withHeaderLimit} requests in a 5 minute window.`,
            contentType: "TEXT_PLAIN"
        };
    }
    if (rules.withoutHeaderLimit) {
        customResponseBodies["WITHOUT_DIGITRAFFIC_USER"] = {
            content: `Request rate is limited to ${rules.withoutHeaderLimit} requests in a 5 minute window.`,
            contentType: "TEXT_PLAIN"
        };
    }
    if (rules.withHeaderIpQueryLimit) {
        customResponseBodies["IPQUERY_WITH_DIGITRAFFIC_USER"] = {
            content: `Request rate is limited to ${rules.withHeaderIpQueryLimit} requests in a 5 minute window.`,
            contentType: "TEXT_PLAIN"
        };
    }
    if (rules.withHeaderIpQueryLimit) {
        customResponseBodies["IPQUERY_WITHOUT_DIGITRAFFIC_USER"] = {
            content: `Request rate is limited to ${rules.withHeaderIpQueryLimit} requests in a 5 minute window.`,
            contentType: "TEXT_PLAIN"
        };
    }

    return customResponseBodies;
}

export function createWebAcl(stack: Stack, environment: string, rules: WafRules): CfnWebACL {
    const generatedRules = createRules(rules);
    const customResponseBodies = createCustomResponseBodies(rules);

    const acl = new CfnWebACL(stack, `DefaultWebAcl-${environment}`, {
        defaultAction: { allow: {} },
        scope: "CLOUDFRONT",
        visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "WAF-Blocked",
            sampledRequestsEnabled: false
        },
        rules: generatedRules,
        customResponseBodies
    });

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

function createRules(rules: WafRules): CfnWebACL.RuleProperty[] {
    const generatedRules: CfnWebACL.RuleProperty[] = [];

    if (rules.awsCommonRules) {
        generatedRules.push(createRuleAWSCommonRuleSet());
        generatedRules.push(createAWSReputationList());
        generatedRules.push(createAWSKnownBadInput());
        generatedRules.push(createAWSAntiSQLInjection());
        generatedRules.push();
    }

    if (rules.withHeaderLimit) {
        generatedRules.push(
            createRuleProperty(
                "ThrottleRuleWithDigitrafficUser",
                1,
                {
                    action: createRuleAction("WITH_DIGITRAFFIC_USER"),
                    statement: createThrottleStatement(rules.withHeaderLimit, true, false)
                },
                false
            )
        );
    }

    if (rules.withHeaderIpQueryLimit) {
        generatedRules.push(
            createRuleProperty(
                "ThrottleRuleIPQueryWithDigitrafficUser",
                2,
                {
                    action: createRuleAction("IPQUERY_WITH_DIGITRAFFIC_USER"),
                    statement: createThrottleStatement(rules.withHeaderIpQueryLimit, true, true)
                },
                false
            )
        );
    }

    if (rules.withoutHeaderLimit) {
        generatedRules.push(
            createRuleProperty(
                "ThrottleRuleWithoutDigitrafficUser",
                3,
                {
                    action: createRuleAction("WITHOUT_DIGITRAFFIC_USER"),
                    statement: createThrottleStatement(rules.withoutHeaderLimit, false, false)
                },
                false
            )
        );
    }

    if (rules.withoutHeaderIpQueryLimit) {
        generatedRules.push(
            createRuleProperty(
                "ThrottleRuleIPQueryWithoutDigitrafficUser",
                4,
                {
                    action: createRuleAction("IPQUERY_WITHOUT_DIGITRAFFIC_USER"),
                    statement: createThrottleStatement(rules.withoutHeaderIpQueryLimit, false, true)
                },
                false
            )
        );
    }

    return generatedRules;
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
