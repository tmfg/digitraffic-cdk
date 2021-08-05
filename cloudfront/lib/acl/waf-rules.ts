export class WafRules {
    readonly awsCommonRules : boolean;
    readonly digitrafficHeaderRules: boolean;

    readonly withHeaderLimit? : number;
    readonly withoutHeaderLimit? : number;

    constructor(awsCommonRules: boolean, digitrafficHeaderRules: boolean, withHeaderLimit?: number, withoutHeaderLimit?: number) {
        this.awsCommonRules = awsCommonRules;
        this.digitrafficHeaderRules = digitrafficHeaderRules;
        this.withHeaderLimit = withHeaderLimit;
        this.withoutHeaderLimit = withoutHeaderLimit;
    }

    static All(withHeaderLimit: number, withoutHeaderLimit: number): WafRules {
        return new WafRules(true, true, withHeaderLimit, withoutHeaderLimit);
    }
}