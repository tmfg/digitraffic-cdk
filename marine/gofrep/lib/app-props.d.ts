import {LambdaConfiguration} from "digitraffic-common/stack/lambda-configs";

declare interface GofrepProps extends LambdaConfiguration {
    readonly secretId: string
}
