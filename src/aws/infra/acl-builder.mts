import { CfnIPSet, CfnWebACL } from "aws-cdk-lib/aws-wafv2";
import type { Construct } from "constructs";
import { logger } from "../runtime/dt-logger-default.mjs";

interface RuleProperty {
    action?: CfnWebACL.RuleActionProperty;
    statement: CfnWebACL.StatementProperty;
}

export type AWSManagedWafRule =
    | "CommonRuleSet"
    | "AmazonIpReputationList"
    | "KnownBadInputsRuleSet"
    | "SQLiRuleSet";

/**
 * Builder class for building CfnWebACL.
 *
 * Currently supports:
 * * Some AWS managed WAF rules
 * * IP blacklisting
 */
export class AclBuilder {
    readonly _construct: Construct;
    readonly _rules: CfnWebACL.RuleProperty[] = [];

    _scope: string = "CLOUDFRONT";
    _name: string = "WebACL";
    _customResponseBodies: Record<string, CfnWebACL.CustomResponseBodyProperty> = {};

    constructor(construct: Construct) {
        this._construct = construct;
    }

    isRuleDefined(rules: AWSManagedWafRule[] | "all", rule: AWSManagedWafRule) {
        return rules === "all" || rules.includes(rule);
    }

    withAWSManagedRules(rules: AWSManagedWafRule[] | "all" = "all"): AclBuilder {
        if (this.isRuleDefined(rules, "CommonRuleSet")) {
            this._rules.push(createAWSCommonRuleSet());
        }

        if (this.isRuleDefined(rules, "AmazonIpReputationList")) {
            this._rules.push(createAWSReputationList());
        }

        if (this.isRuleDefined(rules, "KnownBadInputsRuleSet")) {
            this._rules.push(createAWSKnownBadInput());
        }

        if (this.isRuleDefined(rules, "SQLiRuleSet")) {
            this._rules.push(createAWSAntiSQLInjection());
        }

        return this;
    }

    withIpRestrictionRule(addresses: string[]): AclBuilder {
        const blocklistIpSet = new CfnIPSet(this._construct, "BlocklistIpSet", {
            ipAddressVersion: "IPV4",
            scope: this._scope,
            addresses,
        });

        this._rules.push({
            name: "IpBlocklist",
            priority: 10,
            action: { block: {} },
            statement: {
                ipSetReferenceStatement: {
                    arn: blocklistIpSet.attrArn,
                },
            },
            visibilityConfig: {
                sampledRequestsEnabled: false,
                cloudWatchMetricsEnabled: true,
                metricName: "IpBlocklist",
            },
        });

        return this;
    }

    withThrottleRule(
        name: string,
        priority: number,
        limit: number,
        customResponseBodyKey: string,
        isHeaderRequired: boolean,
        isBasedOnIpAndUriPath: boolean
    ): AclBuilder {
        this._rules.push({
            name,
            priority,
            visibilityConfig: {
                sampledRequestsEnabled: true,
                cloudWatchMetricsEnabled: true,
                metricName: name,
            },
            action: {
                block: {
                    customResponse: {
                        responseCode: 429,
                        customResponseBodyKey,
                    },
                },
            },
            statement: createThrottleStatement(limit, isHeaderRequired, isBasedOnIpAndUriPath),
        });

        return this;
    }

    withCustomResponseBody(key: string, customResponseBody: CfnWebACL.CustomResponseBodyProperty) {
        if (key in this._customResponseBodies) {
            logger.warn({
                method: "acl-builder.withCustomResponseBody",
                message: `Overriding custom response body with key ${key}`,
            });
        }
        this._customResponseBodies[key] = customResponseBody;
        return this;
    }

    withThrottleDigitrafficUserIp(limit: number | null | undefined) {
        if (limit == null) {
            this._logMissingLimit("withThrottleDigitrafficUserIp");
            return this;
        }
        const customResponseBodyKey = `IP_THROTTLE_DIGITRAFFIC_USER_${limit}`;
        this._addThrottleResponseBody(customResponseBodyKey, limit);
        return this.withThrottleRule(
            "ThrottleRuleWithDigitrafficUser",
            1,
            limit,
            customResponseBodyKey,
            true,
            false
        );
    }

    withThrottleDigitrafficUserIpAndUriPath(limit: number | null | undefined) {
        if (limit == null) {
            this._logMissingLimit("withThrottleDigitrafficUserIpAndUriPath");
            return this;
        }
        const customResponseBodyKey = `IP_PATH_THROTTLE_DIGITRAFFIC_USER_${limit}`;
        this._addThrottleResponseBody(customResponseBodyKey, limit);
        return this.withThrottleRule(
            "ThrottleRuleIPQueryWithDigitrafficUser",
            2,
            limit,
            customResponseBodyKey,
            true,
            true
        );
    }

    withThrottleAnonymousUserIp(limit: number | null | undefined) {
        if (limit == null) {
            this._logMissingLimit("withThrottleAnonymousUserIp");
            return this;
        }
        const customResponseBodyKey = `IP_THROTTLE_ANONYMOUS_USER_${limit}`;
        this._addThrottleResponseBody(customResponseBodyKey, limit);
        return this.withThrottleRule(
            "ThrottleRuleWithAnonymousUser",
            3,
            limit,
            customResponseBodyKey,
            false,
            false
        );
    }

