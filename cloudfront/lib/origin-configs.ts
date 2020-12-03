import {Duration, Stack} from '@aws-cdk/core';
import {
    OriginProtocolPolicy,
    OriginAccessIdentity,
    SourceConfiguration,
    Behavior,
    CloudFrontAllowedMethods,
    CfnDistribution,
    LambdaEdgeEventType
} from '@aws-cdk/aws-cloudfront';
import {CFBehavior, CFDomain} from "../../cloudfront/lib/app-props";
import {Bucket} from '@aws-cdk/aws-s3';
import ForwardedValuesProperty = CfnDistribution.ForwardedValuesProperty;

export function createOriginConfig(stack: Stack, domain: CFDomain,
                                   oai: OriginAccessIdentity|null,
                                   lambdaMap: any): SourceConfiguration {
    if(domain.s3BucketName) {
        const bucket = Bucket.fromBucketAttributes(stack, 'ImportedBucket', {
            bucketArn: `arn:aws:s3:::${domain.s3BucketName}`,
            bucketRegionalDomainName: `${domain.s3BucketName}.s3.eu-west-1.amazonaws.com`
        });

        bucket.grantRead(oai as OriginAccessIdentity);

        return {
            s3OriginSource: {
                s3BucketSource: bucket,
                originAccessIdentity: oai as OriginAccessIdentity,
            },
            behaviors: createBehaviors(stack, domain.behaviors || [], lambdaMap),
            originPath: domain.originPath,
            originHeaders: createOriginHeaders(domain)
        }
    }
    return {
        customOriginSource: {
            domainName: domain.domainName as string,
            httpPort: domain.httpPort ?? 80,
            httpsPort: domain.httpsPort ?? 443,
            originProtocolPolicy: domain.originProtocolPolicy as OriginProtocolPolicy ?? OriginProtocolPolicy.HTTPS_ONLY
        },
        behaviors: createBehaviors(stack, domain.behaviors || [], lambdaMap),
        originPath: domain.originPath,
        originHeaders: createOriginHeaders(domain)
    }
}

function createOriginHeaders(domain: CFDomain): { [key: string] : string } {
    if (domain.apiKey != undefined) {
        return {
            'x-api-key': domain.apiKey
        } as { [key: string] : string };
    }

    return {};
}

function createBehaviors(stack: Stack, behaviors: CFBehavior[], lambdaMap: any): Behavior[] {
    return behaviors.map(b => createBehavior(stack, b, lambdaMap, b.path === "*"));
}

function createBehavior(stack: Stack, b: CFBehavior, lambdaMap: any, defaultBehavior: boolean = false): Behavior {
//    console.info('creating behavior %s with default %d', b.path, defaultBehavior);

    const forwardedValues = {
            headers: [] as string[],
            queryString: true,
            queryStringCacheKeys: b.queryCacheKeys as string[]
        } as any;

    if(b.viewerProtocolPolicy === 'https-only') {
        forwardedValues.headers.push('Host');
    }
    if(b.cacheHeaders != null) {
        (forwardedValues as any).headers = forwardedValues.headers.concat(b.cacheHeaders);
    }

    return {
        isDefaultBehavior: defaultBehavior,
        allowedMethods: b.allowedMethods ?? CloudFrontAllowedMethods.GET_HEAD,
        pathPattern: b.path,
        minTtl: Duration.seconds(0),
        maxTtl: Duration.seconds(b.cacheTtl ?? 60),
        defaultTtl: Duration.seconds(b.cacheTtl ?? 60),
        forwardedValues: forwardedValues,
        lambdaFunctionAssociations: getLambdas(b, lambdaMap)
    };
}

function getLambdas(b: CFBehavior, lambdaMap: any) {
    const lambdas = b.lambdas?.map(l => ({
        eventType: l.eventType,
        lambdaFunction: lambdaMap[l.lambdaType]
    })) || [];

    if(b.ipRestriction) {
        lambdas.push({
            eventType: LambdaEdgeEventType.ORIGIN_REQUEST,
            lambdaFunction: lambdaMap[`IP_${b.ipRestriction}`]
        });
    }

    return lambdas.length == 0 ? undefined : lambdas;
}
