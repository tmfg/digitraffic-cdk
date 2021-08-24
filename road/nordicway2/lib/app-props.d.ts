import {LambdaConfiguration} from "digitraffic-common/stack/lambda-configs";

declare interface NW2Props extends LambdaConfiguration {
    integration: {
        username: string;
        password: string;
        url: string;
    }

}
