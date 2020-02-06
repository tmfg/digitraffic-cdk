/*
    Example stack configuration interfaces
 */

declare interface Domains {
    nw2DomainName: string,
    open311DomainName: string,
    loadBalancerDomainName: string,
    fargateDomainName: string
}

declare interface Props {
    distributionName: string,
    aliasName: string,
    originPath: string,
    domains: Domains
}
