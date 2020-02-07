///<reference path="../lib/app-props.d.ts"/>

const props: Props = {
    distributionName: "BetaDistribution",
    aliasNames: null,
    acmCertRef: null,
    domains: [
        {
            domainName: "xxx.amazonaws.com",
            originPath: "prod",
            behaviors: [""]
    }]
};
export default props;
