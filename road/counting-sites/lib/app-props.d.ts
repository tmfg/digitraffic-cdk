import {LambdaConfiguration} from "digitraffic-common/stack/lambda-configs";

declare interface AppProps extends LambdaConfiguration {
    readonly secretId: string
}