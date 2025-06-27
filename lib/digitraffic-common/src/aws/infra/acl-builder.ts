import { CfnIPSet, CfnWebACL } from "aws-cdk-lib/aws-wafv2";
import type { Construct } from "constructs";
import { logger } from "../runtime/dt-logger-default.js";
import { concat, range, zipWith } from "lodash-es";

interface RuleProperty {
  action?: CfnWebACL.RuleActionProperty;
  statement: CfnWebACL.StatementProperty;
}

export type AWSManagedWafRule =
  | "CommonRuleSet"
  | "AmazonIpReputationList"
  | "KnownBadInputsRuleSet"
  | "SQLiRuleSet";

export type ExcludedAWSRules = {
  [key in AWSManagedWafRule]?: string[];
};

export type CfnWebAclRuleProperty = {
  [P in keyof CfnWebACL.RuleProperty as Exclude<P, "priority">]:
    CfnWebACL.RuleProperty[P];
};

/**
 * Builder class for building CfnWebACL.
 *
 * Currently supports:
 * * Some AWS managed WAF rules
 * * IP blacklisting/whitelisting
 */
export class AclBuilder {
  readonly _construct: Construct;
  readonly _countRules: CfnWebAclRuleProperty[] = [];
  readonly _blockRules: CfnWebAclRuleProperty[] = [];
  readonly _name: string = "WebACL";

  _scope: string = "CLOUDFRONT";
  _customResponseBodies: Record<string, CfnWebACL.CustomResponseBodyProperty> =
    {};

  constructor(construct: Construct, name: string = "WebACL") {
    this._construct = construct;
    this._name = name;
  }

  isRuleDefined(
    rules: AWSManagedWafRule[] | "all",
    rule: AWSManagedWafRule,
  ): boolean {
    return rules === "all" || rules.includes(rule);
  }

  withAWSManagedRules(
    rules: AWSManagedWafRule[] | "all" = "all",
    excludedRules: ExcludedAWSRules = {},
  ): this {
    if (this.isRuleDefined(rules, "CommonRuleSet")) {
      this._blockRules.push(
        createAWSCommonRuleSet(excludedRules?.CommonRuleSet),
      );
    }

    if (this.isRuleDefined(rules, "AmazonIpReputationList")) {
      this._blockRules.push(
        createAWSReputationList(excludedRules?.AmazonIpReputationList),
      );
    }

    if (this.isRuleDefined(rules, "KnownBadInputsRuleSet")) {
      this._blockRules.push(
        createAWSKnownBadInput(excludedRules?.KnownBadInputsRuleSet),
      );
    }

    if (this.isRuleDefined(rules, "SQLiRuleSet")) {
      this._blockRules.push(
        createAWSAntiSQLInjection(excludedRules?.SQLiRuleSet),
      );
    }

    return this;
  }

