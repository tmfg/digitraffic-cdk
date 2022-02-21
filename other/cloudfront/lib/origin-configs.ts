import {Duration, Stack} from 'aws-cdk-lib';
import {
    Behavior,
    LambdaFunctionAssociation,
    OriginAccessIdentity,
    OriginProtocolPolicy,
    SourceConfiguration,
} from 'aws-cdk-lib/aws-cloudfront';
import {Bucket} from 'aws-cdk-lib/aws-s3';
import {CFBehavior, CFDistribution, CFDomain, S3Domain} from "./app-props";
import {CfnDistribution} from "aws-cdk-lib/aws-cloudfront/lib/cloudfront.generated";
import {FunctionAssociation} from "aws-cdk-lib/aws-cloudfront/lib/function";
import {LambdaHolder} from "./lambda-holder";

export function createOriginConfig(stack: Stack,
    distribution: CFDistribution,
    oai: OriginAccessIdentity|null,
    lambdaMap: LambdaHolder)
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
    const headers = domain.headers || {};

    if (domain.apiKey !== undefined) {
        headers['x-api-key'] = domain.apiKey;
    }

    return headers;
}

function createBehaviors(stack: Stack, behaviors: CFBehavior[], lambdaMap: LambdaHolder): Behavior[] {
    return behaviors.map(b => createBehavior(stack, b, lambdaMap, b.path === "*"));
}

function createBehavior(stack: Stack, b: CFBehavior, lambdaMap: LambdaHolder, isDefaultBehavior = false): Behavior {
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
        functionAssociations: getCloudfrontFunctions(b, lambdaMap),
        lambdaFunctionAssociations: getLambdas(b, lambdaMap),
    };
}

function getCloudfrontFunctions(b: CFBehavior, lambdaMap: LambdaHolder): FunctionAssociation[] | undefined {
    const functionAssociations: FunctionAssociation[] = [];

    b.functionTypes.forEach(type => {
        functionAssociations.push(lambdaMap.getFunctionAssociation(type));
    });

    return functionAssociations;
//    return functionAssociations.length == 0 ? undefined : functionAssociations;
}

function getLambdas(b: CFBehavior, lambdaMap: LambdaHolder): LambdaFunctionAssociation[] | undefined {
    const lambdaFunctionAssociations: LambdaFunctionAssociation[] = [];

    b.lambdaTypes.forEach(type => {
        lambdaFunctionAssociations.push(lambdaMap.getLambdaAssociation(type));
    });

    if (b.ipRestriction) {
        lambdaFunctionAssociations.push(lambdaMap.getRestriction(b.ipRestriction));
    }

    return lambdaFunctionAssociations;
//    return lambdaFunctionAssociations.length == 0 ? undefined : lambdaFunctionAssociations;
}


