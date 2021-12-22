import {LambdaType} from "./lambda/lambda-creator";
import {LambdaEdgeEventType} from "aws-cdk-lib/aws-cloudfront";
import {WafRules} from "./acl/waf-rules";
import {CloudFrontAllowedMethods} from "aws-cdk-lib/aws-cloudfront/lib/web-distribution";

export type CFBehaviorLambda = {
    lambdaType: LambdaType,
    eventType: LambdaEdgeEventType,
    lambdaParameter?: Record<string, string>
}

export type CFBehavior = {
    path: string,
    cacheTtl?: number,
    queryCacheKeys?: string[],
    allowedMethods?: CloudFrontAllowedMethods,
    viewerProtocolPolicy?: string,
    lambdas?: CFBehaviorLambda[],
    cacheHeaders?: string[],
    ipRestriction?: string
}

export type CFDomain = {
    s3BucketName?: string,
    domainName?: string,
    originPath?: string,
    originProtocolPolicy?: string,
    httpPort?: number,
    httpsPort?: number,
    apiKey?: string,
    behaviors: CFBehavior[]
}

export type Props = {
    originAccessIdentity?: boolean,
    distributionName: string,
    environmentName: string,
    aliasNames: string[] | null,
    acmCertRef: string | null,
    aclRules?: WafRules,
    domains: CFDomain[]
}

export type ElasticProps = {
    streamingProps: StreamingLogProps,
    elasticDomain: string,
    elasticArn: string,
}

export type StreamingLogProps = {
    memorySize?: number,
    batchSize?: number,
    maxBatchingWindow?: number
}

export type CFProps = {
    elasticProps: ElasticProps,
    elasticAppName: string,
    props: Props[],
    lambdaProps?: CFLambdaProps,
}

export type CFLambdaParameters = {
    weathercamDomainName?: string,
    weathercamHostName?: string,
    ipRestrictions?: {
        [key: string]: string,
    },
}

export type CFLambdaProps = {
    lambdaTypes: LambdaType[],
    lambdaParameters?: CFLambdaParameters
}
