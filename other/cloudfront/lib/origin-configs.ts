import { Duration, Stack } from "aws-cdk-lib";
import {
    Behavior,
    LambdaFunctionAssociation,
    OriginAccessIdentity,
    SourceConfiguration,
} from "aws-cdk-lib/aws-cloudfront";
import { CfnDistribution } from "aws-cdk-lib/aws-cloudfront/lib/cloudfront.generated";
import { FunctionAssociation } from "aws-cdk-lib/aws-cloudfront/lib/function";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { CFBehavior, CFDomain, CFOrigin, S3Domain } from "./app-props";
import { LambdaHolder } from "./lambda-holder";

export function createOriginConfig(
    stack: Stack,
    origin: CFOrigin,
    oai: OriginAccessIdentity | undefined,
    lambdaMap: LambdaHolder
): SourceConfiguration {
    if (origin instanceof S3Domain) {
        if (!oai) {
            throw new Error("OAI was undefined! OAI is needed for S3 origin");
        }

        const domainName = origin.s3Domain ?? "s3.eu-west-1.amazonaws.com";

        const bucket = Bucket.fromBucketAttributes(
            stack,
            `ImportedBucketName-${origin.s3BucketName}`,
            {
                bucketArn: `arn:aws:s3:::${origin.s3BucketName}`,
                bucketRegionalDomainName: `${origin.s3BucketName}.${domainName}`,
            }
        );

        if (origin.createOAI) {
            bucket.grantRead(oai);
        }

        return {
            s3OriginSource: {
                s3BucketSource: bucket,
                originAccessIdentity: oai,
                //                originPath: origin.originPath,
            },
            behaviors: createBehaviors(stack, origin.behaviors, lambdaMap),
        };
    } else if (origin instanceof CFDomain) {
        return {
            customOriginSource: {
                domainName: origin.domainName,
                httpPort: origin.httpPort ?? 80,
                httpsPort: origin.httpsPort ?? 443,
                originProtocolPolicy: origin.originProtocolPolicy,
                originPath: origin.originPath,
                originHeaders: createOriginHeaders(origin),
            },
            behaviors: createBehaviors(stack, origin.behaviors, lambdaMap),
        };
    }

    throw new Error(`Unknown distribution type ` + origin.constructor.name);
}

function createOriginHeaders(domain: CFDomain): Record<string, string> {
    const headers = { ...domain.headers };

    if (domain.apiKey !== undefined) {
        headers["x-api-key"] = domain.apiKey;
    }

    return headers;
}

function createBehaviors(
    stack: Stack,
    behaviors: CFBehavior[],
    lambdaMap: LambdaHolder
): Behavior[] {
    return behaviors.map((b) =>
        createBehavior(stack, b, lambdaMap, b.path === "*")
    );
}

function createBehavior(
    stack: Stack,
    b: CFBehavior,
    lambdaMap: LambdaHolder,
    isDefaultBehavior = false
): Behavior {
    //console.info('creating behavior %s with default %d', b.path, isDefaultBehavior);
    const headers = [...b.cacheHeaders];

    const forwardedValues: CfnDistribution.ForwardedValuesProperty = {
        headers,
        queryString: true,
        queryStringCacheKeys: b.queryCacheKeys,
    };

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

function getCloudfrontFunctions(
    b: CFBehavior,
    lambdaMap: LambdaHolder
): FunctionAssociation[] {
    const functionAssociations: FunctionAssociation[] = [];

    b.functionTypes.forEach((type) => {
        functionAssociations.push(lambdaMap.getFunctionAssociation(type));
    });

    return functionAssociations;
}

function getLambdas(
    b: CFBehavior,
    lambdaMap: LambdaHolder
): LambdaFunctionAssociation[] {
    const lambdaFunctionAssociations: LambdaFunctionAssociation[] = [];

    b.lambdaTypes.forEach((type) => {
        lambdaFunctionAssociations.push(lambdaMap.getLambdaAssociation(type));
    });

    if (b.ipRestriction) {
        lambdaFunctionAssociations.push(
            lambdaMap.getRestriction(b.ipRestriction)
        );
    }

    return lambdaFunctionAssociations;
}
