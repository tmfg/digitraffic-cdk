import { DatabaseCanary } from "@digitraffic/common/dist/aws/infra/canaries/database-canary";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { DigitrafficCanaryRole } from "@digitraffic/common/dist/aws/infra/canaries/canary-role";
import { MaintenanceTrackingMunicipalityEnvKeys } from "./keys";

export class Canaries {
    constructor(stack: DigitrafficStack) {
        if (stack.configuration.stackFeatures?.enableCanaries) {
            const dbRole = new DigitrafficCanaryRole(stack, "mtm-db").withDatabaseAccess();

            DatabaseCanary.createV2(
                stack,
                dbRole,
                "mtm",
                {
                    canaryEnv: {
                        [MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_NAME]: "autori-oulu"
                    }
                },
                "mtm-autori-oulu"
            );
            DatabaseCanary.createV2(
                stack,
                dbRole,
                "mtm",
                {
                    canaryEnv: {
                        [MaintenanceTrackingMunicipalityEnvKeys.DOMAIN_NAME]: "autori-kuopio"
                    }
                },
                "mtm-autori-kuopio"
            );
        }
    }
}
