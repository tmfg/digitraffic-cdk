import {Duration, Stack} from '@aws-cdk/core';
import {OriginProtocolPolicy, OriginAccessIdentity, SourceConfiguration, Behavior, LambdaEdgeEventType} from '@aws-cdk/aws-cloudfront';
import {CFBehavior, CFDomain} from "../../cloudfront-cdk/lib/app-props";
import {Bucket} from '@aws-cdk/aws-s3';
import {Version} from '@aws-cdk/aws-lambda';

export function createOriginConfig(stack: Stack, domain: CFDomain,
                                   oai: OriginAccessIdentity|null,
                                   lambdaMap: any): SourceConfiguration {
    if(domain.s3BucketName) {
        const bucket = Bucket.fromBucketAttributes(stack, 'ImportedBucket', {
            bucketArn: `arn:aws:s3:::${domain.s3BucketName}`,
            bucketRegionalDomainName: `${domain.s3BucketName}.s3.eu-west-1.amazonaws.com`
        });

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
            httpPort: domain.httpPort || 80,
            httpsPort: domain.httpsPort || 443,
            originProtocolPolicy: domain.protocolPolicy as OriginProtocolPolicy || OriginProtocolPolicy.HTTPS_ONLY
        },
        behaviors: createBehaviors(stack, domain.behaviors || [], lambdaMap),
        originPath: domain.originPath,
        originHeaders: createOriginHeaders(domain)
    }
}

function createOriginHeaders(domain: CFDomain): { [key: string] : string } {
    if (domain.apiKey) {
        return {
            'x-api-key': domain.apiKey
        } as { [key: string] : string };
    }

    return {};
}

function createBehaviors(stack: Stack, behaviors: CFBehavior[], lambdaMap: any): Behavior[] {
    if (behaviors == null || behaviors.length == 0) {
        return [createBehavior(stack, {}, lambdaMap, true)];
    }

    return behaviors.map(b => createBehavior(stack, b, lambdaMap, b.path == null));
}

function createBehavior(stack: Stack, b: CFBehavior, lambdaMap: any, defaultBehavior: boolean = false): Behavior {
//    console.info('creating behavior %s with default %d', b.path, defaultBehavior);

    return {
        isDefaultBehavior: defaultBehavior,
        pathPattern: b.path,
        minTtl: Duration.seconds(0),
        maxTtl: Duration.seconds(b.cacheTtl || 60),
        defaultTtl: Duration.seconds(b.cacheTtl || 60),
        forwardedValues: {
            queryString: true,
            queryStringCacheKeys: b.queryCacheKeys as string[]
        },
        lambdaFunctionAssociations: lambdaFunctionAssociations(stack, b, lambdaMap)
    };
}

function lambdaFunctionAssociations(stack: Stack, behavior: CFBehavior, lambdaMap: any) {
    if(behavior.lambdaFunction) {
        const lambdaVersion = lambdaMap[behavior.lambdaFunction];

        return [{
            eventType: LambdaEdgeEventType.VIEWER_REQUEST,
            lambdaFunction: Version.fromVersionArn(stack, 'RedirectFunction', lambdaVersion)
        }]
    }

    return [];
}