    withThrottleAnonymousUserIpAndUriPath(limit: number | null | undefined) {
        if (limit == null) {
            this._logMissingLimit("withThrottleAnonymousUserIpAndUriPath");
            return this;
        }
        const customResponseBodyKey = `IP_PATH_THROTTLE_ANONYMOUS_USER_${limit}`;
        this._addThrottleResponseBody(customResponseBodyKey, limit);
        return this.withThrottleRule(
            "ThrottleRuleIPQueryWithAnonymousUser",
            4,
            limit,
            customResponseBodyKey,
            false,
            true
        );
    }

    _isCustomResponseBodyKeySet(key: string) {
        return key in this._customResponseBodies;
    }

    _addThrottleResponseBody(customResponseBodyKey: string, limit: number) {
        if (!this._isCustomResponseBodyKeySet(customResponseBodyKey)) {
            this.withCustomResponseBody(customResponseBodyKey, {
                content: `Request rate is limited to ${limit} requests in a 5 minute window.`,
                contentType: "TEXT_PLAIN",
            });
        }
    }

    _logMissingLimit(method: string) {
        logger.warn({
            method: `acl-builder.${method}`,
            message: `'limit' was not defined. Not setting a throttle rule`,
        });
    }

    public build(): CfnWebACL {
        if (this._rules.length === 0) {
            throw new Error("No rules defined for WebACL");
        }

        const uniqueRuleNames = new Set(this._rules.map((rule) => rule.name));

        if (uniqueRuleNames.size != this._rules.length) {
            throw new Error(
                "Tried to create an Access Control List with multiple rules having the same name"
            );
        }

        const acl = new CfnWebACL(this._construct, this._name, {
            defaultAction: { allow: {} },
            scope: this._scope,
            visibilityConfig: {
                cloudWatchMetricsEnabled: true,
                metricName: "WAF-Blocked",
                sampledRequestsEnabled: false,
            },
            rules: this._rules,
            customResponseBodies: this._customResponseBodies,
        });

        return acl;
    }
}

const CUSTOM_KEYS_IP_AND_URI_PATH: CfnWebACL.RateBasedStatementCustomKeyProperty[] = [
    {
        uriPath: {
            textTransformations: [
                {
                    priority: 1,
                    type: "LOWERCASE",
                },
                {
                    priority: 2,
                    type: "NORMALIZE_PATH",
                },
                {
                    priority: 3,
                    type: "MD5",
                },
            ],
        },
    },
    {
        ip: {},
    },
];

function notStatement(statement: CfnWebACL.StatementProperty): CfnWebACL.StatementProperty {
    return {
        notStatement: {
            statement,
        },
    };
}
function createThrottleStatement(
    limit: number,
    isHeaderRequired: boolean,
    isBasedOnIpAndUriPath: boolean
): CfnWebACL.StatementProperty {
    // this statement matches empty digitraffic-user -header
    const matchStatement: CfnWebACL.StatementProperty = {
        sizeConstraintStatement: {
            comparisonOperator: isHeaderRequired ? "GT" : "GE",
            fieldToMatch: {
                singleHeader: {
                    Name: "digitraffic-user",
                },
            },
            textTransformations: [{ priority: 0, type: "NONE" }],
            size: 0,
        } as CfnWebACL.SizeConstraintStatementProperty,
    };

    // header present       -> size > 0
    // header not present   -> NOT(size >= 0)

    if (isBasedOnIpAndUriPath) {
        return {
            rateBasedStatement: {
                aggregateKeyType: "CUSTOM_KEYS",
                customKeys: CUSTOM_KEYS_IP_AND_URI_PATH,
                limit: limit,
                scopeDownStatement: isHeaderRequired ? matchStatement : notStatement(matchStatement),
            },
        };
    }

    return {
        rateBasedStatement: {
            aggregateKeyType: "IP",
            limit: limit,
            scopeDownStatement: isHeaderRequired ? matchStatement : notStatement(matchStatement),
        },
    };
}

function createAWSCommonRuleSet(): CfnWebACL.RuleProperty {
    return createRuleProperty("AWS-AWSManagedRulesCommonRuleSet", 70, {
        statement: {
            managedRuleGroupStatement: {
                vendorName: "AWS",
                name: "AWSManagedRulesCommonRuleSet",
                excludedRules: [
                    { name: "NoUserAgent_HEADER" },
                    { name: "SizeRestrictions_BODY" },
                    { name: "GenericRFI_BODY" },
                ],
            },
        },
    });
}

function createAWSReputationList(): CfnWebACL.RuleProperty {
    return createRuleProperty("AWS-AWSManagedRulesAmazonIpReputationList", 80, {
        statement: {
            managedRuleGroupStatement: {
                vendorName: "AWS",
                name: "AWSManagedRulesAmazonIpReputationList",
            },
        },
    });
}

function createAWSKnownBadInput(): CfnWebACL.RuleProperty {
    return createRuleProperty("AWS-AWSManagedRulesKnownBadInputsRuleSet", 90, {
        statement: {
            managedRuleGroupStatement: {
                vendorName: "AWS",
                name: "AWSManagedRulesKnownBadInputsRuleSet",
            },
        },
    });
}

function createAWSAntiSQLInjection(): CfnWebACL.RuleProperty {
    return createRuleProperty("AWS-AWSManagedRulesSQLiRuleSet", 100, {
        statement: {
            managedRuleGroupStatement: {
                vendorName: "AWS",
                name: "AWSManagedRulesSQLiRuleSet",
            },
        },
    });
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
                metricName: name,
            },
        },
        ...rule,
        ...(overrideAction ? { overrideAction: { none: {} } } : {}),
    };
}
