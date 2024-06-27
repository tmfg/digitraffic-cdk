import { DigitrafficIntegration } from "@digitraffic/common/dist/aws/infra/api/integration";
import { DigitrafficMethodResponse } from "@digitraffic/common/dist/aws/infra/api/response";
import { DBLambdaEnvironment } from "@digitraffic/common/dist/aws/infra/stack/lambda-configs";
import { MonitoredDBFunction } from "@digitraffic/common/dist/aws/infra/stack/monitoredfunction";
import { DigitrafficRestApi } from "@digitraffic/common/dist/aws/infra/stack/rest_apis";
import { DigitrafficStack } from "@digitraffic/common/dist/aws/infra/stack/stack";
import { MediaType } from "@digitraffic/common/dist/aws/types/mediatypes";
import { IdentitySource, RequestAuthorizer, Resource } from "aws-cdk-lib/aws-apigateway";
import { ChargingNetworkProps } from "./app-props";
import { ChargingNetworkKeys } from "./keys";
import { OCPI_MODULE_CREDENTIALS, VERSION_2_1_1 } from "./model/ocpi-constants";
import {
    OcpiV2_1_1CredentialsSchema,
    OcpiV2_1_1VersionEndpointsSchema
} from "./model/ocpi/2_1_1/ocpi-2_1_1-schema";
import { OcpiVersionsSchema } from "./model/ocpi/ocpi-versions-schema";
import { ModelWithReference } from "@digitraffic/common/dist/aws/types/model-with-reference";

export class IntegrationOcpiApi {
    publicApi: DigitrafficRestApi;
    lambdaAuthorizer: RequestAuthorizer;
    ocpiResource: Resource;
    ocpiEmspResource: Resource;
    ocpiVersionsResource: Resource;
    ocpiV2_1_1_Resource: Resource;
    ocpiV2_1_1_CredentialsResource: Resource;
    ocpiVersionsResponseModel: ModelWithReference;
    ocpiV2_1_1VersionEndpointsResponseModel: ModelWithReference;
    ocpiV2_1_1CredentialsResponseModel: ModelWithReference;

    constructor(stack: DigitrafficStack) {
        this.publicApi = new DigitrafficRestApi(stack, "charge-network-ocpi", "Charge Network OCPI Api");
        this.publicApi.createUsagePlanV2("Charge network OCPI");

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

        this.createLambdaAuthorizer(stack, environment);
        this.createOcpiResources(this.publicApi);
        this.createOcpiResourcesV2_1_1(this.publicApi);

        this.createOcpiModels(this.publicApi);
        this.createOcpiModelsV2_1_1(this.publicApi);

        this.createOcpiVersionsEndpoint(stack, environment); // /ocpi/emsp/versions
        this.createOcpiVersionV2_1_1_Endpoint(stack, environment); // /ocpi/emsp/2.1.1
        this.createOcpiVersionV2_1_1_CredentialsEndpoint(stack, environment); // /ocpi/emsp/2.1.1/credentials
    }

    createOcpiResources(publicApi: DigitrafficRestApi): void {
        this.ocpiResource = publicApi.root.addResource("ocpi");
        this.ocpiEmspResource = this.ocpiResource.addResource("emsp");
        this.ocpiVersionsResource = this.ocpiEmspResource.addResource("versions"); // /ocpi/emsp/versions
    }
    // Public apis
    // Available versions
    // /ocpi/emsp/versions
    // Available endpoints for v2.1.1
    // /ocpi/emsp/2.1.1/
    // Credentials module
    // /ocpi/emsp/2.1.1/credentials
    createOcpiResourcesV2_1_1(publicApi: DigitrafficRestApi): void {
        this.ocpiV2_1_1_Resource = this.ocpiEmspResource.addResource(VERSION_2_1_1); // /ocpi/emsp/2.1.1/
        this.ocpiV2_1_1_CredentialsResource = this.ocpiV2_1_1_Resource.addResource(OCPI_MODULE_CREDENTIALS); // /ocpi/emsp/2.1.1/credentials
    }

    createOcpiModels(publicApi: DigitrafficRestApi): void {
        this.ocpiVersionsResponseModel = publicApi.addJsonModel(
            "OcpiVersionsResponseModel",
            OcpiVersionsSchema
        );
    }

    createOcpiModelsV2_1_1(publicApi: DigitrafficRestApi): void {
        this.ocpiV2_1_1VersionEndpointsResponseModel = publicApi.addJsonModel(
            "OcpiV2v1v1VersionResponseModel",
            OcpiV2_1_1VersionEndpointsSchema
        );
        this.ocpiV2_1_1CredentialsResponseModel = publicApi.addJsonModel(
            "ocpiV2v1v1CredentialsResponseModel",
            OcpiV2_1_1CredentialsSchema
        );
    }

    createOcpiVersionsEndpoint(stack: DigitrafficStack, lambdaEnvironment: DBLambdaEnvironment): void {
        const lambda = MonitoredDBFunction.create(stack, "get-ocpi-emsp-versions", lambdaEnvironment);

        const integration = new DigitrafficIntegration(lambda, MediaType.APPLICATION_JSON)
            .addContextParameter("authorizer.dtCpoId")
            .build();

        this.ocpiVersionsResource.addMethod("GET", integration, {
            authorizer: this.lambdaAuthorizer,
            apiKeyRequired: true,
            methodResponses: [
                DigitrafficMethodResponse.response200(this.ocpiVersionsResponseModel),
                DigitrafficMethodResponse.response500()
            ]
        });
    }

    createOcpiVersionV2_1_1_Endpoint(stack: DigitrafficStack, lambdaEnvironment: DBLambdaEnvironment): void {
        const lambda = MonitoredDBFunction.create(stack, "get-ocpi-emsp-2_1_1", lambdaEnvironment);

        const integration = new DigitrafficIntegration(lambda, MediaType.APPLICATION_JSON)
            .addContextParameter("authorizer.dtCpoId")
            .build();

        this.ocpiV2_1_1_Resource.addMethod("GET", integration, {
            authorizer: this.lambdaAuthorizer,
            apiKeyRequired: true,
            methodResponses: [
                DigitrafficMethodResponse.response200(this.ocpiV2_1_1VersionEndpointsResponseModel),
                DigitrafficMethodResponse.response500()
            ]
        });
    }

    createOcpiVersionV2_1_1_CredentialsEndpoint(
        stack: DigitrafficStack,
        lambdaEnvironment: DBLambdaEnvironment
    ): void {
        const lambda = MonitoredDBFunction.create(
            stack,
            "get-ocpi-emsp-2_1_1-credentials",
            lambdaEnvironment
        );

        const integration = new DigitrafficIntegration(lambda, MediaType.APPLICATION_JSON)
            .addContextParameter("authorizer.dtCpoId")
            .build();

        // No update (POST) support for now
        this.ocpiV2_1_1_CredentialsResource.addMethod("GET", integration, {
            authorizer: this.lambdaAuthorizer,
            apiKeyRequired: true,
            methodResponses: [
                DigitrafficMethodResponse.response200(this.ocpiV2_1_1CredentialsResponseModel),
                DigitrafficMethodResponse.response500()
            ]
        });
    }

    createLambdaAuthorizer(stack: DigitrafficStack, lambdaEnvironment: DBLambdaEnvironment): void {
        const authFunction = MonitoredDBFunction.create(stack, "authorizer", lambdaEnvironment, {
            timeout: 10
        });

        this.lambdaAuthorizer = new RequestAuthorizer(stack, "request-authorizer", {
            handler: authFunction,
            identitySources: [IdentitySource.header("Authorization")]
        });
    }
}
