import core = require('@aws-cdk/core');
import {CfnDomain} from "@aws-cdk/aws-elasticsearch";

export class ElasticsearchStack extends core.Stack {
    constructor(scope: core.App, id: string, elasticsearchProps: Props, props?: core.StackProps,) {
        super(scope, id, props);

        const esVersion: string = '7.9';
        const esId = 'dt-elasticsearch';
        const domainName = 'dt-elasticsearch-domain';

        const domain = new CfnDomain(this, esId, {
            accessPolicies: {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": "*"
                        },
                        "Action": "es:*",
                        "Resource": `arn:aws:es:eu-west-1:${props?.env?.account}:domain/dt-elasticsearch-domain/*`,
                        "Condition": {
                            "IpAddress": {
                                "aws:SourceIp": elasticsearchProps.allowedIpAddresses
                            }
                        }
                    },
                    {
                        "Sid": "",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": elasticsearchProps.allowedRoles
                        },
                        "Action": "es:*",
                        "Resource": `arn:aws:es:eu-west-1:${props?.env?.account}:domain/dt-elasticsearch-domain/*`
                    }
                ]
            },
            domainName: domainName,
            ebsOptions: {
                ebsEnabled: true,
                volumeSize: elasticsearchProps.instanceStorageSize,
                volumeType: 'gp2',
            },
            elasticsearchClusterConfig: {
                instanceCount: elasticsearchProps.instanceCount,
                instanceType: elasticsearchProps.instanceType
            },
            elasticsearchVersion: esVersion
        });

        domain.cfnOptions.updatePolicy = {
            enableVersionUpgrade: true
        };

        // const metric = new Metric({
        //     namespace: 'AWS/ES',
        //     metricName: 'FreeStorageSpace',
        // });
        //
        // const minFreeStorageSpaceAlarm = new Alarm(domain,"ElasticSearch min FreeStorageSpace", {
        //     metric,
        //     threshold: 100000,
        //     evaluationPeriods: 1,
        //     datapointsToAlarm: 1,
        // })
    }
}