  /**
   * Block access from given addresses
   */
  withIpBlacklistRule(addresses: string[]): this {
    const blocklistIpSet = new CfnIPSet(this._construct, "BlocklistIpSet", {
      ipAddressVersion: "IPV4",
      scope: this._scope,
      addresses,
    });

    this._blockRules.push({
      name: "IpBlocklist",
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

  /**
   * Allow access only from the given addresses
   */
  withIpWhitelistRule(addresses: string[]): this {
    const blocklistIpSet = new CfnIPSet(this._construct, "AllowlistIpSet", {
      ipAddressVersion: "IPV4",
      scope: this._scope,
      addresses,
    });

    this._blockRules.push({
      name: "IpAllowlist",
      action: { block: {} },
      statement: {
        notStatement: {
          statement: {
            ipSetReferenceStatement: {
              arn: blocklistIpSet.attrArn,
            },
          },
        },
      },
      visibilityConfig: {
        sampledRequestsEnabled: false,
        cloudWatchMetricsEnabled: true,
        metricName: "IpAllowlist",
      },
    });

    return this;
  }

  withThrottleRule(
    name: string,
    limit: number,
    isHeaderRequired: boolean,
    isBasedOnIpAndUriPath: boolean,
    customResponseBodyKey?: string,
  ): this {
    const isBlockRule = !!customResponseBodyKey;
    const rules = isBlockRule ? this._blockRules : this._countRules;
    const action = isBlockRule
      ? {
        block: {
          customResponse: {
            responseCode: 429,
            customResponseBodyKey,
          },
        },
      }
      : {
        count: {},
      };
    rules.push({
      name,
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: name,
      },
      action,
      statement: createThrottleStatement(
        limit,
        isHeaderRequired,
        isBasedOnIpAndUriPath,
      ),
    });

    return this;
  }

  withCustomResponseBody(
    key: string,
    customResponseBody: CfnWebACL.CustomResponseBodyProperty,
  ): this {
    if (key in this._customResponseBodies) {
      logger.warn({
        method: "acl-builder.withCustomResponseBody",
        message:
          `Overriding custom response body with key ${key} for distribution ${this._name}`,
      });
    }
    this._customResponseBodies[key] = customResponseBody;
    return this;
  }

  withThrottleDigitrafficUserIp(limit: number | undefined): this {
    if (limit === undefined) {
      return this;
    }
    const customResponseBodyKey = `IP_THROTTLE_DIGITRAFFIC_USER_${limit}`;
    this._addThrottleResponseBody(customResponseBodyKey, limit);
    return this.withThrottleRule(
      "ThrottleRuleWithDigitrafficUser",
      limit,
      true,
      false,
      customResponseBodyKey,
    );
  }

  withThrottleDigitrafficUserIpAndUriPath(
    limit: number | undefined,
  ): this {
    if (limit === undefined) {
      return this;
    }
    const customResponseBodyKey = `IP_PATH_THROTTLE_DIGITRAFFIC_USER_${limit}`;
    this._addThrottleResponseBody(customResponseBodyKey, limit);
    return this.withThrottleRule(
      "ThrottleRuleIPQueryWithDigitrafficUser",
      limit,
      true,
      true,
      customResponseBodyKey,
    );
  }

  withThrottleAnonymousUserIp(limit: number | undefined): AclBuilder {
    if (limit === undefined) {
      return this;
    }
    const customResponseBodyKey = `IP_THROTTLE_ANONYMOUS_USER_${limit}`;
    this._addThrottleResponseBody(customResponseBodyKey, limit);
    return this.withThrottleRule(
      "ThrottleRuleWithAnonymousUser",
      limit,
      false,
      false,
      customResponseBodyKey,
    );
  }

  withThrottleAnonymousUserIpAndUriPath(limit: number | undefined): this {
    if (limit === undefined) {
      return this;
    }
    const customResponseBodyKey = `IP_PATH_THROTTLE_ANONYMOUS_USER_${limit}`;
    this._addThrottleResponseBody(customResponseBodyKey, limit);
    return this.withThrottleRule(
      "ThrottleRuleIPQueryWithAnonymousUser",
      limit,
      false,
      true,
      customResponseBodyKey,
    );
  }

  withCountDigitrafficUserIp(limit: number | undefined): this {
    if (limit === undefined) {
      return this;
    }
    return this.withThrottleRule(
      `CountRuleWithDigitrafficUser${limit}`,
      limit,
      true,
      false,
    );
  }

  withCountDigitrafficUserIpAndUriPath(limit: number | undefined): this {
    if (limit === undefined) {
      return this;
    }
    return this.withThrottleRule(
      `CountRuleIPQueryWithDigitrafficUser${limit}`,
      limit,
      true,
      true,
    );
  }

  withCountAnonymousUserIp(limit: number | undefined): this {
    if (limit === undefined) {
      return this;
    }
    return this.withThrottleRule(
      `CountRuleWithAnonymousUser${limit}`,
      limit,
      false,
      false,
    );
  }

  withCountAnonymousUserIpAndUriPath(limit: number | undefined): this {
    if (limit === undefined) {
      return this;
    }
    return this.withThrottleRule(
      `CountRuleIPQueryWithAnonymousUser${limit}`,
      limit,
      false,
      true,
    );
  }

  _isCustomResponseBodyKeySet(key: string): boolean {
    return key in this._customResponseBodies;
  }

  _addThrottleResponseBody(customResponseBodyKey: string, limit: number): void {
    if (!this._isCustomResponseBodyKeySet(customResponseBodyKey)) {
      this.withCustomResponseBody(customResponseBodyKey, {
        content:
          `Request rate is limited to ${limit} requests in a 5 minute window.`,
        contentType: "TEXT_PLAIN",
      });
    }
  }

  public build(): CfnWebACL {
    const addPriority = (
      rule: CfnWebAclRuleProperty,
      priority: number,
    ): CfnWebACL.RuleProperty => ({
      ...rule,
      priority,
    });
    const rules: CfnWebACL.RuleProperty[] = concat(
      zipWith(this._countRules, range(this._countRules.length), addPriority),
      zipWith(
        this._blockRules,
        range(this._blockRules.length).map((n) => n + this._countRules.length),
        addPriority,
      ),
    );

    if (rules.length === 0) {
      throw new Error("No rules defined for WebACL");
    }

    const uniqueRuleNames = new Set(rules.map((rule) => rule.name));

    if (uniqueRuleNames.size !== rules.length) {
      throw new Error(
        "Tried to create an Access Control List with multiple rules having the same name",
      );
    }

    return new CfnWebACL(this._construct, this._name, {
      defaultAction: { allow: {} },
      scope: this._scope,
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: "WAF-Blocked",
        sampledRequestsEnabled: false,
      },
      rules,
      ...(this._customResponseBodies && {
        customResponseBodies: this._customResponseBodies,
      }),
    });
  }
}

const CUSTOM_KEYS_IP_AND_URI_PATH:
  CfnWebACL.RateBasedStatementCustomKeyProperty[] = [
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

function notStatement(
  statement: CfnWebACL.StatementProperty,
): CfnWebACL.StatementProperty {
  return {
    notStatement: {
      statement,
    },
  };
}
function createThrottleStatement(
  limit: number,
  isHeaderRequired: boolean,
  isBasedOnIpAndUriPath: boolean,
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
        scopeDownStatement: isHeaderRequired
          ? matchStatement
          : notStatement(matchStatement),
      },
    };
  }

  return {
    rateBasedStatement: {
      aggregateKeyType: "IP",
      limit: limit,
      scopeDownStatement: isHeaderRequired
        ? matchStatement
        : notStatement(matchStatement),
    },
  };
}

