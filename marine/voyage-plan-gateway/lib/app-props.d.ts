import {LambdaConfiguration} from "../../../common/stack/lambda-configs";

declare interface VoyagePlanGatewayProps extends LambdaConfiguration {
    readonly secretId: string
}
