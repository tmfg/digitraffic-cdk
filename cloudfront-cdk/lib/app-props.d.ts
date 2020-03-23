import {LambdaType} from "./lambda/lambda-creator";
import {AclRuleType} from "./acl/acl-creator";

export interface CFBehavior {
    path?: string,
    cacheTtl?: number,
    queryCacheKeys?: string[],
    lambdaType?: LambdaType
}

export interface CFDomain {
    s3BucketName?: string,
    domainName?: string,
    originPath?: string,
    protocolPolicy?: string,
    httpPort?: number,
    httpsPort?: number,
    apiKey?: string,
    behaviors?: CFBehavior[]
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

export interface CFProps {
    props: Props[],
    lambdaProps?: CFLambdaProps,
}

export interface CFLambdaProps {
    lambdaTypes: LambdaType[],
    lambdaParameters?: any
}
