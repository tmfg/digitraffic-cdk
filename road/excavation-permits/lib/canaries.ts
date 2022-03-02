import {DigitrafficStack} from "digitraffic-common/aws/infra/stack/stack";
import {DigitrafficRestApi} from "digitraffic-common/aws/infra/stack/rest_apis";

export class Canaries {
    constructor(stack: DigitrafficStack, publicApi: DigitrafficRestApi) {
        if (stack.configuration.enableCanaries) {
            // NOT YET
        }
    }

}
