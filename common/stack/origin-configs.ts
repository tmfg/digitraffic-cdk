import {Duration} from '@aws-cdk/core';
import {OriginProtocolPolicy, SourceConfiguration} from '@aws-cdk/aws-cloudfront';
import {Behavior, Domain} from "../../cloudfront-cdk/lib/app-props";

export function createOriginConfig(domain: Domain): SourceConfiguration {
    return {
        customOriginSource: {
            domainName: domain.domainName,
            httpPort: domain.httpPort || 80,
            httpsPort: domain.httpsPort || 443,
            originProtocolPolicy: domain.protocolPolicy as OriginProtocolPolicy || OriginProtocolPolicy.HTTP_ONLY
        },
        behaviors: createBehaviors(domain.behaviors),
        originPath: domain.originPath,
        originHeaders: createOriginHeaders(domain)
    }
}

function createOriginHeaders(domain: Domain): { [key: string] : string } {
    if (domain.apiKey) {
        return {
            'x-api-key': domain.apiKey
        } as { [key: string] : string };
    }

    return {};
}

function createBehaviors(behaviors: Behavior[]) {
    if(behaviors == null || behaviors.length == 0) {
        return [{isDefaultBehavior: true, minTtl:Duration.seconds(0), maxTtl:Duration.seconds(0), defaultTtl: Duration.seconds(0), forwardedValues: { queryString: true }} ];
    }

    return behaviors.map(b => ({
        isDefaultBehavior: false,
        pathPattern: b.path,
        minTtl: Duration.seconds(0),
        maxTtl: Duration.seconds(b.cacheTtl || 60),
        defaultTtl: Duration.seconds(b.cacheTtl || 60),
        forwardedValues: {
            queryString: true,
            queryCacheKeys: b.queryCacheKeys
        }
    }));
}
