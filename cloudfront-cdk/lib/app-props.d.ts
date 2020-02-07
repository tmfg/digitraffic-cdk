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
    aliasName: string,
    domains: Domain[]
}
