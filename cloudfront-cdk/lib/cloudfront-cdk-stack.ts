import cdk = require('@aws-cdk/core');
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront'

export class CloudfrontCdkStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, cloudfrontProps: Props, props?: cdk.StackProps) {
        super(scope, id, props);

        const distribution = new CloudFrontWebDistribution(this, cloudfrontProps.distributionName, {
            originConfigs: [
                {
                    customOriginSource: {
                        domainName: cloudfrontProps.nw2DomainName
                    },
                    behaviors: [{isDefaultBehavior: true}],
                    originPath: cloudfrontProps.originPath
                },
                {
                    customOriginSource: {
                        domainName: cloudfrontProps.open311DomainName
                    },
                    behaviors: [{isDefaultBehavior: false, pathPattern: "requests/*"},
                                {isDefaultBehavior: false, pathPattern: "services/*"}],
                    originPath: cloudfrontProps.originPath

                }
            ]/*,
            viewerCertificate: {
                aliases: [cloudfrontProps.aliasName ],
                props: {
                    cloudFrontDefaultCertificate: true
                }
            }*/
            }
        );

        cdk.Tag.add(distribution, 'CloudFront', 'Value');

    }
}
