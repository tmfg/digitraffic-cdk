import cdk = require('@aws-cdk/core');
import * as ec2 from "@aws-cdk/aws-ec2";

export class CloudfrontCdkStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, cloudfrontProps: Props, props?: cdk.StackProps) {
        super(scope, id, props);

        const distribution = new ec2.CloudFrontWebDistribution(this, props.distribution, {
            originConfigs: [
                {
                    customOriginSource: {
                        domainName: props.domainName
                    },
                    behaviors : [ {isDefaultBehavior: true}],
                    originPath: props.originPath
                }
            ]
        });
    }
}
