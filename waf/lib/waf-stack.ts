import {Stack, Construct, StackProps} from '@aws-cdk/core';
import {IpRestrictionProps, IpSetProps, Props} from './app-props'
import {CfnIPSet, CfnWebACL, CfnWebACLAssociation} from "@aws-cdk/aws-wafv2";

export class WafStack extends Stack {
    constructor(scope: Construct, id: string, appProps: Props, props?: StackProps) {
        super(scope, id, props);

        const ipSets = appProps.ipSets.map(ipSet => this.createIpSet(ipSet));
        appProps.ipRestrictions.forEach(ipr => this.createIpRestriction(ipr, ipSets));
    }

    createIpSet(ipSet: IpSetProps) {
        return new CfnIPSet(this, ipSet.name, {
            name: ipSet.name,
            ipAddressVersion: 'IPV4',
            scope: 'REGIONAL',
            addresses: ipSet.addresses
        });
    }

    createIpRestriction(ipRestriction: IpRestrictionProps, ipSets: CfnIPSet[]) {
        const webAcl = new CfnWebACL(this, ipRestriction.name, {
            name: ipRestriction.name,
            defaultAction: {block: {block: true}},
            visibilityConfig: {
                sampledRequestsEnabled: true,
                cloudWatchMetricsEnabled: true,
                metricName: `${ipRestriction.name}-metric`
            },
            scope: 'REGIONAL',
            rules: ipRestriction.ipSetNames.map((ipSetName, idx) => {
                const name = `${ipRestriction.name}-${ipSetName}`
                return {
                    visibilityConfig: {
                        sampledRequestsEnabled: true,
                        cloudWatchMetricsEnabled: true,
                        metricName: name
                    },
                    name,
                    priority: idx,
                    statement: {
                        ipSetReferenceStatement: {
                            arn: ipSets.find(ipSet => ipSet.name == ipSetName)!!.attrArn
                        }
                    },
                    action: {
                        allow: {allow: true}
                    }
                }
            })
        });
        new CfnWebACLAssociation(this, `${ipRestriction.name}-association`, {
            resourceArn: ipRestriction.resourceArn,
            webAclArn: webAcl.attrArn
        });
    }
}
