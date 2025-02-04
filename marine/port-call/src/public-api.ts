import type { DigitrafficStack } from "@digitraffic/common";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";

export class PublicApi {
    readonly apiKeyId: string;
    readonly publicApi: DigitrafficRestApi;

    constructor(stack: DigitrafficStack) {
        this.publicApi = new DigitrafficRestApi(stack, "PC-public", "Port Call public API");
        this.apiKeyId = this.publicApi.createUsagePlanV2("Port Call");
    }
}
