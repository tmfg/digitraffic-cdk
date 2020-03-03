/*
    Example stack configuration interfaces
 */

export interface Behavior {
    path: string,
    cacheTtl?: number,
    queryCacheKeys?: string[],
}

export interface Domain {
    domainName: string,
    originPath?: string,
    protocolPolicy?: string,
    httpPort?: number,
    httpsPort?: number,
    apiKey?: string,
    behaviors: Behavior[]
}

export interface Props {
    distributionName: string,
    environmentName: string,
    aliasNames: string[] | null,
    acmCertRef: string | null,
    domains: Domain[]
}
