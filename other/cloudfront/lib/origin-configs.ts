import { Duration, Stack } from "aws-cdk-lib";
import {
    Behavior,
    LambdaFunctionAssociation,
    OriginAccessIdentity,
    SourceConfiguration
} from "aws-cdk-lib/aws-cloudfront";
import { CfnDistribution } from "aws-cdk-lib/aws-cloudfront/lib/cloudfront.generated";
import { FunctionAssociation } from "aws-cdk-lib/aws-cloudfront/lib/function";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { CFBehavior, CFDomain, CFOrigin, S3Domain } from "./app-props";
import { LambdaHolder } from "./lambda-holder";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";

export function createOriginConfig(
    stack: Stack,
    origin: CFOrigin,
    oai: OriginAccessIdentity | undefined,
    lambdaMap: LambdaHolder,
    secretsArn: string | undefined
): SourceConfiguration {
    if (origin instanceof S3Domain) {
        if (!oai) {
            throw new Error("OAI was undefined! OAI is needed for S3 origin");
        }

        const domainName = origin.s3Domain ?? "s3.eu-west-1.amazonaws.com";

        const bucket = Bucket.fromBucketAttributes(stack, `ImportedBucketName-${origin.s3BucketName}`, {
            bucketArn: `arn:aws:s3:::${origin.s3BucketName}`,
            bucketRegionalDomainName: `${origin.s3BucketName}.${domainName}`
        });

        if (origin.createOAI) {
            bucket.grantRead(oai);
        }

        return {
            s3OriginSource: {
                s3BucketSource: bucket,
                originAccessIdentity: oai
                //                originPath: origin.originPath,
            },
            behaviors: createBehaviors(origin.behaviors, lambdaMap, true),
        };
    } else if (origin instanceof CFDomain) {
        return {
            customOriginSource: {
                domainName: origin.domainName,
                httpPort: origin.httpPort ?? 80,
                httpsPort: origin.httpsPort ?? 443,
                originProtocolPolicy: origin.originProtocolPolicy,
                originPath: origin.originPath,
                originHeaders: createOriginHeaders(origin, secretsArn, stack),
                originReadTimeout: origin.responseTimeout
            },
            behaviors: createBehaviors(origin.behaviors, lambdaMap, false),
        };
    }

    throw new Error(`Unknown distribution type ` + origin.constructor.name);
}

function createOriginHeaders(
    domain: CFDomain,
    secretsArn: string | undefined,
    stack: Stack
): Record<string, string> {
    const headers = { ...domain.headers };

    if (domain.apiKey !== undefined) {
        headers["x-api-key"] = domain.apiKey;
    }
    if (domain.cfName !== undefined) {
        if (secretsArn === undefined) {
            throw new Error("Secrets ARN was undefined!");
        }
        const secret = Secret.fromSecretCompleteArn(stack, domain.cfName + "-secret", secretsArn);
        const cfHeaderName = secret.secretValueFromJson("cfHeaderName").toString();
        const cfHeaderValue = secret.secretValueFromJson("cfHeaderValue").toString();
        headers[cfHeaderName] = cfHeaderValue;
    }

    return headers;
}

function createBehaviors(behaviors: CFBehavior[], lambdaMap: LambdaHolder, isS3Origin: boolean): Behavior[] {
    return behaviors.map((b) => createBehavior(b, lambdaMap, b.path === "*", isS3Origin));
}

function createBehavior(
    b: CFBehavior,
    lambdaMap: LambdaHolder,
    isDefaultBehavior: boolean,
    isS3Origin: boolean
): Behavior {
    //console.info('creating behavior %s with default %d', b.path, isDefaultBehavior);
    if (isS3Origin && b.path.includes("swagger")) {
        if (b.cacheHeaders.length > 0) {
            throw new Error("Swagger origin has cache headers!");
        }
        if (b.queryCacheKeys && b.queryCacheKeys.length > 0) {
            throw new Error("Swagger origin has cache keys!" + JSON.stringify(b.queryCacheKeys));
        }
    }

    const headers = [...b.cacheHeaders];

    const forwardedValues: CfnDistribution.ForwardedValuesProperty = {
        headers,
        queryString: true,
        queryStringCacheKeys: b.queryCacheKeys
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
        lambdaFunctionAssociations: getLambdas(b, lambdaMap)
    };
}

function getCloudfrontFunctions(b: CFBehavior, lambdaMap: LambdaHolder): FunctionAssociation[] {
    const functionAssociations: FunctionAssociation[] = [];

    b.functionTypes.forEach((type) => {
        functionAssociations.push(lambdaMap.getFunctionAssociation(type));
    });

    return functionAssociations;
}

function getLambdas(b: CFBehavior, lambdaMap: LambdaHolder): LambdaFunctionAssociation[] {
    const lambdaFunctionAssociations: LambdaFunctionAssociation[] = [];

    b.lambdaTypes.forEach((type) => {
        lambdaFunctionAssociations.push(lambdaMap.getLambdaAssociation(type));
    });

    if (b.ipRestriction) {
        lambdaFunctionAssociations.push(lambdaMap.getRestriction(b.ipRestriction));
    }

    return lambdaFunctionAssociations;
}
