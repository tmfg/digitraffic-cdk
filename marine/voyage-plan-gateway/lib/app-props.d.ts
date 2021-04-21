import {LambdaConfiguration} from "../../../common/stack/lambda-configs";

declare interface VoyagePlanGatewayProps extends LambdaConfiguration {
    readonly secretId: string
    // custom domain name for mutual TLS
    readonly customDomainName: string
    // certificate ARN for custom domain name
    readonly customDomainNameCertArn: string
    // bucket from where mutual TLS certificate is loaded
    readonly mutualTlsBucketName: string
    // name of certificate in S3 bucket
    readonly mutualTlsCertName: string

    // secret key for schedules access token
    readonly schedulesAccessTokenSecretKey: string
    // secret key for schedules URL
    readonly schedulesUrlSecretKey: string

    // secret key for CRL URL
    readonly crlUrlSecretKey: string
}
