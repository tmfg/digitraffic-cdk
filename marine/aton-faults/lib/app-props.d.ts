import {LambdaConfiguration} from "digitraffic-common/lib/stack/lambda-configs";

declare interface AtonProps extends LambdaConfiguration {
    readonly integrations: Integration[]
    readonly secretId: string
    readonly clientCertificateSecretKey: string
    readonly privateKeySecretKey: string
    readonly caSecretKey: string
}

interface Integration {
    readonly domain: string,
    readonly url: string
}