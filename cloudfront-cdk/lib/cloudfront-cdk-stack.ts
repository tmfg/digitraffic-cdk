import cdk = require('@aws-cdk/core');
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront'
import {createOriginConfig} from "../../common/stack/origin-configs";
import {createAliasConfig} from "../../common/stack/alias-configs";

export class CloudfrontCdkStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, cloudfrontProps: Props, props?: cdk.StackProps) {
        super(scope, id, props);

        const distribution = this.createDistribution(cloudfrontProps);

        cdk.Tag.add(distribution, 'CloudFront', 'Value');
    }

    createDistribution(cloudfrontProps: Props) {
        const originConfigs = cloudfrontProps.domains.map(d => createOriginConfig(d.domainName, d.originPath, d.behaviors));

        if(cloudfrontProps.acmCertRef == null) {
            return new CloudFrontWebDistribution(this, cloudfrontProps.distributionName, {
                originConfigs: originConfigs,
            });
        } else {
            const aliasConfig = createAliasConfig(cloudfrontProps.acmCertRef as string, cloudfrontProps.aliasNames as string[]);

            return new CloudFrontWebDistribution(this, cloudfrontProps.distributionName, {
                originConfigs: originConfigs,
                aliasConfiguration: aliasConfig
            });
        }
    }
}