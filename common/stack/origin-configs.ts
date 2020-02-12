import { Duration } from '@aws-cdk/core';
import { OriginProtocolPolicy } from '@aws-cdk/aws-cloudfront';

export function createOriginConfig(domain: any) {
    return {
        customOriginSource: {
            domainName: domain.domainName,
            httpPort: domain.httpPort || 80,
            httpsPort: domain.httpsPort || 443,
            originProtocolPolicy: domain.protocolPolicy || OriginProtocolPolicy.HTTP_ONLY
        },
        behaviors: createBehaviors(domain.behaviors),
        originPath: domain.originPath,
        originHeaders: createOriginHeaders(domain)
    }
}

function createOriginHeaders(domain: any): { [key: string] : string } {
    if(domain.apiKey) {
        return {
            'x-api-key': domain.apiKey
        } as { [key: string] : string };
    }

    return {};
}

function createBehaviors(behaviors: any[]) {
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