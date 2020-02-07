/*
    Example stack configuration interfaces
 */

declare interface Domain {
    domainName: string,
    originPath: string,
    behaviors: string[]
}

declare interface Props {
    distributionName: string,
    aliasNames: string[] | null,
    acmCertRef: string | null,
    domains: Domain[]
}
