import { AWSManagedWafRule } from "@digitraffic/common/dist/aws/infra/acl-builder.mjs";

export class WafRules {
    readonly awsCommonRules: "all" | AWSManagedWafRule[];
    readonly digitrafficHeaderRules: boolean;

    readonly perIpWithHeader: number;
    readonly perIpWithoutHeader: number;
    readonly perIpAndQueryWithHeader?: number;
    readonly perIpAndQueryWithoutHeader?: number;

    constructor(
        awsCommonRules: "all" | AWSManagedWafRule[],
        digitrafficHeaderRules: boolean,
        perIpWithHeader: number,
        perIpWithoutHeader: number,
        perIpAndQueryWithHeader?: number,
        perIpAndQueryWithoutHeader?: number
    ) {
        this.awsCommonRules = awsCommonRules;
        this.digitrafficHeaderRules = digitrafficHeaderRules;
        this.perIpWithHeader = perIpWithHeader;
        this.perIpWithoutHeader = perIpWithoutHeader;
        this.perIpAndQueryWithHeader = perIpAndQueryWithHeader;
        this.perIpAndQueryWithoutHeader = perIpAndQueryWithoutHeader;
    }

    private static checkLimits(
        perIpWithHeader: number,
        perIpWithoutHeader: number,
        perIpAndQueryWithHeader?: number,
        perIpAndQueryWithoutHeader?: number): void {
        if (
            perIpWithHeader < 100 ||
            perIpWithoutHeader < 100 ||
            (perIpAndQueryWithHeader ?? 100) < 100 ||
            (perIpAndQueryWithoutHeader ?? 100) < 100
        ) {
            throw new Error("Minimum limit is 100");
        }
    }

    static per5min(
        perIpWithHeader: number,
        perIpWithoutHeader: number,
        perIpAndQueryWithHeader?: number,
        perIpAndQueryWithoutHeader?: number
    ): WafRules {
        WafRules.checkLimits(perIpWithHeader, perIpWithoutHeader, perIpAndQueryWithHeader, perIpAndQueryWithoutHeader)

        return new WafRules(
            "all",
            true,
            perIpWithHeader,
            perIpWithoutHeader,
            perIpAndQueryWithHeader,
            perIpAndQueryWithoutHeader
        );
    }

    static per5minWithSelectedCommon(
        awsCommonRules: "all" | AWSManagedWafRule[],
        perIpWithHeader: number,
        perIpWithoutHeader: number,
        perIpAndQueryWithHeader?: number,
        perIpAndQueryWithoutHeader?: number
    ): WafRules {
        WafRules.checkLimits(perIpWithHeader, perIpWithoutHeader, perIpAndQueryWithHeader, perIpAndQueryWithoutHeader)

        return new WafRules(
            awsCommonRules,
            true,
            perIpWithHeader,
            perIpWithoutHeader,
            perIpAndQueryWithHeader,
            perIpAndQueryWithoutHeader
        );
    }
}
