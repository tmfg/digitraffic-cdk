import type {
  AWSManagedWafRule,
  ExcludedAWSRules,
} from "@digitraffic/common/dist/aws/infra/acl-builder";

interface PathLimit {
  path: RegExp;
  limit: number;
}
export class WafRules {
  readonly awsCommonRuleSets: "all" | AWSManagedWafRule[];
  readonly excludedRules: ExcludedAWSRules | undefined;
  readonly digitrafficHeaderRules: boolean;

  readonly perIpWithHeader?: number;
  readonly perIpWithoutHeader?: number;
  readonly perIpAndQueryWithHeader?: number;
  readonly perIpAndQueryWithoutHeader?: number;
  readonly perIpAndQueryWithoutHeaderByPath?: PathLimit;

  readonly isCountOnly?: boolean;

  constructor(
    awsCommonRuleSets: "all" | AWSManagedWafRule[],
    digitrafficHeaderRules: boolean,
    perIpWithHeader?: number,
    perIpWithoutHeader?: number,
    perIpAndQueryWithHeader?: number,
    perIpAndQueryWithoutHeader?: number,
    perIpAndQueryWithoutHeaderByPath?: PathLimit,
    excludedRules?: ExcludedAWSRules,
    isCountOnly: boolean = false,
  ) {
    if (
      !isCountOnly &&
      (perIpWithHeader === undefined || perIpWithoutHeader === undefined)
    ) {
      throw new Error("You must provide limits for throttling ips");
    }
    this.awsCommonRuleSets = awsCommonRuleSets;
    this.digitrafficHeaderRules = digitrafficHeaderRules;
    this.perIpWithHeader = perIpWithHeader;
    this.perIpWithoutHeader = perIpWithoutHeader;
    this.perIpAndQueryWithHeader = perIpAndQueryWithHeader;
    this.perIpAndQueryWithoutHeader = perIpAndQueryWithoutHeader;
    this.perIpAndQueryWithoutHeaderByPath = perIpAndQueryWithoutHeaderByPath;
    this.excludedRules = excludedRules;
    this.isCountOnly = isCountOnly;
  }

  private static checkLimits(
    perIpWithHeader: number,
    perIpWithoutHeader: number,
    perIpAndQueryWithHeader?: number,
    perIpAndQueryWithoutHeader?: number,
    perIpAndQueryWithoutHeaderByPath?: PathLimit,
  ): void {
    const minimumLimit = 50;
    if (
      perIpWithHeader < minimumLimit ||
      perIpWithoutHeader < minimumLimit ||
      (perIpAndQueryWithHeader ?? minimumLimit) < minimumLimit ||
      (perIpAndQueryWithoutHeader ?? minimumLimit) < minimumLimit ||
      (perIpAndQueryWithoutHeaderByPath?.limit ?? minimumLimit) < minimumLimit
    ) {
      throw new Error("Minimum limit is 50");
    }
  }

  static per5min(
    perIpWithHeader: number,
    perIpWithoutHeader: number,
    perIpAndQueryWithHeader?: number,
    perIpAndQueryWithoutHeader?: number,
    perIpAndQueryWithoutHeaderByPath?: PathLimit,
    excludedRules?: ExcludedAWSRules,
  ): WafRules {
    WafRules.checkLimits(
      perIpWithHeader,
      perIpWithoutHeader,
      perIpAndQueryWithHeader,
      perIpAndQueryWithoutHeader,
    );

    return new WafRules(
      "all",
      true,
      perIpWithHeader,
      perIpWithoutHeader,
      perIpAndQueryWithHeader,
      perIpAndQueryWithoutHeader,
      perIpAndQueryWithoutHeaderByPath,
      excludedRules,
    );
  }

  static per5minCount(
    perIpWithHeader?: number,
    perIpWithoutHeader?: number,
    perIpAndQueryWithHeader?: number,
    perIpAndQueryWithoutHeader?: number,
    perIpAndQueryWithoutHeaderByPath?: PathLimit,
  ): WafRules {
    return new WafRules(
      [],
      true,
      perIpWithHeader,
      perIpWithoutHeader,
      perIpAndQueryWithHeader,
      perIpAndQueryWithoutHeader,
      perIpAndQueryWithoutHeaderByPath,
      undefined,
      true,
    );
  }

  static per5minWithSelectedCommon(
    awsCommonRuleSets: "all" | AWSManagedWafRule[],
    perIpWithHeader: number,
    perIpWithoutHeader: number,
    perIpAndQueryWithHeader?: number,
    perIpAndQueryWithoutHeader?: number,
    excludedRules?: ExcludedAWSRules,
  ): WafRules {
    WafRules.checkLimits(
      perIpWithHeader,
      perIpWithoutHeader,
      perIpAndQueryWithHeader,
      perIpAndQueryWithoutHeader,
    );

    return new WafRules(
      awsCommonRuleSets,
      true,
      perIpWithHeader,
      perIpWithoutHeader,
      perIpAndQueryWithHeader,
      perIpAndQueryWithoutHeader,
      undefined,
      excludedRules,
    );
  }
}
