export interface CFBehavior {
    path?: string,
    cacheTtl?: number,
    queryCacheKeys?: string[],
    lambdaFunction?: string
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
    domains: CFDomain[]
}