function createAWSCommonRuleSet(
  excludedRules: string[] = [],
): CfnWebAclRuleProperty {
  return createRuleProperty("AWS-AWSManagedRulesCommonRuleSet", {
    statement: {
      managedRuleGroupStatement: {
        vendorName: "AWS",
        name: "AWSManagedRulesCommonRuleSet",
        excludedRules: [
          { name: "NoUserAgent_HEADER" },
          { name: "SizeRestrictions_BODY" },
          { name: "GenericRFI_BODY" },
        ].concat((excludedRules ?? []).map((rule) => ({ name: rule }))),
      },
    },
  });
}

function createAWSReputationList(
  excludedRules: string[] = [],
): CfnWebAclRuleProperty {
  return createRuleProperty("AWS-AWSManagedRulesAmazonIpReputationList", {
    statement: {
      managedRuleGroupStatement: {
        vendorName: "AWS",
        name: "AWSManagedRulesAmazonIpReputationList",
        excludedRules: (excludedRules ?? []).map((rule) => ({ name: rule })),
      },
    },
  });
}

function createAWSKnownBadInput(
  excludedRules: string[] = [],
): CfnWebAclRuleProperty {
  return createRuleProperty("AWS-AWSManagedRulesKnownBadInputsRuleSet", {
    statement: {
      managedRuleGroupStatement: {
        vendorName: "AWS",
        name: "AWSManagedRulesKnownBadInputsRuleSet",
        excludedRules: (excludedRules ?? []).map((rule) => ({ name: rule })),
      },
    },
  });
}

function createAWSAntiSQLInjection(
  excludedRules: string[] = [],
): CfnWebAclRuleProperty {
  return createRuleProperty("AWS-AWSManagedRulesSQLiRuleSet", {
    statement: {
      managedRuleGroupStatement: {
        vendorName: "AWS",
        name: "AWSManagedRulesSQLiRuleSet",
        excludedRules: (excludedRules ?? []).map((rule) => ({ name: rule })),
      },
    },
  });
}

function createRuleProperty(
  name: string,
  rule: RuleProperty,
  overrideAction: boolean = true,
): CfnWebAclRuleProperty {
  return {
    ...{
      name,
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
