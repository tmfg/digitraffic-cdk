export class WafRules {
    readonly awsCommonRules: boolean;
    readonly digitrafficHeaderRules: boolean;

    readonly perIpWithHeader: number;
    readonly perIpWithoutHeader: number;
    readonly perIpAndQueryWithHeader?: number;
    readonly perIpAndQueryWithoutHeader?: number;

    constructor(
        awsCommonRules: boolean,
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

    static per5min(
        perIpWithHeader: number,
        perIpWithoutHeader: number,
        perIpAndQueryWithHeader?: number,
        perIpAndQueryWithoutHeader?: number
    ): WafRules {
        if (
            perIpWithHeader < 100 ||
            perIpWithoutHeader < 100 ||
            (perIpAndQueryWithHeader ?? 100) < 100 ||
            (perIpAndQueryWithoutHeader ?? 100) < 100
        ) {
            throw new Error("Minimum limit is 100");
        }

        return new WafRules(
            true,
            true,
            perIpWithHeader,
            perIpWithoutHeader,
            perIpAndQueryWithHeader,
            perIpAndQueryWithoutHeader
        );
    }
}
