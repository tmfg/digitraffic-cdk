import {ViewerCertificate} from "aws-cdk-lib/aws-cloudfront/lib/web-distribution";
import {SecurityPolicyProtocol} from "aws-cdk-lib/aws-cloudfront";

// TODO: move to cloudfront
export function createViewerCertificate(acmCertificateArn: string, aliases: string[]): ViewerCertificate {
    return {
        props: {
            acmCertificateArn,
            sslSupportMethod: 'sni-only',
            minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
        },
        aliases,
    };
}
