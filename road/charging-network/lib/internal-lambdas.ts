import { DigitrafficLogSubscriptions } from "@digitraffic/common/dist/aws/infra/stack/subscription";
import { ChargingNetworkProps } from "./app-props";
import { ChargingNetworkKeys } from "./keys";
import { MonitoredFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
//import { Scheduler } from "@digitraffic/common/dist/aws/infra/scheduler";
import { DBLambdaEnvironment } from "@digitraffic/common/dist/aws/infra/stack/lambda-configs";

export class InternalLambdas {
    constructor(stack: DigitrafficStack) {
        const environment = stack.createLambdaEnvironment();
        environment[ChargingNetworkKeys.OCPI_DOMAIN_URL] = (
            stack.configuration as ChargingNetworkProps
        ).ocpiDomainUrl;
        environment[ChargingNetworkKeys.OCPI_PARTY_ID] = (
            stack.configuration as ChargingNetworkProps
        ).ocpiPartyId;
        environment[ChargingNetworkKeys.OCPI_BUSINESS_DETAILS_NAME] = (
            stack.configuration as ChargingNetworkProps
        ).ocpiBusinessDetailsName;
        environment[ChargingNetworkKeys.OCPI_BUSINESS_DETAILS_WEBSITE] = (
            stack.configuration as ChargingNetworkProps
        ).ocpiBusinessDetailsWebsite;

        const ocpiRegistrationLambda = InternalLambdas.createOcpiRegistrationLambda(stack, environment);
        const ocpiLocationsUpdateLambda = InternalLambdas.createOcpiLocationsUpdateLambda(stack, environment);
        // TODO enable later
        // Scheduler.everyHour(stack, "OcpiRegistrationPolling", ocpiRegistrationLambda);
        // Scheduler.everyHour(stack, "OcpiLocationsPolling", ocpiLocationsUpdateLambda);

        new DigitrafficLogSubscriptions(stack, ocpiRegistrationLambda, ocpiLocationsUpdateLambda);
        stack.grantSecret(ocpiRegistrationLambda, ocpiLocationsUpdateLambda);
    }

    private static createOcpiRegistrationLambda(
        stack: DigitrafficStack,
        lambdaEnvironment: DBLambdaEnvironment
    ): MonitoredFunction {
        return MonitoredFunction.createV2(stack, "ocpi-registration", lambdaEnvironment, {
            timeout: 60
        });
    }

    private static createOcpiLocationsUpdateLambda(
        stack: DigitrafficStack,
        lambdaEnvironment: DBLambdaEnvironment
    ): MonitoredFunction {
        return MonitoredFunction.createV2(stack, "ocpi-locations-update", lambdaEnvironment, {
            timeout: 60
        });
    }
}
