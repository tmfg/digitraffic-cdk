import {AliasConfiguration, SecurityPolicyProtocol} from '@aws-cdk/aws-cloudfront';

export function createAliasConfig(certRef: string, domainNames: string[]): AliasConfiguration {
    return {
        acmCertRef: certRef,
        names: domainNames,
        securityPolicy: SecurityPolicyProtocol.TLS_V1_1_2016
    }
}