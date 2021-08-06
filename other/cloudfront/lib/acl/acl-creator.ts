import {CfnWebACL} from '@aws-cdk/aws-wafv2';
import {Stack} from '@aws-cdk/core';
import {WafRules} from "./waf-rules";

const RESPONSEKEY_WITH_DIGITRAFFIC_USER = 'DT_429_KEY_WITH_HEADER';
const RESPONSEKEY_WITHOUT_DIGITRAFFIC_USER = 'DT_429_KEY_WITHOUT_HEADER';

const BLOCK_429_WITH_DIGITRAFFIC_ACTION : CfnWebACL.RuleActionProperty = {
    block: {
        customResponse: {
            responseCode: 429,
            customResponseBodyKey: RESPONSEKEY_WITH_DIGITRAFFIC_USER
        }
    }
};

const BLOCK_429_WITHOUT_DIGITRAFFIC_ACTION : CfnWebACL.RuleActionProperty = {
    block: {
        customResponse: {
            responseCode: 429,
            customResponseBodyKey: RESPONSEKEY_WITHOUT_DIGITRAFFIC_USER
        }
    }
};

function createRuleProperty(name: string, priority: number, rule: any, overrideAction = true): CfnWebACL.RuleProperty {
    return {...{
        name,
        priority,
        visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: name
        }
    }, ...rule, ...(overrideAction ? {overrideAction: {none: {}}} : {})};
}

function createCustomResponseBodies(rules: WafRules): any {
    const customResponseBodies: any = {};

    if(rules.withHeaderLimit) {
        customResponseBodies[RESPONSEKEY_WITH_DIGITRAFFIC_USER] = {
            content: `Request rate is limited to ${rules.withHeaderLimit} requests in a 5 minute window.`,
            contentType: 'TEXT_PLAIN'
        }
    }
    if(rules.withoutHeaderLimit) {
        customResponseBodies[RESPONSEKEY_WITHOUT_DIGITRAFFIC_USER] = {
            content: `Request rate is limited to ${rules.withoutHeaderLimit} requests in a 5 minute window.`,
            contentType: 'TEXT_PLAIN'
        }
    }

    return customResponseBodies;
}

export function createWebAcl(stack: Stack, environment: string, rules: WafRules): CfnWebACL {
    const generatedRules = createRules(rules);
    const customResponseBodies = createCustomResponseBodies(rules);

    return new CfnWebACL(stack, `DefaultWebAcl-${environment}`, {
        defaultAction: {allow: {}},
        scope: 'CLOUDFRONT',
        visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "WAF-Blocked",
            sampledRequestsEnabled: false,
        },
        rules: generatedRules,
        customResponseBodies
    });
}

function createRules(rules: WafRules): CfnWebACL.RuleProperty[] {
    const generatedRules: CfnWebACL.RuleProperty[] = [];

    if(rules.awsCommonRules) {
        generatedRules.push(createRuleAWSCommonRuleSet());
        generatedRules.push(createAWSReputationList());
        generatedRules.push(createAWSKnownBadInput());
    }

    if(rules.withHeaderLimit) {
        generatedRules.push(createRuleProperty("ThrottleRuleWithDigitrafficUser", 1, {
            action: BLOCK_429_WITH_DIGITRAFFIC_ACTION,
            statement: createThrottleStatement(rules.withHeaderLimit, true),
        }, false));
    }

    if(rules.withoutHeaderLimit) {
        generatedRules.push(createRuleProperty("ThrottleRuleWithoutDigitrafficUser", 2, {
            action: BLOCK_429_WITHOUT_DIGITRAFFIC_ACTION,
            statement: createThrottleStatement(rules.withoutHeaderLimit, false)
        }, false));
    }

    return generatedRules;
}

function createRuleAWSCommonRuleSet(): CfnWebACL.RuleProperty {
    return createRuleProperty("AWS-AWSManagedRulesCommonRuleSet", 70, {
        statement: {
            managedRuleGroupStatement: {
                vendorName: "AWS",
                name: "AWSManagedRulesCommonRuleSet",
                excludedRules: [{name: 'NoUserAgent_HEADER'}, {name: 'SizeRestrictions_BODY'}, {name: 'GenericRFI_BODY'}]
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

function createThrottleStatement(limit: number, headerMustBePresent: boolean): CfnWebACL.StatementProperty {
    // this statement matches empty digitraffic-user -header
    const matchStatement: CfnWebACL.StatementProperty = {
        sizeConstraintStatement: {
            comparisonOperator: headerMustBePresent ? 'GT' : 'GE',
            fieldToMatch: {
                singleHeader: {
                    Name: "digitraffic-user"
                }
            },
            textTransformations: [
                { priority: 0,
                    type: 'NONE' }
            ],
            size: 0
        } as CfnWebACL.SizeConstraintStatementProperty
    };

    // header present       -> size > 0
    // header not present   -> NOT(size >= 0)

    return {
        rateBasedStatement: {
            aggregateKeyType: 'IP',
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
    }
}

function andStatements(...statements: CfnWebACL.StatementProperty[]): CfnWebACL.StatementProperty {
    return {
      andStatement: {
          statements
      }
    };
}
