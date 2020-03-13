export interface CFBehavior {
    path: string,
    cacheTtl?: number,
    queryCacheKeys?: string[],
}

export interface CFDomain {
    domainName: string,
    originPath?: string,
    protocolPolicy?: string,
    httpPort?: number,
    httpsPort?: number,
    apiKey?: string,
    behaviors?: CFBehavior[]
}

export interface Props {
    distributionName: string,
    environmentName: string,
    aliasNames: string[] | null,
    acmCertRef: string | null,
    domains: CFDomain[]
}
