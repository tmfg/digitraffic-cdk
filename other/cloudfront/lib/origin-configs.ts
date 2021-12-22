import {Duration, Stack} from 'aws-cdk-lib';
import {
    OriginProtocolPolicy,
    OriginAccessIdentity,
    SourceConfiguration,
    Behavior,
    CloudFrontAllowedMethods,
    LambdaEdgeEventType,
} from 'aws-cdk-lib/aws-cloudfront';
import {Bucket} from 'aws-cdk-lib/aws-s3';
import {Version} from "aws-cdk-lib/aws-lambda";
import {CFBehavior, CFDomain} from "./app-props";

export type LambdaMap = Record<string, Version>;

export function createOriginConfig(stack: Stack,
    domain: CFDomain,
    oai: OriginAccessIdentity|null,
    lambdaMap: LambdaMap)
    : SourceConfiguration {
    if (domain.s3BucketName) {
        if (!oai) {
            throw new Error('OAI was null! OAI is needed for S3 origin');
        }
        const bucket = Bucket.fromBucketAttributes(stack, `ImportedBucketName-${domain.s3BucketName}`, {
            bucketArn: `arn:aws:s3:::${domain.s3BucketName}`,
            bucketRegionalDomainName: `${domain.s3BucketName}.s3.eu-west-1.amazonaws.com`,
        });

        bucket.grantRead(oai as OriginAccessIdentity);

        return {
            s3OriginSource: {
                s3BucketSource: bucket,
                originAccessIdentity: oai as OriginAccessIdentity,
                originPath: domain.originPath,
                originHeaders: createOriginHeaders(domain),
            },
            behaviors: createBehaviors(stack, domain.behaviors || [], lambdaMap),
        };
    }
    return {
        customOriginSource: {
            domainName: domain.domainName as string,
            httpPort: domain.httpPort ?? 80,
            httpsPort: domain.httpsPort ?? 443,
            originProtocolPolicy: domain.originProtocolPolicy as OriginProtocolPolicy ?? OriginProtocolPolicy.HTTPS_ONLY,
            originPath: domain.originPath,
            originHeaders: createOriginHeaders(domain),
        },
        behaviors: createBehaviors(stack, domain.behaviors || [], lambdaMap),
    };
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

function createBehavior(stack: Stack, b: CFBehavior, lambdaMap: LambdaMap, defaultBehavior = false): Behavior {
//    console.info('creating behavior %s with default %d', b.path, defaultBehavior);

    const forwardedValues = {
        headers: [] as string[],
        queryString: true,
        queryStringCacheKeys: b.queryCacheKeys as string[],
    } as any;

    if (b.viewerProtocolPolicy === 'https-only') {
        forwardedValues.headers.push('Host');
    }
    if (b.cacheHeaders != null) {
        (forwardedValues as any).headers = forwardedValues.headers.concat(b.cacheHeaders);
    }

    return {
        isDefaultBehavior: defaultBehavior,
        allowedMethods: b.allowedMethods ?? CloudFrontAllowedMethods.GET_HEAD,
        pathPattern: b.path,
        minTtl: Duration.seconds(0),
        maxTtl: Duration.seconds(b.cacheTtl ?? 60),
        defaultTtl: Duration.seconds(b.cacheTtl ?? 60),
        forwardedValues,
        lambdaFunctionAssociations: getLambdas(b, lambdaMap),
    };
}

function getLambdas(b: CFBehavior, lambdaMap: LambdaMap) {
    const lambdas = b.lambdas?.map(l => ({
        eventType: l.eventType,
        lambdaFunction: lambdaMap[l.lambdaType],
    })) || [];

    if (b.ipRestriction) {
        lambdas.push({
            eventType: LambdaEdgeEventType.ORIGIN_REQUEST,
            lambdaFunction: lambdaMap[`IP_${b.ipRestriction}`],
        });
    }

    return lambdas.length === 0 ? undefined : lambdas;
}
