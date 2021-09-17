import {LambdaConfiguration} from "digitraffic-common/stack/lambda-configs";

declare interface AtonProps extends LambdaConfiguration {
    readonly integrations: Integration[]
    readonly secretId: string
}

interface Integration {
    readonly domain: string,
    readonly url: string
}