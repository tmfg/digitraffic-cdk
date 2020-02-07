import cdk = require('@aws-cdk/core');
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront'
import {createOriginConfig} from "../../common/stack/origin-configs";

export class CloudfrontCdkStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, cloudfrontProps: Props, props?: cdk.StackProps) {
        super(scope, id, props);

        const originConfigs = cloudfrontProps.domains.map(d => createOriginConfig(d.domainName, d.originPath, d.behaviors));

        const distribution = new CloudFrontWebDistribution(this, cloudfrontProps.distributionName, {
            originConfigs: originConfigs
        });

        cdk.Tag.add(distribution, 'CloudFront', 'Value');
    }
}
