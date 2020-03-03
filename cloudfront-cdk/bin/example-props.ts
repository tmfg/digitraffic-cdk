import {Props} from '../lib/app-props';

const props: Props = {
    distributionName: "BetaDistribution",
    environmentName: "testenv",
    aliasNames: null,
    acmCertRef: null,
    domains: [
        {
            domainName: "xxx.amazonaws.com",
            originPath: "prod",
            behaviors: []
    }]
};
export default props;
