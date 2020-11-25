import {LambdaType} from "./lambda/lambda-creator";
import {AclRuleType} from "./acl/acl-creator";
import {LambdaEdgeEventType} from "@aws-cdk/aws-cloudfront";

export interface CFBehaviorLambda {
    lambdaType: LambdaType,
    eventType: LambdaEdgeEventType,
    lambdaParameter?: any
}

export interface CFBehavior {
    path: string,
    cacheTtl?: number,
    queryCacheKeys?: string[],
    allowedMethods?: any,
    viewerProtocolPolicy?: string,
    lambdas?: CFBehaviorLambda[],
    cacheHeaders?: string[],
    ipRestriction?: string
}

export interface CFDomain {
    s3BucketName?: string,
    domainName?: string,
    originPath?: string,
    originProtocolPolicy?: string,
    httpPort?: number,
    httpsPort?: number,
    apiKey?: string,
    behaviors: CFBehavior[]
}

export interface Props {
    originAccessIdentity?: boolean,
    distributionName: string,
    environmentName: string,
    aliasNames: string[] | null,
    acmCertRef: string | null,
    aclRules?: AclRuleType[],
    domains: CFDomain[]
}

export interface ElasticProps {
    streaming: boolean,
    elasticDomain: string,
    elasticArn: string,
}

export interface CFProps {
    elasticProps: ElasticProps,
    elasticAppName: string,
    props: Props[],
    lambdaProps?: CFLambdaProps,
}

export interface CFLambdaProps {
    lambdaTypes: LambdaType[],
    lambdaParameters?: any
}
