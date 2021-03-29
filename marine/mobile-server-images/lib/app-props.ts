import {LambdaConfiguration} from "../../../common/stack/lambda-configs";

export interface MobileServerProps extends LambdaConfiguration {
    readonly secretId: string;
}