import {LambdaConfiguration} from "../../../common/stack/lambda-configs";

declare interface AtonProps extends LambdaConfiguration {
    integrations: Integration[]
}

interface Integration {
    domain: string,
    url: string
}