import {Duration, Stack} from 'aws-cdk-lib';
import {
    Behavior,
    LambdaEdgeEventType,
    LambdaFunctionAssociation,
    OriginAccessIdentity,
    OriginProtocolPolicy,
    SourceConfiguration,
} from 'aws-cdk-lib/aws-cloudfront';
import {Bucket} from 'aws-cdk-lib/aws-s3';
import {Version} from "aws-cdk-lib/aws-lambda";
import {CFBehavior, CFDistribution, CFDomain, S3Domain} from "./app-props";
import {CfnDistribution} from "aws-cdk-lib/aws-cloudfront/lib/cloudfront.generated";
import {LambdaType} from "./lambda/lambda-creator";

export type LambdaMap = Record<string, Version>;

export function createOriginConfig(stack: Stack,
    distribution: CFDistribution,
    oai: OriginAccessIdentity|null,
    lambdaMap: LambdaMap)
    : SourceConfiguration {
    if (distribution instanceof S3Domain) {
        if (!oai) {
            throw new Error('OAI was null! OAI is needed for S3 origin');
        }
        const bucket = Bucket.fromBucketAttributes(stack, `ImportedBucketName-${distribution.s3BucketName}`, {
            bucketArn: `arn:aws:s3:::${distribution.s3BucketName}`,
            bucketRegionalDomainName: `${distribution.s3BucketName}.s3.eu-west-1.amazonaws.com`,
        });

        bucket.grantRead(oai as OriginAccessIdentity);

        return {
            s3OriginSource: {
                s3BucketSource: bucket,
                originAccessIdentity: oai as OriginAccessIdentity,
                originPath: distribution.originPath,
            },
            behaviors: createBehaviors(stack, distribution.behaviors, lambdaMap),
        };
    } else if (distribution instanceof CFDomain) {
        return {
            customOriginSource: {
                domainName: distribution.domainName as string,
                httpPort: distribution.httpPort ?? 80,
                httpsPort: distribution.httpsPort ?? 443,
                originProtocolPolicy: distribution.originProtocolPolicy as OriginProtocolPolicy ?? OriginProtocolPolicy.HTTPS_ONLY,
                originPath: distribution.originPath,
                originHeaders: createOriginHeaders(distribution),
            },
            behaviors: createBehaviors(stack, distribution.behaviors, lambdaMap),
        };
    }

    throw new Error(`Unknown distribution type ` + distribution.constructor.name);
}

function createOriginHeaders(domain: CFDomain): { [key: string] : string } {
    if (domain.apiKey !== undefined) {
        return {
            'x-api-key': domain.apiKey,
        } as { [key: string] : string };
    }

    return {};
}

function createBehaviors(stack: Stack, behaviors: CFBehavior[], lambdaMap: LambdaMap): Behavior[] {
    return behaviors.map(b => createBehavior(stack, b, lambdaMap, b.path === "*"));
}

function createBehavior(stack: Stack, b: CFBehavior, lambdaMap: LambdaMap, isDefaultBehavior = false): Behavior {
    //console.info('creating behavior %s with default %d', b.path, isDefaultBehavior);

    const forwardedValues = {
        headers: [] as string[],
        queryString: true,
        queryStringCacheKeys: b.queryCacheKeys as string[],
    } as CfnDistribution.ForwardedValuesProperty;

    if (b.viewerProtocolPolicy === 'https-only') {
        (forwardedValues.headers as string[]).push('Host');
    }
    if (b.cacheHeaders != null) {
        (forwardedValues.headers as string[]).push(...b.cacheHeaders);
    }

    return {
        isDefaultBehavior,
        allowedMethods: b.allowedMethods,
        pathPattern: b.path,
        minTtl: Duration.seconds(0),
        maxTtl: Duration.seconds(b.cacheTtl),
        defaultTtl: Duration.seconds(b.cacheTtl),
        forwardedValues,
        lambdaFunctionAssociations: getLambdas(b, lambdaMap),
    };
}

function getLambdas(b: CFBehavior, lambdaMap: LambdaMap): LambdaFunctionAssociation[] | undefined {
    const lambdas: LambdaFunctionAssociation[] = [];

    Object.values(LambdaType).forEach(type => {
        if (b.lambdaTypes?.has(type as LambdaType)) {
            lambdas.push({
                eventType: getEventType(type as LambdaType),
                lambdaFunction: lambdaMap[type],
            });
        }
    });

    if (b.ipRestriction) {
        lambdas.push({
            eventType: LambdaEdgeEventType.ORIGIN_REQUEST,
            lambdaFunction: lambdaMap[`IP_${b.ipRestriction}`],
        });
    }

    return lambdas.length == 0 ? undefined : lambdas;
}

function getEventType(type: LambdaType): LambdaEdgeEventType {
    switch (type) {
        case LambdaType.WEATHERCAM_REDIRECT:
        case LambdaType.IP_RESTRICTION:
        case LambdaType.GZIP_REQUIREMENT:
            return LambdaEdgeEventType.ORIGIN_REQUEST;
        case LambdaType.HTTP_HEADERS:
            return LambdaEdgeEventType.VIEWER_RESPONSE;
        default:
            throw new Error('unknown lambdatype');
    }
}

