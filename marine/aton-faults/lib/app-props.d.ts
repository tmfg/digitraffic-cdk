import {StackConfiguration} from "digitraffic-common/aws/infra/stack/stack";

declare interface AtonProps extends StackConfiguration {
    readonly integrations: Integration[]
}

interface Integration {
    readonly domain: string,
    readonly url: string
}