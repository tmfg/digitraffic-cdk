import cdk = require('@aws-cdk/core');
import { CloudFrontWebDistribution } from '@aws-cdk/aws-cloudfront'
import {createOriginConfig} from "../../common/stack/origin-configs";

export class CloudfrontCdkStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, cloudfrontProps: Props, props?: cdk.StackProps) {
        super(scope, id, props);

        const distribution = new CloudFrontWebDistribution(this, cloudfrontProps.distributionName, {
            originConfigs: [
                createOriginConfig(cloudfrontProps.domains.loadBalancerDomainName, ""),
                createOriginConfig(cloudfrontProps.domains.fargateDomainName, "", "api/v3/metadata/*"),
                createOriginConfig(cloudfrontProps.domains.open311DomainName, cloudfrontProps.originPath,  "requests/*", "services/*"),
                createOriginConfig(cloudfrontProps.domains.nw2DomainName, cloudfrontProps.originPath, "annotations"),
            ]}
        );

        cdk.Tag.add(distribution, 'CloudFront', 'Value');
    }
}
