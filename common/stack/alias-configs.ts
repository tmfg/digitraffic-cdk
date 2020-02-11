export function createAliasConfig(certRef: string, domainNames: string[]) {
    return {
        acmCertRef: certRef,
        names: domainNames
    }
}