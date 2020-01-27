import cdk = require('@aws-cdk/core');
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront'

export class CloudfrontCdkStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, cloudfrontProps: Props, props?: cdk.StackProps) {
        super(scope, id, props);

        const distribution = new CloudFrontWebDistribution(this, cloudfrontProps.distributionName, {
            originConfigs: [
                {
                    customOriginSource: {
                        domainName: cloudfrontProps.domainName
                    },
                    behaviors : [ {isDefaultBehavior: true}],
                    originPath: cloudfrontProps.originPath
                }
            ]
        });
    }
}
