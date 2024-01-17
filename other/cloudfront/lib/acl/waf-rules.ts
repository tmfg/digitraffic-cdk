export class WafRules {
    readonly awsCommonRules: boolean;
    readonly digitrafficHeaderRules: boolean;

    readonly withHeaderLimit?: number;
    readonly withHeaderIpQueryLimit?: number;

    readonly withoutHeaderLimit?: number;
    readonly withoutHeaderIpQueryLimit?: number;

    constructor(
        awsCommonRules: boolean,
        digitrafficHeaderRules: boolean,
        withHeaderLimit?: number,
        withoutHeaderLimit?: number,
        withHeaderIpQueryLimit?: number,
        withoutHeaderIpQueryLimit?: number
    ) {
        this.awsCommonRules = awsCommonRules;
        this.digitrafficHeaderRules = digitrafficHeaderRules;
        this.withHeaderLimit = withHeaderLimit;
        this.withHeaderIpQueryLimit = withHeaderIpQueryLimit;
        this.withoutHeaderLimit = withoutHeaderLimit;
        this.withoutHeaderIpQueryLimit = withoutHeaderIpQueryLimit;
    }

    static All(
        withHeaderLimit: number,
        withoutHeaderLimit: number,
        withHeaderIpQueryLimit?: number,
        withoutHeaderIpQueryLimit?: number
    ): WafRules {
        return new WafRules(
            true,
            true,
            withHeaderLimit,
            withoutHeaderLimit,
            withHeaderIpQueryLimit,
            withoutHeaderIpQueryLimit
        );
    }
}
