import {CfnWebACL} from '@aws-cdk/aws-wafv2';
import {Stack} from '@aws-cdk/core';

export enum AclRuleType {
    AWSCommonRuleSet, AWSReputationList, AWSKnownBadInputs, ThrottleWithDigitrafficUser, ThrottleWithoutDigitrafficUser
}

const BLOCK_429_ACTION : CfnWebACL.RuleActionProperty = {
    block: {
        customResponse: {
            responseCode: 429
        }
    }
};

function createRuleProperty(name: string, priority: number, rule: any, overrideAction:boolean = true): CfnWebACL.RuleProperty {
    return {...{
        name: name,
        priority: priority,
        visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: name
        }
    }, ...rule, ...(overrideAction ? {overrideAction: {none: {}}} : {})};
}

export function createWebAcl(stack: Stack, environment: string, rules: AclRuleType[]): CfnWebACL {
    const generatedRules = rules.map(createRule);

    return new CfnWebACL(stack, `DefaultWebAcl-${environment}`, {
        defaultAction: {allow: {}},
        scope: 'CLOUDFRONT',
        visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "WAF-Blocked",
            sampledRequestsEnabled: false,
        },
        rules: generatedRules
    });
}

function createRule(rule: AclRuleType): CfnWebACL.RuleProperty {
    if(rule === AclRuleType.AWSCommonRuleSet) {
        return createRuleProperty("AWS-AWSManagedRulesCommonRuleSet", 70, {
            statement: {
                managedRuleGroupStatement: {
                    vendorName: "AWS",
                    name: "AWSManagedRulesCommonRuleSet",
                    excludedRules: [{name: 'NoUserAgent_HEADER'}, {name: 'SizeRestrictions_BODY'}, {name: 'GenericRFI_BODY'}]
                }
            }
        });
    } else if(rule === AclRuleType.AWSReputationList) {
        return createRuleProperty("AWS-AWSManagedRulesAmazonIpReputationList", 80, {
            statement: {
                managedRuleGroupStatement: {
                    vendorName: "AWS",
                    name: "AWSManagedRulesAmazonIpReputationList"
                }
            }
        });
    } else if(rule === AclRuleType.AWSKnownBadInputs) {
        return createRuleProperty("AWS-AWSManagedRulesKnownBadInputsRuleSet", 90, {
            statement: {
                managedRuleGroupStatement: {
                    vendorName: "AWS",
                    name: "AWSManagedRulesKnownBadInputsRuleSet"
                }
            }
        });
    } else if(rule === AclRuleType.ThrottleWithDigitrafficUser) {
        return createRuleProperty("ThrottleRuleWithDigitrafficUser", 1, {
            action: BLOCK_429_ACTION,
            statement: createThrottleStatement(1000, true),
        }, false);
    } else if(rule === AclRuleType.ThrottleWithoutDigitrafficUser) {
        return createRuleProperty("ThrottleRuleWithoutDigitrafficUser", 2, {
            action: BLOCK_429_ACTION,
            statement: createThrottleStatement(500, false)
        }, false);
    }


    throw new TypeError();
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

    const rateStatement: CfnWebACL.StatementProperty = {
            rateBasedStatement: {
                aggregateKeyType: 'IP',
                limit: limit,
                scopeDownStatement: headerMustBePresent ? matchStatement : notStatement(matchStatement)
            } as CfnWebACL.RateBasedStatementProperty
        };

    return rateStatement;
//    return andStatements(rateStatement, matchStatement);
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