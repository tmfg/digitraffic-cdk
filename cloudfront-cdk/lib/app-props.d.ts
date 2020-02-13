/*
    Example stack configuration interfaces
 */

declare interface Behavior {
    path: string,
    cacheTtl?: number,
    queryCacheKeys?: string[],
    removePath?: number
}

declare interface Domain {
    domainName: string,
    originPath?: string,
    protocolPolicy?: string,
    httpPort?: number,
    httpsPort?: number,
    apiKey?: string,
    behaviors: Behavior[]
}

declare interface Props {
    distributionName: string,
    environmentName: string,
    aliasNames: string[] | null,
    acmCertRef: string | null,
    domains: Domain[]
}
