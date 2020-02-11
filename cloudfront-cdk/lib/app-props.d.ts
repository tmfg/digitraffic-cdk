/*
    Example stack configuration interfaces
 */

declare interface Domain {
    domainName: string,
    originPath: string,
    protocolPolicy?: string,
    httpPort?: number,
    httpsPort?: number,
    behaviors: string[]
}

declare interface Props {
    distributionName: string,
    environmentName: string,
    aliasNames: string[] | null,
    acmCertRef: string | null,
    domains: Domain[]
}
